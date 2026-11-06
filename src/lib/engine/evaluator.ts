/**
 * @file src/lib/engine/evaluator.ts
 * @description Formatage de notation, classification de régime (RACE/CRASHED/CONTACT) et formules de course / videau (<= 380 lignes, 0 any).
 */

import {
    BoardState, Move, MoveSequence, Player, applyMove, borneOffCount,
    generateLegalMoves, parseXGID, pipCount, serializeXGID, X_BAR, O_BAR, X_OFF, O_OFF,
} from '../../engine/backgammonEngine';
import { Probabilities, MoveAnalysis, AnalyzeMovesResult, CubeDecisionResult, BestMoveResult } from './types';
import { bearoffExpectedRolls } from './bearoffTable';
import { evaluateKeithCube } from './keithCount';
import { countShotsExact } from './shotCounter';
import {
    calculateEffectivePipCount, evaluateRaceCube, evaluateIsightRace,
    computeTriceNormalWinProbability, MEAN_PIPS_PER_ROLL, isPureRace, isBearOffPhase,
    type EffectivePipResult, type RaceCubeEvaluation, type IsightRaceEvaluation,
} from './effectivePipCount';
import {
    computeJanowskiCubeEvaluation, detectJanowskiPhase, getCalibratedCubeEfficiency,
    type JanowskiCubeEvaluation, type JanowskiPositionPhase,
} from './janowskiCube';
import { refineTopCandidatesExpectiminimax2Ply } from './expectiminimax';
import { calculateTakePoint } from '../../features/coach/matchContext';
import { detectOpeningScoreRegime, getOpening, getOpeningForScore, isInitialBoardPosition } from '../../features/openings/openingDatabase';

export {
    calculateEffectivePipCount, evaluateRaceCube, evaluateIsightRace, computeTriceNormalWinProbability,
    MEAN_PIPS_PER_ROLL, isPureRace, isBearOffPhase, computeJanowskiCubeEvaluation, detectJanowskiPhase,
    getCalibratedCubeEfficiency, type EffectivePipResult, type RaceCubeEvaluation, type IsightRaceEvaluation,
    type JanowskiCubeEvaluation, type JanowskiPositionPhase,
};
export type { Probabilities } from './types';

export function formatSingleMove(move: Move, player: Player): string {
    const fromStr = player === 'X' ? (move.from === X_BAR ? 'bar' : String(move.from)) : (move.from === O_BAR ? 'bar' : String(25 - move.from));
    const toStr = player === 'X' ? (move.to === X_OFF ? 'off' : String(move.to)) : (move.to === O_OFF ? 'off' : String(25 - move.to));
    return `${fromStr}/${toStr}`;
}
export function formatMoveSequenceNotation(moves: Move[], player: Player): string {
    return moves.length === 0 ? 'Pass' : moves.map((m) => formatSingleMove(m, player)).join(' ');
}
export function formatSingleMoveAbsolute(move: Move, _player: Player): string {
    const fromStr = move.from === X_BAR || move.from === O_BAR ? 'bar' : String(move.from);
    const toStr = move.to === X_OFF || move.to === O_OFF ? 'off' : String(move.to);
    return `${fromStr}/${toStr}`;
}
export function formatMoveSequenceNotationAbsolute(moves: Move[], player: Player): string {
    return moves.length === 0 ? 'Pass' : moves.map((m) => formatSingleMoveAbsolute(m, player)).join(' ');
}
export function formatMoveSequenceNotationWithHits(moves: Move[], player: Player, board: number[]): string {
    if (moves.length === 0) return 'Pass';
    let currentBoard = board.slice();
    const tokens: string[] = [];
    for (const m of moves) {
        const token = formatSingleMove(m, player);
        const isHit = m.to !== X_OFF && m.to !== O_OFF && (player === 'X' ? currentBoard[m.to] === -1 : currentBoard[m.to] === 1);
        tokens.push(isHit ? `${token}*` : token);
        currentBoard = applyMove(currentBoard, m, player);
    }
    return tokens.join(' ');
}
export function resolveBoardState(position: BoardState | string, fallbackPlayer?: Player): BoardState {
    if (typeof position === 'string') {
        const parsed = parseXGID(position);
        if (fallbackPlayer) parsed.turn = fallbackPlayer;
        return parsed;
    }
    return position;
}

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
export type PositionRegime = 'RACE' | 'CRASHED' | 'CONTACT';
const KEY_POINT_WEIGHTS: Record<number, number> = { 1: 0.25, 2: 0.65, 3: 0.9, 4: 1.2, 5: 1.45, 6: 1.0, 7: 1.25 };

