"""Tests de monitoring, logs structurés et sondes de santé."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.monitoring import init_sentry, capture_backend_message, capture_backend_exception
from app.logger import structured_logger
from app.alerts import backend_alert_manager


def test_health_live():
    client = TestClient(app)
    resp = client.get("/health/live")
    assert resp.status_code == 200
    assert resp.json() == {"status": "alive"}


def test_health_ready():
    client = TestClient(app)
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "pool_stats" in data
    assert "uptime_seconds" in data


def test_api_health():
    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "backgammon-backend-engine"
    assert "version" in data
    assert "sentry_enabled" in data


def test_correlation_id_propagation():
    client = TestClient(app)
    custom_id = "test-req-correlation-12345"
    resp = client.get("/health", headers={"x-correlation-id": custom_id})
    assert resp.status_code == 200
    assert resp.headers.get("x-correlation-id") == custom_id


def test_monitoring_helpers_without_dsn():
    assert capture_backend_message("test message") is None
    assert capture_backend_exception(ValueError("test error")) is None


import asyncio

def test_backend_alert_manager_deduplication():
    # Premier déclenchement -> accepté
    fired_1 = asyncio.run(
        backend_alert_manager.trigger_alert("TEST_ALERT", "warning", "Anomalie test", {"foo": "bar"})
    )
    assert fired_1 is True

    # Deuxième déclenchement immédiat -> dédupliqué
    fired_2 = asyncio.run(
        backend_alert_manager.trigger_alert("TEST_ALERT", "warning", "Anomalie test", {"foo": "bar"})
    )
    assert fired_2 is False
