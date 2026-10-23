import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { evaluateWithBgsage, clearBgsageEvaluationCache, type BgsageEvaluateResponse } from './bgsageClient';
import {
    BGSAGE_CACHE_MAX_ENTRIES,
    bgsageEvaluationCacheSize,
    setCachedBgsageEvaluation,
    getCachedBgsageEvaluation,
} from './bgsageCache';

const SAMPLE: BgsageEvaluateResponse = {
    chequerPlay: [{ rank: 1, notation: '8/5 6/5', equity: 0.15, equityLoss: 0, probabilities: null }],
    cubeDecision: { noDouble: 0.1, doubleTake: 0.2, doublePass: 1, optimalAction: 'No Double' },
};

describe('Cache LRU des évaluations Open Sage', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        clearBgsageEvaluationCache();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        clearBgsageEvaluationCache();
    });

    it('sert le second appel identique depuis le cache, sans réseau', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const a = await evaluateWithBgsage('XGID=test:0:0:1:31:0:0:0:7:10', 2);
        const b = await evaluateWithBgsage('XGID=test:0:0:1:31:0:0:0:7:10', 2);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(b).toEqual(a);
    });

    it('distingue les profondeurs (ply) dans la clé de cache', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        await evaluateWithBgsage('XGID=pos', 1);
        await evaluateWithBgsage('XGID=pos', 3);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('ne met jamais en cache un échec réseau', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('down'));
        globalThis.fetch = mockFetch as unknown as typeof fetch;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(await evaluateWithBgsage('XGID=fail', 2)).toBeNull();
        expect(await evaluateWithBgsage('XGID=fail', 2)).toBeNull();
        expect(mockFetch).toHaveBeenCalledTimes(2);
        warn.mockRestore();
    });

    it('renvoie des copies isolées (une mutation ne pollue pas le cache)', async () => {
        const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
        globalThis.fetch = mockFetch as unknown as typeof fetch;

        const first = await evaluateWithBgsage('XGID=iso', 2);
        first!.chequerPlay[0].equity = -9;
        const second = await evaluateWithBgsage('XGID=iso', 2);
        expect(second!.chequerPlay[0].equity).toBe(0.15);
    });

    it(`évince l’entrée la moins récemment utilisée au-delà de ${BGSAGE_CACHE_MAX_ENTRIES} entrées`, () => {
        for (let i = 0; i < BGSAGE_CACHE_MAX_ENTRIES; i++) setCachedBgsageEvaluation(`k${i}`, SAMPLE);
        // k0 devient la plus récente : c'est k1 qui doit être évincée.
        expect(getCachedBgsageEvaluation('k0')).not.toBeNull();
        setCachedBgsageEvaluation('overflow', SAMPLE);
        expect(bgsageEvaluationCacheSize()).toBe(BGSAGE_CACHE_MAX_ENTRIES);
        expect(getCachedBgsageEvaluation('k1')).toBeNull();
        expect(getCachedBgsageEvaluation('k0')).not.toBeNull();
    });
});