export function classifyPosition(board: number[]): PositionRegime {
    let furthestO = 0, furthestX = 25;
    for (let p = 1; p <= 24; p++) { if (board[p] < 0) { furthestO = p; break; } }
    for (let p = 24; p >= 1; p--) { if (board[p] > 0) { furthestX = p; break; } }
    if (furthestX <= furthestO && board[X_BAR] === 0 && board[O_BAR] === 0) return 'RACE';
    let xOnBoard = 0, oOnBoard = 0, xStackedLow = 0, oStackedLow = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v > 0) { xOnBoard += v; if (p <= 2) xStackedLow += v; }
        else if (v < 0) { oOnBoard += -v; if (p >= 23) oStackedLow += -v; }
    }
    return (xOnBoard <= 6 || xStackedLow > 7 || oOnBoard <= 6 || oStackedLow > 7) ? 'CRASHED' : 'CONTACT';
}

function getBearoffCounts(board: number[], player: Player): number[] | null {
    if (player === 'X') {
        if (board[X_BAR] > 0) return null;
        for (let pt = 7; pt <= 24; pt++) if (board[pt] > 0) return null;
        return [1, 2, 3, 4, 5, 6].map((i) => Math.max(0, board[i]));
    }
    if (board[O_BAR] < 0) return null;
    for (let pt = 1; pt <= 18; pt++) if (board[pt] < 0) return null;
    return [24, 23, 22, 21, 20, 19].map((i) => Math.max(0, -board[i]));
}

function evaluateRace(state: BoardState, player: Player, opponent: Player): { cubelessEquity: number; probabilities: Probabilities } {
    const offPlayer = borneOffCount(state.board, player), offOpponent = borneOffCount(state.board, opponent);
    const bearoffPlayer = getBearoffCounts(state.board, player), bearoffOpponent = getBearoffCounts(state.board, opponent);
    let winProb: number;
    if (offPlayer >= 15) winProb = 1.0;
    else if (offOpponent >= 15) winProb = 0.0;
    else if (bearoffPlayer !== null && bearoffOpponent !== null) {
        const expP = bearoffExpectedRolls(bearoffPlayer), expO = bearoffExpectedRolls(bearoffOpponent);
        if (expP <= 0) winProb = 1.0;
        else if (expO <= 0) winProb = 0.0;
        else {
            const z = (expO - expP + 0.5) / (Math.sqrt(Math.max(1, expP + expO)) * 0.45);
            winProb = clamp(1 / (1 + Math.exp(-2.2 * z)), 0.0001, 0.9999);
        }
    } else {
        const epcP = calculateEffectivePipCount(state.board, player), epcO = calculateEffectivePipCount(state.board, opponent);
        winProb = computeTriceNormalWinProbability({
            rollerEPC: epcP.epc, opponentEPC: epcO.epc, rollerRawPips: epcP.rawPips, opponentRawPips: epcO.rawPips,
        }).winProb;
    }
    const loseProb = 1 - winProb;
    const winGammon = offOpponent === 0 ? clamp((winProb - 0.5) * 0.35, 0, 0.4) : 0;
    const loseGammon = offPlayer === 0 ? clamp((loseProb - 0.5) * 0.35, 0, 0.4) : 0;
    const probabilities: Probabilities = {
        win: Number(winProb.toFixed(4)), winGammon: Number(winGammon.toFixed(4)), winBackgammon: 0,
        loseWin: Number(loseProb.toFixed(4)), loseGammon: Number(loseGammon.toFixed(4)), loseBackgammon: 0,
    };
    return { cubelessEquity: Number((winProb - loseProb + (winGammon - loseGammon)).toFixed(4)), probabilities };
}

