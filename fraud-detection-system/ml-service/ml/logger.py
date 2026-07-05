"""
logger.py
---------
Shared logger factory. The prompt for this project explicitly calls out
"use logging instead of print" -- this is a real production requirement:
print statements aren't leveled, aren't timestamped, and can't be routed
to log aggregators (Datadog, CloudWatch, ELK) in production.
"""

import logging
import sys
from ml.config import LOGS_DIR


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        # Avoid duplicate handlers if get_logger is called more than once
        # for the same module (common when modules are re-imported).
        return logger

    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    stream_handler = logging.StreamHandler(sys.stdout)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    file_handler = logging.FileHandler(LOGS_DIR / "ml_pipeline.log")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
