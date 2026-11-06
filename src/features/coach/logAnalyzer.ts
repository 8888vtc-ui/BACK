/**
 * Analyseur log-driven déterministe du Coach IA (Règle d'or n°1 & n°3).
 * 100 % des analyses passent par bgsage 3-ply avec turnStartBoard immuable.
 * Strictement <= 300 lignes, 0 any.
 */

import type { Player, BoardState, Move } from '../../engine/backgammonEngine';
import { createInitialState, applyMove, serializeCanonicalXGID, generateLegalMoves } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { evaluateWithBgsage, boardsMatchOnPointsAndBar } from '../../lib/engine/bgsageClient';
import {
    formatCoachMoveSequence, movesFromBoardDiff, parseCoachNotationMoves,
} from './coachMoveNotation';
import type { BgsageStrategicInsights } from './featureExtractor';
import { detectOpeningScoreRegime, getOpeningForScore, isInitialBoardPosition } from '../openings/openingDatabase';
import {
    extractVerifiedCoachFacts, computeVerifiedBoardFacts, type CoachVerifiedFacts, type CommittedHumanMovePacket,
} from './turnSnapshot';
import {
    resolvePlayedMoves, resolveEffectiveBoardAfter, notationsAreEquivalent, buildHumanMoveAnalysisFromBgsageResult,
} from './logAnalyzerBgsageBuilder';

export { extractVerifiedCoachFacts, computeVerifiedBoardFacts };

export type CoachVerdict = 'optimal' | 'good' | 'inaccuracy' | 'blunder';

export const VERDICT_THRESHOLDS = { OPTIMAL: 0.01, GOOD: 0.02, BLUNDER: 0.08 } as const;
export const STRICT_VERDICT_THRESHOLDS = { OPTIMAL: 0.005, GOOD: 0.015, BLUNDER: 0.06 } as const;

export function classifyVerdict(equityLoss: number, strictPr1 = false): CoachVerdict {
    const loss = Math.abs(equityLoss);
    const thresholds = strictPr1 ? STRICT_VERDICT_THRESHOLDS : VERDICT_THRESHOLDS;
    if (loss <= thresholds.OPTIMAL) return 'optimal';
    if (loss <= thresholds.GOOD) return 'good';
    if (loss > thresholds.BLUNDER) return 'blunder';
    return 'inaccuracy';
}

export function verdictLabel(verdict: CoachVerdict): string {
    switch (verdict) {
        case 'optimal': return 'Optimal ✅';
        case 'good': return 'Bon 👍';
        case 'inaccuracy': return 'Imprécision ⚠️';
        case 'blunder': return 'Blunder ❌';
    }
}

export interface HumanMoveAnalysis {
    readonly turnIndex: number;
    readonly player: Player;
    readonly verdict: CoachVerdict;
    readonly equityLoss: number;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly playedEquity: number;
    readonly bestEquity: number;
    readonly isUnforced: boolean;
    readonly isBlunder: boolean;
    readonly candidateMoves: ReadonlyArray<{
        readonly notation: string;
        readonly equity: number;
        readonly equityLoss: number;
        readonly winProbability?: number;
        readonly gammonProbability?: number;
        readonly backgammonProbability?: number;
    }>;
    readonly optimalMoves?: ReadonlyArray<Move>;
    readonly optimalSubMoves?: ReadonlyArray<{ readonly from: number; readonly to: number }>;
    readonly verifiedFacts?: CoachVerifiedFacts;
    readonly packetId?: string;
    readonly bgsageInsights?: BgsageStrategicInsights;
}

export interface AnalyzeHumanMoveFromLogParams {
    readonly logEntry: MatchLogEntry;
    readonly packet?: CommittedHumanMovePacket;
    readonly localPlayer?: Player;
    readonly cubeValue?: number;
    readonly cubeOwner?: Player | null;
    readonly crawford?: boolean;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly ply?: number;
    readonly signal?: AbortSignal;
}

export function reconstructBoardFromLog(log: ReadonlyArray<MatchLogEntry>, turnIndex: number): number[] | null {
    let board = [...createInitialState().board];
    for (const entry of log) {
        if (entry.turnIndex >= turnIndex) break;
        for (const move of entry.movePlayed) board = applyMove(board, move, entry.player);
    }
    return board;
}

