/**
 * Micro-programme atomique : Smart Click sur un pion (LOI 1 & LOI 5).
 *
 * Standard Backgammon Galaxy / XG : un clic gauche sur un pion jouable déplace
 * immédiatement ce pion avec le premier dé disponible (ou le dé le plus fort),
 * sans devoir cliquer sur le pion puis sur la flèche d'arrivée.
 *
 * Fonction PURE : aucun accès au DOM, aucun état React. Le composant visuel
 * se contente d'appeler cette fonction et d'exécuter le résultat.
 */

import type { Player } from '../engine/backgammonEngine';

export interface SmartClickParams {
    /** Flèche cliquée (0 = barre X, 25 = barre O, 1..24 = flèche). */
    readonly point: number;
    /** Destinations légales pour le dé 1. */
    readonly leftDieTargets: ReadonlyMap<number, ReadonlyArray<number>>;
    /** Destinations légales pour le dé 2. */
    readonly rightDieTargets: ReadonlyMap<number, ReadonlyArray<number>>;
    /** Dé actuellement préféré (0 ou 1). */
    readonly preferredDie: 0 | 1;
    /** Joueur au trait. */
    readonly player: Player;
}

export interface SmartClickResult {
    /** Coup à jouer immédiatement, ou null si le pion doit être sélectionné. */
    readonly move: { from: number; to: number; die: 0 | 1 } | null;
    /** Le pion doit-il être sélectionné (plusieurs destinations ambiguës) ? */
    readonly shouldSelect: boolean;
}

/**
 * Détermine l'action à exécuter lors d'un clic gauche sur un pion.
 *
 * Règles :
 * 1. Si le pion n'a qu'une seule destination légale → joue immédiatement.
 * 2. Si le pion a plusieurs destinations → sélectionne le pion (le joueur choisit).
 * 3. Le dé préféré est prioritaire ; sinon le premier dé disponible.
 */
export function smartClickCheckerAction(params: SmartClickParams): SmartClickResult {
    const { point, leftDieTargets, rightDieTargets, preferredDie } = params;

    const leftDests = leftDieTargets.get(point) ?? [];
    const rightDests = rightDieTargets.get(point) ?? [];

    // Aucune destination : rien à faire.
    if (leftDests.length === 0 && rightDests.length === 0) {
        return { move: null, shouldSelect: false };
    }

    // Priorité au dé préféré s'il a une destination.
    const preferredDests = preferredDie === 0 ? leftDests : rightDests;
    const otherDests = preferredDie === 0 ? rightDests : leftDests;

    if (preferredDests.length === 1) {
        return {
            move: { from: point, to: preferredDests[0], die: preferredDie },
            shouldSelect: false,
        };
    }
    if (preferredDests.length === 0 && otherDests.length === 1) {
        return {
            move: { from: point, to: otherDests[0], die: (1 - preferredDie) as 0 | 1 },
            shouldSelect: false,
        };
    }

    // Une seule destination globale (tous dés confondus) → joue immédiatement.
    const allDests = Array.from(new Set([...leftDests, ...rightDests]));
    if (allDests.length === 1) {
        const die: 0 | 1 = leftDests.includes(allDests[0]) ? 0 : 1;
        return { move: { from: point, to: allDests[0], die }, shouldSelect: false };
    }

    // Plusieurs destinations ambiguës : sélectionner le pion.
    return { move: null, shouldSelect: true };
}
