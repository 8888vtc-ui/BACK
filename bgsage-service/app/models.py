"""Modèles Pydantic de l'API d'analyse bgsage."""

from pydantic import BaseModel, Field


class EvaluateBoardRequest(BaseModel):
    """Requête d'évaluation à partir d'un board (26 entiers)."""

    board: list[int] = Field(..., min_length=26, max_length=26, description="Board (26 entiers)")
    dice: list[int] = Field(..., min_length=2, max_length=2, description="Les deux dés")
    ply: int = Field(3, ge=1, le=3, description="Profondeur d'évaluation (1 à 3)")


class SelfPlayRequest(BaseModel):
    """Requête de self-play : fait jouer deux bots l'un contre l'autre."""

    player1_ply: int = Field(1, ge=1, le=3, description="Niveau du joueur 1 (1 à 3)")
    player2_ply: int = Field(3, ge=1, le=3, description="Niveau du joueur 2 (1 à 3)")
    games: int = Field(1, ge=1, le=10, description="Nombre de parties à simuler")
    seed: int = Field(42, description="Graine aléatoire pour reproductibilité")


class EvaluateRequest(BaseModel):
    """Requête d'évaluation au format du backend existant."""

    xgid: str = Field(..., description="Position au format XGID complet")
    ply: int = Field(2, ge=0, le=4, description="Profondeur d'évaluation (0 à 4)")


class LegacyProbabilities(BaseModel):
    """Probabilités au format attendu par le frontend et l'API standard.

    Normalisation des probabilités (Harmonisation Open Sage):
    - win: P(victoire) totale [0..1]
    - winGammon: P(gammon cumulée, incluant les backgammons conformément à la norme bgsage C++ / XG)
    - winBackgammon: P(backgammon)
    - loseWin: P(défaite) = 1 - win
    - loseGammon: P(gammon adverse cumulée, incluant les backgammons)
    - loseBackgammon: P(backgammon adverse)

    Champs dérivés explicites (pour éviter toute ambiguïté ou double-comptage) :
    - winGammonCumulative: égal à winGammon
    - loseGammonCumulative: égal à loseGammon
    - winGammonExclusive: P(gammon sans backgammon) = winGammon - winBackgammon
    - loseGammonExclusive: P(gammon adverse sans backgammon) = loseGammon - loseBackgammon
    - winSingle: P(victoire simple) = win - winGammon
    - loseSingle: P(défaite simple) = loseWin - loseGammon

    Formule d'équité cubeless EMG sans double comptage :
    Equity = (win - loseWin) + (winGammon - loseGammon) + (winBackgammon - loseBackgammon)
    """

    win: float
    winGammon: float
    winBackgammon: float
    loseWin: float
    loseGammon: float
    loseBackgammon: float
    winGammonCumulative: float | None = None
    loseGammonCumulative: float | None = None
    winGammonExclusive: float | None = None
    loseGammonExclusive: float | None = None
    winSingle: float | None = None
    loseSingle: float | None = None


class LegacyMoveAnalysis(BaseModel):
    """Un coup candidat au format attendu par le frontend."""

    rank: int
    notation: str
    equity: float
    equityLoss: float
    probabilities: LegacyProbabilities | None = None
    board: list[int] | None = None
    playerGamePlan: str | None = None
    opponentGamePlan: str | None = None
    cubelessEquity: float | None = None
    evalLevel: str | None = None


class LegacyCubeDecision(BaseModel):
    """Décision de videau au format attendu par le frontend."""

    noDouble: float | None = None
    doubleTake: float | None = None
    doublePass: float | None = None
    optimalAction: str | None = None


class GamePlans(BaseModel):
    """Classification stratégique de la position (bgsage)."""

    player: str
    opponent: str


class EvaluateResponse(BaseModel):
    """Réponse au format attendu par le frontend (analysisService.ts)."""

    chequerPlay: list[LegacyMoveAnalysis]
    cubeDecision: LegacyCubeDecision
    gamePlans: GamePlans | None = None
    isRace: bool | None = None


class MatchScore(BaseModel):
    """Score d'un match : points restants pour chaque joueur et longueur du match."""

    playerAway: int = Field(0, ge=0, description="Points restants pour le joueur au trait (0 = money game)")
    opponentAway: int = Field(0, ge=0, description="Points restants pour l'adversaire")
    matchLength: int = Field(0, ge=0, description="Longueur du match (0 = money game)")


