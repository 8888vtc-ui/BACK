import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ConceptsErrorSummary from './ConceptsErrorSummary';
import type { EvaluatedTurn } from '../../features/rating/types';

describe('ConceptsErrorSummary', () => {
    it('affiche un message de félicitations si aucune erreur n’a été commise', () => {
        const perfectMoves: EvaluatedTurn[] = [
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
        ];

        const html = renderToStaticMarkup(
            <ConceptsErrorSummary moves={perfectMoves} onSelectMoveIndex={vi.fn()} />,
        );

        expect(html).toContain('data-testid="concepts-no-errors"');
        expect(html).toContain('Exécution Stratégique Impeccable !');
    });

    it('regroupe les erreurs par concept stratégique avec recommandations et liens drills', () => {
        const mistakeMoves: EvaluatedTurn[] = [
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
                conceptId: 'blot_safety',
            },
            {
                moveNumber: 5,
                player: 'X',
                dice: [5, 4],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '13/9 13/8',
                optimalNotation: '24/20 13/8',
                equityLoss: -0.125,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 10,
                conceptId: 'blot_safety',
            },
            {
                moveNumber: 8,
                player: 'X',
                dice: [6, 5],
                boardBefore: new Array(28).fill(0),
                boardAfter: new Array(28).fill(0),
                playedNotation: '24/18 13/8',
                optimalNotation: '24/13',
                equityLoss: -0.098,
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 6,
                conceptId: 'race_management',
            },
        ];

        const html = renderToStaticMarkup(
            <ConceptsErrorSummary moves={mistakeMoves} onSelectMoveIndex={vi.fn()} />,
        );

        expect(html).toContain('data-testid="concepts-error-summary"');
        expect(html).toContain('Concepts Stratégiques à Travailler');
        expect(html).toContain('Minimisation des tirs &amp; Sécurité des blots');
        expect(html).toContain('Règle de course en avance (Pip Count)');
        expect(html).toContain('1 blunder');
        expect(html).toContain('Accéder aux Drills');
    });
});
