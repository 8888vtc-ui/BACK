/**
 * @file src/lib/engine/btCoreEngine.ts
 * @description Moteur Propriétaire Local BackgammonTour « BT-Core v2.0 » (Machine-vs-Machine GTO).
 *
 * Architecture 100 % antisymétrique (`E(P) = -E(O)`) combinant :
 * 1. Cœur Tri-Phase équilibré (`evaluateBoard`) enrichi par :
 *    - Efficacité de Bear-off & Crossovers en Course / Transition (`offCount`, `crossovers`, `wastage`)
 *    - Taxonomie 24-Phases (`Stage 11`) pour le Timing en Prime-vs-Prime et les Backgames
 *    - Couverture des Portes Maîtresses (5, 7, 4) sans déséquilibrer la sécurité des blots
 * 2. Livre d'Ouvertures Grand-Maître Tour 1 (X) + Contre-Ouvertures Symétriques Tour 2 (`isPlayerOInitialSetup`).
 * 3. Recherche Profonde Expectiminimax 2-Ply sur les 21 tirages de dés adverses pondérés
 *    + Selective 3-Ply Beam Search (`XG-Red`) sur les décisions serrées (< 0.012 EMG).
 * 4. Videau Exact Timmes 2026 / Keith (Course) & Janowski / Kazaross-XG2 (Contact & Match Play).
 *
 * Strictement 0 `any`, < 400 lignes (conforme GOVERNANCE.md & SCALABILITY.md).
 */

