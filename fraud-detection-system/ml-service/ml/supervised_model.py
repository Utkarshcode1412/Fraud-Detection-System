"""
supervised_model.py
---------------------
XGBoost classifier -- the primary SUPERVISED fraud model, trained on
historical labeled transactions (is_fraud = 0/1).

Why XGBoost over e.g. logistic regression or a neural net?
- Handles non-linear feature interactions (e.g. "high amount AND foreign
  AND new device" is far riskier than any single factor) without manual
  feature crossing.
- Native support for imbalanced classes via scale_pos_weight.
- Fast inference (<10ms per row), which matters for a synchronous
  Flask endpoint sitting in a request path.
- Built-in feature importance -- directly supports the "explainable
  predictions" requirement.
"""

import joblib
import numpy as np
from xgboost import XGBClassifier

from ml.config import XGBOOST_PARAMS, XGB_MODEL_PATH
from ml.logger import get_logger

logger = get_logger(__name__)


def train_xgboost(X_train, y_train) -> XGBClassifier:
    # scale_pos_weight compensates for class imbalance (fraud is ~2.5% of
    # data) by penalizing missed-fraud errors more heavily than
    # false-positives during training.
    fraud_count = y_train.sum()
    legit_count = len(y_train) - fraud_count
    scale_pos_weight = legit_count / max(fraud_count, 1)

    params = {**XGBOOST_PARAMS, "scale_pos_weight": scale_pos_weight}
    logger.info(f"Training XGBoost with scale_pos_weight={scale_pos_weight:.2f}")

    model = XGBClassifier(**params)
    model.fit(X_train, y_train)

    joblib.dump(model, XGB_MODEL_PATH)
    logger.info(f"Saved XGBoost model -> {XGB_MODEL_PATH}")
    return model


def predict_proba(model: XGBClassifier, X) -> np.ndarray:
    """Returns P(fraud) for each row."""
    return model.predict_proba(X)[:, 1]


def load_xgboost() -> XGBClassifier:
    return joblib.load(XGB_MODEL_PATH)


def get_feature_importance(model: XGBClassifier, feature_columns: list, top_n: int = 10):
    importances = model.feature_importances_
    pairs = sorted(zip(feature_columns, importances), key=lambda p: p[1], reverse=True)
    return pairs[:top_n]
