import { describe, it, expect } from 'vitest';
import {
    DEFAULT_GLICKO2_RATING,
    DEFAULT_GLICKO2_RD,
    MIN_GLICKO2_RD,
    DEFAULT_GLICKO2_VOLATILITY,
    DEFAULT_SYSTEM_TAU,
    GLICKO2_SCALE,
    DEFAULT_PR_GAMMA,
    ILLINOIS_EPSILON,
    createDefaultGlicko2Player,
    clampSystemTau,
    computeMatchWeight,
    computePrSigmoid,
    computeCompositeScore,
    computeCompositeScoreBreakdown,
    toGlicko2Scale,
    fromGlicko2Scale,
    gPhi,
    expectedGlicko2Outcome,
    solveVolatilityIllinois,
    updateGlicko2Rating,
    evaluateHeadToHeadCompositeMatch,
    updatePuzzleGlicko2Rating,
} from './glicko2Composite';

describe('glicko2Composite — Moteur Mathématique Glicko-2 Anti-Variance', () => {
    describe('1. Paramètres joueur, constantes système et conversions d’échelle', () => {
        it('initialise un joueur avec les paramètres réglementaires par défaut (r=1500, RD=350, σ=0.06)', () => {
            const player = createDefaultGlicko2Player();
            expect(player.rating).toBe(1500);
            expect(player.rd).toBe(350);
            expect(player.volatility).toBe(0.06);
        });

        it('applique le plancher de déviation RD à 30 et le plafond à 350', () => {
            const veteran = createDefaultGlicko2Player({ rating: 2050, rd: 12 });
            expect(veteran.rd).toBe(MIN_GLICKO2_RD);
            expect(veteran.rd).toBe(30);

            const highRd = createDefaultGlicko2Player({ rd: 500 });
            expect(highRd.rd).toBe(DEFAULT_GLICKO2_RD);
        });

        it('bride la constante système τ dans [0.20, 0.30] avec défaut à 0.25', () => {
            expect(clampSystemTau()).toBe(0.25);
            expect(clampSystemTau(0.25)).toBe(0.25);
            expect(clampSystemTau(0.05)).toBe(0.20);
            expect(clampSystemTau(0.85)).toBe(0.30);
            expect(clampSystemTau(Number.NaN)).toBe(DEFAULT_SYSTEM_TAU);
        });

        it('projette et reconvertit exactement selon la constante κ = 173.7178 (Étapes 2 & 8)', () => {
            const { mu, phi } = toGlicko2Scale(1500, 350);
            expect(mu).toBe(0);
            expect(phi).toBeCloseTo(350 / GLICKO2_SCALE, 8);

            const custom = toGlicko2Scale(1847.4356, 173.7178);
            expect(custom.mu).toBeCloseTo(2.0, 6);
            expect(custom.phi).toBeCloseTo(1.0, 6);

            const back = fromGlicko2Scale(custom.mu, custom.phi);
            expect(back.rating).toBeCloseTo(1847.4356, 4);
            expect(back.rd).toBeCloseTo(173.7178, 4);
        });

        it('maintient le plancher RD à 30 lors de la reconversion (Étape 8)', () => {
            const veryLowPhi = 10 / GLICKO2_SCALE;
            const reconverted = fromGlicko2Scale(0.5, veryLowPhi);
            expect(reconverted.rawRd).toBeCloseTo(10, 4);
            expect(reconverted.rd).toBe(30);
        });
    });

    describe('2. Score Continu Composite s_j ∈ [0, 1] et pondération PR Open Sage', () => {
        it('calcule exactement le poids w(L) = L / (L + 4) selon la longueur du match', () => {
            // En 1 point : w(1) = 1 / 5 = 0.20 (le PR compte pour 80% du score)
            const w1 = computeMatchWeight(1);
            expect(w1).toBeCloseTo(0.2, 6);
            expect(1 - w1).toBeCloseTo(0.8, 6);

            // En 3 points : w(3) = 3 / 7 ≈ 42.86%
            expect(computeMatchWeight(3)).toBeCloseTo(3 / 7, 6);

            // En 5 points : w(5) = 5 / 9 ≈ 55.56%
            expect(computeMatchWeight(5)).toBeCloseTo(5 / 9, 6);

            // En 7 points : w(7) = 7 / 11 ≈ 63.64% (~64% pour la victoire)
            const w7 = computeMatchWeight(7);
            expect(w7).toBeCloseTo(7 / 11, 6);
            expect(Math.round(w7 * 100)).toBe(64);
        });

        it('retourne 0.5 sur la composante sigmoïde PR lorsque les deux joueurs ont le même PR', () => {
            expect(computePrSigmoid(4.2, 4.2)).toBeCloseTo(0.5, 8);
            expect(computePrSigmoid(1.5, 1.5, DEFAULT_PR_GAMMA)).toBeCloseTo(0.5, 8);
        });

        it('protège un expert qui perd en 1 point avec un PR de 1.5 contre un adversaire chanceux (PR élevé)', () => {
            // Cas critique exigé : Expert perd en 1 pt (isVictory = false) avec PR = 1.5
            // face à un adversaire ayant joué PR = 9.5
            const breakdown = computeCompositeScoreBreakdown({
                isVictory: false,
                matchLength: 1,
                playerPR: 1.5,
                opponentPR: 9.5,
            });

            expect(breakdown.matchWeight).toBeCloseTo(0.2, 6);
            expect(breakdown.prWeight).toBeCloseTo(0.8, 6);
            expect(breakdown.winIndicator).toBe(0);

            // Sigmoïde : 1 / (1 + exp(-0.35 * (9.5 - 1.5))) = 1 / (1 + exp(-2.8)) ≈ 0.942676
            const expectedSigmoid = 1 / (1 + Math.exp(-0.35 * (9.5 - 1.5)));
            expect(breakdown.prSigmoid).toBeCloseTo(expectedSigmoid, 6);

            // Score composite s_j = 0.2 * 0 + 0.8 * 0.942676 ≈ 0.7541 > 0.5 !
            expect(breakdown.score).toBeCloseTo(0.8 * expectedSigmoid, 6);
            expect(breakdown.score).toBeGreaterThan(0.7);

            // Vérification de l'effet sur le classement Glicko-2 face à un joueur de même niveau (1800 vs 1800)
            const expert = createDefaultGlicko2Player({ rating: 1800, rd: 80, volatility: 0.06 });
            const luckyOpponent = createDefaultGlicko2Player({ rating: 1800, rd: 80, volatility: 0.06 });

            const duel = evaluateHeadToHeadCompositeMatch({
                playerX: expert,
                playerO: luckyOpponent,
                winner: 'O', // L'expert (X) perd le match en 1 point sur un coup de dés
                matchLength: 1,
                playerXPR: 1.5, // Mais joue à un niveau Grand-Maître (1.5 PR)
                playerOPR: 9.5, // Contre un jeu imprécis (9.5 PR)
            });

            // Grâce au score continu composite (s_X ≈ 0.754 > E = 0.5), l'expert GAGNE des points au lieu d'être puni !
            expect(duel.compositeScoreX.score).toBeGreaterThan(0.7);
            expect(duel.playerX.ratingDelta).toBeGreaterThan(0);
            expect(duel.playerX.rating).toBeGreaterThan(expert.rating);
            expect(duel.playerO.ratingDelta).toBeLessThan(0);
        });

        it('complète symétriquement les scores composites X et O à 1.0', () => {
            const sX = computeCompositeScore({
                isVictory: true,
                matchLength: 5,
                playerPR: 3.2,
                opponentPR: 6.8,
            });
            const sO = computeCompositeScore({
                isVictory: false,
                matchLength: 5,
                playerPR: 6.8,
                opponentPR: 3.2,
            });
            expect(sX + sO).toBeCloseTo(1.0, 10);
        });
    });

    describe('3. Convergence du solveur de l’Illinois et 8 étapes Glicko-2', () => {
        it('converge avec une précision < ε (10^-6) sur le cas Δ^2 <= φ^2 + v', () => {
            const phi = 200 / GLICKO2_SCALE;
            const sigma = 0.06;
            const v = 1.7785;
            const delta = -0.4834;

            const result = solveVolatilityIllinois(phi, sigma, v, delta, 0.25, ILLINOIS_EPSILON);
            expect(result.converged).toBe(true);
            expect(result.finalBracketGap).toBeLessThanOrEqual(ILLINOIS_EPSILON);
            expect(result.iterations).toBeGreaterThan(0);
            expect(result.iterations).toBeLessThan(30);
            expect(result.sigmaPrime).toBeGreaterThan(0.05);
            expect(result.sigmaPrime).toBeLessThan(0.08);
        });

        it('converge avec une précision < ε (10^-6) sur le cas extrême Δ^2 > φ^2 + v (surprise majeure)', () => {
            // Un joueur avec faible RD réalise une performance très éloignée de l'espérance : Δ^2 > φ^2 + v
            // Ce cas active la branche de division par 2 de la borne stagnante (Illinois)
            const phi = 45 / GLICKO2_SCALE;
            const sigma = 0.06;
            const v = 0.65;
            const delta = 2.4; // Δ^2 = 5.76 > φ^2 + v ≈ 0.717

            const result = solveVolatilityIllinois(phi, sigma, v, delta, 0.25, ILLINOIS_EPSILON);
            expect(result.converged).toBe(true);
            expect(result.finalBracketGap).toBeLessThanOrEqual(ILLINOIS_EPSILON);
            expect(result.sigmaPrime).toBeGreaterThan(sigma);
            // Grâce à τ = 0.25 bridé, la volatilité n'explose pas de manière instable
            expect(result.sigmaPrime).toBeLessThan(0.15);
        });

        it('calcule correctement g(φ) et E(μ, μ_j, φ_j) (Étape 3)', () => {
            expect(gPhi(0)).toBeCloseTo(1, 10);
            const phiJ = 30 / GLICKO2_SCALE;
            const gVal = gPhi(phiJ);
            expect(gVal).toBeCloseTo(0.9955, 3);

            // Joueurs de même niveau : espérance = 0.5
            expect(expectedGlicko2Outcome(0, 0, phiJ)).toBeCloseTo(0.5, 10);
        });

        it('exécute les 8 étapes sur une période multi-matchs et réduit la déviation RD', () => {
            const player = createDefaultGlicko2Player({ rating: 1500, rd: 200, volatility: 0.06 });
            const updated = updateGlicko2Rating(player, [
                { opponentRating: 1400, opponentRD: 30, score: 1 },
                { opponentRating: 1550, opponentRD: 100, score: 0 },
                { opponentRating: 1700, opponentRD: 300, score: 0 },
            ]);

            expect(updated.illinois.converged).toBe(true);
            expect(updated.rd).toBeLessThan(player.rd);
            expect(updated.rating).toBeLessThan(1500);
            expect(updated.rating).toBeGreaterThan(1450);
            expect(updated.scores).toEqual([1, 0, 0]);
        });

        it('augmente légèrement le RD sans modifier le classement en cas d’inactivité (0 match)', () => {
            const player = createDefaultGlicko2Player({ rating: 1680, rd: 95, volatility: 0.06 });
            const inactive = updateGlicko2Rating(player, []);

            expect(inactive.rating).toBe(1680);
            expect(inactive.ratingDelta).toBe(0);
            expect(inactive.rd).toBeGreaterThan(95);
            expect(inactive.volatility).toBe(0.06);
        });

        it('met à jour le puzzle_rating d’un joueur via updatePuzzleGlicko2Rating', () => {
            const player = createDefaultGlicko2Player({ rating: 1500, rd: 150, volatility: 0.06 });
            const winHardPuzzle = updatePuzzleGlicko2Rating(player, 1750, 75, 1.0);
            expect(winHardPuzzle.rating).toBeGreaterThan(1500);
            expect(winHardPuzzle.ratingDelta).toBeGreaterThan(25);

            const failEasyPuzzle = updatePuzzleGlicko2Rating(player, 1300, 75, 0.0);
            expect(failEasyPuzzle.rating).toBeLessThan(1500);
            expect(failEasyPuzzle.ratingDelta).toBeLessThan(-25);
        });
    });
});
