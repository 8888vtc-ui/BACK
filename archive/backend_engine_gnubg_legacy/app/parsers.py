"""Parsing de la sortie texte du binaire `gnubg -t` (hint, cube, et rollouts profonds).

Formats attendus :

Chequer play (hint) :
    1. Cubeful 2-ply    8/5 6/5                      Eq.: +0.123
       0.532 0.150 0.005 - 0.468 0.120 0.004
        2-ply cubeful prune [eval]
    2. Cubeful 2-ply    24/21 13/11                  Eq.: +0.098 ( -0.025)
       ...

Cube :
    Cube analysis
    2-ply cubeful equity
      No double:            +0.123
      Double, take:         +0.150
      Double, pass:         +1.000
    Proper cube action: Double, take

Rollouts profonds :
    1. Rollout       8/5 6/5                      Eq.: +0.158 (±0.012)
       0.540 0.162 0.006 - 0.460 0.122 0.004
       1296 games [2-ply, cubeful]
    2. Rollout       24/20 13/10                  Eq.: +0.072 ( -0.086 ±0.014)
       0.518 0.144 0.005 - 0.482 0.133 0.005
       1296 games [2-ply, cubeful]
"""

import re

from .models import CubeDecision, MoveAnalysis, Probabilities, RolloutMoveResult

_MOVE_RE = re.compile(
    r"^\s*(\d+)\.\s+(?:Cubeful|Cubeless)?\s*\d*-?ply?\s+(.+?)\s+Eq\.?:?\s*([+-]?\d+\.\d+)"
    r"(?:\s*\(\s*([+-]?\d+\.\d+)\s*\))?\s*$",
    re.IGNORECASE,
)
_PROB_RE = re.compile(
    r"^\s*(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+-\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*$"
)
_NO_DOUBLE_RE = re.compile(r"(?:No double|No Double)[:\s]+([+-]?\d+\.\d+)", re.IGNORECASE)
_DOUBLE_TAKE_RE = re.compile(r"(?:Double,?\s*take|Double,?\s*Take)[:\s]+([+-]?\d+\.\d+)", re.IGNORECASE)
_DOUBLE_PASS_RE = re.compile(r"(?:Double,?\s*pass|Double,?\s*Pass)[:\s]+([+-]?\d+\.\d+)", re.IGNORECASE)
_PROPER_ACTION_RE = re.compile(r"Proper cube action:\s*([^\(\r\n]+)", re.IGNORECASE)

_ROLLOUT_MOVE_RE = re.compile(
    r"^\s*(\d+)\.\s+Rollout\s*(?:\d*-?ply)?\s+(.+?)\s+Eq\.?:?\s*([+-]?\d+\.\d+)"
    r"(?:\s*\(\s*(?:([+-]?\d+\.\d+)\s*)?(?:[±\+\-](\d+\.\d+))?\s*\))?",
    re.IGNORECASE,
)
_GAMES_RE = re.compile(r"(\d+)\s+games", re.IGNORECASE)
_PROGRESS_RE = re.compile(
    r"(?:Rollout\s+\d+:|Progress:?)\s*(\d+(?:\.\d+)?)\s*%\s*(?:\((\d+)\s*/\s*(\d+)\))?",
    re.IGNORECASE,
)


_DEC_COMMA_RE = re.compile(r"(\d),(\d)")


def _normalize_decimals(text: str) -> str:
    """Normalise les virgules décimales (locales FR/EU de gnubg sous Windows) en points décimaux."""
    return _DEC_COMMA_RE.sub(r"\1.\2", text)


def parse_hint(text: str) -> list[MoveAnalysis]:
    """Parse la sortie de `hint` (chequer play) en liste de coups classés."""
    text = _normalize_decimals(text)
    moves: list[MoveAnalysis] = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        m = _MOVE_RE.match(lines[i])
        if m:
            rank = int(m.group(1))
            notation = m.group(2).strip()
            equity = float(m.group(3))
            equity_loss = float(m.group(4)) if m.group(4) else 0.0
            probs: Probabilities | None = None
            next_idx = i + 1
            if next_idx < len(lines) and not lines[next_idx].strip():
                next_idx += 1
            if next_idx < len(lines):
                pm = _PROB_RE.match(lines[next_idx])
                if pm:
                    probs = Probabilities(
                        win=float(pm.group(1)),
                        winGammon=float(pm.group(2)),
                        winBackgammon=float(pm.group(3)),
                        loseWin=float(pm.group(4)),
                        loseGammon=float(pm.group(5)),
                        loseBackgammon=float(pm.group(6)),
                    )
                    i = next_idx
            moves.append(
                MoveAnalysis(
                    rank=rank,
                    notation=notation,
                    equity=equity,
                    equityLoss=equity_loss,
                    probabilities=probs,
                )
            )
        i += 1
    return moves


