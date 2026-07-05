"""
anomaly_detector.py
--------------------
Isolation Forest -- an UNSUPERVISED model that scores how "abnormal" a
transaction looks, without ever being told what fraud looks like.

Why include this alongside a supervised XGBoost model?
In real fraud systems, labels are noisy and lag reality: a fraud case
might not be confirmed by an analyst (or a chargeback) for weeks. New
fraud *patterns* (e.g. a novel scam ring) won't resemble any fraud the
supervised model was trained on, so it can miss them entirely.
Isolation Forest catches statistical outliers regardless of whether
they match a known fraud pattern -- it's a complementary signal, not a
replacement. We combine both into a blended risk score in predict.py.
"""

import joblib
from sklearn.ensemble import IsolationForest

from ml.config import ISOLATION_FOREST_PARAMS, ISOLATION_FOREST_PATH
from ml.logger import get_logger

logger = get_logger(__name__)


def train_isolation_forest(X_train) -> IsolationForest:
    logger.info(f"Training IsolationForest with params: {ISOLATION_FOREST_PARAMS}")
    model = IsolationForest(**ISOLATION_FOREST_PARAMS)
    model.fit(X_train)
    joblib.dump(model, ISOLATION_FOREST_PATH)
    logger.info(f"Saved IsolationForest -> {ISOLATION_FOREST_PATH}")
    return model


def anomaly_score(model: IsolationForest, X) -> "list[float]":
    """
    Returns a normalized anomaly score in [0, 1] where 1 = most anomalous.
    sklearn's decision_function returns higher = more normal, so we invert
    and min-max scale it to make it intuitive for downstream consumers.
    """
    raw = model.decision_function(X)  # higher = more normal
    inverted = -raw  # higher = more anomalous
    lo, hi = inverted.min(), inverted.max()
    if hi - lo == 0:
        return [0.0] * len(inverted)
    return list((inverted - lo) / (hi - lo))


def load_isolation_forest() -> IsolationForest:
    return joblib.load(ISOLATION_FOREST_PATH)
