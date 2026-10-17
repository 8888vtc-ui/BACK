"""Modèles Pydantic de l'API d'évaluation et de rollout profond Backgammon."""

from typing import Literal
from pydantic import BaseModel, Field


class EvaluateRequest(BaseModel):
    """Requête d'évaluation : une position au format XGID complet."""

    xgid: str = Field(
        ...,
        description="Position au format XGID (ex: XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10)",
    )
    ply: int = Field(2, ge=0, le=4, description="Profondeur d'évaluation (0 à 4)")


class Probabilities(BaseModel):
    """Probabilités de gain/gammon/backgammon (côté joueur au trait)."""

    win: float
    winGammon: float
    winBackgammon: float
    loseWin: float
    loseGammon: float
    loseBackgammon: float


class MoveAnalysis(BaseModel):
    """Un coup candidat classé."""

    rank: int
    notation: str
    equity: float
    #: equity - equity du meilleur coup (0 pour le meilleur, négatif sinon).
    equityLoss: float
    probabilities: Probabilities | None = None


class CubeDecision(BaseModel):
    """Analyse de la décision de videau."""

    noDouble: float | None = None
    doubleTake: float | None = None
    doublePass: float | None = None
    optimalAction: str | None = None


class EvaluateResponse(BaseModel):
    chequerPlay: list[MoveAnalysis]
    cubeDecision: CubeDecision


# ---------------------------------------------------------------------------
# Modèles pour les Rollouts Profonds Asynchrones & le Pool de Workers
# ---------------------------------------------------------------------------

class RolloutRequest(BaseModel):
    """Paramètres pour soumettre un job de rollout profond."""

    xgid: str = Field(
        ...,
        description="Position au format XGID complet à analyser",
    )
    trials: int = Field(
        1296,
        ge=18,
        le=10000,
        description="Nombre de parties simulées pour le rollout (ex: 144, 324, 648, 1296, 2592)",
    )
    ply: int = Field(
        2,
        ge=0,
        le=4,
        description="Profondeur d'évaluation en ply pour la phase de rollout (défaut 2)",
    )
    candidateMoves: list[str] | None = Field(
        None,
        description="Liste restreinte de coups à comparer (ex: coup joué vs coup optimal)",
    )
    seed: int | None = Field(
        None,
        description="Graine aléatoire pour reproductibilité des tirages de dés",
    )


class RolloutMoveResult(BaseModel):
    """Résultat consolidé du rollout pour un coup donné avec intervalle de confiance."""

    rank: int
    notation: str
    equity: float
    equityLoss: float
    confidenceInterval: float = Field(
        0.012,
        description="Demi-largeur de l'intervalle de confiance à 95% (±)",
    )
    stdError: float = Field(
        0.006,
        description="Écart-type / erreur standard de l'estimation de l'équité",
    )
    trials: int = Field(
        ...,
        description="Nombre de parties effectivement simulées pour ce coup",
    )
    probabilities: Probabilities | None = None


class RolloutResult(BaseModel):
    """Résultat complet d'un job de rollout asynchrone."""

    xgid: str
    trials: int
    ply: int
    moves: list[RolloutMoveResult]
    verdictConfirmation: str = Field(
        ...,
        description="Diagnostic après rollout (ex: 'Erreur confirmée', 'Coup équivalent', etc.)",
    )
    durationSeconds: float


JobStatus = Literal["queued", "running", "completed", "failed", "cancelled"]


class RolloutProgress(BaseModel):
    """Progression remontée en temps réel d'un rollout."""

    jobId: str
    status: JobStatus
    progress: float = Field(0.0, ge=0.0, le=100.0, description="Pourcentage achevé (0 à 100)")
    trialsDone: int = 0
    totalTrials: int = 0
    currentStep: str = "En attente d'un worker..."
    etaSeconds: float | None = None
    elapsedSeconds: float = 0.0


class JobResponse(BaseModel):
    """Réponse d'interrogation ou statut d'un job de rollout."""

    jobId: str
    status: JobStatus
    createdAt: float
    startedAt: float | None = None
    completedAt: float | None = None
    progress: RolloutProgress
    result: RolloutResult | None = None
    error: str | None = None


class PoolStats(BaseModel):
    """Statistiques instantanées du pool de workers GNUBG."""

    poolSize: int
    idleWorkers: int
    busyWorkers: int
    queuedJobs: int
    completedJobs: int
    failedJobs: int