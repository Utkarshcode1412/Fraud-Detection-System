"""
config.py (Flask service level)
--------------------------------
Separate from ml/config.py on purpose: ml/config.py configures the
ML pipeline itself (paths, hyperparameters), while this file configures
the web service around it (host, port, secrets). Keeping them separate
means someone tuning model hyperparameters never touches deployment
config, and vice versa -- another Single Responsibility split.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    HOST = os.getenv("FLASK_HOST", "0.0.0.0")
    PORT = int(os.getenv("FLASK_PORT", 5001))
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Simple shared-secret auth between Node backend <-> Flask service.
    # The frontend never talks to Flask directly, so this is an
    # internal service-to-service credential, not a user-facing one.
    INTERNAL_API_KEY = os.getenv("ML_SERVICE_API_KEY", "dev-internal-key-change-me")

    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5000").split(",")
