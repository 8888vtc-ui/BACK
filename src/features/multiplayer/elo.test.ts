import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateExpectedScore,
    calculateMatchElo,
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

describe('Elo Rating Engine, Meritocratic PR Gate, Addiction Loop & Anti-Cheat', () => {
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

    it('calcule correctement les variations d\'Elo lors d\'une victoire de X', () => {
        const result = calculateMatchElo(1500, 1500, 'X');

        expect(result.deltaX).toBe(16); // 32 * (1 - 0.5) = 16
        expect(result.deltaO).toBe(-16); // 32 * (0 - 0.5) = -16
        expect(result.playerXNewRating).toBe(1516);
        expect(result.playerONewRating).toBe(1484);
    });

    it('accorde un gain plus grand en cas d\'upset (outsider bat un favori)', () => {
        const normalWin = calculateMatchElo(1800, 1400, 'X');
        const upsetWin = calculateMatchElo(1400, 1800, 'X');

        expect(upsetWin.deltaX).toBeGreaterThan(normalWin.deltaX);
        expect(upsetWin.deltaX).toBeGreaterThan(25);
    });

    it('bloque le gain Elo, active le Bouclier de Maîtrise pour le perdant et place 50% en Séquestre (Escrow)', () => {
        // X gagne la partie mais a joué PR 9.5 contre O qui a joué PR 6.2
        const blocked = calculateMatchElo(1500, 1500, 'X', undefined, { prX: 9.5, prO: 6.2 });
        expect(blocked.deltaX).toBe(0);
        expect(blocked.deltaO).toBe(0); // Bouclier de Maîtrise pour O !
        expect(blocked.playerXNewRating).toBe(1500);
        expect(blocked.prBlockedGain).toBe(true);
        expect(blocked.prShieldActivated).toBe(true);
        expect(blocked.escrowEloPoints).toBe(8); // 50% de 16 mis en séquestre

        // En réussissant 2 Quizz de suite au 1er essai, X débloque ses 8 points Elo en séquestre !
        const q1 = rewardFirstTryQuizOnPublicPr();
        expect(q1.unlockedEscrowElo).toBe(0);
        const q2 = rewardFirstTryQuizOnPublicPr();
        expect(q2.unlockedEscrowElo).toBe(8);
    });

    it('applique la règle 2000 vs 1400 : le 2000 ne gagne que +1 pt Elo, et le 1400 qui gagne avec un meilleur PR prend +30 pts Elo', () => {
        // 2000 bat 1400 avec meilleur PR -> +1 pt Elo seulement
        const favWin = calculateMatchElo(2000, 1400, 'X', undefined, { prX: 3.5, prO: 8.0 });
        expect(favWin.deltaX).toBe(1);
        expect(favWin.playerXNewRating).toBe(2001);

        // 1400 bat 2000 avec meilleur PR -> +30 pts Elo
        const underdogWin = calculateMatchElo(1400, 2000, 'X', undefined, { prX: 4.2, prO: 5.1 });
        expect(underdogWin.deltaX).toBe(30);
        expect(underdogWin.playerXNewRating).toBe(1430);

        // 1400 bat 2000 mais avec un moins bon PR -> 0 pt Elo immédiat + 15 pts en séquestre
        const luckyUnderdogWin = calculateMatchElo(1400, 2000, 'X', undefined, { prX: 11.4, prO: 4.5 });
        expect(luckyUnderdogWin.deltaX).toBe(0);
        expect(luckyUnderdogWin.prBlockedGain).toBe(true);
        expect(luckyUnderdogWin.escrowEloPoints).toBe(15);
    });

    it('applique le multiplicateur de série 1er essai et plafonne la cristallisation à 5 Quizz entre deux parties', () => {
        expect(readPublicAveragePr()).toBe(DEFAULT_INITIAL_PUBLIC_PR); // 8.50
        const r1 = rewardFirstTryQuizOnPublicPr(); // streak 1 -> -0.15
        expect(r1.newPr).toBeCloseTo(8.35, 2);
        const r2 = rewardFirstTryQuizOnPublicPr(); // streak 2 -> -0.15
        expect(r2.newPr).toBeCloseTo(8.20, 2);
        const r3 = rewardFirstTryQuizOnPublicPr(); // streak 3 -> -0.25
        expect(r3.newPr).toBeCloseTo(7.95, 2);
        const r4 = rewardFirstTryQuizOnPublicPr(); // streak 4 -> -0.25
        expect(r4.newPr).toBeCloseTo(7.70, 2);
        const r5 = rewardFirstTryQuizOnPublicPr(); // streak 5 -> -0.35 (5/5 cristallisation atteinte)
        expect(r5.newPr).toBeCloseTo(7.35, 2);
        expect(r5.crystallizationUsed).toBe(5);
        expect(r5.crystallizationCapped).toBe(false);

        // 6e Quizz sans jouer de match : plafonné (0 réduction PR tant qu'un match n'est pas joué)
        const r6 = rewardFirstTryQuizOnPublicPr();
        expect(r6.crystallizationCapped).toBe(true);
        expect(r6.newPr).toBeCloseTo(7.35, 2);

        // Jouer un match réinitialise la jauge de cristallisation et permet de reprendre l'entraînement
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
