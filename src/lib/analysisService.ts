/**
 * Service d'analyse hybride Backgammon — orchestration intelligente Client WASM / Backend GNUBG.
 *
 * Fonctionnalités :
 * - Construction automatique du XGID depuis un `BoardState` ou chaîne XGID.
 * - Bascule automatique basée sur la profondeur :
 *     - Analyse temps réel (0-ply / 1-ply) : exécutée localement via le Web Worker WASM (zéro latence réseau).
 *     - Analyse profonde (2-ply+) : dirigée vers le backend GNUBG (`POST /api/evaluate`).
 * - Bascule adaptative selon la latence mesurée :
 *     - Si la latence mesurée du backend dépasse le seuil acceptable (défaut: 800ms) ou si le backend
 *       est dégradé/injoignable, bascule automatique sur le Worker WASM local.
 * - Restitution du top-5 coups candidats avec équités, pertes d'équités, probabilités et décision de videau.
 * - Cache mémoire par position et profondeur (`Map`) évitant les recalculs redondants.
 * - Repli gracieux : retour de résultat WASM de secours ou `null` propre sans jamais lever d'exception.
 */

import { BoardState, parseXGID, serializeXGID } from '../engine/backgammonEngine';
import gnubgClient from './engine/client';
import { ensureBgsageSafeXgid } from './engine/bgsageClient';

export type EngineProvider = 'wasm' | 'backend';

export interface Probabilities {
    win: number;
    winGammon: number;
    winBackgammon: number;
    loseWin: number;
    loseGammon: number;
    loseBackgammon: number;
}

export interface MoveAnalysis {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    probabilities?: Probabilities | null;
}

export interface CubeDecision {
    noDouble?: number | null;
    doubleTake?: number | null;
    doublePass?: number | null;
    optimalAction?: string | null;
}

export interface EvaluateResponse {
    chequerPlay: MoveAnalysis[];
    cubeDecision: CubeDecision;
}

export interface AnalysisResult {
    xgid: string;
    /** Top 5 des meilleurs coups classés avec équité et probabilités. */
    moves: MoveAnalysis[];
    /** Alias pour compatibilité exacte avec le schéma EvaluateResponse du backend. */
    chequerPlay: MoveAnalysis[];
    /** Évaluation de la décision de videau. */
    cubeDecision: CubeDecision;
    /** Indique si le résultat provient du cache mémoire. */
    cached?: boolean;
    /** Moteur ayant produit l'analyse ('wasm' ou 'backend'). */
    source?: EngineProvider;
    /** Temps d'exécution mesuré en millisecondes. */
    latencyMs?: number;
    /** Profondeur d'analyse appliquée. */
    ply?: number;
}

export interface AnalysisOptions {
    /** Profondeur d'évaluation GNUBG (0 à 4, défaut: 2). */
    ply?: number;
    /** URL de base du backend. Par défaut: NEXT_PUBLIC_BACKEND_URL ou chaîne vide (URL relative). */
    baseUrl?: string;
    /** Délai maximum avant abandon de la requête en millisecondes (défaut: 5000ms). */
    timeoutMs?: number;
    /** Si vrai, ignore le cache et force un recalcul (défaut: false). */
    bypassCache?: boolean;
    /** AbortSignal externe optionnel pour annuler la requête. */
    signal?: AbortSignal;
    /** Source d'évaluation : 'auto' (défaut), 'wasm', ou 'backend'. */
    preferredSource?: 'auto' | 'wasm' | 'backend';
    /** Seuil de latence backend max en ms avant bascule sur WASM (défaut: 800ms). */
    maxBackendLatencyMs?: number;
    /** Si vrai (défaut), bascule sur WASM si le backend échoue pour une analyse 2-ply+. */
    fallbackToWasm?: boolean;
}

// ---------------------------------------------------------------------------
// Suivi de latence du backend
// ---------------------------------------------------------------------------

interface LatencyTrackerState {
    emaLatencyMs: number | null;
    thresholdMs: number;
    consecutiveFailures: number;
    lastFailureTime: number | null;
}

