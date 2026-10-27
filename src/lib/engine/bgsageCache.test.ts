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

    describe('Canonisation algébrique de la clé de cache (Invariances mathématiques)', () => {
        it('a) Symétrie des dés : fusionne les tirages permutations (ex: 13 et 31)', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
            globalThis.fetch = mockFetch as unknown as typeof fetch;

            // XG format 10 champs avec dés 13 puis 31
            const xgid13 = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:13:0:0:0:7:10';
            const xgid31 = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:7:10';

            const res1 = await evaluateWithBgsage(xgid13, 2);
            const res2 = await evaluateWithBgsage(xgid31, 2);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(res1);
        });

        it('b) Normalisation des scores away en Match Play (ex: 2/5 et 4/7 sont tous deux 3-away, 3-away)', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
            globalThis.fetch = mockFetch as unknown as typeof fetch;

            // 2/5 (matchLength 5, scores 2/2) -> 3-away, 3-away
            const xgidMatch5 = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:2:2:0:5:10';
            // 4/7 (matchLength 7, scores 4/4) -> 3-away, 3-away
            const xgidMatch7 = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:4:4:0:7:10';

            const res1 = await evaluateWithBgsage(xgidMatch5, 2);
            const res2 = await evaluateWithBgsage(xgidMatch7, 2);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(res1);
        });

        it('c) La valeur du cube n\'est PAS normalisée : cube 2 et cube 4 produisent des clés DIFFÉRENTES', async () => {
            const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => SAMPLE });
            globalThis.fetch = mockFetch as unknown as typeof fetch;

            // matchLength = 0 (money game). Cube à 2 (cubeExp = 1) puis Cube à 4 (cubeExp = 2)
            const xgidCube2 = 'XGID=-b----E-C---eE---c-e----B-:1:1:1:31:0:0:0:0:10';
            const xgidCube4 = 'XGID=-b----E-C---eE---c-e----B-:2:1:1:31:0:0:0:0:10';

            const res1 = await evaluateWithBgsage(xgidCube2, 2);
            const res2 = await evaluateWithBgsage(xgidCube4, 2);

            // L'équité cubeful dépend de la valeur du cube : deux appels réseau distincts.
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(res2).toEqual(res1);
        });
    });
});
