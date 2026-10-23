// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    STORAGE_KEY_PUZZLE_STREAK,
    STORAGE_KEY_LAST_PUZZLE_DATE,
    STORAGE_KEY_PUZZLE_RATING,
    STORAGE_KEY_FSRS_QUEUE,
    getUtcDateString,
    getDailyPuzzleForUtcDate,
    getDailyPuzzleById,
    formatPuzzleMatchScoreLabel,
    computePuzzleXpWithHintPenalty,
    classifyEquityDeltaVerdict,
    evaluateDailyPuzzleCheckerMove,
    loadLocalPuzzleProfile,
    syncDailyPuzzleCompletion,
    injectFailedPuzzleIntoFsrs,
    getLocalFsrsQueue,
} from './puzzleService';

describe('puzzleService — Moteur Métier du Puzzle du Jour (/daily-puzzle)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('sélectionne un puzzle quotidien déterministe à 00h00 UTC et formate le score Away / Money Game', () => {
        const d1 = new Date('2026-10-23T00:00:01.000Z');
        const d2 = new Date('2026-10-23T23:59:59.000Z');
        expect(getUtcDateString(d1)).toBe('2026-10-23');
        expect(getUtcDateString(d2)).toBe('2026-10-23');
        expect(getDailyPuzzleForUtcDate(d1).id).toBe(getDailyPuzzleForUtcDate(d2).id);

        const matchPuzzle = getDailyPuzzleById('sage_daily_01_prime_blitz_crossroad')!;
        expect(formatPuzzleMatchScoreLabel(matchPuzzle)).toContain('3-away / 5-away');

        const moneyPuzzle = getDailyPuzzleById('sage_daily_02_bar_reentry_blitz')!;
        expect(formatPuzzleMatchScoreLabel(moneyPuzzle)).toContain('Money Game');
    });

    it('applique les pénalités d’XP des indices progressifs (-25% XP Indice 1, -50% XP Indice 2)', () => {
        expect(computePuzzleXpWithHintPenalty(0, 100)).toEqual({ earnedXp: 100, xpPenaltyPct: 0 });
        expect(computePuzzleXpWithHintPenalty(1, 100)).toEqual({ earnedXp: 75, xpPenaltyPct: 25 });
        expect(computePuzzleXpWithHintPenalty(2, 100)).toEqual({ earnedXp: 50, xpPenaltyPct: 50 });
    });

    it('classifie exactement les 4 paliers de verdict (BEST, EXCELLENTE ALTERNATIVE, ERREUR, BLUNDER)', () => {
        // 🟢 BEST (ΔE = 0.000)
        const best = classifyEquityDeltaVerdict({
            deltaEquity: 0,
            bestEquity: 0.642,
            playedNotation: '8/4 6/4',
            bestNotation: '8/4 6/4',
        });
        expect(best.code).toBe('BEST');
        expect(best.badgeEmoji).toBe('🟢');
        expect(best.isSolved).toBe(true);

        // 🟡 EXCELLENTE ALTERNATIVE (ΔE <= 0.015)
        const alt = classifyEquityDeltaVerdict({
            deltaEquity: 0.012,
            bestEquity: 0.642,
            playedNotation: '13/9 13/11',
            bestNotation: '8/4 6/4',
        });
        expect(alt.code).toBe('EXCELLENT_ALTERNATIVE');
        expect(alt.badgeEmoji).toBe('🟡');
        expect(alt.canSeekSuperiorNuance).toBe(true);

        // 🟠 ERREUR (0.020 <= ΔE < 0.080)
        const err = classifyEquityDeltaVerdict({
            deltaEquity: 0.044,
            bestEquity: 0.642,
            playedNotation: '24/20 13/11',
            bestNotation: '8/4 6/4',
        });
        expect(err.code).toBe('ERROR');
        expect(err.badgeEmoji).toBe('🟠');
        expect(err.canRetry).toBe(true);

        // 🔴 BLUNDER (ΔE >= 0.080) avec détection du piège de la partie originale
        const puzzle = getDailyPuzzleById('sage_daily_01_prime_blitz_crossroad')!;
        const blunder = evaluateDailyPuzzleCheckerMove(puzzle, [
            { from: 24, to: 20 },
            { from: 20, to: 18 },
        ]);
        expect(blunder.code).toBe('BLUNDER');
        expect(blunder.badgeEmoji).toBe('🔴');
        expect(blunder.fellIntoOriginalTrap).toBe(true);
        expect(blunder.trapAlertMessage).toContain('PIÈGE HISTORIQUE');
        expect(blunder.revealDebrief).toBe(true);
    });

    it('persiste le Streak quotidien dans backgammon.puzzleStreak / backgammon.lastPuzzleDate et met à jour puzzle_rating', async () => {
        const puzzle = getDailyPuzzleById('sage_daily_01_prime_blitz_crossroad')!;

        const day1 = await syncDailyPuzzleCompletion({
            puzzle,
            solvedOnFirstAttempt: true,
            utcDateStr: '2026-10-22',
        });
        expect(day1.profile.currentStreak).toBe(1);
        expect(window.localStorage.getItem(STORAGE_KEY_PUZZLE_STREAK)).toBe('1');
        expect(window.localStorage.getItem(STORAGE_KEY_LAST_PUZZLE_DATE)).toBe('2026-10-22');
        expect(Number(window.localStorage.getItem(STORAGE_KEY_PUZZLE_RATING))).toBeGreaterThan(1500);

        const day2 = await syncDailyPuzzleCompletion({
            puzzle,
            solvedOnFirstAttempt: true,
            utcDateStr: '2026-10-23',
        });
        expect(day2.profile.currentStreak).toBe(2);
        expect(day2.profile.maxStreak).toBe(2);
        expect(loadLocalPuzzleProfile().currentStreak).toBe(2);
    });

    it('injecte automatiquement un puzzle raté au 1er essai dans la file FSRS (J+1, J+3, J+7, J+14, J+30)', async () => {
        const puzzle = getDailyPuzzleById('sage_daily_01_prime_blitz_crossroad')!;
        const now = new Date('2026-10-23T12:00:00.000Z');

        const { entry, schedule } = await injectFailedPuzzleIntoFsrs({
            puzzle,
            playedNotation: '24/18',
            equityLoss: 0.124,
            now,
        });

        expect(schedule.interval_days).toBe(1);
        expect(entry.scheduledIntervals).toEqual([1, 3, 7, 14, 30]);
        expect(entry.next_review_date).toBe('2026-10-24T12:00:00.000Z');

        const queue = getLocalFsrsQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0]?.conceptId).toBe('prime_construction');
        expect(window.localStorage.getItem(STORAGE_KEY_FSRS_QUEUE)).toBeTruthy();
    });
});
