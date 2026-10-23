/**
 * Physique de vol des pions & calibration FLIP WAAPI (Game Feel Spec §2).
 *
 * Fonctions pures : durée de vol, vecteurs d'inversion FLIP, construction des keyframes WAAPI
 * (coup normal, frappe de blot, éjection vers la barre, bear-off, saut combiné d1+d2,
 * convergence de port). Aucune dépendance au DOM ni à React.
 */

export interface Vec2 {
    readonly x: number;
    readonly y: number;
}

export interface RectLike {
    readonly left: number;
    readonly top: number;
    readonly width?: number;
    readonly height?: number;
}

export interface FlipInvertVector {
    readonly dx: number;
    readonly dy: number;
    readonly distPx: number;
}

// Constantes historiques par diamètre (rétrocompatibilité `gameFeel.test.ts`)
export const FLIGHT_BASE_MS = 120;
export const FLIGHT_PER_DIAMETER_MS = 22;
export const FLIGHT_MIN_MS = 160;
export const FLIGHT_MAX_MS = 420;
export const FLIGHT_EASING = 'cubic-bezier(0.22, 1.0, 0.36, 1.0)';
export const LIFT_EASING = 'cubic-bezier(0.45, 0, 0.55, 1)';
export const LIFT_SCALE = 1.08;
export const ARC_HEIGHT_FACTOR = 0.06;
export const ARC_MAX_DIAMETERS = 0.45;

// Calibration FLIP WAAPI haute cadence (Chantier 1)
export const NORMAL_FLIGHT_BASE_MS = 125;
export const NORMAL_FLIGHT_SLOPE = 0.22;
export const NORMAL_FLIGHT_MIN_MS = 140;
export const NORMAL_FLIGHT_MAX_MS = 290;
export const NORMAL_FLIGHT_EASING = 'cubic-bezier(0.22, 1.0, 0.36, 1.0)';
export const NORMAL_APEX_OFFSET = 0.45;
export const NORMAL_APEX_SCALE = 1.08;
export const NORMAL_APEX_DROP_SHADOW = 'drop-shadow(0 12px 18px rgba(0,0,0,0.36))';

// Frappe d'un Blot ("Hit")
export const HIT_ATTACKER_BASE_MS = 115;
export const HIT_ATTACKER_SLOPE = 0.20;
export const HIT_ATTACKER_MIN_MS = 130;
export const HIT_ATTACKER_MAX_MS = 265;
export const HIT_ATTACKER_EASING = 'cubic-bezier(0.16, 1.0, 0.30, 1.0)';
export const HIT_ATTACKER_SCALE = 1.12;
/** Décollage du pion frappé synchronisé à exactement 75 % du vol de l'attaquant. */
export const HIT_EJECT_DELAY_RATIO = 0.75;
export const HIT_TO_BAR_DURATION_MS = 260;
/** Trajectoire vers la barre avec rebond élastique. */
export const HIT_TO_BAR_EASING = 'cubic-bezier(0.34, 1.45, 0.64, 1.0)';

// Sortie de pion ("Bear-off")
export const BEAR_OFF_DURATION_MS = 195;
export const BEAR_OFF_EASING = 'cubic-bezier(0.25, 0.90, 0.35, 1.0)';
export const BEAR_OFF_END_SCALE_Y = 0.35;

// Saut combiné (d1 + d2) & Convergence à 2 pions ("Make a Point")
export const COMBINED_FIRST_HOP_FACTOR = 0.85;
export const INTERMEDIATE_TOUCH_PAUSE_MS = 55;
export const CONVERGENCE_STAGGER_MS = 45;
export const PORT_STAGGER_MS = CONVERGENCE_STAGGER_MS;

/** Au-delà de 2 vols simultanés, on accélère pour ne jamais accumuler de retard. */
export const CATCH_UP_FACTOR = 0.6;
export const CATCH_UP_THRESHOLD = 2;

export function clamp(val: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, val));
}

export function distance(a: Vec2, b: Vec2): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Étape INVERT de l'algorithme FLIP :
 * Calcule le vecteur Δx = firstRect.left - lastRect.left, Δy = firstRect.top - lastRect.top
 * et la distance euclidienne D_px = √(Δx² + Δy²).
 */
