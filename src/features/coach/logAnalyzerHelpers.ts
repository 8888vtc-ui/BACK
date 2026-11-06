/**
 * @file src/features/coach/logAnalyzerHelpers.ts
 * @description Fonctions pures d'équivalence de notation et de résolution de mouvements (< 110 lignes, 0 any).
 */

import type { Player } from '../../engine/backgammonEngine';
import { applyMove } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { boardsMatchOnPointsAndBar, type BgsageMove } from '../../lib/engine/bgsageClient';
import {
    movesFromBoardDiff,
    normalizeCoachNotation,
    parseCoachNotationMoves,
} from './coachMoveNotation';
import type { BgsageMoveMetrics } from './featureExtractor';

export function resolvePlayedMoves(logEntry: MatchLogEntry): ReadonlyArray<{ from: number; to: number }> {
    if (logEntry.movePlayed && logEntry.movePlayed.length > 0) return logEntry.movePlayed;
    return movesFromBoardDiff(logEntry.boardBefore, logEntry.boardAfter, logEntry.player);
}

export function resolveEffectiveBoardAfter(logEntry: MatchLogEntry): number[] {
    if (
        logEntry.movePlayed &&
        logEntry.movePlayed.length > 0 &&
        boardsMatchOnPointsAndBar(logEntry.boardBefore, logEntry.boardAfter)
    ) {
        let b = [...logEntry.boardBefore];
        for (const m of logEntry.movePlayed) b = applyMove(b, m, logEntry.player);
        return b;
    }
    return [...logEntry.boardAfter];
}

export function moveSequenceKey(moves: ReadonlyArray<{ from: number; to: number }>): string {
    return moves.map((m) => `${m.from}>${m.to}`).sort().join('|');
}

export function collapseParsedMovesKey(notation: string, player: Player = 'X', dice?: readonly [number, number]): string {
    const moves = parseCoachNotationMoves(notation, player, dice);
    if (moves.length === 0) return '';
    const list = moves.map((m) => ({ ...m }));
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < list.length && !merged; i++) {
            for (let j = 0; j < list.length; j++) {
                if (i === j) continue;
                if (list[i].to !== 0 && list[i].to !== 25 && list[i].to === list[j].from) {
                    list[i] = { from: list[i].from, to: list[j].to };
                    list.splice(j, 1);
                    merged = true;
                    break;
                }
            }
        }
    }
    return list
        .map((m) => `${m.from === 0 || m.from === 25 ? 'bar' : m.from}>${m.to === 0 || m.to === 25 ? 'off' : m.to}`)
        .sort()
        .join('|');
}

export function notationsAreEquivalent(
    a: string,
    b: string,
    player: Player = 'X',
    dice?: readonly [number, number],
): boolean {
    const normA = normalizeCoachNotation(a);
    const normB = normalizeCoachNotation(b);
    if (!normA || !normB) return false;
    if (normA === normB) return true;
    if (normA.split(' ').filter(Boolean).sort().join(' ') === normB.split(' ').filter(Boolean).sort().join(' ')) return true;
    const collapsedA = collapseParsedMovesKey(a, player, dice);
    const collapsedB = collapseParsedMovesKey(b, player, dice);
    return Boolean(collapsedA && collapsedA === collapsedB);
}

export function toBgsageMoveMetrics(m: BgsageMove): BgsageMoveMetrics {
    const winProb = m.probabilities?.win ?? 0.5;
    const winGammonProb = m.probabilities?.winGammon ?? 0;
    const loseProb = m.probabilities?.loseWin ?? Math.max(0, 1 - winProb);
    const loseGammonProb = m.probabilities?.loseGammon ?? 0;
    return {
        equity: m.equity,
        cubelessEquity: m.cubelessEquity ?? m.equity,
        equityLoss: m.equityLoss,
        winProb,
        winSingleProb: m.probabilities?.winSingle ?? Math.max(0, winProb - winGammonProb),
        winGammonProb,
        winBackgammonProb: m.probabilities?.winBackgammon ?? 0,
        loseProb,
        loseSingleProb: m.probabilities?.loseSingle ?? Math.max(0, loseProb - loseGammonProb),
        loseGammonProb,
        loseBackgammonProb: m.probabilities?.loseBackgammon ?? 0,
        playerGamePlan: m.playerGamePlan ?? 'contact',
        opponentGamePlan: m.opponentGamePlan ?? 'contact',
        evalLevel: m.evalLevel ?? undefined,
    };
}
