/**
 * Modèle de Rick Janowski (1993) Raffiné par Phase de Jeu (GNU Backgammon / eXtreme Gammon).
 *
 * Calcule :
 * - Les valeurs moyennes de victoire (W) et de défaite (L) et l'équité cubeless E_cl.
 * - Les seuils exacts Take Point (TP), Cash Point (CP), Redouble Point (RD) et Initial Double Point (ID).
 * - L'efficacité du videau asymétrique (x1, x2) calibrée par phase de jeu (Race, Blitz, Prime, Holding, Crashed, Backgame).
 * - L'équité cubeful par interpolation linéaire par morceaux (GNUbg) entre E_dead et E_live.
 *
 * Module 100 % pur, déterministe, zéro dépendance externe.
 */

import { Player, pipCount, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import type { Probabilities } from './types';

export type JanowskiGamePhase =
    | 'BEAROFF'
    | 'PURE_RACE'
    | 'RACE'
    | 'HOLDING_GAME'
    | 'PRIME_VS_PRIME'
    | 'BLITZ'
    | 'CRASHED_BOARD'
    | 'BACKGAME'
    | 'CONTACT';

export type JanowskiPositionPhase = JanowskiGamePhase;

export type JanowskiCubeOwner = 'CENTERED' | 'PLAYER' | 'OPPONENT';

export interface CubeEfficiencyPair {
    /** Efficacité du videau x1 du joueur au trait / preneur. */
    readonly x1: number;
    /** Efficacité du videau x2 de l'adversaire. */
    readonly x2: number;
}

export interface JanowskiCubeEvaluation {
    readonly phase: JanowskiGamePhase;
    readonly efficiency: CubeEfficiencyPair;
    readonly cubeEfficiency: number;
    readonly doublePoint: number;
    readonly cashPoint: number;
    readonly W: number;
    readonly L: number;
    readonly cubelessEquity: number;
    readonly liveCubeEquity: number;
    readonly cubefulEquity: number;
    readonly takePointDead: number;
    readonly takePointLive: number;
    readonly takePointGeneral: number;
    readonly cashPointDead: number;
    readonly cashPointLive: number;
    readonly cashPointGeneral: number;
    readonly redoublePointGeneral: number;
    readonly initialDoublePointGeneral: number;
    readonly optimalCubeAction:
        | 'NO_DOUBLE'
        | 'DOUBLE_TAKE'
        | 'DOUBLE_PASS'
        | 'REDOUBLE_TAKE'
        | 'REDOUBLE_PASS';
}

const EPSILON = 1e-9;

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

/**
 * Détecte la phase stratégique fine d'un plateau pour le calibrage de Janowski (x1, x2).
 */
export function detectJanowskiPhase(board: number[], player: Player): JanowskiGamePhase {
    const barX = board[X_BAR] ?? 0;
    const barO = board[O_BAR] ?? 0;

    let furthestO = 0;
    for (let p = 1; p <= 24; p++) {
        if (board[p] < 0) {
            furthestO = p;
            break;
        }
    }
    let furthestX = 25;
    for (let p = 24; p >= 1; p--) {
        if (board[p] > 0) {
            furthestX = p;
            break;
        }
    }

    const hasContact = furthestX > furthestO || barX > 0 || barO < 0;
    if (!hasContact) {
        const isBearOff =
            player === 'X'
                ? board.slice(7, 25).every((v) => v <= 0)
                : board.slice(1, 19).every((v) => v >= 0);
        return isBearOff ? 'BEAROFF' : 'PURE_RACE';
    }

    let xOnBoard = 0;
    let oOnBoard = 0;
    let xStackedLow = 0;
    let oStackedLow = 0;
    let playerHomePoints = 0;
    let oppHomePoints = 0;
    let playerAnchorsInOppHome = 0;
    let oppAnchorsInPlayerHome = 0;
    let playerLongestPrime = 0;
    let oppLongestPrime = 0;
    let curPPrime = 0;
    let curOPrime = 0;

    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const countX = Math.max(0, v);
        const countO = Math.max(0, -v);
        xOnBoard += countX;
        oOnBoard += countO;
        if (p <= 2) xStackedLow += countX;
        if (p >= 23) oStackedLow += countO;

        const pCount = player === 'X' ? countX : countO;
        const oCount = player === 'X' ? countO : countX;

        if (pCount >= 2) {
            curPPrime++;
            if (curPPrime > playerLongestPrime) playerLongestPrime = curPPrime;
        } else {
            curPPrime = 0;
        }
        if (oCount >= 2) {
            curOPrime++;
            if (curOPrime > oppLongestPrime) oppLongestPrime = curOPrime;
        } else {
            curOPrime = 0;
        }

        const isPHome = player === 'X' ? p <= 6 : p >= 19;
        const isOHome = player === 'X' ? p >= 19 : p <= 6;
        if (isPHome && pCount >= 2) playerHomePoints++;
        if (isOHome && oCount >= 2) oppHomePoints++;
        if (isOHome && pCount >= 2) playerAnchorsInOppHome++;
        if (isPHome && oCount >= 2) oppAnchorsInPlayerHome++;
    }

    if (xOnBoard <= 6 || oOnBoard <= 6 || xStackedLow > 7 || oStackedLow > 7) {
        return 'CRASHED_BOARD';
    }
    if (playerAnchorsInOppHome >= 2 || oppAnchorsInPlayerHome >= 2) {
        return 'BACKGAME';
    }
    const oppOnBar = player === 'X' ? Math.max(0, -barO) : Math.max(0, barX);
    const playerOnBar = player === 'X' ? Math.max(0, barX) : Math.max(0, -barO);
    if ((oppOnBar > 0 && playerHomePoints >= 3) || (playerOnBar > 0 && oppHomePoints >= 3)) {
        return 'BLITZ';
    }
    if (playerLongestPrime >= 4 && oppLongestPrime >= 4) {
        return 'PRIME_VS_PRIME';
    }
    if (playerAnchorsInOppHome === 1 || oppAnchorsInPlayerHome === 1) {
        return 'HOLDING_GAME';
    }
    return 'CONTACT';
}

