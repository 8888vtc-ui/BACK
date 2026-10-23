/**
 * Effective Pip Count (EPC) & Analyse de Course selon les standards
 * Walter Trice ("Backgammon Boot Camp", Ch. 14), eXtreme Gammon (XG2) et Tom Keith.
 * Module 100 % pur, déterministe, zéro any, zéro effet de bord.
 */

import { Player, pipCount, borneOffCount, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { bearoffExpectedRolls } from './bearoffTable';

/** Résultat détaillé du calcul d'Effective Pip Count pour un joueur. */
export interface EffectivePipResult {
    player: Player;
    rawPips: number;
    epc: number;
    wastage: number;
    expectedRolls: number;
    checkersRemaining: number;
    isBearOff: boolean;
}

/** Décision de videau basée sur l'EPC en course pure (Formule de Walter Trice). */
export interface RaceCubeEvaluation {
    isPureRace: boolean;
    leader: Player | 'TIED';
    epcLead: number;
    doubleWindow: number;
    takeWindow: number;
    action: 'No double, take' | 'Double, take' | 'Double, pass' | 'Too good to double';
    explanation: string;
}

/**
 * Détermine si la position actuelle est une course pure sans contact possible.
 * Le contact est rompu si la barre est vide et max(point_X) < min(point_O).
 */
export function isPureRace(board: number[]): boolean {
    if (board[X_BAR] > 0 || board[O_BAR] < 0) return false;

    let maxX = 0;
    for (let p = 24; p >= 1; p--) {
        if (board[p] > 0) {
            maxX = p;
            break;
        }
    }

    let minO = 25;
    for (let p = 1; p <= 24; p++) {
        if (board[p] < 0) {
            minO = p;
            break;
        }
    }

    // Si un joueur n'a plus de pion sur le plateau (tous sortis), c'est une course pure.
    if (maxX === 0 || minO === 25) {
        return true;
    }

    return maxX < minO;
}

/**
 * Vérifie si tous les pions restants d'un joueur sont dans son jan intérieur (bear-off).
 */
export function isBearOffPhase(board: number[], player: Player): boolean {
    if (player === 'X') {
        if (board[X_BAR] > 0) return false;
        for (let p = 7; p <= 24; p++) {
            if (board[p] > 0) return false;
        }
        return true;
    } else {
        if (board[O_BAR] < 0) return false;
        for (let p = 1; p <= 18; p++) {
            if (board[p] < 0) return false;
        }
        return true;
    }
}

/**
 * Extrait les compteurs de pions des flèches 1 à 6 du jan intérieur d'un joueur.
 * Retourne un tableau de 6 entiers indexé de 0 (flèche 1) à 5 (flèche 6).
 */
export function extractHomeCounts(board: number[], player: Player): number[] {
    const counts = new Array<number>(6).fill(0);
    if (player === 'X') {
        for (let i = 0; i < 6; i++) {
            counts[i] = Math.max(0, board[i + 1]);
        }
    } else {
        for (let i = 0; i < 6; i++) {
            counts[i] = Math.max(0, -board[24 - i]);
        }
    }
    return counts;
}

/**
 * Calcule l'Effective Pip Count (EPC) exact ou analytique pour un joueur.
 *
 * @param board Plateau de jeu (26 entiers).
 * @param player Joueur concerné ('X' ou 'O').
 */
export function calculateEffectivePipCount(board: number[], player: Player): EffectivePipResult {
    const pips = pipCount(board);
    const rawPips = pips[player];
    const borneOff = borneOffCount(board, player);
    const checkersRemaining = Math.max(0, 15 - borneOff);

    if (checkersRemaining === 0) {
        return {
            player,
            rawPips: 0,
            epc: 0,
            wastage: 0,
            expectedRolls: 0,
            checkersRemaining: 0,
            isBearOff: true,
        };
    }

    const isBearOff = isBearOffPhase(board, player);

    if (isBearOff) {
        // En bear-off pur, utilisation de la table exacte de lancers (précision 0.01)
        const homeCounts = extractHomeCounts(board, player);
        const rolls = bearoffExpectedRolls(homeCounts);
        // Formule canonique Trice : EPC = rolls * 7 + 1
        const epc = Number((rolls * 7 + 1).toFixed(2));
        const wastage = Number(Math.max(0, epc - rawPips).toFixed(2));

        return {
            player,
            rawPips,
            epc,
            wastage,
            expectedRolls: Number(rolls.toFixed(2)),
            checkersRemaining,
            isBearOff: true,
        };
    }

    // Course générale hors bear-off : formule de gaspillage de Trice / Keith
    // Wastage de base ~7.5 pips pour 15 pions, proportionnel aux pions restants.
    const baseWastage = 0.5 * checkersRemaining;

    // Pénalités de compression sur les points bas
    let cramPenalty = 0;
    const homeCounts = extractHomeCounts(board, player);
    // Point 1 : +2 par pion au-delà de 2
    if (homeCounts[0] > 2) cramPenalty += 2 * (homeCounts[0] - 2);
    // Point 2 : +1 par pion au-delà de 2
    if (homeCounts[1] > 2) cramPenalty += 1 * (homeCounts[1] - 2);
    // Point 3 : +1 par pion au-delà de 3
    if (homeCounts[2] > 3) cramPenalty += 1 * (homeCounts[2] - 3);

    // Pénalité pour points vides (trous) dans le jan intérieur s'il reste des pions derrière
    let gapPenalty = 0;
    for (let i = 3; i < 6; i++) {
        if (homeCounts[i] === 0) {
            gapPenalty += 1;
        }
    }

    const wastage = Number((baseWastage + cramPenalty + gapPenalty).toFixed(2));
    const epc = Number((rawPips + wastage).toFixed(2));
    const expectedRolls = Number((epc / 7.5).toFixed(2));

    return {
        player,
        rawPips,
        epc,
        wastage,
        expectedRolls,
        checkersRemaining,
        isBearOff: false,
    };
}

/**
 * Évalue la décision de videau en course pure via la formule de Walter Trice (8% Rule).
 *
 * @param board Plateau de jeu.
 * @param turn Joueur au trait envisageant de doubler.
 * @param isRedouble True si le videau est déjà détenu par le joueur au trait.
 */
export function evaluateRaceCube(
    board: number[],
    turn: Player,
    isRedouble = false,
): RaceCubeEvaluation {
    const race = isPureRace(board);
    const epcX = calculateEffectivePipCount(board, 'X');
    const epcO = calculateEffectivePipCount(board, 'O');

    const epcTurn = turn === 'X' ? epcX.epc : epcO.epc;
    const epcOpp = turn === 'X' ? epcO.epc : epcX.epc;

    const leader: Player | 'TIED' =
        epcX.epc < epcO.epc ? 'X' : epcO.epc < epcX.epc ? 'O' : 'TIED';

    const epcLead = Number(Math.abs(epcX.epc - epcO.epc).toFixed(2));
    const minEpc = Math.min(epcX.epc, epcO.epc);

    // Formule universelle de Trice :
    // Fenêtre de double D = max(2, round((Leader_EPC - 30) / 7))
    const triceD = Math.max(2, Math.round(Math.max(0, minEpc - 30) / 7));
    const doubleWindow = isRedouble ? triceD + 1 : triceD;
    const takeWindow = triceD + 2;

    const isTurnLeading = leader === turn;

    if (!race) {
        return {
            isPureRace: false,
            leader,
            epcLead,
            doubleWindow,
            takeWindow,
            action: 'No double, take',
            explanation: 'Position avec contact : les règles de course pure (EPC) ne s\'appliquent pas.',
        };
    }

    if (!isTurnLeading || epcLead < doubleWindow) {
        return {
            isPureRace: true,
            leader,
            epcLead,
            doubleWindow,
            takeWindow,
            action: 'No double, take',
            explanation: `Avance insuffisante (${epcLead} EPC vs seuil de double ${doubleWindow}). Pas de double.`,
        };
    }

    // Le joueur au trait mène et dépasse le seuil de double
    if (epcLead > takeWindow + 3) {
        return {
            isPureRace: true,
            leader,
            epcLead,
            doubleWindow,
            takeWindow,
            action: 'Too good to double',
            explanation: `Avance écrasante (${epcLead} EPC > ${takeWindow + 3}) : trop fort pour doubler, visez le gammon.`,
        };
    }

    if (epcLead > takeWindow) {
        return {
            isPureRace: true,
            leader,
            epcLead,
            doubleWindow,
            takeWindow,
            action: 'Double, pass',
            explanation: `Avance gagnante (${epcLead} EPC > seuil de prise ${takeWindow}) : Doublez, l'adversaire doit passer.`,
        };
    }

    return {
        isPureRace: true,
        leader,
        epcLead,
        doubleWindow,
        takeWindow,
        action: 'Double, take',
        explanation: `Zone de videau idéale (${epcLead} EPC dans la fenêtre [${doubleWindow}..${takeWindow}]) : Double / Take.`,
    };
}
