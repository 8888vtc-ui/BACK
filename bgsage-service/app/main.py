"""API FastAPI d'analyse de positions de backgammon via le moteur Open Sage (bgsage)."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from bgsage import BgBotAnalyzer, classify_game_plans, is_race
except ImportError:  # Permet l'import du module pour les tests unitaires sans bgsage compilé
    BgBotAnalyzer = None  # type: ignore[assignment,misc]
    classify_game_plans = None  # type: ignore[assignment]
    is_race = None  # type: ignore[assignment]

from .models import (
    AnalyzeRequest,
    AnalyzeResponse,
    CubeDecision,
    EvaluateBoardRequest,
    EvaluateRequest,
    EvaluateResponse,
    GamePlans,
    LegacyCubeDecision,
    LegacyMoveAnalysis,
    LegacyProbabilities,
    MoveAnalysis,
    Probabilities,
    SelfPlayRequest,
)
from .notation import board_to_notation
from .xgid import gnubg_board_to_bgsage, xgid_to_board

app = FastAPI(
    title="Backgammon Open Sage Analysis API",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Analyseurs par niveau de bot (chargement des poids une seule fois au démarrage).
# 3 niveaux : Débutant (1-ply), Intermédiaire (2-ply), Expert (3-ply).
_ANALYZERS: dict[int, "BgBotAnalyzer"] = (
    {
        1: BgBotAnalyzer(eval_level="1ply"),
        2: BgBotAnalyzer(eval_level="2ply"),
        3: BgBotAnalyzer(eval_level="3ply"),
    }
    if BgBotAnalyzer is not None
    else {}
)


def _get_analyzer(ply: int) -> "BgBotAnalyzer":
    """Retourne l'analyseur correspondant au niveau demandé (borné à 1..3)."""
    if not _ANALYZERS:
        raise RuntimeError("Le moteur bgsage n'est pas installé dans cet environnement")
    clamped = max(1, min(3, ply))
    return _ANALYZERS[clamped]


def _to_probabilities(probs) -> Probabilities:
    """Convertit les probabilités bgsage (cumulatives) en probabilités simples exclusives et cumulatives."""
    win = probs.win
    win_backgammon = probs.backgammon_win
    win_gammon = probs.gammon_win - probs.backgammon_win
    win_single = win - probs.gammon_win

    lose = 1.0 - win
    lose_backgammon = probs.backgammon_loss
    lose_gammon = probs.gammon_loss - probs.backgammon_loss
    lose_single = lose - probs.gammon_loss

    return Probabilities(
        win=win,
        winSingle=win_single,
        winGammon=win_gammon,
        winBackgammon=win_backgammon,
        loseSingle=lose_single,
        loseGammon=lose_gammon,
        loseBackgammon=lose_backgammon,
        winGammonCumulative=probs.gammon_win,
        loseGammonCumulative=probs.gammon_loss,
    )


