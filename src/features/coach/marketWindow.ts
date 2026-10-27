/**
 * Calcul exact des métriques de la fenêtre de marché (Market Window) et des Market Losers.
 *
 * Conforme à la théorie moderne du Backgammon (Kit Woolsey, Danny Kleinman, Robertie) :
 * - Double Point : seuil d'opportunité d'initier un double
 * - Cash Point : seuil d'abandon adverse (1 - Take Point adverse)
 * - Market Losers exacts : compte exact sur 36 des lancers adverses après lesquels
 *   l'adversaire passe le videau au tour suivant.
 */

import {
    generateLegalMoves,
    type BoardState,
    type Player,
} from '../../engine/backgammonEngine';
import { DISTINCT_DICE_ROLLS_21 } from '../../lib/engine/expectiminimax';
import {
    evaluateBoard,
    computeJanowskiCubeEvaluation,
    detectJanowskiPhase,
} from '../../lib/engine/evaluator';
import type {
    BlotsAndShots,
    BoardStructure,
    ContactStatus,
    PipCountDiff,
    ShotExposureComparison,
    BgsageStrategicInsights,
} from './featureExtractor';

export type VolatilityLevel = 'low' | 'medium' | 'high';

export interface MarketWindowMetrics {
    /** Seuil d'entrée dans la fenêtre de double (Double Point, ex: 0.65). */
    doublePoint: number;
    /** Seuil d'abandon adverse (Cash Point = 1 - Take Point adverse, ex: 0.75). */
    cashPoint: number;
    /** Niveau de volatilité de la position ('low' | 'medium' | 'high'). */
    volatility: VolatilityLevel;
    /** Nombre exact de séquences sur 36 faisant perdre le marché (Market Losers, 0..36). */
    estimatedMarketLosers: number;
    /** Indique si la position se situe dans la fenêtre de marché (Market Window). */
    inMarketWindow: boolean;
    /** Écart-type pondéré des équités sur les 21 tirages (sigma_Eq, seuils < 0.06 low, > 0.14 high). */
    equityVolatilitySigma?: number;
    /** Perte moyenne d'équité par dépassement du Cash Point (L_overshoot). */
    expectedOvershootLoss?: number;
}

export interface MarketWindowParams {
    contactStatus: ContactStatus;
    boardStructure: BoardStructure;
    blotsAndShots: BlotsAndShots;
    pipCountDiff: PipCountDiff;
    opponentTakePoint?: number;
    gammonPrice?: number;
    bgsage?: BgsageStrategicInsights;
    shotExposure?: ShotExposureComparison;
    bestEndState?: BoardState;
    player?: Player;
}

/**
 * Analyse exacte de la distribution des 21 tirages pondérés sur 36 :
 * - Market Losers exacts (sur 36)
 * - Volatilité exacte d'équité sigma_Eq (écart-type pondéré des équités)
 * - Perte d'overshoot attendue L_overshoot au-delà du Cash Point
 */
export function analyzeExactMarketDistribution(
    bestEndState: BoardState,
    player: Player,
    cashPoint: number,
    gammonPrice: number = 0.5,
): {
    marketLosersCount: number;
    equityVolatilitySigma: number;
    expectedOvershootLoss: number;
} {
    const oppPlayer = bestEndState.turn;
    let marketLosersCount = 0;
    let weightedMeanEq = 0;
    let weightedOvershoot = 0;
    const rollEquities: Array<{ eq: number; weight: number }> = [];

    for (const roll of DISTINCT_DICE_ROLLS_21) {
        const oppLegalMoves = generateLegalMoves(bestEndState, roll.dice);

        if (oppLegalMoves.length === 0) {
            const stateAfterPass: BoardState = {
                ...bestEndState,
                turn: player,
                dice: null,
            };
            const playerEval = evaluateBoard(stateAfterPass, 0);
            const effWin = playerEval.probabilities.win + gammonPrice * playerEval.probabilities.winGammon * 0.5;
            if (effWin >= cashPoint || playerEval.cubelessEquity >= 0.50) {
                marketLosersCount += roll.weight;
                weightedOvershoot += (roll.weight / 36) * Math.max(0, effWin - cashPoint);
            }
            const eq = playerEval.cubefulEquity;
            weightedMeanEq += (roll.weight / 36) * eq;
            rollEquities.push({ eq, weight: roll.weight });
            continue;
        }

        let bestOppEquity = -Infinity;
        let bestOppCubelessEquity = -Infinity;
        let bestOppProbs = {
            win: 0.5,
            winGammon: 0.1,
            winBackgammon: 0.01,
            loseWin: 0.5,
            loseGammon: 0.1,
            loseBackgammon: 0.01,
        };

        for (const oppSeq of oppLegalMoves) {
            const stateAfterMove: BoardState = {
                ...bestEndState,
                board: oppSeq.board,
                turn: oppPlayer,
                dice: null,
            };
            const oppEval = evaluateBoard(stateAfterMove, 0);
            if (oppEval.cubefulEquity > bestOppEquity) {
                bestOppEquity = oppEval.cubefulEquity;
                bestOppCubelessEquity = oppEval.cubelessEquity;
                bestOppProbs = oppEval.probabilities;
            }
        }

        const playerWinProb = bestOppProbs.loseWin;
        const playerGammonProb = bestOppProbs.loseGammon;
        const playerEffectiveWin = playerWinProb + gammonPrice * playerGammonProb * 0.5;
        const playerEq = -bestOppEquity;

        if (playerEffectiveWin >= cashPoint || -bestOppCubelessEquity >= 0.50) {
            marketLosersCount += roll.weight;
            weightedOvershoot += (roll.weight / 36) * Math.max(0, playerEffectiveWin - cashPoint);
        }
        weightedMeanEq += (roll.weight / 36) * playerEq;
        rollEquities.push({ eq: playerEq, weight: roll.weight });
    }

    let variance = 0;
    for (const item of rollEquities) {
        const diff = item.eq - weightedMeanEq;
        variance += (item.weight / 36) * diff * diff;
    }

    return {
        marketLosersCount: Math.max(0, Math.min(36, marketLosersCount)),
        equityVolatilitySigma: Number(Math.sqrt(Math.max(0, variance)).toFixed(4)),
        expectedOvershootLoss: Number(weightedOvershoot.toFixed(4)),
    };
}

