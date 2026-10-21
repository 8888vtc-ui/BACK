// @vitest-environment jsdom
/**
 * Tests du composant GameReviewCourse (cours de fin de partie IA).
 */

import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { GameReviewCourse } from './GameReviewCourse';
import type { CompleteGameAnalysis } from '../../features/rating/types';

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
        evaluatedMoves: [],
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
    vi.restoreAllMocks();
});

describe('GameReviewCourse', () => {
    it('affiche le squelette pendant le chargement', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise(() => { })));
        render(<GameReviewCourse analysis={makeAnalysis()} />);
        expect(screen.getByTestId('game-review-course-loading')).toBeTruthy();
    });

    it('affiche le cours fourni via le repli local (full)', async () => {
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
    });

    it('affiche une erreur avec bouton réessayer en cas d\'échec', async () => {
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
