// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RecentMatchesSummary from './RecentMatchesSummary';
import type { RecentMatchEntry } from '../../features/progression/userProgressionService';

describe('RecentMatchesSummary', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    const mockMatches: RecentMatchEntry[] = [
        {
            id: 'match-1',
            dateIso: '2026-10-22T20:00:00.000Z',
            relativeDate: 'Hier',
            opponentLabel: 'IA Monte-Carlo (Expert)',
            scoreX: 7,
            scoreO: 3,
            matchLength: 7,
            isVictory: true,
            pr: 3.8,
        },
        {
            id: 'match-2',
            dateIso: '2026-10-22T21:00:00.000Z',
            relativeDate: 'Hier',
            opponentLabel: 'Adversaire En Ligne',
            scoreX: 4,
            scoreO: 5,
            matchLength: 5,
            isVictory: false,
            pr: null,
        },
    ];

    it('ne rend rien si la liste des matchs est vide', () => {
        const { container } = render(
            <RecentMatchesSummary matches={[]} onReviewMatch={vi.fn()} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('affiche les cartes de matchs avec leurs statuts et scores', () => {
        const onReviewMatch = vi.fn();
        render(
            <RecentMatchesSummary matches={mockMatches} onReviewMatch={onReviewMatch} />,
        );

        expect(screen.getByTestId('recent-matches-summary')).toBeDefined();
        expect(screen.getByText('Historique Récent (2)')).toBeDefined();

        expect(screen.getByText('Victoire')).toBeDefined();
        expect(screen.getByText('Défaite')).toBeDefined();
        expect(screen.getByText('7 – 3')).toBeDefined();
        expect(screen.getByText('4 – 5')).toBeDefined();
        expect(screen.getByText('PR 3.8')).toBeDefined();

        // Clic sur revoir un match spécifique
        const reviewBtn = screen.getByTestId('review-match-btn-match-1');
        fireEvent.click(reviewBtn);
        expect(onReviewMatch).toHaveBeenCalledWith('match-1');

        // Clic sur voir toutes les analyses
        const viewAllBtn = screen.getByTestId('recent-matches-view-all-btn');
        fireEvent.click(viewAllBtn);
        expect(onReviewMatch).toHaveBeenCalledWith();
    });
});