/**
 * Calcule le nombre exact de séquences de dés (sur 36) qui font perdre le marché
 * (Market Losers) au tour suivant.
 */
export function countExactMarketLosers(
    bestEndState: BoardState,
    player: Player,
    cashPoint: number,
    gammonPrice: number = 0.5,
): number {
    return analyzeExactMarketDistribution(bestEndState, player, cashPoint, gammonPrice).marketLosersCount;
}

/**
 * Calcule les métriques de fenêtre de marché (Market Window) et de volatilité du videau.
 *
 * Utilise le calcul exact sur les 21 tirages pondérés lorsque bestEndState est fourni,
 * ou un modèle heuristique de repli lorsque seul le différentiel statistique est disponible.
 */
export function computeMarketWindowMetrics(params: MarketWindowParams): MarketWindowMetrics {
    const {
        contactStatus,
        boardStructure,
        blotsAndShots,
        pipCountDiff,
        opponentTakePoint,
        gammonPrice = 0.5,
        bgsage,
        shotExposure,
        bestEndState,
        player,
    } = params;

    let cashPoint = Number(Math.max(0.55, Math.min(0.95, 1 - (opponentTakePoint ?? 0.25))).toFixed(3));
    let janowskiDoublePoint: number | undefined;
    if (opponentTakePoint === undefined && bestEndState && player) {
        const evalRes = evaluateBoard({ ...bestEndState, turn: player }, 0);
        const phase = detectJanowskiPhase(bestEndState.board, player);
        const jan = computeJanowskiCubeEvaluation(evalRes.probabilities, phase, {
            board: bestEndState.board,
            player,
        });
        cashPoint = Number(Math.max(0.55, Math.min(0.95, jan.cashPoint)).toFixed(3));
        janowskiDoublePoint = jan.doublePoint;
    }

    const userShotsTotal =
        shotExposure?.user.totalRolls ?? Math.min(36, blotsAndShots.user.reduce((s, b) => s + b.totalShots, 0));
    const bestShotsTotal =
        shotExposure?.best.totalRolls ?? Math.min(36, blotsAndShots.best.reduce((s, b) => s + b.totalShots, 0));
    const gammonThreat = bgsage?.optimalMetrics?.winGammonProb ?? (boardStructure.innerBoardPoints >= 4 ? 0.22 : 0.1);

    let volatility: VolatilityLevel = 'medium';
    if (contactStatus === 'pureRace') {
        volatility = 'low';
    } else if (
        userShotsTotal >= 6 ||
        bestShotsTotal >= 6 ||
        (boardStructure.innerBoardPoints >= 4 && gammonThreat >= 0.2) ||
        Math.abs(userShotsTotal - bestShotsTotal) >= 5
    ) {
        volatility = 'high';
    }

    let marketLosers: number;
    let equityVolatilitySigma: number | undefined;
    let expectedOvershootLoss: number | undefined;

    if (bestEndState && player) {
        const dist = analyzeExactMarketDistribution(bestEndState, player, cashPoint, gammonPrice);
        marketLosers = dist.marketLosersCount;
        equityVolatilitySigma = dist.equityVolatilitySigma;
        expectedOvershootLoss = dist.expectedOvershootLoss;
        if (equityVolatilitySigma > 0.14) {
            volatility = 'high';
        } else if (equityVolatilitySigma < 0.06 && contactStatus === 'pureRace') {
            volatility = 'low';
        }
    } else {
        marketLosers =
            contactStatus === 'pureRace'
                ? Math.max(2, Math.min(12, Math.round((12 - Math.min(12, Math.abs(pipCountDiff.diff))) * 0.8)))
                : Math.min(36, Math.max(userShotsTotal, bestShotsTotal) + boardStructure.innerBoardPoints * 2);
    }

    const windowWidth = volatility === 'high' ? 0.13 : volatility === 'medium' ? 0.10 : 0.08;
    const doublePoint =
        janowskiDoublePoint !== undefined
            ? Number(Math.max(0.50, Math.min(cashPoint - 0.04, janowskiDoublePoint)).toFixed(3))
            : Number(Math.max(0.50, cashPoint - windowWidth).toFixed(3));

    const optWin = bgsage?.optimalMetrics?.winProb;
    const optGammon = bgsage?.optimalMetrics?.winGammonProb ?? 0;
    const effectiveWinEq =
        optWin !== undefined
            ? optWin + gammonPrice * optGammon * 0.5
            : 0.5 - pipCountDiff.diff * 0.008;

    const inMarketWindow = effectiveWinEq >= doublePoint && effectiveWinEq <= cashPoint + 0.03;

    return {
        doublePoint,
        cashPoint,
        volatility,
        estimatedMarketLosers: Math.max(0, Math.min(36, marketLosers)),
        inMarketWindow,
        equityVolatilitySigma,
        expectedOvershootLoss,
    };
}
