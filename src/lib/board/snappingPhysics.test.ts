import { describe, it, expect } from 'vitest';
import {
    MIN_HITBOX_SIZE,
    calculateEuclideanDistance,
    ensureMinimumHitbox,
    computeAdaptiveSnapRadius,
    isPointInsideRect,
    findNearestLegalTarget,
    type PointRect,
} from './snappingPhysics';

describe('snappingPhysics', () => {
    it('calcule la distance euclidienne exacte', () => {
        expect(calculateEuclideanDistance(0, 0, 3, 4)).toBe(5);
        expect(calculateEuclideanDistance(10, 20, 10, 20)).toBe(0);
    });

    it('garantit une hitbox invisible minimale d’au moins 44×44 px centrée sur la flèche', () => {
        const narrowMobileRect: PointRect = {
            pointNumber: 3,
            left: 90,
            top: 90,
            right: 116, // largeur 26px (< 44px)
            bottom: 120, // hauteur 30px (< 44px)
            centerX: 103,
            centerY: 105,
        };

        const expanded = ensureMinimumHitbox(narrowMobileRect);
        expect(expanded.right - expanded.left).toBeGreaterThanOrEqual(MIN_HITBOX_SIZE);
        expect(expanded.bottom - expanded.top).toBeGreaterThanOrEqual(MIN_HITBOX_SIZE);
        expect(expanded.left).toBe(103 - 22);
        expect(expanded.right).toBe(103 + 22);
        expect(expanded.top).toBe(105 - 22);
        expect(expanded.bottom).toBe(105 + 22);
    });

    it('calcule un rayon d’attraction magnétique adaptatif selon la taille de flèche et la proximité des voisins', () => {
        const standardIsolated: PointRect = {
            pointNumber: 5,
            left: 100,
            top: 0,
            right: 150, // largeur 50px
            bottom: 200,
            centerX: 125,
            centerY: 100,
        };
        const wideDesktopIsolated: PointRect = {
            pointNumber: 8,
            left: 200,
            top: 0,
            right: 280, // largeur 80px
            bottom: 260,
            centerX: 240,
            centerY: 130,
        };
        const contiguousNeighbor: PointRect = {
            pointNumber: 6,
            left: 152,
            top: 0,
            right: 202,
            bottom: 200,
            centerX: 177, // distance 52px à standardIsolated
            centerY: 100,
        };

        const rIsolated = computeAdaptiveSnapRadius(standardIsolated, [standardIsolated]);
        const rWide = computeAdaptiveSnapRadius(wideDesktopIsolated, [wideDesktopIsolated]);
        const rContiguous = computeAdaptiveSnapRadius(standardIsolated, [
            standardIsolated,
            contiguousNeighbor,
        ]);

        expect(rIsolated).toBe(90);
        expect(rWide).toBeGreaterThan(rIsolated);
        expect(rContiguous).toBeLessThan(rIsolated);
        expect(rContiguous).toBeGreaterThanOrEqual(MIN_HITBOX_SIZE);
    });

    it('détecte si un point est à l’intérieur d’un rectangle', () => {
        const rect: PointRect = {
            pointNumber: 5,
            left: 100,
            top: 50,
            right: 200,
            bottom: 300,
            centerX: 150,
            centerY: 175,
        };

        expect(isPointInsideRect(150, 100, rect)).toBe(true);
        expect(isPointInsideRect(100, 50, rect)).toBe(true);
        expect(isPointInsideRect(200, 300, rect)).toBe(true);
        expect(isPointInsideRect(99, 100, rect)).toBe(false);
        expect(isPointInsideRect(201, 100, rect)).toBe(false);
    });

    it('priorise un impact direct dans la hitbox', () => {
        const rect1: PointRect = {
            pointNumber: 1,
            left: 0,
            top: 0,
            right: 50,
            bottom: 100,
            centerX: 25,
            centerY: 50,
        };
        const rect2: PointRect = {
            pointNumber: 2,
            left: 60,
            top: 0,
            right: 110,
            bottom: 100,
            centerX: 85,
            centerY: 50,
        };

        const res = findNearestLegalTarget(20, 20, [rect1, rect2]);
        expect(res.targetPoint).toBe(1);
        expect(res.isDirectHit).toBe(true);
    });

    it('aimante vers le point le plus proche si dans le rayon maxSnapDistance', () => {
        const rect: PointRect = {
            pointNumber: 7,
            left: 100,
            top: 100,
            right: 150,
            bottom: 300,
            centerX: 125,
            centerY: 200,
        };

        // Pointeur à 30px au-dessus du centre
        const res = findNearestLegalTarget(125, 170, [rect], null, {
            maxSnapDistance: 90,
            hysteresisMargin: 18,
            dragThreshold: 6,
        });

        expect(res.targetPoint).toBe(7);
        expect(res.distance).toBe(30);
    });

    it('n’aimante pas si au-delà du rayon maxSnapDistance', () => {
        const rect: PointRect = {
            pointNumber: 7,
            left: 100,
            top: 100,
            right: 150,
            bottom: 300,
            centerX: 125,
            centerY: 200,
        };

        const res = findNearestLegalTarget(125, 400, [rect], null, {
            maxSnapDistance: 90,
            hysteresisMargin: 18,
            dragThreshold: 6,
        });

        expect(res.targetPoint).toBe(null);
    });

    it('applique l’hystérésis pour éviter le scintillement entre flèches contiguës (même sur la frontière)', () => {
        const rect1: PointRect = {
            pointNumber: 1,
            left: 0,
            top: 0,
            right: 40,
            bottom: 200,
            centerX: 20,
            centerY: 100,
        };
        const rect2: PointRect = {
            pointNumber: 2,
            left: 50,
            top: 0,
            right: 90,
            bottom: 200,
            centerX: 70,
            centerY: 100,
        };

        // Pointeur au milieu (x=46, y=100) : dist à rect1=26, dist à rect2=24.
        // Normalement rect2 gagne (24 < 26).
        // Mais si rect1 est déjà sélectionné avec une marge d'hystérésis de 18 :
        // dist rect1 effective = 26 - 18 = 8 < 24 -> rect1 reste sélectionné sans scintillement !
        const res = findNearestLegalTarget(46, 100, [rect1, rect2], 1, {
            maxSnapDistance: 90,
            hysteresisMargin: 18,
            dragThreshold: 6,
        });

        expect(res.targetPoint).toBe(1);

        // Quand le pointeur franchit franchement vers le centre de rect2 (x=66, y=100), la bascule s'opère proprement
        const switched = findNearestLegalTarget(66, 100, [rect1, rect2], 1, {
            maxSnapDistance: 90,
            hysteresisMargin: 18,
            dragThreshold: 6,
        });
        expect(switched.targetPoint).toBe(2);
    });
});