@app.get("/health")
def health():
    return {"status": "ok", "engine": "bgsage"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    try:
        board = xgid_to_board(req.board)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if req.cube_owner not in ("centered", "player", "opponent"):
        raise HTTPException(
            status_code=422,
            detail="cube_owner doit être 'centered', 'player' ou 'opponent'",
        )

    away1 = req.match_score.playerAway if req.match_score else 0
    away2 = req.match_score.opponentAway if req.match_score else 0

    try:
        analyzer = _get_analyzer(1)
        checker = analyzer.checker_play(
            board,
            req.dice[0],
            req.dice[1],
            cube_value=req.cube_value,
            cube_owner=req.cube_owner,
            away1=away1,
            away2=away2,
        )
        cube = analyzer.cube_action(
            board,
            req.cube_value,
            req.cube_owner,
            away1=away1,
            away2=away2,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur d'évaluation bgsage : {exc}")

    moves = [
        MoveAnalysis(
            rank=i + 1,
            board=list(m.board),
            equity=m.equity,
            equityDiff=m.equity_diff,
            probabilities=_to_probabilities(m.probs),
        )
        for i, m in enumerate(checker.moves)
    ]

    if not moves:
        raise HTTPException(status_code=500, detail="Aucun coup légal retourné par bgsage")

    cube_decision = CubeDecision(
        noDouble=cube.equity_nd,
        doubleTake=cube.equity_dt,
        doublePass=cube.equity_dp,
        optimalAction=cube.optimal_action,
    )

    return AnalyzeResponse(bestMove=moves[0], moves=moves, cubeDecision=cube_decision)


def _extract_xgid_metadata(xgid: str) -> tuple[tuple[int, int], int, str, int, int]:
    """Extrait les métadonnées (dés, videau, scores away) d'un XGID (format frontend 11 champs ou canonique 10 champs)."""
    xgid = xgid.strip()
    if xgid.startswith("XGID="):
        xgid = xgid[5:]
    _, _, fields = xgid.partition(":")
    parts = fields.split(":")

    dice: tuple[int, int] = (0, 0)
    if len(parts) > 3 and parts[3] and parts[3] not in ("0", "00", "D", "d"):
        dice_field = parts[3]
        if len(dice_field) == 1 and dice_field.isdigit():
            d = int(dice_field)
            dice = (d, d)
        elif len(dice_field) >= 2 and dice_field[0].isdigit() and dice_field[1].isdigit():
            dice = (int(dice_field[0]), int(dice_field[1]))

    # Format canonique XG (9 champs après body) vs Format frontend serializeXGID (10 champs après body)
    if len(parts) == 9:
        cube_exp = int(parts[0]) if parts[0].lstrip("-").isdigit() else 0
        cube_value = (1 << cube_exp) if cube_exp > 0 else 1
        raw_owner = int(parts[1]) if parts[1].lstrip("-").isdigit() else 0
        turn_dir = int(parts[2]) if parts[2].lstrip("-").isdigit() else 1
        player_on_roll = 0 if turn_dir >= 0 else 1
        if raw_owner == 1:
            cube_owner = "player" if player_on_roll == 0 else "opponent"
        elif raw_owner == -1:
            cube_owner = "player" if player_on_roll == 1 else "opponent"
        else:
            cube_owner = "centered"
        score_x = int(parts[4]) if parts[4].isdigit() else 0
        score_o = int(parts[5]) if parts[5].isdigit() else 0
        match_length = int(parts[7]) if parts[7].isdigit() else 0
    else:
        player_on_roll = int(parts[4]) if len(parts) > 4 and parts[4].lstrip("-").isdigit() else 0
        raw_cube = int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 1
        cube_value = raw_cube if raw_cube >= 1 else 1
        raw_owner = int(parts[6]) if len(parts) > 6 and parts[6].lstrip("-").isdigit() else 0
        if raw_owner == 1:
            cube_owner = "player" if player_on_roll == 0 else "opponent"
        elif raw_owner == 2 or raw_owner == -1:
            cube_owner = "player" if player_on_roll == 1 else "opponent"
        else:
            cube_owner = "centered"
        score_x = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        score_o = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
        match_length = int(parts[9]) if len(parts) > 9 and parts[9].isdigit() else 0

    if match_length > 0:
        away_x = max(1, match_length - score_x)
        away_o = max(1, match_length - score_o)
        away1 = away_x if player_on_roll == 0 else away_o
        away2 = away_o if player_on_roll == 0 else away_x
    else:
        away1, away2 = 0, 0

    return dice, cube_value, cube_owner, away1, away2


@app.post("/api/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    """Endpoint compatible avec le contrat du frontend Next.js."""
    try:
        board = xgid_to_board(req.xgid)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    (die1, die2), cube_value, cube_owner, away1, away2 = _extract_xgid_metadata(req.xgid)

    try:
        analyzer = _get_analyzer(req.ply)
        checker = (
            analyzer.checker_play(
                board,
                die1,
                die2,
                cube_value=cube_value,
                cube_owner=cube_owner,
                away1=away1,
                away2=away2,
                include_game_plans=True,
            )
            if die1 > 0 and die2 > 0
            else None
        )
        cube = analyzer.cube_action(
            board,
            cube_value,
            cube_owner,
            away1=away1,
            away2=away2,
        )
        game_plans = classify_game_plans(board)
        race = is_race(board)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur d'évaluation bgsage : {exc}")

    chequer_play: list[LegacyMoveAnalysis] = []
    if checker is not None:
        for i, m in enumerate(checker.moves):
            after_board = list(m.board)
            notation = board_to_notation(board, after_board)
            probs = m.probs
            legacy_probs = LegacyProbabilities(
                win=probs.win,
                winGammon=probs.gammon_win,
                winBackgammon=probs.backgammon_win,
                loseWin=1.0 - probs.win,
                loseGammon=probs.gammon_loss,
                loseBackgammon=probs.backgammon_loss,
                winGammonCumulative=probs.gammon_win,
                loseGammonCumulative=probs.gammon_loss,
                winGammonExclusive=probs.gammon_win - probs.backgammon_win,
                loseGammonExclusive=probs.gammon_loss - probs.backgammon_loss,
                winSingle=probs.win - probs.gammon_win,
                loseSingle=(1.0 - probs.win) - probs.gammon_loss,
            )
            chequer_play.append(
                LegacyMoveAnalysis(
                    rank=i + 1,
                    notation=notation,
                    equity=m.equity,
                    equityLoss=m.equity_diff,
                    probabilities=legacy_probs,
                    board=after_board,
                    playerGamePlan=m.player_game_plan,
                    opponentGamePlan=m.opponent_game_plan,
                    cubelessEquity=m.cubeless_equity,
                    evalLevel=m.eval_level,
                )
            )

    cube_decision = LegacyCubeDecision(
        noDouble=cube.equity_nd,
        doubleTake=cube.equity_dt,
        doublePass=cube.equity_dp,
        optimalAction=cube.optimal_action,
    )

    return EvaluateResponse(
        chequerPlay=chequer_play,
        cubeDecision=cube_decision,
        gamePlans=GamePlans(player=game_plans.player, opponent=game_plans.opponent),
        isRace=race,
    )


@app.post("/api/evaluate-board", response_model=EvaluateResponse)
def evaluate_board(req: EvaluateBoardRequest):
    """Endpoint acceptant un board (26 entiers) directement, sans XGID."""
    board = gnubg_board_to_bgsage(req.board)
    die1, die2 = req.dice[0], req.dice[1]

    try:
        analyzer = _get_analyzer(req.ply)
        checker = analyzer.checker_play(
            board,
            die1,
            die2,
            cube_value=1,
            cube_owner="centered",
            include_game_plans=True,
        )
        cube = analyzer.cube_action(board, 1, "centered")
        game_plans = classify_game_plans(board)
        race = is_race(board)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur d'évaluation bgsage : {exc}")

    chequer_play: list[LegacyMoveAnalysis] = []
    for i, m in enumerate(checker.moves):
        after_board = list(m.board)
        notation = board_to_notation(board, after_board)
        probs = m.probs
        legacy_probs = LegacyProbabilities(
            win=probs.win,
            winGammon=probs.gammon_win,
            winBackgammon=probs.backgammon_win,
            loseWin=1.0 - probs.win,
            loseGammon=probs.gammon_loss,
            loseBackgammon=probs.backgammon_loss,
            winGammonCumulative=probs.gammon_win,
            loseGammonCumulative=probs.gammon_loss,
            winGammonExclusive=probs.gammon_win - probs.backgammon_win,
            loseGammonExclusive=probs.gammon_loss - probs.backgammon_loss,
            winSingle=probs.win - probs.gammon_win,
            loseSingle=(1.0 - probs.win) - probs.gammon_loss,
        )
        chequer_play.append(
            LegacyMoveAnalysis(
                rank=i + 1,
                notation=notation,
                equity=m.equity,
                equityLoss=m.equity_diff,
                probabilities=legacy_probs,
                board=after_board,
                playerGamePlan=m.player_game_plan,
                opponentGamePlan=m.opponent_game_plan,
                cubelessEquity=m.cubeless_equity,
                evalLevel=m.eval_level,
            )
        )

    cube_decision = LegacyCubeDecision(
        noDouble=cube.equity_nd,
        doubleTake=cube.equity_dt,
        doublePass=cube.equity_dp,
        optimalAction=cube.optimal_action,
    )

    return EvaluateResponse(
        chequerPlay=chequer_play,
        cubeDecision=cube_decision,
        gamePlans=GamePlans(player=game_plans.player, opponent=game_plans.opponent),
        isRace=race,
    )


@app.post("/api/selfplay")
def selfplay(req: SelfPlayRequest):
    """Fait jouer deux bots (niveaux différents) l'un contre l'autre."""
    from bgsage import simulate_game

    player1 = _get_analyzer(req.player1_ply)
    player2 = _get_analyzer(req.player2_ply)

    results = []
    for i in range(req.games):
        try:
            game = simulate_game(
                seed=req.seed + i,
                players=(player1, player2),
            )
            results.append({
                "game": i + 1,
                "winner": game.get("winner"),
                "turns": len(game.get("turns", [])),
            })
        except Exception as exc:
            results.append({
                "game": i + 1,
                "error": str(exc),
            })

    return {
        "player1_ply": req.player1_ply,
        "player2_ply": req.player2_ply,
        "games": req.games,
        "results": results,
    }