function homeStrength(board: number[], player: Player): number {
    let s = 0;
    const [start, end] = player === 'X' ? [1, 6] : [19, 24];
    for (let p = start; p <= end; p++) if ((player === 'X' ? board[p] : -board[p]) >= 2) s++;
    return s;
}

function countShotsOnBlot(board: number[], point: number, player: Player, opponent: Player): number {
    const { total } = countShotsExact(board, point, opponent);
    const pipsAtRisk = player === 'X' ? 25 - point : point;
    return total * (0.15 + 0.85 * (pipsAtRisk / 24)) * (1 + homeStrength(board, opponent) * 0.15);
}

function primeAndTrapped(board: number[], player: Player): { longest: number; trapped: number } {
    let bestLen = 0, bestStart = -1, bestEnd = -1, curLen = 0, curStart = -1;
    for (let p = 1; p <= 24; p++) {
        if ((player === 'X' ? board[p] : -board[p]) >= 2) {
            if (curLen === 0) curStart = p;
            if (++curLen > bestLen) { bestLen = curLen; bestStart = curStart; bestEnd = p; }
        } else curLen = 0;
    }
    if (bestLen < 2) return { longest: bestLen, trapped: 0 };
    const primeFront = player === 'X' ? bestStart : bestEnd;
    let trapped = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if ((player === 'X' ? v < 0 : v > 0) && (player === 'X' ? p > primeFront : p < primeFront)) trapped += Math.abs(v);
    }
    return { longest: bestLen, trapped };
}

