/**
 * Client d'évaluation Open Sage (bgsage-service sur Google Cloud Run).
 */
import {
    applyMove,
    borneOffCount,
    serializeCanonicalXGID,
    type BoardState,
    type Move,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
export { serializeCanonicalXGID };
import type { AIDifficulty } from '../../engine/aiHeuristics';
import {
    BLUNDER_CAP_EMG_BY_DIFFICULTY,
    computePersonaBiasDelta,
    isVisuallyObviousBestMove,
} from '../../features/personas/botPersonas';
import { formatMoveSequenceNotationAbsolute } from './evaluator';
import {
    movesFromBoardDiff,
    normalizeCoachNotation,
    parseCoachNotationMoves,
    relativeNotationToAbsolute,
} from '../../features/coach/coachMoveNotation';
import { bgsageCacheKey, getCachedBgsageEvaluation, setCachedBgsageEvaluation } from './bgsageCache';
export { clearBgsageEvaluationCache, bgsageEvaluationCacheSize, BGSAGE_CACHE_MAX_ENTRIES } from './bgsageCache';

export const OPENSAGE_UNREACHABLE_ERROR_CODE = 'OPENSAGE_UNREACHABLE_NO_FALLBACK_ALLOWED' as const;

export interface EngineOriginProof {
    readonly source: 'bgsage-cloud-run';
    readonly ply: 1 | 2 | 3;
    readonly probs: readonly [number, number, number, number, number];
    readonly gamePlan: string;
    readonly latencyMs: number;
}

export interface BgsageProbabilities {
    win: number;
    winGammon: number;
    winBackgammon: number;
    loseWin: number;
    loseGammon: number;
    loseBackgammon: number;
    winGammonExclusive?: number;
    loseGammonExclusive?: number;
    winSingle?: number;
    loseSingle?: number;
    winGammonCumulative?: number;
    loseGammonCumulative?: number;
}

export function calculateCubelessEquity(probs: BgsageProbabilities): number {
    const w = probs.win;
    const l = probs.loseWin ?? 1.0 - w;
    const wBg = probs.winBackgammon;
    const lBg = probs.loseBackgammon;
    if (typeof probs.winGammonExclusive === 'number' && typeof probs.loseGammonExclusive === 'number') {
        return Number(((w - l) + (probs.winGammonExclusive - probs.loseGammonExclusive) + 2 * (wBg - lBg)).toFixed(4));
    }
    const wGCum = probs.winGammonCumulative ?? probs.winGammon;
    const lGCum = probs.loseGammonCumulative ?? probs.loseGammon;
    return Number(((w - l) + (wGCum - lGCum) + (wBg - lBg)).toFixed(4));
}

export interface BgsageMove {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    probabilities: BgsageProbabilities | null;
    board?: number[] | null;
    moves?: Move[] | null;
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
    source?: string | null;
}

const DEFAULT_CLOUD_RUN_URL = 'https://bgsage-service-468274233732.europe-west1.run.app';

export function resolveBgsageBaseUrl(): string {
    if (typeof window !== 'undefined') {
        if (process.env.NODE_ENV === 'test') {
            return (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim().replace(/\/+$/, '');
        }
        return '';
    }
    const raw = (process.env.BACKEND_URL ?? process.env.GNUBG_BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_CLOUD_RUN_URL).trim();
    return raw.replace(/\/+$/, '');
}

export function bgsageMoveBoardToProjectBoard(bgsageBoard: ReadonlyArray<number>, player: Player, source?: string | null): number[] {
    if (source === 'typescript-tri-phase') return bgsageBoard.map((v) => (v === 0 ? 0 : v));
    const res = new Array<number>(26).fill(0);
    if (player === 'X') {
        res[0] = Math.abs(bgsageBoard[25] ?? 0);
        const barO = -Math.abs(bgsageBoard[0] ?? 0);
        res[25] = barO === 0 ? 0 : barO;
        for (let p = 1; p <= 24; p++) res[p] = (bgsageBoard[p] ?? 0) === 0 ? 0 : (bgsageBoard[p] ?? 0);
    } else {
        res[0] = Math.abs(bgsageBoard[0] ?? 0);
        const barO = -Math.abs(bgsageBoard[25] ?? 0);
        res[25] = barO === 0 ? 0 : barO;
        for (let p = 1; p <= 24; p++) {
            const v = -(bgsageBoard[25 - p] ?? 0);
            res[p] = v === 0 ? 0 : v;
        }
    }
    return res;
}

export function boardsMatchOnPoints(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    for (let p = 1; p <= 24; p++) if ((a[p] ?? 0) !== (b[p] ?? 0)) return false;
    return true;
}

export function boardsMatchOnPointsAndBar(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    if (!boardsMatchOnPoints(a, b)) return false;
    if ((a[0] ?? 0) !== (b[0] ?? 0) || (a[25] ?? 0) !== (b[25] ?? 0)) return false;
    return borneOffCount(a as number[], 'X') === borneOffCount(b as number[], 'X') && borneOffCount(a as number[], 'O') === borneOffCount(b as number[], 'O');
}

function matchCandidateMoveByNotation(m: BgsageMove, legalSeqs: ReadonlyArray<MoveSequence>, boardBefore: ReadonlyArray<number>, player: Player): MoveSequence | undefined {
    if (m.moves && m.moves.length > 0) {
        const targetAbs = normalizeCoachNotation(formatMoveSequenceNotationAbsolute(m.moves, player));
        const byMoves = legalSeqs.find((seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === targetAbs);
        if (byMoves) return byMoves;
        let sim = [...boardBefore];
        for (const mv of m.moves) sim = applyMove(sim, mv, player);
        const byBoard = legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, sim)) ?? legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, sim));
        if (byBoard) return byBoard;
    }
    if (!m.notation || !m.notation.trim()) return undefined;
    const absTarget = relativeNotationToAbsolute(m.notation, player);
    const normAbs = normalizeCoachNotation(absTarget);
    const normRaw = normalizeCoachNotation(m.notation);
    if (normAbs) {
        const direct = legalSeqs.find((seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === normAbs);
        if (direct) return direct;
        const diffMatch = legalSeqs.find((seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(movesFromBoardDiff(boardBefore, seq.board, player), player)) === normAbs);
        if (diffMatch) return diffMatch;
        const parsed = parseCoachNotationMoves(absTarget, player);
        if (parsed.length > 0) {
            let sim = [...boardBefore];
            for (const mv of parsed) sim = applyMove(sim, mv, player);
            const bMatch = legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, sim)) ?? legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, sim));
            if (bMatch) return bMatch;
        }
    }
    if (player === 'O' && normRaw && normRaw !== normAbs) {
        const rawMatch = legalSeqs.find((seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === normRaw);
        if (rawMatch) return rawMatch;
    }
    return undefined;
}

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

