/**
 * Accessibilité Visuelle & Daltonisme WCAG AAA (Audit 17 / 20).
 *
 * Exigences :
 *   1. Contraste minimal WCAG AAA ≥ 7:1 entre les pions blancs/noirs et les flèches.
 *   2. Motifs géométriques / textures différenciés sur les pions (`concentric-rings` vs
 *      `star-rosette`) pour ne jamais dépendre uniquement de la couleur (protanopie,
 *      deutéranopie, tritanopie, monochromie).
 *   3. Changement de mode / thème instantané sans rechargement.
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

export const WCAG_AAA_MIN_CONTRAST = 7.0;
export const COLORBLIND_STORAGE_KEY = 'bg_colorblind_mode';
export const COLORBLIND_CHANGE_EVENT = 'bg-colorblind-change';

export type ColorblindMode =
    | 'standard'
    | 'protanopia'
    | 'deuteranopia'
    | 'tritanopia'
    | 'high_contrast_aaa';

export type CheckerPatternKind = 'concentric-rings' | 'star-rosette';

export interface AccessibleCheckerPalette {
    readonly whitePrimaryHex: string;
    readonly blackPrimaryHex: string;
    readonly whitePattern: CheckerPatternKind;
    readonly blackPattern: CheckerPatternKind;
    readonly contrastRatio: number;
}

/** Convertit un canal sRGB (0..255) en luminance linéaire selon WCAG 2.1. */
function srgbChannelToLinear(channel255: number): number {
    const c = Math.max(0, Math.min(255, channel255)) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Parse une couleur hexadécimale `#RRGGBB` ou `#RGB` en triplet RGB `[r, g, b]`. */
export function parseHexColor(hex: string): readonly [number, number, number] {
    const cleaned = hex.trim().replace(/^#/, '');
    if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        return [Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b];
    }
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [Number.isNaN(r) ? 0 : r, Number.isNaN(g) ? 0 : g, Number.isNaN(b) ? 0 : b];
}

/** Calcule la luminance relative WCAG 2.1 (0.0 = noir absolu, 1.0 = blanc absolu). */
export function computeRelativeLuminance(hex: string): number {
    const [r, g, b] = parseHexColor(hex);
    return (
        0.2126 * srgbChannelToLinear(r) +
        0.7152 * srgbChannelToLinear(g) +
        0.0722 * srgbChannelToLinear(b)
    );
}

/** Calcule le ratio de contraste WCAG 2.1 entre deux couleurs hexadécimales (1.0 à 21.0). */
export function computeContrastRatio(hexA: string, hexB: string): number {
    const lumA = computeRelativeLuminance(hexA);
    const lumB = computeRelativeLuminance(hexB);
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

/** Vérifie si deux couleurs respectent le seuil WCAG AAA (≥ 7:1). */
export function isWcagAAACompliant(
    hexA: string,
    hexB: string,
    minRatio: number = WCAG_AAA_MIN_CONTRAST,
): boolean {
    return computeContrastRatio(hexA, hexB) >= minRatio;
}

/** Retourne le motif géométrique distinctif associé à chaque camp de pions. */
export function getCheckerPatternKind(color: 'white' | 'black'): CheckerPatternKind {
    return color === 'white' ? 'concentric-rings' : 'star-rosette';
}

/** Retourne la palette accessible WCAG AAA (contraste > 17:1 ≥ 7:1) selon le mode daltonisme. */
export function getAccessibleCheckerPalette(
    mode: ColorblindMode = 'standard',
): AccessibleCheckerPalette {
    const whitePrimaryHex = mode === 'high_contrast_aaa' ? '#FFFFFF' : '#FDFAF3';
    const blackPrimaryHex = mode === 'high_contrast_aaa' ? '#040406' : '#0B0B0F';
    return {
        whitePrimaryHex,
        blackPrimaryHex,
        whitePattern: 'concentric-rings',
        blackPattern: 'star-rosette',
        contrastRatio: computeContrastRatio(whitePrimaryHex, blackPrimaryHex),
    };
}

/** Lit le mode daltonisme sauvegardé dans localStorage. */
export function getSavedColorblindMode(
    defaultMode: ColorblindMode = 'standard',
): ColorblindMode {
    if (typeof window === 'undefined') return defaultMode;
    try {
        const raw = window.localStorage.getItem(COLORBLIND_STORAGE_KEY);
        if (
            raw === 'standard' ||
            raw === 'protanopia' ||
            raw === 'deuteranopia' ||
            raw === 'tritanopia' ||
            raw === 'high_contrast_aaa'
        ) {
            return raw;
        }
    } catch {
        // Ignore SecurityError
    }
    return defaultMode;
}

/** Applique et sauvegarde instantanément le mode daltonisme sans rechargement. */
export function saveColorblindMode(mode: ColorblindMode): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(COLORBLIND_STORAGE_KEY, mode);
        window.dispatchEvent(new CustomEvent<ColorblindMode>(COLORBLIND_CHANGE_EVENT, { detail: mode }));
    } catch {
        // Ignore QuotaExceededError / SecurityError
    }
}
