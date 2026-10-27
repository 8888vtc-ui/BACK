/**
 * Effective Pip Count (EPC) & Analyse de Course selon les standards
 * Walter Trice ("Backgammon Boot Camp", Ch. 14), eXtreme Gammon (XG2) et Tom Keith.
 * Module 100 % pur, déterministe, zéro any, zéro effet de bord.
 */

import { Player, pipCount, borneOffCount, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { bearoffExpectedRolls } from './bearoffTable';

/** Constantes exactes du dé de Backgammon (avec règle des doubles joués 4 fois). */
export const MEAN_PIPS_PER_ROLL = 49 / 6; // ~8.1666667 pips/lancer
export const VAR_PIPS_PER_ROLL = 665 / 36; // ~18.4722222 pips^2
export const HALF_ROLL_PIPS = 49 / 12; // ~4.0833333 pips (correction de continuité du trait)
export const RENEWAL_PIP_VAR_FACTOR = 95 / 42; // sigma^2 / mu (~2.2619048)

/** Résultat de l'évaluation de course par la méthode Isight d'Axel Reichert (BGBlitz). */
export interface IsightRaceEvaluation {
    readonly rollerRawPips: number;
    readonly opponentRawPips: number;
    readonly rollerAdjustedPips: number;
    readonly opponentAdjustedPips: number;
    readonly criteriaTotal: number;
    readonly pointOfLastTake: number;
    readonly initialDoubleThreshold: number;
    readonly redoubleThreshold: number;
    readonly moneyDecision: 'NO_DOUBLE' | 'DOUBLE_TAKE' | 'REDOUBLE_TAKE' | 'DOUBLE_PASS';
    readonly cpwPiecewisePercent: number;
}

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
        // Formule exacte de Trice : EPC = E(rolls) * (49 / 6) (~8.1667 pips/lancer)
        const epc = Number((rolls * MEAN_PIPS_PER_ROLL).toFixed(2));
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
    const expectedRolls = Number((epc / MEAN_PIPS_PER_ROLL).toFixed(2));

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
 */
export function evaluateRaceCube(
    board: number[],
    turn: Player,
    isRedouble = false,
): RaceCubeEvaluation {
    const race = isPureRace(board);
    const epcX = calculateEffectivePipCount(board, 'X');
    const epcO = calculateEffectivePipCount(board, 'O');

    const leader: Player | 'TIED' =
        epcX.epc < epcO.epc ? 'X' : epcO.epc < epcX.epc ? 'O' : 'TIED';

    const epcLead = Number(Math.abs(epcX.epc - epcO.epc).toFixed(2));
    const minEpc = Math.min(epcX.epc, epcO.epc);

    // Formule universelle de Trice : D = max(2, round((Leader_EPC - 30) / 7))
    const triceD = Math.max(2, Math.round(Math.max(0, minEpc - 30) / 7));
    const doubleWindow = isRedouble ? triceD + 1 : triceD;
    const takeWindow = triceD + 2;
    const isTurnLeading = leader === turn;

    if (!race) {
        return {
            isPureRace: false, leader, epcLead, doubleWindow, takeWindow,
            action: 'No double, take',
            explanation: 'Position avec contact : les règles de course pure (EPC) ne s\'appliquent pas.',
        };
    }

    if (!isTurnLeading || epcLead < doubleWindow) {
        return {
            isPureRace: true, leader, epcLead, doubleWindow, takeWindow,
            action: 'No double, take',
            explanation: `Avance insuffisante (${epcLead} EPC vs seuil de double ${doubleWindow}). Pas de double.`,
        };
    }

    if (epcLead > takeWindow + 3) {
        return {
            isPureRace: true, leader, epcLead, doubleWindow, takeWindow,
            action: 'Too good to double',
            explanation: `Avance écrasante (${epcLead} EPC > ${takeWindow + 3}) : trop fort pour doubler, visez le gammon.`,
        };
    }

    if (epcLead > takeWindow) {
        return {
            isPureRace: true, leader, epcLead, doubleWindow, takeWindow,
            action: 'Double, pass',
            explanation: `Avance gagnante (${epcLead} EPC > seuil de prise ${takeWindow}) : Doublez, l'adversaire doit passer.`,
        };
    }

    return {
        isPureRace: true, leader, epcLead, doubleWindow, takeWindow,
        action: 'Double, take',
        explanation: `Zone de videau idéale (${epcLead} EPC dans la fenêtre [${doubleWindow}..${takeWindow}]) : Double / Take.`,
    };
}

/**
 * Fonction de répartition de la loi normale standard Phi(z) (Abramowitz & Stegun 7.1.26, erreur < 1.5e-7).
 */
export function standardNormalCDF(z: number): number {
    if (z < -8.0) return 0.0;
    if (z > 8.0) return 1.0;

    const sign = z < 0 ? -1 : 1;
    const x = Math.abs(z) / Math.SQRT2;
    const p = 0.3275911;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;

    const t = 1.0 / (1.0 + p * x);
    const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
    const erf = 1.0 - poly * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * erf);
}

