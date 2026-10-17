import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProgressionCurve from './ProgressionCurve';
import type { ProgressionDataPoint } from '../../features/analytics/types';

describe('ProgressionCurve', () => {
    it('affiche un message si aucune donnée n’est présente', () => {
        const html = renderToStaticMarkup(<ProgressionCurve data={[]} />);
        expect(html).toContain('Jouez vos premières parties');
    });

    it('affiche le graphique de progression, les KPI et filtres', () => {
        const mockData: ProgressionDataPoint[] = [
            {
                gameNumber: 1,
                gameId: 'g1',
                date: '2026-10-14T10:00:00Z',
                performanceRating: 8.5,
                movingAveragePR: 8.5,
                errorRate: 0.017,
                estimatedElo: 1708,
                winner: true,
            },
            {
                gameNumber: 2,
                gameId: 'g2',
                date: '2026-10-15T10:00:00Z',
                performanceRating: 6.2,
                movingAveragePR: 7.3,
                errorRate: 0.012,
                estimatedElo: 1827,
                winner: true,
            },
        ];

        const html = renderToStaticMarkup(
            <ProgressionCurve data={mockData} onSelectGame={vi.fn()} />,
        );

        expect(html).toContain('data-testid="progression-curve-container"');
        expect(html).toContain('data-testid="progression-curve-svg"');
        expect(html).toContain('Dernier PR');
        expect(html).toContain('Meilleur PR');
        expect(html).toContain('Elo Actuel');
        expect(html).toContain('Moyenne mobile');
    });
});
