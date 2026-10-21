/**
 * Fonctions pures de normalisation des surbrillances (flèches Coach / adversaire).
 * Extraites de `Board.tsx` (LOI 5 : composants ≤ 300 lignes).
 */

import { X_BAR, O_BAR, X_OFF, O_OFF } from '../../engine/backgammonEngine';

/**
 * Normalise une flèche de surbrillance vers la numérotation ABSOLUE du plateau.
 *
 * Le moteur utilise `X_BAR === X_OFF === 0` et `O_BAR === O_OFF === 25` : le même
 * index désigne la barre en `from` et la sortie en `to`. Une destination de
 * sortie (`to === 0` ou `to === 25`) ne doit donc JAMAIS être comparée à une
 * flèche 1..24 — c'est ce qui allumait la case 24 par erreur.
 */
export function normalizeHighlightPoint(point: number, isDestination: boolean): number | null {
    if (isDestination) {
        if (point === X_OFF || point === O_OFF) return null;
        return point;
    }
    if (point === X_BAR || point === O_BAR) return null;
    return point;
}

/** Vrai si `point` est une flèche réelle 1..24 (ni barre, ni sortie). */
export function isRealPoint(point: number): boolean {
    return point >= 1 && point <= 24;
}

/**
 * Fl�ches (1..24) dont un pion peut jouer avec les d�s courants.
 * Vide hors des phases o� le joueur humain d�place ses pions.
 */
export function collectMovableSources(
    left: Map<number, number[]>,
    right: Map<number, number[]>,
    gamePhase: string,
): Set<number> {
    const result = new Set<number>();
    if (gamePhase !== 'HUMAN_MOVING' && gamePhase !== 'HUMAN_READY_TO_COMMIT') return result;
    for (const [from, dests] of [...left, ...right]) {
        if (dests.length > 0 && isRealPoint(from)) result.add(from);
    }
    return result;
}
