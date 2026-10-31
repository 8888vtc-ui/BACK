import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateExpectedScore,
    calculateMatchElo,
    computeDegressiveEloGain,
    getMaxTargetEloForPublicPr,
    getTargetQuizTierFromPublicPr,
    getKFactor,
    getEloTier,
    readPublicAveragePr,
    resetPublicPrForTests,
    rewardFirstTryQuizOnPublicPr,
    breakFirstTryQuizStreak,
    recordMatchIntoPublicAveragePr,
    DEFAULT_INITIAL_PUBLIC_PR,
    MIN_ELO_RATING,
} from './elo';

describe('Elo Rating Engine, Degressive Curve, PR Ceiling & Anti-Cheat', () => {
    beforeEach(() => {
        resetPublicPrForTests();
    });

    it('calcule une espérance de 0.5 pour deux joueurs de même niveau', () => {
        const expected = calculateExpectedScore(1500, 1500);
        expect(expected).toBeCloseTo(0.5, 3);
    });

    it('donne une espérance plus élevée au joueur avec un meilleur Elo', () => {
        const expectedHigh = calculateExpectedScore(1700, 1500);
        const expectedLow = calculateExpectedScore(1500, 1700);

        expect(expectedHigh).toBeGreaterThan(0.7);
        expect(expectedLow).toBeLessThan(0.3);
        expect(expectedHigh + expectedLow).toBeCloseTo(1.0, 4);
    });

    it('adapte le K-factor selon le classement', () => {
        expect(getKFactor(1400)).toBe(32);
        expect(getKFactor(2150)).toBe(24);
        expect(getKFactor(2500)).toBe(16);
    });

    it('calcule correctement les variations d\'Elo lors d\'une victoire de X à égalité', () => {
        const result = calculateMatchElo(1500, 1500, 'X');

        expect(result.deltaX).toBe(16);
        expect(result.deltaO).toBe(-16);
        expect(result.playerXNewRating).toBe(1516);
        expect(result.playerONewRating).toBe(1484);
    });

    it('fait descendre crescendo le gain de 30 points jusqu’à 1 point selon la différence de niveau', () => {
        const gMinus500 = computeDegressiveEloGain(1400, 1950); // Outsider -550 -> 30 pts
        const gMinus300 = computeDegressiveEloGain(1500, 1800); // Outsider -300 -> ~25 pts
        const gMinus150 = computeDegressiveEloGain(1500, 1650); // Outsider -150 -> ~21 pts
        const gEqual = computeDegressiveEloGain(1500, 1500);    // Égalité -> 16 pts
        const gPlus150 = computeDegressiveEloGain(1650, 1500);  // Favori +150 -> ~10 pts
        const gPlus300 = computeDegressiveEloGain(1800, 1500);  // Favori +300 -> ~5 pts
        const gPlus500 = computeDegressiveEloGain(2000, 1400);  // Favori +600 -> 1 pt

        expect(gMinus500).toBe(30);
        expect(gMinus300).toBeLessThan(30);
        expect(gMinus300).toBeGreaterThan(gMinus150);
        expect(gMinus150).toBeGreaterThan(gEqual);
        expect(gEqual).toBe(16);
        expect(gPlus150).toBeLessThan(gEqual);
        expect(gPlus300).toBeLessThan(gPlus150);
        expect(gPlus500).toBe(1);
    });

    it('plafonne la montée en Elo contre les bots si le PR Moyen Public du joueur ne suit pas', () => {
        // Un joueur avec un PR moyen de 10.0 a un plafond naturel autour de 1600 Elo
        expect(getMaxTargetEloForPublicPr(10.0)).toBe(1600);

        // S'il est déjà à 1750 Elo avec un PR moyen de 10.0, il ne gagne plus que +1 Elo tant qu'il n'améliore pas son PR !
        const cappedGain = computeDegressiveEloGain(1750, 1750, 10.0);
        expect(cappedGain).toBe(1);

        // S'il descend son PR moyen à 4.0 grâce aux Quizz et à un jeu propre, il reprend sa progression normale (+16 Elo)
        const uncappedGain = computeDegressiveEloGain(1750, 1750, 4.0);
        expect(uncappedGain).toBe(16);
    });

    it('adapte le niveau de difficulté des Quizz (Palier 1 à 4) en fonction du PR Moyen Public', () => {
        expect(getTargetQuizTierFromPublicPr(11.5)).toBe(1);
        expect(getTargetQuizTierFromPublicPr(7.2)).toBe(2);
        expect(getTargetQuizTierFromPublicPr(4.2)).toBe(3);
        expect(getTargetQuizTierFromPublicPr(2.1)).toBe(4);
    });

    it('bloque le gain Elo, active le Bouclier de Maîtrise pour le perdant et place 50% en Séquestre (Escrow)', () => {
        const blocked = calculateMatchElo(1500, 1500, 'X', undefined, { prX: 9.5, prO: 6.2 });
        expect(blocked.deltaX).toBe(0);
        expect(blocked.deltaO).toBe(0);
        expect(blocked.playerXNewRating).toBe(1500);
        expect(blocked.prBlockedGain).toBe(true);
        expect(blocked.prShieldActivated).toBe(true);
        expect(blocked.escrowEloPoints).toBe(8);

        const q1 = rewardFirstTryQuizOnPublicPr();
        expect(q1.unlockedEscrowElo).toBe(0);
        const q2 = rewardFirstTryQuizOnPublicPr();
        expect(q2.unlockedEscrowElo).toBe(8);
    });

    it('applique la règle 2000 vs 1400 : le 2000 ne gagne que +1 pt Elo, et le 1400 qui gagne avec un meilleur PR prend +30 pts Elo', () => {
        const favWin = calculateMatchElo(2000, 1400, 'X', undefined, { prX: 3.5, prO: 8.0 });
        expect(favWin.deltaX).toBe(1);
        expect(favWin.playerXNewRating).toBe(2001);

        const underdogWin = calculateMatchElo(1400, 2000, 'X', undefined, { prX: 4.2, prO: 5.1 });
        expect(underdogWin.deltaX).toBe(30);
        expect(underdogWin.playerXNewRating).toBe(1430);

        const luckyUnderdogWin = calculateMatchElo(1400, 2000, 'X', undefined, { prX: 11.4, prO: 4.5 });
        expect(luckyUnderdogWin.deltaX).toBe(0);
        expect(luckyUnderdogWin.prBlockedGain).toBe(true);
        expect(luckyUnderdogWin.escrowEloPoints).toBe(15);
    });

    it('applique le multiplicateur de série 1er essai et plafonne la cristallisation à 5 Quizz entre deux parties', () => {
        expect(readPublicAveragePr()).toBe(DEFAULT_INITIAL_PUBLIC_PR);
        const r1 = rewardFirstTryQuizOnPublicPr();
        expect(r1.newPr).toBeCloseTo(8.35, 2);
        const r2 = rewardFirstTryQuizOnPublicPr();
        expect(r2.newPr).toBeCloseTo(8.20, 2);
        const r3 = rewardFirstTryQuizOnPublicPr();
        expect(r3.newPr).toBeCloseTo(7.95, 2);
        const r4 = rewardFirstTryQuizOnPublicPr();
        expect(r4.newPr).toBeCloseTo(7.70, 2);
        const r5 = rewardFirstTryQuizOnPublicPr();
        expect(r5.newPr).toBeCloseTo(7.35, 2);
        expect(r5.crystallizationUsed).toBe(5);
        expect(r5.crystallizationCapped).toBe(false);

        const r6 = rewardFirstTryQuizOnPublicPr();
        expect(r6.crystallizationCapped).toBe(true);
        expect(r6.newPr).toBeCloseTo(7.35, 2);

        recordMatchIntoPublicAveragePr(7.35);
        breakFirstTryQuizStreak();
        const r7 = rewardFirstTryQuizOnPublicPr();
        expect(r7.crystallizationCapped).toBe(false);
        expect(r7.deltaPr).toBeCloseTo(-0.15, 2);
    });

    it('bloque la triche / collusion humain-humain en salon privé ou en cas d’abandon avant 6 décisions', () => {
        const privateRoomMatch = calculateMatchElo(1400, 2000, 'X', undefined, {
            prX: 3.0,
            prO: 8.0,
            isPrivateRoom: true,
        });
        expect(privateRoomMatch.deltaX).toBe(0);
        expect(privateRoomMatch.antiCollusionLimited).toBe(true);

        const earlyForfeitMatch = calculateMatchElo(1400, 2000, 'X', undefined, {
            prX: 2.5,
            prO: 9.0,
            decisionsCount: 3,
        });
        expect(earlyForfeitMatch.deltaX).toBe(0);
        expect(earlyForfeitMatch.antiCollusionLimited).toBe(true);
    });

    it('garantit le seuil minimal de 100 Elo (pas de score négatif)', () => {
        const result = calculateMatchElo(120, 2000, 'O');
        expect(result.playerXNewRating).toBeGreaterThanOrEqual(MIN_ELO_RATING);
    });

    it('associe les tiers de titre Elo appropriés', () => {
        expect(getEloTier(1200).title).toBe('Apprenti');
        expect(getEloTier(1450).title).toBe('Initié');
        expect(getEloTier(1550).title).toBe('Compétiteur');
        expect(getEloTier(1750).title).toBe('Maître');
        expect(getEloTier(1950).title).toBe('Grand-Maître');
        expect(getEloTier(2200).title).toBe('Légende');
    });
});