function evaluateContact(state: BoardState, player: Player, opponent: Player): { cubelessEquity: number; probabilities: Probabilities } {
    const board = state.board, pips = pipCount(board);
    let z = -0.02 * (pips[player] - pips[opponent]);
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (player === 'X' ? v === 1 : v === -1) z -= countShotsOnBlot(board, p, player, opponent) * 0.035;
        else if (opponent === 'X' ? v === 1 : v === -1) z += countShotsOnBlot(board, p, opponent, player) * 0.035;
    }
    const pPrime = primeAndTrapped(board, player), oPrime = primeAndTrapped(board, opponent);
    const primeScore = (pr: { longest: number; trapped: number }) =>
        pr.longest >= 5 && pr.trapped > 0 ? 0.45 + Math.min(0.4, (pr.longest - 5) * 0.2)
        : pr.longest >= 4 && pr.trapped > 0 ? 0.25 : pr.longest >= 2 ? pr.longest * 0.04 : 0;
    z += primeScore(pPrime) - primeScore(oPrime);

    let keyP = 0, keyO = 0, stackP = 0, stackO = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p], cX = Math.max(0, v), cO = Math.max(0, -v);
        if (cX >= 2) {
            const anchorX = p >= 20 && p <= 21 ? 0.28 : p >= 23 ? 0.08 : 0;
            z += player === 'X' ? anchorX : -anchorX;
            const wX = p <= 7 ? (KEY_POINT_WEIGHTS[p] ?? 1.0) : p <= 11 ? 0.45 - (p - 8) * 0.05 : p === 13 ? 0.55 : 0;
            if (player === 'X') keyP += wX; else keyO += wX;
        }
        if (cO >= 2) {
            const anchorO = p >= 4 && p <= 5 ? 0.28 : p <= 2 ? 0.08 : 0;
            z += player === 'O' ? anchorO : -anchorO;
            const revP = 25 - p;
            const wO = revP <= 7 ? (KEY_POINT_WEIGHTS[revP] ?? 1.0) : revP <= 11 ? 0.45 - (revP - 8) * 0.05 : revP === 13 ? 0.55 : 0;
            if (player === 'O') keyP += wO; else keyO += wO;
        }
        const cPlayer = player === 'X' ? cX : cO, cOpp = opponent === 'X' ? cX : cO;
        if (cPlayer > 5) stackP += 0.08 * (cPlayer - 5);
        if (cOpp > 5) stackO += 0.08 * (cOpp - 5);
        const relP = player === 'X' ? p : 25 - p, relO = opponent === 'X' ? p : 25 - p;
        if (relP === 1 && cPlayer > 2) stackP += 0.06 * (cPlayer - 2);
        else if (relP === 2 && cPlayer > 3) stackP += 0.04 * (cPlayer - 3);
        if (relO === 1 && cOpp > 2) stackO += 0.06 * (cOpp - 2);
        else if (relO === 2 && cOpp > 3) stackO += 0.04 * (cOpp - 3);
    }
    z += 0.22 * (keyP - keyO) + (stackO - stackP);

    const homeP = homeStrength(board, player), homeO = homeStrength(board, opponent);
    const backScaleP = oPrime.longest >= 4 ? 0.06 : 0.02 + homeO * 0.008;
    const backScaleO = pPrime.longest >= 4 ? 0.06 : 0.02 + homeP * 0.008;
    for (const p of player === 'X' ? [24, 23] : [1, 2]) {
        const c = player === 'X' ? Math.max(0, board[p]) : Math.max(0, -board[p]);
        if (c > 0) z -= backScaleP * c;
    }
    for (const p of opponent === 'X' ? [24, 23] : [1, 2]) {
        const c = opponent === 'X' ? Math.max(0, board[p]) : Math.max(0, -board[p]);
        if (c > 0) z += backScaleO * c;
    }

    const barP = player === 'X' ? board[X_BAR] : -board[O_BAR];
    const barO = opponent === 'X' ? board[X_BAR] : -board[O_BAR];
    z += barO * (0.25 + homeP * 0.06) - barP * (0.25 + homeO * 0.06);

    const winProb = clamp(1 / (1 + Math.exp(-z)), 0.02, 0.98), loseProb = 1 - winProb;
    const offP = borneOffCount(board, player), offO = borneOffCount(board, opponent);
    let winGammon = winProb > 0.5 ? clamp((winProb - 0.5) * 0.4 * (1 + barO * 0.3), 0.01, 0.5) : clamp((0.5 - winProb) * 0.12, 0.005, 0.15);
    let loseGammon = winProb > 0.5 ? clamp((0.5 - loseProb) * 0.12, 0.005, 0.15) : clamp((loseProb - 0.5) * 0.4 * (1 + barP * 0.3), 0.01, 0.5);
    if (offP >= 1) loseGammon = 0;
    if (offO >= 1) winGammon = 0;
    const winBackgammon = clamp(winGammon * 0.04, 0, 0.05), loseBackgammon = clamp(loseGammon * 0.04, 0, 0.05);

    const probabilities: Probabilities = {
        win: Number(winProb.toFixed(4)), winGammon: Number(winGammon.toFixed(4)), winBackgammon: Number(winBackgammon.toFixed(4)),
        loseWin: Number(loseProb.toFixed(4)), loseGammon: Number(loseGammon.toFixed(4)), loseBackgammon: Number(loseBackgammon.toFixed(4)),
    };
    const cubelessEquity = Number((winProb - loseProb + (winGammon - loseGammon) + (winBackgammon - loseBackgammon)).toFixed(4));
    return { cubelessEquity, probabilities };
}

export function evaluateBoard(
    state: BoardState, _ply: number = 2,
): { cubelessEquity: number; cubefulEquity: number; probabilities: Probabilities } {
    const player = state.turn, opponent: Player = player === 'X' ? 'O' : 'X';
    if (borneOffCount(state.board, player) >= 15) {
        return { cubelessEquity: 1.0, cubefulEquity: 1.0, probabilities: { win: 1.0, winGammon: 0.2, winBackgammon: 0.02, loseWin: 0.0, loseGammon: 0.0, loseBackgammon: 0.0 } };
    }
    if (borneOffCount(state.board, opponent) >= 15) {
        return { cubelessEquity: -1.0, cubefulEquity: -1.0, probabilities: { win: 0.0, winGammon: 0.0, winBackgammon: 0.0, loseWin: 1.0, loseGammon: 0.2, loseBackgammon: 0.02 } };
    }
    const base = classifyPosition(state.board) === 'RACE' ? evaluateRace(state, player, opponent) : evaluateContact(state, player, opponent);
    const janowskiEval = computeJanowskiCubeEvaluation(base.probabilities, detectJanowskiPhase(state.board, player), {
        cubeOwner: state.cubeOwner === null ? 'CENTERED' : state.cubeOwner === player ? 'PLAYER' : 'OPPONENT',
        board: state.board, player,
    });
    return {
        cubelessEquity: Number(clamp(base.cubelessEquity, -1.0, 1.0).toFixed(4)),
        cubefulEquity: Number(clamp(janowskiEval.cubefulEquity, -1.0, 1.0).toFixed(4)),
        probabilities: base.probabilities,
    };
}

