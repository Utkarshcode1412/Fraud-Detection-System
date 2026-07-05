"""
evaluate.py
-----------
Generates evaluation artifacts every fintech interviewer will ask about:
ROC curve, classification report, confusion matrix, feature importance.

Note on metric choice: with ~2.5% fraud prevalence, accuracy is a useless
metric (predicting "never fraud" gets you 97.5% accuracy). We report
precision/recall/F1 and PR-AUC/ROC-AUC instead, and log *why* in comments
below, because this is one of the most common fraud-detection interview
questions.
"""

import json
import numpy as np
import matplotlib
matplotlib.use("Agg")  # headless rendering -- no display in a server/CI env
import matplotlib.pyplot as plt

from sklearn.metrics import (
    roc_curve, roc_auc_score, precision_recall_curve, auc,
    classification_report, confusion_matrix,
)

from ml.config import REPORTS_DIR
from ml.logger import get_logger

logger = get_logger(__name__)


def evaluate_model(y_true, y_pred, y_proba, feature_importance=None):
    metrics = {}

    roc_auc = roc_auc_score(y_true, y_proba)
    precision, recall, _ = precision_recall_curve(y_true, y_proba)
    pr_auc = auc(recall, precision)

    metrics["roc_auc"] = float(roc_auc)
    metrics["pr_auc"] = float(pr_auc)
    metrics["classification_report"] = classification_report(y_true, y_pred, output_dict=True)

    logger.info(f"ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f}")
    logger.info("\n" + classification_report(y_true, y_pred))

    _plot_roc_curve(y_true, y_proba)
    _plot_confusion_matrix(y_true, y_pred)
    if feature_importance:
        _plot_feature_importance(feature_importance)

    with open(REPORTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"Saved metrics.json -> {REPORTS_DIR / 'metrics.json'}")

    return metrics


def _plot_roc_curve(y_true, y_proba):
    fpr, tpr, _ = roc_curve(y_true, y_proba)
    auc_score = roc_auc_score(y_true, y_proba)

    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"XGBoost (AUC = {auc_score:.3f})", color="#2563eb", linewidth=2)
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Random baseline")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve — Fraud Detection Model")
    plt.legend(loc="lower right")
    plt.tight_layout()
    path = REPORTS_DIR / "roc_curve.png"
    plt.savefig(path, dpi=150)
    plt.close()
    logger.info(f"Saved ROC curve -> {path}")


def _plot_confusion_matrix(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(5, 4.5))
    plt.imshow(cm, cmap="Blues")
    plt.title("Confusion Matrix")
    plt.colorbar()
    tick_marks = [0, 1]
    plt.xticks(tick_marks, ["Legit", "Fraud"])
    plt.yticks(tick_marks, ["Legit", "Fraud"])
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, str(cm[i, j]), ha="center", va="center",
                      color="white" if cm[i, j] > cm.max() / 2 else "black")
    plt.tight_layout()
    path = REPORTS_DIR / "confusion_matrix.png"
    plt.savefig(path, dpi=150)
    plt.close()
    logger.info(f"Saved confusion matrix -> {path}")


def _plot_feature_importance(feature_importance):
    names = [f for f, _ in feature_importance][::-1]
    scores = [s for _, s in feature_importance][::-1]

    plt.figure(figsize=(7, 5))
    plt.barh(names, scores, color="#0891b2")
    plt.xlabel("Importance")
    plt.title("Top Feature Importances — XGBoost")
    plt.tight_layout()
    path = REPORTS_DIR / "feature_importance.png"
    plt.savefig(path, dpi=150)
    plt.close()
    logger.info(f"Saved feature importance chart -> {path}")
