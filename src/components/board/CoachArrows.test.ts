// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
    CoachArrows,
    OPPONENT_ARROW_CURVATURE_PX,
    OPPONENT_ARROW_STROKE,
    OPPONENT_ARROW_STROKE_WIDTH,
    OPPONENT_ORIGIN_RADIUS,
    computeArrowCoords,
    computeCurvedArrowPath,
} from './CoachArrows';

describe('CoachArrows & Last Move Persistence (Chantier 3)', () => {
    it('retourne des coordonnées numériques finies et un tracé de Bézier quadratique de courbure 28 px', () => {
        expect(OPPONENT_ARROW_CURVATURE_PX).toBe(28);
        expect(OPPONENT_ARROW_STROKE).toBe('rgba(148, 163, 184, 0.52)');
        expect(OPPONENT_ARROW_STROKE_WIDTH).toBe(2.25);
        expect(OPPONENT_ORIGIN_RADIUS).toBe(3.5);

        const coords = computeArrowCoords(13, 8);
        expect(Number.isFinite(coords.x1)).toBe(true);
        expect(Number.isFinite(coords.y1)).toBe(true);
        expect(Number.isFinite(coords.x2)).toBe(true);
        expect(Number.isFinite(coords.y2)).toBe(true);
        expect(coords.path).toMatch(/^M \d+.*Q \d+.* \d+/);
    });

    it('produit des coordonnées différentes pour des points différents', () => {
        const a = computeArrowCoords(13, 8);
        const b = computeArrowCoords(24, 1);
        expect(a.x1).not.toBe(b.x1);
        expect(a.path).not.toBe(b.path);
    });

    it('gère les points de la barre (0 et 25)', () => {
        const fromBar = computeArrowCoords(0, 8);
        expect(Number.isFinite(fromBar.x1)).toBe(true);
        const toBar = computeArrowCoords(13, 25);
        expect(Number.isFinite(toBar.x2)).toBe(true);
    });

    it('computeCurvedArrowPath génère une courbe quadratique Q avec flèche de 28 px', () => {
        const path = computeCurvedArrowPath(100, 200, 300, 200);
        expect(path).toBe('M 100 200 Q 200 228 300 200');
    });

    it('affiche les sous-coups adverses en gris ardoise 2.25px, origine r=3.5 et croix rouge ✕ sur frappe de blot', () => {
        const { getByTestId, queryByTestId } = render(
            React.createElement(CoachArrows, {
                opponent: [
                    { from: 1, to: 7, isHit: false },
                    { from: 12, to: 16, isHit: true },
                ],
            }),
        );

        const path0 = getByTestId('opponent-arrow-path-0');
        expect(path0.getAttribute('stroke')).toBe('rgba(148, 163, 184, 0.52)');
        expect(path0.getAttribute('stroke-width')).toBe('2.25');

        const origin0 = getByTestId('opponent-arrow-origin-0');
        expect(origin0.getAttribute('r')).toBe('3.5');

        expect(queryByTestId('opponent-hit-cross-0')).toBeNull();
        const cross1 = getByTestId('opponent-hit-cross-1');
        expect(cross1.textContent).toBe('✕');
    });
});
