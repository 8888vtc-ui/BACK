import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PRHistoryChart from './PRHistoryChart';
import type { RatingHistoryPoint } from '../../features/rating/types';

describe('PRHistoryChart Component', () => {
    it('affiche un message quand l’historique est vide', () => {
        const html = renderToStaticMarkup(<PRHistoryChart history={[]} />);
        expect(html).toContain('Aucune partie analysée');
    });

    it('affiche le graphique SVG et les points de PR', () => {
        const mockHistory: RatingHistoryPoint[] = [
            {
                id: 'h1',
                gameId: 'g1',
                date: '2026-10-10T12:00:00.000Z',
                performanceRating: 8.5,
                estimatedRating: 1708,
                prCategory: 'Avancé',
                winner: 'X',
                isPlayerWinner: true,
                movesCount: 15,
                errorRate: 0.017,
            },
            {
                id: 'h2',
                gameId: 'g2',
                date: '2026-10-12T12:00:00.000Z',
                performanceRating: 5.2,
                estimatedRating: 1880,
                prCategory: 'Expert',
                winner: 'X',
                isPlayerWinner: true,
                movesCount: 18,
                errorRate: 0.0104,
            },
        ];

        const html = renderToStaticMarkup(<PRHistoryChart history={mockHistory} />);

        expect(html).toContain('Évolution du Performance Rating (PR)');
        expect(html).toContain('data-testid="pr-history-svg"');
        expect(html).toContain('8.5');
        expect(html).toContain('5.2');
        expect(html).toContain('PR Moyen :');
    });
});
