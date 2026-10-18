// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { MatchScoreSheet } from './MatchScoreSheet';
import type { RawGameTurn } from '../../features/rating';

describe('MatchScoreSheet component', () => {
    afterEach(cleanup);
    it('affiche le message d’attente si aucun coup n’a été joué', () => {
        render(<MatchScoreSheet turnsHistory={[]} />);
        expect(screen.getByText(/Feuille de Match en Direct/i)).toBeDefined();
        expect(screen.getByText(/La transcription officielle des coups s'affichera ici/i)).toBeDefined();
    });

    it('affiche les coups joués avec la notation officielle', () => {
        const dummyTurn: RawGameTurn = {
            turnNumber: 1,
            player: 'X',
            dice: [5, 3],
            boardBefore: new Array(26).fill(0),
            boardAfter: new Array(26).fill(0),
            moves: [{ from: 24, to: 20 }, { from: 13, to: 10 }],
        };

        render(<MatchScoreSheet turnsHistory={[dummyTurn]} />);
        expect(screen.getByText(/1\./)).toBeDefined();
        expect(screen.getByText(/\[5-3\]/)).toBeDefined();
    });

    it('affiche le PR comparatif pour le Joueur Blanc et l’IA', () => {
        render(
            <MatchScoreSheet
                turnsHistory={[]}
                matchStats={{ decisionsCount: 5, totalEquityLoss: 0.05, totalErrorRate: 5.0 }}
                matchStatsO={{ decisionsCount: 4, totalEquityLoss: 0.02, totalErrorRate: 2.5 }}
            />
        );
        expect(screen.getByTestId('scoresheet-pr-x').textContent).toContain('PR X: 5.0');
        expect(screen.getByTestId('scoresheet-pr-o').textContent).toContain('PR IA: 2.5');
    });
});

