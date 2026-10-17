import { describe, it, expect } from 'vitest';
import {
    KNOWLEDGE_BASE_CONCEPTS,
    getTheoryConceptById,
    searchTheoryConcepts,
    getTheoryConceptsByCategory,
} from './knowledgeBaseData';

describe('Base de Connaissances Théorique de Backgammon', () => {
    it('contient au moins 15 concepts théoriques fondamentaux', () => {
        expect(KNOWLEDGE_BASE_CONCEPTS.length).toBeGreaterThanOrEqual(15);
    });

    it('chaque concept possède un id unique et des textes bilingues FR/EN valides', () => {
        const ids = new Set<string>();
        for (const concept of KNOWLEDGE_BASE_CONCEPTS) {
            expect(concept.id).toBeTruthy();
            expect(ids.has(concept.id)).toBe(false);
            ids.add(concept.id);

            expect(concept.title.fr).toBeTruthy();
            expect(concept.title.en).toBeTruthy();
            expect(concept.summary.fr).toBeTruthy();
            expect(concept.summary.en).toBeTruthy();
            expect(concept.goldenRule.fr).toBeTruthy();
            expect(concept.goldenRule.en).toBeTruthy();
            expect(concept.author).toBeTruthy();
            expect(concept.sources.length).toBeGreaterThan(0);
        }
    });

    it('permet de récupérer un concept par son id', () => {
        const golden = getTheoryConceptById('golden-point');
        expect(golden).toBeDefined();
        expect(golden?.author).toBe('Paul Magriel');

        const epc = getTheoryConceptById('trice-epc');
        expect(epc).toBeDefined();
        expect(epc?.author).toBe('Walter Trice');

        const take = getTheoryConceptById('take-point');
        expect(take).toBeDefined();
    });

    it('permet la recherche textuelle multi-champs (titre, auteur, tags)', () => {
        const resultsMagriel = searchTheoryConcepts('Magriel', 'fr');
        expect(resultsMagriel.length).toBeGreaterThan(0);

        const resultsEPC = searchTheoryConcepts('Wastage', 'en');
        expect(resultsEPC.some((c) => c.id === 'trice-epc')).toBe(true);

        const resultsVideau = searchTheoryConcepts('Videau', 'fr');
        expect(resultsVideau.length).toBeGreaterThan(0);
    });

    it('permet le filtrage par catégorie', () => {
        const fundamentals = getTheoryConceptsByCategory('fundamentals');
        expect(fundamentals.length).toBeGreaterThan(0);
        expect(fundamentals.every((c) => c.category === 'fundamentals')).toBe(true);

        const plans = getTheoryConceptsByCategory('game-plans');
        expect(plans.length).toBeGreaterThan(0);
        expect(plans.every((c) => c.category === 'game-plans')).toBe(true);
    });
});