export function validateNonRoundNeuralProbabilities(probs: { win: number; winGammon: number; winBackgammon: number; loseGammon: number; loseBackgammon: number }): boolean {
    const w = probs.win;
    const wg = probs.winGammon;
    const lg = probs.loseGammon;
    const isRound = (v: number) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;
    if (isRound(w) && isRound(wg) && isRound(lg)) return false;
    if (w === 0.5 && wg === 0.05) return false;
    if (w === 0.45 && wg === 0.08) return false;
    if (w === 0.58 && wg === 0.1) return false;
    return true;
}

export async function evaluateWithBgsage(xgid: string, ply: number = 2, timeoutMs: number = 4000): Promise<BgsageEvaluateResponse | null> {
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
        if (!response.ok) return null;
        const data = (await response.json()) as BgsageEvaluateResponse;
        if (data && Array.isArray(data.chequerPlay) && data.source !== 'typescript-tri-phase') {
            setCachedBgsageEvaluation(cacheKey, data);
        }
        return data;
    } catch {
        clearTimeout(timeoutId);
        return null;
    }
}

export async function evaluateWithBgsageStrictRetry(
    xgid: string,
    ply: 1 | 2 | 3 = 3,
    options?: { customFetch?: typeof fetch; baseUrlOverride?: string; timeoutMs?: number; skipCache?: boolean },
): Promise<{ response: BgsageEvaluateResponse; engineProof: EngineOriginProof }> {
    const fetchFn = options?.customFetch ?? fetch;
    const base = options?.baseUrlOverride ?? resolveBgsageBaseUrl();
    const url = base ? `${base}/api/evaluate` : '/api/evaluate';
    const safeXgid = ensureBgsageSafeXgid(xgid);
    const timeoutMs = options?.timeoutMs ?? 4000;
    const delays = [0, 250, 500];
    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) await new Promise((r) => setTimeout(r, delays[attempt]));
        const t0 = Date.now();
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetchFn(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ xgid: safeXgid, ply }),
                signal: controller.signal,
            });
            clearTimeout(tid);
            const latencyMs = Date.now() - t0;
            if (!res.ok) continue;
            const data = (await res.json()) as BgsageEvaluateResponse;
            if (!data || !Array.isArray(data.chequerPlay) || data.chequerPlay.length === 0 || data.source === 'typescript-tri-phase') continue;
            const topMove = data.chequerPlay[0];
            const p = topMove.probabilities;
            if (!p) continue;
            const probs: readonly [number, number, number, number, number] = [
                Number(p.win.toFixed(4)), Number(p.winGammon.toFixed(4)), Number(p.winBackgammon.toFixed(4)), Number(p.loseGammon.toFixed(4)), Number(p.loseBackgammon.toFixed(4)),
            ];
            const gamePlan = data.gamePlans?.player ?? topMove.playerGamePlan ?? 'Standard positional game';
            const engineProof: EngineOriginProof = { source: 'bgsage-cloud-run', ply, probs, gamePlan, latencyMs };
            return { response: data, engineProof };
        } catch {
            clearTimeout(tid);
        }
    }
    throw new Error(OPENSAGE_UNREACHABLE_ERROR_CODE);
}