function matchOpeningBookAnalysis(
    params: AnalyzeHumanMoveFromLogParams,
    opening: ReturnType<typeof getOpeningForScore>,
    boardBefore: number[],
    effectiveBoardAfter: number[],
    dice: [number, number],
): HumanMoveAnalysis | null {
    if (!opening) return null;
    const { logEntry } = params;
    const playedMoves = resolvePlayedMoves(logEntry);
    const playedNotation = formatCoachMoveSequence([...playedMoves], logEntry.player, boardBefore);
    const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
    const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

    let openingBestBoard = [...boardBefore];
    for (const m of opening.bestMoves) openingBestBoard = applyMove(openingBestBoard, m, logEntry.player);

    const baseCandidates = [
        { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
        ...opening.alternatives.map((alt) => ({
            notation: alt.notation, equity: opening.equity + alt.equityLoss, equityLoss: Math.abs(alt.equityLoss),
        })),
    ];

    if (
        boardsMatchOnPointsAndBar(openingBestBoard, effectiveBoardAfter) ||
        notationsAreEquivalent(playedNotation, opening.bestMoveNotation, logEntry.player, dice) ||
        notationsAreEquivalent(canonicalNotation, opening.bestMoveNotation, logEntry.player, dice)
    ) {
        return {
            turnIndex: logEntry.turnIndex, player: logEntry.player, verdict: 'optimal', equityLoss: 0,
            playedNotation, optimalNotation: opening.bestMoveNotation, playedEquity: opening.equity,
            bestEquity: opening.equity, isUnforced: true, isBlunder: false, optimalMoves: opening.bestMoves,
            candidateMoves: baseCandidates,
        };
    }
    const matchedAlt = opening.alternatives.find((alt) => {
        if (notationsAreEquivalent(alt.notation, playedNotation, logEntry.player, dice) || notationsAreEquivalent(alt.notation, canonicalNotation, logEntry.player, dice)) return true;
        const altMoves = parseCoachNotationMoves(alt.notation, logEntry.player, dice);
        if (altMoves.length > 0) {
            let altBoard = [...boardBefore];
            for (const m of altMoves) altBoard = applyMove(altBoard, m, logEntry.player);
            return boardsMatchOnPointsAndBar(altBoard, effectiveBoardAfter);
        }
        return false;
    });
    if (matchedAlt) {
        const loss = Math.abs(matchedAlt.equityLoss);
        const v = classifyVerdict(loss);
        return {
            turnIndex: logEntry.turnIndex, player: logEntry.player, verdict: v, equityLoss: loss,
            playedNotation, optimalNotation: opening.bestMoveNotation, playedEquity: opening.equity + matchedAlt.equityLoss,
            bestEquity: opening.equity, isUnforced: true, isBlunder: v === 'blunder', optimalMoves: opening.bestMoves,
            candidateMoves: baseCandidates,
        };
    }
    return null;
}

export async function analyzeHumanMoveFromLogWithBgsage(
    params: AnalyzeHumanMoveFromLogParams,
): Promise<(HumanMoveAnalysis & { source: 'bgsage' | 'local' }) | null> {
    const { logEntry, localPlayer = 'X' } = params;
    if (logEntry.player !== localPlayer) return null;

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    const evalState: BoardState = {
        board: boardBefore, turn: logEntry.player, dice, cubeValue: params.cubeValue ?? 1,
        cubeOwner: params.cubeOwner ?? null, matchLength: params.matchLength ?? 7,
        scoreX: params.scoreX ?? 0, scoreO: params.scoreO ?? 0, crawford: params.crawford ?? false,
        doubled: false, resigned: 0,
    };
    const xgid = serializeCanonicalXGID(evalState);
    const legalSeqs = generateLegalMoves(evalState, dice);

    const isOpeningTurn = (logEntry.turnIndex <= 1 || isInitialBoardPosition(boardBefore)) && isInitialBoardPosition(boardBefore) && dice[0] !== dice[1] && logEntry.player === 'X';
    const openingBookEntry = isOpeningTurn
        ? getOpeningForScore(dice[0], dice[1], detectOpeningScoreRegime({
              matchLength: params.matchLength, scoreX: params.scoreX, scoreO: params.scoreO,
              player: logEntry.player, cubeValue: params.cubeValue, crawford: params.crawford,
          }))
        : null;
    if (openingBookEntry) {
        const openingResult = matchOpeningBookAnalysis(params, openingBookEntry, boardBefore, effectiveBoardAfter, dice);
        if (openingResult) return { ...openingResult, source: 'local' };
    }

    if (params.signal?.aborted) return null;
    const targetPly = params.ply ?? 3;
    try {
        const bgsageResult = await evaluateWithBgsage(xgid, targetPly, 4000);
        if (params.signal?.aborted) return null;
        const isRealBgsage = Boolean(bgsageResult && bgsageResult.chequerPlay.length > 0 && bgsageResult.source !== 'typescript-tri-phase' && bgsageResult.source !== 'local');
        if (isRealBgsage && bgsageResult) {
            const built = buildHumanMoveAnalysisFromBgsageResult({
                bgsageResult, logEntry, evalState, legalSeqs, boardBefore, effectiveBoardAfter, targetPly,
            });
            if (built) return built;
        }
    } catch (err) {
        console.warn('[Coach] bgsage-service indisponible :', err);
    }
    return null;
}