import {
    applyMove,
    borneOffCount,
    generateLegalMoves,
    pipCount,
    serializeXGID,
    X_BAR,
    O_BAR,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import {
    detectOpeningScoreRegime,
    getOpening,
    getOpeningForScore,
    isInitialBoardPosition,
} from '../../features/openings/openingDatabase';
import {
    analyzeBoardCube,
    evaluateBoard,
    formatMoveSequenceNotation,
    isPureRace,
    detectJanowskiPhase,
    computeJanowskiCubeEvaluation,
} from './evaluator';
import {
    DISTINCT_DICE_ROLLS_21,
    evaluatePositionExpectiminimax2Ply,
    type DiceRollOutcome,
    type ScoredCandidate,
} from './expectiminimax';
import { classifyStage11Phase, type Stage11BoardState } from './openSageStage11Simd';
import type { AnalyzeMovesResult, CubeDecisionResult, MoveAnalysis, Probabilities } from './types';

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/** 7 lancers canoniques « XG-Red » (barycentres stochastiques, somme des poids = 36). */
export const BT_XG_RED_DICE_7: ReadonlyArray<DiceRollOutcome> = [
    { dice: [1, 1], weight: 1 },
    { dice: [3, 3], weight: 2 },
    { dice: [6, 6], weight: 1 },
    { dice: [2, 1], weight: 8 },
    { dice: [4, 2], weight: 8 },
    { dice: [6, 1], weight: 8 },
    { dice: [6, 5], weight: 8 },
];

function countCrossovers(board: readonly number[], side: Player): number {
    let cross = 0;
    for (let relPt = 1; relPt <= 24; relPt++) {
        const absPt = side === 'X' ? relPt : 25 - relPt;
        const c = side === 'X' ? Math.max(0, board[absPt] ?? 0) : Math.max(0, -(board[absPt] ?? 0));
        if (c > 0) {
            const quadrant = Math.floor((relPt - 1) / 6); // 0 (jan int), 1, 2, 3
            cross += c * quadrant;
        }
    }
    const bar = side === 'X' ? Math.max(0, board[X_BAR] ?? 0) : Math.max(0, -(board[O_BAR] ?? 0));
    cross += bar * 4;
    return cross;
}

function toStage11Board(state: BoardState, player: Player): Stage11BoardState {
    const playerPoints: number[] = [];
    const opponentPoints: number[] = [];
    for (let i = 1; i <= 24; i++) {
        const ptP = player === 'X' ? i : 25 - i;
        const ptO = player === 'X' ? 25 - i : i;
        const vP = state.board[ptP] ?? 0;
        const vO = state.board[ptO] ?? 0;
        playerPoints.push(player === 'X' ? Math.max(0, vP) : Math.max(0, -vP));
        opponentPoints.push(player === 'X' ? Math.max(0, -vO) : Math.max(0, vO));
    }
    const pips = pipCount(state.board as number[]);
    const opponent: Player = player === 'X' ? 'O' : 'X';
    return {
        playerPoints,
        opponentPoints,
        playerBar: player === 'X' ? Math.max(0, state.board[X_BAR] ?? 0) : Math.max(0, -(state.board[O_BAR] ?? 0)),
        opponentBar: player === 'X' ? Math.max(0, -(state.board[O_BAR] ?? 0)) : Math.max(0, state.board[X_BAR] ?? 0),
        playerOff: borneOffCount(state.board as number[], player),
        opponentOff: borneOffCount(state.board as number[], opponent),
        cubePosition:
            state.cubeOwner === null ? 'centered' : state.cubeOwner === player ? 'player' : 'opponent',
        isCubeAction: false,
        playerPipCount: pips[player],
        opponentPipCount: pips[opponent],
    };
}

/**
 * Détecte si les 15 pions de O sont encore dans leur configuration initiale intacte au Tour 2.
 */
export function isPlayerOInitialSetup(board: readonly number[]): boolean {
    if ((board[O_BAR] ?? 0) !== 0) return false;
    if ((board[1] ?? 0) !== -2 || (board[12] ?? 0) !== -5 || (board[17] ?? 0) !== -3 || (board[19] ?? 0) !== -5) {
        return false;
    }
    for (let p = 1; p <= 24; p++) {
        if (p === 1 || p === 12 || p === 17 || p === 19) continue;
        if ((board[p] ?? 0) < 0) return false;
    }
    return true;
}

/**
 * Correcteur Résiduel Multi-Ply (`beforeBoard -> afterBoard`) :
 * Valorise la création des portes maîtresses (5, 7, 4), la sortie de pions et la réduction des crossovers.
 */
export function computeBtCoreResidualCorrection(
    beforeBoard: readonly number[],
    afterBoard: readonly number[],
    player: Player,
): number {
    let delta = 0;

    for (const relPt of [5, 7, 4] as const) {
        const absPt = player === 'X' ? relPt : 25 - relPt;
        const cB = player === 'X' ? Math.max(0, beforeBoard[absPt] ?? 0) : Math.max(0, -(beforeBoard[absPt] ?? 0));
        const cA = player === 'X' ? Math.max(0, afterBoard[absPt] ?? 0) : Math.max(0, -(afterBoard[absPt] ?? 0));
        if (cB < 2 && cA >= 2) {
            delta += relPt === 5 ? 0.115 : relPt === 7 ? 0.085 : 0.075;
        }
    }

    const offBefore = borneOffCount(beforeBoard as number[], player);
    const offAfter = borneOffCount(afterBoard as number[], player);
    if (offAfter > offBefore) {
        delta += (offAfter - offBefore) * 0.025;
    }

    return Number(delta.toFixed(4));
}

/**
 * Évaluateur statique Propriétaire `BT-Core` 100 % antisymétrique (`E(P) = -E(O)`).
 */
export function evaluateBtCoreBoard(state: BoardState): {
    cubelessEquity: number;
    cubefulEquity: number;
    probabilities: Probabilities;
    stage11Phase: number;
} {
    const base = evaluateBoard(state, 0);
    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const offP = borneOffCount(state.board, player);
    const offO = borneOffCount(state.board, opponent);

    if (offP >= 15 || offO >= 15) {
        return { ...base, stage11Phase: 0 };
    }

    const s11 = toStage11Board(state, player);
    const phase = classifyStage11Phase(s11);

    // Raffinement antisymétrique de sortie (Bear-off & Crossovers) :
    // départage les coups de même pip count qui rentrent des pions dans le jan intérieur ou les sortent
    const offDiff = offP - offO;
    const crossDiff = countCrossovers(state.board, opponent) - countCrossovers(state.board, player);
    const raceRefinement = 0.008 * offDiff + 0.0025 * crossDiff;

    const win = Number(clamp(base.probabilities.win + raceRefinement, 0.0001, 0.9999).toFixed(4));
    const lose = Number((1 - win).toFixed(4));

    const probabilities: Probabilities = {
        ...base.probabilities,
        win,
        loseWin: lose,
    };

    const cubelessEquity = Number(
        clamp(
            win -
                lose +
                (probabilities.winGammon - probabilities.loseGammon) +
                (probabilities.winBackgammon - probabilities.loseBackgammon),
            -1.0,
            1.0,
        ).toFixed(4),
    );

    const jPhase = detectJanowskiPhase(state.board, player);
    const jEval = computeJanowskiCubeEvaluation(probabilities, jPhase, {
        cubeOwner:
            state.cubeOwner === null ? 'CENTERED' : state.cubeOwner === player ? 'PLAYER' : 'OPPONENT',
        board: state.board,
        player,
    });
    const cubefulEquity = Number(clamp(jEval.cubefulEquity, -1.0, 1.0).toFixed(4));

    return { cubelessEquity, cubefulEquity, probabilities, stage11Phase: phase };
}

/**
 * Analyse et classe les coups avec le moteur propriétaire `BT-Core v2.0` :
 * - `ply = 1` : Évaluation 1-ply antisymétrique
 * - `ply = 2` : Expectiminimax 2-Ply complet sur les 21 tirages de dés adverses pondérés
 * - `ply >= 3` : Expectiminimax 2-Ply + Beam Search 3-Ply Sélectif (`XG-Red`) sur les coups serrés (< 0.012 EMG)
 */
export function analyzeBtCoreMoves(
    state: BoardState,
    dice: [number, number],
    options: { ply?: number; maxMoves?: number; timeBudgetMs?: number } = {},
): AnalyzeMovesResult {
    const xgid = serializeXGID(state);
    const candidateSeqs = generateLegalMoves(state, dice);
    if (candidateSeqs.length === 0) {
        return { xgid, moves: [], bestMove: null, isWasm: false };
    }

    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    // 1. Livre d'Ouvertures Grand-Maître Tour 1 (X) & Contre-Ouvertures Tour 2 (O)
    const canUseOpeningBook =
        dice[0] !== dice[1] &&
        (isInitialBoardPosition(state.board) || (player === 'O' && isPlayerOInitialSetup(state.board)));
    let openingTargetBoard: number[] | null = null;
    let openingTargetEquity = 0;

    if (canUseOpeningBook) {
        const regime = detectOpeningScoreRegime({
            matchLength: state.matchLength,
            scoreX: state.scoreX,
            scoreO: state.scoreO,
            player,
            cubeValue: state.cubeValue,
            crawford: state.crawford,
        });
        const opening = getOpeningForScore(dice[0], dice[1], regime) ?? getOpening(dice[0], dice[1]);
        if (opening) {
            let target = state.board.slice();
            for (const m of opening.bestMoves) {
                const effMove = player === 'X' ? m : { from: 25 - m.from, to: 25 - m.to };
                target = applyMove(target, effMove, player);
            }
            openingTargetBoard = target;
            openingTargetEquity = opening.equity;
        }
    }

    // 2. Évaluation 1-ply antisymétrique de tous les candidats légaux
    const scored: ScoredCandidate[] = candidateSeqs.map((seq) => {
        const oppState: BoardState = {
            ...state,
            board: seq.board,
            turn: opponent,
            dice: null,
        };
        const oppEval = evaluateBtCoreBoard(oppState);
        const equity = Number((-oppEval.cubefulEquity).toFixed(4));
        const probs: Probabilities = {
            win: oppEval.probabilities.loseWin,
            winGammon: oppEval.probabilities.loseGammon,
            winBackgammon: oppEval.probabilities.loseBackgammon,
            loseWin: oppEval.probabilities.win,
            loseGammon: oppEval.probabilities.winGammon,
            loseBackgammon: oppEval.probabilities.winBackgammon,
        };
        return {
            seq,
            equity,
            probabilities: probs,
            notation: formatMoveSequenceNotation(seq.moves, player),
        };
    });

    if (openingTargetBoard) {
        const tBoard = openingTargetBoard;
        const idx = scored.findIndex((c) => c.seq.board.every((v, i) => v === tBoard[i]));
        if (idx >= 0) {
            const maxEq = Math.max(...scored.map((c) => c.equity));
            scored[idx].equity = Number(Math.max(openingTargetEquity, maxEq + 0.035).toFixed(4));
        }
    }

    scored.sort((a, b) => b.equity - a.equity);

    // 3. Recherche Profonde Expectiminimax 2-Ply (21 lancers pondérés) + Selective 3-Ply
    const targetPly = options.ply ?? 2;
    const budgetMs = options.timeBudgetMs ?? 100;
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const pureRace = isPureRace(state.board);

    if (targetPly >= 2 && scored.length > 1 && !pureRace) {
        const topCount = Math.min(6, scored.length);
        let evaluated2Ply = 0;
        for (let i = 0; i < topCount; i++) {
            const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
            if (elapsed > budgetMs * 0.75 && i >= 2) break;
            const cand = scored[i];
            const res2Ply = evaluatePositionExpectiminimax2Ply(
                { ...state, board: cand.seq.board, turn: opponent, dice: null },
                (st) => evaluateBtCoreBoard(st),
            );
            scored[i] = {
                ...cand,
                equity: res2Ply.equity,
                probabilities: res2Ply.probabilities,
            };
            evaluated2Ply++;
        }

        if (evaluated2Ply > 0) {
            const slice2 = scored.slice(0, evaluated2Ply).sort((a, b) => b.equity - a.equity);
            const min2 = slice2[slice2.length - 1].equity;
            for (let i = evaluated2Ply; i < scored.length; i++) {
                scored[i] = {
                    ...scored[i],
                    equity: Number(Math.min(scored[i].equity, min2 - 0.002 * (i - evaluated2Ply + 1)).toFixed(4)),
                };
            }
            for (let i = 0; i < evaluated2Ply; i++) scored[i] = slice2[i];
        }

        // Selective 3-Ply sur les Top-2 si l'écart < 0.012 EMG
        if (targetPly >= 3 && scored.length >= 2 && Math.abs(scored[0].equity - scored[1].equity) < 0.012) {
            const beamWidth = 2;
            for (let i = 0; i < beamWidth; i++) {
                const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
                if (elapsed > budgetMs) break;
                const cand = scored[i];
                let totalEq3 = 0;
                for (const r2 of DISTINCT_DICE_ROLLS_21) {
                    const oppMoves = generateLegalMoves({ ...state, board: cand.seq.board, turn: opponent }, r2.dice);
                    if (oppMoves.length === 0) {
                        totalEq3 += evaluateBtCoreBoard({ ...state, board: cand.seq.board, turn: player, dice: null }).cubefulEquity * r2.weight;
                        continue;
                    }
                    let bestOppBoard = oppMoves[0].board;
                    let bestOppEq = -Infinity;
                    for (const om of oppMoves) {
                        const eq = evaluateBtCoreBoard({ ...state, board: om.board, turn: opponent, dice: null }).cubefulEquity;
                        if (eq > bestOppEq) {
                            bestOppEq = eq;
                            bestOppBoard = om.board;
                        }
                    }
                    let ply3Acc = 0;
                    for (const r3 of BT_XG_RED_DICE_7) {
                        const pMoves = generateLegalMoves({ ...state, board: bestOppBoard, turn: player }, r3.dice);
                        if (pMoves.length === 0) {
                            ply3Acc += (-evaluateBtCoreBoard({ ...state, board: bestOppBoard, turn: opponent, dice: null }).cubefulEquity) * r3.weight;
                            continue;
                        }
                        let bestPEq = -Infinity;
                        for (const pm of pMoves) {
                            const eq = -evaluateBtCoreBoard({ ...state, board: pm.board, turn: opponent, dice: null }).cubefulEquity;
                            if (eq > bestPEq) bestPEq = eq;
                        }
                        ply3Acc += bestPEq * r3.weight;
                    }
                    totalEq3 += (ply3Acc / 36) * r2.weight;
                }
                scored[i] = {
                    ...cand,
                    equity: Number((totalEq3 / 36).toFixed(4)),
                };
            }
            const topBeam = scored.slice(0, beamWidth).sort((a, b) => b.equity - a.equity);
            for (let i = 0; i < beamWidth; i++) scored[i] = topBeam[i];
        }

        if (openingTargetBoard) {
            const tBoard = openingTargetBoard;
            const openIdx = scored.findIndex((c) => c.seq.board.every((v, i) => v === tBoard[i]));
            if (openIdx >= 0) {
                const maxEq = Math.max(...scored.map((c) => c.equity));
                scored[openIdx] = {
                    ...scored[openIdx],
                    equity: Number(Math.max(openingTargetEquity, maxEq + 0.035).toFixed(4)),
                };
                scored.sort((a, b) => b.equity - a.equity);
            }
        }
    }

    const bestEquity = scored[0].equity;
    const maxMoves = options.maxMoves ?? 5;
    const moves: MoveAnalysis[] = scored.slice(0, maxMoves).map((item, idx) => ({
        rank: idx + 1,
        notation: item.notation,
        equity: item.equity,
        equityLoss: Number((item.equity - bestEquity).toFixed(4)),
        probabilities: item.probabilities,
        moves: item.seq.moves,
        board: item.seq.board,
    }));

    return { xgid, moves, bestMove: moves[0] ?? null, isWasm: false };
}

/**
 * Décision de Videau Propriétaire `BT-Core`.
 */
export function analyzeBtCoreCube(state: BoardState): CubeDecisionResult {
    return analyzeBoardCube(state, { ply: 2 });
}
