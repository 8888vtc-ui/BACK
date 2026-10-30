import { describe, expect, it } from 'vitest';
import {
    computeCheckerStackVisualSpec,
    computeDragThumbTransform,
    computeFloatingGhostBubbles,
    computeMobileBoardGeometry,
    normalizeInitialDiceOrder,
    resolveMagneticTouchPoint,
    resolveTactileTurnState,
    swapTactileDiceOrder,
    type PointHitboxRect,
} from './mobileHitboxResolver';

describe('mobileHitboxResolver — Géométrie Mobile & Machine à États Tactiles (Rapports #7 & #10)', () => {
    it('résout le paradoxe géométrique sur iPhone 14/15 (390px) en topologie 13.05fr / 13.40fr et 12.65fr', () => {
        // 13.05fr en phase normale (390 - 4px bordures = 386px)
        const normalGeo = computeMobileBoardGeometry({
            boardContainerWidthPx: 386,
            viewportHeightPx: 844,
            isBearingOff: false,
            topology: 'micro_rail_13_05fr',
        });
        expect(normalGeo.totalFractions).toBe(13.4);
        expect(normalGeo.bearOffFractions).toBe(0.35);
        expect(normalGeo.pointWidthPx).toBeCloseTo(28.81, 1);
        expect(normalGeo.checkerDiameterPx).toBeGreaterThanOrEqual(24.5);
        expect(normalGeo.gridTemplateColumns).toBe('repeat(6, 1fr) 1.05fr repeat(6, 1fr) 0.35fr');

        // 13.90fr en phase de sortie (bear-off 0.85fr)
        const bearOffGeo = computeMobileBoardGeometry({
            boardContainerWidthPx: 386,
            viewportHeightPx: 844,
            isBearingOff: true,
            topology: 'micro_rail_13_05fr',
        });
        expect(bearOffGeo.bearOffFractions).toBe(0.85);
        expect(bearOffGeo.gridTemplateColumns).toBe('repeat(6, 1fr) 1.05fr repeat(6, 1fr) 0.85fr');

        // 12.65fr Zero-Margin (Rapport #10 : 390px -> 30.83px par flèche, pion ~28.98px)
        const zeroMarginGeo = computeMobileBoardGeometry({
            boardContainerWidthPx: 390,
            viewportHeightPx: 844,
            topology: 'zero_margin_12_65fr',
        });
        expect(zeroMarginGeo.totalFractions).toBe(12.65);
        expect(zeroMarginGeo.pointWidthPx).toBeCloseTo(30.83, 1);
        expect(zeroMarginGeo.checkerDiameterPx).toBeCloseTo(28.98, 1);
    });

    it('plafonne l’empilement visuel à 5 disques avec pas 18.8% et badge numérique sur le 5e disque', () => {
        expect(computeCheckerStackVisualSpec(0)).toEqual({
            visibleDiscsCount: 0,
            stepRatio: 0,
            fifthDiscBadge: null,
        });
        expect(computeCheckerStackVisualSpec(3)).toEqual({
            visibleDiscsCount: 3,
            stepRatio: 0.82,
            fifthDiscBadge: null,
        });
        expect(computeCheckerStackVisualSpec(5)).toEqual({
            visibleDiscsCount: 5,
            stepRatio: 0.188,
            fifthDiscBadge: null,
        });
        expect(computeCheckerStackVisualSpec(8)).toEqual({
            visibleDiscsCount: 5,
            stepRatio: 0.188,
            fifthDiscBadge: 8,
        });
    });

    it('applique le décalage vertical anti-occlusion (-44px / -48px) et la loupe 1.25x si < 28px', () => {
        expect(computeDragThumbTransform(26.5)).toEqual({ offsetY: -48, scale: 1.25 });
        expect(computeDragThumbTransform(29.5)).toEqual({ offsetY: -44, scale: 1.12 });
    });

    it('ordonne le dé fort à gauche par défaut et permet l’inversion 1-tap', () => {
        expect(normalizeInitialDiceOrder([2, 6])).toEqual([6, 2]);
        expect(normalizeInitialDiceOrder([5, 3])).toEqual([5, 3]);
        expect(swapTactileDiceOrder([6, 2])).toEqual([2, 6]);
    });

    it('pilote les 6 états de la machine à états tactiles sans état fantôme', () => {
        expect(
            resolveTactileTurnState({
                isPlayerTurn: false,
                isAnimating: false,
                isDragging: false,
                selectedSource: null,
                subMovesPlayedCount: 0,
                hasRemainingLegalMoves: true,
            }),
        ).toBe('OPPONENT_OR_ANIMATING');

        expect(
            resolveTactileTurnState({
                isPlayerTurn: true,
                isAnimating: false,
                isDragging: true,
                selectedSource: 6,
                subMovesPlayedCount: 0,
                hasRemainingLegalMoves: true,
            }),
        ).toBe('DRAGGING_ACTIVE');

        expect(
            resolveTactileTurnState({
                isPlayerTurn: true,
                isAnimating: false,
                isDragging: false,
                selectedSource: 13,
                subMovesPlayedCount: 0,
                hasRemainingLegalMoves: true,
            }),
        ).toBe('SOURCE_SELECTED');

        expect(
            resolveTactileTurnState({
                isPlayerTurn: true,
                isAnimating: false,
                isDragging: false,
                selectedSource: null,
                subMovesPlayedCount: 1,
                hasRemainingLegalMoves: true,
            }),
        ).toBe('STEP_1_COMMITTED');

        expect(
            resolveTactileTurnState({
                isPlayerTurn: true,
                isAnimating: false,
                isDragging: false,
                selectedSource: null,
                subMovesPlayedCount: 2,
                hasRemainingLegalMoves: false,
            }),
        ).toBe('TURN_PENDING_CONFIRM');

        expect(
            resolveTactileTurnState({
                isPlayerTurn: true,
                isAnimating: false,
                isDragging: false,
                selectedSource: null,
                subMovesPlayedCount: 0,
                hasRemainingLegalMoves: true,
            }),
        ).toBe('IDLE_TURN_START');
    });

    it('priorise magnétiquement les destinations légales et écarte deux Ghost Checkers adjacents', () => {
        const candidates: PointHitboxRect[] = [
            {
                point: 5,
                isTopRow: false,
                centerX: 100,
                centerY: 300,
                width: 28,
                height: 150,
                isMovableSource: false,
                isLegalDestination: false,
            },
            {
                point: 6,
                isTopRow: false,
                centerX: 128,
                centerY: 300,
                width: 28,
                height: 150,
                isMovableSource: false,
                isLegalDestination: true,
            },
        ];

        // Tap exactement à mi-chemin (X=114) : la flèche 6 (destination légale) gagne par magnétisme
        const resolved = resolveMagneticTouchPoint(114, 300, candidates);
        expect(resolved?.point).toBe(6);
        expect(resolved?.effectiveHitboxWidth).toBeGreaterThanOrEqual(44);

        // Deux Ghost Checkers sur flèches adjacentes (X=100 et X=128) sont écartés à >= 54px
        const bubbles = computeFloatingGhostBubbles(
            [
                { point: 5, isTopRow: false, columnCenterX: 100, stackApexY: 280, dieLabel: '3', isBlotHit: false },
                { point: 6, isTopRow: false, columnCenterX: 128, stackApexY: 280, dieLabel: '2', isBlotHit: true },
            ],
            386,
        );
        expect(bubbles).toHaveLength(2);
        expect(bubbles[1].renderCenterX - bubbles[0].renderCenterX).toBeGreaterThanOrEqual(54);
    });
});

