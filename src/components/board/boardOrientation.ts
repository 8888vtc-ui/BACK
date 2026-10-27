/**
 * Logique pure d'inversion d'orientation du plateau.
 *
 * L'inversion est purement visuelle : elle réordonne les rangées de points
 * (sortie X à gauche ou à droite) sans toucher à la logique moteur (`board[p]`).
 *
 * Module 100 % pur, testable isolément, sans dépendance React.
 */

/** Clé de persistance de l'orientation. */
export const ORIENTATION_STORAGE_KEY = 'backgammon_orientation';

/** Événement DOM émis lors d'un changement d'orientation (synchronisation HUD ↔ Plateau). */
export const ORIENTATION_CHANGE_EVENT = 'backgammon:orientation-change';

/** Orientation du plateau. */
export type BoardOrientation = 'normal' | 'inverted';

/** Rangée du haut : points 13..24 (de gauche à droite). */
export const TOP_ROW = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/** Rangée du bas : points 12..1 (de gauche à droite). */
export const BOTTOM_ROW = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Inverse une rangée de points (miroir gauche/droite).
 *
 * @param row - Rangée de points (12 éléments).
 * @returns Rangée inversée.
 */
export function invertRow(row: number[]): number[] {
    return [...row].reverse();
}

/**
 * Retourne les rangées du haut et du bas selon l'orientation.
 *
 * @param orientation - Orientation souhaitée.
 * @returns `{ top, bottom }` : rangées réordonnées.
 */
export function getOrientedRows(orientation: BoardOrientation): {
    top: number[];
    bottom: number[];
} {
    if (orientation === 'inverted') {
        return { top: invertRow(TOP_ROW), bottom: invertRow(BOTTOM_ROW) };
    }
    return { top: TOP_ROW, bottom: BOTTOM_ROW };
}

/**
 * Bascule l'orientation (normal ↔ inverted).
 */
export function toggleOrientation(current: BoardOrientation): BoardOrientation {
    return current === 'normal' ? 'inverted' : 'normal';
}

/**
 * Lit l'orientation persistée depuis localStorage (SSR-safe).
 */
export function getSavedOrientation(defaultValue: BoardOrientation = 'normal'): BoardOrientation {
    if (typeof localStorage === 'undefined') return defaultValue;
    try {
        const saved = localStorage.getItem(ORIENTATION_STORAGE_KEY);
        if (saved === 'inverted') return 'inverted';
        if (saved === 'normal') return 'normal';
    } catch {
        // localStorage indisponible
    }
    return defaultValue;
}

/**
 * Persiste l'orientation dans localStorage et notifie les composants abonnés.
 */
export function saveOrientation(orientation: BoardOrientation): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(ORIENTATION_STORAGE_KEY, orientation);
    } catch {
        // ignore
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent<BoardOrientation>(ORIENTATION_CHANGE_EVENT, { detail: orientation }));
    }
}
