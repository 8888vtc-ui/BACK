/**
 * Logique pure du roll-off (dé de démarrage).
 *
 * Détermine le premier joueur en comparant deux dés (un pour X, un pour O).
 * En cas d'égalité, le roll-off doit être relancé.
 *
 * Module 100 % pur, testable isolément, sans dépendance React.
 */

import type { Player } from '../../engine/backgammonEngine';

/** Résultat d'un roll-off. */
export interface RollOffResult {
    /** Dé de X (1..6). */
    xDie: number;
    /** Dé de O (1..6). */
    oDie: number;
    /** Gagnant, ou null en cas d'égalité (relancer). */
    winner: Player | null;
}

/**
 * Lance un dé (1..6).
 *
 * @param random - Fonction aléatoire injectable (testabilité). Par défaut `Math.random`.
 */
export function rollDie(random: () => number = Math.random): number {
    return Math.floor(random() * 6) + 1;
}

/**
 * Résout un roll-off à partir de deux dés.
 *
 * @param xDie - Dé de X.
 * @param oDie - Dé de O.
 * @returns Le gagnant, ou null en cas d'égalité.
 */
export function resolveRollOff(xDie: number, oDie: number): Player | null {
    if (xDie > oDie) return 'X';
    if (oDie > xDie) return 'O';
    return null;
}

/**
 * Effectue un roll-off complet (lance les deux dés et résout).
 *
 * @param random - Fonction aléatoire injectable.
 * @returns Résultat du roll-off.
 */
export function performRollOff(random: () => number = Math.random): RollOffResult {
    const xDie = rollDie(random);
    const oDie = rollDie(random);
    return { xDie, oDie, winner: resolveRollOff(xDie, oDie) };
}
