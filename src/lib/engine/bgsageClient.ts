/**
 * Client d'évaluation Open Sage (bgsage-service sur Google Cloud Run).
 * Fournit les équités neurales (1-ply / 2-ply / 3-ply) avec cache mémoire LRU (200 entrées).
 */

import {
    applyMove,
    borneOffCount,
    serializeCanonicalXGID,
    serializeXGID,
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

export interface BgsageProbabilities {
    /** P(victoire totale) [0..1]. */
    win: number;
    /** P(gammon cumulé, incluant les backgammons conformément à la norme bgsage C++ / XG). */
    winGammon: number;
    /** P(backgammon). */
    winBackgammon: number;
    /** P(défaite totale) = 1 - win. */
    loseWin: number;
    /** P(gammon adverse cumulé, incluant les backgammons). */
    loseGammon: number;
    /** P(backgammon adverse). */
    loseBackgammon: number;
    /** P(gammon sans backgammon) optionnelle pour éviter toute ambiguïté. */
    winGammonExclusive?: number;
    /** P(gammon adverse sans backgammon) optionnelle. */
    loseGammonExclusive?: number;
    /** P(victoire simple sans gammon ni backgammon) optionnelle. */
    winSingle?: number;
    /** P(défaite simple) optionnelle. */
    loseSingle?: number;
    /** P(gammon cumulé) explicite. */
    winGammonCumulative?: number;
    /** P(gammon adverse cumulé) explicite. */
    loseGammonCumulative?: number;
}

/**
 * Calcule l'équité cubeless normalisée sans double comptage des backgammons :
 *
 * Formule canonique eXtreme Gammon / GNU Backgammon :
 * Equity = (W - L) + (W_g - L_g) + (W_bg - L_bg)
 * lorsque W_g et L_g sont cumulatifs (incluent déjà les backgammons).
 *
 * Si les probabilités exclusives sont fournies (sans backgammons) :
 * Equity = (W - L) + (W_g_excl - L_g_excl) + 2 * (W_bg - L_bg).
 */
export function calculateCubelessEquity(probs: BgsageProbabilities): number {
    const w = probs.win;
    const l = probs.loseWin ?? 1.0 - w;
    const wBg = probs.winBackgammon;
    const lBg = probs.loseBackgammon;

    if (typeof probs.winGammonExclusive === 'number' && typeof probs.loseGammonExclusive === 'number') {
        const wGExcl = probs.winGammonExclusive;
        const lGExcl = probs.loseGammonExclusive;
        return Number(((w - l) + (wGExcl - lGExcl) + 2 * (wBg - lBg)).toFixed(4));
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

/**
 * Résout l'URL de base du service d'évaluation :
 * - Côté navigateur (`window` défini) : utilise uniquement le proxy interne `/api/evaluate`
 *   (sauf si `NEXT_PUBLIC_BACKEND_URL` est explicitement forcé), afin de ne jamais exposer
 *   l'URL Google Cloud Run dans l'onglet Réseau (DevTools) du client.
 * - Côté serveur / Node : cible directement `BACKEND_URL` / `GNUBG_BACKEND_URL` ou Cloud Run.
 */
export function resolveBgsageBaseUrl(): string {
    if (typeof window !== 'undefined') {
        if (process.env.NODE_ENV === 'test') {
            const publicUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim();
            return publicUrl.replace(/\/+$/, '');
        }
        return '';
    }
    const raw = (
        process.env.BACKEND_URL ??
        process.env.GNUBG_BACKEND_URL ??
        process.env.NEXT_PUBLIC_BACKEND_URL ??
        DEFAULT_CLOUD_RUN_URL
    ).trim();
    return raw.replace(/\/+$/, '');
}

/**
 * Convertit un plateau `m.board` (26 entiers) vers la convention absolue `board[0..25]`.
 * Si `source === 'typescript-tri-phase'`, le plateau est déjà dans le référentiel projet (`board[0..25]`).
 */
export function bgsageMoveBoardToProjectBoard(
    bgsageBoard: ReadonlyArray<number>,
    player: Player,
    source?: string | null,
): number[] {
    if (source === 'typescript-tri-phase') {
        return bgsageBoard.map((v) => (v === 0 ? 0 : v));
    }
    const res = new Array<number>(26).fill(0);
    if (player === 'X') {
        res[0] = Math.abs(bgsageBoard[25] ?? 0);
        const barO = -Math.abs(bgsageBoard[0] ?? 0);
        res[25] = barO === 0 ? 0 : barO;
        for (let p = 1; p <= 24; p++) {
            const v = bgsageBoard[p] ?? 0;
            res[p] = v === 0 ? 0 : v;
        }
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

/** Compare deux plateaux sur les 24 flèches (indices 1..24). */
export function boardsMatchOnPoints(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    for (let p = 1; p <= 24; p++) {
        if ((a[p] ?? 0) !== (b[p] ?? 0)) return false;
    }
    return true;
}

/** Compare deux plateaux sur les 26 indices (flèches 1..24 + barres 0 et 25 + bear-off X et O). */
export function boardsMatchOnPointsAndBar(a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean {
    if (!boardsMatchOnPoints(a, b)) return false;
    if ((a[0] ?? 0) !== (b[0] ?? 0) || (a[25] ?? 0) !== (b[25] ?? 0)) return false;
    return (
        borneOffCount(a as number[], 'X') === borneOffCount(b as number[], 'X') &&
        borneOffCount(a as number[], 'O') === borneOffCount(b as number[], 'O')
    );
}

/**
 * Apparie un candidat `BgsageMove` contre `legalSeqs` par ses sous-coups ou sa notation
 * convertie en numérotation absolue (`formatMoveSequenceNotationAbsolute`).
 */
function matchCandidateMoveByNotation(
    m: BgsageMove,
    legalSeqs: ReadonlyArray<MoveSequence>,
    boardBefore: ReadonlyArray<number>,
    player: Player,
): MoveSequence | undefined {
    if (m.moves && m.moves.length > 0) {
        const targetAbsFromMoves = normalizeCoachNotation(formatMoveSequenceNotationAbsolute(m.moves, player));
        const byMovesNotation = legalSeqs.find(
            (seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === targetAbsFromMoves,
        );
        if (byMovesNotation) return byMovesNotation;

        let sim = [...boardBefore];
        for (const mv of m.moves) sim = applyMove(sim, mv, player);
        const byMovesBoard =
            legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, sim)) ??
            legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, sim));
        if (byMovesBoard) return byMovesBoard;
    }

    if (!m.notation || !m.notation.trim()) return undefined;

    const absTarget = relativeNotationToAbsolute(m.notation, player);
    const normAbsTarget = normalizeCoachNotation(absTarget);
    const normRawTarget = normalizeCoachNotation(m.notation);

    if (normAbsTarget) {
        // 1. Appariement direct ou insensible à l'ordre via formatMoveSequenceNotationAbsolute
        const directMatch = legalSeqs.find(
            (seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === normAbsTarget,
        );
        if (directMatch) return directMatch;

        // 2. Appariement sur le différentiel de plateau (coups chaînés ex. 24/13 vs 24/18 18/13)
        const diffMatch = legalSeqs.find((seq) => {
            const diffMoves = movesFromBoardDiff(boardBefore, seq.board, player);
            return normalizeCoachNotation(formatMoveSequenceNotationAbsolute(diffMoves, player)) === normAbsTarget;
        });
        if (diffMatch) return diffMatch;

        // 3. Replay des sous-coups parsés en notation absolue sur boardBefore
        const parsedMoves = parseCoachNotationMoves(absTarget, player);
        if (parsedMoves.length > 0) {
            let sim = [...boardBefore];
            for (const mv of parsedMoves) sim = applyMove(sim, mv, player);
            const boardMatch =
                legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, sim)) ??
                legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, sim));
            if (boardMatch) return boardMatch;
        }
    }

    // 4. Repli si l'appelant a fourni une notation déjà absolue pour O
    if (player === 'O' && normRawTarget && normRawTarget !== normAbsTarget) {
        const rawMatch = legalSeqs.find(
            (seq) => normalizeCoachNotation(formatMoveSequenceNotationAbsolute(seq.moves, player)) === normRawTarget,
        );
        if (rawMatch) return rawMatch;
    }

    return undefined;
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
            console.warn(`[MonteCarloEngine] Réponse HTTP ${response.status} du moteur d'évaluation`);
            return null;
        }

        const data = (await response.json()) as BgsageEvaluateResponse;
        if (data && Array.isArray(data.chequerPlay) && data.source !== 'typescript-tri-phase') {
            setCachedBgsageEvaluation(cacheKey, data);
        }
        return data;
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn('[MonteCarloEngine] Service distant indisponible :', err instanceof Error ? err.message : err);
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
    const xgid = serializeCanonicalXGID(stateWithDice);
    const resp = precomputedResponse ?? (await evaluateWithBgsage(xgid, ply, timeoutMs));
    if (!resp || !resp.chequerPlay || resp.chequerPlay.length === 0) return null;

    const player = stateWithDice.turn;
    const matchedCandidates: Array<{ move: BgsageMove; seq: MoveSequence }> = [];
    for (const m of resp.chequerPlay) {
        if (m.board && m.board.length === 26) {
            const targetBoard = bgsageMoveBoardToProjectBoard(m.board, player, resp.source);
            const found =
                legalSeqs.find((seq) => boardsMatchOnPointsAndBar(seq.board, targetBoard)) ??
                legalSeqs.find((seq) => boardsMatchOnPoints(seq.board, targetBoard));
            if (found && !matchedCandidates.some((c) => c.seq === found)) {
                matchedCandidates.push({ move: m, seq: found });
            }
        }
    }

    // Si aucun plateau n'a correspondu, tente un appariement par notation absolue contre legalSeqs
    if (matchedCandidates.length === 0) {
        for (const m of resp.chequerPlay) {
            const found = matchCandidateMoveByNotation(m, legalSeqs, stateWithDice.board, player);
            if (found && !matchedCandidates.some((c) => c.seq === found)) {
                matchedCandidates.push({ move: m, seq: found });
            }
        }
    }

    // Ne JAMAIS retourner legalSeqs[0] par défaut : retourne null pour basculer sur pickLocal() (findBestBoardMove)
    if (matchedCandidates.length === 0) {
        return null;
    }

    const bestCand = matchedCandidates[0];
    // 1. Grandmaster, Expert ou Coup d'Évidence Visuelle (fermeture de porte 2..8 / 17..23 ou frappe sûre) : verrouillage 100 % optimal
    if (
        difficulty === 'grandmaster' ||
        difficulty === 'expert' ||
        matchedCandidates.length === 1 ||
        isVisuallyObviousBestMove(stateWithDice.board, bestCand.seq.board, player)
    ) {
        return { sequence: bestCand.seq, cubeDecision: resp.cubeDecision, evalLevel: `bgsage-${ply}ply` };
    }

    // 2. Filtrage déterministe « Premier Principe » (Zéro bruit gaussien) : Plafond Blunder Cap ΔE_max + Biais Cognitif Persona
    const topEq = bestCand.move.cubelessEquity ?? bestCand.move.equity;
    const blunderCap = BLUNDER_CAP_EMG_BY_DIFFICULTY[difficulty] ?? 0.035;
    const biasScale = difficulty === 'beginner' ? 0.35 : difficulty === 'intermediate' ? 0.22 : 0.08;
    const jitter = (randomFn() - 0.5) * (difficulty === 'beginner' ? 0.008 : 0.002);

    const plausiblePool = matchedCandidates.filter((c, idx) => {
        if (idx === 0) return true;
        const eq = c.move.cubelessEquity ?? c.move.equity;
        return Math.max(0, topEq - eq) <= blunderCap;
    });

    let chosen = bestCand;
    let bestScore = -Infinity;
    for (const cand of plausiblePool) {
        const baseEq = cand.move.cubelessEquity ?? cand.move.equity;
        const personaBias = computePersonaBiasDelta(stateWithDice.board, cand.seq.board, difficulty) * biasScale;
        const score = baseEq + personaBias + (cand === bestCand ? 0 : jitter);
        if (score > bestScore) {
            bestScore = score;
            chosen = cand;
        }
    }

    return {
        sequence: chosen.seq,
        cubeDecision: resp.cubeDecision,
        evalLevel: difficulty === 'beginner' ? 'bgsage-1ply-beginner' : `bgsage-${ply}ply`,
    };
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
    const xgid = serializeCanonicalXGID({ ...state, dice: null });
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
