import { describe, it, expect, beforeEach } from 'vitest';
import {
    BOT_WEEKLY_COOLDOWN_MS,
    CLUB_CHALLENGER_SEEDS,
    computeRealisticMatchmakingDelayMs,
    isClubChallengerOnWeeklyCooldown,
    resetClubChallengerCooldownsForTests,
    resolveChallengerDifficultyForElo,
    selectClubChallengerForRating,
} from './clubChallengerPool';

describe('ClubChallengerPool — 300 Profils Humains Naturels, Verrou 7 Jours & Exception Revanche', () => {
    beforeEach(() => {
        resetClubChallengerCooldownsForTests();
    });

    it('contient exactement 300 profils internationaux actifs avec pseudo naturel, drapeau et niveau plafonné à expert', () => {
        expect(CLUB_CHALLENGER_SEEDS.length).toBe(300);
        const ids = new Set<string>();
        const usernames = new Set<string>();
        for (const seed of CLUB_CHALLENGER_SEEDS) {
            expect(seed.username.length).toBeGreaterThan(3);
            expect(seed.countryFlag.length).toBeGreaterThan(0);
            expect(['beginner', 'intermediate', 'expert']).toContain(seed.difficulty);
            expect(seed.difficulty).not.toBe('grandmaster');
            ids.add(seed.id);
            usernames.add(seed.username);
        }
        expect(ids.size).toBe(300);
        expect(usernames.size).toBe(300);
    });

    it('associe correctement les paliers Elo (<1500 beginner, 1500–1650 intermediate, >1650 expert) sans jamais renvoyer grandmaster', () => {
        expect(resolveChallengerDifficultyForElo(1400)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1495)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1500)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1650)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1655)).toBe('expert');
        expect(resolveChallengerDifficultyForElo(2400)).toBe('expert');
    });

    it('empêche de rejouer contre le même profil pendant 7 jours (1 semaine), sauf en cas de revanche explicite', () => {
        const t0 = 1_730_000_000_000;
        const firstOpp = selectClubChallengerForRating(1500, { nowMs: t0 });
        expect(isClubChallengerOnWeeklyCooldown(firstOpp.username, t0 + 1000)).toBe(true);

        for (let i = 1; i <= 25; i++) {
            const nextOpp = selectClubChallengerForRating(1500, { nowMs: t0 + i * 60_000 });
            expect(nextOpp.username).not.toBe(firstOpp.username);
        }

        const rematchOpp = selectClubChallengerForRating(1500, {
            isRematch: true,
            previousChallenger: firstOpp,
            nowMs: t0 + 120_000,
        });
        expect(rematchOpp.username).toBe(firstOpp.username);

        const afterOneWeek = t0 + 120_000 + BOT_WEEKLY_COOLDOWN_MS + 1000;
        expect(isClubChallengerOnWeeklyCooldown(firstOpp.username, afterOneWeek)).toBe(false);
    });

    it('génère un profil PlayerEloProfile complet avec drapeau, pseudo, rating non rond et cible ER/PR cohérente', () => {
        const beginnerOpp = selectClubChallengerForRating(1420);
        expect(beginnerOpp.clubBotDifficulty).toBe('beginner');
        expect(beginnerOpp.countryFlag).toBeTruthy();
        expect(beginnerOpp.displayName).toContain(beginnerOpp.username);
        expect(beginnerOpp.rating).toBeLessThan(1500);
        expect(beginnerOpp.rating % 10).not.toBe(0);
        expect(beginnerOpp.averagePr).toBeGreaterThanOrEqual(6.0);
        expect(beginnerOpp.averagePr).toBeLessThanOrEqual(9.0);

        const proOpp = selectClubChallengerForRating(1820);
        expect(proOpp.clubBotDifficulty).toBe('expert');
        expect(proOpp.rating).toBeGreaterThan(1650);
        expect(proOpp.rating % 10).not.toBe(0);
        expect(proOpp.averagePr).toBeGreaterThanOrEqual(1.0);
        expect(proOpp.averagePr).toBeLessThanOrEqual(2.0);
    });

    it('calcule un délai d’appariement réaliste compris entre 3,5s et 8,5s (3500..8500 ms)', () => {
        for (let i = 0; i < 10; i++) {
            const delay = computeRealisticMatchmakingDelayMs();
            expect(delay).toBeGreaterThanOrEqual(3500);
            expect(delay).toBeLessThanOrEqual(8500);
        }
    });
});
