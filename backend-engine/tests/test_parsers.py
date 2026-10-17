"""Tests des parsers de sortie gnubg (aucun binaire requis)."""

from app.parsers import parse_cube, parse_hint, parse_rollout, parse_rollout_progress

HINT_OUTPUT = """    1. Cubeful 2-ply    8/5 6/5                      Eq.: +0.123
       0.532 0.150 0.005 - 0.468 0.120 0.004
        2-ply cubeful prune [eval]
    2. Cubeful 2-ply    24/21 13/11                  Eq.: +0.098 ( -0.025)
       0.520 0.140 0.004 - 0.480 0.130 0.005
        2-ply cubeful prune [eval]
"""

CUBE_OUTPUT = """Cube analysis
2-ply cubeful equity
  No double:            +0.123
  Double, take:         +0.150
  Double, pass:         +1.000
Proper cube action: Double, take
"""

ROLLOUT_OUTPUT = """    1. Rollout       8/5 6/5                      Eq.: +0.158 (±0.012)
       0.540 0.162 0.006 - 0.460 0.122 0.004
       1296 games [2-ply, cubeful]
    2. Rollout       24/20 13/10                  Eq.: +0.072 ( -0.086 ±0.014)
       0.518 0.144 0.005 - 0.482 0.133 0.005
       1296 games [2-ply, cubeful]
"""


def test_parse_hint():
    moves = parse_hint(HINT_OUTPUT)
    assert len(moves) == 2

    assert moves[0].rank == 1
    assert moves[0].notation == "8/5 6/5"
    assert moves[0].equity == 0.123
    assert moves[0].equityLoss == 0.0
    assert moves[0].probabilities is not None
    assert moves[0].probabilities.win == 0.532
    assert moves[0].probabilities.winGammon == 0.150
    assert moves[0].probabilities.winBackgammon == 0.005
    assert moves[0].probabilities.loseWin == 0.468
    assert moves[0].probabilities.loseGammon == 0.120
    assert moves[0].probabilities.loseBackgammon == 0.004

    assert moves[1].rank == 2
    assert moves[1].notation == "24/21 13/11"
    assert moves[1].equity == 0.098
    assert moves[1].equityLoss == -0.025


def test_parse_cube():
    cube = parse_cube(CUBE_OUTPUT)
    assert cube.noDouble == 0.123
    assert cube.doubleTake == 0.150
    assert cube.doublePass == 1.000
    assert cube.optimalAction == "Double, take"


def test_parse_cube_empty():
    cube = parse_cube("")
    assert cube.noDouble is None
    assert cube.doubleTake is None
    assert cube.doublePass is None
    assert cube.optimalAction is None


def test_parse_rollout():
    moves = parse_rollout(ROLLOUT_OUTPUT, default_trials=1296)
    assert len(moves) == 2

    best = moves[0]
    assert best.rank == 1
    assert best.notation == "8/5 6/5"
    assert best.equity == 0.158
    assert best.equityLoss == 0.0
    assert best.confidenceInterval == 0.012
    assert best.trials == 1296
    assert best.probabilities is not None
    assert best.probabilities.win == 0.540

    second = moves[1]
    assert second.rank == 2
    assert second.notation == "24/20 13/10"
    assert second.equity == 0.072
    assert second.equityLoss == -0.086
    assert second.confidenceInterval == 0.014


def test_parse_rollout_progress():
    line1 = "Rollout 1: 45.5% (589/1296)"
    prog1 = parse_rollout_progress(line1)
    assert prog1 is not None
    assert prog1[0] == 45.5
    assert prog1[1] == 589
    assert prog1[2] == 1296

    line2 = "Quelconque texte sans progression"
    assert parse_rollout_progress(line2) is None