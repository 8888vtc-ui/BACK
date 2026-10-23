/**
 * Moteur de calcul géométrique et physique de magnétisme (Snapping Physics)
 * pour le Drag-and-Drop des pions (normes Backgammon Galaxy / eXtreme Gammon).
 *
 * Fonctionnalités :
 *   - Distance euclidienne 2D exacte avec hystérésis anti-scintillement (y compris
 *     aux frontières entre 2 flèches contiguës).
 *   - Hitbox invisible minimale garantie d'au moins 44×44 px par flèche (`MIN_HITBOX_SIZE`).
 *   - Rayon d'attraction magnétique adaptatif (`computeAdaptiveSnapRadius`) selon
 *     la géométrie de la flèche et la proximité des cibles voisines.
 *   - Fonction PURE : aucun effet de bord, calculs géométriques déterministes (0 `any`).
 */

/** Taille minimale réglementaire d'une hitbox tactile par flèche (44×44 px). */
export const MIN_HITBOX_SIZE = 44;

/** Largeur de référence standard d'une flèche pour le calibrage du rayon adaptatif (px). */
const REFERENCE_POINT_WIDTH = 50;

export interface PointRect {
    pointNumber: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
}

export interface SnappingConfig {
    /** Rayon d'attraction magnétique de référence en pixels (défaut : 90px). */
    maxSnapDistance: number;
    /** Marge d'hystérésis (px) évitant le scintillement entre deux flèches contiguës (défaut : 18px). */
    hysteresisMargin: number;
    /** Seuil minimal de déplacement (px) pour différencier un clic d'un glissement (défaut : 6px). */
    dragThreshold: number;
    /** Dimension minimale (px) de la hitbox invisible par flèche (défaut : 44px). */
    minHitboxSize?: number;
}

export const DEFAULT_SNAPPING_CONFIG: SnappingConfig = {
    maxSnapDistance: 90,
    hysteresisMargin: 18,
    dragThreshold: 6,
    minHitboxSize: MIN_HITBOX_SIZE,
};

export interface SnapResult {
    /** Numéro de la flèche aimantée (ou null si hors de portée légale). */
    targetPoint: number | null;
    /** Distance euclidienne minimale calculée (px). */
    distance: number;
    /** Vrai si le pointeur est directement à l'intérieur de la hitbox de la flèche. */
    isDirectHit: boolean;
    /** Rayon d'attraction magnétique adaptatif effectivement appliqué (px). */
    adaptiveRadius?: number;
    /** Centre géométrique de la flèche aimantée (ou null si aucune cible). */
    snapCenter?: { x: number; y: number } | null;
}

/**
 * Calcule la distance euclidienne entre deux coordonnées 2D.
 */
export function calculateEuclideanDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Garantit qu'un rectangle de flèche possède une hitbox d'au moins `minSize × minSize` (44×44 px)
 * centrée sur `(centerX, centerY)`.
 */
export function ensureMinimumHitbox(
    rect: PointRect,
    minSize: number = MIN_HITBOX_SIZE,
): PointRect {
    const rawWidth = Math.max(0, rect.right - rect.left);
    const rawHeight = Math.max(0, rect.bottom - rect.top);
    const width = Math.max(minSize, rawWidth);
    const height = Math.max(minSize, rawHeight);

    const left = rawWidth < minSize ? rect.centerX - width / 2 : rect.left;
    const right = rawWidth < minSize ? rect.centerX + width / 2 : rect.right;
    const top = rawHeight < minSize ? rect.centerY - height / 2 : rect.top;
    const bottom = rawHeight < minSize ? rect.centerY + height / 2 : rect.bottom;

    return {
        pointNumber: rect.pointNumber,
        left,
        top,
        right,
        bottom,
        centerX: rect.centerX,
        centerY: rect.centerY,
    };
}

/**
 * Détermine si un point (x, y) est contenu dans un rectangle englobant.
 */
export function isPointInsideRect(
    x: number,
    y: number,
    rect: PointRect,
): boolean {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}

/**
 * Calcule le rayon d'attraction magnétique adaptatif d'une flèche cible en fonction :
 * 1. De la largeur effective de sa hitbox (mise à l'échelle mobile vs grand écran).
 * 2. De la distance au plus proche voisin légal (resserrement automatique si 2 flèches
 *    cibles sont contiguës pour éviter le chevauchement magnétique excessif).
 */
