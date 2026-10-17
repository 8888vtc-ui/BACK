import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MoveTypeStatsCard from './MoveTypeStatsCard';
import type { MoveTypeMetric } from '../../features/analytics/types';

describe('MoveTypeStatsCard', () => {
    it('ne rend rien si les métriques sont vides', () => {
        const html = renderToStaticMarkup(<MoveTypeStatsCard metrics={[]} />);
        expect(html).toBe('');
    });

    it('affiche les cartes pour chaque type de coup avec les taux d’erreur et pourcentages', () => {
        const mockMetrics: MoveTypeMetric[] = [
            {
                type: 'opening',
                label: 'Ouvertures',
                description: 'Jets initiaux',
                icon: '📖',
                decisionsCount: 5,
                errorCount: 0,
                blunderCount: 0,
                totalEquityLoss: 0,
                errorRate: 0,
                masteryPercentage: 100,
            },
            {
                type: 'hit_attack',
                label: 'Frappe & Attaque',
                description: 'Combat de contact',
                icon: '⚔️',
                decisionsCount: 8,
                errorCount: 2,
                blunderCount: 1,
                totalEquityLoss: 0.18,
                errorRate: 0.022,
                masteryPercentage: 87,
            },
        ];

        const html = renderToStaticMarkup(<MoveTypeStatsCard metrics={mockMetrics} />);
        expect(html).toContain('data-testid="move-type-stats-card"');
        expect(html).toContain('data-testid="move-type-card-opening"');
        expect(html).toContain('data-testid="move-type-card-hit_attack"');
        expect(html).toContain('Ouvertures');
        expect(html).toContain('Frappe &amp; Attaque');
        expect(html).toContain('100%');
        expect(html).toContain('87%');
    });
});