export function computeFlipInvertVector(firstRect: RectLike, lastRect: RectLike): FlipInvertVector {
    const dx = firstRect.left - lastRect.left;
    const dy = firstRect.top - lastRect.top;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    return { dx, dy, distPx };
}

/**
 * Durée calibrée d'un coup normal en pixels :
 * clamp(125 + 0.22 * distPx, 140, 290) ms.
 */
export function computeNormalFlightDurationPx(distPx: number, speedFactor = 1): number {
    const raw = clamp(
        NORMAL_FLIGHT_BASE_MS + NORMAL_FLIGHT_SLOPE * Math.max(0, distPx),
        NORMAL_FLIGHT_MIN_MS,
        NORMAL_FLIGHT_MAX_MS,
    );
    return Math.max(0, Math.round(raw * speedFactor));
}

/**
 * Durée calibrée d'un pion attaquant lors de la frappe d'un blot ("Hit") :
 * clamp(115 + 0.20 * distPx, 130, 265) ms.
 */
export function computeHitAttackerDurationPx(distPx: number, speedFactor = 1): number {
    const raw = clamp(
        HIT_ATTACKER_BASE_MS + HIT_ATTACKER_SLOPE * Math.max(0, distPx),
        HIT_ATTACKER_MIN_MS,
        HIT_ATTACKER_MAX_MS,
    );
    return Math.max(0, Math.round(raw * speedFactor));
}

/**
 * Délai d'éjection du blot frappé vers la barre : exactement 75 % de la durée du vol attaquant.
 */
export function computeHitEjectDelayMs(attackerDurationMs: number): number {
    return Math.round(HIT_EJECT_DELAY_RATIO * Math.max(0, attackerDurationMs));
}

/**
 * Durée du premier saut d'un coup combiné (d1 + d2) contractée de 15 % (duration * 0.85).
 */
export function computeContractedFirstHopMs(durationMs: number): number {
    return Math.max(1, Math.round(durationMs * COMBINED_FIRST_HOP_FACTOR));
}

/**
 * duration = clamp(base + perDiameter × (dist / D), min, max) × speedFactor
 * Exprimer la distance en diamètres de pion rend la durée indépendante de la résolution.
 */
export function computeFlightDurationMs(from: Vec2, to: Vec2, checkerDiameter: number, speedFactor = 1): number {
    const diameters = distance(from, to) / Math.max(checkerDiameter, 1e-6);
    const raw = Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, FLIGHT_BASE_MS + FLIGHT_PER_DIAMETER_MS * diameters));
    return Math.max(0, Math.round(raw * speedFactor));
}

export function computeArcHeight(longestSegment: number, checkerDiameter: number): number {
    return Math.min(ARC_HEIGHT_FACTOR * longestSegment, ARC_MAX_DIAMETERS * checkerDiameter);
}

export interface FlightSpec {
    readonly id: string;
    readonly color: 'white' | 'black';
    /** Au moins 2 points, en coordonnées relatives au plateau. */
    readonly waypoints: readonly Vec2[];
    /** Longueur = waypoints.length - 1. */
    readonly segmentDurationsMs: readonly number[];
    readonly touchdownMs: number;
    readonly delayMs: number;
    readonly easing: string;
    readonly arcHeight: number;
    /** Facteur d'échelle au sommet de l'arc (1.08 normal, 1.12 hit). */
    readonly peakScale?: number;
    /** Offset relatif du sommet de l'arc parabolique sur chaque segment (défaut : 0.45). */
    readonly apexOffsetRatio?: number;
    /** Ombre portée dynamique au sommet de l'arc. */
    readonly apexDropShadow?: string;
    /** Écrasement final (bear-off : le pion « se couche » dans le plateau de rangement). */
    readonly endScaleY?: number;
    /** Point dont un pion est masqué pendant le vol (le vrai pion apparaît à l'atterrissage). */
    readonly arrivalPoint: number;
}

export function getFlightTotalMs(f: Pick<FlightSpec, 'segmentDurationsMs' | 'touchdownMs'>): number {
    const segs = f.segmentDurationsMs;
    return segs.reduce((a, b) => a + b, 0) + f.touchdownMs * Math.max(0, segs.length - 1);
}

