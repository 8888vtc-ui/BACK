// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
    CoachCandidatesTable,
    computeLossGauge,
    lossClass,
    type CandidateRow,
} from './CoachCandidatesTable';

describe('CoachCandidatesTable', () => {
    afterEach(() => {
        cleanup();
    });

    const mockCandidates: CandidateRow[] = [
        {
            rank: 1,
            notation: '24/18 13/8',
            equity: 0.35,
            equityLoss: 0,
            winProbability: 0.58,
            gammonProbability: 0.16,
            backgammonProbability: 0.01,
        },
        {
            rank: 2,
            notation: '24/13',
            equity: 0.28,
            equityLoss: -0.07,
            winProbability: 0.55,
            gammonProbability: 0.14,
            backgammonProbability: 0.01,
        },
    ];

    it('affiche la liste des coups candidats avec le trophée sur le meilleur coup', () => {
        render(
            <CoachCandidatesTable
                candidates={mockCandidates}
                playedMove="24/13"
                onCandidateHover={vi.fn()}
            />,
        );

        expect(screen.getByText('🏆')).toBeDefined();
        expect(screen.getByText('24/18 13/8')).toBeDefined();
        expect(screen.getByText('24/13')).toBeDefined();
        expect(screen.getByText('joué')).toBeDefined();
    });

    it('déclenche onCandidateHover au survol et à la sortie', () => {
        const onCandidateHover = vi.fn();
        render(
            <CoachCandidatesTable
                candidates={mockCandidates}
                onCandidateHover={onCandidateHover}
            />,
        );

        const row1 = screen.getByTestId('coach-candidate-row-1');
        fireEvent.mouseEnter(row1);
        expect(onCandidateHover).toHaveBeenCalledWith('24/18 13/8');

        fireEvent.mouseLeave(row1);
        expect(onCandidateHover).toHaveBeenCalledWith(null);
    });

    it('calcule la jauge visuelle et les classes de couleur correctement', () => {
        const optimal = computeLossGauge(0);
        expect(optimal.widthPct).toBe(100);
        expect(optimal.barColor).toBe('bg-emerald-400');

        const blunder = computeLossGauge(-0.15);
        expect(blunder.widthPct).toBeLessThan(60);
        expect(blunder.barColor).toBe('bg-rose-500');

        expect(lossClass(-0.005)).toContain('emerald');
        expect(lossClass(-0.015)).toContain('cyan');
        expect(lossClass(-0.05)).toContain('amber');
        expect(lossClass(-0.12)).toContain('rose');
    });
});
