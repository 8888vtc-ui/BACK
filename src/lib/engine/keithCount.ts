/**
 * Keith Count — calibration officielle de la course (Tom Keith, 1993).
 *
 * Le Keith Count est une méthode de comptage de pips ajustée, publiée et
 * validée publiquement, qui donne une décision de videau (double/take/pass)
 * fiable à ~90 % en course pure. Elle remplace les approximations empiriques
 * pour la phase RACE.
 *
 * Formule officielle (Tom Keith, 1993) :
 *   1. Pips bruts (Basic pip count) : somme des distances de chaque pion à sa sortie.
 *   2. Ajustements de gaspillage dans le jan intérieur :
 *      - +2 pips pour chaque pion au-delà de 1 sur la flèche 1 (point 1).
 *      - +1 pip pour chaque pion au-delà de 1 sur la flèche 2 (point 2).
 *      - +1 pip pour chaque pion au-delà de 3 sur la flèche 3 (point 3).
 *      - +1 pip pour chaque case vide (gap) sur les flèches 4, 5 et 6.
 *   3. Majoration du trait (+1/7e) & Décision de videau.
 *
 * Conforme à la charte de gouvernance : module pur, zéro effet de bord,
 * mathématiques du domaine public.
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
 * Calcule le Keith Count officiel d'un joueur selon la formule de Tom Keith (1993).
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
        const idx = player === 'X' ? point : 25 - point;
        const v = board[idx];
        return player === 'X' ? Math.max(0, v) : Math.max(0, -v);
    };

    // 1. +2 pips pour chaque pion au-delà de 1 sur la flèche 1
    const c1 = homeCount(1);
    if (c1 > 1) adjustments += 2 * (c1 - 1);

    // 2. +1 pip pour chaque pion au-delà de 1 sur la flèche 2
    const c2 = homeCount(2);
    if (c2 > 1) adjustments += 1 * (c2 - 1);

    // 3. +1 pip pour chaque pion au-delà de 3 sur la flèche 3
    const c3 = homeCount(3);
    if (c3 > 3) adjustments += 1 * (c3 - 3);

    // 4. +1 pip pour chaque case vide sur les flèches 4, 5 ou 6
    for (const point of [4, 5, 6]) {
        if (homeCount(point) === 0) {
            adjustments += 1;
        }
    }

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

    // En course moyenne/longue (kp >= 35), la formule officielle de Tom Keith ajoute 1/7e (+14.3 %) au Keith Count du doubleur :
    // - Seuil de double : ~ (kp / 7) - 2 pips (+1 pip pour un redouble)
    // - Seuil de passe (Drop) : > (kp / 7) + 2 pips
    // En course courte de sortie (kp < 35), les seuils directs (2/3 pips et > 4 pips) s'appliquent.
    const oneSeventh = kp >= 35 ? Math.round(kp / 7) : 0;
    const doubleThreshold = kp >= 35
        ? Math.max(isRedouble ? 3 : 2, oneSeventh - (isRedouble ? 1 : 2))
        : isRedouble ? 3 : 2;
    const dropThreshold = kp >= 35 ? oneSeventh + 2 : 4;

    if (lead >= doubleThreshold) {
        if (lead > dropThreshold) {
            return { action: 'Double, pass', lead };
        }
        return { action: 'Double, take', lead };
    }

    // Pas assez d'avance pour doubler.
    return { action: 'No double, take', lead };
}