export function analyzeBoardMoves(
    state: BoardState, dice: [number, number],
    options: { candidateMoves?: MoveSequence[]; ply?: number; maxMoves?: number } = {},
): AnalyzeMovesResult {
    const xgid = serializeXGID(state);
    const candidateSeqs = options.candidateMoves ?? generateLegalMoves(state, dice);
    if (candidateSeqs.length === 0) return { xgid, moves: [], bestMove: null, isWasm: false };
    const player = state.turn, opponent: Player = player === 'X' ? 'O' : 'X';
    const scoredCandidates = candidateSeqs.map((seq) => {
        const oppEval = evaluateBoard({ ...state, board: seq.board, turn: opponent, dice: null }, 0);
        return {
            seq, equity: Number((-oppEval.cubefulEquity).toFixed(4)),
            probabilities: {
                win: oppEval.probabilities.loseWin, winGammon: oppEval.probabilities.loseGammon, winBackgammon: oppEval.probabilities.loseBackgammon,
                loseWin: oppEval.probabilities.win, loseGammon: oppEval.probabilities.winGammon, loseBackgammon: oppEval.probabilities.winBackgammon,
            },
            notation: formatMoveSequenceNotation(seq.moves, player),
        };
    });

    let openingBestTargetBoard: number[] | null = null, openingTargetEquity = 0;
    if (isInitialBoardPosition(state.board) && dice[0] !== dice[1]) {
        const openingRegime = detectOpeningScoreRegime({
            matchLength: state.matchLength, scoreX: state.scoreX, scoreO: state.scoreO,
            player, cubeValue: state.cubeValue, crawford: state.crawford,
        });
        const opening = getOpeningForScore(dice[0], dice[1], openingRegime) ?? getOpening(dice[0], dice[1]);
        if (opening) {
            let bestTargetBoard = state.board.slice();
            for (const m of opening.bestMoves) {
                bestTargetBoard = applyMove(bestTargetBoard, player === 'X' ? m : { from: 25 - m.from, to: 25 - m.to }, player);
            }
            openingBestTargetBoard = bestTargetBoard;
            openingTargetEquity = opening.equity;
            const bestIdx = scoredCandidates.findIndex((c) => c.seq.board.every((val, i) => val === bestTargetBoard[i]));
            if (bestIdx >= 0) {
                const maxEvalEquity = Math.max(...scoredCandidates.map((c) => c.equity));
                scoredCandidates[bestIdx].equity = Number(Math.max(opening.equity, maxEvalEquity + 0.035).toFixed(4));
            }
        }
    }

    scoredCandidates.sort((a, b) => b.equity - a.equity);
    let refinedCandidates = scoredCandidates;
    if ((options.ply ?? 2) >= 2 && scoredCandidates.length > 1) {
        refinedCandidates = refineTopCandidatesExpectiminimax2Ply(
            state, scoredCandidates, (st) => evaluateBoard(st, 0), { maxCandidates: 6, timeBudgetMs: 110 },
        );
        if (openingBestTargetBoard) {
            const targetBoard = openingBestTargetBoard;
            const openIdx = refinedCandidates.findIndex((c) => c.seq.board.every((val, i) => val === targetBoard[i]));
            if (openIdx >= 0) {
                const maxRefinedEquity = Math.max(...refinedCandidates.map((c) => c.equity));
                refinedCandidates[openIdx] = {
                    ...refinedCandidates[openIdx],
                    equity: Number(Math.max(openingTargetEquity, maxRefinedEquity + 0.035).toFixed(4)),
                };
                refinedCandidates.sort((a, b) => b.equity - a.equity);
            }
        }
    }

    const bestEquity = refinedCandidates[0].equity;
    const moves: MoveAnalysis[] = refinedCandidates.slice(0, options.maxMoves ?? 5).map((item, index) => ({
        rank: index + 1, notation: item.notation, equity: item.equity,
        equityLoss: Number((item.equity - bestEquity).toFixed(4)),
        probabilities: item.probabilities, moves: item.seq.moves, board: item.seq.board,
    }));
    return { xgid, moves, bestMove: moves[0] ?? null, isWasm: false };
}

