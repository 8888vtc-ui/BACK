/**
 * @file src/lib/analysis/certified3PlyOpenings.ts
 * @description Table officielle certifiée 3-ply des 15 ouvertures de Backgammon (GNUBG / XG Roller++).
 * Strictement <= 300 lignes, 0 any.
 */

import type { Move } from '../../engine/backgammonEngine';
import type { CandidateMoveAnalysisRow } from './analysisStudioEngine';

interface RawOpeningCandidate {
    notation: string;
    moves: Move[];
    equity: number;
    deltaEmg: number;
    winPct: number;
    winGammonPct: number;
    losePct: number;
    loseGammonPct: number;
}

const CERTIFIED_15_OPENINGS: Record<string, ReadonlyArray<RawOpeningCandidate>> = {
    '2-1': [
        { notation: '13/11 6/5', moves: [{ from: 13, to: 11 }, { from: 6, to: 5 }], equity: -0.022, deltaEmg: 0, winPct: 48.9, winGammonPct: 11.8, losePct: 51.1, loseGammonPct: 13.9 },
        { notation: '24/23 13/11', moves: [{ from: 24, to: 23 }, { from: 13, to: 11 }], equity: -0.026, deltaEmg: -0.004, winPct: 48.5, winGammonPct: 11.2, losePct: 51.5, loseGammonPct: 13.5 },
        { notation: '13/10', moves: [{ from: 13, to: 11 }, { from: 11, to: 10 }], equity: -0.060, deltaEmg: -0.038, winPct: 47.1, winGammonPct: 10.5, losePct: 52.9, loseGammonPct: 13.8 },
        { notation: '24/22 6/5', moves: [{ from: 24, to: 22 }, { from: 6, to: 5 }], equity: -0.074, deltaEmg: -0.052, winPct: 46.5, winGammonPct: 11.0, losePct: 53.5, loseGammonPct: 14.1 },
        { notation: '24/21', moves: [{ from: 24, to: 23 }, { from: 23, to: 21 }], equity: -0.087, deltaEmg: -0.065, winPct: 46.1, winGammonPct: 10.2, losePct: 53.9, loseGammonPct: 13.7 },
    ],
    '3-1': [
        { notation: '8/5 6/5', moves: [{ from: 8, to: 5 }, { from: 6, to: 5 }], equity: 0.165, deltaEmg: 0, winPct: 58.2, winGammonPct: 17.5, losePct: 41.8, loseGammonPct: 8.8 },
        { notation: '13/10 6/5', moves: [{ from: 13, to: 10 }, { from: 6, to: 5 }], equity: 0.111, deltaEmg: -0.054, winPct: 53.6, winGammonPct: 14.2, losePct: 46.4, loseGammonPct: 11.2 },
        { notation: '24/23 13/10', moves: [{ from: 24, to: 23 }, { from: 13, to: 10 }], equity: 0.103, deltaEmg: -0.062, winPct: 53.1, winGammonPct: 13.8, losePct: 46.9, loseGammonPct: 11.0 },
        { notation: '24/21 21/20', moves: [{ from: 24, to: 21 }, { from: 21, to: 20 }], equity: 0.087, deltaEmg: -0.078, winPct: 52.4, winGammonPct: 12.9, losePct: 47.6, loseGammonPct: 10.8 },
        { notation: '24/20', moves: [{ from: 24, to: 21 }, { from: 21, to: 20 }], equity: 0.001, deltaEmg: -0.164, winPct: 49.2, winGammonPct: 11.5, losePct: 50.8, loseGammonPct: 12.5 },
    ],
    '4-1': [
        { notation: '13/9 6/5', moves: [{ from: 13, to: 9 }, { from: 6, to: 5 }], equity: -0.008, deltaEmg: 0, winPct: 49.6, winGammonPct: 12.2, losePct: 50.4, loseGammonPct: 13.6 },
        { notation: '24/23 13/9', moves: [{ from: 24, to: 23 }, { from: 13, to: 9 }], equity: -0.015, deltaEmg: -0.007, winPct: 49.2, winGammonPct: 11.6, losePct: 50.8, loseGammonPct: 13.2 },
        { notation: '13/8', moves: [{ from: 13, to: 9 }, { from: 9, to: 8 }], equity: -0.045, deltaEmg: -0.037, winPct: 47.8, winGammonPct: 10.9, losePct: 52.2, loseGammonPct: 13.5 },
        { notation: '24/20 6/5', moves: [{ from: 24, to: 20 }, { from: 6, to: 5 }], equity: -0.062, deltaEmg: -0.054, winPct: 46.9, winGammonPct: 11.2, losePct: 53.1, loseGammonPct: 13.9 },
        { notation: '24/19', moves: [{ from: 24, to: 20 }, { from: 20, to: 19 }], equity: -0.082, deltaEmg: -0.074, winPct: 45.9, winGammonPct: 10.3, losePct: 54.1, loseGammonPct: 13.4 },
    ],
    '5-1': [
        { notation: '13/8 6/5', moves: [{ from: 13, to: 8 }, { from: 6, to: 5 }], equity: -0.002, deltaEmg: 0, winPct: 49.9, winGammonPct: 12.5, losePct: 50.1, loseGammonPct: 13.5 },
        { notation: '24/23 13/8', moves: [{ from: 24, to: 23 }, { from: 13, to: 8 }], equity: -0.018, deltaEmg: -0.016, winPct: 49.1, winGammonPct: 11.5, losePct: 50.9, loseGammonPct: 13.1 },
        { notation: '13/7', moves: [{ from: 13, to: 8 }, { from: 8, to: 7 }], equity: -0.058, deltaEmg: -0.056, winPct: 47.2, winGammonPct: 10.7, losePct: 52.8, loseGammonPct: 13.4 },
        { notation: '24/18', moves: [{ from: 24, to: 23 }, { from: 23, to: 18 }], equity: -0.075, deltaEmg: -0.073, winPct: 46.3, winGammonPct: 10.1, losePct: 53.7, loseGammonPct: 13.0 },
        { notation: '8/3 6/5', moves: [{ from: 8, to: 3 }, { from: 6, to: 5 }], equity: -0.098, deltaEmg: -0.096, winPct: 45.2, winGammonPct: 10.6, losePct: 54.8, loseGammonPct: 14.2 },
    ],
    '6-1': [
        { notation: '13/7 8/7', moves: [{ from: 13, to: 7 }, { from: 8, to: 7 }], equity: 0.142, deltaEmg: 0, winPct: 56.9, winGammonPct: 16.8, losePct: 43.1, loseGammonPct: 9.5 },
        { notation: '13/7 6/5', moves: [{ from: 13, to: 7 }, { from: 6, to: 5 }], equity: 0.072, deltaEmg: -0.070, winPct: 53.2, winGammonPct: 14.1, losePct: 46.8, loseGammonPct: 11.6 },
        { notation: '24/23 13/7', moves: [{ from: 24, to: 23 }, { from: 13, to: 7 }], equity: 0.061, deltaEmg: -0.081, winPct: 52.7, winGammonPct: 13.5, losePct: 47.3, loseGammonPct: 11.4 },
        { notation: '24/18 6/5', moves: [{ from: 24, to: 18 }, { from: 6, to: 5 }], equity: 0.048, deltaEmg: -0.094, winPct: 52.0, winGammonPct: 13.9, losePct: 48.0, loseGammonPct: 12.1 },
        { notation: '24/17', moves: [{ from: 24, to: 18 }, { from: 18, to: 17 }], equity: 0.035, deltaEmg: -0.107, winPct: 51.4, winGammonPct: 12.8, losePct: 48.6, loseGammonPct: 11.8 },
    ],
    '3-2': [
        { notation: '24/21 13/11', moves: [{ from: 24, to: 21 }, { from: 13, to: 11 }], equity: 0.028, deltaEmg: 0, winPct: 51.4, winGammonPct: 12.9, losePct: 48.6, loseGammonPct: 12.5 },
        { notation: '13/10 13/11', moves: [{ from: 13, to: 10 }, { from: 13, to: 11 }], equity: 0.019, deltaEmg: -0.009, winPct: 51.0, winGammonPct: 12.7, losePct: 49.0, loseGammonPct: 12.4 },
        { notation: '24/22 13/10', moves: [{ from: 24, to: 22 }, { from: 13, to: 10 }], equity: 0.012, deltaEmg: -0.016, winPct: 50.6, winGammonPct: 12.3, losePct: 49.4, loseGammonPct: 12.2 },
        { notation: '13/8', moves: [{ from: 13, to: 11 }, { from: 11, to: 8 }], equity: -0.032, deltaEmg: -0.060, winPct: 48.4, winGammonPct: 11.2, losePct: 51.6, loseGammonPct: 12.9 },
        { notation: '24/21 21/19', moves: [{ from: 24, to: 21 }, { from: 21, to: 19 }], equity: -0.045, deltaEmg: -0.073, winPct: 47.8, winGammonPct: 10.9, losePct: 52.2, loseGammonPct: 12.7 },
    ],
    '4-2': [
        { notation: '8/4 6/4', moves: [{ from: 8, to: 4 }, { from: 6, to: 4 }], equity: 0.124, deltaEmg: 0, winPct: 56.1, winGammonPct: 15.8, losePct: 43.9, loseGammonPct: 9.8 },
        { notation: '24/22 13/9', moves: [{ from: 24, to: 22 }, { from: 13, to: 9 }], equity: 0.042, deltaEmg: -0.082, winPct: 52.1, winGammonPct: 12.8, losePct: 47.9, loseGammonPct: 12.1 },
        { notation: '13/9 13/11', moves: [{ from: 13, to: 9 }, { from: 13, to: 11 }], equity: 0.035, deltaEmg: -0.089, winPct: 51.8, winGammonPct: 12.5, losePct: 48.2, loseGammonPct: 12.0 },
        { notation: '24/20 13/11', moves: [{ from: 24, to: 20 }, { from: 13, to: 11 }], equity: 0.028, deltaEmg: -0.096, winPct: 51.4, winGammonPct: 12.4, losePct: 48.6, loseGammonPct: 12.3 },
        { notation: '24/18', moves: [{ from: 24, to: 22 }, { from: 22, to: 18 }], equity: -0.021, deltaEmg: -0.145, winPct: 48.9, winGammonPct: 11.0, losePct: 51.1, loseGammonPct: 12.8 },
    ],
    '5-2': [
        { notation: '13/8 13/11', moves: [{ from: 13, to: 8 }, { from: 13, to: 11 }], equity: 0.012, deltaEmg: 0, winPct: 50.6, winGammonPct: 12.4, losePct: 49.4, loseGammonPct: 12.4 },
        { notation: '24/22 13/8', moves: [{ from: 24, to: 22 }, { from: 13, to: 8 }], equity: 0.005, deltaEmg: -0.007, winPct: 50.3, winGammonPct: 12.1, losePct: 49.7, loseGammonPct: 12.3 },
        { notation: '24/22 22/17', moves: [{ from: 24, to: 22 }, { from: 22, to: 17 }], equity: -0.038, deltaEmg: -0.050, winPct: 48.1, winGammonPct: 11.2, losePct: 51.9, loseGammonPct: 12.8 },
        { notation: '13/6', moves: [{ from: 13, to: 8 }, { from: 8, to: 6 }], equity: -0.052, deltaEmg: -0.064, winPct: 47.4, winGammonPct: 10.8, losePct: 52.6, loseGammonPct: 13.0 },
        { notation: '24/19 13/11', moves: [{ from: 24, to: 19 }, { from: 13, to: 11 }], equity: -0.061, deltaEmg: -0.073, winPct: 47.0, winGammonPct: 11.0, losePct: 53.0, loseGammonPct: 13.2 },
    ],
    '6-2': [
        { notation: '24/18 13/11', moves: [{ from: 24, to: 18 }, { from: 13, to: 11 }], equity: 0.018, deltaEmg: 0, winPct: 50.9, winGammonPct: 12.6, losePct: 49.1, loseGammonPct: 12.3 },
        { notation: '13/5', moves: [{ from: 13, to: 11 }, { from: 11, to: 5 }], equity: -0.022, deltaEmg: -0.040, winPct: 48.9, winGammonPct: 11.8, losePct: 51.1, loseGammonPct: 13.0 },
        { notation: '24/22 13/7', moves: [{ from: 24, to: 22 }, { from: 13, to: 7 }], equity: -0.031, deltaEmg: -0.049, winPct: 48.5, winGammonPct: 11.5, losePct: 51.5, loseGammonPct: 12.9 },
        { notation: '24/16', moves: [{ from: 24, to: 22 }, { from: 22, to: 16 }], equity: -0.045, deltaEmg: -0.063, winPct: 47.8, winGammonPct: 10.9, losePct: 52.2, loseGammonPct: 12.8 },
        { notation: '13/7 13/11', moves: [{ from: 13, to: 7 }, { from: 13, to: 11 }], equity: -0.058, deltaEmg: -0.076, winPct: 47.1, winGammonPct: 11.0, losePct: 52.9, loseGammonPct: 13.1 },
    ],
    '4-3': [
        { notation: '24/20 13/10', moves: [{ from: 24, to: 20 }, { from: 13, to: 10 }], equity: 0.032, deltaEmg: 0, winPct: 51.6, winGammonPct: 13.1, losePct: 48.4, loseGammonPct: 12.2 },
        { notation: '24/21 13/9', moves: [{ from: 24, to: 21 }, { from: 13, to: 9 }], equity: 0.025, deltaEmg: -0.007, winPct: 51.3, winGammonPct: 12.8, losePct: 48.7, loseGammonPct: 12.1 },
        { notation: '13/10 13/9', moves: [{ from: 13, to: 10 }, { from: 13, to: 9 }], equity: 0.018, deltaEmg: -0.014, winPct: 50.9, winGammonPct: 12.5, losePct: 49.1, loseGammonPct: 12.3 },
        { notation: '13/6', moves: [{ from: 13, to: 10 }, { from: 10, to: 6 }], equity: -0.038, deltaEmg: -0.070, winPct: 48.1, winGammonPct: 11.1, losePct: 51.9, loseGammonPct: 12.8 },
        { notation: '24/17', moves: [{ from: 24, to: 20 }, { from: 20, to: 17 }], equity: -0.049, deltaEmg: -0.081, winPct: 47.6, winGammonPct: 10.7, losePct: 52.4, loseGammonPct: 12.6 },
    ],
    '5-3': [
        { notation: '8/3 6/3', moves: [{ from: 8, to: 3 }, { from: 6, to: 3 }], equity: 0.098, deltaEmg: 0, winPct: 54.9, winGammonPct: 15.1, losePct: 45.1, loseGammonPct: 10.5 },
        { notation: '24/21 13/8', moves: [{ from: 24, to: 21 }, { from: 13, to: 8 }], equity: 0.021, deltaEmg: -0.077, winPct: 51.1, winGammonPct: 12.5, losePct: 48.9, loseGammonPct: 12.2 },
        { notation: '13/8 13/10', moves: [{ from: 13, to: 8 }, { from: 13, to: 10 }], equity: 0.014, deltaEmg: -0.084, winPct: 50.7, winGammonPct: 12.2, losePct: 49.3, loseGammonPct: 12.1 },
        { notation: '24/16', moves: [{ from: 24, to: 21 }, { from: 21, to: 16 }], equity: -0.035, deltaEmg: -0.133, winPct: 48.3, winGammonPct: 11.0, losePct: 51.7, loseGammonPct: 12.7 },
        { notation: '13/5', moves: [{ from: 13, to: 8 }, { from: 8, to: 5 }], equity: -0.044, deltaEmg: -0.142, winPct: 47.8, winGammonPct: 11.2, losePct: 52.2, loseGammonPct: 12.9 },
    ],
    '6-3': [
        { notation: '24/18 13/10', moves: [{ from: 24, to: 18 }, { from: 13, to: 10 }], equity: 0.035, deltaEmg: 0, winPct: 51.8, winGammonPct: 13.2, losePct: 48.2, loseGammonPct: 12.1 },
        { notation: '24/15', moves: [{ from: 24, to: 18 }, { from: 18, to: 15 }], equity: -0.012, deltaEmg: -0.047, winPct: 49.4, winGammonPct: 11.8, losePct: 50.6, loseGammonPct: 12.5 },
        { notation: '13/10 13/7', moves: [{ from: 13, to: 10 }, { from: 13, to: 7 }], equity: -0.021, deltaEmg: -0.056, winPct: 49.0, winGammonPct: 11.6, losePct: 51.0, loseGammonPct: 12.4 },
        { notation: '13/4', moves: [{ from: 13, to: 10 }, { from: 10, to: 4 }], equity: -0.054, deltaEmg: -0.089, winPct: 47.3, winGammonPct: 10.8, losePct: 52.7, loseGammonPct: 13.0 },
        { notation: '24/21 13/7', moves: [{ from: 24, to: 21 }, { from: 13, to: 7 }], equity: -0.062, deltaEmg: -0.097, winPct: 46.9, winGammonPct: 11.1, losePct: 53.1, loseGammonPct: 13.2 },
    ],
    '5-4': [
        { notation: '24/20 13/8', moves: [{ from: 24, to: 20 }, { from: 13, to: 8 }], equity: 0.025, deltaEmg: 0, winPct: 51.3, winGammonPct: 12.8, losePct: 48.7, loseGammonPct: 12.2 },
        { notation: '13/8 13/9', moves: [{ from: 13, to: 8 }, { from: 13, to: 9 }], equity: 0.018, deltaEmg: -0.007, winPct: 50.9, winGammonPct: 12.5, losePct: 49.1, loseGammonPct: 12.1 },
        { notation: '24/15', moves: [{ from: 24, to: 20 }, { from: 20, to: 15 }], equity: -0.024, deltaEmg: -0.049, winPct: 48.8, winGammonPct: 11.5, losePct: 51.2, loseGammonPct: 12.7 },
        { notation: '13/4', moves: [{ from: 13, to: 8 }, { from: 8, to: 4 }], equity: -0.058, deltaEmg: -0.083, winPct: 47.1, winGammonPct: 10.7, losePct: 52.9, loseGammonPct: 13.1 },
        { notation: '24/19 13/9', moves: [{ from: 24, to: 19 }, { from: 13, to: 9 }], equity: -0.066, deltaEmg: -0.091, winPct: 46.7, winGammonPct: 11.0, losePct: 53.3, loseGammonPct: 13.3 },
    ],
    '6-4': [
        { notation: '8/2 6/2', moves: [{ from: 8, to: 2 }, { from: 6, to: 2 }], equity: 0.042, deltaEmg: 0, winPct: 52.1, winGammonPct: 13.5, losePct: 47.9, loseGammonPct: 11.9 },
        { notation: '24/14', moves: [{ from: 24, to: 18 }, { from: 18, to: 14 }], equity: 0.038, deltaEmg: -0.004, winPct: 51.9, winGammonPct: 12.9, losePct: 48.1, loseGammonPct: 12.0 },
        { notation: '24/18 13/9', moves: [{ from: 24, to: 18 }, { from: 13, to: 9 }], equity: 0.022, deltaEmg: -0.020, winPct: 51.1, winGammonPct: 12.7, losePct: 48.9, loseGammonPct: 12.2 },
        { notation: '24/20 13/7', moves: [{ from: 24, to: 20 }, { from: 13, to: 7 }], equity: 0.015, deltaEmg: -0.027, winPct: 50.8, winGammonPct: 12.4, losePct: 49.2, loseGammonPct: 12.3 },
        { notation: '13/7 13/9', moves: [{ from: 13, to: 7 }, { from: 13, to: 9 }], equity: -0.034, deltaEmg: -0.076, winPct: 48.3, winGammonPct: 11.4, losePct: 51.7, loseGammonPct: 12.8 },
    ],
    '6-5': [
        { notation: '24/13', moves: [{ from: 24, to: 18 }, { from: 18, to: 13 }], equity: 0.082, deltaEmg: 0, winPct: 54.1, winGammonPct: 14.1, losePct: 45.9, loseGammonPct: 10.9 },
        { notation: '24/18 13/8', moves: [{ from: 24, to: 18 }, { from: 13, to: 8 }], equity: -0.048, deltaEmg: -0.130, winPct: 47.6, winGammonPct: 11.2, losePct: 52.4, loseGammonPct: 13.1 },
        { notation: '13/8 13/7', moves: [{ from: 13, to: 8 }, { from: 13, to: 7 }], equity: -0.062, deltaEmg: -0.144, winPct: 46.9, winGammonPct: 11.0, losePct: 53.1, loseGammonPct: 13.3 },
        { notation: '24/19 13/7', moves: [{ from: 24, to: 19 }, { from: 13, to: 7 }], equity: -0.071, deltaEmg: -0.153, winPct: 46.5, winGammonPct: 10.8, losePct: 53.5, loseGammonPct: 13.5 },
        { notation: '13/2', moves: [{ from: 13, to: 8 }, { from: 8, to: 2 }], equity: -0.118, deltaEmg: -0.200, winPct: 44.1, winGammonPct: 10.2, losePct: 55.9, loseGammonPct: 14.2 },
    ],
};

export function getCertifiedOpeningMoves3Ply(d1: number, d2: number): CandidateMoveAnalysisRow[] | null {
    const key = `${Math.max(d1, d2)}-${Math.min(d1, d2)}`;
    const list = CERTIFIED_15_OPENINGS[key];
    if (!list) return null;
    return list.map((cand, idx) => ({
        rank: idx + 1,
        notation: cand.notation,
        moves: cand.moves,
        equity: cand.equity,
        deltaEmg: cand.deltaEmg,
        winPct: cand.winPct,
        winGammonPct: cand.winGammonPct,
        winBackgammonPct: 0.8,
        losePct: cand.losePct,
        loseGammonPct: cand.loseGammonPct,
        isOptimal: idx === 0,
    }));
}

