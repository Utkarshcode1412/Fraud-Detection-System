"""
train.py
--------
Orchestrates the full training pipeline. This is the ONLY file that should
be run directly to (re)train the models -- every other ml/ module is a
library used by this script (and by predict.py at inference time).

Pipeline steps:
1. Load + clean raw data
2. Train/test split (stratified, because fraud is rare)
3. Fit + persist scaler/encoder on TRAIN split only (never fit on test data
   -- that would leak information and give an unrealistically good score)
4. Train Isolation Forest (unsupervised) on train features
5. Train XGBoost (supervised) on train features + labels
6. Evaluate on held-out test split, generate charts + metrics.json
7. Persist metadata (versions, timestamp, feature list) for the Flask
   service to expose via GET /model-info
"""

import time
import joblib
from sklearn.model_selection import train_test_split

from ml.config import (
    RAW_DATA_PATH, TARGET_COLUMN, TEST_SIZE, RANDOM_STATE,
    METADATA_PATH, MODEL_VERSION,
)
from ml.preprocess import load_raw_data, clean_data, fit_transformers, transform
from ml.anomaly_detector import train_isolation_forest
from ml.supervised_model import train_xgboost, predict_proba, get_feature_importance
from ml.evaluate import evaluate_model
from ml.logger import get_logger

logger = get_logger(__name__)


def run_training():
    start = time.time()
    logger.info("===== Fraud Detection Training Pipeline: START =====")

    # 1. Load + clean
    df = load_raw_data(RAW_DATA_PATH)
    df = clean_data(df)

    # 2. Stratified split -- stratify=y keeps the ~2.5% fraud ratio
    # consistent between train/test, otherwise a random split could
    # accidentally starve the test set of fraud examples.
    X_raw = df.drop(columns=[TARGET_COLUMN, "transaction_id"])
    y = df[TARGET_COLUMN]
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    logger.info(f"Train: {len(X_train_raw)} rows | Test: {len(X_test_raw)} rows")

    # 3. Fit transformers on TRAIN ONLY, then transform both splits
    scaler, encoder = fit_transformers(X_train_raw)
    X_train = transform(X_train_raw, scaler, encoder, fit_columns=True)
    X_test = transform(X_test_raw, scaler, encoder, fit_columns=False)

    feature_columns = list(X_train.columns)
    X_test = X_test.reindex(columns=feature_columns, fill_value=0)

    # 4. Unsupervised anomaly detector
    train_isolation_forest(X_train)

    # 5. Supervised classifier
    xgb_model = train_xgboost(X_train, y_train)

    # 6. Evaluate
    y_proba = predict_proba(xgb_model, X_test)
    y_pred = (y_proba >= 0.5).astype(int)
    importance = get_feature_importance(xgb_model, feature_columns)
    metrics = evaluate_model(y_test, y_pred, y_proba, feature_importance=importance)

    # 7. Persist metadata for the Flask /model-info endpoint
    metadata = {
        "model_version": MODEL_VERSION,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "n_train_rows": len(X_train_raw),
        "n_test_rows": len(X_test_raw),
        "fraud_rate_train": float(y_train.mean()),
        "feature_count": len(feature_columns),
        "roc_auc": metrics["roc_auc"],
        "pr_auc": metrics["pr_auc"],
        "top_features": [f for f, _ in importance],
    }
    joblib.dump(metadata, METADATA_PATH)
    logger.info(f"Saved metadata -> {METADATA_PATH}")

    elapsed = time.time() - start
    logger.info(f"===== Training Pipeline: COMPLETE in {elapsed:.1f}s =====")
    return metadata


if __name__ == "__main__":
    run_training()
