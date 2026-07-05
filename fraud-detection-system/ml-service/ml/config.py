"""
config.py
---------
Centralized configuration for the ML pipeline.

Why centralize config?
In interviews you'll be asked "how did you avoid magic numbers / hardcoded
paths scattered across files?" -- the answer is a single source of truth
that every module imports from. This also makes the pipeline environment
agnostic: swap ARTIFACTS_DIR for an S3 path in production without touching
business logic.
"""

from pathlib import Path

# ---- Paths -----------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
REPORTS_DIR = BASE_DIR / "reports"
LOGS_DIR = BASE_DIR / "logs"

RAW_DATA_PATH = DATA_DIR / "transactions.csv"

for _dir in (ARTIFACTS_DIR, REPORTS_DIR, LOGS_DIR):
    _dir.mkdir(parents=True, exist_ok=True)

# ---- Artifact filenames -----------------------------------------------
SCALER_PATH = ARTIFACTS_DIR / "scaler.joblib"
ENCODER_PATH = ARTIFACTS_DIR / "encoder.joblib"
FEATURE_COLUMNS_PATH = ARTIFACTS_DIR / "feature_columns.joblib"
XGB_MODEL_PATH = ARTIFACTS_DIR / "xgb_model.joblib"
ISOLATION_FOREST_PATH = ARTIFACTS_DIR / "isolation_forest.joblib"
METADATA_PATH = ARTIFACTS_DIR / "metadata.joblib"

# ---- Feature definitions ----------------------------------------------
TARGET_COLUMN = "is_fraud"
ID_COLUMN = "transaction_id"

NUMERIC_FEATURES = [
    "amount",
    "hour_of_day",
    "day_of_week",
    "is_foreign_transaction",
    "distance_from_home_km",
    "num_transactions_last_24h",
    "avg_transaction_amount_30d",
    "account_age_days",
    "is_new_device",
    "card_present",
]

CATEGORICAL_FEATURES = [
    "merchant_category",
    "country",
    "device_type",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# ---- Model hyperparameters ---------------------------------------------
RANDOM_STATE = 42
TEST_SIZE = 0.2

ISOLATION_FOREST_PARAMS = {
    "n_estimators": 200,
    "contamination": 0.025,
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

XGBOOST_PARAMS = {
    "n_estimators": 300,
    "max_depth": 5,
    "learning_rate": 0.08,
    "subsample": 0.85,
    "colsample_bytree": 0.85,
    "eval_metric": "aucpr",
    "random_state": RANDOM_STATE,
    "n_jobs": -1,
}

# ---- Risk score thresholds ---------------------------------------------
# Used by predict.py / Flask service to translate a probability into a
# human-friendly risk bucket. Risk score is probability * 100, rounded.
RISK_THRESHOLDS = {
    "low": (0, 30),
    "medium": (30, 60),
    "high": (60, 85),
    "critical": (85, 101),
}

MODEL_VERSION = "1.0.0"
