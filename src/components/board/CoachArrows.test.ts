import { describe, it, expect } from 'vitest';
import { computeArrowCoords, computeCurvedArrowPath } from './CoachArrows';

describe('computeArrowCoords', () => {
    it('retourne des coordonnées numériques finies et un tracé de Bézier', () => {
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

    it('computeCurvedArrowPath génère une courbe quadratique Q', () => {
        const path = computeCurvedArrowPath(100, 200, 300, 200);
        expect(path).toContain('M 100 200');
        expect(path).toContain('Q');
        expect(path).toContain('300 200');
    });
});

