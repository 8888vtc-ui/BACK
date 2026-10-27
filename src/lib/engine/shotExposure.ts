/**
 * Exposition globale aux tirs & duplication — module pur.
 *
 * Contrairement à la somme des tirs blot par blot (qui compte deux fois un
 * lancer frappant deux blots), ce module calcule l'UNION exacte des lancers
 * adverses (sur 36) qui frappent au moins un blot, ainsi que la duplication :
 * les faces de dé qui frappent directement plusieurs blots à la fois.
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord, 0 any.
 */

import { Player } from '../../engine/backgammonEngine';
import { canHitDirect, computeDiceMatrix36 } from './shotCounter';

export interface DuplicatedNumber {
    /** Face de dé (1..6). */
    die: number;
    /** Blots frappés directement par cette face. */
    blots: number[];
}

export interface ShotExposure {
    /** Lancers distincts (sur 36) qui frappent au moins un blot. */
    totalRolls: number;
    /** Dont lancers frappant directement au moins un blot. */
    directRolls: number;
    /** Dont lancers frappant uniquement par un tir indirect. */
    indirectRolls: number;
    /** Faces de dé qui frappent directement au moins un blot. */
    hittingNumbers: number[];
    /** Faces de dé qui frappent directement 2 blots ou plus (duplication). */
    duplicatedNumbers: DuplicatedNumber[];
}

/**
 * Calcule l'exposition exacte des blots de `player` aux lancers de l'adversaire.
 */
export function computeShotExposure(board: number[], player: Player): ShotExposure {
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const matrix = computeDiceMatrix36(board, player);

    const hittingNumbers: number[] = [];
    const duplicatedNumbers: DuplicatedNumber[] = [];
    for (let die = 1; die <= 6; die++) {
        const blots = matrix.exposedBlots.filter((b) => canHitDirect(board, b, opponent, die));
        if (blots.length > 0) hittingNumbers.push(die);
        if (blots.length >= 2) duplicatedNumbers.push({ die, blots });
    }

    return {
        totalRolls: matrix.directHitsCount + matrix.indirectHitsCount,
        directRolls: matrix.directHitsCount,
        indirectRolls: matrix.indirectHitsCount,
        hittingNumbers,
        duplicatedNumbers,
    };
}
