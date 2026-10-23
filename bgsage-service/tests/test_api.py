"""Tests de l'API FastAPI (sans dépendre du moteur bgsage installé)."""

from fastapi.testclient import TestClient

from app.main import app
from app.notation import board_to_notation

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["engine"] == "bgsage"


def test_analyze_invalid_cube_owner():
    payload = {
        "board": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
        "dice": [6, 1],
        "player_turn": 0,
        "cube_value": 1,
        "cube_owner": "invalid",
    }
    resp = client.post("/analyze", json=payload)
    assert resp.status_code == 422


def test_analyze_invalid_xgid():
    payload = {
        "board": "XGID=bad",
        "dice": [6, 1],
        "player_turn": 0,
        "cube_value": 1,
        "cube_owner": "centered",
    }
    resp = client.post("/analyze", json=payload)
    assert resp.status_code == 422


def test_board_to_notation_pass():
    board = [0] * 26
    assert board_to_notation(board, board) == "Pass"


def test_board_to_notation_simple_move():
    # Un pion passe de la flèche 8 (index 8) à la flèche 5 (index 5)
    before = [0] * 26
    before[8] = 2
    after = [0] * 26
    after[5] = 2
    notation = board_to_notation(before, after)
    assert "8/5" in notation


def test_board_to_notation_opening_31():
    # Position de départ bgsage : 8/5 6/5 (flèche 8 -> 5, flèche 6 -> 5)
    before = [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
    after = [0, -2, 0, 0, 0, 2, 4, 0, 2, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
    assert board_to_notation(before, after) == "8/5 6/5"
