// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MatchScoreSheet } from './MatchScoreSheet';
import type { RawGameTurn } from '../../features/rating';

describe('MatchScoreSheet component', () => {
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
});

