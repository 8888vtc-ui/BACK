/**
 * Résolveur géométrique de Hitboxes Tactiles Magnétiques (Loi de Fitts / WCAG 2.5.5)
 * et positionnement anti-occlusion des Ghost Checkers (48×48 px).
 *
 * Module 100 % PUR : 0 `any`, 0 dépendance React, testable isolément sous Vitest.
 */

export const MIN_TOUCH_TARGET_PX = 44;
export const GHOST_BUBBLE_TARGET_PX = 48;
export const MAGNETIC_SNAP_RADIUS_PX = 36;

export interface PointHitboxRect {
    readonly point: number;
    readonly isTopRow: boolean;
    readonly centerX: number;
    readonly centerY: number;
    readonly width: number;
    readonly height: number;
    /** Indique si la flèche est une source jouable au tour courant. */
    readonly isMovableSource: boolean;
    /** Indique si la flèche est une destination légale du pion sélectionné. */
    readonly isLegalDestination: boolean;
}

export interface ResolvedTouchTarget {
    readonly point: number;
    readonly effectiveHitboxWidth: number;
    readonly effectiveHitboxHeight: number;
    readonly distancePx: number;
    readonly isMagneticSnap: boolean;
}

export interface FloatingGhostTargetInput {
    readonly point: number;
    readonly isTopRow: boolean;
    readonly columnCenterX: number;
    readonly stackApexY: number;
    readonly dieLabel: string;
    readonly isBlotHit: boolean;
}

export interface FloatingGhostBubbleLayout {
    readonly point: number;
    readonly dieLabel: string;
    readonly isBlotHit: boolean;
    readonly widthPx: number;
    readonly heightPx: number;
    /** Coordonnée X corrigée anti-collision (séparation minimale de 54px entre 2 bulles voisines). */
    readonly renderCenterX: number;
    /** Coordonnée Y décalée au-dessus du doigt (vers l'axe médian du plateau). */
    readonly renderCenterY: number;
}

/**
 * Garantit une hitbox effective ≥ 44×44 px sur petit écran (ex: flèche de 14px à 29px)
 * en appliquant un magnétisme barycentrique pondéré vers les flèches actives (sources ou cibles).
 */
export function resolveMagneticTouchPoint(
    touchX: number,
    touchY: number,
    candidates: ReadonlyArray<PointHitboxRect>,
    snapRadiusPx: number = MAGNETIC_SNAP_RADIUS_PX,
): ResolvedTouchTarget | null {
    if (candidates.length === 0) return null;

    let bestCandidate: PointHitboxRect | null = null;
    let bestWeightedDist = Number.POSITIVE_INFINITY;
    let bestRawDist = Number.POSITIVE_INFINITY;

    for (const rect of candidates) {
        const dy = Math.abs(touchY - rect.centerY);
        const halfHeightWithMargin = Math.max(rect.height / 2, MIN_TOUCH_TARGET_PX / 2) + 22;
        if (dy > halfHeightWithMargin) continue;

        const dx = Math.abs(touchX - rect.centerX);
        const rawDist = Math.hypot(dx, dy * 0.35);

        // Pondération d'attraction magnétique :
        // - Destination légale d'un pion sélectionné : priorité maximale (poids 0.45)
        // - Source jouable : haute priorité (poids 0.60)
        // - Flèche inerte : poids 1.25 (ne vole jamais un tap destiné à une flèche voisine jouable)
        const weight = rect.isLegalDestination
            ? 0.45
            : rect.isMovableSource
              ? 0.60
              : 1.25;

        const weightedDist = rawDist * weight;

        if (weightedDist < bestWeightedDist) {
            bestWeightedDist = weightedDist;
            bestRawDist = rawDist;
            bestCandidate = rect;
        }
    }

    if (!bestCandidate || bestRawDist > snapRadiusPx) {
        return null;
    }

    return {
        point: bestCandidate.point,
        effectiveHitboxWidth: Math.max(bestCandidate.width, MIN_TOUCH_TARGET_PX),
        effectiveHitboxHeight: Math.max(bestCandidate.height, MIN_TOUCH_TARGET_PX),
        distancePx: bestRawDist,
        isMagneticSnap: bestRawDist > bestCandidate.width / 2,
    };
}

/**
 * Calcule la position des bulles cibles flottantes géantes (Ghost Checkers 48×48 px)
 * lorsque 2 destinations sont possibles (ex: dé 3 et dé 5 sur flèches adjacentes).
 * Écarte automatiquement deux bulles voisines pour éviter tout chevauchement de hitboxes.
 */
export function computeFloatingGhostBubbles(
    targets: ReadonlyArray<FloatingGhostTargetInput>,
    boardWidthPx: number,
): FloatingGhostBubbleLayout[] {
    if (targets.length === 0) return [];
    const safeBoardWidth = Math.max(240, boardWidthPx);
    const VERTICAL_OFFSET_FROM_FINGER_PX = 30;
    const MIN_CENTER_SEPARATION_PX = GHOST_BUBBLE_TARGET_PX + 6; // 54px

    const sorted = [...targets].sort((a, b) => a.columnCenterX - b.columnCenterX);
    const layouts: FloatingGhostBubbleLayout[] = sorted.map((t) => {
        const halfBubble = GHOST_BUBBLE_TARGET_PX / 2;
        const clampedX = Math.min(
            safeBoardWidth - halfBubble - 4,
            Math.max(halfBubble + 4, t.columnCenterX),
        );
        const offsetY = t.isTopRow
            ? t.stackApexY + VERTICAL_OFFSET_FROM_FINGER_PX
            : t.stackApexY - VERTICAL_OFFSET_FROM_FINGER_PX;

        return {
            point: t.point,
            dieLabel: t.dieLabel,
            isBlotHit: t.isBlotHit,
            widthPx: GHOST_BUBBLE_TARGET_PX,
            heightPx: GHOST_BUBBLE_TARGET_PX,
            renderCenterX: clampedX,
            renderCenterY: offsetY,
        };
    });

    // Répulsion élastique 1D si 2 bulles cibles sont sur des flèches proches du même demi-plateau
    for (let i = 0; i < layouts.length - 1; i++) {
        const left = layouts[i];
        const right = layouts[i + 1];
        if (left && right && Math.abs(left.renderCenterY - right.renderCenterY) < 40) {
            const gap = right.renderCenterX - left.renderCenterX;
            if (gap < MIN_CENTER_SEPARATION_PX) {
                const push = (MIN_CENTER_SEPARATION_PX - gap) / 2;
                layouts[i] = { ...left, renderCenterX: Math.max(26, left.renderCenterX - push) };
                layouts[i + 1] = {
                    ...right,
                    renderCenterX: Math.min(safeBoardWidth - 26, right.renderCenterX + push),
                };
            }
        }
    }

    return layouts;
}
