import { describe, it, expect } from 'vitest';
import { computeArrowCoords } from './CoachArrows';

describe('computeArrowCoords', () => {
    it('retourne des coordonnées numériques finies', () => {
        const coords = computeArrowCoords(13, 8);
        expect(Number.isFinite(coords.x1)).toBe(true);
        expect(Number.isFinite(coords.y1)).toBe(true);
        expect(Number.isFinite(coords.x2)).toBe(true);
        expect(Number.isFinite(coords.y2)).toBe(true);
    });

    it('produit des coordonnées différentes pour des points différents', () => {
        const a = computeArrowCoords(13, 8);
        const b = computeArrowCoords(24, 1);
        expect(a.x1).not.toBe(b.x1);
    });

    it('gère les points de la barre (0 et 25)', () => {
        const fromBar = computeArrowCoords(0, 8);
        expect(Number.isFinite(fromBar.x1)).toBe(true);
        const toBar = computeArrowCoords(13, 25);
        expect(Number.isFinite(toBar.x2)).toBe(true);
    });
});
