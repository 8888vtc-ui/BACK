// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { DailyPuzzleScreen } from './DailyPuzzleScreen';
import {
    STORAGE_KEY_PUZZLE_STREAK,
    STORAGE_KEY_LAST_PUZZLE_DATE,
    STORAGE_KEY_FSRS_QUEUE,
    INTRO_REPLAY_DURATION_MS,
} from '../../lib/puzzle/puzzleService';

describe('DailyPuzzleScreen & Composants (/daily-puzzle)', () => {
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
            <DailyPuzzleScreen initialPuzzleId="sage_daily_01_prime_blitz_crossroad" />,
        );

        expect(screen.getByTestId('daily-puzzle-header')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-intro-replay-banner')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-match-score').textContent).toContain(
            '3-away / 5-away',
        );

        // Avance de 1.2s (1200ms)
        act(() => {
            vi.advanceTimersByTime(INTRO_REPLAY_DURATION_MS);
        });

        expect(screen.queryByTestId('daily-puzzle-intro-replay-banner')).toBeNull();
    });

    it('débloque progressivement l’Indice 1 (-25% XP : plan de jeu) puis l’Indice 2 (-50% XP : pions sources)', () => {
        render(
            <DailyPuzzleScreen
                initialPuzzleId="sage_daily_01_prime_blitz_crossroad"
                autoSkipIntro
            />,
        );

        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+100 XP');

        // Clic Indice 1
        fireEvent.click(screen.getByTestId('daily-puzzle-hint-btn'));
        expect(screen.getByTestId('daily-puzzle-hint-1').textContent).toContain(
            'Construction de Prime',
        );
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+75 XP');
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('-25%');

        // Clic Indice 2
        fireEvent.click(screen.getByTestId('daily-puzzle-hint-btn'));
        expect(screen.getByTestId('daily-puzzle-hint-2')).toBeTruthy();
        expect(screen.getByTestId('hint-source-badge-8')).toBeTruthy();
        expect(screen.getByTestId('hint-source-badge-6')).toBeTruthy();
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('+50 XP');
        expect(screen.getByTestId('daily-puzzle-xp-badge').textContent).toContain('-50%');
    });

    it('valide le meilleur coup (🟢 BEST), incrémente le Streak et affiche le débriefing Gemini', async () => {
        vi.useRealTimers();
        render(
            <DailyPuzzleScreen
                initialPuzzleId="sage_daily_01_prime_blitz_crossroad"
                autoSkipIntro
            />,
        );

        // Joue 8/4 puis 6/4 via les points du plateau
        fireEvent.click(screen.getByTestId('point-triangle-8'));
        fireEvent.click(screen.getByTestId('point-triangle-4'));
        fireEvent.click(screen.getByTestId('point-triangle-6'));
        fireEvent.click(screen.getByTestId('point-triangle-4'));

        fireEvent.click(screen.getByTestId('daily-puzzle-submit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('daily-puzzle-verdict')).toBeTruthy();
        });

        expect(screen.getByTestId('daily-puzzle-verdict').getAttribute('data-verdict-code')).toBe(
            'BEST',
        );
        expect(screen.getByTestId('verdict-badge').textContent).toContain('BEST');
        expect(screen.getByTestId('verdict-equity-delta').textContent).toContain('0.000');
        expect(screen.getByTestId('daily-puzzle-debrief')).toBeTruthy();
        expect(screen.getByTestId('debrief-gemini-explanation')).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY_PUZZLE_STREAK)).toBe('1');
        expect(window.localStorage.getItem(STORAGE_KEY_LAST_PUZZLE_DATE)).toBeTruthy();
    });

    it('détecte un 🔴 BLUNDER (piège de la partie originale) et planifie la révision FSRS (J+1..J+30)', async () => {
        vi.useRealTimers();
        render(
            <DailyPuzzleScreen
                initialPuzzleId="sage_daily_01_prime_blitz_crossroad"
                autoSkipIntro
            />,
        );

        // Joue le piège original 24/20 puis 20/18 (24/18)
        fireEvent.click(screen.getByTestId('point-triangle-24'));
        fireEvent.click(screen.getByTestId('point-triangle-20'));
        fireEvent.click(screen.getByTestId('point-triangle-20'));
        fireEvent.click(screen.getByTestId('point-triangle-18'));

        fireEvent.click(screen.getByTestId('daily-puzzle-submit-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('daily-puzzle-verdict')).toBeTruthy();
        });

        expect(screen.getByTestId('daily-puzzle-verdict').getAttribute('data-verdict-code')).toBe(
            'BLUNDER',
        );
        expect(screen.getByTestId('verdict-original-trap-alert').textContent).toContain(
            'PIÈGE HISTORIQUE',
        );
        expect(screen.getByTestId('verdict-fsrs-scheduled-banner')).toBeTruthy();
        expect(screen.getByTestId('debrief-fsrs-scheduler-card')).toBeTruthy();
        expect(screen.getByTestId('fsrs-interval-pill-1')).toBeTruthy();
        expect(screen.getByTestId('fsrs-interval-pill-30')).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY_FSRS_QUEUE)).toBeTruthy();
    });

    it('affiche l’objectif et le bouton de validation au premier coup d’œil avec border-white/10 et sans micro-textes (< 10px)', () => {
        render(
            <DailyPuzzleScreen
                initialPuzzleId="sage_daily_01_prime_blitz_crossroad"
                autoSkipIntro
            />,
        );

        const objective = screen.getByTestId('daily-puzzle-objective');
        const submitBtn = screen.getByTestId('daily-puzzle-submit-btn');
        const header = screen.getByTestId('daily-puzzle-header');

        expect(objective.textContent).toContain('Objectif :');
        expect(submitBtn.textContent).toContain('Valider mon coup');
        expect(header.className).toContain('border-white/10');
        expect(header.innerHTML).not.toContain('text-[10px]');
        expect(header.innerHTML).not.toContain('text-[9px]');
        expect(header.innerHTML).not.toContain('text-[8px]');
    });
});
