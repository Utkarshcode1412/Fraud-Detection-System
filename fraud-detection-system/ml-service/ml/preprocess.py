"""
preprocess.py
-------------
All data cleaning / feature-engineering logic lives here, separate from
model training (supervised_model.py) and evaluation (evaluate.py).

Why separate this out?
1. Single Responsibility Principle -- this module's only job is turning
   raw transaction rows into a model-ready feature matrix.
2. The exact same transform must run at both TRAIN time and PREDICT time.
   If preprocessing logic were duplicated in train.py and predict.py, it
   would eventually drift out of sync -- a classic source of "training/
   serving skew" bugs in production ML systems.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from ml.config import (
    NUMERIC_FEATURES, CATEGORICAL_FEATURES, TARGET_COLUMN,
    SCALER_PATH, ENCODER_PATH, FEATURE_COLUMNS_PATH,
)
from ml.logger import get_logger

logger = get_logger(__name__)


def load_raw_data(path) -> pd.DataFrame:
    logger.info(f"Loading raw data from {path}")
    df = pd.read_csv(path)
    logger.info(f"Loaded {len(df)} rows, {df[TARGET_COLUMN].sum()} fraud cases")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Basic hygiene: drop duplicates, handle obvious nulls, clip outliers."""
    before = len(df)
    df = df.drop_duplicates()
    df = df.dropna(subset=NUMERIC_FEATURES + CATEGORICAL_FEATURES + [TARGET_COLUMN])

    # Clip absurd values instead of dropping rows -- in production, dropping
    # rows on a live transaction stream would mean silently failing to score
    # some transactions, which is worse than a slightly clipped feature.
    df["amount"] = df["amount"].clip(lower=0, upper=df["amount"].quantile(0.999))
    df["distance_from_home_km"] = df["distance_from_home_km"].clip(lower=0)

    logger.info(f"Cleaned data: {before} -> {len(df)} rows")
    return df


def fit_transformers(df: pd.DataFrame):
    """Fits StandardScaler + OneHotEncoder on training data and persists them."""
    scaler = StandardScaler()
    scaler.fit(df[NUMERIC_FEATURES])

    encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    encoder.fit(df[CATEGORICAL_FEATURES])

    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    logger.info(f"Saved scaler -> {SCALER_PATH}")
    logger.info(f"Saved encoder -> {ENCODER_PATH}")

    return scaler, encoder


def transform(df: pd.DataFrame, scaler: StandardScaler, encoder: OneHotEncoder,
              fit_columns: bool = False) -> pd.DataFrame:
    """
    Applies a fitted scaler + encoder to raw feature columns and returns a
    single model-ready DataFrame. `fit_columns=True` also persists the final
    ordered column list so predict.py can guarantee identical column order
    at inference time (XGBoost is sensitive to column order/count).
    """
    scaled = scaler.transform(df[NUMERIC_FEATURES])
    scaled_df = pd.DataFrame(scaled, columns=NUMERIC_FEATURES, index=df.index)

    encoded = encoder.transform(df[CATEGORICAL_FEATURES])
    encoded_cols = encoder.get_feature_names_out(CATEGORICAL_FEATURES)
    encoded_df = pd.DataFrame(encoded, columns=encoded_cols, index=df.index)

    features = pd.concat([scaled_df, encoded_df], axis=1)

    if fit_columns:
        joblib.dump(list(features.columns), FEATURE_COLUMNS_PATH)
        logger.info(f"Saved {len(features.columns)} feature columns -> {FEATURE_COLUMNS_PATH}")

    return features


def load_transformers():
    scaler = joblib.load(SCALER_PATH)
    encoder = joblib.load(ENCODER_PATH)
    feature_columns = joblib.load(FEATURE_COLUMNS_PATH)
    return scaler, encoder, feature_columns


def align_columns(features: pd.DataFrame, feature_columns: list) -> pd.DataFrame:
    """Ensures inference-time features have exactly the columns (and order)
    the model was trained on -- filling any missing one-hot column with 0."""
    return features.reindex(columns=feature_columns, fill_value=0)
