/**
 * Évaluateur Backgammon — calculs des probabilités, équités, coups et décisions de videau.
 *
 * Fournit l'implémentation de référence du modèle de neurones / heuristiques GNUBG
 * pour l'exécution embarquée (pure TypeScript sans dépendance I/O).
 */

import {
    BoardState,
    Move,
    MoveSequence,
    Player,
    applyMove,
    borneOffCount,
    generateLegalMoves,
    parseXGID,
    pipCount,
    serializeXGID,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../../engine/backgammonEngine';
import {
    Probabilities,
    EvaluateResult,
    MoveAnalysis,
    AnalyzeMovesResult,
    CubeDecisionResult,
    BestMoveResult,
} from './types';

/**
 * Formate un déplacement unique en notation standard de Backgammon (ex: "24/20", "bar/20", "6/off").
 * Les flèches sont numérotées de 1 à 24 du point de vue du joueur au trait.
 */
export function formatSingleMove(move: Move, player: Player): string {
    const fromStr =
        player === 'X'
            ? move.from === X_BAR
                ? 'bar'
                : String(move.from)
            : move.from === O_BAR
                ? 'bar'
                : String(25 - move.from);

    const toStr =
        player === 'X'
            ? move.to === X_OFF
                ? 'off'
                : String(move.to)
            : move.to === O_OFF
                ? 'off'
                : String(25 - move.to);

    return `${fromStr}/${toStr}`;
}

/**
 * Formate une séquence complète de coups (ex: "24/20 13/11").
 */
export function formatMoveSequenceNotation(moves: Move[], player: Player): string {
    if (moves.length === 0) return 'Pass';
    return moves.map((m) => formatSingleMove(m, player)).join(' ');
}

/**
 * Formate un déplacement unique en numérotation ABSOLUE (1-24, la même que le
 * plateau), indépendamment du joueur au trait. Utile pour afficher les coups de
 * l'adversaire dans le log avec la même numérotation que le plateau visuel.
 */
export function formatSingleMoveAbsolute(move: Move, player: Player): string {
    const fromStr =
        move.from === X_BAR || move.from === O_BAR
            ? 'bar'
            : String(move.from);
    const toStr =
        move.to === X_OFF || move.to === O_OFF
            ? 'off'
            : String(move.to);
    return `${fromStr}/${toStr}`;
}

/**
 * Formate une séquence complète de coups en numérotation absolue (1-24).
 */
export function formatMoveSequenceNotationAbsolute(moves: Move[], player: Player): string {
    if (moves.length === 0) return 'Pass';
    return moves.map((m) => formatSingleMoveAbsolute(m, player)).join(' ');
}

/**
 * Formate une séquence complète de coups en marquant les frappes (hits) d'un
 * astérisque `*`, conformément à la notation standard de Backgammon.
 *
 * Une frappe survient quand la destination `to` contient exactement un pion
 * adverse (blot). Le plateau `board` est celui AVANT l'application de la
 * séquence ; il est mis à jour au fil des coups pour détecter les frappes
 * successives (ex: "13/7* 7/5").
 *
 * @param moves   Séquence de coups à formater.
 * @param player  Joueur au trait (perspective de la notation).
 * @param board   Plateau initial (26 entiers) avant la séquence.
 */
export function formatMoveSequenceNotationWithHits(
    moves: Move[],
    player: Player,
    board: number[],
): string {
    if (moves.length === 0) return 'Pass';
    let currentBoard = board.slice();
    const tokens: string[] = [];
    for (const m of moves) {
        const token = formatSingleMove(m, player);
        // Détection de frappe : la destination contient un blot adverse.
        const isHit =
            m.to !== X_OFF &&
            m.to !== O_OFF &&
            (player === 'X' ? currentBoard[m.to] === -1 : currentBoard[m.to] === 1);
        tokens.push(isHit ? `${token}*` : token);
        currentBoard = applyMove(currentBoard, m, player);
    }
    return tokens.join(' ');
}

/**
 * Assure qu'on dispose d'un BoardState complet (parse le XGID si nécessaire).
 */
export function resolveBoardState(position: BoardState | string, fallbackPlayer?: Player): BoardState {
    if (typeof position === 'string') {
        const parsed = parseXGID(position);
        if (fallbackPlayer) parsed.turn = fallbackPlayer;
        return parsed;
    }
    return position;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Évalue les probabilités de gain et les équités d'une position selon les caractéristiques du plateau.
 */
export function evaluateBoard(
    state: BoardState,
    _ply: number = 2,
): { cubelessEquity: number; cubefulEquity: number; probabilities: Probabilities } {
    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    const pips = pipCount(state.board);
    const pipsPlayer = pips[player];
    const pipsOpponent = pips[opponent];
    const pipDiff = pipsPlayer - pipsOpponent; // Négatif = joueur en avance de course

    const offPlayer = borneOffCount(state.board, player);
    const offOpponent = borneOffCount(state.board, opponent);

    // Cas terminaux immédiats
    if (offPlayer >= 15) {
        const probs: Probabilities = {
            win: 1.0,
            winGammon: 0.2,
            winBackgammon: 0.02,
            loseWin: 0.0,
            loseGammon: 0.0,
            loseBackgammon: 0.0,
        };
        return { cubelessEquity: 1.0, cubefulEquity: 1.0, probabilities: probs };
    }
    if (offOpponent >= 15) {
        const probs: Probabilities = {
            win: 0.0,
            winGammon: 0.0,
            winBackgammon: 0.0,
            loseWin: 1.0,
            loseGammon: 0.2,
            loseBackgammon: 0.02,
        };
        return { cubelessEquity: -1.0, cubefulEquity: -1.0, probabilities: probs };
    }

    // Analyse structurelle
    let homePointsPlayer = 0;
    let homePointsOpponent = 0;
    let blotsPlayer = 0;
    let blotsOpponent = 0;

    for (let p = 1; p <= 24; p++) {
        const v = state.board[p];
        if (v === 1) blotsPlayer += player === 'X' ? 1 : 0;
        else if (v === -1) blotsOpponent += player === 'X' ? 1 : 0;
        else if (v > 1) {
            if (player === 'X') {
                if (p <= 6) homePointsPlayer++;
            } else {
                if (p <= 6) homePointsOpponent++;
            }
        } else if (v < -1) {
            if (player === 'O') {
                if (p >= 19) homePointsPlayer++;
            } else {
                if (p >= 19) homePointsOpponent++;
            }
        }
    }

    const barPlayer = player === 'X' ? state.board[X_BAR] : -state.board[O_BAR];
    const barOpponent = player === 'X' ? -state.board[O_BAR] : state.board[X_BAR];

    // Modèle logistique approché des réseaux de neurones GNUBG
    const z =
        -0.038 * pipDiff +
        0.18 * (homePointsPlayer - homePointsOpponent) -
        0.22 * (blotsPlayer - blotsOpponent) +
        0.35 * (barOpponent - barPlayer);

    const winProb = clamp(1 / (1 + Math.exp(-z)), 0.02, 0.98);
    const loseProb = 1 - winProb;

    let winGammon = 0;
    let loseGammon = 0;

    if (winProb > 0.5) {
        winGammon = clamp(
            (winProb - 0.5) * 0.45 * (1 + barOpponent * 0.35 + homePointsPlayer * 0.08),
            0.01,
            0.55,
        );
        loseGammon = clamp((0.5 - loseProb) * 0.15, 0.005, 0.2);
    } else {
        loseGammon = clamp(
            (loseProb - 0.5) * 0.45 * (1 + barPlayer * 0.35 + homePointsOpponent * 0.08),
            0.01,
            0.55,
        );
        winGammon = clamp((0.5 - winProb) * 0.15, 0.005, 0.2);
    }

    const winBackgammon = clamp(winGammon * 0.04, 0, 0.05);
    const loseBackgammon = clamp(loseGammon * 0.04, 0, 0.05);

    const probabilities: Probabilities = {
        win: Number(winProb.toFixed(4)),
        winGammon: Number(winGammon.toFixed(4)),
        winBackgammon: Number(winBackgammon.toFixed(4)),
        loseWin: Number(loseProb.toFixed(4)),
        loseGammon: Number(loseGammon.toFixed(4)),
        loseBackgammon: Number(loseBackgammon.toFixed(4)),
    };

    const cubelessEquity = Number(
        (
            winProb -
            loseProb +
            (winGammon - loseGammon) +
            (winBackgammon - loseBackgammon)
        ).toFixed(4),
    );

    // Ajustement cubeful
    let cubefulEquity = cubelessEquity;
    if (state.cubeOwner === null) {
        cubefulEquity = cubelessEquity * 1.08;
    } else if (state.cubeOwner === player) {
        cubefulEquity = cubelessEquity + 0.12 * (1 - Math.abs(cubelessEquity));
    } else {
        cubefulEquity = cubelessEquity - 0.12 * (1 - Math.abs(cubelessEquity));
    }
    cubefulEquity = Number(clamp(cubefulEquity, -3.0, 3.0).toFixed(4));

    return {
        cubelessEquity,
        cubefulEquity,
        probabilities,
    };
}

/**
 * Analyse exhaustivement les coups légaux possibles et les classe par équité.
 */
export function analyzeBoardMoves(
    state: BoardState,
    dice: [number, number],
    options: { candidateMoves?: MoveSequence[]; ply?: number; maxMoves?: number } = {},
): AnalyzeMovesResult {
    const xgid = serializeXGID(state);
    const candidateSeqs = options.candidateMoves ?? generateLegalMoves(state, dice);

    if (candidateSeqs.length === 0) {
        return {
            xgid,
            moves: [],
            bestMove: null,
            isWasm: false,
        };
    }

    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    // Évaluation de chaque séquence candidate
    const scoredCandidates: Array<{
        seq: MoveSequence;
        equity: number;
        probabilities: Probabilities;
        notation: string;
    }> = [];

    for (const seq of candidateSeqs) {
        // État résultant après le coup
        const resultingState: BoardState = {
            ...state,
            board: seq.board,
            turn: opponent, // Le tour passe à l'adversaire
            dice: null,
        };

        // On évalue la position du point de vue de l'adversaire puis on inverse l'équité
        const oppEval = evaluateBoard(resultingState, options.ply ?? 2);
        const playerEquity = -oppEval.cubefulEquity;

        // Inversion des probabilités pour le joueur au trait
        const playerProbs: Probabilities = {
            win: oppEval.probabilities.loseWin,
            winGammon: oppEval.probabilities.loseGammon,
            winBackgammon: oppEval.probabilities.loseBackgammon,
            loseWin: oppEval.probabilities.win,
            loseGammon: oppEval.probabilities.winGammon,
            loseBackgammon: oppEval.probabilities.winBackgammon,
        };

        scoredCandidates.push({
            seq,
            equity: Number(playerEquity.toFixed(4)),
            probabilities: playerProbs,
            notation: formatMoveSequenceNotation(seq.moves, player),
        });
    }

    // Tri décroissant par équité
    scoredCandidates.sort((a, b) => b.equity - a.equity);

    const bestEquity = scoredCandidates[0].equity;
    const maxMoves = options.maxMoves ?? 5;
    const sliced = scoredCandidates.slice(0, maxMoves);

    const moves: MoveAnalysis[] = sliced.map((item, index) => ({
        rank: index + 1,
        notation: item.notation,
        equity: item.equity,
        equityLoss: Number((item.equity - bestEquity).toFixed(4)),
        probabilities: item.probabilities,
        moves: item.seq.moves,
        board: item.seq.board,
    }));

    return {
        xgid,
        moves,
        bestMove: moves[0] ?? null,
        isWasm: false,
    };
}

/**
 * Analyse la décision de videau pour la position donnée.
 */
export function analyzeBoardCube(
    state: BoardState,
    options: {
        score?: { scoreX: number; scoreO: number; matchLength?: number };
        ply?: number;
    } = {},
): CubeDecisionResult {
    const xgid = serializeXGID(state);
    const evaluation = evaluateBoard(state, options.ply ?? 2);
    const winProb = evaluation.probabilities.win;
    const equity = evaluation.cubefulEquity;

    // Calcul des valeurs de décision
    const noDouble = Number(equity.toFixed(4));
    const doubleTake = Number(clamp(2 * evaluation.cubelessEquity - 0.15, -2.0, 2.0).toFixed(4));
    const doublePass = 1.0;

    let optimalAction = 'No double, take';

    // Règle de Crawford : le videau est gelé
    if (state.crawford) {
        optimalAction = 'No double (Crawford rule)';
    } else if (winProb < 0.68 || equity < 0.4) {
        optimalAction = 'No double, take';
    } else if (winProb >= 0.68 && winProb < 0.79) {
        optimalAction = 'Double, take';
    } else if (winProb >= 0.79 && evaluation.probabilities.winGammon < 0.32) {
        optimalAction = 'Double, pass';
    } else {
        optimalAction = 'Too good to double, pass';
    }

    return {
        xgid,
        noDouble,
        doubleTake,
        doublePass,
        optimalAction,
        isWasm: false,
    };
}

/**
 * Détermine le meilleur coup pour la position et les dés fournis.
 */
export function findBestBoardMove(
    state: BoardState,
    dice: [number, number],
    ply: number = 2,
): BestMoveResult | null {
    const result = analyzeBoardMoves(state, dice, { ply, maxMoves: 1 });
    if (!result.bestMove || !result.bestMove.moves || !result.bestMove.board) {
        return null;
    }

    return {
        xgid: result.xgid,
        notation: result.bestMove.notation,
        sequence: {
            moves: result.bestMove.moves,
            board: result.bestMove.board,
        },
        equity: result.bestMove.equity,
        rank: 1,
        isWasm: false,
    };
}
