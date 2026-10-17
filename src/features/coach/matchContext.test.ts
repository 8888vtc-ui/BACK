import { describe, it, expect } from 'vitest';
import {
    getMatchEquity,
    calculateGammonPrice,
    calculateTakePoint,
    buildMatchContext,
} from './matchContext';

describe('matchContext & Match Equity Table (MET)', () => {
    describe('getMatchEquity', () => {
        it('retourne 50% pour un score à égalité (away égal)', () => {
            expect(getMatchEquity(1, 1)).toBe(0.5);
            expect(getMatchEquity(3, 3)).toBe(0.5);
            expect(getMatchEquity(7, 7)).toBe(0.5);
        });

        it('retourne 100% si le joueur a atteint 0 points to win et 0% si l\'adversaire a gagné', () => {
            expect(getMatchEquity(0, 3)).toBe(1.0);
            expect(getMatchEquity(-1, 5)).toBe(1.0);
            expect(getMatchEquity(3, 0)).toBe(0.0);
            expect(getMatchEquity(5, -1)).toBe(0.0);
        });

        it('respecte la symétrie exacte ME(a1, a2) + ME(a2, a1) = 1.0', () => {
            const pairs: [number, number][] = [
                [1, 2],
                [1, 3],
                [2, 4],
                [3, 5],
                [4, 7],
            ];
            for (const [a1, a2] of pairs) {
                const me1 = getMatchEquity(a1, a2);
                const me2 = getMatchEquity(a2, a1);
                expect(me1 + me2).toBeCloseTo(1.0, 3);
            }
        });

        it('accorde un net avantage au meneur (away plus faible)', () => {
            expect(getMatchEquity(1, 2)).toBeGreaterThan(0.65);
            expect(getMatchEquity(1, 5)).toBeGreaterThan(0.8);
            expect(getMatchEquity(2, 6)).toBeGreaterThan(0.7);
        });
    });

    describe('calculateGammonPrice (Prix du gammon)', () => {
        it('vaut 0.50 en partie d\'argent (money play)', () => {
            expect(calculateGammonPrice(0, 0, true)).toBe(0.5);
            expect(calculateGammonPrice(3, 4, true)).toBe(0.5);
        });

        it('vaut exactement 0.00 à 1-away (DMP ou meneur à Crawford)', () => {
            // Le joueur n'a besoin que d'un point, le gammon ne lui rapporte rien
            expect(calculateGammonPrice(1, 1)).toBe(0.0);
            expect(calculateGammonPrice(1, 3)).toBe(0.0);
            expect(calculateGammonPrice(1, 5)).toBe(0.0);
        });

        it('est élevé pour le retardataire face à un meneur à 1-away', () => {
            // Le retardataire (ex: 3-away vs 1-away) gagne énormément à marquer 2 points
            const trailerPrice = calculateGammonPrice(3, 1);
            expect(trailerPrice).toBeGreaterThan(0.5);
        });
    });

    describe('calculateTakePoint (Seuil de prise du videau)', () => {
        it('vaut 25% (0.25) en partie d\'argent', () => {
            expect(calculateTakePoint(0, 0, true)).toBe(0.25);
        });

        it('vaut 0% à DMP (le videau est mort)', () => {
            expect(calculateTakePoint(1, 1)).toBe(0.0);
        });

        it('retourne une probabilité cohérente en match play', () => {
            const tp = calculateTakePoint(3, 4);
            expect(tp).toBeGreaterThan(0.1);
            expect(tp).toBeLessThan(0.4);
        });
    });

    describe('buildMatchContext (Assemblage complet)', () => {
        it('construit un contexte de partie d\'argent propre', () => {
            const ctx = buildMatchContext({
                matchLength: 0,
                scoreX: 0,
                scoreO: 0,
            });

            expect(ctx.isMoneyPlay).toBe(true);
            expect(ctx.pointsToWin.X).toBe(0);
            expect(ctx.pointsToWin.O).toBe(0);
            expect(ctx.crawford).toBe(false);
            expect(ctx.postCrawford).toBe(false);
            expect(ctx.gammonPrice.X).toBe(0.5);
            expect(ctx.gammonPrice.O).toBe(0.5);
            expect(ctx.takePoint.X).toBe(0.25);
            expect(ctx.takePoint.O).toBe(0.25);
        });

        it('détecte correctement la manche de Crawford', () => {
            const ctx = buildMatchContext({
                matchLength: 7,
                scoreX: 6,
                scoreO: 3,
                crawford: true,
            });

            expect(ctx.isMoneyPlay).toBe(false);
            expect(ctx.crawford).toBe(true);
            expect(ctx.postCrawford).toBe(false);
            expect(ctx.isDMP).toBe(false);
            expect(ctx.pointsToWin.X).toBe(1);
            expect(ctx.pointsToWin.O).toBe(4);
            expect(ctx.gammonPrice.X).toBe(0.0); // Le meneur à 1-away n'a aucun bonus de gammon
            expect(ctx.gammonPrice.O).toBeGreaterThan(0.2); // Le retardataire bénéficie d'un gammon price non nul
        });

        it('détecte correctement le Post-Crawford', () => {
            const ctx = buildMatchContext({
                matchLength: 7,
                scoreX: 6,
                scoreO: 4,
                crawford: false,
                crawfordAlreadyPlayed: true,
            });

            expect(ctx.crawford).toBe(false);
            expect(ctx.postCrawford).toBe(true);
            expect(ctx.pointsToWin.X).toBe(1);
            expect(ctx.pointsToWin.O).toBe(3);
        });

        it('détecte correctement le DMP (Double Match Point)', () => {
            const ctx = buildMatchContext({
                matchLength: 7,
                scoreX: 6,
                scoreO: 6,
            });

            expect(ctx.isDMP).toBe(true);
            expect(ctx.crawford).toBe(false);
            expect(ctx.pointsToWin.X).toBe(1);
            expect(ctx.pointsToWin.O).toBe(1);
            expect(ctx.gammonPrice.X).toBe(0.0);
            expect(ctx.gammonPrice.O).toBe(0.0);
        });

        it('calcule les points to win et équités pour un score régulier', () => {
            const ctx = buildMatchContext({
                matchLength: 7,
                scoreX: 4,
                scoreO: 2,
            });

            expect(ctx.pointsToWin.X).toBe(3);
            expect(ctx.pointsToWin.O).toBe(5);
            expect(ctx.matchEquity.X).toBeGreaterThan(0.6);
            expect(ctx.matchEquity.O).toBeLessThan(0.4);
            expect(ctx.matchEquity.X + ctx.matchEquity.O).toBeCloseTo(1.0, 2);
        });
    });
});
