import { describe, it, expect } from 'vitest';
import {
    classifyMoveEquity,
    calculateErrorRate,
    calculateSnowieErrorRate,
    calculatePR,
    calculateCombinedPR,
    calculateLuckRate,
    calculateLuckAdjustedPR,
    convertEquityToMwc,
    convertMwcLossToEmg,
    getPRCategory,
    estimateEloFromPR,
    calculateCheckerPR,
    calculateCubePR,
    calculateBMABGrade,
    calculateRaceEfficiency,
} from './ratingCalculator';

describe('ratingCalculator Module', () => {
    describe('classifyMoveEquity', () => {
        it('qualifie les pertes minimes en optimal (< 0.020)', () => {
            expect(classifyMoveEquity(0)).toBe('optimal');
            expect(classifyMoveEquity(-0.003)).toBe('optimal');
            expect(classifyMoveEquity(-0.019)).toBe('optimal');
        });

        it('qualifie les pertes légères en douteux (0.020 à 0.080)', () => {
            expect(classifyMoveEquity(-0.02)).toBe('doubtful');
            expect(classifyMoveEquity(-0.05)).toBe('doubtful');
            expect(classifyMoveEquity(-0.079)).toBe('doubtful');
        });

        it('qualifie les erreurs en blunder (0.080 à 0.200)', () => {
            expect(classifyMoveEquity(-0.08)).toBe('blunder');
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

        it('calcule exactement PR = (ErrorRate) * 500 (formule officielle GNU Backgammon)', () => {
            // Perte de 0.300 sur 10 décisions -> errorRate = 0.030 -> PR = 15.0
            const pr = calculatePR(0.3, 10);
            expect(pr).toBe(15.0);
            expect(calculateErrorRate(0.3, 10)).toBe(0.03);
        });

        it('conserve la valeur brute sans plafond (formule officielle GNU Backgammon)', () => {
            const pr = calculatePR(3.0, 5); // (3.0/5) = 0.6 -> 0.6 * 500 = 300
            expect(pr).toBe(300.0);
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

    describe('XG & Snowie 4 Parity Formulas (Snowie ER, Combined PR, Luck-Adjusted PR, MWC/EMG)', () => {
        it('calcule le Snowie 4 Error Rate sur l’ensemble des tours (forcés inclus)', () => {
            // Perte de 0.200 sur 20 tours totaux -> Snowie ER = 0.010
            expect(calculateSnowieErrorRate(0.2, 20)).toBe(0.01);
            expect(calculateSnowieErrorRate(0, 0)).toBe(0);
        });

        it('calcule le PR combiné XG (pions + videau)', () => {
            // Perte pions 0.15 + perte videau 0.05 = 0.20 sur (8 + 2 = 10) décisions -> ER = 0.02 -> PR = 10.0
            expect(calculateCombinedPR(0.15, 0.05, 8, 2)).toBe(10.0);
            expect(calculateCombinedPR(0, 0, 0, 0)).toBe(0);
        });

        it('calcule le Luck Rate et le Luck-Adjusted PR sans descendre sous 0', () => {
            expect(calculateLuckRate(0.4, 20)).toBe(0.02);
            expect(calculateLuckRate(-0.3, 15)).toBe(-0.02);
            expect(calculateLuckRate(0, 0)).toBe(0);

            // Sans chance (luck = 0), Luck-Adjusted PR == PR classique
            expect(calculateLuckAdjustedPR(0.3, 0, 10)).toBe(15.0);
            // Malchance (luck < 0) réduit légèrement le PR ajusté
            const malchancePR = calculateLuckAdjustedPR(0.3, -0.5, 10);
            expect(malchancePR).toBeLessThan(15.0);
            expect(malchancePR).toBeGreaterThanOrEqual(0);
        });

        it('convertit l’équité EMG en MWC % et la perte MWC en EMG via la table Kazaross-XG2', () => {
            // À score égal (5-away / 5-away), équité 0.0 -> MWC = 50%
            const mwcEven = convertEquityToMwc(0, 5, 5, 1);
            expect(mwcEven).toBeCloseTo(50, 1);

            // Équité positive -> MWC > 50%
            const mwcPos = convertEquityToMwc(0.5, 5, 5, 1);
            expect(mwcPos).toBeGreaterThan(50);
            expect(mwcPos).toBeLessThanOrEqual(100);

            // Conversion inverse MWC loss -> EMG loss
            const emgLoss = convertMwcLossToEmg(0.05, 5, 5, 1);
            expect(emgLoss).toBeGreaterThan(0);
        });

        it('calcule Checker PR, Cube PR, grade BMAB et efficacité de course', () => {
            // Checker PR
            expect(calculateCheckerPR(0.2, 10)).toBe(10.0);
            expect(calculateCheckerPR(0, 0)).toBe(0);

            // Cube PR
            expect(calculateCubePR(0.05, 2)).toBe(12.5);
            expect(calculateCubePR(0, 0)).toBe(0);

            // Titres officiels BMAB
            expect(calculateBMABGrade(2.1)).toBe('Super Grandmaster');
            expect(calculateBMABGrade(2.8)).toBe('Grandmaster 1 (GM1)');
            expect(calculateBMABGrade(3.3)).toBe('Grandmaster 2 (GM2)');
            expect(calculateBMABGrade(4.0)).toBe('Master 1 (M1)');
            expect(calculateBMABGrade(4.8)).toBe('Master 2 (M2)');
            expect(calculateBMABGrade(5.5)).toBe('Advanced 1');
            expect(calculateBMABGrade(15.0)).toBe('Casual');
            expect(calculateBMABGrade(22.0)).toBe('Beginner');

            // Efficacité de course
            expect(calculateRaceEfficiency(50, 50)).toBe(100);
            expect(calculateRaceEfficiency(40, 50)).toBe(80.0);
            expect(calculateRaceEfficiency(0, 0)).toBe(100);
        });
    });
});
