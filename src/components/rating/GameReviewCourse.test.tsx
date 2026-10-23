// @vitest-environment jsdom
/**
 * Tests du composant GameReviewCourse (cours de fin de partie IA & Galaxy Mistake Review).
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { GameReviewCourse } from './GameReviewCourse';
import type { CompleteGameAnalysis } from '../../features/rating/types';

const mockUpsertRecurringError = vi.fn().mockResolvedValue(null);
const mockGetCurrentUser = vi.fn().mockResolvedValue({ id: 'user-123' });

vi.mock('../../lib/supabase/db', () => ({
    upsertRecurringError: (...args: unknown[]) => mockUpsertRecurringError(...args),
}));

vi.mock('../../lib/supabase/auth', () => ({
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

function makeAnalysis(): CompleteGameAnalysis {
    return {
        id: 'analysis-1',
        gameId: 'game-1',
        date: '2026-10-20T00:00:00.000Z',
        player: 'X',
        opponentType: 'ai',
        opponentDifficulty: 'expert',
        winner: 'X',
        winType: 'single',
        pointsWon: 1,
        scoreX: 7,
        scoreO: 3,
        matchLength: 7,
        totalMovesCount: 40,
        decisionsCount: 20,
        unforcedDecisionsCount: 18,
        totalEquityLoss: 0.45,
        errorRate: 0.025,
        performanceRating: 12.5,
        estimatedRating: 1500,
        prCategory: 'Intermédiaire',
        breakdown: { optimal: 10, acceptable: 4, doubtful: 3, blunder: 2, howler: 1 },
        evaluatedMoves: [
            {
                moveNumber: 4,
                player: 'X',
                dice: [3, 1],
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                playedNotation: '24/21 13/12',
                optimalNotation: '8/5 6/5',
                equityLoss: -0.145,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 8,
                conceptId: 'making-points',
            },
            {
                moveNumber: 9,
                player: 'X',
                dice: [6, 5],
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                playedNotation: '13/7 13/8',
                optimalNotation: '24/13',
                equityLoss: -0.092,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 6,
                conceptId: 'running-game',
            },
        ],
    };
}

function makeSseStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
        },
    });
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('GameReviewCourse', () => {
    it('affiche le squelette pendant le chargement', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
        render(<GameReviewCourse analysis={makeAnalysis()} />);
        expect(screen.getByTestId('game-review-course-loading')).toBeTruthy();
    });

    it('affiche le cours, synchronise les blunders et permet la navigation clavier ArrowRight / ArrowLeft / Espace', async () => {
        const course = {
            title: 'Bilan de ta partie',
            summary: 'PR 12.50 avec 3 blunder(s)/howler(s).',
            strengths: ['Majorité solide de coups optimaux.'],
            weaknesses: ['3 blunder(s)/howler(s) à éliminer.'],
            lessons: [{ concept: 'Réduction des blunders', advice: 'Vérifie les tirs directs.' }],
            nextSteps: ['Revois tes blunders.'],
        };

        const stream = makeSseStream([
            `data: ${JSON.stringify({ full: course })}\n\n`,
            'data: [DONE]\n\n',
        ]);

        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(
                    new Response(stream, {
                        status: 200,
                        headers: { 'Content-Type': 'text/event-stream' },
                    }),
                ),
            ),
        );

        render(<GameReviewCourse analysis={makeAnalysis()} />);

        await waitFor(() => {
            expect(screen.getByTestId('game-review-course')).toBeTruthy();
        });
        expect(screen.getByText('Bilan de ta partie')).toBeTruthy();
        expect(screen.getByText('Réduction des blunders')).toBeTruthy();
        expect(screen.getByTestId('train-weaknesses-btn')).toBeTruthy();

        // Vérifie la boîte Galaxy Mistake Review sur l'erreur #1 (Coup #4)
        expect(screen.getByTestId('galaxy-mistake-review-box').textContent).toContain('Coup #4');

        // Touche Espace : affiche la solution Grand-Maître et les flèches tactiques
        fireEvent.keyDown(window, { key: ' ', code: 'Space' });
        expect(screen.getByTestId('mistake-review-gm-arrows').textContent).toContain('8/5 6/5');

        // Touche Flèche Droite : passe à l'erreur suivante (Coup #9)
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        expect(screen.getByTestId('galaxy-mistake-review-box').textContent).toContain('Coup #9');

        // Touche Flèche Gauche : revient à l'erreur précédente (Coup #4)
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        expect(screen.getByTestId('galaxy-mistake-review-box').textContent).toContain('Coup #4');

        // Vérifie la synchronisation automatique dans Supabase `recurring_errors`
        await waitFor(() => {
            expect(mockUpsertRecurringError).toHaveBeenCalledWith(
                'user-123',
                'making-points',
                'making-points',
                0.145,
            );
        });
    });

    it("affiche une erreur avec bouton réessayer en cas d'échec", async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 500 }))),
        );

        render(<GameReviewCourse analysis={makeAnalysis()} />);

        await waitFor(() => {
            expect(screen.getByTestId('game-review-course-error')).toBeTruthy();
        });
        expect(screen.getByText(/Réessayer/)).toBeTruthy();
    });
});
