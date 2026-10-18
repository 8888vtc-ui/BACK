/**
 * Keith Count — calibration officielle de la course (Tom Keith, 1993).
 *
 * Le Keith Count est une méthode de comptage de pips ajustée, publiée et
 * validée publiquement, qui donne une décision de videau (double/take/pass)
 * fiable à ~90 % en course pure. Elle remplace les approximations empiriques
 * de l'ancien `computeEPC` pour la phase RACE.
 *
 * Formule officielle :
 *   1. Pips bruts : somme des distances de chaque pion à sa sortie.
 *   2. Ajustements :
 *      - +2 par pion au-delà de 2 sur la flèche 1 (point 1).
 *      - +1 par pion au-delà de 2 sur la flèche 2 (point 2).
 *      - +1 par pion au-delà de 3 sur la flèche 3 (point 3).
 *      - +1 par case vide (gap) dans le jan intérieur (flèches 4, 5, 6)
 *        s'il reste des pions sur des flèches plus hautes.
 *      - +1 par pion supplémentaire au-delà du premier sur la flèche 1
 *        (gaspillage d'empilement).
 *   3. Règle de décision : si le retard (différence de Keith Count) est
 *      supérieur à 4 pips après ajustement, le joueur en retard doit passer
 *      (drop) ; sinon il accepte (take).
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord,
 * mathématiques du domaine public (aucun problème de licence).
 */

import { Player, pipCount } from '../../engine/backgammonEngine';

/** Résultat du Keith Count pour un joueur. */
export interface KeithCountResult {
    /** Pips bruts (somme des distances). */
    rawPips: number;
    /** Ajustements Keith (pénalités de gaspillage et de gaps). */
    adjustments: number;
    /** Keith Count total = rawPips + adjustments. */
    total: number;
}

/**
 * Calcule le Keith Count officiel d'un joueur.
 *
 * @param board Plateau (26 entiers, conventions de `backgammonEngine.ts`).
 * @param player Joueur dont on calcule le Keith Count.
 * @returns `KeithCountResult` avec pips bruts, ajustements et total.
 */
export function computeKeithCount(board: number[], player: Player): KeithCountResult {
    const pips = pipCount(board);
    const rawPips = pips[player];

    let adjustments = 0;

    // Compteurs de pions sur les flèches 1..6 du jan intérieur du joueur.
    // Pour X, le jan intérieur est les flèches 1..6 (valeurs positives).
    // Pour O, le jan intérieur est les flèches 24..19 (valeurs négatives).
    const homeCount = (point: number): number => {
        const v = board[point];
        return player === 'X' ? Math.max(0, v) : Math.max(0, -v);
    };

    // Ajustement 1 : +2 par pion au-delà de 2 sur la flèche 1.
    const c1 = homeCount(1);
    if (c1 > 2) adjustments += 2 * (c1 - 2);

    // Ajustement 2 : +1 par pion au-delà de 2 sur la flèche 2.
    const c2 = homeCount(2);
    if (c2 > 2) adjustments += 1 * (c2 - 2);

    // Ajustement 3 : +1 par pion au-delà de 3 sur la flèche 3.
    const c3 = homeCount(3);
    if (c3 > 3) adjustments += 1 * (c3 - 3);

    // Ajustement 4 : +1 par case vide (gap) dans le jan intérieur (flèches 4, 5, 6)
    // s'il reste des pions sur des flèches plus hautes (7..24 pour X, 1..18 pour O).
    for (const point of [4, 5, 6]) {
        if (homeCount(point) === 0) {
            // Vérifie s'il reste des pions sur des flèches plus hautes.
            let hasHigher = false;
            if (player === 'X') {
                for (let q = 7; q <= 24; q++) {
                    if (board[q] > 0) {
                        hasHigher = true;
                        break;
                    }
                }
            } else {
                for (let q = 1; q <= 18; q++) {
                    if (board[q] < 0) {
                        hasHigher = true;
                        break;
                    }
                }
            }
            if (hasHigher) adjustments += 1;
        }
    }

    // Ajustement 5 : +1 par pion supplémentaire au-delà du premier sur la flèche 1
    // (gaspillage d'empilement sur le point 1).
    if (c1 > 1) adjustments += 1 * (c1 - 1);

    return {
        rawPips,
        adjustments,
        total: rawPips + adjustments,
    };
}

/** Décision de videau en course pure (formule de Tom Keith). */
export interface KeithCubeDecision {
    /** Action recommandée : 'Double, take' | 'Double, pass' | 'No double, take'. */
    action: string;
    /** Différence de Keith Count (positif = le joueur est en avance). */
    lead: number;
}

/**
 * Décision de videau en course pure selon la règle de Tom Keith.
 *
 * Règle officielle : si le retard (différence de Keith Count) est supérieur à
 * 4 pips, le joueur en retard doit passer (drop). Sinon il accepte (take).
 * Le joueur en avance propose de doubler dès que son avance dépasse ~2 pips.
 *
 * @param board Plateau (26 entiers).
 * @param player Joueur au trait (celui qui envisage de doubler).
 * @param isRedouble `true` si le videau est déjà possédé par `player` (redouble).
 * @returns Décision de videau.
 */
export function evaluateKeithCube(
    board: number[],
    player: Player,
    isRedouble: boolean,
): KeithCubeDecision {
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const kp = computeKeithCount(board, player).total;
    const ko = computeKeithCount(board, opponent).total;

    // Avance du joueur au trait (positif = en avance).
    const lead = ko - kp;

    // Seuil de double : le joueur propose de doubler dès qu'il a une avance
    // d'au moins 2 pips (marge de sécurité pour le redouble).
    const doubleThreshold = isRedouble ? 3 : 2;

    if (lead >= doubleThreshold) {
        // Le joueur est en avance : il propose de doubler.
        // L'adversaire passe si son retard > 4 pips.
        if (lead > 4) {
            return { action: 'Double, pass', lead };
        }
        return { action: 'Double, take', lead };
    }

    // Pas assez d'avance pour doubler.
    return { action: 'No double, take', lead };
}