/**
 * Retourne le couple d'efficacité du videau (x1, x2) calibré selon la phase de jeu (GNUbg / XG2).
 */
export function getCalibratedCubeEfficiency(
    phase: JanowskiGamePhase,
    options: { rollerPipCount?: number; isPlayerLeaderOrAttacker?: boolean } = {},
): CubeEfficiencyPair {
    if (phase === 'BEAROFF') {
        return { x1: 0.6, x2: 0.6 };
    }
    if (phase === 'PURE_RACE') {
        const pips = options.rollerPipCount ?? 80;
        const xRace =
            pips <= 40
                ? 0.6
                : pips >= 120
                  ? 0.7
                  : Number((0.6 + 0.1 * ((pips - 40) / 80)).toFixed(4));
        return { x1: xRace, x2: xRace };
    }

    const isLeader = options.isPlayerLeaderOrAttacker ?? true;
    switch (phase) {
        case 'HOLDING_GAME':
            return isLeader ? { x1: 0.63, x2: 0.57 } : { x1: 0.57, x2: 0.63 };
        case 'PRIME_VS_PRIME':
            return { x1: 0.68, x2: 0.68 };
        case 'BLITZ':
            return isLeader ? { x1: 0.74, x2: 0.58 } : { x1: 0.58, x2: 0.74 };
        case 'CRASHED_BOARD':
            return { x1: 0.65, x2: 0.65 };
        case 'BACKGAME':
            return isLeader ? { x1: 0.63, x2: 0.54 } : { x1: 0.54, x2: 0.63 };
        default:
            return { x1: 0.68, x2: 0.68 };
    }
}

/**
 * Interpolation linéaire par morceaux de GNU Backgammon pour l'équité à videau pleinement vivant E_live(p).
 */
export function computePiecewiseLiveEquity(
    p: number,
    W: number,
    L: number,
    tpLive: number,
    cpLive: number,
    cubeOwner: JanowskiCubeOwner = 'CENTERED',
): number {
    const vertices: Array<{ x: number; y: number }> = [{ x: 0, y: -L }];
    if (cubeOwner === 'CENTERED' || cubeOwner === 'OPPONENT') {
        vertices.push({ x: clamp(tpLive, 0.01, 0.98), y: -1.0 });
    }
    if (cubeOwner === 'CENTERED' || cubeOwner === 'PLAYER') {
        vertices.push({ x: clamp(cpLive, 0.02, 0.99), y: 1.0 });
    }
    vertices.push({ x: 1.0, y: W });

    for (let i = 0; i < vertices.length - 1; i++) {
        const v0 = vertices[i];
        const v1 = vertices[i + 1];
        if (p >= v0.x && p <= v1.x) {
            const span = v1.x - v0.x;
            if (span <= EPSILON) return v0.y;
            return v0.y + ((p - v0.x) / span) * (v1.y - v0.y);
        }
    }
    return p <= 0 ? -L : W;
}

