/**
 * Fonctions pures d'aide au calcul et à la sélection des coups de pions (Smart Click, Doublon, Somme).
 *
 * Rôle :
 *   Fournit des algorithmes déterministes et sans état pour :
 *   1. Déterminer le meilleur point de départ pour un dé donné.
 *   2. Trouver le coup le plus sécurisé (blot safety) parmi une liste de candidats.
 *   3. Évaluer la faisabilité d'un coup combiné "somme des deux dés" (double-clic).
 *
 * Dépendances :
 *   `backgammonEngine` (`Player`, `Move`, `evaluateMoveSafety`, `getSafestDestination`, `X_BAR`, `O_BAR`).
 *
 * Retrait :
 *   Supprimer ce fichier et ses imports dans `useCheckerInteractions`.
 */

import {
    Player,
    evaluateMoveSafety,
    getSafestDestination,
    X_BAR,
    O_BAR,
} from './backgammonEngine';

/**
 * Sélectionne le meilleur point de départ lorsque plusieurs flèches peuvent jouer un dé.
 * Priorise la rentrée depuis la barre, puis le coup maximisant la sécurité du blot résultant.
 */
export function getBestCheckerForDie(
    targets: Map<number, number[]>,
    board: number[],
    turn: Player,
): number | null {
    const movablePoints = Array.from(targets.keys());
    if (movablePoints.length === 0) return null;
    if (movablePoints.length === 1) return movablePoints[0];

    const barPoint = turn === 'X' ? X_BAR : O_BAR;
    if (movablePoints.includes(barPoint)) {
        return barPoint;
    }

    return movablePoints.reduce((best, point) => {
        const dests = targets.get(point) ?? [];
        const safestDest = getSafestDestination(point, dests, board, turn);
        const safety = evaluateMoveSafety(board, { from: point, to: safestDest }, turn);

        const bestDests = targets.get(best) ?? [];
        const bestSafestDest = getSafestDestination(best, bestDests, board, turn);
        const bestSafety = evaluateMoveSafety(board, { from: best, to: bestSafestDest }, turn);

        return safety > bestSafety ? point : best;
    }, movablePoints[0]);
}

/**
 * Recherche le coup le plus sûr parmi tous les pions et toutes leurs destinations légales pour un dé donné.
 */
export function findSafestMoveForDie(
    targets: Map<number, number[]>,
    board: number[],
    turn: Player,
    selectedPoint?: number | null,
): { from: number; to: number } | null {
    if (targets.size === 0) return null;

    // Si un pion est déjà sélectionné et a des destinations valides avec ce dé
    if (selectedPoint !== null && selectedPoint !== undefined && targets.has(selectedPoint)) {
        const dests = targets.get(selectedPoint) ?? [];
        if (dests.length > 0) {
            const safestDest = getSafestDestination(selectedPoint, dests, board, turn);
            return { from: selectedPoint, to: safestDest };
        }
    }

    const movablePoints = Array.from(targets.keys());
    const barPoint = turn === 'X' ? X_BAR : O_BAR;
    const candidates = movablePoints.includes(barPoint) ? [barPoint] : movablePoints;

    let bestFrom: number | null = null;
    let bestDest: number | null = null;
    let bestSafety = -Infinity;

    for (const from of candidates) {
        const dests = targets.get(from) ?? [];
        for (const dest of dests) {
            const safety = evaluateMoveSafety(board, { from, to: dest }, turn);
            if (safety > bestSafety) {
                bestSafety = safety;
                bestFrom = from;
                bestDest = dest;
            }
        }
    }

    if (bestFrom !== null && bestDest !== null) {
        return { from: bestFrom, to: bestDest };
    }

    return null;
}

/**
 * Évalue si un déplacement combiné "somme des deux dés" (double-clic) est immédiatement possible
 * et renvoie le coup intermédiaire ainsi que la destination finale.
 */
export function evaluateSumOfDiceMove(
    point: number,
    dice: [number, number] | null,
    board: number[],
    turn: Player,
    leftDests: number[],
    rightDests: number[],
): { isPossible: boolean; midDest?: number; sumDest?: number } {
    if (!dice || dice[0] === dice[1]) {
        return { isPossible: false };
    }

    const isX = turn === 'X';
    const sum = dice[0] + dice[1];
    const sumDest = isX ? point - sum : point + sum;
    const midDest = isX ? point - dice[0] : point + dice[0];

    const allDests = Array.from(new Set([...leftDests, ...rightDests]));
    const sumIsLegal = allDests.includes(sumDest) || leftDests.includes(sumDest) || rightDests.includes(sumDest);

    const midVal = board[midDest] ?? 0;
    const midIsFree =
        midDest >= 1 &&
        midDest <= 24 &&
        (isX ? midVal >= -1 : midVal <= 1);

    if (sumIsLegal && midIsFree) {
        return { isPossible: true, midDest, sumDest };
    }

    return { isPossible: false };
}

/**
 * Détermine la meilleure destination et le dé associé pour un clic gauche ou droit sur un pion.
 */
export function findClickDestination(
    point: number,
    leftDests: number[],
    rightDests: number[],
    board: number[],
    turn: Player,
    preferRight = false,
): { dest: number; die: 0 | 1 } | null {
    const allDests = Array.from(new Set([...leftDests, ...rightDests]));
    if (allDests.length === 0) return null;

    if (allDests.length === 1) {
        const dest = allDests[0];
        return { dest, die: leftDests.includes(dest) ? 0 : 1 };
    }

    if (leftDests.length === 1 && rightDests.length === 0) {
        return { dest: leftDests[0], die: 0 };
    }
    if (rightDests.length === 1 && leftDests.length === 0) {
        return { dest: rightDests[0], die: 1 };
    }

    if (preferRight) {
        if (rightDests.length > 0) {
            return { dest: getSafestDestination(point, rightDests, board, turn), die: 1 };
        }
        if (leftDests.length > 0) {
            return { dest: getSafestDestination(point, leftDests, board, turn), die: 0 };
        }
    } else {
        if (leftDests.length > 0) {
            return { dest: getSafestDestination(point, leftDests, board, turn), die: 0 };
        }
        if (rightDests.length > 0) {
            return { dest: getSafestDestination(point, rightDests, board, turn), die: 1 };
        }
    }

    return null;
}
