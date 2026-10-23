/**
 * Client d'évaluation Open Sage (bgsage-service sur Google Cloud Run).
 * Fournit les équités neurales (1-ply / 2-ply / 3-ply) avec cache mémoire LRU (200 entrées).
 */

import {
    serializeXGID,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { bgsageCacheKey, getCachedBgsageEvaluation, setCachedBgsageEvaluation } from './bgsageCache';

export { clearBgsageEvaluationCache, bgsageEvaluationCacheSize, BGSAGE_CACHE_MAX_ENTRIES } from './bgsageCache';

export interface BgsageProbabilities {
    win: number;
    winGammon: number;
    winBackgammon: number;
    loseWin: number;
    loseGammon: number;
    loseBackgammon: number;
}

export interface BgsageMove {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    probabilities: BgsageProbabilities | null;
    board?: number[] | null;
    playerGamePlan?: string | null;
    opponentGamePlan?: string | null;
    cubelessEquity?: number | null;
    evalLevel?: string | null;
}

export interface BgsageCubeDecision {
    noDouble?: number | null;
    doubleTake?: number | null;
    doublePass?: number | null;
    optimalAction?: string | null;
}

export interface BgsageEvaluateResponse {
    chequerPlay: BgsageMove[];
    cubeDecision: BgsageCubeDecision;
    gamePlans?: { player: string; opponent: string } | null;
    isRace?: boolean | null;
}

const DEFAULT_CLOUD_RUN_URL = 'https://bgsage-service-468274233732.europe-west1.run.app';

/** Résout l'URL de base du bgsage-service (NEXT_PUBLIC_BACKEND_URL ou Cloud Run par défaut). */
export function resolveBgsageBaseUrl(): string {
    const raw = (
        process.env.NEXT_PUBLIC_BACKEND_URL ??
        process.env.GNUBG_BACKEND_URL ??
        DEFAULT_CLOUD_RUN_URL
    ).trim();
    return raw.replace(/\/+$/, '');
}

/** Convertit un plateau `m.board` (26 entiers bgsage) vers la convention absolue `board[0..25]`. */
export function bgsageMoveBoardToProjectBoard(bgsageBoard: ReadonlyArray<number>, player: Player): number[] {
    const res = new Array<number>(26).fill(0);
    if (player === 'X') {
        res[0] = Math.abs(bgsageBoard[25] ?? 0);
        res[25] = -Math.abs(bgsageBoard[0] ?? 0);
        for (let p = 1; p <= 24; p++) res[p] = bgsageBoard[p] ?? 0;
    } else {
        res[0] = Math.abs(bgsageBoard[0] ?? 0);
        res[25] = -Math.abs(bgsageBoard[25] ?? 0);
        for (let p = 1; p <= 24; p++) res[p] = -(bgsageBoard[25 - p] ?? 0);
    }
    return res;
}

/** Compare deux plateaux sur les 24 flèches (indices 1..24). */
export function boardsMatchOnPoints(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    for (let p = 1; p <= 24; p++) {
        if ((a[p] ?? 0) !== (b[p] ?? 0)) return false;
    }
    return true;
}

/** Compare deux plateaux sur les 26 indices (flèches 1..24 + barres 0 et 25). */
export function boardsMatchOnPointsAndBar(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    if (!boardsMatchOnPoints(a, b)) return false;
    return (a[0] ?? 0) === (b[0] ?? 0) && (a[25] ?? 0) === (b[25] ?? 0);
}

/** Protège les XGID à 11 champs lorsque la flèche 24 est vide (`body[0] === '-'` et `body[25] === '-'`). */
export function ensureBgsageSafeXgid(xgid: string): string {
    const hasPrefix = xgid.startsWith('XGID=');
    const raw = hasPrefix ? xgid.slice(5) : xgid;
    const parts = raw.split(':');
    if (parts.length === 11 && parts[0].length === 26 && parts[0][0] === '-' && parts[0][25] === '-') {
        parts[0] = `${parts[0].slice(0, 25)}0`;
        return `${hasPrefix ? 'XGID=' : ''}${parts.join(':')}`;
    }
    return xgid;
}

/**
 * Évalue une position XGID via le bgsage-service avec cache LRU (200 entrées, clé `${safeXgid}|${ply}`).
 */
export async function evaluateWithBgsage(
    xgid: string,
    ply: number = 2,
    timeoutMs: number = 4000,
): Promise<BgsageEvaluateResponse | null> {
    const safeXgid = ensureBgsageSafeXgid(xgid);
    const cacheKey = bgsageCacheKey(safeXgid, ply);
    const cached = getCachedBgsageEvaluation(cacheKey);
    if (cached) return cached;

    const base = resolveBgsageBaseUrl();
    const url = base ? `${base}/api/evaluate` : '/api/evaluate';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ xgid: safeXgid, ply }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[bgsageClient] Réponse HTTP ${response.status} du bgsage-service`);
            return null;
        }

        const data = (await response.json()) as BgsageEvaluateResponse;
        if (data && Array.isArray(data.chequerPlay)) {
            setCachedBgsageEvaluation(cacheKey, data);
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn('[bgsageClient] bgsage-service indisponible :', err instanceof Error ? err.message : err);
        return null;
    }
}

/**
 * Sélectionne le coup d'un bot IA via Open Sage selon son niveau (grandmaster: 3-ply, expert: 2-ply, intermediate/beginner: 1-ply).
 */
export async function selectBotMoveWithBgsage(
    stateWithDice: BoardState,
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty = 'expert',
    timeoutMs: number = 3500,
    randomFn: () => number = Math.random,
    precomputedResponse?: BgsageEvaluateResponse | null,
): Promise<{ sequence: MoveSequence; cubeDecision?: BgsageCubeDecision; evalLevel: string } | null> {
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return { sequence: legalSeqs[0], evalLevel: 'forced' };

    const ply = difficulty === 'grandmaster' ? 3 : difficulty === 'expert' ? 2 : 1;
    const xgid = serializeXGID(stateWithDice);
    const resp = precomputedResponse ?? (await evaluateWithBgsage(xgid, ply, timeoutMs));
    if (!resp || !resp.chequerPlay || resp.chequerPlay.length === 0) return null;

    const player = stateWithDice.turn;
    const matchedCandidates: Array<{ move: BgsageMove; seq: MoveSequence }> = [];
    for (const m of resp.chequerPlay) {
        if (m.board && m.board.length === 26) {
            const targetBoard = bgsageMoveBoardToProjectBoard(m.board, player);
            const found =
                legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, targetBoard)) ??
                legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, targetBoard));
            if (found) matchedCandidates.push({ move: m, seq: found });
        }
    }

    if (matchedCandidates.length === 0) {
        return { sequence: legalSeqs[0], cubeDecision: resp.cubeDecision, evalLevel: `bgsage-${ply}ply-fallback` };
    }

    if (difficulty === 'beginner' && matchedCandidates.length > 1) {
        let bestChoice = matchedCandidates[0];
        let bestNoisyEq = -Infinity;
        for (const cand of matchedCandidates) {
            const baseEq = cand.move.cubelessEquity ?? cand.move.equity;
            const noisyEq = baseEq + (randomFn() - 0.5) * 0.28;
            if (noisyEq > bestNoisyEq) {
                bestNoisyEq = noisyEq;
                bestChoice = cand;
            }
        }
        return { sequence: bestChoice.seq, cubeDecision: resp.cubeDecision, evalLevel: 'bgsage-1ply-beginner' };
    }

    return { sequence: matchedCandidates[0].seq, cubeDecision: resp.cubeDecision, evalLevel: `bgsage-${ply}ply` };
}

/** Évalue la décision de videau (Cube : Double / Take / Pass) via Open Sage. */
export async function evaluateBotCubeWithBgsage(
    state: BoardState,
    difficulty: AIDifficulty = 'expert',
    timeoutMs: number = 2200,
): Promise<{
    shouldDouble: boolean;
    shouldTake: boolean;
    noDouble: number;
    doubleTake: number;
    doublePass: number;
    optimalAction: string;
} | null> {
    if (state.crawford) {
        return {
            shouldDouble: false,
            shouldTake: true,
            noDouble: 0,
            doubleTake: 0,
            doublePass: 1,
            optimalAction: 'No Double (Crawford)',
        };
    }

    const ply = difficulty === 'grandmaster' ? 3 : difficulty === 'expert' ? 2 : 1;
    const xgid = serializeXGID({ ...state, dice: null });
    const resp = await evaluateWithBgsage(xgid, ply, timeoutMs);
    if (!resp || !resp.cubeDecision) return null;

    const rawNd = resp.cubeDecision.noDouble;
    const rawDt = resp.cubeDecision.doubleTake;
    if (typeof rawNd !== 'number' || typeof rawDt !== 'number') return null;

    const nd = rawNd;
    const dt = rawDt;
    const dp = typeof resp.cubeDecision.doublePass === 'number' ? resp.cubeDecision.doublePass : 1.0;
    const action = resp.cubeDecision.optimalAction ?? 'No Double';
    const effectiveDoubleEquity = Math.min(dt, dp);
    const shouldDouble =
        nd >= 0.30 &&
        ((effectiveDoubleEquity > nd + 0.005 && nd < dp) ||
            (action.toLowerCase().includes('double') && !action.toLowerCase().includes('no double')));
    const shouldTake = dt <= dp;

    return { shouldDouble, shouldTake, noDouble: nd, doubleTake: dt, doublePass: dp, optimalAction: action };
}

/** Vérifie la disponibilité du bgsage-service via son endpoint `/health`. */
export async function isBgsageAvailable(timeoutMs: number = 2000): Promise<boolean> {
    const base = resolveBgsageBaseUrl();
    const url = base ? `${base}/health` : '/health';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        clearTimeout(timeoutId);
        return false;
    }
}