/**
 * Évalue complètement la position selon le modèle de Janowski raffiné par phase.
 */
export function computeJanowskiCubeEvaluation(
    probs: Probabilities,
    phase: JanowskiGamePhase,
    options: {
        cubeOwner?: JanowskiCubeOwner;
        rollerPipCount?: number;
        board?: number[];
        player?: Player;
    } = {},
): JanowskiCubeEvaluation {
    const pW = clamp(probs.win, 0, 1);
    const pL = 1 - pW;
    const pWG = clamp(probs.winGammon, 0, pW);
    const pWBG = clamp(probs.winBackgammon, 0, pWG);
    const pLG = clamp(probs.loseGammon, 0, pL);
    const pLBG = clamp(probs.loseBackgammon, 0, pLG);

    const W = pW > EPSILON ? (pW + pWG + pWBG) / pW : 1 + pWG + pWBG;
    const L = pL > EPSILON ? (pL + pLG + pLBG) / pL : 1 + pLG + pLBG;
    const cubelessEquity = pW * (W + L) - L;

    const rollerPips =
        options.rollerPipCount ??
        (options.board && options.player ? pipCount(options.board)[options.player] : 80);
    const efficiency = getCalibratedCubeEfficiency(phase, {
        rollerPipCount: rollerPips,
        isPlayerLeaderOrAttacker: cubelessEquity >= 0,
    });
    const { x1, x2 } = efficiency;
    const xSym = 0.5 * (x1 + x2);

    const takePointDead = (L - 0.5) / (W + L);
    const takePointLive = (L - 0.5) / (W + L + 0.5);
    const takePointGeneral = (L - 0.5) / (W + L + 0.5 * x1);

    const cashPointDead = (L + 0.5) / (W + L);
    const cashPointLive = (L + 1.0) / (W + L + 0.5);
    const cashPointGeneral = (L + 0.5 + 0.5 * x2) / (W + L + 0.5 * x2);

    const redoublePointGeneral = (L + 0.5 * x1) / Math.max(0.2, W + L + 0.5 * x1 - 1.0);

    const denomID = W + L + 0.5 * x2 - 0.5 * x1 - 1.0;
    let initialDoublePointGeneral: number;
    if (Math.abs(denomID) > EPSILON) {
        const G =
            (W + L + 0.5 * x1) * (L + 0.5 * x2) +
            (W + L + 0.5 * x2 - 0.5 * x1 - 1.0) * (L + 0.5 * x2);
        initialDoublePointGeneral = (L + 0.5 * x2 - Math.sqrt(Math.max(0, G))) / denomID;
    } else {
        initialDoublePointGeneral = (L - 0.25) / Math.max(0.2, W + L - 0.5);
    }

    const cubeOwner = options.cubeOwner ?? 'CENTERED';
    const liveCubeEquity = computePiecewiseLiveEquity(
        pW,
        W,
        L,
        takePointLive,
        cashPointLive,
        cubeOwner,
    );
    const cubefulEquity = clamp(cubelessEquity * (1 - xSym) + liveCubeEquity * xSym, -1.0, 1.0);

    let optimalCubeAction: JanowskiCubeEvaluation['optimalCubeAction'] = 'NO_DOUBLE';
    if (cubeOwner === 'CENTERED') {
        if (pW >= cashPointGeneral) optimalCubeAction = 'DOUBLE_PASS';
        else if (pW >= initialDoublePointGeneral) optimalCubeAction = 'DOUBLE_TAKE';
    } else if (cubeOwner === 'PLAYER') {
        if (pW >= cashPointGeneral) optimalCubeAction = 'REDOUBLE_PASS';
        else if (pW >= redoublePointGeneral) optimalCubeAction = 'REDOUBLE_TAKE';
    }

    return {
        phase,
        efficiency,
        cubeEfficiency: xSym,
        doublePoint: Number(clamp(initialDoublePointGeneral, 0, 1).toFixed(4)),
        cashPoint: Number(clamp(cashPointGeneral, 0, 1).toFixed(4)),
        W,
        L,
        cubelessEquity: Number(cubelessEquity.toFixed(4)),
        liveCubeEquity: Number(liveCubeEquity.toFixed(4)),
        cubefulEquity: Number(cubefulEquity.toFixed(4)),
        takePointDead: Number(clamp(takePointDead, 0, 1).toFixed(4)),
        takePointLive: Number(clamp(takePointLive, 0, 1).toFixed(4)),
        takePointGeneral: Number(clamp(takePointGeneral, 0, 1).toFixed(4)),
        cashPointDead: Number(clamp(cashPointDead, 0, 1).toFixed(4)),
        cashPointLive: Number(clamp(cashPointLive, 0, 1).toFixed(4)),
        cashPointGeneral: Number(clamp(cashPointGeneral, 0, 1).toFixed(4)),
        redoublePointGeneral: Number(clamp(redoublePointGeneral, 0, 1).toFixed(4)),
        initialDoublePointGeneral: Number(clamp(initialDoublePointGeneral, 0, 1).toFixed(4)),
        optimalCubeAction,
    };
}

