import { describe, it, expect } from 'vitest';
import {
    calculateGalaxyRating,
    computeMatchLengthFactor,
    resolvePRWinner,
    getGalaxyStarTier,
    rankLeaderboardEntries,
} from './galaxyRating';

describe('Galaxy Dual Rating (GR) & Leaderboard System', () => {
    it('identifie correctement le vainqueur de la bataille de PR', () => {
        expect(resolvePRWinner(2.4, 6.8)).toBe('X');
        expect(resolvePRWinner(9.1, 4.2)).toBe('O');
        expect(resolvePRWinner(4.5, 4.52)).toBe('tie');
    });

    it('calcule un facteur de longueur de match croissant avec le nombre de points', () => {
        const f1 = computeMatchLengthFactor(1);
        const f5 = computeMatchLengthFactor(5);
        const f11 = computeMatchLengthFactor(11);
        expect(f5).toBeCloseTo(1.0, 2);
        expect(f1).toBeLessThan(f5);
        expect(f11).toBeGreaterThan(f5);
    });

    it('accorde le gain plein (Double Star) quand le vainqueur du match remporte aussi le PR', () => {
        const res = calculateGalaxyRating({
            playerXRating: 1600,
            playerORating: 1600,
            winner: 'X',
            playerXPR: 2.1,
            playerOPR: 8.4,
            matchLength: 5,
        });

        expect(res.prWinner).toBe('X');
        expect(res.deltaX).toBeGreaterThanOrEqual(18);
        expect(res.deltaO).toBeLessThanOrEqual(-14);
        expect(res.playerXNewRating).toBe(1600 + res.deltaX);
    });

    it('protège le perdant et lui accorde un gain de GR si son PR est exceptionnel (PR <= 2.5)', () => {
        const res = calculateGalaxyRating({
            playerXRating: 1700,
            playerORating: 1700,
            winner: 'O', // X perd le match par malchance aux dés
            playerXPR: 1.9, // Mais X joue comme un Grand-Maître
            playerOPR: 9.5, // Alors que O commet de nombreuses erreurs
            matchLength: 7,
        });

        expect(res.prWinner).toBe('X');
        expect(res.loserProtectedByPR).toBe(true);
        // X gagne des points GR malgré la défaite !
        expect(res.deltaX).toBeGreaterThan(0);
        // Le gain de O est réduit par rapport à une victoire standard
        expect(res.deltaO).toBeLessThan(12);
    });

    it('limite fortement la perte de GR du perdant ayant un meilleur PR modéré', () => {
        const standardLoss = calculateGalaxyRating({
            playerXRating: 1500,
            playerORating: 1500,
            winner: 'O',
            playerXPR: 10.0,
            playerOPR: 5.0,
            matchLength: 5,
        });

        const protectedLoss = calculateGalaxyRating({
            playerXRating: 1500,
            playerORating: 1500,
            winner: 'O',
            playerXPR: 5.2, // X joue mieux que O
            playerOPR: 7.4,
            matchLength: 5,
        });

        expect(protectedLoss.loserProtectedByPR).toBe(true);
        // La perte de X est beaucoup plus faible (ou positive) que lors d'une défaite où il joue moins bien
        expect(protectedLoss.deltaX).toBeGreaterThan(standardLoss.deltaX + 8);
    });

    it('attribue le bon tier étoilé et trie correctement le leaderboard', () => {
        expect(getGalaxyStarTier(2350).title).toBe('Super Grandmaster');
        expect(getGalaxyStarTier(2150).title).toBe('Grandmaster');
        expect(getGalaxyStarTier(1400).title).toBe('Challenger');

        const sorted = rankLeaderboardEntries([
            { userId: '1', displayName: 'Alice', galaxyRating: 1850, averagePR: 4.5, matchesPlayed: 20, winRate: 0.55 },
            { userId: '2', displayName: 'Bob', galaxyRating: 2120, averagePR: 2.8, matchesPlayed: 50, winRate: 0.68 },
            { userId: '3', displayName: 'Charlie', galaxyRating: 1850, averagePR: 3.1, matchesPlayed: 30, winRate: 0.58 },
        ]);

        expect(sorted.map((e) => e.displayName)).toEqual(['Bob', 'Charlie', 'Alice']);
    });
});
