// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlayerProfileCard, { getPrClassLabel } from './PlayerProfileCard';

describe('PlayerProfileCard', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('calcule correctement les classes et libellés de PR', () => {
        expect(getPrClassLabel(null).label).toBe('Non calibré');
        expect(getPrClassLabel(2.5).label).toBe('Grand Maître');
        expect(getPrClassLabel(4.8).label).toBe('Maître');
        expect(getPrClassLabel(8.0).label).toBe('Avancé');
        expect(getPrClassLabel(14.0).label).toBe('En progression');
    });

    it('affiche le nom du joueur, le rang, l\'ELO et les métriques', () => {
        const onOpenReview = vi.fn();
        render(
            <PlayerProfileCard
                displayName="Alexandre"
                eloRating={1850}
                averagePR={3.4}
                gamesPlayed={20}
                winsCount={14}
                puzzleStreak={5}
                onOpenReview={onOpenReview}
            />,
        );

        expect(screen.getByTestId('player-profile-card')).toBeDefined();
        expect(screen.getByText('Alexandre')).toBeDefined();
        expect(screen.getByText('1850')).toBeDefined();
        expect(screen.getByText('3.40')).toBeDefined();
        expect(screen.getByText('🏆 Maître')).toBeDefined();
        expect(screen.getByText('🔥 Série 5j')).toBeDefined();
        expect(screen.getByText('(70%)')).toBeDefined();

        const reviewBtn = screen.getByTestId('player-profile-review-btn');
        fireEvent.click(reviewBtn);
        expect(onOpenReview).toHaveBeenCalledTimes(1);
    });

    it('gère l\'absence de parties et de streak', () => {
        render(
            <PlayerProfileCard
                displayName={null}
                eloRating={1500}
                averagePR={null}
                gamesPlayed={0}
                winsCount={0}
                puzzleStreak={0}
                onOpenReview={vi.fn()}
            />,
        );

        expect(screen.getByText('Mon Espace Joueur')).toBeDefined();
        expect(screen.getByText('1500')).toBeDefined();
        expect(screen.getByText('—')).toBeDefined();
        expect(screen.getByText('Non calibré')).toBeDefined();
        expect(screen.queryByTestId('player-streak-badge')).toBeNull();
    });
});