export function analyzeBoardCube(
    state: BoardState, options: { score?: { scoreX: number; scoreO: number; matchLength?: number }; ply?: number } = {},
): CubeDecisionResult {
    const xgid = serializeXGID(state), evaluation = evaluateBoard(state, options.ply ?? 2);
    const noDouble = Number(evaluation.cubefulEquity.toFixed(4)), cubelessEquity = evaluation.cubelessEquity, doublePass = 1.0;
    const effectiveMatchLength = options.score?.matchLength ?? state.matchLength ?? 0;
    const scoreX = options.score?.scoreX ?? state.scoreX ?? 0, scoreO = options.score?.scoreO ?? state.scoreO ?? 0;
    const isMoney = effectiveMatchLength <= 0, currentCubeValue = state.cubeValue ?? 1;
    const activePlayerScore = state.turn === 'X' ? scoreX : scoreO;
    let optimalAction = 'No double, take';

    if (state.crawford) optimalAction = 'No double (Crawford rule)';
    else if (!isMoney && scoreX === effectiveMatchLength - 1 && scoreO === effectiveMatchLength - 1) optimalAction = 'No double (DMP)';
    else if (!isMoney && activePlayerScore + currentCubeValue >= effectiveMatchLength) optimalAction = 'No double (Dead cube)';
    else if (state.cubeOwner !== null && state.cubeOwner !== state.turn) optimalAction = 'No double (Cube not owned)';
    else if (currentCubeValue >= 64) optimalAction = 'No double (Max cube)';
    else if (isInitialBoardPosition(state.board)) optimalAction = 'No double (Opening position)';
    else if (classifyPosition(state.board) === 'RACE') {
        optimalAction = evaluateKeithCube(state.board, state.turn, state.cubeOwner === state.turn).action;
    } else {
        let takePoint = 0.25;
        if (!isMoney) {
            const awayX = Math.max(1, effectiveMatchLength - scoreX), awayO = Math.max(1, effectiveMatchLength - scoreO);
            takePoint = calculateTakePoint(state.turn === 'X' ? awayO : awayX, state.turn === 'X' ? awayX : awayO, false);
        }
        const passThreshold = Number(clamp(1.0 - 2 * (takePoint - 0.145), 0.55, 0.95).toFixed(2));
        optimalAction = cubelessEquity < 0.42 ? 'No double, take' : cubelessEquity < passThreshold ? 'Double, take' : 'Double, pass';
    }

    const doubleTake = optimalAction === 'Double, pass'
        ? Number(Math.max(1.05, clamp(2 * cubelessEquity - 0.15, 1.05, 2.0)).toFixed(4))
        : optimalAction === 'Double, take'
          ? Number(clamp(2 * cubelessEquity - 0.15, Math.min(0.95, noDouble + 0.04), 0.99).toFixed(4))
          : Number(Math.min(noDouble - 0.02, clamp(2 * cubelessEquity - 0.42, -2.0, 0.95)).toFixed(4));

    return { xgid, noDouble, doubleTake, doublePass, optimalAction, isWasm: false };
}

export function shouldTakeDouble(cubelessEquity: number): boolean { return cubelessEquity >= -0.54; }
export function shouldOfferDouble(cubelessEquity: number): boolean { return cubelessEquity >= 0.42; }

export function findBestBoardMove(state: BoardState, dice: [number, number], ply: number = 2): BestMoveResult | null {
    const result = analyzeBoardMoves(state, dice, { ply, maxMoves: 1 });
    if (!result.bestMove || !result.bestMove.moves || !result.bestMove.board) return null;
    return {
        xgid: result.xgid, notation: result.bestMove.notation,
        sequence: { moves: result.bestMove.moves, board: result.bestMove.board },
        equity: result.bestMove.equity, rank: 1, isWasm: false,
    };
}
