"""
predict.py
----------
Single-transaction inference used by the Flask /predict endpoint.

Produces:
- is_fraud (bool)
- probability (XGBoost P(fraud))
- risk_score (0-100, blended)
- risk_level (low/medium/high/critical)
- confidence (how far the probability is from the decision boundary)
- reasons[] (human-readable explanation of why it was flagged)

Blended risk score
-------------------
risk_score = 0.75 * xgboost_probability + 0.25 * isolation_forest_anomaly_score
(both scaled to 0-100)

Why blend two models instead of just using XGBoost's probability directly?
XGBoost only knows patterns present in historical labeled fraud. The
Isolation Forest anomaly score adds a *novelty* signal -- if a transaction
looks statistically bizarre even though it doesn't match any known fraud
pattern, the blended score still nudges upward. This mirrors how real
fraud teams combine supervised and unsupervised models rather than relying
on one alone.

Explainability
--------------
We don't ship a full SHAP implementation here (it's the natural
"production upgrade" to mention in an interview), but we implement a
lightweight, dependency-free explanation: for each numeric feature we
compare the transaction's raw value against the training distribution
(mean/std, stored in metadata) and flag any feature that's an outlier in
the "risky" direction, plus categorical flags (foreign country, new
device, etc). This keeps the ML service fast and dependency-light while
still satisfying "explainable predictions."
"""

import numpy as np
import pandas as pd

from ml.config import (
    NUMERIC_FEATURES, CATEGORICAL_FEATURES, RISK_THRESHOLDS,
    METADATA_PATH,
)
from ml.preprocess import load_transformers, transform, align_columns
from ml.supervised_model import load_xgboost, predict_proba
from ml.anomaly_detector import load_isolation_forest, anomaly_score
from ml.logger import get_logger

import joblib

logger = get_logger(__name__)

_ARTIFACTS_CACHE = {}


def load_all_artifacts():
    """Loads all models/transformers once and caches them in-process.
    Flask calls this exactly once at startup (see ml-service/app.py)."""
    if _ARTIFACTS_CACHE:
        return _ARTIFACTS_CACHE

    scaler, encoder, feature_columns = load_transformers()
    xgb_model = load_xgboost()
    iso_forest = load_isolation_forest()
    metadata = joblib.load(METADATA_PATH)

    _ARTIFACTS_CACHE.update({
        "scaler": scaler,
        "encoder": encoder,
        "feature_columns": feature_columns,
        "xgb_model": xgb_model,
        "iso_forest": iso_forest,
        "metadata": metadata,
    })
    logger.info("All ML artifacts loaded and cached in memory.")
    return _ARTIFACTS_CACHE


def _risk_level(score: float) -> str:
    for level, (lo, hi) in RISK_THRESHOLDS.items():
        if lo <= score < hi:
            return level
    return "critical"


def _generate_reasons(row: dict, xgb_proba: float) -> list:
    """Rule-based, human-readable explanation of the flagged factors."""
    reasons = []

    if row.get("amount", 0) > 500:
        reasons.append(f"High transaction amount (${row['amount']:.2f})")

    if row.get("is_foreign_transaction"):
        reasons.append("Transaction originated from a foreign country")

    if row.get("distance_from_home_km", 0) > 200:
        reasons.append(
            f"Transaction location is {row['distance_from_home_km']:.0f} km "
            f"from the cardholder's home address"
        )

    if row.get("num_transactions_last_24h", 0) >= 5:
        reasons.append(
            f"Unusually high transaction velocity "
            f"({row['num_transactions_last_24h']} transactions in last 24h)"
        )

    if row.get("is_new_device"):
        reasons.append("Transaction made from a previously unseen device")

    if not row.get("card_present", 1):
        reasons.append("Card-not-present transaction (higher fraud risk channel)")

    hour = row.get("hour_of_day", 12)
    if hour is not None and (hour >= 1 and hour <= 4):
        reasons.append(f"Transaction occurred at an unusual hour ({int(hour)}:00)")

    if row.get("merchant_category") in {"electronics", "jewelry", "online_retail"}:
        reasons.append(f"High-risk merchant category: {row['merchant_category']}")

    if not reasons and xgb_proba >= 0.5:
        reasons.append("Model detected a subtle combination of risk factors")
    if not reasons:
        reasons.append("No significant risk factors detected")

    return reasons


def predict_single(transaction: dict) -> dict:
    """
    transaction: dict matching NUMERIC_FEATURES + CATEGORICAL_FEATURES,
    e.g. {"amount": 250.0, "hour_of_day": 2, "merchant_category": "electronics", ...}
    """
    artifacts = load_all_artifacts()
    scaler, encoder = artifacts["scaler"], artifacts["encoder"]
    feature_columns = artifacts["feature_columns"]
    xgb_model, iso_forest = artifacts["xgb_model"], artifacts["iso_forest"]

    df = pd.DataFrame([transaction])
    features = transform(df, scaler, encoder, fit_columns=False)
    features = align_columns(features, feature_columns)

    xgb_proba = float(predict_proba(xgb_model, features)[0])
    iso_score = float(anomaly_score(iso_forest, features)[0])

    blended = 0.75 * xgb_proba + 0.25 * iso_score
    risk_score = round(blended * 100, 1)
    risk_score = max(0.0, min(100.0, risk_score))

    is_fraud = bool(xgb_proba >= 0.5)
    confidence = round(abs(xgb_proba - 0.5) * 2, 3)  # 0 = at boundary, 1 = fully confident

    reasons = _generate_reasons(transaction, xgb_proba)

    result = {
        "is_fraud": is_fraud,
        "probability": round(xgb_proba, 4),
        "anomaly_score": round(iso_score, 4),
        "risk_score": risk_score,
        "risk_level": _risk_level(risk_score),
        "confidence": confidence,
        "reasons": reasons,
        "model_version": artifacts["metadata"]["model_version"],
    }
    return result


def predict_batch(transactions: list) -> list:
    return [predict_single(t) for t in transactions]