def parse_cube(text: str) -> CubeDecision:
    """Parse la sortie de `hint` (cube) en décision de videau."""
    text = _normalize_decimals(text)

    def _find(regex: re.Pattern[str]) -> float | None:
        m = regex.search(text)
        return float(m.group(1)) if m else None

    m = _PROPER_ACTION_RE.search(text)
    return CubeDecision(
        noDouble=_find(_NO_DOUBLE_RE),
        doubleTake=_find(_DOUBLE_TAKE_RE),
        doublePass=_find(_DOUBLE_PASS_RE),
        optimalAction=m.group(1).strip() if m else None,
    )


def parse_rollout(text: str, default_trials: int = 1296) -> list[RolloutMoveResult]:
    """Parse les résultats finaux d'un rollout gnubg."""
    text = _normalize_decimals(text)
    moves: list[RolloutMoveResult] = []
    lines = text.splitlines()
    i = 0

    while i < len(lines):
        line = lines[i]
        # Recherche d'un coup candidat de rollout
        m = _ROLLOUT_MOVE_RE.match(line)
        if not m:
            # Compatibilité si gnubg a affiché sous format chequer standard
            m = _MOVE_RE.match(line)

        if m:
            rank = int(m.group(1))
            notation = m.group(2).strip()
            equity = float(m.group(3))

            # Groupes d'équité relative et d'intervalle de confiance
            loss_str = m.group(4) if len(m.groups()) >= 4 else None
            ci_str = m.group(5) if len(m.groups()) >= 5 else None

            equity_loss = float(loss_str) if loss_str else 0.0
            confidence_interval = float(ci_str) if ci_str else 0.012
            std_error = round(confidence_interval / 1.96, 4)

            probs: Probabilities | None = None
            trials = default_trials

            # Vérification des lignes suivantes (probabilités et nombre de parties)
            next_idx = i + 1
            while next_idx < len(lines):
                sub_line = lines[next_idx].strip()
                if not sub_line:
                    next_idx += 1
                    continue
                # Si c'est déjà le coup suivant, on arrête d'avancer
                if _ROLLOUT_MOVE_RE.match(lines[next_idx]) or _MOVE_RE.match(lines[next_idx]):
                    break

                pm = _PROB_RE.match(sub_line)
                if pm:
                    probs = Probabilities(
                        win=float(pm.group(1)),
                        winGammon=float(pm.group(2)),
                        winBackgammon=float(pm.group(3)),
                        loseWin=float(pm.group(4)),
                        loseGammon=float(pm.group(5)),
                        loseBackgammon=float(pm.group(6)),
                    )

                gm = _GAMES_RE.search(sub_line)
                if gm:
                    trials = int(gm.group(1))

                next_idx += 1
                if next_idx > i + 3:
                    break

            i = next_idx - 1

            moves.append(
                RolloutMoveResult(
                    rank=rank,
                    notation=notation,
                    equity=equity,
                    equityLoss=equity_loss,
                    confidenceInterval=confidence_interval,
                    stdError=std_error,
                    trials=trials,
                    probabilities=probs,
                )
            )
        i += 1

    return moves


def parse_rollout_progress(line: str) -> tuple[float, int, int] | None:
    """Extrait le pourcentage de progression et le nombre de parties d'une ligne de log gnubg.

    Retourne: (pourcentage, parties_faites, parties_totales) ou None.
    """
    line = _normalize_decimals(line)
    m = _PROGRESS_RE.search(line)
    if not m:
        return None

    pct = float(m.group(1))
    done = int(m.group(2)) if m.group(2) else 0
    total = int(m.group(3)) if m.group(3) else 0

    return pct, done, total