/** Instants (ms, hors délai) où le pion touche chaque case visitée. */
export function getLandingOffsetsMs(f: Pick<FlightSpec, 'segmentDurationsMs' | 'touchdownMs'>): number[] {
    const out: number[] = [];
    let t = 0;
    f.segmentDurationsMs.forEach((d, i) => {
        t += d;
        out.push(t);
        if (i < f.segmentDurationsMs.length - 1) t += f.touchdownMs;
    });
    return out;
}

export interface FlightKeyframes {
    readonly pathFrames: Keyframe[];
    readonly liftFrames: Keyframe[];
    readonly totalMs: number;
}

/**
 * Construit 2 animations synchronisées :
 *  - `pathFrames` (groupe externe) : translation le long des waypoints, easing par segment,
 *    palier `touchdownMs` sur chaque case intermédiaire ;
 *  - `liftFrames` (groupe interne) : arc parabolique + soulèvement scale(1.08 | 1.12) à offset 0.45.
 */
export function buildFlightKeyframes(f: FlightSpec): FlightKeyframes {
    const segs = f.segmentDurationsMs;
    const totalMs = getFlightTotalMs(f);
    const off = (ms: number) => (totalMs <= 0 ? 1 : Math.min(1, Math.max(0, ms / totalMs)));
    const peakScale = f.peakScale ?? LIFT_SCALE;
    const apexRatio = f.apexOffsetRatio ?? NORMAL_APEX_OFFSET;
    const dropShadow = f.apexDropShadow ?? NORMAL_APEX_DROP_SHADOW;
    const pathFrames: Keyframe[] = [];
    const liftFrames: Keyframe[] = [];
    let t = 0;
    segs.forEach((d, i) => {
        const a = f.waypoints[i];
        const b = f.waypoints[i + 1];
        const isLast = i === segs.length - 1;
        pathFrames.push({ offset: off(t), transform: `translate(${a.x}px, ${a.y}px)`, easing: f.easing });
        liftFrames.push({ offset: off(t), transform: 'translateY(0px) scale(1, 1)', easing: LIFT_EASING });
        liftFrames.push({
            offset: off(t + d * apexRatio),
            transform: `translateY(${-f.arcHeight}px) scale(${peakScale}, ${peakScale})`,
            filter: dropShadow,
            easing: LIFT_EASING,
        });
        t += d;
        pathFrames.push({ offset: off(t), transform: `translate(${b.x}px, ${b.y}px)` });
        const endY = isLast && f.endScaleY !== undefined ? f.endScaleY : 1;
        liftFrames.push({ offset: off(t), transform: `translateY(0px) scale(1, ${endY})` });
        if (!isLast) t += f.touchdownMs;
    });
    return { pathFrames, liftFrames, totalMs };
}

/**
 * Construit les keyframes WAAPI directes d'une inversion FLIP (de Δx, Δy vers 0, 0)
 * avec arc parabolique Z-axis à offset 0.45 (`scale(1.08)` ou `scale(1.12)` + drop-shadow).
 */
export function buildFlipElementKeyframes(params: {
    readonly dx: number;
    readonly dy: number;
    readonly isHit?: boolean;
    readonly isBearOff?: boolean;
}): Keyframe[] {
    const { dx, dy, isHit = false, isBearOff = false } = params;
    const peakScale = isHit ? HIT_ATTACKER_SCALE : NORMAL_APEX_SCALE;
    const midX = Math.round(dx * (1 - NORMAL_APEX_OFFSET) * 100) / 100;
    const midY = Math.round(dy * (1 - NORMAL_APEX_OFFSET) * 100) / 100;
    const endScale = isBearOff ? `scale(1, ${BEAR_OFF_END_SCALE_Y})` : 'scale(1)';

    return [
        {
            offset: 0,
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(1)`,
        },
        {
            offset: NORMAL_APEX_OFFSET,
            transform: `translate3d(${midX}px, ${midY}px, 0) scale(${peakScale})`,
            filter: NORMAL_APEX_DROP_SHADOW,
        },
        {
            offset: 1,
            transform: `translate3d(0px, 0px, 0) ${endScale}`,
        },
    ];
}
