/**
 * @file src/lib/coach/supabaseKnowledgeCorpus.test.ts
 * @description Tests unitaires du corpus unifié de connaissances Supabase pour le Coach Grand-Maître.
 */

import { describe, it, expect } from 'vitest';
import {
    buildFullCoachKnowledgeCorpus,
    queryCoachKnowledgeForContext,
} from './supabaseKnowledgeCorpus';

describe('supabaseKnowledgeCorpus — Corpus Grand-Maître Unifié (98 entrées)', () => {
    it('agrège les 6 familles de connaissances sans doublon d’identifiant ni de slug', () => {
        const corpus = buildFullCoachKnowledgeCorpus();
        expect(corpus.length).toBeGreaterThanOrEqual(90);

        const ids = new Set(corpus.map((r) => r.id));
        const slugs = new Set(corpus.map((r) => r.slug));
        expect(ids.size).toBe(corpus.length);
        expect(slugs.size).toBe(corpus.length);

        const types = new Set(corpus.map((r) => r.corpus_type));
        expect(types.has('theory_concept')).toBe(true);
        expect(types.has('michy_proverb')).toBe(true);
        expect(types.has('positional_motif')).toBe(true);
        expect(types.has('race_cube_formula')).toBe(true);
        expect(types.has('opening_roll_3ply')).toBe(true);
        expect(types.has('wbgf_glossary_7lang')).toBe(true);
    });

    it('retourne les connaissances ciblées pour un motif XAI ou un lancer d’ouverture', async () => {
        const blitzEntries = await queryCoachKnowledgeForContext({
            motifId: 'BLITZ_HIT_AND_COVER',
        });
        expect(blitzEntries.length).toBeGreaterThan(0);
        expect(blitzEntries[0]?.motif_id).toBe('BLITZ_HIT_AND_COVER');

        const opening31 = await queryCoachKnowledgeForContext({
            diceRoll: '3-1',
        });
        expect(opening31.some((e) => e.id === 'opening:3-1')).toBe(true);
    });
});

