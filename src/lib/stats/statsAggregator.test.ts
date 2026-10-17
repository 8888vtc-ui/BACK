import { describe, it, expect, beforeEach } from 'vitest';
import {
    categorizeExplanation,
    getPRCategory,
    aggregateUserStats,
    STRATEGIC_CONCEPTS_CATALOG,
} from './statsAggregator';
import { putRecord, clearStore } from '../offline/idb';

describe('StatsAggregator (Error Rate & Concepts Stratégiques)', () => {
    beforeEach(async () => {
        await clearStore('games');
        await clearStore('moves');
        await clearStore('coach_explanations');
    });

    describe('categorizeExplanation', () => {
        it('classe correctement les concepts de minimisation des tirs et sécurité des blots', () => {
            expect(categorizeExplanation('Minimisation des tirs', 'Vous concédez 6 tirs directs.')).toBe('blot_safety');
            expect(categorizeExplanation(null, 'Attention au pion vulnérable isolé')).toBe('blot_safety');
        });

        it('classe correctement les concepts de course aux pips', () => {
            expect(categorizeExplanation('Règle de course en avance', 'En avance de 15 pips')).toBe('race_management');
        });

        it('classe correctement le contrôle du Point 5 (Golden Point)', () => {
            expect(categorizeExplanation('Contrôle du Golden Point', 'Le point 5 est la clé')).toBe('golden_point');
        });

        it('classe correctement les primes et barrages', () => {
            expect(categorizeExplanation('Construction de Prime', 'Une prime de 4 portes')).toBe('prime_building');
        });

        it('classe correctement les ancres avancées', () => {
            expect(categorizeExplanation('Ancre avancée', 'Maintien de l\'ancre au 20')).toBe('advanced_anchor');
        });

        it('classe correctement les décisions de videau et de match context', () => {
            expect(categorizeExplanation('Décision de videau', 'Double immédiat à DMP')).toBe('cube_score');
        });
    });

    describe('getPRCategory', () => {
        it('associe le PR aux catégories officielles', () => {
            expect(getPRCategory(2.5)).toBe('Grand-Maître');
            expect(getPRCategory(4.2)).toBe('Maître');
            expect(getPRCategory(6.8)).toBe('Expert');
            expect(getPRCategory(8.9)).toBe('Avancé');
            expect(getPRCategory(12.4)).toBe('Intermédiaire');
            expect(getPRCategory(18.0)).toBe('Débutant');
        });
    });

    describe('aggregateUserStats', () => {
        it('fournit des statistiques cohérentes même avec des magasins vides', async () => {
            const stats = await aggregateUserStats();

            expect(stats.totalGamesPlayed).toBe(0);
            expect(stats.performanceRating).toBeGreaterThan(0);
            expect(stats.prCategory).toBeTruthy();
            expect(stats.concepts.length).toBe(STRATEGIC_CONCEPTS_CATALOG.length);
            expect(stats.weakestConcepts.length).toBeGreaterThan(0);
        });

        it('agrège correctement les pertes d\'équité et identifie les concepts faibles prioritaires', async () => {
            // Ajouter des explications de coach avec des blunders ciblés
            await putRecord('coach_explanations', {
                id: 'e1',
                key_concept: 'Minimisation des tirs',
                summary: 'Blot exposé concédant 11 tirs',
                explanation: 'Vous laissez un blot sous le feu adverse.',
                verdict: 'blunder',
                equity_loss: -0.210,
                played_move: '13/9',
                optimal_move: '8/4',
                position_key: 'pos_1',
                source: 'llm',
                created_at: new Date().toISOString(),
            });

            await putRecord('coach_explanations', {
                id: 'e2',
                key_concept: 'Minimisation des tirs',
                summary: 'Dispersion de pions non protégés',
                explanation: 'Trop de tirs directs offerts.',
                verdict: 'blunder',
                equity_loss: -0.160,
                played_move: '24/20',
                optimal_move: '13/9',
                position_key: 'pos_2',
                source: 'llm',
                created_at: new Date().toISOString(),
            });

            await putRecord('coach_explanations', {
                id: 'e3',
                key_concept: 'Construction de Prime',
                summary: 'Bris de barrage prématuré',
                explanation: 'La prime de 4 portes est cassée.',
                verdict: 'douteux',
                equity_loss: -0.045,
                played_move: '8/4',
                optimal_move: '6/2',
                position_key: 'pos_3',
                source: 'rule-based',
                created_at: new Date().toISOString(),
            });

            const stats = await aggregateUserStats();

            expect(stats.totalBlunders).toBe(2);
            expect(stats.totalDoubtful).toBe(1);
            expect(stats.totalEquityLoss).toBeCloseTo(0.415, 2);

            // Le concept "blot_safety" doit être le concept le plus faible prioritaire
            expect(stats.weakestConcepts[0].id).toBe('blot_safety');
            expect(stats.weakestConcepts[0].errorCount).toBe(2);
            expect(stats.weakestConcepts[0].blunderCount).toBe(2);
            expect(stats.weakestConcepts[0].totalEquityLoss).toBeCloseTo(0.370, 2);
            expect(stats.weakestConcepts[0].masteryScore).toBeLessThan(70);
            expect(stats.weakestConcepts[0].priority).toBe('high');
        });
    });
});
