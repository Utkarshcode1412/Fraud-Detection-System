"""
prediction_service.py
----------------------
Thin service layer between Flask routes and the ml/ package. Routes
should stay "dumb" (parse request, call service, return response) --
business logic belongs here so it's testable without spinning up Flask.
"""

from ml.predict import predict_single, predict_batch
from ml.config import METADATA_PATH
import joblib


def get_prediction(transaction: dict) -> dict:
    return predict_single(transaction)


def get_batch_predictions(transactions: list) -> list:
    return predict_batch(transactions)


def get_model_info() -> dict:
    metadata = joblib.load(METADATA_PATH)
    return metadata
