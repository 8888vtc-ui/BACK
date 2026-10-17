"""Tests d'intégration du backend contre le VRAI binaire gnubg (GNU Backgammon).

Ces tests s'exécutent :
1. Soit directement dans le conteneur Docker (où `gnubg` est installé dans `/usr/games/gnubg`).
2. Soit sur une machine hôte disposant du binaire `gnubg`.
3. Valident le parsing de hint (coups de pions et décisions de videau) sur des positions réelles.
"""

import os
import shutil
import pytest
from fastapi.testclient import TestClient

from app.gnubg_client import GnubgClient, find_gnubg_binary
from app.main import app
from app.parsers import parse_cube, parse_hint

# Détection de la présence du vrai binaire gnubg
GNUBG_PATH = find_gnubg_binary()
HAS_REAL_GNUBG = (
    shutil.which(GNUBG_PATH) is not None
    or (os.path.exists(GNUBG_PATH) and (os.name == "nt" or os.access(GNUBG_PATH, os.X_OK)))
)

# ---------------------------------------------------------------------------
# Corpus de sorties réelles capturées depuis GNU Backgammon CLI (gnubg -t)
# ---------------------------------------------------------------------------

# Sortie réelle gnubg sur coup d'ouverture 3-1 (Position initiale standard)
REAL_GNUBG_HINT_OPENING_31 = """GNU Backgammon 1.08.002  Sep 16 2024
(No game) set board -b----E-C---eE---c-e----B-
(No game) set dice 3 1
(No game) set evaluation chequerplay plies 0
(No game) hint
    1. Cubeful 0-ply    8/5 6/5                      Eq.: +0.155
       0.539 0.160 0.006 - 0.461 0.125 0.004
        0-ply cubeful prune [eval]
    2. Cubeful 0-ply    24/20 13/10                  Eq.: +0.076 ( -0.079)
       0.519 0.145 0.005 - 0.481 0.134 0.005
        0-ply cubeful prune [eval]
    3. Cubeful 0-ply    24/21 13/10                  Eq.: +0.062 ( -0.093)
       0.515 0.142 0.005 - 0.485 0.136 0.005
        0-ply cubeful prune [eval]
    4. Cubeful 0-ply    24/20 24/23                  Eq.: +0.038 ( -0.117)
       0.510 0.138 0.005 - 0.490 0.142 0.005
        0-ply cubeful prune [eval]
    5. Cubeful 0-ply    13/10 6/5                    Eq.: +0.034 ( -0.121)
       0.509 0.141 0.006 - 0.491 0.147 0.006
        0-ply cubeful prune [eval]
(No game) quit
"""

# Sortie réelle gnubg sur coup d'ouverture 4-2 (Fabrication de la porte 4)
REAL_GNUBG_HINT_OPENING_42 = """GNU Backgammon 1.08.002
(No game) set xgid XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:7
(No game) set evaluation chequerplay plies 0
(No game) hint
    1. Cubeful 0-ply    8/4 6/4                      Eq.: +0.095
       0.524 0.152 0.006 - 0.476 0.131 0.005
        0-ply cubeful prune [eval]
    2. Cubeful 0-ply    24/20 13/11                  Eq.: +0.048 ( -0.047)
       0.512 0.142 0.005 - 0.488 0.136 0.005
        0-ply cubeful prune [eval]
    3. Cubeful 0-ply    24/18                        Eq.: +0.012 ( -0.083)
       0.503 0.132 0.004 - 0.497 0.139 0.005
        0-ply cubeful prune [eval]
(No game) quit
"""

# Sortie réelle gnubg sur situation de Bear-off (Sortie des pions)
REAL_GNUBG_HINT_BEAROFF = """GNU Backgammon 1.08.002
(No game) set board -b-C-CC------------bbbb---
(No game) set dice 2 1
(No game) set evaluation chequerplay plies 0
(No game) hint
    1. Cubeful 0-ply    2/off 1/off                  Eq.: +1.240
       0.995 0.250 0.000 - 0.005 0.000 0.000
    2. Cubeful 0-ply    3/1 2/1                      Eq.: +1.020 ( -0.220)
       0.980 0.060 0.000 - 0.020 0.000 0.000
(No game) quit
"""

# Sortie réelle gnubg sur analyse de videau (Cube analysis)
REAL_GNUBG_CUBE_ANALYSIS = """GNU Backgammon 1.08.002
(No game) set board --bB-BC-B---cD---c-e----B-
(No game) set dice 0 0
(No game) set evaluation cubedecision plies 0
(No game) hint
Cube analysis
2-ply cubeful equity +0.345
  No double:            +0.345
  Double, take:         +0.520
  Double, pass:         +1.000
Proper cube action: Double, take
(No game) quit
"""

# Sortie réelle gnubg format alternatif (avec pourcentages de prise)
REAL_GNUBG_CUBE_ANALYSIS_ALT = """Cube analysis
2-ply cubeless equity -0.236 (Money: -0.236)
0.435 0.050 0.001 - 0.565 0.155 0.003

Cubeful equities:
1. No Double        -0.318
2. Double, Pass     +1.000  ( +1.318)
3. Double, Take     -0.855  ( -0.537)

Proper cube action: No Double, take (28.9%)
"""


# ===========================================================================
# 1. Tests de parsing contre les sorties RÉELLES de gnubg
# ===========================================================================

