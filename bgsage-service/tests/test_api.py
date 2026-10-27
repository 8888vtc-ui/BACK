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


def test_evaluate_match_batch_invalid_xgid():
    payload = {
        "match_id": "m-invalid",
        "positions": [
            {
                "turn_index": 0,
                "xgid": "XGID=bad",
            }
        ],
    }
    resp = client.post("/api/evaluate-match-batch", json=payload)
    assert resp.status_code == 422


def test_evaluate_match_batch_adaptive_1p_to_3p_escalation(monkeypatch):
    from types import SimpleNamespace
    import app.main as main_mod

    before_bgsage = [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
    after_best = [0, -2, 0, 0, 0, 2, 4, 0, 2, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
    after_alt = [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -4, 4, 0, 0, 0, -3, 0, -5, 1, 0, 0, 0, 1, 0]

    dummy_probs = SimpleNamespace(
        win=0.58,
        gammon_win=0.17,
        backgammon_win=0.01,
        gammon_loss=0.09,
        backgammon_loss=0.005,
    )

    class DummyAnalyzer:
        def __init__(self, level: str):
            self.level = level

        def checker_play(self, board, die1, die2, **kwargs):
            # Si die1 == 3 et die2 == 1 : écart > 0.050 entre rang 1 et rang 2
            m1 = SimpleNamespace(
                board=after_best,
                equity=0.165,
                equity_diff=0.0,
                probs=dummy_probs,
                player_game_plan="priming",
                opponent_game_plan="running",
                cubeless_equity=0.150,
                eval_level=self.level,
            )
            m2 = SimpleNamespace(
                board=after_alt,
                equity=0.025 if (die1 == 3 and die2 == 1) else 0.145,
                equity_diff=-0.140 if (die1 == 3 and die2 == 1) else -0.020,
                probs=dummy_probs,
                player_game_plan="running",
                opponent_game_plan="priming",
                cubeless_equity=0.010,
                eval_level=self.level,
            )
            return SimpleNamespace(moves=[m1, m2])

    monkeypatch.setattr(
        main_mod,
        "_get_analyzer",
        lambda ply: DummyAnalyzer("1ply" if ply == 1 else "3ply"),
    )

    payload = {
        "match_id": "match-test-001",
        "blunder_threshold": 0.080,
        "positions": [
            {
                "turn_index": 0,
                "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:7",
                "played_notation": "8/5 6/5",
            },
            {
                "turn_index": 1,
                "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:7",
                "played_board": after_alt,
            },
        ],
    }

    resp = client.post("/api/evaluate-match-batch", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["match_id"] == "match-test-001"
    assert body["total_positions"] == 2
    assert body["settled_at_1p_count"] == 1
    assert body["escalated_to_3p_count"] == 1
    assert body["positions"][0]["settled_at_level"] == "1ply"
    assert body["positions"][0]["equity_loss"] == 0.0
    assert body["positions"][1]["settled_at_level"] == "3ply"
    assert body["positions"][1]["equity_loss"] == 0.02
    assert body["performance_rating_pr"] == 5.0