class AnalyzeRequest(BaseModel):
    """Requête d'analyse d'une position."""

    board: str = Field(
        ...,
        description="Position au format XGID (ex: XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10)",
    )
    dice: list[int] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="Les deux dés (ex: [6, 1])",
    )
    player_turn: int = Field(
        ...,
        ge=0,
        le=1,
        description="Identifiant du joueur au trait (0 ou 1)",
    )
    cube_value: int = Field(1, ge=1, description="Valeur actuelle du videau")
    cube_owner: str = Field(
        "centered",
        description="Possession du videau : 'centered', 'player' ou 'opponent'",
    )
    match_score: MatchScore | None = Field(None, description="Score du match (optionnel)")


class Probabilities(BaseModel):
    """Probabilités cubeless issues de l'endpoint /analyze (perspective du joueur au trait).

    Dans ce format :
    - win: P(victoire) totale [0..1]
    - winSingle: P(victoire simple sans gammon)
    - winGammon: P(gammon exclusif, sans backgammon)
    - winBackgammon: P(backgammon)
    - loseSingle: P(défaite simple)
    - loseGammon: P(gammon adverse exclusif)
    - loseBackgammon: P(backgammon adverse)

    Champs cumulatifs explicites pour harmonisation complète :
    - winGammonCumulative: P(gammon ou backgammon) = winGammon + winBackgammon
    - loseGammonCumulative: P(gammon ou backgammon adverse) = loseGammon + loseBackgammon
    """

    win: float
    winSingle: float
    winGammon: float
    winBackgammon: float
    loseSingle: float
    loseGammon: float
    loseBackgammon: float
    winGammonCumulative: float | None = None
    loseGammonCumulative: float | None = None


class MoveAnalysis(BaseModel):
    """Un coup candidat classé."""

    rank: int
    board: list[int]
    equity: float
    equityDiff: float
    probabilities: Probabilities


class CubeDecision(BaseModel):
    """Analyse de la décision de videau."""

    noDouble: float
    doubleTake: float
    doublePass: float
    optimalAction: str


class AnalyzeResponse(BaseModel):
    """Réponse structurée, prête à être exploitée par un LLM."""

    bestMove: MoveAnalysis
    moves: list[MoveAnalysis]
    cubeDecision: CubeDecision


class BatchMatchPositionInput(BaseModel):
    """Position individuelle au sein d'un lot d'analyse de match post-partie."""

    turn_index: int = Field(..., ge=0, description="Indice chronologique de la décision dans le match")
    xgid: str | None = Field(None, description="Position au format XGID complet (optionnel si board fourni)")
    board: list[int] | None = Field(None, min_length=26, max_length=26, description="Board 26 entiers (optionnel si xgid fourni)")
    dice: list[int] | None = Field(None, min_length=2, max_length=2, description="Dés [d1, d2] (optionnel pour une décision de videau pure)")
    cube_value: int = Field(1, ge=1, description="Valeur du videau")
    cube_owner: str = Field("centered", description="Possession du videau : 'centered', 'player' ou 'opponent'")
    away1: int = Field(0, ge=0, description="Points restants pour le joueur au trait (0 = money game)")
    away2: int = Field(0, ge=0, description="Points restants pour l'adversaire (0 = money game)")
    played_board: list[int] | None = Field(None, min_length=26, max_length=26, description="Plateau résultant du coup effectivement joué")
    played_notation: str | None = Field(None, description="Notation du coup joué (alternative à played_board)")
    evaluate_cube: bool = Field(False, description="Indique s'il faut évaluer la décision de videau avant le lancer")


class BatchMatchEvaluationRequest(BaseModel):
    """Requête d'analyse post-match adaptative (1P -> 3P) en un seul aller-retour HTTP."""

    match_id: str = Field(..., min_length=1, max_length=128)
    positions: list[BatchMatchPositionInput] = Field(..., min_length=1, max_length=200)
    blunder_threshold: float = Field(0.080, ge=0.010, le=0.500)


class BatchPositionEvaluationResult(BaseModel):
    """Résultat d'analyse d'une décision individuelle dans le lot post-match."""

    turn_index: int
    settled_at_level: str
    best_move_notation: str | None = None
    best_move_equity: float
    played_move_equity: float | None = None
    equity_loss: float
    is_blunder: bool
    is_forced_move: bool
    optimal_cube_action: str | None = None
    chequer_play: list[LegacyMoveAnalysis] = []


class BatchMatchEvaluationResponse(BaseModel):
    """Réponse agrégée de l'analyse post-match en lot."""

    match_id: str
    total_positions: int
    settled_at_1p_count: int
    escalated_to_3p_count: int
    total_equity_loss: float
    performance_rating_pr: float
    positions: list[BatchPositionEvaluationResult]

