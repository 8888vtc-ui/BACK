// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MatchScoreSheet } from './MatchScoreSheet';
import type { RawGameTurn } from '../../features/rating';

describe('MatchScoreSheet & Interactive Replay (Audit 18 / 20)', () => {
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
        expect(screen.getByText('24/20 13/10')).toBeDefined();
    });

    it('affiche le PR comparatif pour le Joueur Blanc et l’IA', () => {
        render(
            <MatchScoreSheet
                turnsHistory={[]}
                matchStats={{ decisionsCount: 5, totalEquityLoss: 0.05, totalErrorRate: 5.0 }}
                matchStatsO={{ decisionsCount: 4, totalEquityLoss: 0.02, totalErrorRate: 2.5 }}
            />,
        );
        expect(screen.getByTestId('scoresheet-pr-x').textContent).toContain('PR X: 5.0');
        expect(screen.getByTestId('scoresheet-pr-o').textContent).toContain('PR IA: 2.5');
    });

    it('permet de naviguer pas-à-pas dans l’historique avec aperçu fantôme (24/18 13/9) et retour instantané au direct', () => {
        const turns: RawGameTurn[] = [
            {
                turnNumber: 1,
                player: 'X',
                dice: [6, 4],
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                moves: [{ from: 24, to: 18 }, { from: 13, to: 9 }],
            },
            {
                turnNumber: 2,
                player: 'O',
                dice: [5, 3],
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                moves: [{ from: 17, to: 22 }, { from: 19, to: 22 }],
            },
        ];

        const { rerender } = render(<MatchScoreSheet turnsHistory={turns} />);

        const sheet = screen.getByTestId('match-score-sheet');
        expect(sheet.getAttribute('data-replay-mode')).toBe('live');

        // Clic sur ◀ (coup précédent) -> entre en mode Replay sur le dernier tour (#2, index 1)
        fireEvent.click(screen.getByTestId('btn-replay-prev'));
        expect(sheet.getAttribute('data-replay-mode')).toBe('replay');
        expect(screen.getByTestId('replay-ghost-preview-banner')).toBeDefined();
        expect(screen.getByTestId('replay-official-notation').textContent).toBe('8/3 6/3');

        // Clic sur ⏮ (premier coup) -> inspecte le tour #1 (24/18 13/9)
        fireEvent.click(screen.getByTestId('btn-replay-first'));
        expect(screen.getByTestId('replay-official-notation').textContent).toBe('24/18 13/9');

        // Retour instantané au direct via le bouton « ↩ Retour au Direct »
        fireEvent.click(screen.getByTestId('btn-replay-live'));
        expect(sheet.getAttribute('data-replay-mode')).toBe('live');

        // Sélection directe d'une ligne puis ajout d'un nouveau tour en direct -> retour auto au direct
        fireEvent.click(screen.getByTestId('scoresheet-turn-0'));
        expect(sheet.getAttribute('data-replay-mode')).toBe('replay');

        const nextTurns: RawGameTurn[] = [
            ...turns,
            {
                turnNumber: 3,
                player: 'X',
                dice: [3, 1],
                boardBefore: new Array(26).fill(0),
                boardAfter: new Array(26).fill(0),
                moves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            },
        ];
        rerender(<MatchScoreSheet turnsHistory={nextTurns} />);
        expect(sheet.getAttribute('data-replay-mode')).toBe('live');
    });
});
