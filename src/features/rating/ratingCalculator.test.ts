import { describe, it, expect } from 'vitest';
import {
    classifyMoveEquity,
    calculateErrorRate,
    calculatePR,
    getPRCategory,
    estimateEloFromPR,
} from './ratingCalculator';

describe('ratingCalculator Module', () => {
    describe('classifyMoveEquity', () => {
        it('qualifie les pertes minimes en optimal (<= 0.005)', () => {
            expect(classifyMoveEquity(0)).toBe('optimal');
            expect(classifyMoveEquity(-0.003)).toBe('optimal');
            expect(classifyMoveEquity(0.005)).toBe('optimal');
        });

        it('qualifie les pertes légères en acceptable (0.005 à 0.020)', () => {
            expect(classifyMoveEquity(-0.012)).toBe('acceptable');
            expect(classifyMoveEquity(-0.02)).toBe('acceptable');
        });

        it('qualifie les pertes modérées en douteux (0.020 à 0.080)', () => {
            expect(classifyMoveEquity(-0.025)).toBe('doubtful');
            expect(classifyMoveEquity(-0.075)).toBe('doubtful');
            expect(classifyMoveEquity(-0.08)).toBe('doubtful');
        });

        it('qualifie les erreurs en blunder (0.080 à 0.200)', () => {
            expect(classifyMoveEquity(-0.085)).toBe('blunder');
            expect(classifyMoveEquity(-0.15)).toBe('blunder');
            expect(classifyMoveEquity(-0.2)).toBe('blunder');
        });

        it('qualifie les fautes majeures en howler (> 0.200)', () => {
            expect(classifyMoveEquity(-0.201)).toBe('howler');
            expect(classifyMoveEquity(-0.35)).toBe('howler');
        });
    });

    describe('calculatePR & calculateErrorRate', () => {
        it('gère 0 décision sans division par zéro', () => {
            expect(calculatePR(0, 0)).toBe(0);
            expect(calculateErrorRate(0, 0)).toBe(0);
        });

        it('calcule exactement PR = (ErrorRate / 3) * 500', () => {
            // Perte de 0.300 sur 10 décisions -> errorRate = 0.030 -> /3 = 0.010 -> PR = 5.0
            const pr = calculatePR(0.3, 10);
            expect(pr).toBe(5.0);
            expect(calculateErrorRate(0.3, 10)).toBe(0.03);
        });

        it('borne le PR au plafond officiel de 35.0', () => {
            const pr = calculatePR(3.0, 5); // (3.0/3)/5 = 0.2 -> 0.2 * 500 = 100 -> plafonné à 35
            expect(pr).toBe(35.0);
        });
    });

    describe('getPRCategory', () => {
        it('catégorise correctement selon les paliers officiels', () => {
            expect(getPRCategory(2.4)).toBe('Grand-Maître');
            expect(getPRCategory(4.2)).toBe('Maître');
            expect(getPRCategory(6.8)).toBe('Expert');
            expect(getPRCategory(8.9)).toBe('Avancé');
            expect(getPRCategory(12.5)).toBe('Intermédiaire');
            expect(getPRCategory(18.0)).toBe('Débutant');
        });
    });

    describe('estimateEloFromPR', () => {
        it('estime un Elo élevé pour un PR de Grand-Maître', () => {
            const elo = estimateEloFromPR(2.0);
            expect(elo).toBeGreaterThan(2000);
            expect(elo).toBeLessThanOrEqual(2150);
        });

        it('estime un Elo de maître pour un PR de 4.0', () => {
            const elo = estimateEloFromPR(4.0);
            expect(elo).toBe(1942); // 2150 - 208 = 1942
        });

        it('borne l’Elo minimum à 1000 pour les PR très élevés', () => {
            const elo = estimateEloFromPR(30.0);
            expect(elo).toBe(1000);
        });
    });
});
