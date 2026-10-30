/**
 * Règles pures et sécurité de manipulation du Videau (Audit 9 / 20 — Cube Safety).
 *
 * Exigences :
 *   1. Positionnement strict sur la barre ou le bord extérieur sans jamais chevaucher une flèche (`1..24`).
 *   2. Calcul explicite de la transition de valeur (`1 -> 2`, `2 -> 4`, `4 -> 8`…) et de l'enjeu au score.
 *   3. Délai de sécurité anti-misclick de `CUBE_SAFETY_DELAY_MS = 250 ms` et espacement franc
 *      entre les boutons « Accepter (Take) » et « Passer (Drop) ».
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import type { Player } from './backgammonEngine';
import { isInitialBoardPosition } from '../features/openings/openingDatabase';

/** Délai de verrouillage anti-misclick à l'apparition de la modale de videau (ms). */
export const CUBE_SAFETY_DELAY_MS = 250;

/** Espacement minimal garanti (en px) entre les boutons Take et Pass. */
export const CUBE_BUTTON_MIN_GAP_PX = 20;

/** Valeur maximale réglementaire du videau en tournoi. */
export const MAX_TOURNAMENT_CUBE_VALUE = 64;

export type CubePositionZone = 'middle' | 'top' | 'bottom';

/**
 * Calcule la prochaine valeur du videau lors d'une proposition de double (`1 -> 2`, `2 -> 4`, etc.).
 */
export function computeNextCubeValue(currentValue: number): number {
    const safeCurrent = Math.max(1, Math.trunc(currentValue));
    if (safeCurrent === 1) return 2;
    return Math.min(MAX_TOURNAMENT_CUBE_VALUE, safeCurrent * 2);
}

/**
 * Formate explicitement la transition du videau (ex: `"2 → 4"`).
 */
export function formatCubeTransition(currentValue: number): string {
    const safeCurrent = Math.max(1, Math.trunc(currentValue));
    const next = computeNextCubeValue(safeCurrent);
    return `${safeCurrent} → ${next}`;
}

/**
 * Détermine le logement dédié du videau sur la barre centrale / bord extérieur
 * afin qu'il ne chevauche jamais une flèche de jeu (`1..24`).
 */
export function getCubePositionZone(cubeOwner: Player | null): CubePositionZone {
    if (cubeOwner === 'O') return 'top';
    if (cubeOwner === 'X') return 'bottom';
    return 'middle';
}

export interface CubeEligibilityParams {
    readonly turn: Player;
    readonly cubeValue: number;
    readonly cubeOwner: Player | null;
    readonly hasRolledDice: boolean;
    readonly isCrawford: boolean;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly matchLength: number;
    readonly isOpeningPosition?: boolean;
    readonly board?: ReadonlyArray<number>;
}

/**
 * Vérifie selon les règles officielles WBF / XG2 si le joueur au trait a le droit
 * de proposer le videau (hors position initiale d'ouverture WBF 5.1, hors Crawford,
 * hors DMP, hors Dead Cube, avant de lancer les dés).
 */
export function canPlayerOfferDouble(params: CubeEligibilityParams): boolean {
    const {
        turn,
        cubeValue,
        cubeOwner,
        hasRolledDice,
        isCrawford,
        scoreX,
        scoreO,
        matchLength,
        isOpeningPosition,
        board,
    } = params;

    if (hasRolledDice) return false;
    if (isOpeningPosition) return false;
    if (board && isInitialBoardPosition(board as number[])) return false;
    if (isCrawford) return false;
    if (cubeValue >= MAX_TOURNAMENT_CUBE_VALUE) return false;
    if (cubeOwner !== null && cubeOwner !== turn) return false;

    if (matchLength > 0) {
        if (scoreX >= matchLength || scoreO >= matchLength) return false;
        // Double Match Point (DMP)
        if (scoreX === matchLength - 1 && scoreO === matchLength - 1) return false;
        // Règle du Dead Cube : le joueur au trait a déjà assez de points avec le videau actuel pour gagner le match
        const activePlayerScore = turn === 'X' ? scoreX : scoreO;
        if (activePlayerScore + cubeValue >= matchLength) return false;
    }

    return true;
}
