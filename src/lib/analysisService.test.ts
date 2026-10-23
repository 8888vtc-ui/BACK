import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    evaluatePosition,
    analyzePosition,
    buildXGID,
    clearAnalysisCache,
    getAnalysisCacheSize,
    getCachedAnalysis,
    setCachedAnalysis,
    selectAnalysisProvider,
    recordBackendLatency,
    resetLatencyTracker,
    getMeasuredBackendLatency,
    setBackendLatencyThreshold,
    getBackendLatencyThreshold,
    measureBackendLatency,
    isBackendAvailable,
    MoveAnalysis,
    CubeDecision,
} from './analysisService';
import { BoardState, createInitialState } from '../engine/backgammonEngine';

const MOCK_XGID = 'XGID=-b----E-C---eE---c-e----B-:1:0:0:42:0:1:0:0:0:10';

const MOCK_MOVES: MoveAnalysis[] = [
    {
        rank: 1,
        notation: '24/20 13/11',
        equity: 0.125,
        equityLoss: 0.0,
        probabilities: {
            win: 0.53,
            winGammon: 0.15,
            winBackgammon: 0.01,
            loseWin: 0.47,
            loseGammon: 0.12,
            loseBackgammon: 0.01,
        },
    },
    {
        rank: 2,
        notation: '13/9 13/11',
        equity: 0.11,
        equityLoss: -0.015,
        probabilities: {
            win: 0.52,
            winGammon: 0.14,
            winBackgammon: 0.01,
            loseWin: 0.48,
            loseGammon: 0.13,
            loseBackgammon: 0.01,
        },
    },
    { rank: 3, notation: '24/22 24/20', equity: 0.08, equityLoss: -0.045 },
    { rank: 4, notation: '8/4 6/4', equity: 0.05, equityLoss: -0.075 },
    { rank: 5, notation: '13/7', equity: -0.02, equityLoss: -0.145 },
    { rank: 6, notation: '24/18', equity: -0.08, equityLoss: -0.205 },
    { rank: 7, notation: '13/11 8/4', equity: -0.12, equityLoss: -0.245 },
];

const MOCK_CUBE: CubeDecision = {
    noDouble: 0.125,
    doubleTake: 0.21,
    doublePass: 1.0,
    optimalAction: 'No double, take',
};

