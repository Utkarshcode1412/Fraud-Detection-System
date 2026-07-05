-- =====================================================================
-- Fraud Detection System — PostgreSQL Schema
-- =====================================================================
-- Design notes (interview-relevant):
--  * Normalized to 3NF: users, admins, transactions, fraud_predictions,
--    and alerts are separate tables rather than one giant flat table.
--    This avoids update anomalies (e.g. changing a user's email in 10k
--    transaction rows) and lets each table evolve independently.
--  * fraud_predictions is 1:1 with transactions but kept SEPARATE from it.
--    Rationale: transactions are immutable financial records; predictions
--    are a mutable ML artifact that could be re-scored by a newer model
--    version later. Mixing them would mean re-writing financial rows
--    every time the model changes.
--  * Alerts is a downstream table generated FROM predictions that exceed
--    a risk threshold — this models a real analyst workflow (not every
--    prediction becomes an alert; only ones above a bar do).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- USERS  (bank customers / cardholders)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    home_country    CHAR(2) NOT NULL,
    home_latitude   DECIMAL(9,6),
    home_longitude  DECIMAL(9,6),
    account_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------------------------------------------------------------------
-- ADMINS  (fraud analysts / platform admins — separate auth domain)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    admin_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,      -- bcrypt hash, never plaintext
    role            VARCHAR(20) NOT NULL DEFAULT 'analyst'
                    CHECK (role IN ('analyst', 'senior_analyst', 'admin')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- ---------------------------------------------------------------------
-- TRANSACTIONS  (immutable financial event log)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount               DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency             CHAR(3) NOT NULL DEFAULT 'USD',
    merchant_name        VARCHAR(150),
    merchant_category    VARCHAR(50) NOT NULL,
    country              CHAR(2) NOT NULL,
    device_type          VARCHAR(30) NOT NULL,
    ip_address           INET,
    latitude             DECIMAL(9,6),
    longitude            DECIMAL(9,6),
    distance_from_home_km DECIMAL(10,2) DEFAULT 0,
    is_foreign_transaction BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_device        BOOLEAN NOT NULL DEFAULT FALSE,
    card_present          BOOLEAN NOT NULL DEFAULT TRUE,
    transaction_time     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions(transaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_country ON transactions(country);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(merchant_category);

-- ---------------------------------------------------------------------
-- FRAUD_PREDICTIONS  (ML output — 1:1 with transactions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fraud_predictions (
    prediction_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id     UUID NOT NULL UNIQUE REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    is_fraud           BOOLEAN NOT NULL,
    probability         DECIMAL(6,5) NOT NULL CHECK (probability BETWEEN 0 AND 1),
    anomaly_score       DECIMAL(6,5) CHECK (anomaly_score BETWEEN 0 AND 1),
    risk_score          DECIMAL(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level          VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    confidence          DECIMAL(5,3),
    reasons             JSONB NOT NULL DEFAULT '[]',   -- explainability payload
    model_version        VARCHAR(20) NOT NULL,
    predicted_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predictions_risk_level ON fraud_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_is_fraud ON fraud_predictions(is_fraud);
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_at ON fraud_predictions(predicted_at DESC);

-- ---------------------------------------------------------------------
-- ALERTS  (analyst investigation workflow)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id       UUID NOT NULL REFERENCES fraud_predictions(prediction_id) ON DELETE CASCADE,
    transaction_id       UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    status               VARCHAR(20) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved')),
    priority             VARCHAR(10) NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_admin_id     UUID REFERENCES admins(admin_id) ON DELETE SET NULL,
    analyst_notes         TEXT,
    resolved_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_admin ON alerts(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- ---------------------------------------------------------------------
-- Auto-update `updated_at` columns
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
