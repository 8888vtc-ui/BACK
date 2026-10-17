import { describe, it, expect } from 'vitest';
import {
    calculateExpectedScore,
    calculateMatchElo,
    getKFactor,
    getEloTier,
    DEFAULT_INITIAL_ELO,
    MIN_ELO_RATING,
} from './elo';

describe('Elo Rating Engine', () => {
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
