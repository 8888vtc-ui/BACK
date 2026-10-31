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

describe('ClubChallengerPool — 100 Bots Actifs, Verrou 7 Jours & Exception Revanche', () => {
    beforeEach(() => {
        resetClubChallengerCooldownsForTests();
    });

    it('contient exactement 100 bots internationaux actifs avec pseudo, drapeau et niveau plafonné à expert', () => {
        expect(CLUB_CHALLENGER_SEEDS.length).toBe(100);
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
        expect(ids.size).toBe(100);
        expect(usernames.size).toBe(100);
    });

    it('associe correctement les paliers Elo du débutant (1450) au club (1680) et au pro (1900+) sans jamais renvoyer grandmaster', () => {
        expect(resolveChallengerDifficultyForElo(1400)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1500)).toBe('beginner');
        expect(resolveChallengerDifficultyForElo(1650)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1780)).toBe('intermediate');
        expect(resolveChallengerDifficultyForElo(1850)).toBe('expert');
        expect(resolveChallengerDifficultyForElo(2400)).toBe('expert');
    });

    it('empêche de rejouer contre le même bot pendant 7 jours (1 semaine), sauf en cas de revanche explicite', () => {
        const t0 = 1_730_000_000_000;
        const firstOpp = selectClubChallengerForRating(1500, { nowMs: t0 });
        expect(isClubChallengerOnWeeklyCooldown(firstOpp.username, t0 + 1000)).toBe(true);

        // Sur 25 recherches successives dans la même semaine, le joueur ne retombe JAMAIS sur firstOpp
        for (let i = 1; i <= 25; i++) {
            const nextOpp = selectClubChallengerForRating(1500, { nowMs: t0 + i * 60_000 });
            expect(nextOpp.username).not.toBe(firstOpp.username);
        }

        // Si le joueur demande explicitement une revanche (isRematch: true), il peut rejouer immédiatement contre firstOpp
        const rematchOpp = selectClubChallengerForRating(1500, {
            isRematch: true,
            previousChallenger: firstOpp,
            nowMs: t0 + 120_000,
        });
        expect(rematchOpp.username).toBe(firstOpp.username);

        // Au-delà d'une semaine (7 jours + 1s), le verrou expire
        const afterOneWeek = t0 + 120_000 + BOT_WEEKLY_COOLDOWN_MS + 1000;
        expect(isClubChallengerOnWeeklyCooldown(firstOpp.username, afterOneWeek)).toBe(false);
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
        expect(proOpp.rating).toBeGreaterThanOrEqual(1780);
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
