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
    const effectiveStart = point === X_BAR ? 25 : point === O_BAR ? 0 : point;
    const sum = dice[0] + dice[1];
    const sumDest = isX ? effectiveStart - sum : effectiveStart + sum;

    const sumVal = board[sumDest] ?? 0;
    const sumIsFree =
        sumDest >= 1 &&
        sumDest <= 24 &&
        (isX ? sumVal >= -1 : sumVal <= 1);

    if (!sumIsFree) {
        return { isPossible: false };
    }

    const mid1 = isX ? effectiveStart - dice[0] : effectiveStart + dice[0];
    const mid2 = isX ? effectiveStart - dice[1] : effectiveStart + dice[1];

    const isMidFree = (m: number) => {
        if (m < 1 || m > 24) return false;
        const val = board[m] ?? 0;
        return isX ? val >= -1 : val <= 1;
    };

    const mid1Valid = leftDests.includes(mid1) && isMidFree(mid1);
    const mid2Valid = rightDests.includes(mid2) && isMidFree(mid2);

    if (mid1Valid && mid2Valid) {
        // Priorise le passage intermédiaire qui frappe un blot adverse s'il existe
        const mid1Hits = isX ? (board[mid1] ?? 0) === -1 : (board[mid1] ?? 0) === 1;
        const mid2Hits = isX ? (board[mid2] ?? 0) === -1 : (board[mid2] ?? 0) === 1;
        const chosenMid = mid2Hits && !mid1Hits ? mid2 : mid1;
        return { isPossible: true, midDest: chosenMid, sumDest };
    }

    if (mid1Valid) {
        return { isPossible: true, midDest: mid1, sumDest };
    }

    if (mid2Valid) {
        return { isPossible: true, midDest: mid2, sumDest };
    }

    return { isPossible: false };
}

/**
 * Trouve un coup direct vers une destination cliquée `dest` :
 * 1. Priorité absolue à la rentrée depuis la barre si le joueur a un pion sur la barre.
 * 2. Sinon, si un seul pion peut atteindre `dest` avec le dé actif (ou un seul pion tous dés confondus),
 *    retourne ce coup `(from, dest, die)`.
 */
export function findDirectMoveToDestination(
    dest: number,
    turn: Player,
    leftDieTargets: Map<number, number[]>,
    rightDieTargets: Map<number, number[]>,
    preferredDie: 0 | 1 = 0,
): { from: number; to: number; die: 0 | 1 } | null {
    const barPoint = turn === 'X' ? X_BAR : O_BAR;
    const primaryTargets = preferredDie === 0 ? leftDieTargets : rightDieTargets;
    const secondaryTargets = preferredDie === 0 ? rightDieTargets : leftDieTargets;
    const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;

    // 1. Si un pion est sur la barre et peut entrer sur `dest`
    if ((primaryTargets.get(barPoint) ?? []).includes(dest)) {
        return { from: barPoint, to: dest, die: preferredDie };
    }
    if ((secondaryTargets.get(barPoint) ?? []).includes(dest)) {
        return { from: barPoint, to: dest, die: secondaryDie };
    }

    // 2. Cherche les sources pouvant atteindre `dest` avec le dé actif
    const primarySources = Array.from(primaryTargets.entries())
        .filter(([, dests]) => dests.includes(dest))
        .map(([from]) => from);
    if (primarySources.length === 1) {
        return { from: primarySources[0], to: dest, die: preferredDie };
    }

    // 3. Repli sur le second dé si une seule source peut atteindre `dest`
    const secondarySources = Array.from(secondaryTargets.entries())
        .filter(([, dests]) => dests.includes(dest))
        .map(([from]) => from);
    if (primarySources.length === 0 && secondarySources.length === 1) {
        return { from: secondarySources[0], to: dest, die: secondaryDie };
    }

    return null;
}

/**
 * Détecte si un clic sur une flèche d'arrivée (vide ou blot) peut faire une porte
 * (2 pions sur la même flèche) en déplaçant deux pions avec les deux dés.
 *
 * Retourne les deux coups à jouer (from1→dest, from2→dest) ou null si impossible.
 */
export function findPortMove(
    dest: number,
    dice: [number, number] | null,
    board: number[],
    turn: Player,
    leftDieTargets: Map<number, number[]>,
    rightDieTargets: Map<number, number[]>,
): { from1: number; from2: number; die1: 0 | 1; die2: 0 | 1 } | null {
    if (!dice || dice[0] === dice[1]) return null;

    const isX = turn === 'X';
    // La flèche d'arrivée doit être vide ou un blot (≤ 1 pion adverse).
    const destVal = board[dest] ?? 0;
    const destIsFree = isX ? destVal >= -1 : destVal <= 1;
    if (!destIsFree) return null;

    // Cherche un pion qui peut atteindre `dest` avec le dé 1.
    const from1Candidates = Array.from(leftDieTargets.entries())
        .filter(([, dests]) => dests.includes(dest))
        .map(([from]) => from);

    // Cherche un pion qui peut atteindre `dest` avec le dé 2.
    const from2Candidates = Array.from(rightDieTargets.entries())
        .filter(([, dests]) => dests.includes(dest))
        .map(([from]) => from);

    // Il faut deux pions distincts (ou le même pion si les deux dés peuvent l'atteindre).
    if (from1Candidates.length === 0 || from2Candidates.length === 0) return null;

    const from1 = from1Candidates[0];
    const from2 = from2Candidates.find((f) => f !== from1) ?? from2Candidates[0];

    return { from1, from2, die1: 0, die2: 1 };
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
