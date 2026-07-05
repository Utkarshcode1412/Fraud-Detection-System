"""
predict_routes.py
------------------
All HTTP route handlers for the ML service, registered as a Blueprint so
app.py stays a thin composition root.
"""

from flask import Blueprint, request, jsonify, current_app

from services.prediction_service import get_prediction, get_batch_predictions, get_model_info
from utils.validators import validate_transaction_payload, ValidationError

predict_bp = Blueprint("predict", __name__)


def _check_internal_auth():
    """Verifies the shared-secret header sent by the Node backend.
    Returns None if OK, or a (response, status) tuple if unauthorized."""
    api_key = request.headers.get("X-Internal-Api-Key")
    if api_key != current_app.config["INTERNAL_API_KEY"]:
        return jsonify({"error": "Unauthorized: invalid or missing internal API key"}), 401
    return None


@predict_bp.route("/predict", methods=["POST"])
def predict():
    auth_error = _check_internal_auth()
    if auth_error:
        return auth_error

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    try:
        # Support both single-transaction and batch requests
        if isinstance(payload, dict) and "transactions" in payload:
            for tx in payload["transactions"]:
                validate_transaction_payload(tx)
            results = get_batch_predictions(payload["transactions"])
            return jsonify({"predictions": results}), 200
        else:
            validate_transaction_payload(payload)
            result = get_prediction(payload)
            return jsonify(result), 200

    except ValidationError as e:
        return jsonify({"error": e.message, "field": e.field}), 400
    except Exception as e:
        current_app.logger.exception("Unexpected error during prediction")
        return jsonify({"error": "Internal prediction error", "detail": str(e)}), 500


@predict_bp.route("/model-info", methods=["GET"])
def model_info():
    try:
        info = get_model_info()
        return jsonify(info), 200
    except Exception as e:
        current_app.logger.exception("Failed to load model info")
        return jsonify({"error": "Could not retrieve model info", "detail": str(e)}), 500
