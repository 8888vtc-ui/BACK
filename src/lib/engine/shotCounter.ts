/**
 * Comptage exact des tirs (shots) sur un blot & Matrice Grille 36 — module partagé.
 *
 * Énumère les 36 combinaisons de dés et compte, pour un blot donné, combien de
 * lancers permettent à l'adversaire de le frapper :
 *   - Tir direct : un seul dé atteint le blot (distance 1..6), ou un pion sur
 *     la barre entre sur le point du blot.
 *   - Tir indirect : la somme des deux dés atteint le blot, via un point
 *     intermédiaire légal (non bloqué).
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord, < 210 lignes, 0 any.
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
export function canHitDirect(board: number[], blot: number, opponent: Player, die: number): boolean {
    if (barCount(board, opponent) > 0) {
        const entry = barEntryPoint(opponent, die);
        if (entry === blot && isLegalLanding(board, entry, opponent)) {
            return true;
        }
    }
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

export interface DiceCell36 {
    d1: number;
    d2: number;
    status: 'safe' | 'direct_hit' | 'indirect_hit';
    hitBlots: number[];
}

export interface DiceMatrix36Result {
    cells: DiceCell36[];
    directHitsCount: number;
    indirectHitsCount: number;
    safeRollsCount: number;
    exposedBlots: number[];
}

/**
 * Calcule la matrice exacte 6x6 (Grille 36) de tous les tirages de l'IA au prochain tour
 * et identifie quels lancers frappent directement ou indirectement un blot de `player`.
 */
export function computeDiceMatrix36(
    board: ReadonlyArray<number>,
    player: Player = 'X',
): DiceMatrix36Result {
    const mutableBoard = [...board];
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const exposedBlots: number[] = [];

    if (mutableBoard.length >= 25) {
        for (let p = 1; p <= 24; p++) {
            const v = mutableBoard[p];
            if ((player === 'X' && v === 1) || (player === 'O' && v === -1)) {
                exposedBlots.push(p);
            }
        }
    }

    const cells: DiceCell36[] = [];
    let directHitsCount = 0;
    let indirectHitsCount = 0;

    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            let isDirect = false;
            let isIndirect = false;
            const hitBlots: number[] = [];

            for (const blot of exposedBlots) {
                if (
                    canHitDirect(mutableBoard, blot, opponent, d1) ||
                    canHitDirect(mutableBoard, blot, opponent, d2)
                ) {
                    isDirect = true;
                    hitBlots.push(blot);
                } else if (canHitIndirect(mutableBoard, blot, opponent, d1, d2)) {
                    isIndirect = true;
                    hitBlots.push(blot);
                }
            }

            const status: DiceCell36['status'] = isDirect
                ? 'direct_hit'
                : isIndirect
                  ? 'indirect_hit'
                  : 'safe';
            if (status === 'direct_hit') directHitsCount++;
            else if (status === 'indirect_hit') indirectHitsCount++;

            cells.push({ d1, d2, status, hitBlots });
        }
    }

    return {
        cells,
        directHitsCount,
        indirectHitsCount,
        safeRollsCount: 36 - directHitsCount - indirectHitsCount,
        exposedBlots,
    };
}
