import { describe, it, expect } from 'vitest';
import {
    classifyMove,
    classifyEquityLoss,
    toCoachPanelVerdict,
    getVerdictLabel,
    DEFAULT_THRESHOLDS,
} from './moveClassifier';

describe('moveClassifier — classifyMove', () => {
    describe('Valeurs standards et catégories', () => {
        it('classifie un coup optimal quand les équités sont égales (equityLoss = 0)', () => {
            const res = classifyMove(0.125, 0.125);
            expect(res.verdict).toBe('optimal');
            expect(res.equityLoss).toBe(0);
            expect(res.isError).toBe(false);
            expect(res.isBlunder).toBe(false);
            expect(String(res)).toBe('optimal');
        });

        it('classifie optimal si le coup joué dépasse légèrement l\'optimal (epsilon)', () => {
            const res = classifyMove(0.1251, 0.125);
            expect(res.verdict).toBe('optimal');
            expect(res.equityLoss).toBe(0);
        });

        it('classifie "bon" pour une perte d\'équité légère jusqu\'à -0.020 inclus', () => {
            // Perte de -0.010
            const res1 = classifyMove(0.115, 0.125);
            expect(res1.verdict).toBe('bon');
            expect(res1.equityLoss).toBeCloseTo(-0.01, 3);
            expect(res1.isError).toBe(false);
            expect(res1.isBlunder).toBe(false);

            // Frontière exacte à -0.020
            const resBoundary = classifyMove(0.105, 0.125);
            expect(resBoundary.verdict).toBe('bon');
            expect(resBoundary.equityLoss).toBeCloseTo(-0.02, 3);
        });

        it('classifie "douteux" pour une perte entre -0.020 et -0.080 inclus', () => {
            // Juste en-dessous de -0.020
            const res1 = classifyMove(0.104, 0.125); // -0.021
            expect(res1.verdict).toBe('douteux');
            expect(res1.isError).toBe(true);
            expect(res1.isBlunder).toBe(false);

            // Milieu de plage
            const res2 = classifyMove(0.075, 0.125); // -0.050
            expect(res2.verdict).toBe('douteux');
            expect(res2.equityLoss).toBeCloseTo(-0.05, 3);

            // Frontière exacte à -0.080
            const resBoundary = classifyMove(0.045, 0.125); // -0.080
            expect(resBoundary.verdict).toBe('douteux');
            expect(resBoundary.equityLoss).toBeCloseTo(-0.08, 3);
        });

        it('classifie "blunder" pour une perte entre -0.080 et -0.250 inclus', () => {
            // Juste en-dessous de -0.080
            const res1 = classifyMove(0.044, 0.125); // -0.081
            expect(res1.verdict).toBe('blunder');
            expect(res1.isError).toBe(true);
            expect(res1.isBlunder).toBe(true);

            // Perte classique de blunder (-0.125)
            const res2 = classifyMove(0.0, 0.125);
            expect(res2.verdict).toBe('blunder');
            expect(res2.equityLoss).toBeCloseTo(-0.125, 3);

            // Frontière exacte à -0.250
            const resBoundary = classifyMove(-0.125, 0.125); // -0.250
            expect(resBoundary.verdict).toBe('blunder');
            expect(resBoundary.equityLoss).toBeCloseTo(-0.25, 3);
        });

        it('classifie "howler" pour une perte pire que -0.250', () => {
            // Juste au-delà de -0.250 (-0.251)
            const res1 = classifyMove(-0.126, 0.125);
            expect(res1.verdict).toBe('howler');
            expect(res1.isError).toBe(true);
            expect(res1.isBlunder).toBe(true);

            // Perte critique massive (-0.500)
            const res2 = classifyMove(-0.375, 0.125);
            expect(res2.verdict).toBe('howler');
            expect(res2.equityLoss).toBeCloseTo(-0.5, 3);
        });
    });

    describe('Seuils personnalisés', () => {
        it('applique des seuils personnalisés négatifs', () => {
            const custom = {
                bon: -0.015,
                douteux: -0.05,
                blunder: -0.15,
            };
            // Avec un seuil de douteux à -0.05, une perte de -0.06 devient blunder
            const res = classifyMove(0.04, 0.10, custom); // loss = -0.06
            expect(res.verdict).toBe('blunder');
        });

        it('normalise les seuils passés en positif', () => {
            const custom = {
                bon: 0.03, // interprété comme -0.030
                douteux: 0.10, // interprété comme -0.100
                blunder: 0.30, // interprété comme -0.300
            };
            const res = classifyMove(0.075, 0.10, custom); // loss = -0.025
            expect(res.verdict).toBe('bon');
        });
    });

    describe('classifyEquityLoss fonction pure', () => {
        it('classifie directement une valeur de perte d\'équité', () => {
            expect(classifyEquityLoss(0.0)).toBe('optimal');
            expect(classifyEquityLoss(-0.015)).toBe('bon');
            expect(classifyEquityLoss(-0.045)).toBe('douteux');
            expect(classifyEquityLoss(-0.15)).toBe('blunder');
            expect(classifyEquityLoss(-0.35)).toBe('howler');
        });
    });

    describe('Helpers et intégration UI', () => {
        it('fournit des libellés conviviaux via getVerdictLabel', () => {
            expect(getVerdictLabel('optimal')).toContain('optimal');
            expect(getVerdictLabel('blunder')).toContain('Blunder');
            expect(getVerdictLabel('howler')).toContain('Howler');
        });

        it('convertit les verdicts pour le composant CoachPanel', () => {
            expect(toCoachPanelVerdict('optimal')).toBeNull();
            expect(toCoachPanelVerdict('bon')).toBeNull();
            expect(toCoachPanelVerdict('douteux')).toBe('doubtful');
            expect(toCoachPanelVerdict('blunder')).toBe('blunder');
            expect(toCoachPanelVerdict('howler')).toBe('blunder');
        });
    });
});
