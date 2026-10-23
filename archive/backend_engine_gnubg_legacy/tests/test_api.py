"""Tests de l'endpoint /api/evaluate avec un client gnubg simulé."""

from fastapi.testclient import TestClient

from app import main as main_module
from app.main import app

HINT = """    1. Cubeful 2-ply    8/5 6/5                      Eq.: +0.123
       0.532 0.150 0.005 - 0.468 0.120 0.004
        2-ply cubeful prune [eval]
"""

CUBE = """Cube analysis
2-ply cubeful equity
  No double:            +0.123
  Double, take:         +0.150
  Double, pass:         +1.000
Proper cube action: Double, take
"""


class FakeClient:
    def evaluate_chequer(self, xgid: str, ply: int = 2) -> str:
        return HINT

    def evaluate_cube(self, xgid: str, ply: int = 2) -> str:
        return CUBE


def test_evaluate(monkeypatch):
    monkeypatch.setattr(main_module, "client", FakeClient())
    client = TestClient(app)
    resp = client.post(
        "/api/evaluate",
        json={"xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["chequerPlay"]) == 1
    assert data["chequerPlay"][0]["notation"] == "8/5 6/5"
    assert data["chequerPlay"][0]["equity"] == 0.123
    assert data["cubeDecision"]["optimalAction"] == "Double, take"
    assert data["cubeDecision"]["doubleTake"] == 0.15


def test_health():
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_security_headers():
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.headers["x-content-type-options"] == "nosniff"
    assert resp.headers["x-frame-options"] == "DENY"
    assert resp.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_evaluate_rate_limit(monkeypatch):
    monkeypatch.setattr(main_module, "client", FakeClient())
    main_module.evaluate_rate_limiter.reset()
    client = TestClient(app)

    # 60 requêtes autorisées
    for _ in range(60):
        r = client.post(
            "/api/evaluate",
            json={"xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10"},
        )
        assert r.status_code == 200

    # 61e requête bloquée avec HTTP 429
    r_blocked = client.post(
        "/api/evaluate",
        json={"xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10"},
    )
    assert r_blocked.status_code == 429
    assert "Retry-After" in r_blocked.headers
    assert r_blocked.headers["X-RateLimit-Limit"] == "60"
    main_module.evaluate_rate_limiter.reset()