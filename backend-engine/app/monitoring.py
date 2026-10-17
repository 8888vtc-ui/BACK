"""Module d'initialisation et d'intégration Sentry pour le backend FastAPI gnubg."""

import os
from typing import Any, Optional
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN")
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))


def init_sentry() -> bool:
    """Initialise le SDK Sentry si la variable d'environnement SENTRY_DSN est définie."""
    if not SENTRY_DSN:
        return False

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=0.2 if ENVIRONMENT == "production" else 1.0,
        profiles_sample_rate=0.1 if ENVIRONMENT == "production" else 1.0,
        environment=ENVIRONMENT,
        send_default_pii=False,
    )
    return True


def capture_backend_exception(error: Exception, context: Optional[dict[str, Any]] = None) -> Optional[str]:
    """Capture une exception côté backend avec métadonnées."""
    if not SENTRY_DSN:
        return None

    with sentry_sdk.push_scope() as scope:
        if context:
            for key, val in context.items():
                scope.set_extra(key, val)
        return sentry_sdk.capture_exception(error)


def capture_backend_message(message: str, level: str = "info", context: Optional[dict[str, Any]] = None) -> Optional[str]:
    """Capture un message ou une anomalie vers Sentry."""
    if not SENTRY_DSN:
        return None

    with sentry_sdk.push_scope() as scope:
        if context:
            for key, val in context.items():
                scope.set_extra(key, val)
        return sentry_sdk.capture_message(message, level=level)
