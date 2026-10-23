"""Logger JSON structuré pour le backend FastAPI.
Produit des logs JSON conformes aux standards CloudWatch, Datadog, Loki et Elastic.
"""

from datetime import datetime, timezone
import json
import logging
import sys
from typing import Any, Optional


class JSONFormatter(logging.Formatter):
    """Formateur sérialisant chaque ligne de log sous forme d'objet JSON structuré."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Contexte de corrélation
        if hasattr(record, "correlation_id") and record.correlation_id:
            log_entry["correlation_id"] = record.correlation_id

        # Métadonnées additionnelles
        if hasattr(record, "extra_context") and isinstance(record.extra_context, dict):
            log_entry["context"] = record.extra_context

        # Traces d'exception
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


def setup_structured_logging(level: int = logging.INFO) -> logging.Logger:
    """Configure le logger racine avec le formateur JSON."""
    logger = logging.getLogger("backgammon_engine")
    logger.setLevel(level)

    # Évite les handlers dupliqués lors de rechargements à chaud
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    logger.propagate = False
    return logger


structured_logger = setup_structured_logging()
