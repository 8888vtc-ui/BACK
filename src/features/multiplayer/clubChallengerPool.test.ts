import { describe, it, expect } from 'vitest';
import {
    CLUB_CHALLENGER_SEEDS,
    computeRealisticMatchmakingDelayMs,
    resolveChallengerDifficultyForElo,
    selectClubChallengerForRating,
} from './clubChallengerPool';

describe('ClubChallengerPool — Matchmaking International Simulé (Débutant à Pro, 0 Champion Imbattable)', () => {
    it('contient 36 profils internationaux avec pseudo, drapeau et niveau plafonné à expert', () => {
        expect(CLUB_CHALLENGER_SEEDS.length).toBe(36);
        for (const seed of CLUB_CHALLENGER_SEEDS) {
            expect(seed.username.length).toBeGreaterThan(3);
            expect(seed.countryFlag.length).toBeGreaterThan(0);
            expect(['beginner', 'intermediate', 'expert']).toContain(seed.difficulty);
            expect(seed.difficulty).not.toBe('grandmaster');
        }
    });

    it('associe correctement les paliers Elo du débutant (1450) au club (1680) et au pro (1900+) sans jamais renvoyer grandmaster', () => {
        expect(resolveChallengerDifficultyForElo(1400)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1500)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1650)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1780)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1850)).toBe('expert');
        expect(resolveChallengerDifficultyForElo(2400)).toBe('expert');
    });

    it('génère un profil PlayerEloProfile complet avec drapeau, pseudo et difficulté adaptée', () => {
        const beginnerOpp = selectClubChallengerForRating(1480);
        expect(beginnerOpp.clubBotDifficulty).toBe('beginner');
        expect(beginnerOpp.countryFlag).toBeTruthy();
        expect(beginnerOpp.displayName).toContain(beginnerOpp.username);
        expect(beginnerOpp.rating).toBeGreaterThanOrEqual(1350);
        expect(beginnerOpp.rating).toBeLessThanOrEqual(1600);

        const proOpp = selectClubChallengerForRating(1920);
        expect(proOpp.clubBotDifficulty).toBe('expert');
        expect(proOpp.rating).toBeGreaterThanOrEqual(1790);
        expect(proOpp.rating).toBeLessThanOrEqual(1985);
    });

    it('calcule un délai d’appariement réaliste compris entre 2,6s et 4,4s', () => {
        for (let i = 0; i < 10; i++) {
            const delay = computeRealisticMatchmakingDelayMs();
            expect(delay).toBeGreaterThanOrEqual(2600);
            expect(delay).toBeLessThanOrEqual(4400);
        }
    });
});

