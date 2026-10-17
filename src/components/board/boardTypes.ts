/**
 * Types, constantes et helpers purs partagés par les composants du plateau.
 *
 * Ce module ne dépend d'aucun composant React : il centralise les conventions
 * de lecture du plateau (couleur, compte) et les constantes de layout, afin que
 * chaque sous-composant reste isolé et facile à modifier/retirer.
 */

import { X_BAR, O_BAR, pipCount, borneOffCount } from '../../engine/backgammonEngine';

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

/** Nombre maximal de pions affichés par pile (règle des 5 + badge). */
export const MAX_VISIBLE = 5;

/** Rangée du haut : points 13..24 (de gauche à droite). */
export const TOP_ROW = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/** Rangée du bas : points 12..1 (de gauche à droite). */
export const BOTTOM_ROW = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Couleur d'un pion : blanc (X) ou noir (O). */
export type CheckerColor = 'white' | 'black';

/** Données dérivées du plateau (pip counts, barre, sorties). */
export interface DerivedBoardData {
    pipCounts: { X: number; O: number };
    off: { X: number; O: number };
    bar: { X: number; O: number };
}

// ---------------------------------------------------------------------------
// Helpers purs (aucune dépendance React)
// ---------------------------------------------------------------------------

/**
 * Couleur du pion occupant une flèche, ou `null` si vide.
 *
 * Convention du moteur : `board[p] > 0` = X (blanc), `board[p] < 0` = O (noir).
 */
export function getPointColor(board: number[], point: number): CheckerColor | null {
    const value = board[point];
    if (value > 0) return 'white';
    if (value < 0) return 'black';
    return null;
}

/** Nombre absolu de pions sur une flèche. */
export function getPointCount(board: number[], point: number): number {
    return Math.abs(board[point] || 0);
}

/**
 * Dérive les données agrégées du plateau : pip counts, pions sortis (bear-off)
 * et pions sur la barre, pour chaque joueur.
 */
export function deriveBoardData(board: number[]): DerivedBoardData {
    return {
        pipCounts: pipCount(board),
        off: {
            X: borneOffCount(board, 'X'),
            O: borneOffCount(board, 'O'),
        },
        bar: {
            X: Math.max(0, board[X_BAR]),
            O: Math.max(0, -board[O_BAR]),
        },
    };
}
