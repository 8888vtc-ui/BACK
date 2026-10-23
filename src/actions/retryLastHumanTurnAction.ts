/**
 * Micro-programme atomique : Rejouer le dernier coup humain (LOI 1 & LOI 3).
 *
 * Standard XG : si le joueur commet une imprécision ou un blunder, un bouton
 * "🔄 Rejouer ce coup" restaure instantanément le plateau sur le `boardBefore`
 * et les dés du tour, pour lui permettre de tester immédiatement le bon coup.
 *
 * Fonction PURE : extrait la position de restauration depuis la log immuable.
 */

import type { MatchLogEntry } from './types';
import type { Player } from '../engine/backgammonEngine';

export interface RetryLastHumanTurnParams {
    /** Journal immuable du match. */
    readonly matchLog: ReadonlyArray<MatchLogEntry>;
    /** Joueur connecté (par défaut 'X'). */
    readonly localPlayer?: Player;
}

export interface RetryLastHumanTurnResult {
    /** Plateau à restaurer (copie gelée), ou null si aucun tour humain. */
    readonly boardBefore: ReadonlyArray<number> | null;
    /** Dés du tour à rejouer. */
    readonly dice: readonly [number, number] | null;
    /** Index du tour à rejouer (turnIndex de l'entrée). */
    readonly turnIndex: number | null;
    /** Nombre d'entrées de log à tronquer (pour revenir avant le coup). */
    readonly truncateTo: number;
}

/**
 * Trouve le dernier tour du joueur connecté et retourne la position à restaurer.
 * Ne mute jamais la log : retourne seulement les données nécessaires au parent.
 */
export function retryLastHumanTurnAction(
    params: RetryLastHumanTurnParams,
): RetryLastHumanTurnResult {
    const { matchLog, localPlayer = 'X' } = params;

    // Parcourt la log à rebours pour trouver le dernier tour humain.
    for (let i = matchLog.length - 1; i >= 0; i--) {
        const entry = matchLog[i];
        if (entry.player !== localPlayer) continue;

        return {
            boardBefore: Object.freeze([...entry.boardBefore]),
            dice: Object.freeze([entry.dice[0], entry.dice[1]]) as readonly [number, number],
            turnIndex: entry.turnIndex,
            truncateTo: i,
        };
    }

    return { boardBefore: null, dice: null, turnIndex: null, truncateTo: matchLog.length };
}
