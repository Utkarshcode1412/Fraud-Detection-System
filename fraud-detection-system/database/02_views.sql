-- =====================================================================
-- Views — precomputed aggregations the dashboard reads from directly.
-- Views keep aggregation logic in the DB (single source of truth) rather
-- than duplicated across every backend endpoint that needs similar stats.
-- =====================================================================

-- Full transaction detail joined with its prediction — the "master row"
-- almost every dashboard table/list endpoint will select from.
CREATE OR REPLACE VIEW v_transaction_details AS
SELECT
    t.transaction_id,
    t.user_id,
    u.full_name        AS user_name,
    u.email             AS user_email,
    t.amount,
    t.currency,
    t.merchant_name,
    t.merchant_category,
    t.country,
    t.device_type,
    t.is_foreign_transaction,
    t.is_new_device,
    t.card_present,
    t.transaction_time,
    p.is_fraud,
    p.probability,
    p.risk_score,
    p.risk_level,
    p.confidence,
    p.reasons,
    p.model_version,
    a.alert_id,
    a.status            AS alert_status,
    a.priority           AS alert_priority
FROM transactions t
JOIN users u ON u.user_id = t.user_id
LEFT JOIN fraud_predictions p ON p.transaction_id = t.transaction_id
LEFT JOIN alerts a ON a.transaction_id = t.transaction_id;

-- Daily fraud trend — powers the "Fraud Trend" chart on the dashboard.
CREATE OR REPLACE VIEW v_daily_fraud_trend AS
SELECT
    date_trunc('day', t.transaction_time)::date AS day,
    COUNT(*)                                     AS total_transactions,
    COUNT(*) FILTER (WHERE p.is_fraud)            AS fraud_transactions,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE p.is_fraud) / NULLIF(COUNT(*), 0), 2
    ) AS fraud_rate_pct
FROM transactions t
LEFT JOIN fraud_predictions p ON p.transaction_id = t.transaction_id
GROUP BY 1
ORDER BY 1;

-- Risk level distribution — powers the "Risk Distribution" pie/bar chart.
CREATE OR REPLACE VIEW v_risk_distribution AS
SELECT
    risk_level,
    COUNT(*) AS count
FROM fraud_predictions
GROUP BY risk_level;

-- Top fraud locations — powers "Top Fraud Locations".
CREATE OR REPLACE VIEW v_top_fraud_locations AS
SELECT
    t.country,
    COUNT(*) AS fraud_count,
    ROUND(AVG(p.risk_score), 2) AS avg_risk_score
FROM transactions t
JOIN fraud_predictions p ON p.transaction_id = t.transaction_id
WHERE p.is_fraud = TRUE
GROUP BY t.country
ORDER BY fraud_count DESC;

-- Open alert queue for the analyst investigation workflow.
CREATE OR REPLACE VIEW v_open_alerts AS
SELECT
    a.alert_id,
    a.status,
    a.priority,
    a.created_at,
    t.transaction_id,
    t.amount,
    t.merchant_category,
    t.country,
    u.full_name AS user_name,
    p.risk_score,
    p.risk_level,
    p.reasons,
    ad.full_name AS assigned_to
FROM alerts a
JOIN transactions t ON t.transaction_id = a.transaction_id
JOIN fraud_predictions p ON p.prediction_id = a.prediction_id
JOIN users u ON u.user_id = t.user_id
LEFT JOIN admins ad ON ad.admin_id = a.assigned_admin_id
WHERE a.status IN ('open', 'investigating')
ORDER BY p.risk_score DESC, a.created_at DESC;