/**
 * Formule fermée d'approximation de la Table d'Équité de Match (MET) de Rick Janowski (Révisée 2013).
 *
 * - Pré-Crawford normal (L_away >= 2, T_away >= 2) :
 *     M_leader = 0.5 + 0.87 * (D / (T + 6))
 *   avec L_eff = 3.1 si L_away === 3, et écrêtage M' = 0.66*M + 0.33 lorsque M > 0.88.
 * - Partie de Crawford (L_away = 1, T_away >= 2) :
 *     M_Crawford = 0.525 + 0.57 * ((T - 1) / (T + 2))
 * - Post-Crawford (L_away = 1, T_away >= 2) :
 *     À 1-away 2-away Post-Crawford, M(1, 2) = 0.512 (allocation Free Drop de 1.2 %
 *     qui diminue de 20 % de sa valeur maximale à chaque score pair subséquent jusqu'à T = 14).
 */
export function computeJanowskiMatchEquity(params: {
    readonly playerAway: number;
    readonly opponentAway: number;
    readonly crawfordState?: 'PRE_CRAWFORD' | 'CRAWFORD' | 'POST_CRAWFORD';
}): number {
    const pAway = Math.max(1, Math.round(params.playerAway));
    const oAway = Math.max(1, Math.round(params.opponentAway));
    if (pAway === oAway) return 0.5;

    const playerIsLeader = pAway < oAway;
    const leaderAway = playerIsLeader ? pAway : oAway;
    const trailerAway = playerIsLeader ? oAway : pAway;
    const state = params.crawfordState ?? 'PRE_CRAWFORD';

    let leaderMwc: number;
    if (leaderAway === 1 && state === 'CRAWFORD') {
        leaderMwc = 0.525 + 0.57 * ((trailerAway - 1) / (trailerAway + 2));
    } else if (leaderAway === 1 && state === 'POST_CRAWFORD') {
        if (trailerAway === 2) {
            leaderMwc = 0.512;
        } else {
            const base = 0.5 + 0.57 * ((trailerAway - 1.5) / (trailerAway + 2));
            const evenBonus =
                trailerAway % 2 === 0 && trailerAway < 14
                    ? 0.012 * Math.max(0, 1 - 0.2 * ((trailerAway - 2) / 2))
                    : 0;
            leaderMwc = base + evenBonus;
        }
    } else {
        const effectiveLeader = leaderAway === 3 ? 3.1 : leaderAway;
        const d = trailerAway - effectiveLeader;
        const rawM = 0.5 + 0.87 * (d / (trailerAway + 6));
        leaderMwc = rawM > 0.88 ? 0.66 * rawM + 0.33 : rawM;
    }

    const clampedLeader = clamp(leaderMwc, 0.5, 0.995);
    return Number((playerIsLeader ? clampedLeader : 1 - clampedLeader).toFixed(4));
}

/**
 * Calcule le Take Point à videau vivant au niveau 1 en Match Play par induction rétrograde
 * sur les niveaux de videau [TP_1, TP_2, TP_4, TP_8, TP_16] :
 *   TP_1^live = TP_1 - TP_1*TP_2 + TP_1*TP_2*TP_4 - TP_1*TP_2*TP_4*TP_8 + TP_1*TP_2*TP_4*TP_8*TP_16
 */
export function computeRetrogradeLiveCubeTakePoint(
    deadTakePointsByCubeLevel: ReadonlyArray<number>,
): number {
    if (deadTakePointsByCubeLevel.length === 0) return 0.2;
    let total = 0;
    let product = 1;
    for (let i = 0; i < Math.min(5, deadTakePointsByCubeLevel.length); i++) {
        const tpK = clamp(deadTakePointsByCubeLevel[i] ?? 0.25, 0, 1);
        product *= tpK;
        const sign = i % 2 === 0 ? 1 : -1;
        total += sign * product;
    }
    return Number(clamp(total, 0.05, 0.95).toFixed(4));
}