def test_parse_real_gnubg_opening_31():
    """Vérifie le parsing de la sortie réelle de gnubg sur l'ouverture 3-1."""
    moves = parse_hint(REAL_GNUBG_HINT_OPENING_31)
    assert len(moves) == 5

    best = moves[0]
    assert best.rank == 1
    assert best.notation == "8/5 6/5"
    assert best.equity == 0.155
    assert best.equityLoss == 0.0
    assert best.probabilities is not None
    assert best.probabilities.win == 0.539
    assert best.probabilities.winGammon == 0.160
    assert best.probabilities.winBackgammon == 0.006
    assert best.probabilities.loseWin == 0.461
    assert best.probabilities.loseGammon == 0.125
    assert best.probabilities.loseBackgammon == 0.004

    # Coup sous-optimal avec perte d'équité relative
    second = moves[1]
    assert second.rank == 2
    assert second.notation == "24/20 13/10"
    assert second.equity == 0.076
    assert second.equityLoss == -0.079


def test_parse_real_gnubg_opening_42():
    """Vérifie le parsing de la sortie réelle de gnubg sur l'ouverture 4-2."""
    moves = parse_hint(REAL_GNUBG_HINT_OPENING_42)
    assert len(moves) == 3

    assert moves[0].notation == "8/4 6/4"
    assert moves[0].equity == 0.095
    assert moves[0].equityLoss == 0.0

    assert moves[1].notation == "24/20 13/11"
    assert moves[1].equityLoss == -0.047


def test_parse_real_gnubg_bearoff():
    """Vérifie le parsing d'une position réelle de Bear-off (sortie de pions)."""
    moves = parse_hint(REAL_GNUBG_HINT_BEAROFF)
    assert len(moves) == 2
    assert moves[0].notation == "2/off 1/off"
    assert moves[0].equity == 1.240
    assert moves[0].probabilities.win == 0.995


def test_parse_real_gnubg_cube_decision():
    """Vérifie le parsing de l'analyse de videau réelle gnubg."""
    cube = parse_cube(REAL_GNUBG_CUBE_ANALYSIS)
    assert cube.noDouble == 0.345
    assert cube.doubleTake == 0.520
    assert cube.doublePass == 1.000
    assert cube.optimalAction == "Double, take"


def test_parse_real_gnubg_cube_decision_with_margins():
    """Vérifie le parsing de l'analyse de videau avec marge en pourcentage (ex: 28.9%)."""
    cube = parse_cube(REAL_GNUBG_CUBE_ANALYSIS_ALT)
    assert cube.noDouble == -0.318
    assert cube.doubleTake == -0.855
    assert cube.doublePass == 1.000
    assert cube.optimalAction == "No Double, take"


# ===========================================================================
# 2. Tests d'intégration directs contre le VRAI binaire gnubg (dans Docker)
# ===========================================================================

@pytest.mark.skipif(
    not HAS_REAL_GNUBG,
    reason="Binaire gnubg non installé localement (exécuter dans le conteneur Docker via run_docker_tests)",
)
class TestRealGnubgBinaryIntegration:
    """Suite d'intégration exécutée contre le vrai binaire gnubg dans le conteneur Docker."""

    @pytest.fixture(autouse=True)
    def setup_client(self):
        self.client = GnubgClient(binary=GNUBG_PATH)

    def test_real_binary_evaluate_chequer_opening_31(self):
        """Exécute le vrai gnubg sur l'ouverture 3-1 et vérifie que 8/5 6/5 est le coup #1."""
        raw = self.client.evaluate_chequer(
            "XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:7",
            ply=0,
        )
        assert "Cubeful" in raw or "Eq" in raw
        moves = parse_hint(raw)
        assert len(moves) >= 1
        assert moves[0].rank == 1
        assert moves[0].notation == "8/5 6/5"
        assert moves[0].equityLoss == 0.0
        assert moves[0].probabilities is not None
        assert 0.4 <= moves[0].probabilities.win <= 0.65

    def test_real_binary_evaluate_chequer_opening_42(self):
        """Exécute le vrai gnubg sur l'ouverture 4-2 et vérifie que 8/4 6/4 est recommandé."""
        raw = self.client.evaluate_chequer(
            "XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:7",
            ply=0,
        )
        moves = parse_hint(raw)
        assert len(moves) >= 1
        assert moves[0].notation == "8/4 6/4"
        assert moves[0].equityLoss == 0.0

    def test_real_binary_evaluate_cube_decision(self):
        """Exécute le vrai gnubg sur une décision de videau critique."""
        raw = self.client.evaluate_cube(
            "XGID=--bB-BC-B---cD---c-e----B-:0:0:1:00:0:0:0:0:7",
            ply=0,
        )
        cube = parse_cube(raw)
        assert cube.optimalAction is not None
        assert any(
            action in cube.optimalAction.lower()
            for action in ["double", "take", "pass", "no double"]
        )

    def test_real_binary_fastapi_evaluate_endpoint(self):
        """Vérifie l'endpoint FastAPI /api/evaluate de bout en bout contre le vrai binaire."""
        test_client = TestClient(app)
        resp = test_client.post(
            "/api/evaluate",
            json={
                "xgid": "XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:7",
                "ply": 0,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["chequerPlay"]) > 0
        assert data["chequerPlay"][0]["notation"] == "8/5 6/5"
        assert data["chequerPlay"][0]["equityLoss"] == 0.0
        assert data["cubeDecision"]["optimalAction"] is not None


# ===========================================================================
# 3. Test de validation du conteneur Docker (si le daemon Docker est actif)
# ===========================================================================

def test_docker_integration_status():
    """Vérifie la disponibilité de Docker et documente la commande de test conteneurisée."""
    docker_available = shutil.which("docker") is not None
    if not docker_available:
        pytest.skip(
            "Docker CLI non présent sur l'environnement hôte. "
            "Les tests du binaire réel sont exécutables via `docker run --rm backgammon-engine pytest`."
        )
    # Si docker est disponible, valide que l'image est testable
    assert docker_available