describe('analysisService avec bascule automatique', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        clearAnalysisCache();
        resetLatencyTracker();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    describe('selectAnalysisProvider (Règles de bascule)', () => {
        it('oriente 0-ply vers WASM (temps réel)', () => {
            const decision = selectAnalysisProvider({ ply: 0 });
            expect(decision.provider).toBe('wasm');
            expect(decision.reason).toContain('temps réel');
        });

        it('oriente 1-ply vers WASM (temps réel)', () => {
            const decision = selectAnalysisProvider({ ply: 1 });
            expect(decision.provider).toBe('wasm');
            expect(decision.reason).toContain('temps réel');
        });

        it('oriente 2-ply vers Backend en condition nominale', () => {
            const decision = selectAnalysisProvider({ ply: 2 });
            expect(decision.provider).toBe('backend');
            expect(decision.reason).toContain('profonde');
        });

        it('bascule 2-ply vers WASM si la latence mesurée dépasse le seuil', () => {
            recordBackendLatency(950, true);
            setBackendLatencyThreshold(800);

            const decision = selectAnalysisProvider({ ply: 2 });
            expect(decision.provider).toBe('wasm');
            expect(decision.reason).toContain('Latence backend mesurée');
        });

        it('bascule 2-ply vers WASM si le backend est marqué indisponible après échecs répétés', () => {
            recordBackendLatency(3000, false);
            recordBackendLatency(3000, false);

            expect(isBackendAvailable()).toBe(false);
            const decision = selectAnalysisProvider({ ply: 2 });
            expect(decision.provider).toBe('wasm');
            expect(decision.reason).toContain('échec récent');
        });

        it('respecte le choix forcé preferredSource: wasm', () => {
            const decision = selectAnalysisProvider({ ply: 3, preferredSource: 'wasm' });
            expect(decision.provider).toBe('wasm');
        });

        it('respecte le choix forcé preferredSource: backend', () => {
            const decision = selectAnalysisProvider({ ply: 1, preferredSource: 'backend' });
            expect(decision.provider).toBe('backend');
        });
    });

    describe('Suivi de latence du backend', () => {
        it('enregistre et calcule la moyenne mobile de latence', () => {
            expect(getMeasuredBackendLatency()).toBeNull();
            recordBackendLatency(200, true);
            expect(getMeasuredBackendLatency()).toBe(200);

            // EMA: 200 * 0.7 + 100 * 0.3 = 170
            recordBackendLatency(100, true);
            expect(getMeasuredBackendLatency()).toBe(170);
        });

        it('mesure activement la latence via /health', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
            });

            const latency = await measureBackendLatency('http://localhost:8000');
            expect(latency).not.toBeNull();
            expect(typeof latency).toBe('number');
            expect(getMeasuredBackendLatency()).not.toBeNull();
        });
    });

    describe('evaluatePosition - Bascule temps réel vs profond', () => {
        it('exécute 1-ply (temps réel) via le Worker WASM sans appeler le réseau', async () => {
            const mockFetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/api/evaluate')) {
                    throw new Error('Le backend ne devrait pas être appelé en 1-ply');
                }
                return Promise.reject(new Error('Wasm file not on server'));
            });
            globalThis.fetch = mockFetch;

            const result = await evaluatePosition(MOCK_XGID, { ply: 1 });

            const evaluateCall = mockFetch.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('/api/evaluate'),
            );
            expect(evaluateCall).toBeUndefined();
            expect(result).not.toBeNull();
            expect(result?.source).toBe('wasm');
            expect(result?.ply).toBe(1);
            expect(result?.moves.length).toBeGreaterThan(0);
            expect(result?.cubeDecision.optimalAction).toBeTruthy();
        });

        it('exécute 2-ply (profond) via le Backend en condition nominale', async () => {
            const mockFetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/api/evaluate')) {
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: async () => ({
                            chequerPlay: MOCK_MOVES,
                            cubeDecision: MOCK_CUBE,
                        }),
                    });
                }
                return Promise.reject(new Error('Wasm file not on server'));
            });
            globalThis.fetch = mockFetch;

            const result = await evaluatePosition(MOCK_XGID, { ply: 2 });

            const evaluateCall = mockFetch.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('/api/evaluate'),
            );
            expect(evaluateCall).toBeDefined();
            expect(result).not.toBeNull();
            expect(result?.source).toBe('backend');
            expect(result?.moves).toHaveLength(5);
            expect(result?.moves[0].notation).toBe('24/20 13/11');
            expect(result?.cubeDecision).toEqual(MOCK_CUBE);
        });

        it('bascule automatiquement 2-ply sur WASM si latence mesurée > 800ms', async () => {
            recordBackendLatency(900, true);
            const mockFetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/api/evaluate')) {
                    throw new Error('Le backend ne devrait pas être appelé car latence > 800ms');
                }
                return Promise.reject(new Error('Wasm file not on server'));
            });
            globalThis.fetch = mockFetch;

            const result = await evaluatePosition(MOCK_XGID, {
                ply: 2,
                maxBackendLatencyMs: 800,
            });

            const evaluateCall = mockFetch.mock.calls.find(
                (call) => typeof call[0] === 'string' && call[0].includes('/api/evaluate'),
            );
            expect(evaluateCall).toBeUndefined();
            expect(result).not.toBeNull();
            expect(result?.source).toBe('wasm');
        });

        it('repli de secours automatique sur WASM si le backend échoue en 2-ply', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(console, 'info').mockImplementation(() => {});

            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Backend 502 Bad Gateway'));

            const result = await evaluatePosition(MOCK_XGID, {
                ply: 2,
                fallbackToWasm: true,
            });

            expect(result).not.toBeNull();
            expect(result?.source).toBe('wasm');
            expect(result?.moves.length).toBeGreaterThan(0);
        });

        it('bascule sur WASM lorsque le backend subit un timeout (AbortError)', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            globalThis.fetch = vi.fn().mockRejectedValue(abortErr);

            const result = await evaluatePosition(MOCK_XGID, {
                ply: 2,
                timeoutMs: 8000,
                fallbackToWasm: true,
            });

            expect(result).not.toBeNull();
            expect(result?.source).toBe('wasm');
            expect(result?.moves.length).toBeGreaterThan(0);
        });

        it('retourne null si le backend échoue et que fallbackToWasm est désactivé', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

            const result = await evaluatePosition(MOCK_XGID, {
                ply: 2,
                fallbackToWasm: false,
            });

            expect(result).toBeNull();
        });
    });

    describe('Cache par position (Map)', () => {
        it('sert le résultat depuis le cache au second appel pour la même position et ply', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    chequerPlay: MOCK_MOVES.slice(0, 5),
                    cubeDecision: MOCK_CUBE,
                }),
            });
            globalThis.fetch = mockFetch;

            expect(getAnalysisCacheSize()).toBe(0);

            // Premier appel -> backend
            const res1 = await evaluatePosition(MOCK_XGID, { ply: 2 });
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(res1?.cached).toBe(false);

            // Deuxième appel -> cache
            const res2 = await evaluatePosition(MOCK_XGID, { ply: 2 });
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(res2?.cached).toBe(true);
            expect(res2?.moves).toEqual(res1?.moves);
        });

        it('différencie le cache selon la profondeur ply', async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    chequerPlay: MOCK_MOVES.slice(0, 5),
                    cubeDecision: MOCK_CUBE,
                }),
            });
            globalThis.fetch = mockFetch;

            await evaluatePosition(MOCK_XGID, { ply: 0 }); // WASM
            await evaluatePosition(MOCK_XGID, { ply: 2 }); // Backend

            expect(getAnalysisCacheSize()).toBe(2);
        });

        it('clearAnalysisCache vide le cache', async () => {
            setCachedAnalysis(MOCK_XGID, {
                xgid: MOCK_XGID,
                moves: [],
                chequerPlay: [],
                cubeDecision: {},
            });
            expect(getAnalysisCacheSize()).toBe(1);

            clearAnalysisCache();
            expect(getAnalysisCacheSize()).toBe(0);
            expect(getCachedAnalysis(MOCK_XGID)).toBeNull();
        });
    });

    describe('Helpers et construction XGID', () => {
        it('buildXGID produit un identifiant valide', () => {
            const state = createInitialState();
            state.dice = [5, 3];
            const xgid = buildXGID(state);
            expect(xgid).toMatch(/^XGID=/);
            expect(xgid).toContain(':53:');
        });

        it('accepte directement un BoardState en entrée', async () => {
            const state = createInitialState();
            state.dice = [4, 2];

            const result = await evaluatePosition(state, { ply: 1 });
            expect(result).not.toBeNull();
            expect(result?.source).toBe('wasm');
            expect(result?.xgid).toMatch(/^XGID=/);
        });
    });
});
