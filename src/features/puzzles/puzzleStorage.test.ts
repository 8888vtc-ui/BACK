import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getPuzzleStats,
    recordPuzzleAttempt,
    isPuzzleSolved,
    getTodayDateString,
} from './puzzleStorage';

describe('puzzleStorage (Séries et progression puzzles)', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStore[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                mockStore[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStore[key];
            }),
            clear: vi.fn(() => {
                mockStore = {};
            }),
        };

        vi.stubGlobal('window', {
            localStorage: mockLocalStorage,
        });
    });

    it('initialise les statistiques à zéro par défaut', () => {
        const stats = getPuzzleStats();
        expect(stats.currentStreak).toBe(0);
        expect(stats.maxStreak).toBe(0);
        expect(stats.totalSolved).toBe(0);
        expect(stats.solvedPuzzleIds).toEqual([]);
    });

    it('incrémente la série lors d’un succès le jour suivant', () => {
        // Jour 1
        recordPuzzleAttempt('puzzle_1', true, '2026-10-15');
        let stats = getPuzzleStats();
        expect(stats.currentStreak).toBe(1);
        expect(stats.maxStreak).toBe(1);
        expect(stats.totalSolved).toBe(1);

        // Jour 2 consécutif
        recordPuzzleAttempt('puzzle_2', true, '2026-10-16');
        stats = getPuzzleStats();
        expect(stats.currentStreak).toBe(2);
        expect(stats.maxStreak).toBe(2);
        expect(stats.totalSolved).toBe(2);
    });

    it('réinitialise la série à 1 si plus d’un jour s’est écoulé (série brisée)', () => {
        // Jour 1
        recordPuzzleAttempt('puzzle_1', true, '2026-10-10');
        // Jour 5 (4 jours plus tard)
        recordPuzzleAttempt('puzzle_5', true, '2026-10-14');

        const stats = getPuzzleStats();
        expect(stats.currentStreak).toBe(1); // Recommencé à 1
        expect(stats.maxStreak).toBe(1);
        expect(stats.totalSolved).toBe(2);
    });

    it('ne compte pas deux fois le streak si résolu le même jour', () => {
        recordPuzzleAttempt('puzzle_1', true, '2026-10-16');
        recordPuzzleAttempt('puzzle_2', true, '2026-10-16');

        const stats = getPuzzleStats();
        expect(stats.currentStreak).toBe(1);
        expect(stats.totalSolved).toBe(2);
    });

    it('identifie si un puzzle a déjà été résolu avec succès', () => {
        expect(isPuzzleSolved('puzzle_alpha')).toBe(false);
        recordPuzzleAttempt('puzzle_alpha', true);
        expect(isPuzzleSolved('puzzle_alpha')).toBe(true);
    });
});
