"""API FastAPI d'analyse de positions de backgammon via le moteur Open Sage (bgsage)."""

from collections import OrderedDict
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
    BatchMatchEvaluationRequest,
    BatchMatchEvaluationResponse,
    BatchMatchPositionInput,
    BatchPositionEvaluationResult,
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


_EVAL_LRU_CACHE: OrderedDict[tuple, EvaluateResponse] = OrderedDict()
_EVAL_LRU_MAX_SIZE = 4096


@app.post("/api/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest):
    """Endpoint compatible avec le contrat du frontend Next.js (avec cache LRU et criblage rapide 2P -> 3P)."""
    try:
        board = xgid_to_board(req.xgid)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    (die1, die2), cube_value, cube_owner, away1, away2 = _extract_xgid_metadata(req.xgid)
    norm_d1, norm_d2 = (die1, die2) if die1 >= die2 else (die2, die1)
    cache_key = (tuple(board), norm_d1, norm_d2, cube_value, cube_owner, away1, away2, req.ply)

    cached = _EVAL_LRU_CACHE.get(cache_key)
    if cached is not None:
        _EVAL_LRU_CACHE.move_to_end(cache_key)
        return cached

    try:
        analyzer = _get_analyzer(req.ply)
        has_dice = die1 > 0 and die2 > 0
        if has_dice:
            if req.ply >= 3:
                analyzer_2p = _get_analyzer(2)
                checker_2p = analyzer_2p.checker_play(
                    board,
                    die1,
                    die2,
                    cube_value=cube_value,
                    cube_owner=cube_owner,
                    away1=away1,
                    away2=away2,
                    include_game_plans=True,
                )
                moves_2p = list(checker_2p.moves)
                if len(moves_2p) <= 1 or abs(moves_2p[0].equity - moves_2p[1].equity) >= 0.060:
                    checker = checker_2p
                else:
                    checker = analyzer.checker_play(
                        board,
                        die1,
                        die2,
                        cube_value=cube_value,
                        cube_owner=cube_owner,
                        away1=away1,
                        away2=away2,
                        include_game_plans=True,
                    )
            else:
                checker = analyzer.checker_play(
                    board,
                    die1,
                    die2,
                    cube_value=cube_value,
                    cube_owner=cube_owner,
                    away1=away1,
                    away2=away2,
                    include_game_plans=True,
                )
        else:
            checker = None

        cube_analyzer = _get_analyzer(1) if has_dice else analyzer
        cube = cube_analyzer.cube_action(
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

    resp_obj = EvaluateResponse(
        chequerPlay=chequer_play,
        cubeDecision=cube_decision,
        gamePlans=GamePlans(player=game_plans.player, opponent=game_plans.opponent),
        isRace=race,
    )
    _EVAL_LRU_CACHE[cache_key] = resp_obj
    if len(_EVAL_LRU_CACHE) > _EVAL_LRU_MAX_SIZE:
        _EVAL_LRU_CACHE.popitem(last=False)
    return resp_obj


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


def _resolve_batch_position(
    pos: BatchMatchPositionInput,
) -> tuple[list[int], tuple[int, int], int, str, int, int]:
    """Résout le plateau bgsage et les métadonnées (dés, videau, scores away) d'une position de lot."""
    if pos.xgid:
        board = xgid_to_board(pos.xgid)
        dice, cube_value, cube_owner, away1, away2 = _extract_xgid_metadata(pos.xgid)
        if pos.dice is not None:
            dice = (pos.dice[0], pos.dice[1])
        return board, dice, cube_value, cube_owner, away1, away2
    if pos.board is not None:
        if pos.cube_owner not in ("centered", "player", "opponent"):
            raise ValueError("cube_owner doit être 'centered', 'player' ou 'opponent'")
        board = gnubg_board_to_bgsage(pos.board)
        dice = (pos.dice[0], pos.dice[1]) if pos.dice else (0, 0)
        return board, dice, pos.cube_value, pos.cube_owner, pos.away1, pos.away2
    raise ValueError("Chaque position doit fournir 'xgid' ou 'board'")


def _find_played_move(
    before_board: list[int],
    moves: list,
    played_board: list[int] | None,
    played_notation: str | None,
):
    """Identifie le coup joué parmi les coups légaux retournés par bgsage."""
    if not moves:
        return None
    converted_played = gnubg_board_to_bgsage(played_board) if played_board is not None else None
    for m in moves:
        after_b = list(m.board)
        if played_board is not None and (after_b == played_board or after_b == converted_played):
            return m
        if played_notation is not None and board_to_notation(before_board, after_b) == played_notation:
            return m
    return moves[0]


def _serialize_legacy_moves(before_board: list[int], moves: list) -> list[LegacyMoveAnalysis]:
    """Convertit la liste des coups bgsage au format LegacyMoveAnalysis."""
    out: list[LegacyMoveAnalysis] = []
    for i, m in enumerate(moves):
        after_board = list(m.board)
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
        out.append(
            LegacyMoveAnalysis(
                rank=i + 1,
                notation=board_to_notation(before_board, after_board),
                equity=m.equity,
                equityLoss=m.equity_diff,
                probabilities=legacy_probs,
                board=after_board,
                playerGamePlan=getattr(m, "player_game_plan", None),
                opponentGamePlan=getattr(m, "opponent_game_plan", None),
                cubelessEquity=getattr(m, "cubeless_equity", None),
                evalLevel=getattr(m, "eval_level", None),
            )
        )
    return out


@app.post("/api/evaluate-match-batch", response_model=BatchMatchEvaluationResponse)
def evaluate_match_batch(req: BatchMatchEvaluationRequest):
    """Pipeline d'analyse post-match adaptatif en 2 passes (1P -> 3P) en un seul appel HTTP."""
    resolved_inputs: list[tuple[BatchMatchPositionInput, list[int], tuple[int, int], int, str, int, int]] = []
    for pos in req.positions:
        try:
            board, dice, cube_value, cube_owner, away1, away2 = _resolve_batch_position(pos)
            resolved_inputs.append((pos, board, dice, cube_value, cube_owner, away1, away2))
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    try:
        analyzer_1p = _get_analyzer(1)
        analyzer_3p = _get_analyzer(3)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur d'initialisation bgsage : {exc}")

    results_by_turn: list[BatchPositionEvaluationResult] = []
    settled_1p_count = 0
    escalated_3p_count = 0
    total_equity_loss = 0.0
    non_forced_decisions = 0

    for pos, board, (die1, die2), cube_value, cube_owner, away1, away2 in resolved_inputs:
        try:
            optimal_cube_action: str | None = None
            if pos.evaluate_cube or die1 <= 0 or die2 <= 0:
                cube_1p = analyzer_1p.cube_action(board, cube_value, cube_owner, away1=away1, away2=away2)
                margin_nd_dt = abs(cube_1p.equity_nd - cube_1p.equity_dt)
                if margin_nd_dt < 0.060:
                    cube_3p = analyzer_3p.cube_action(board, cube_value, cube_owner, away1=away1, away2=away2)
                    optimal_cube_action = cube_3p.optimal_action
                else:
                    optimal_cube_action = cube_1p.optimal_action

            if die1 <= 0 or die2 <= 0:
                settled_1p_count += 1
                results_by_turn.append(
                    BatchPositionEvaluationResult(
                        turn_index=pos.turn_index,
                        settled_at_level="1ply",
                        best_move_notation=None,
                        best_move_equity=0.0,
                        played_move_equity=0.0,
                        equity_loss=0.0,
                        is_blunder=False,
                        is_forced_move=True,
                        optimal_cube_action=optimal_cube_action,
                        chequer_play=[],
                    )
                )
                continue

            # Passe 1 : Criblage rapide 1-ply
            res_1p = analyzer_1p.checker_play(
                board,
                die1,
                die2,
                cube_value=cube_value,
                cube_owner=cube_owner,
                away1=away1,
                away2=away2,
                include_game_plans=False,
            )
            moves_1p = list(res_1p.moves)
            if not moves_1p:
                settled_1p_count += 1
                results_by_turn.append(
                    BatchPositionEvaluationResult(
                        turn_index=pos.turn_index,
                        settled_at_level="1ply",
                        best_move_notation="Pass",
                        best_move_equity=0.0,
                        played_move_equity=0.0,
                        equity_loss=0.0,
                        is_blunder=False,
                        is_forced_move=True,
                        optimal_cube_action=optimal_cube_action,
                        chequer_play=[],
                    )
                )
                continue

            is_forced = len(moves_1p) == 1
            best_1p = moves_1p[0]
            delta_top2 = abs(best_1p.equity - moves_1p[1].equity) if len(moves_1p) >= 2 else 999.0
            played_1p = _find_played_move(board, moves_1p, pos.played_board, pos.played_notation)
            loss_1p = abs(best_1p.equity - played_1p.equity) if played_1p is not None else 0.0

            # Critère de filtrage 1P : coup forcé OU coup optimal évident (marge > 0.050) effectivement joué
            if is_forced or (delta_top2 > 0.050 and loss_1p < 1e-6):
                settled_1p_count += 1
                if not is_forced:
                    non_forced_decisions += 1
                best_notation = board_to_notation(board, list(best_1p.board))
                results_by_turn.append(
                    BatchPositionEvaluationResult(
                        turn_index=pos.turn_index,
                        settled_at_level="1ply",
                        best_move_notation=best_notation,
                        best_move_equity=round(float(best_1p.equity), 4),
                        played_move_equity=round(float(played_1p.equity if played_1p else best_1p.equity), 4),
                        equity_loss=0.0,
                        is_blunder=False,
                        is_forced_move=is_forced,
                        optimal_cube_action=optimal_cube_action,
                        chequer_play=_serialize_legacy_moves(board, moves_1p[:5]),
                    )
                )
                continue

            # Passe 2 : Escalade profonde 3-ply sur les décisions litigieuses ou erreurs
            escalated_3p_count += 1
            non_forced_decisions += 1
            res_3p = analyzer_3p.checker_play(
                board,
                die1,
                die2,
                cube_value=cube_value,
                cube_owner=cube_owner,
                away1=away1,
                away2=away2,
                include_game_plans=True,
            )
            moves_3p = list(res_3p.moves)
            best_3p = moves_3p[0]
            played_3p = _find_played_move(board, moves_3p, pos.played_board, pos.played_notation)
            loss_3p = max(0.0, float(best_3p.equity - (played_3p.equity if played_3p else best_3p.equity)))
            total_equity_loss += loss_3p

            results_by_turn.append(
                BatchPositionEvaluationResult(
                    turn_index=pos.turn_index,
                    settled_at_level="3ply",
                    best_move_notation=board_to_notation(board, list(best_3p.board)),
                    best_move_equity=round(float(best_3p.equity), 4),
                    played_move_equity=round(float(played_3p.equity if played_3p else best_3p.equity), 4),
                    equity_loss=round(loss_3p, 4),
                    is_blunder=loss_3p >= req.blunder_threshold,
                    is_forced_move=False,
                    optimal_cube_action=optimal_cube_action,
                    chequer_play=_serialize_legacy_moves(board, moves_3p[:5]),
                )
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Erreur batch bgsage au tour {pos.turn_index} : {exc}")

    avg_loss = (total_equity_loss / non_forced_decisions) if non_forced_decisions > 0 else 0.0
    pr = round(500.0 * avg_loss, 2)

    return BatchMatchEvaluationResponse(
        match_id=req.match_id,
        total_positions=len(results_by_turn),
        settled_at_1p_count=settled_1p_count,
        escalated_to_3p_count=escalated_3p_count,
        total_equity_loss=round(total_equity_loss, 4),
        performance_rating_pr=pr,
        positions=results_by_turn,
    )