/**
 * Calcule la probabilité exacte de victoire en course P(Win) corrigée de la variance selon Walter Trice.
 * Le gaspillage (wastage) réduit la variance spatiale d'un facteur alpha_roll = 0.25.
 */
export function computeTriceNormalWinProbability(params: {
    rollerEPC: number;
    opponentEPC: number;
    rollerRawPips?: number;
    opponentRawPips?: number;
}): { winProb: number; zScore: number } {
    const X = params.rollerEPC;
    const Y = params.opponentEPC;
    const rpcX = params.rollerRawPips ?? X;
    const rpcY = params.opponentRawPips ?? Y;
    const wastageX = Math.max(0, X - rpcX);
    const wastageY = Math.max(0, Y - rpcY);

    const D = Y - X + HALF_ROLL_PIPS;
    const effectiveVariancePips = Math.max(
        4.0,
        RENEWAL_PIP_VAR_FACTOR * (rpcX + rpcY + 0.25 * (wastageX + wastageY)),
    );
    const zScore = D / Math.sqrt(effectiveVariancePips);
    const winProb = Math.max(0.0001, Math.min(0.9999, standardNormalCDF(zScore)));
    return { winProb, zScore };
}

/**
 * Évalue une course pure selon l'algorithme complet Isight d'Axel Reichert (BGBlitz).
 */
export function evaluateIsightRace(board: number[], turn: Player): IsightRaceEvaluation {
    const opp: Player = turn === 'X' ? 'O' : 'X';
    const getCount = (p: Player, relPt: number): number => {
        const idx = p === 'X' ? relPt : 25 - relPt;
        const v = board[idx] ?? 0;
        return p === 'X' ? Math.max(0, v) : Math.max(0, -v);
    };

    const stats = (p: Player) => {
        let rawPips = 0;
        let totalCheckers = 0;
        let crossovers = 0;
        for (let pt = 1; pt <= 24; pt++) {
            const c = getCount(p, pt);
            if (c > 0) {
                rawPips += pt * c;
                totalCheckers += c;
                if (pt > 6) crossovers += c * Math.floor((pt - 1) / 6);
            }
        }
        const stackPenalty =
            2 * Math.max(0, getCount(p, 1) - 2) +
            1 * Math.max(0, getCount(p, 2) - 2) +
            1 * Math.max(0, getCount(p, 3) - 3);
        return { rawPips, totalCheckers, crossovers, stackPenalty };
    };

    const sR = stats(turn);
    const sO = stats(opp);

    let rGap = 0;
    let oGap = 0;
    for (const pt of [4, 5, 6]) {
        if (getCount(turn, pt) === 0 && getCount(opp, pt) > 0) rGap += 1;
        if (getCount(opp, pt) === 0 && getCount(turn, pt) > 0) oGap += 1;
    }

    const l =
        sR.rawPips +
        Math.max(0, sR.totalCheckers - sO.totalCheckers) +
        sR.stackPenalty +
        rGap +
        Math.max(0, sR.crossovers - sO.crossovers);

    const t =
        sO.rawPips +
        Math.max(0, sO.totalCheckers - sR.totalCheckers) +
        sO.stackPenalty +
        oGap +
        Math.max(0, sO.crossovers - sR.crossovers);

    const criteriaTotal = Number((l + l / 6).toFixed(2));
    const pointOfLastTake = Number((criteriaTotal - 2).toFixed(2));
    const redoubleThreshold = Number((criteriaTotal - 5).toFixed(2));
    const initialDoubleThreshold = Number((criteriaTotal - 6).toFixed(2));

    let moneyDecision: IsightRaceEvaluation['moneyDecision'] = 'NO_DOUBLE';
    if (t > pointOfLastTake) moneyDecision = 'DOUBLE_PASS';
    else if (t >= redoubleThreshold) moneyDecision = 'REDOUBLE_TAKE';
    else if (t >= initialDoubleThreshold) moneyDecision = 'DOUBLE_TAKE';

    const deltaL = t - l;
    const cpwPiecewisePercent = Number(
        Math.max(
            0,
            Math.min(100, l <= 50 ? 84 - 0.4 * l + 2 * deltaL : 74 - 0.2 * l + 2 * deltaL),
        ).toFixed(2),
    );

    return {
        rollerRawPips: sR.rawPips,
        opponentRawPips: sO.rawPips,
        rollerAdjustedPips: l,
        opponentAdjustedPips: t,
        criteriaTotal,
        pointOfLastTake,
        initialDoubleThreshold,
        redoubleThreshold,
        moneyDecision,
        cpwPiecewisePercent,
    };
}
