"""
validators.py
--------------
Input validation for the /predict endpoint. We validate here rather than
trusting the Node backend blindly -- defense in depth. If Node has a bug
and forwards a malformed payload, Flask should fail with a clear 400
instead of throwing an unhandled 500 deep inside sklearn/xgboost.
"""

from ml.config import NUMERIC_FEATURES, CATEGORICAL_FEATURES

VALID_CATEGORIES = {
    "merchant_category": {
        "grocery", "electronics", "travel", "restaurant", "fuel",
        "online_retail", "utilities", "entertainment", "healthcare", "jewelry",
    },
    "country": {"US", "GB", "IN", "CA", "AU", "DE", "FR", "NG", "BR", "SG"},
    "device_type": {"mobile_app", "web_chrome", "web_safari", "pos_terminal", "atm"},
}


class ValidationError(Exception):
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(message)


def validate_transaction_payload(payload: dict):
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object")

    missing = [f for f in NUMERIC_FEATURES + CATEGORICAL_FEATURES if f not in payload]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}")

    for field in NUMERIC_FEATURES:
        value = payload[field]
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValidationError(f"Field '{field}' must be numeric", field=field)
        if value < 0:
            raise ValidationError(f"Field '{field}' cannot be negative", field=field)

    if payload["amount"] > 1_000_000:
        raise ValidationError("Field 'amount' exceeds maximum allowed value", field="amount")

    if not (0 <= payload["hour_of_day"] <= 23):
        raise ValidationError("Field 'hour_of_day' must be between 0 and 23", field="hour_of_day")

    if not (0 <= payload["day_of_week"] <= 6):
        raise ValidationError("Field 'day_of_week' must be between 0 and 6", field="day_of_week")

    for field, allowed in VALID_CATEGORIES.items():
        value = payload.get(field)
        if value not in allowed:
            raise ValidationError(
                f"Field '{field}' must be one of {sorted(allowed)}, got '{value}'",
                field=field,
            )

    return True
