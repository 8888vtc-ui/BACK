import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ReviewBoardPreview, { parseMoveNotation } from './ReviewBoardPreview';
import type { EvaluatedTurn } from '../../features/rating/types';

describe('ReviewBoardPreview', () => {
    describe('parseMoveNotation', () => {
        it('découpe correctement une notation standard de backgammon', () => {
            expect(parseMoveNotation('8/5 6/5')).toEqual([
                { from: 8, to: 5 },
                { from: 6, to: 5 },
            ]);
            expect(parseMoveNotation('bar/20 13/8')).toEqual([
                { from: 25, to: 20 },
                { from: 13, to: 8 },
            ]);
            expect(parseMoveNotation('6/off 5/off')).toEqual([
                { from: 6, to: 0 },
                { from: 5, to: 0 },
            ]);
            expect(parseMoveNotation('')).toEqual([]);
        });
    });

    it('affiche le plateau, les dés, les coups joué et optimal, et les contrôles', () => {
        const mockTurn: EvaluatedTurn = {
            moveNumber: 3,
            player: 'X',
            dice: [6, 2],
            boardBefore: new Array(28).fill(0),
            boardAfter: new Array(28).fill(0),
            playedNotation: '24/18 13/11',
            optimalNotation: '13/7 13/11',
            equityLoss: -0.045,
            verdict: 'doubtful',
            isUnforced: true,
            candidateCount: 8,
        };

        const html = renderToStaticMarkup(
            <ReviewBoardPreview
                turn={mockTurn}
                currentIndex={2}
                totalTurns={10}
                onPrev={vi.fn()}
                onNext={vi.fn()}
                onFirst={vi.fn()}
                onLast={vi.fn()}
                onPrevMistake={vi.fn()}
                onNextMistake={vi.fn()}
                hasPrevMistake={true}
                hasNextMistake={false}
                onSelectIndex={vi.fn()}
            />,
        );

        expect(html).toContain('data-testid="review-board-preview"');
        expect(html).toContain('Coup #3');
        expect(html).toContain('6-2');
        expect(html).toContain('24/18 13/11');
        expect(html).toContain('13/7 13/11');
        expect(html).toContain('-0.045 ΔEq');
        expect(html).toContain('Avant le coup');
        expect(html).toContain('Après le coup');
        expect(html).toContain('3 / 10');
        expect(html).toContain('Faute préc.');
        expect(html).toContain('Faute suiv.');
    });
});
