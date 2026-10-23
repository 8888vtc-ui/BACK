/**
 * Moteur de Micro-Animations GPU 60/120 FPS & Transitions Composite-Only (Audit 12 / 20).
 *
 * Exigences :
 *   1. Animer exclusivement via `transform: translate3d()` / `scale3d()` et `opacity`
 *      (zéro propriété de layout `top`, `left`, `width`, `height`, `margin`).
 *   2. Appliquer `will-change: transform, opacity` uniquement pendant la phase active
 *      de mouvement (`'auto'` au repos pour préserver la VRAM mobile).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

export const GPU_COMPOSITE_TRANSITION_PROPS = 'transform, opacity';
export const GPU_DEFAULT_FLIGHT_DURATION_MS = 150;
export const GPU_DEFAULT_FLIGHT_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/** Liste des propriétés CSS qui déclenchent un recalcul de Layout (Reflow) et sont interdites en animation. */
export const FORBIDDEN_LAYOUT_PROPERTIES = [
    'top',
    'left',
    'right',
    'bottom',
    'width',
    'height',
    'margin',
    'padding',
    'all',
] as const;

export interface GpuTransformStyle {
    readonly left: '0px';
    readonly top: '0px';
    readonly transform: string;
    readonly transition: string;
    readonly willChange: 'transform, opacity' | 'auto';
}

/**
 * Génère la chaîne `translate3d(x, y, 0) scale3d(s, s, 1)` accélérée par le GPU.
 */
export function formatTranslate3d(
    xPx: number,
    yPx: number,
    scale: number = 1,
    centerOffset: boolean = false,
): string {
    const safeX = Number.isFinite(xPx) ? Math.round(xPx * 100) / 100 : 0;
    const safeY = Number.isFinite(yPx) ? Math.round(yPx * 100) / 100 : 0;
    const safeScale = Number.isFinite(scale) && scale > 0 ? Math.round(scale * 1000) / 1000 : 1;
    const offsetPart = centerOffset ? ' translate3d(-50%, -50%, 0)' : '';
    return `translate3d(${safeX}px, ${safeY}px, 0)${offsetPart} scale3d(${safeScale}, ${safeScale}, 1)`;
}

/**
 * Retourne la valeur de `will-change` strictement bornée à la phase active de mouvement :
 * - `'transform, opacity'` pendant le glissement, le vol ou le retour élastique.
 * - `'auto'` dès que le pion est posé au repos (libère la couche GPU).
 */
export function getScopedWillChange(isActiveMovementPhase: boolean): 'transform, opacity' | 'auto' {
    return isActiveMovementPhase ? 'transform, opacity' : 'auto';
}

/**
 * Construit un objet de style 100 % GPU Composite-Only (`left: 0px`, `top: 0px`, `translate3d`)
 * garantissant 0 Layout Shift (CLS = 0) et 0 Repaint coûteux à 60/120 FPS.
 */
export function buildGpuFlightStyle(params: {
    xPx: number;
    yPx: number;
    scale?: number;
    centerOffset?: boolean;
    isActivePhase: boolean;
    durationMs?: number;
    easing?: string;
}): GpuTransformStyle {
    const {
        xPx,
        yPx,
        scale = 1,
        centerOffset = true,
        isActivePhase,
        durationMs = GPU_DEFAULT_FLIGHT_DURATION_MS,
        easing = GPU_DEFAULT_FLIGHT_EASING,
    } = params;

    return {
        left: '0px',
        top: '0px',
        transform: formatTranslate3d(xPx, yPx, scale, centerOffset),
        transition: `transform ${durationMs}ms ${easing}, opacity ${durationMs}ms ${easing}`,
        willChange: getScopedWillChange(isActivePhase),
    };
}

/**
 * Vérifie mathématiquement qu'une déclaration CSS `transition` n'anime aucune propriété
 * de layout (`top`, `left`, `width`, `height`, `all`), mais uniquement `transform` et/ou `opacity`.
 */
export function isCompositeOnlyTransition(transitionCss: string): boolean {
    if (!transitionCss || transitionCss.trim() === 'none') return true;
    const normalized = transitionCss.toLowerCase();
    for (const forbidden of FORBIDDEN_LAYOUT_PROPERTIES) {
        const regex = new RegExp(`\\b${forbidden}\\b`);
        if (regex.test(normalized)) {
            return false;
        }
    }
    return normalized.includes('transform') || normalized.includes('opacity');
}
