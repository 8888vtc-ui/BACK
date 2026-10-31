import { describe, it, expect, beforeEach } from 'vitest';
import {
    calculateExpectedScore,
    calculateMatchElo,
    getKFactor,
    getEloTier,
    readPublicAveragePr,
    resetPublicPrForTests,
    rewardFirstTryQuizOnPublicPr,
    DEFAULT_INITIAL_PUBLIC_PR,
    MIN_ELO_RATING,
} from './elo';

describe('Elo Rating Engine & Meritocratic PR Gate', () => {
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

    it('bloque tout gain Elo (0 pt) si le PR du bot ou de l’adversaire est meilleur (plus bas) que celui du gagnant', () => {
        // X gagne la partie mais a joué PR 9.5 contre un bot/adversaire qui a joué PR 6.2
        const blocked = calculateMatchElo(1500, 1500, 'X', undefined, { prX: 9.5, prO: 6.2 });
        expect(blocked.deltaX).toBe(0);
        expect(blocked.playerXNewRating).toBe(1500);
        expect(blocked.prBlockedGain).toBe(true);

        // Si X gagne ET a un meilleur PR (4.8 vs 7.5), il prend ses points Elo normalement
        const merited = calculateMatchElo(1500, 1500, 'X', undefined, { prX: 4.8, prO: 7.5 });
        expect(merited.deltaX).toBe(16);
        expect(merited.prBlockedGain).toBe(false);
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

        // 1400 bat 2000 mais avec un moins bon PR -> 0 pt Elo
        const luckyUnderdogWin = calculateMatchElo(1400, 2000, 'X', undefined, { prX: 11.4, prO: 4.5 });
        expect(luckyUnderdogWin.deltaX).toBe(0);
        expect(luckyUnderdogWin.prBlockedGain).toBe(true);
    });

    it('améliore le PR Moyen Public lorsqu’un joueur réussit un Quizz au 1er essai', () => {
        expect(readPublicAveragePr()).toBe(DEFAULT_INITIAL_PUBLIC_PR);
        const r1 = rewardFirstTryQuizOnPublicPr();
        expect(r1.newPr).toBeCloseTo(DEFAULT_INITIAL_PUBLIC_PR - 0.15, 2);
        expect(r1.totalFirstTrySolved).toBe(1);

        const r2 = rewardFirstTryQuizOnPublicPr();
        expect(r2.newPr).toBeCloseTo(DEFAULT_INITIAL_PUBLIC_PR - 0.30, 2);
        expect(r2.totalFirstTrySolved).toBe(2);
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
