// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    formatRelativeMatchDate,
    getMasteredOpeningIds,
    markOpeningMastered,
    getSyncAcademySnapshot,
    loadPlayerHubData,
    MASTERED_OPENINGS_STORAGE_KEY,
} from './userProgressionService';
import * as persistenceModule from '../../lib/offline/persistenceService';
import * as supabaseModule from '../../lib/supabase/client';
import * as dbModule from '../../lib/supabase/db';
import * as authModule from '../../lib/supabase/auth';

describe('userProgressionService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('formatRelativeMatchDate', () => {
        const now = 1700000000000;

        it('formate correctement les durées relatives', () => {
            expect(formatRelativeMatchDate('invalid-date')).toBe('Récent');
            expect(formatRelativeMatchDate(new Date(now - 30 * 1000).toISOString(), now)).toBe('À l’instant');
            expect(formatRelativeMatchDate(new Date(now - 5 * 60 * 1000).toISOString(), now)).toBe('Il y a 5 min');
            expect(formatRelativeMatchDate(new Date(now - 3 * 3600 * 1000).toISOString(), now)).toBe('Il y a 3 h');
            expect(formatRelativeMatchDate(new Date(now - 24 * 3600 * 1000).toISOString(), now)).toBe('Hier');
            expect(formatRelativeMatchDate(new Date(now - 4 * 24 * 3600 * 1000).toISOString(), now)).toBe('Il y a 4 j');
        });
    });

    describe('getMasteredOpeningIds & markOpeningMastered', () => {
        it('gère l\'ajout et la persistance des ouvertures maîtrisées', () => {
            expect(getMasteredOpeningIds()).toEqual([]);

            const step1 = markOpeningMastered('op-31');
            expect(step1).toContain('op-31');
            expect(getMasteredOpeningIds()).toContain('op-31');

            // Déduplication
            const step2 = markOpeningMastered('op-31');
            expect(step2.length).toBe(1);

            expect(localStorage.getItem(MASTERED_OPENINGS_STORAGE_KEY)).toContain('op-31');
        });
    });

    describe('getSyncAcademySnapshot', () => {
        it('calcule un snapshot synchrone par défaut', () => {
            const snapshot = getSyncAcademySnapshot(1600, 4.2);
            expect(snapshot.eloRating).toBe(1600);
            expect(snapshot.averagePR).toBe(4.2);
            expect(snapshot.puzzlesTotal).toBeGreaterThan(0);
            expect(snapshot.openingsTotal).toBeGreaterThan(0);
        });
    });

    describe('loadPlayerHubData', () => {
        it('charge les matchs locaux et les stats depuis IndexedDB sans utilisateur connecté', async () => {
            vi.spyOn(persistenceModule, 'loadRecentGames').mockResolvedValue([
                {
                    id: 'game-1',
                    opponent_type: 'ai',
                    score_x: 7,
                    score_o: 4,
                    match_length: 7,
                    winner: 'X',
                    status: 'completed',
                    created_at: new Date().toISOString(),
                    started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    cube_value: 1,
                    is_crawford: false,
                },
            ]);

            const res = await loadPlayerHubData(null);
            expect(res.recentMatches.length).toBe(1);
            expect(res.recentMatches[0].opponentLabel).toBe('IA Monte-Carlo');
            expect(res.recentMatches[0].isVictory).toBe(true);
            expect(res.snapshot.gamesPlayed).toBe(1);
            expect(res.snapshot.winsCount).toBe(1);
        });

        it('charge les stats cloud lorsque Supabase et userId sont disponibles', async () => {
            vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
            vi.spyOn(authModule, 'getUserStats').mockResolvedValue({
                user_id: 'usr-123',
                games_played: 12,
                games_won: 8,
                games_lost: 4,
                gammons_won: 2,
                backgammons_won: 0,
                total_blunders: 5,
                total_errors: 10,
                total_equity_loss: 1.2,
                average_error_rate: 3.8,
                updated_at: '2026-01-01',
            });
            vi.spyOn(dbModule, 'getUserGames').mockResolvedValue([
                {
                    id: 'cloud-g-1',
                    user_id: 'usr-123',
                    opponent_type: 'human',
                    opponent_difficulty: null,
                    match_length: 5,
                    score_x: 5,
                    score_o: 2,
                    winner: 'X',
                    win_type: 'single',
                    points_won: 1,
                    cube_value: 1,
                    cube_owner: null,
                    is_crawford: false,
                    status: 'completed',
                    started_at: new Date().toISOString(),
                    ended_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);
            vi.spyOn(persistenceModule, 'loadRecentGames').mockResolvedValue([]);

            const res = await loadPlayerHubData('usr-123');
            expect(res.recentMatches.length).toBe(1);
            expect(res.recentMatches[0].opponentLabel).toBe('Adversaire En Ligne');
            expect(res.snapshot.gamesPlayed).toBe(12);
            expect(res.snapshot.winsCount).toBe(8);
        });
    });
});