export function computeAdaptiveSnapRadius(
    rect: PointRect,
    legalTargetRects: ReadonlyArray<PointRect>,
    config: SnappingConfig = DEFAULT_SNAPPING_CONFIG,
): number {
    const minSize = config.minHitboxSize ?? MIN_HITBOX_SIZE;
    const effective = ensureMinimumHitbox(rect, minSize);
    const width = effective.right - effective.left;

    // Facteur d'échelle géométrique basé sur la largeur de la flèche (borné entre 0.75 et 1.5)
    const widthScale = Math.min(1.5, Math.max(0.75, width / REFERENCE_POINT_WIDTH));

    // Recherche de la cible légale voisine la plus proche
    let minNeighborDist = Infinity;
    for (const other of legalTargetRects) {
        if (other.pointNumber === rect.pointNumber) continue;
        const d = calculateEuclideanDistance(rect.centerX, rect.centerY, other.centerX, other.centerY);
        if (d < minNeighborDist) {
            minNeighborDist = d;
        }
    }

    const neighborFactor =
        minNeighborDist < config.maxSnapDistance
            ? Math.max(0.65, minNeighborDist / config.maxSnapDistance)
            : 1.0;

    return Math.max(minSize, Math.round(config.maxSnapDistance * widthScale * neighborFactor));
}

/**
 * Trouve la cible légale la plus appropriée sous le curseur avec :
 * - Hitbox minimale garantie de 44×44 px par flèche
 * - Distance euclidienne 2D et hystérésis anti-scintillement entre flèches contiguës
 * - Rayon d'attraction magnétique adaptatif
 */
export function findNearestLegalTarget(
    pointerX: number,
    pointerY: number,
    legalTargetRects: ReadonlyArray<PointRect>,
    currentSnappedPoint: number | null = null,
    config: SnappingConfig = DEFAULT_SNAPPING_CONFIG,
): SnapResult {
    if (legalTargetRects.length === 0) {
        return {
            targetPoint: null,
            distance: Infinity,
            isDirectHit: false,
            adaptiveRadius: 0,
            snapCenter: null,
        };
    }

    const minSize = config.minHitboxSize ?? MIN_HITBOX_SIZE;
    const expandedRects = legalTargetRects.map((r) => ensureMinimumHitbox(r, minSize));

    interface EvaluatedCandidate {
        rect: PointRect;
        rawDistance: number;
        effectiveDistance: number;
        isDirectHit: boolean;
        adaptiveRadius: number;
    }

    const candidates: EvaluatedCandidate[] = expandedRects.map((rect) => {
        const rawDistance = calculateEuclideanDistance(pointerX, pointerY, rect.centerX, rect.centerY);
        const effectiveDistance =
            currentSnappedPoint === rect.pointNumber
                ? Math.max(0, rawDistance - config.hysteresisMargin)
                : rawDistance;
        const isDirectHit = isPointInsideRect(pointerX, pointerY, rect);
        const adaptiveRadius = computeAdaptiveSnapRadius(rect, expandedRects, config);

        return {
            rect,
            rawDistance,
            effectiveDistance,
            isDirectHit,
            adaptiveRadius,
        };
    });

    // 1. Sélection par distance euclidienne pondérée par l'hystérésis parmi les impacts directs,
    //    tout en permettant au point déjà aimanté (`currentSnappedPoint`) de résister au scintillement
    //    sur la frontière exacte entre deux flèches contiguës.
    const currentCandidate =
        currentSnappedPoint !== null
            ? candidates.find((c) => c.rect.pointNumber === currentSnappedPoint) ?? null
            : null;

    const directHits = candidates.filter((c) => c.isDirectHit);
    if (directHits.length > 0) {
        directHits.sort((a, b) => a.effectiveDistance - b.effectiveDistance);
        const bestDirect = directHits[0];

        if (
            currentCandidate &&
            currentCandidate.effectiveDistance <= currentCandidate.adaptiveRadius &&
            currentCandidate.effectiveDistance < bestDirect.effectiveDistance
        ) {
            return {
                targetPoint: currentCandidate.rect.pointNumber,
                distance: currentCandidate.effectiveDistance,
                isDirectHit: currentCandidate.isDirectHit,
                adaptiveRadius: currentCandidate.adaptiveRadius,
                snapCenter: { x: currentCandidate.rect.centerX, y: currentCandidate.rect.centerY },
            };
        }

        return {
            targetPoint: bestDirect.rect.pointNumber,
            distance: bestDirect.rawDistance,
            isDirectHit: true,
            adaptiveRadius: bestDirect.adaptiveRadius,
            snapCenter: { x: bestDirect.rect.centerX, y: bestDirect.rect.centerY },
        };
    }

    // 2. Recherche par magnétisme adaptatif avec hystérésis
    let bestCandidate: EvaluatedCandidate | null = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
        if (candidate.effectiveDistance < minDistance) {
            minDistance = candidate.effectiveDistance;
            bestCandidate = candidate;
        }
    }

    if (bestCandidate && bestCandidate.effectiveDistance <= bestCandidate.adaptiveRadius) {
        return {
            targetPoint: bestCandidate.rect.pointNumber,
            distance: bestCandidate.effectiveDistance,
            isDirectHit: false,
            adaptiveRadius: bestCandidate.adaptiveRadius,
            snapCenter: { x: bestCandidate.rect.centerX, y: bestCandidate.rect.centerY },
        };
    }

    return {
        targetPoint: null,
        distance: minDistance,
        isDirectHit: false,
        adaptiveRadius: bestCandidate?.adaptiveRadius ?? config.maxSnapDistance,
        snapCenter: null,
    };
}