const latencyState: LatencyTrackerState = {
    emaLatencyMs: null,
    thresholdMs: 800,
    consecutiveFailures: 0,
    lastFailureTime: null,
};

export function getMeasuredBackendLatency(): number | null {
    return latencyState.emaLatencyMs;
}

export function setBackendLatencyThreshold(ms: number): void {
    latencyState.thresholdMs = ms;
}

export function getBackendLatencyThreshold(): number {
    return latencyState.thresholdMs;
}

export function isBackendAvailable(): boolean {
    if (latencyState.consecutiveFailures >= 2 && latencyState.lastFailureTime !== null) {
        const elapsed = Date.now() - latencyState.lastFailureTime;
        if (elapsed < 15000) {
            return false;
        }
    }
    return true;
}

export function recordBackendLatency(ms: number, isSuccess: boolean = true): void {
    if (isSuccess) {
        latencyState.consecutiveFailures = 0;
        latencyState.lastFailureTime = null;
        if (latencyState.emaLatencyMs === null) {
            latencyState.emaLatencyMs = ms;
        } else {
            latencyState.emaLatencyMs = Math.round(latencyState.emaLatencyMs * 0.7 + ms * 0.3);
        }
    } else {
        latencyState.consecutiveFailures++;
        latencyState.lastFailureTime = Date.now();
        if (latencyState.emaLatencyMs !== null) {
            latencyState.emaLatencyMs = Math.max(latencyState.emaLatencyMs, ms);
        } else {
            latencyState.emaLatencyMs = ms;
        }
    }
}

export function resetLatencyTracker(): void {
    latencyState.emaLatencyMs = null;
    latencyState.thresholdMs = 800;
    latencyState.consecutiveFailures = 0;
    latencyState.lastFailureTime = null;
}

/**
 * Mesure activement la latence du backend via son endpoint de santé /health.
 */
export async function measureBackendLatency(baseUrl?: string): Promise<number | null> {
    const rawBase = (baseUrl ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim();
    const cleanBase = rawBase.replace(/\/+$/, '');
    const url = cleanBase ? `${cleanBase}/health` : '/health';

    const start = performance.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
            recordBackendLatency(3000, false);
            return null;
        }
        const rtt = Math.round(performance.now() - start);
        recordBackendLatency(rtt, true);
        return rtt;
    } catch {
        recordBackendLatency(3000, false);
        return null;
    }
}

/**
 * Détermine le fournisseur optimal (WASM ou Backend) selon la profondeur et la latence.
 */
export function selectAnalysisProvider(options: {
    ply?: number;
    preferredSource?: 'auto' | 'wasm' | 'backend';
    maxBackendLatencyMs?: number;
} = {}): { provider: EngineProvider; reason: string } {
    const preferred = options.preferredSource ?? 'auto';
    if (preferred === 'wasm') {
        return { provider: 'wasm', reason: 'Forcé explicitement (preferredSource: wasm)' };
    }
    if (preferred === 'backend') {
        return { provider: 'backend', reason: 'Forcé explicitement (preferredSource: backend)' };
    }

    const ply = options.ply ?? 2;

    // Règle 1 : analyse temps réel (0-ply ou 1-ply) -> Worker WASM local
    if (ply <= 1) {
        return {
            provider: 'wasm',
            reason: `Analyse temps réel (${ply}-ply) exécutée localement via Web Worker WASM`,
        };
    }

    // Règle 2 : analyse profonde (2-ply+) -> Backend si disponible et suffisamment rapide
    const threshold = options.maxBackendLatencyMs ?? getBackendLatencyThreshold();
    const currentLatency = getMeasuredBackendLatency();

    if (!isBackendAvailable()) {
        return {
            provider: 'wasm',
            reason: 'Backend en échec récent, bascule automatique sur WASM local',
        };
    }

    if (currentLatency !== null && currentLatency > threshold) {
        return {
            provider: 'wasm',
            reason: `Latence backend mesurée (${currentLatency}ms > seuil ${threshold}ms), bascule sur WASM local`,
        };
    }

    return {
        provider: 'backend',
        reason: `Analyse profonde (${ply}-ply) dirigée vers le backend GNUBG`,
    };
}

