// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { DailyPuzzleScreen } from './DailyPuzzleScreen';
import { DailyPuzzleDebrief } from './DailyPuzzleDebrief';
import {
    STORAGE_KEY_PUZZLE_STREAK,
    STORAGE_KEY_LAST_PUZZLE_DATE,
    STORAGE_KEY_FSRS_QUEUE,
    INTRO_REPLAY_DURATION_MS,
    DAILY_PUZZLES_CATALOG,
} from '../../lib/puzzle/puzzleService';

describe('DailyPuzzleScreen & Composants (/daily-puzzle)', () => {
    const testPuzzleId = DAILY_PUZZLES_CATALOG[0]!.id;

    beforeEach(() => {
        window.localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('joue l’animation d’introduction de 1.2s du dernier coup adverse puis active le plateau', () => {
        render(
            <DailyPuzzleScreen initialPuzzleId={testPuzzleId} />,
        );

        expect(screen.getByTestId('daily-puzzle-header')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-intro-replay-banner')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-match-score')).toBeTruthy();

        // Avance de 1.2s (1200ms)
        act(() => {
            vi.advanceTimersByTime(INTRO_REPLAY_DURATION_MS);
        });

        expect(screen.queryByTestId('daily-puzzle-intro-replay-banner')).toBeNull();
    });

    it('débloque progressivement l’Indice 1 (-25% XP) puis l’Indice 2 (-50% XP)', () => {
        render(
            <DailyPuzzleScreen
                initialPuzzleId={testPuzzleId}
                autoSkipIntro
            />,
        );

        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+100 XP');

        // Clic Indice 1
        fireEvent.click(screen.getByTestId('daily-puzzle-hint-btn'));
        expect(screen.getByTestId('daily-puzzle-hint-1')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+75 XP');
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('-25%');

        // Clic Indice 2
        fireEvent.click(screen.getByTestId('daily-puzzle-hint-btn'));
        expect(screen.getByTestId('daily-puzzle-hint-2')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+50 XP');
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('-50%');
    });

    it('affiche le débriefing Gemini et valide le coup optimal', () => {
        const puzzle = DAILY_PUZZLES_CATALOG[0]!;
        render(
            <DailyPuzzleDebrief
                puzzle={puzzle}
                verdict={{
                    code: 'BEST',
                    badgeLabel: 'BEST',
                    badgeEmoji: '🟢',
                    deltaEquity: 0,
                    playerEquity: 0.6,
                    bestEquity: 0.6,
                    playedNotation: puzzle.bestMoveNotation,
                    bestNotation: puzzle.bestMoveNotation,
                    isSolved: true,
                    canRetry: false,
                    canSeekSuperiorNuance: false,
                    revealDebrief: true,
                    fellIntoOriginalTrap: false,
                    trapAlertMessage: null,
                    earnedXp: 100,
                    xpPenaltyPct: 0,
                    feedbackHeadline: 'Parfait !',
                    feedbackDetail: 'Coup optimal.',
                }}
                showDebrief={true}
                fsrsScheduledEntry={null}
            />,
        );

        expect(screen.getByTestId('daily-puzzle-debrief')).toBeTruthy();
    });

    it('détecte un 🔴 BLUNDER et planifie la révision FSRS (J+1..J+30)', async () => {
        vi.useRealTimers();
        const blunderPuzzle =
            DAILY_PUZZLES_CATALOG.find((p) => p.originalTrap.equityLoss >= 0.08) ??
            DAILY_PUZZLES_CATALOG[0]!;
        render(
            <DailyPuzzleScreen
                initialPuzzleId={blunderPuzzle.id}
                autoSkipIntro
            />,
        );

        const trapMoves = blunderPuzzle.originalTrap.moves;
        if (trapMoves.length > 0) {
            const m = trapMoves[0]!;
            const fromElem = screen.queryByTestId(`point-triangle-${m.from}`);
            const toElem = screen.queryByTestId(`point-triangle-${m.to}`);
            if (fromElem && toElem) {
                fireEvent.click(fromElem);
                fireEvent.click(toElem);
            }
        }

        fireEvent.click(screen.getByTestId('daily-puzzle-submit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('daily-puzzle-verdict')).toBeTruthy();
        });

        expect(screen.getByTestId('daily-puzzle-verdict').getAttribute('data-verdict-code')).toBe(
            'BLUNDER',
        );
        expect(screen.getByTestId('debrief-fsrs-scheduler-card')).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY_FSRS_QUEUE)).toBeTruthy();
    });

    it('affiche l’objectif et le bouton de validation au premier coup d’œil', () => {
        render(
            <DailyPuzzleScreen
                initialPuzzleId={testPuzzleId}
                autoSkipIntro
            />,
        );

        const objective = screen.getByTestId('daily-puzzle-objective');
        const submitBtn = screen.getByTestId('daily-puzzle-submit-btn');
        const header = screen.getByTestId('daily-puzzle-header');

        expect(objective.textContent).toContain('Objectif :');
        expect(submitBtn.textContent).toContain('Valider mon coup');
        expect(header.className).toContain('border-white/10');
    });
});
