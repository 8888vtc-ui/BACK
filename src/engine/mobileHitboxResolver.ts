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

// ─── Géométrie Responsive Portrait / Paysage & Empilement (Rapports #7 & #10) ───

export const MAX_VISIBLE_STACK_DISCS = 5;
export const COMPRESSED_STACK_STEP_RATIO = 0.188; // 18.8% du diamètre
export const DRAG_ANTI_OCCLUSION_OFFSET_Y_PX = -44;

export type MobileGridTopology = 'micro_rail_13_05fr' | 'zero_margin_12_65fr';

export interface MobileBoardGeometryMetrics {
    readonly topology: MobileGridTopology;
    readonly totalFractions: number;
    readonly barFractions: number;
    readonly bearOffFractions: number;
    readonly pointWidthPx: number;
    readonly checkerDiameterPx: number;
    readonly gridTemplateColumns: string;
}

/**
 * Calcule la géométrie exacte des colonnes CSS et du diamètre de pion sur smartphone :
 * - Topologie `micro_rail_13_05fr` (Rapport #7) : `13.05fr` en jeu normal (`0.35fr` bear-off)
 *   et `13.40fr` en phase de sortie (`0.85fr` bear-off), barre centrale `1.05fr`.
 * - Topologie `zero_margin_12_65fr` (Rapport #10) : `12.65fr` (`0.65fr` barre centrale, `0fr` bear-off).
 */
export function computeMobileBoardGeometry(params: {
    readonly boardContainerWidthPx: number;
    readonly viewportHeightPx?: number;
    readonly isBearingOff?: boolean;
    readonly topology?: MobileGridTopology;
}): MobileBoardGeometryMetrics {
    const width = Math.max(280, params.boardContainerWidthPx);
    const height = Math.max(480, params.viewportHeightPx ?? 844);
    const topology = params.topology ?? 'micro_rail_13_05fr';
    const isBearingOff = Boolean(params.isBearingOff);

    if (topology === 'zero_margin_12_65fr') {
        const barFractions = 0.65;
        const totalFractions = 12 + barFractions; // 12.65fr
        const pointWidthPx = Number((width / totalFractions).toFixed(2));
        const checkerDiameterPx = Number(
            Math.min(35.8, Math.max(24.5, pointWidthPx * 0.94)).toFixed(2),
        );
        return {
            topology,
            totalFractions,
            barFractions,
            bearOffFractions: 0,
            pointWidthPx,
            checkerDiameterPx,
            gridTemplateColumns: 'repeat(6, 1fr) 0.65fr repeat(6, 1fr)',
        };
    }

    const barFractions = 1.05;
    const bearOffFractions = isBearingOff ? 0.85 : 0.35;
    const totalFractions = Number((12 + barFractions + bearOffFractions).toFixed(2));
    const pointWidthPx = Number((width / totalFractions).toFixed(2));
    const clampCandidate = Math.min(width * 0.069, height * 0.082, pointWidthPx * 0.96);
    const checkerDiameterPx = Number(Math.min(35.8, Math.max(24.5, clampCandidate)).toFixed(2));

    return {
        topology,
        totalFractions,
        barFractions,
        bearOffFractions,
        pointWidthPx,
        checkerDiameterPx,
        gridTemplateColumns: `repeat(6, 1fr) 1.05fr repeat(6, 1fr) ${bearOffFractions}fr`,
    };
}

export interface CheckerStackVisualSpec {
    readonly visibleDiscsCount: number;
    readonly stepRatio: number;
    /** Badge numérique affiché sur le 5e disque (`null` si `<= 5` pions). */
    readonly fifthDiscBadge: number | null;
}

/**
 * Plafonne l'empilement visuel à 5 disques maximum avec pas de recouvrement de 18,8 %
 * et badge numérique (`6` à `15`) sur le 5e disque.
 */
export function computeCheckerStackVisualSpec(checkerCount: number): CheckerStackVisualSpec {
    const safeCount = Math.max(0, Math.floor(checkerCount));
    if (safeCount === 0) {
        return { visibleDiscsCount: 0, stepRatio: 0, fifthDiscBadge: null };
    }
    const visibleDiscsCount = Math.min(MAX_VISIBLE_STACK_DISCS, safeCount);
    const stepRatio = safeCount >= MAX_VISIBLE_STACK_DISCS ? COMPRESSED_STACK_STEP_RATIO : 0.82;
    const fifthDiscBadge = safeCount > MAX_VISIBLE_STACK_DISCS ? safeCount : null;
    return { visibleDiscsCount, stepRatio, fifthDiscBadge };
}

export interface DragVisualTransform {
    readonly offsetY: number;
    readonly scale: number;
}

/**
 * Calcule le décalage vertical anti-occlusion (`-44px` à `-48px`) et le facteur de zoom (`1.25x` si `< 28px`)
 * lors d'un Drag-and-Drop tactile afin que le pion reste 100 % visible au-dessus de la pulpe du pouce.
 */
export function computeDragThumbTransform(checkerDiameterPx: number): DragVisualTransform {
    const isCompact = checkerDiameterPx < 28;
    return {
        offsetY: isCompact ? -48 : DRAG_ANTI_OCCLUSION_OFFSET_Y_PX,
        scale: isCompact ? 1.25 : 1.12,
    };
}

// ─── Machine à États Tactiles à 6 États & Règle du Dé Fort à Gauche (Rapport #7 §4.2 & §5.1) ───

export type TactileTurnState =
    | 'IDLE_TURN_START'
    | 'SOURCE_SELECTED'
    | 'DRAGGING_ACTIVE'
    | 'STEP_1_COMMITTED'
    | 'TURN_PENDING_CONFIRM'
    | 'OPPONENT_OR_ANIMATING';

/**
 * Ordonne les dés à l'initialisation du tour avec le dé le plus fort à gauche (`d1 >= d2`)
 * pour un comportement 1-Tap Smart Move 100 % prévisible.
 */
export function normalizeInitialDiceOrder(dice: readonly [number, number]): readonly [number, number] {
    return dice[0] >= dice[1] ? [dice[0], dice[1]] : [dice[1], dice[0]];
}

/** Inverse l'ordre d'exécution des dés (`[d1, d2]` -> `[d2, d1]`) lors d'un tap sur la paire de dés. */
export function swapTactileDiceOrder(dice: readonly [number, number]): readonly [number, number] {
    return [dice[1], dice[0]];
}

/**
 * Détermine l'état courant de la machine à états tactiles à 6 états.
 */
export function resolveTactileTurnState(params: {
    readonly isPlayerTurn: boolean;
    readonly isAnimating: boolean;
    readonly isDragging: boolean;
    readonly selectedSource: number | null;
    readonly subMovesPlayedCount: number;
    readonly hasRemainingLegalMoves: boolean;
}): TactileTurnState {
    if (!params.isPlayerTurn || params.isAnimating) {
        return 'OPPONENT_OR_ANIMATING';
    }
    if (params.isDragging) {
        return 'DRAGGING_ACTIVE';
    }
    if (!params.hasRemainingLegalMoves) {
        return 'TURN_PENDING_CONFIRM';
    }
    if (params.selectedSource !== null) {
        return 'SOURCE_SELECTED';
    }
    if (params.subMovesPlayedCount > 0) {
        return 'STEP_1_COMMITTED';
    }
    return 'IDLE_TURN_START';
}

