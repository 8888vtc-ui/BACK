"""Gestionnaire d'alertes opérationnelles pour le microservice d'analyse Python."""

import os
import time
from typing import Any, Optional
import httpx
from .logger import structured_logger
from .monitoring import capture_backend_message


class BackendAlertManager:
    """Gère le déclenchement et la déduplication des alertes côté moteur."""

    def __init__(self, deduplication_window_seconds: float = 60.0):
        self.deduplication_window_seconds = deduplication_window_seconds
        self.recent_alerts: dict[str, float] = {}

    async def trigger_alert(
        self,
        alert_type: str,
        severity: str,
        message: str,
        details: Optional[dict[str, Any]] = None,
    ) -> bool:
        """Déclenche une alerte si elle n'a pas été émise dans la fenêtre de déduplication."""
        dedupe_key = f"{alert_type}:{message}"
        now = time.time()
        last_sent = self.recent_alerts.get(dedupe_key)

        if last_sent and (now - last_sent < self.deduplication_window_seconds):
            return False

        self.recent_alerts[dedupe_key] = now

        # Log structuré
        log_msg = f"[ALERTE {severity.upper()}] ({alert_type}) {message}"
        if severity == "critical":
            structured_logger.error(log_msg, extra={"extra_context": details or {}})
        elif severity == "warning":
            structured_logger.warning(log_msg, extra={"extra_context": details or {}})
        else:
            structured_logger.info(log_msg, extra={"extra_context": details or {}})

        # Notification Sentry
        capture_backend_message(
            f"[{severity.upper()}] {message}",
            level="error" if severity == "critical" else "warning",
            context=details,
        )

        # Webhook externe éventuel
        webhook_url = os.getenv("ALERT_WEBHOOK_URL")
        if webhook_url:
            try:
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(
                        webhook_url,
                        json={
                            "text": f"🚨 *[Backgammon Engine - {severity.upper()}]* {message}",
                            "alert_type": alert_type,
                            "details": details or {},
                        },
                    )
            except Exception as e:
                structured_logger.error(f"Échec envoi webhook alerte: {e}")

        return True


backend_alert_manager = BackendAlertManager()
