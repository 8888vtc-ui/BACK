import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EquityCurveChart from './EquityCurveChart';
import type { EvaluatedTurn } from '../../features/rating/types';

describe('EquityCurveChart', () => {
    it('affiche un message d’état vide si aucun coup n’est fourni', () => {
        const html = renderToStaticMarkup(
            <EquityCurveChart moves={[]} selectedIndex={0} onSelectIndex={vi.fn()} />,
        );
        expect(html).toContain('Aucun coup enregistré');
    });

    it('trace la courbe d’équité avec ses points et sa légende', () => {
        const mockMoves: EvaluatedTurn[] = [
            {
                moveNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '8/5 6/5',
                optimalNotation: '8/5 6/5',
                equityLoss: 0,
                verdict: 'optimal',
                isUnforced: true,
                candidateCount: 6,
            },
            {
                moveNumber: 2,
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
            },
            {
                moveNumber: 3,
                player: 'X',
                dice: [5, 5],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '13/3(2)',
                optimalNotation: '8/3(2) 6/1(2)',
                equityLoss: -0.155,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 12,
            },
        ];

        const html = renderToStaticMarkup(
            <EquityCurveChart moves={mockMoves} selectedIndex={1} onSelectIndex={vi.fn()} />,
        );

        expect(html).toContain('data-testid="equity-curve-container"');
        expect(html).toContain('data-testid="equity-curve-svg"');
        expect(html).toContain('data-testid="equity-point-1"');
        expect(html).toContain('data-testid="equity-point-2"');
        expect(html).toContain('data-testid="equity-point-3"');
        expect(html).toContain('Courbe d&#x27;Équité Cumulée');
        expect(html).toContain('3 coups');
        expect(html).toContain('24/18 13/11');
        expect(html).toContain('Optimal / Acceptable');
        expect(html).toContain('Douteux');
        expect(html).toContain('Blunder');
    });
});
