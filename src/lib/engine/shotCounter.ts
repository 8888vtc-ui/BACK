/**
 * Comptage exact des tirs (shots) sur un blot — module partagé.
 *
 * Énumère les 36 combinaisons de dés et compte, pour un blot donné, combien de
 * lancers permettent à l'adversaire de le frapper :
 *   - Tir direct : un seul dé atteint le blot (distance 1..6), ou un pion sur
 *     la barre entre sur le point du blot.
 *   - Tir indirect : la somme des deux dés atteint le blot, via un point
 *     intermédiaire légal (non bloqué).
 *
 * Ce module est utilisé par :
 *   - [`featureExtractor.ts`](../features/coach/featureExtractor.ts) (coach) ;
 *   - [`evaluator.ts`](./evaluator.ts) (régime CONTACT).
 *
 * Il remplace les anciennes approximations (pondération 0.5 pour tir indirect,
 * pions sur la barre non comptés) par un comptage EXACT et déterministe.
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord.
 */

import { Player, X_BAR, O_BAR } from '../../engine/backgammonEngine';

/** Nombre de pions de `opponent` sur la barre. */
function barCount(board: number[], opponent: Player): number {
    return opponent === 'X' ? Math.max(0, board[X_BAR]) : Math.max(0, -board[O_BAR]);
}

/** Point d'entrée d'un pion adverse depuis la barre, pour un dé donné. */
function barEntryPoint(opponent: Player, die: number): number {
    return opponent === 'X' ? 25 - die : die;
}

/** La flèche est bloquée pour `opponent` (l'autre joueur y a 2+ pions). */
function isBlockedFor(board: number[], point: number, opponent: Player): boolean {
    const v = board[point];
    return opponent === 'X' ? v <= -2 : v >= 2;
}

/** La flèche est un point d'atterrissage légal pour `opponent`. */
function isLegalLanding(board: number[], point: number, opponent: Player): boolean {
    if (point < 1 || point > 24) return false;
    return !isBlockedFor(board, point, opponent);
}

/** `opponent` a un pion sur la flèche `point`. */
function hasChecker(board: number[], point: number, opponent: Player): boolean {
    const v = board[point];
    return opponent === 'X' ? v > 0 : v < 0;
}

/** Distance positive d'un pion adverse en `from` jusqu'au blot, ou null. */
function distanceToBlot(from: number, blot: number, opponent: Player): number | null {
    if (opponent === 'X') return from > blot ? from - blot : null;
    return from < blot ? blot - from : null;
}

/** Un dé `die` permet-il un tir direct sur le blot ? */
function canHitDirect(board: number[], blot: number, opponent: Player, die: number): boolean {
    // 1. Pions adverses sur la barre : entrent sur le jan intérieur adverse et
    //    frappent un blot situé sur leur point d'entrée.
    if (barCount(board, opponent) > 0) {
        const entry = barEntryPoint(opponent, die);
        if (entry === blot && isLegalLanding(board, entry, opponent)) {
            return true;
        }
    }
    // 2. Pions adverses sur le plateau : tir direct à distance `die`.
    for (let q = 1; q <= 24; q++) {
        if (hasChecker(board, q, opponent) && distanceToBlot(q, blot, opponent) === die) {
            return true;
        }
    }
    return false;
}

/** Les deux dés `d1`+`d2` permettent-ils un tir indirect sur le blot ? */
function canHitIndirect(
    board: number[],
    blot: number,
    opponent: Player,
    d1: number,
    d2: number,
): boolean {
    const total = d1 + d2;
    for (let q = 1; q <= 24; q++) {
        if (!hasChecker(board, q, opponent)) continue;
        if (distanceToBlot(q, blot, opponent) !== total) continue;
        const mid1 = opponent === 'X' ? q - d1 : q + d1;
        const mid2 = opponent === 'X' ? q - d2 : q + d2;
        if (isLegalLanding(board, mid1, opponent) || isLegalLanding(board, mid2, opponent)) {
            return true;
        }
    }
    return false;
}

/** Résultat du comptage exact des tirs sur un blot. */
export interface ShotCount {
    /** Lancers (sur 36) qui frappent directement. */
    direct: number;
    /** Lancers (sur 36) qui frappent indirectement. */
    indirect: number;
    /** direct + indirect. */
    total: number;
}

/**
 * Compte exactement, sur les 36 combinaisons de dés, les tirs directs et
 * indirects sur un blot, en incluant les pions adverses sur la barre.
 *
 * @param board Plateau (26 entiers).
 * @param blot Flèche du blot (1..24).
 * @param opponent Joueur qui tire (l'adversaire du propriétaire du blot).
 * @returns `ShotCount` avec les comptes exacts.
 */
export function countShotsExact(board: number[], blot: number, opponent: Player): ShotCount {
    let direct = 0;
    let indirect = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            if (canHitDirect(board, blot, opponent, d1) || canHitDirect(board, blot, opponent, d2)) {
                direct++;
            } else if (canHitIndirect(board, blot, opponent, d1, d2)) {
                indirect++;
            }
        }
    }
    return { direct, indirect, total: direct + indirect };
}
