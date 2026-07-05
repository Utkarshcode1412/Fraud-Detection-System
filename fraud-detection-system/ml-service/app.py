"""
app.py
------
Flask application entrypoint / composition root.

Key production decision: models are loaded ONCE at startup (via
ml.predict.load_all_artifacts()), not on every request. Loading a
joblib-serialized XGBoost model from disk takes tens of milliseconds --
doing that per-request would tank throughput and add unnecessary latency
to every /predict call.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from routes.predict_routes import predict_bp
from ml.predict import load_all_artifacts
from ml.logger import get_logger

logger = get_logger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins=Config.CORS_ORIGINS)

    # Warm the model cache at startup so the first real request isn't slow.
    logger.info("Loading ML artifacts at startup...")
    load_all_artifacts()

    app.register_blueprint(predict_bp)

    @app.route("/", methods=["GET"])
    def index():
        return jsonify({
            "service": "Fraud Detection ML Service",
            "status": "running",
            "endpoints": ["/health", "/model-info", "/predict"],
        })

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.exception("Unhandled server error")
        return jsonify({"error": "Internal server error"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
