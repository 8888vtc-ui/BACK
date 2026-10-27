import { describe, it, expect } from 'vitest';
import {
    resolveMagneticTouchPoint,
    computeFloatingGhostBubbles,
    MIN_TOUCH_TARGET_PX,
    GHOST_BUBBLE_TARGET_PX,
    type PointHitboxRect,
} from '../mobileHitboxResolver';
import { computeCheckerStackLayout } from '../../components/board/boardGeometry';

describe('mobileHitboxResolver — Loi de Fitts, Magnétisme Voronoï & Ghost Checkers 48×48 px', () => {
    it('garantit une cible effective >= 44×44 px même sur une flèche portrait étroite de 14 px', () => {
        const narrowPoints: PointHitboxRect[] = [
            {
                point: 13,
                isTopRow: true,
                centerX: 20,
                centerY: 120,
                width: 14,
                height: 180,
                isMovableSource: false,
                isLegalDestination: false,
            },
            {
                point: 14,
                isTopRow: true,
                centerX: 34,
                centerY: 120,
                width: 14,
                height: 180,
                isMovableSource: true,
                isLegalDestination: false,
            },
        ];

        // Le pouce tape à x=26 (à 6px du point 13 inerte et 8px du point 14 jouable)
        // Grâce au magnétisme pondéré, le point 14 (source jouable) capture l'intention !
        const resolved = resolveMagneticTouchPoint(26, 125, narrowPoints);
        expect(resolved).not.toBeNull();
        expect(resolved?.point).toBe(14);
        expect(resolved?.effectiveHitboxWidth).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
        expect(resolved?.effectiveHitboxHeight).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
        expect(resolved?.isMagneticSnap).toBe(true);
    });

    it('priorise la destination légale sur une flèche voisine lors du second tap de confirmation', () => {
        const points: PointHitboxRect[] = [
            {
                point: 8,
                isTopRow: false,
                centerX: 180,
                centerY: 420,
                width: 28,
                height: 200,
                isMovableSource: true,
                isLegalDestination: false,
            },
            {
                point: 7,
                isTopRow: false,
                centerX: 208,
                centerY: 420,
                width: 28,
                height: 200,
                isMovableSource: false,
                isLegalDestination: true,
            },
        ];

        // Tap légèrement décalé à gauche du point 7 (x=194, pile à mi-chemin entre 8 et 7)
        const resolved = resolveMagneticTouchPoint(194, 415, points);
        expect(resolved?.point).toBe(7);
    });

    it('retourne null si le contact est hors du rayon magnétique maximal', () => {
        const points: PointHitboxRect[] = [
            {
                point: 24,
                isTopRow: true,
                centerX: 350,
                centerY: 100,
                width: 28,
                height: 180,
                isMovableSource: true,
                isLegalDestination: false,
            },
        ];
        expect(resolveMagneticTouchPoint(50, 100, points)).toBeNull();
    });

    it('positionne 2 bulles Ghost Checkers de 48×48 px au-dessus du doigt et les écarte sans collision', () => {
        const bubbles = computeFloatingGhostBubbles(
            [
                {
                    point: 5,
                    isTopRow: false,
                    columnCenterX: 260,
                    stackApexY: 360,
                    dieLabel: '3',
                    isBlotHit: false,
                },
                {
                    point: 4,
                    isTopRow: false,
                    columnCenterX: 288, // seulement 28px d'écart horizontal !
                    stackApexY: 360,
                    dieLabel: '4',
                    isBlotHit: true,
                },
            ],
            393,
        );

        expect(bubbles).toHaveLength(2);
        expect(bubbles[0]?.widthPx).toBe(GHOST_BUBBLE_TARGET_PX);
        expect(bubbles[0]?.heightPx).toBe(GHOST_BUBBLE_TARGET_PX);
        // Décalé vers le haut (axe médian du plateau) pour sortir de l'occlusion du pouce
        expect(bubbles[0]?.renderCenterY).toBeLessThan(360);
        // Séparation anti-collision >= 54px entre les centres des 2 bulles de 48px
        const separation = (bubbles[1]?.renderCenterX ?? 0) - (bubbles[0]?.renderCenterX ?? 0);
        expect(separation).toBeGreaterThanOrEqual(GHOST_BUBBLE_TARGET_PX);
        expect(bubbles[1]?.isBlotHit).toBe(true);
    });

    it('active le compteur numérique dès 3 / 4 / 5 en mode compactMobile sans déborder', () => {
        const mobileStack3 = computeCheckerStackLayout(3, false, true);
        expect(mobileStack3.isCompressed).toBe(true);
        expect(mobileStack3.badgeCount).toBe(3);
        expect(mobileStack3.badgeText).toBe('3');

        const mobileStack4 = computeCheckerStackLayout(4, true, true);
        expect(mobileStack4.badgeCount).toBe(4);
        expect(mobileStack4.badgeText).toBe('4');

        const mobileStack5 = computeCheckerStackLayout(5, false, true);
        expect(mobileStack5.badgeCount).toBe(5);
        expect(mobileStack5.badgeText).toBe('5');
        expect(mobileStack5.overlapPx).toBeGreaterThan(1);
    });
});