// ---------------------------------------------------------------------------
// Cache mémoire
// ---------------------------------------------------------------------------

// Cache mémoire indexé par `${xgid}::ply=${ply}`
const positionCache = new Map<string, AnalysisResult>();

export function buildXGID(state: BoardState): string {
    return serializeXGID(state);
}

export function clearAnalysisCache(): void {
    positionCache.clear();
}

export function getAnalysisCacheSize(): number {
    return positionCache.size;
}

export function getCachedAnalysis(
    target: BoardState | string,
    ply: number = 2,
): AnalysisResult | null {
    const xgid = typeof target === 'string' ? target : buildXGID(target);
    const key = `${xgid}::ply=${ply}`;
    const hit = positionCache.get(key);
    if (!hit) return null;
    return { ...hit, cached: true };
}

export function setCachedAnalysis(
    target: BoardState | string,
    result: AnalysisResult,
    ply: number = 2,
): void {
    const xgid = typeof target === 'string' ? target : buildXGID(target);
    const key = `${xgid}::ply=${ply}`;
    positionCache.set(key, { ...result, xgid });
}

function resolveEndpointUrl(baseUrl?: string): string {
    const rawBase = (baseUrl ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim();
    if (!rawBase) {
        return '/api/evaluate';
    }
    const cleanBase = rawBase.replace(/\/+$/, '');
    return `${cleanBase}/api/evaluate`;
}

// ---------------------------------------------------------------------------
// Exécution WASM locale
// ---------------------------------------------------------------------------

async function evaluateWithWasm(
    target: BoardState | string,
    ply: number,
    timeoutMs: number = 8000,
): Promise<AnalysisResult | null> {
    const startTime = performance.now();
    try {
        const xgid = typeof target === 'string' ? target : buildXGID(target);
        const state = typeof target === 'string' ? parseXGID(target) : target;
        const dice = state.dice;

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout de l'évaluation WASM après ${timeoutMs}ms`)), timeoutMs)
        );

        const executionPromise = (async () => {
            let moves: MoveAnalysis[] = [];
            if (dice && dice[0] > 0 && dice[1] > 0) {
                const movesRes = await gnubgClient.analyzeMoves({
                    position: state,
                    dice,
                    ply,
                    maxMoves: 5,
                });
                moves = movesRes.moves.slice(0, 5);
            }

            const cubeRes = await gnubgClient.analyzeCube({
                position: state,
                ply,
            });

            return { moves, cubeRes };
        })();

        const { moves, cubeRes } = await Promise.race([executionPromise, timeoutPromise]);

        const cubeDecision: CubeDecision = {
            noDouble: cubeRes.noDouble,
            doubleTake: cubeRes.doubleTake,
            doublePass: cubeRes.doublePass,
            optimalAction: cubeRes.optimalAction,
        };

        const latencyMs = Math.round(performance.now() - startTime);

        return {
            xgid,
            moves,
            chequerPlay: moves,
            cubeDecision,
            cached: false,
            source: 'wasm',
            latencyMs,
            ply,
        };
    } catch (err) {
        console.warn('[analysisService] Échec ou timeout de l\'évaluation WASM :', err);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Exécution Backend distante
// ---------------------------------------------------------------------------

async function evaluateWithBackend(
    xgid: string,
    ply: number,
    options: AnalysisOptions,
): Promise<AnalysisResult | null> {
    const startTime = performance.now();
    const url = resolveEndpointUrl(options.baseUrl);
    const timeoutMs = options.timeoutMs ?? 8000;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        abortController.abort();
    }, timeoutMs);

    if (options.signal) {
        if (options.signal.aborted) {
            clearTimeout(timeoutId);
            abortController.abort();
        } else {
            options.signal.addEventListener(
                'abort',
                () => {
                    clearTimeout(timeoutId);
                    abortController.abort();
                },
                { once: true },
            );
        }
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                xgid: ensureBgsageSafeXgid(xgid),
                ply,
            }),
            signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            recordBackendLatency(timeoutMs, false);
            console.warn(
                `[analysisService] Backend evaluate request returned HTTP status ${response.status}`,
            );
            return null;
        }

        const duration = Math.round(performance.now() - startTime);
        recordBackendLatency(duration, true);

        const data: Partial<EvaluateResponse> = await response.json();
        const rawChequerPlay: MoveAnalysis[] = Array.isArray(data.chequerPlay)
            ? data.chequerPlay
            : [];
        const top5Moves: MoveAnalysis[] = rawChequerPlay.slice(0, 5);

        const cubeDecision: CubeDecision = data.cubeDecision ?? {
            noDouble: null,
            doubleTake: null,
            doublePass: null,
            optimalAction: null,
        };

        return {
            xgid,
            moves: top5Moves,
            chequerPlay: top5Moves,
            cubeDecision,
            cached: false,
            source: 'backend',
            latencyMs: duration,
            ply,
        };
    } catch (error) {
        clearTimeout(timeoutId);
        recordBackendLatency(timeoutMs, false);
        console.warn(
            '[analysisService] Backend indisponible ou échec de l\'évaluation :',
            error instanceof Error ? error.message : error,
        );
        return null;
    }
}