export async function selectBotMoveWithBgsage(
    stateWithDice: BoardState,
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty = 'expert',
    timeoutMs: number = 3500,
    selectorFn: () => number = () => 0.5,
    precomputedResponse?: BgsageEvaluateResponse | null,
): Promise<{ sequence: MoveSequence; cubeDecision?: BgsageCubeDecision; evalLevel: string; equityLoss: number; isForced: boolean } | null> {
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return { sequence: legalSeqs[0], evalLevel: 'forced', equityLoss: 0, isForced: true };
    const ply = 3;
    const xgid = serializeCanonicalXGID(stateWithDice);
    const resp = precomputedResponse ?? (await evaluateWithBgsage(xgid, ply, timeoutMs));
    if (!resp || !resp.chequerPlay || resp.chequerPlay.length === 0) return null;
    const player = stateWithDice.turn;
    const matchedCandidates: Array<{ move: BgsageMove; seq: MoveSequence }> = [];
    for (const m of resp.chequerPlay) {
        if (m.board && m.board.length === 26) {
            const targetBoard = bgsageMoveBoardToProjectBoard(m.board, player, resp.source);
            const found = legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, targetBoard)) ?? legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, targetBoard));
            if (found && !matchedCandidates.some((c) => c.seq === found)) matchedCandidates.push({ move: m, seq: found });
        }
    }
    if (matchedCandidates.length === 0) {
        for (const m of resp.chequerPlay) {
            const found = matchCandidateMoveByNotation(m, legalSeqs, stateWithDice.board, player);
            if (found && !matchedCandidates.some((c) => c.seq === found)) matchedCandidates.push({ move: m, seq: found });
        }
    }
    if (matchedCandidates.length === 0) return null;
    const bestCand = matchedCandidates[0];
    const lossOf = (c: { move: BgsageMove }): number => Number(Math.max(0, bestCand.move.equity - c.move.equity).toFixed(4));
    if (difficulty === 'grandmaster' || difficulty === 'expert' || matchedCandidates.length === 1) {
        return { sequence: bestCand.seq, cubeDecision: resp.cubeDecision, evalLevel: `bgsage-${ply}ply`, equityLoss: 0, isForced: false };
    }
    const subOptimalThreshold = difficulty === 'beginner' ? 0.80 : 0.62;
    if (matchedCandidates.length >= 2 && selectorFn() < subOptimalThreshold) {
        const subPool = matchedCandidates.slice(1, Math.min(4, matchedCandidates.length));
        const pickIdx = difficulty === 'beginner' ? subPool.length - 1 : 0;
        const chosenSub = subPool[pickIdx] ?? matchedCandidates[1];
        return { sequence: chosenSub.seq, cubeDecision: resp.cubeDecision, evalLevel: difficulty === 'beginner' ? 'bgsage-3ply-beginner' : `bgsage-${ply}ply`, equityLoss: lossOf(chosenSub), isForced: false };
    }
    if (isVisuallyObviousBestMove(stateWithDice.board, bestCand.seq.board, player)) {
        return { sequence: bestCand.seq, cubeDecision: resp.cubeDecision, evalLevel: `bgsage-${ply}ply`, equityLoss: 0, isForced: false };
    }
    const topEq = bestCand.move.cubelessEquity ?? bestCand.move.equity;
    const blunderCap = BLUNDER_CAP_EMG_BY_DIFFICULTY[difficulty] ?? 0.035;
    const biasScale = difficulty === 'beginner' ? 0.35 : difficulty === 'intermediate' ? 0.22 : 0.08;
    const plausiblePool = matchedCandidates.filter((c, idx) => {
        if (idx === 0) return true;
        return Math.max(0, topEq - (c.move.cubelessEquity ?? c.move.equity)) <= blunderCap;
    });
    let chosen = bestCand;
    let bestScore = -Infinity;
    for (const cand of plausiblePool) {
        const baseEq = cand.move.cubelessEquity ?? cand.move.equity;
        const personaBias = computePersonaBiasDelta(stateWithDice.board, cand.seq.board, difficulty) * biasScale;
        if (baseEq + personaBias > bestScore) {
            bestScore = baseEq + personaBias;
            chosen = cand;
        }
    }
    return { sequence: chosen.seq, cubeDecision: resp.cubeDecision, evalLevel: difficulty === 'beginner' ? 'bgsage-3ply-beginner' : `bgsage-${ply}ply`, equityLoss: lossOf(chosen), isForced: false };
}

