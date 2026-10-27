import {
    isPointInsideRect,
    type PointRect,
} from '../../lib/board/snappingPhysics';
import { toPointerKind } from '../../lib/gameFeel/pointerGestureMachine';

/** Seuil de déclenchement du drag à la souris / trackpad (5 px). */
export const MOUSE_DRAG_THRESHOLD_PX = 5;
/** Seuil de déclenchement du drag au stylet (6 px). */
export const PEN_DRAG_THRESHOLD_PX = 6;
/** Seuil de déclenchement du drag sur écran tactile (12 px). */
export const TOUCH_DRAG_THRESHOLD_PX = 12;
/** Durée maximale d'un tap franc (220 ms). */
export const TAP_MAX_DURATION_MS = 220;
/** Rayon d'attraction magnétique autour de l'axe de la flèche légale (36 px). */
export const SNAP_RADIUS_PX = 36;
/** Hystérésis de décrochage une fois la flèche accrochée (44 px). */
export const SNAP_HYSTERESIS_PX = 44;
/** Durée du retour élastique lors d'un lâcher hors-zone (ms). */
export const ELASTIC_RETURN_DURATION_MS = 150;
/** Courbe d'accélération du retour élastique hors-zone. */
export const ELASTIC_RETURN_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
/** Force d'attraction magnétique visuelle vers le centre de la flèche aimantée (0..1). */
export const MAGNETIC_ATTRACTION_STRENGTH = 0.26;

export function getBiomechanicalDragThresholdPx(pointerType?: string | null): number {
    const kind = toPointerKind(pointerType);
    if (kind === 'touch') {
        if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)')?.matches) {
            return 24;
        }
        return TOUCH_DRAG_THRESHOLD_PX;
    }
    if (kind === 'pen') return PEN_DRAG_THRESHOLD_PX;
    return MOUSE_DRAG_THRESHOLD_PX;
}

export interface MagneticSnapEval {
    readonly targetPoint: number | null;
    readonly isDirectHit: boolean;
    readonly axisDistance: number;
    readonly snapCenter: { readonly x: number; readonly y: number } | null;
}

/**
 * Évalue le magnétisme autour de l'axe de chaque flèche légale avec hystérésis :
 * - Accrochage initial si distance à l'axe <= `snapRadiusPx` (36 px)
 * - Maintien de la cible accrochée tant que distance à l'axe <= `hysteresisPx` (44 px)
 */
export function resolveMagneticTarget(
    pointerX: number,
    pointerY: number,
    legalRects: ReadonlyArray<PointRect>,
    currentSnappedPoint: number | null,
    snapRadiusPx: number = SNAP_RADIUS_PX,
    hysteresisPx: number = SNAP_HYSTERESIS_PX,
): MagneticSnapEval {
    if (legalRects.length === 0) {
        return { targetPoint: null, isDirectHit: false, axisDistance: Infinity, snapCenter: null };
    }

    const hysteresisBonus = Math.max(0, hysteresisPx - snapRadiusPx);
    let bestRect: PointRect | null = null;
    let bestEffectiveDist = Infinity;
    let bestRawDist = Infinity;
    let bestDirect = false;

    for (const rect of legalRects) {
        const clampedY = Math.min(rect.bottom, Math.max(rect.top, pointerY));
        const axisDist = Math.hypot(pointerX - rect.centerX, pointerY - clampedY);
        const direct = isPointInsideRect(pointerX, pointerY, rect);
        const isCurrent = currentSnappedPoint === rect.pointNumber;
        const maxAllowed = isCurrent ? hysteresisPx : snapRadiusPx;

        if (axisDist <= maxAllowed || direct) {
            const effectiveDist = isCurrent ? Math.max(0, axisDist - hysteresisBonus) : axisDist;
            if (effectiveDist < bestEffectiveDist) {
                bestEffectiveDist = effectiveDist;
                bestRawDist = axisDist;
                bestRect = rect;
                bestDirect = direct;
            }
        }
    }

    if (!bestRect) {
        return { targetPoint: null, isDirectHit: false, axisDistance: Infinity, snapCenter: null };
    }

    return {
        targetPoint: bestRect.pointNumber,
        isDirectHit: bestDirect,
        axisDistance: bestRawDist,
        snapCenter: { x: bestRect.centerX, y: bestRect.centerY },
    };
}