// ---------------------------------------------------------------------------
// Point d'entrée principal avec routage hybride et repli automatique
// ---------------------------------------------------------------------------

/**
 * Évalue une position de Backgammon avec bascule automatique WASM / Backend.
 *
 * Règles :
 * - 0-ply / 1-ply : exécuté instantanément sur le Web Worker WASM local.
 * - 2-ply+ : exécuté via le backend distant si disponible et performant.
 * - Bascule adaptative : si la latence mesurée dépasse le seuil (ex: 800ms) ou si le backend
 *   est dégradé, exécute automatiquement sur le worker WASM.
 * - Repli automatique : si le backend échoue en 2-ply+, bascule transparente sur WASM
 *   (sauf si fallbackToWasm: false).
 */
export async function evaluatePosition(
    target: BoardState | string,
    options: AnalysisOptions = {},
): Promise<AnalysisResult | null> {
    try {
        const xgid = typeof target === 'string' ? target : buildXGID(target);
        const ply = options.ply ?? 2;
        const cacheKey = `${xgid}::ply=${ply}`;

        // 1. Vérification du cache mémoire
        if (!options.bypassCache && positionCache.has(cacheKey)) {
            const cachedResult = positionCache.get(cacheKey)!;
            return {
                ...cachedResult,
                cached: true,
            };
        }

        // 2. Sélection du fournisseur selon la profondeur et la latence mesurée
        const decision = selectAnalysisProvider({
            ply,
            preferredSource: options.preferredSource,
            maxBackendLatencyMs: options.maxBackendLatencyMs,
        });

        const timeoutMs = options.timeoutMs ?? 8000;
        let result: AnalysisResult | null = null;

        if (decision.provider === 'wasm') {
            result = await evaluateWithWasm(target, ply, timeoutMs);
        } else {
            // Tentative via le backend
            result = await evaluateWithBackend(xgid, ply, options);

            // Repli automatique sur le worker WASM si le backend a échoué
            const shouldFallbackToWasm = options.fallbackToWasm !== false;
            if (!result && shouldFallbackToWasm) {
                console.info('[analysisService] Bascule de secours vers le Worker WASM suite à l\'échec backend');
                result = await evaluateWithWasm(target, ply, timeoutMs);
            }
        }

        if (result) {
            positionCache.set(cacheKey, result);
        }

        return result;
    } catch (error) {
        console.warn('[analysisService] Erreur inattendue lors de l\'évaluation :', error);
        return null;
    }
}

// Alias ergonomique
export const analyzePosition = evaluatePosition;

const analysisService = {
    evaluatePosition,
    analyzePosition,
    buildXGID,
    clearAnalysisCache,
    getAnalysisCacheSize,
    getCachedAnalysis,
    setCachedAnalysis,
    selectAnalysisProvider,
    getMeasuredBackendLatency,
    recordBackendLatency,
    setBackendLatencyThreshold,
    getBackendLatencyThreshold,
    resetLatencyTracker,
    measureBackendLatency,
    isBackendAvailable,
};

export default analysisService;