export async function selectBotMoveWithBgsageStrict(
    stateWithDice: BoardState,
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty = 'expert',
    options?: { customFetch?: typeof fetch; baseUrlOverride?: string; timeoutMs?: number },
): Promise<{ sequence: MoveSequence; cubeDecision?: BgsageCubeDecision; evalLevel: string; equityLoss: number; isForced: boolean; engineProof: EngineOriginProof }> {
    if (legalSeqs.length === 0) throw new Error(OPENSAGE_UNREACHABLE_ERROR_CODE);
    if (legalSeqs.length === 1) {
        const xgid = serializeCanonicalXGID(stateWithDice);
        const { engineProof } = await evaluateWithBgsageStrictRetry(xgid, 3, options);
        return { sequence: legalSeqs[0], evalLevel: 'forced', equityLoss: 0, isForced: true, engineProof };
    }
    const ply = 3 as const;
    const xgid = serializeCanonicalXGID(stateWithDice);
    const { response, engineProof } = await evaluateWithBgsageStrictRetry(xgid, ply, options);
    const res = await selectBotMoveWithBgsage(stateWithDice, legalSeqs, difficulty, options?.timeoutMs ?? 3500, () => 0.5, response);
    if (!res) throw new Error(OPENSAGE_UNREACHABLE_ERROR_CODE);
    return { ...res, engineProof };
}

export async function evaluateBotCubeWithBgsage(
    state: BoardState,
    _difficulty: AIDifficulty = 'expert',
    timeoutMs: number = 2200,
): Promise<{ shouldDouble: boolean; shouldTake: boolean; noDouble: number; doubleTake: number; doublePass: number; optimalAction: string } | null> {
    if (state.crawford) return { shouldDouble: false, shouldTake: true, noDouble: 0, doubleTake: 0, doublePass: 1, optimalAction: 'No Double (Crawford)' };
    const ply = 3;
    const xgid = serializeCanonicalXGID({ ...state, dice: null });
    const resp = await evaluateWithBgsage(xgid, ply, timeoutMs);
    if (!resp || !resp.cubeDecision) return null;
    const nd = resp.cubeDecision.noDouble;
    const dt = resp.cubeDecision.doubleTake;
    if (typeof nd !== 'number' || typeof dt !== 'number') return null;
    const dp = typeof resp.cubeDecision.doublePass === 'number' ? resp.cubeDecision.doublePass : 1.0;
    const action = resp.cubeDecision.optimalAction ?? 'No Double';
    const effectiveDoubleEquity = Math.min(dt, dp);
    const shouldDouble = nd >= 0.30 && ((effectiveDoubleEquity > nd + 0.005 && nd < dp) || (action.toLowerCase().includes('double') && !action.toLowerCase().includes('no double')));
    const shouldTake = dt <= dp;
    return { shouldDouble, shouldTake, noDouble: nd, doubleTake: dt, doublePass: dp, optimalAction: action };
}

export async function isBgsageAvailable(timeoutMs: number = 2000): Promise<boolean> {
    const base = resolveBgsageBaseUrl();
    const url = base ? `${base}/health` : '/health';
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(tid);
        return res.ok;
    } catch {
        clearTimeout(tid);
        return false;
    }
}
