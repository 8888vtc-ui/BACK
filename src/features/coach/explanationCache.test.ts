import { describe, it, expect, beforeEach } from 'vitest';
import {
    ExplanationCache,
    computeExplanationCacheKey,
    globalExplanationCache,
} from './explanationCache';

describe('ExplanationCache', () => {
    let cache: ExplanationCache;

    beforeEach(() => {
        cache = new ExplanationCache(5, 'test_cache_key');
        cache.clear();
        globalExplanationCache.clear();
    });

    describe('computeExplanationCacheKey', () => {
        it('génère une clé déterministe identique pour les mêmes arguments', () => {
            const key1 = computeExplanationCacheKey({
                positionKey: '4HPwATDgc/ABMA',
                playedMove: '13/9 24/23',
                optimalMove: '8/4 6/4',
                verdict: 'blunder',
                matchLength: 7,
                scoreX: 4,
                scoreO: 3,
            });

            const key2 = computeExplanationCacheKey({
                positionKey: '4HPwATDgc/ABMA',
                playedMove: '13/9 24/23',
                optimalMove: '8/4 6/4',
                verdict: 'blunder',
                matchLength: 7,
                scoreX: 4,
                scoreO: 3,
            });

            expect(key1).toBe(key2);
            expect(key1).toContain('4HPwATDgc/ABMA');
            expect(key1).toContain('13/9 24/23');
            expect(key1).toContain('8/4 6/4');
        });

        it('différencie les clés si la position ou le coup joué changent', () => {
            const key1 = computeExplanationCacheKey({
                positionKey: 'pos1',
                playedMove: '13/9',
            });
            const key2 = computeExplanationCacheKey({
                positionKey: 'pos2',
                playedMove: '13/9',
            });
            const key3 = computeExplanationCacheKey({
                positionKey: 'pos1',
                playedMove: '24/20',
            });

            expect(key1).not.toBe(key2);
            expect(key1).not.toBe(key3);
        });
    });

    describe('Gestion du cache en mémoire', () => {
        it('stocke et restitue une explication', () => {
            const key = 'test-key-1';
            cache.set(key, {
                summary: 'Erreur de blot',
                explanation: 'Vous laissez un blot exposé au point 7.',
                keyConcept: 'Minimisation des tirs',
                advice: 'Gardez vos pions connectés.',
                rawText: 'Explication brute',
                source: 'llm',
            });

            expect(cache.has(key)).toBe(true);
            const item = cache.get(key);
            expect(item).not.toBeNull();
            expect(item?.summary).toBe('Erreur de blot');
            expect(item?.keyConcept).toBe('Minimisation des tirs');
            expect(item?.source).toBe('llm');
            expect(item?.timestamp).toBeGreaterThan(0);
        });

        it('retourne null si la clé n\'existe pas', () => {
            expect(cache.get('cle-inconnue')).toBeNull();
            expect(cache.has('cle-inconnue')).toBe(false);
        });

        it('respecte la capacité maximale et évince les entrées les plus anciennes (LRU)', () => {
            const smallCache = new ExplanationCache(3, 'test_small_cache');

            smallCache.set('k1', { rawText: '1', source: 'rule-based' });
            smallCache.set('k2', { rawText: '2', source: 'rule-based' });
            smallCache.set('k3', { rawText: '3', source: 'rule-based' });

            expect(smallCache.size()).toBe(3);

            // Accéder à k1 pour le rendre récemment utilisé
            smallCache.get('k1');

            // Insérer k4 -> doit évincer k2 (le plus ancien non accédé)
            smallCache.set('k4', { rawText: '4', source: 'rule-based' });

            expect(smallCache.size()).toBe(3);
            expect(smallCache.has('k1')).toBe(true);
            expect(smallCache.has('k2')).toBe(false);
            expect(smallCache.has('k3')).toBe(true);
            expect(smallCache.has('k4')).toBe(true);
        });

        it('vide complètement le cache avec clear', () => {
            cache.set('k1', { rawText: '1', source: 'rule-based' });
            cache.set('k2', { rawText: '2', source: 'rule-based' });
            expect(cache.size()).toBe(2);

            cache.clear();
            expect(cache.size()).toBe(0);
            expect(cache.get('k1')).toBeNull();
        });
    });
});
