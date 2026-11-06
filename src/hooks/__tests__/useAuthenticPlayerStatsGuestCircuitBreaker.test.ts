/**
 * @file src/hooks/__tests__/useAuthenticPlayerStatsGuestCircuitBreaker.test.ts
 * @description Test Vitest de conformité Loi 1 : Verrou Central Invité & Coupe-circuit LocalStorage.
 * Vérifie qu'un Invité a strictement null sur tous les indicateurs PR/ER/Elo.
 * Strictement <= 200 lignes, 0 any.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkIsPlayerRegistered,
    computeAuthenticStats,
    readRealMatchStatsRecord,
    saveRealMatchStats,
    REAL_MATCH_STATS_KEY,
} from '../useAuthenticPlayerStats';
import { readValidatedErState } from '../useDrillRating';
import {
    readLocalPlayerElo,
    saveLocalPlayerElo,
    readPublicAveragePr,
    storeEscrowEloPoints,
    readEscrowEloPoints,
    rewardFirstTryQuizOnPublicPr,
    recordMatchIntoPublicAveragePr,
    resetPublicPrForTests,
} from '../../features/multiplayer/elo';
import { QUIZ_ER_STORAGE_KEY } from '../../features/drills/quizRatingStore';
import { PLAYER_PASSPORT_STORAGE_KEY } from '../../lib/supabase/auth';

describe('Mission 1/25 — Verrou Central Invité & Coupe-circuit LocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
        resetPublicPrForTests();
    });

    it('1. Un Invité par défaut (localStorage vide) a strictement null sur tous les indicateurs PR/ER/Elo', () => {
        expect(checkIsPlayerRegistered()).toBe(false);

        const stats = computeAuthenticStats();
        expect(stats.isAuthenticated).toBe(false);
        expect(stats.isRegistered).toBe(false);
        expect(stats.canHavePR).toBe(false);
        expect(stats.hasRealPR).toBe(false);
        expect(stats.globalPR).toBeNull();
        expect(stats.checkerPR).toBeNull();
        expect(stats.cubePR).toBeNull();
        expect(stats.eloRating).toBeNull();
        expect(stats.gamesPlayed).toBe(0);
        expect(stats.statusLabel).toBe('guest');

        expect(readRealMatchStatsRecord()).toBeNull();
        expect(readValidatedErState()).toBeNull();
        expect(readLocalPlayerElo()).toBeNull();
        expect(readPublicAveragePr()).toBeNull();
        expect(readEscrowEloPoints()).toBeNull();
    });

    it('2. Un Invité avec flag explicite bg_is_guest=true bloque toute fuite même si des clés parasites existent', () => {
        window.localStorage.setItem('bg_is_guest', 'true');
        window.localStorage.setItem(REAL_MATCH_STATS_KEY, JSON.stringify({
            gamesPlayed: 10,
            totalCheckerLoss: 0.5,
            totalCheckerDecisions: 10,
            totalCubeLoss: 0.2,
            totalCubeDecisions: 5,
            rating: 1800,
        }));
        window.localStorage.setItem(QUIZ_ER_STORAGE_KEY, JSON.stringify({
            mode: 'ER',
            erPrScore: 5.2,
            erRating: 1650,
        }));

        expect(checkIsPlayerRegistered()).toBe(false);

        const stats = computeAuthenticStats();
        expect(stats.canHavePR).toBe(false);
        expect(stats.globalPR).toBeNull();
        expect(stats.checkerPR).toBeNull();
        expect(stats.cubePR).toBeNull();
        expect(stats.eloRating).toBeNull();

        expect(readRealMatchStatsRecord()).toBeNull();
        expect(readValidatedErState()).toBeNull();
        expect(readLocalPlayerElo()).toBeNull();
        expect(readPublicAveragePr()).toBeNull();
    });

    it('3. Coupe-circuit d\'écriture : un Invité ne peut écrire ni modifier PR/ER/Elo dans localStorage', () => {
        expect(checkIsPlayerRegistered()).toBe(false);

        const savedMatch = saveRealMatchStats({ gamesPlayed: 5, rating: 1600 });
        expect(savedMatch).toBeNull();
        expect(window.localStorage.getItem(REAL_MATCH_STATS_KEY)).toBeNull();

        const savedElo = saveLocalPlayerElo(1750);
        expect(savedElo).toBeNull();
        expect(window.localStorage.getItem('bg_player_elo')).toBeNull();

        const savedEscrow = storeEscrowEloPoints(15);
        expect(savedEscrow).toBeNull();
        expect(window.localStorage.getItem('bg_escrow_elo_points_v1')).toBeNull();

        const rewardedPr = rewardFirstTryQuizOnPublicPr();
        expect(rewardedPr).toBeNull();
        expect(window.localStorage.getItem('bg_public_average_pr_v1')).toBeNull();

        const recordedPr = recordMatchIntoPublicAveragePr(4.5);
        expect(recordedPr).toBeNull();
        expect(window.localStorage.getItem('bg_public_average_pr_v1')).toBeNull();
    });

    it('4. Dès qu\'un utilisateur est authentifié (passeport membre valide), les indicateurs et écritures s\'activent', () => {
        window.localStorage.setItem(
            PLAYER_PASSPORT_STORAGE_KEY,
            JSON.stringify({
                pseudo: 'Capitaine',
                email: 'capitaine@backgammontour.com',
                experienceLevel: 'expert',
                avatarUrl: '/avatars/user-avatar-1.jpg',
                countryName: 'France',
                countryCode: 'FR',
                registeredAt: new Date().toISOString(),
            }),
        );

        expect(checkIsPlayerRegistered()).toBe(true);

        const stats = computeAuthenticStats();
        expect(stats.isAuthenticated).toBe(true);
        expect(stats.canHavePR).toBe(true);

        const erState = readValidatedErState();
        expect(erState).not.toBeNull();
        expect(erState?.mode).toBe('ER');
        expect(erState?.erPrScore).toBe(6.3);

        const elo = readLocalPlayerElo();
        expect(elo).toBe(1500);

        const publicPr = readPublicAveragePr();
        expect(publicPr).toBe(8.5);

        const savedElo = saveLocalPlayerElo(1620);
        expect(savedElo).toBe(1620);
        expect(readLocalPlayerElo()).toBe(1620);
    });
});
