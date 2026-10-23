"""Tests des endpoints de l'API de rollout profond et du pool de workers."""

import time
from fastapi.testclient import TestClient
from app.main import app


def test_health_with_pool():
    with TestClient(app) as client:
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


def test_get_pool_stats():
    with TestClient(app) as client:
        resp = client.get("/api/pool/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["poolSize"] >= 1
        assert "idleWorkers" in data
        assert "busyWorkers" in data
        assert "queuedJobs" in data


def test_evaluate_endpoint():
    with TestClient(app) as client:
        resp = client.post(
            "/api/evaluate",
            json={"xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10", "ply": 2},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["chequerPlay"]) >= 1
        assert data["cubeDecision"] is not None


def test_submit_and_poll_rollout():
    with TestClient(app) as client:
        # 1. Soumission du rollout
        submit_resp = client.post(
            "/api/rollout",
            json={
                "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
                "trials": 144,
                "ply": 2,
                "candidateMoves": ["8/5 6/5", "24/20 13/10"],
            },
        )
        assert submit_resp.status_code == 202
        job_data = submit_resp.json()
        job_id = job_data["jobId"]
        assert job_id is not None
        assert job_data["status"] in ("queued", "running", "completed")

        # 2. Interrogation de l'état
        poll_resp = client.get(f"/api/jobs/{job_id}")
        assert poll_resp.status_code == 200
        polled = poll_resp.json()
        assert polled["jobId"] == job_id
        assert "progress" in polled

        # 3. Attente de la fin de l'exécution
        max_wait = 6.0
        start = time.time()
        while time.time() - start < max_wait:
            time.sleep(0.15)
            check = client.get(f"/api/jobs/{job_id}").json()
            if check["status"] == "completed":
                break

        final = client.get(f"/api/jobs/{job_id}").json()
        assert final["status"] == "completed"
        assert final["progress"]["progress"] == 100.0
        assert final["result"] is not None
        assert len(final["result"]["moves"]) == 2
        assert final["result"]["moves"][0]["notation"] == "8/5 6/5"
        assert final["result"]["moves"][0]["confidenceInterval"] > 0


def test_cancel_rollout_endpoint():
    with TestClient(app) as client:
        submit_resp = client.post(
            "/api/rollout",
            json={
                "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
                "trials": 5000,
                "ply": 2,
            },
        )
        job_id = submit_resp.json()["jobId"]

        # Annulation immédiate
        cancel_resp = client.post(f"/api/jobs/{job_id}/cancel")
        assert cancel_resp.status_code == 200
        data = cancel_resp.json()
        assert data["status"] in ("cancelled", "completed")


def test_job_not_found():
    with TestClient(app) as client:
        resp = client.get("/api/jobs/non-existent-id")
        assert resp.status_code == 404

        cancel_resp = client.post("/api/jobs/non-existent-id/cancel")
        assert cancel_resp.status_code == 404
