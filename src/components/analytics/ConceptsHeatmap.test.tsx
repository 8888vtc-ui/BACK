import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ConceptsHeatmap from './ConceptsHeatmap';
import type { HeatmapCell } from '../../features/analytics/types';

describe('ConceptsHeatmap', () => {
    it('affiche la matrice 2D avec les concepts et phases de jeu', () => {
        const mockCells: HeatmapCell[] = [
            {
                conceptId: 'blot_safety',
                conceptName: 'Minimisation des tirs & Sécurité des blots',
                category: 'Sécurité & Blots',
                phase: 'middle_game',
                phaseLabel: 'Milieu de jeu',
                errorCount: 3,
                blunderCount: 1,
                totalEquityLoss: 0.18,
                intensity: 0.8,
            },
        ];

        const html = renderToStaticMarkup(<ConceptsHeatmap cells={mockCells} />);
        expect(html).toContain('data-testid="concepts-heatmap"');
        expect(html).toContain('Blunder Heatmap — Phases × Thèmes Tactiques');
        expect(html).toContain('Ouverture');
        expect(html).toContain('Milieu de jeu');
        expect(html).toContain('Sortie / Course');
        expect(html).toContain('Minimisation des tirs &amp; Sécurité des blots');
    });
});
