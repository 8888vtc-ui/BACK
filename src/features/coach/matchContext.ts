/**
 * Module d'évaluation du contexte de match et Match Equity Table (MET).
 *
 * Implémente :
 * - Table d'équité de match (MET Kazaross-XG2 de référence)
 * - Calcul des points à marquer pour gagner (Away score / pointsToWin)
 * - Détection des régimes : Crawford, Post-Crawford, DMP (Double Match Point), Money Play
 * - Calcul du prix du gammon (Gammon Price) pour chaque joueur
 * - Calcul du seuil de prise de videau (Take Point)
 */

import { Player } from '../../engine/backgammonEngine';

export interface PointsToWin {
    X: number;
    O: number;
}

export interface PlayerMetric {
    X: number;
    O: number;
}

export interface MatchContext {
    matchLength: number; // 0 = partie d'argent (money play)
    scoreX: number;
    scoreO: number;
    crawford: boolean;
    postCrawford: boolean;
    isMoneyPlay: boolean;
    isDMP: boolean;
    pointsToWin: PointsToWin;
    gammonPrice: PlayerMetric;
    takePoint: PlayerMetric;
    matchEquity: PlayerMetric;
    cubeValue: number;
    cubeOwner: Player | null;
}

export interface BuildMatchContextParams {
    matchLength: number;
    scoreX: number;
    scoreO: number;
    crawford?: boolean;
    crawfordAlreadyPlayed?: boolean;
    cubeValue?: number;
    cubeOwner?: Player | null;
}

/**
 * Table Kazaross-XG2 standard d'équité de match (en probabilité de gain 0.00 à 1.00).
 * Indexée par [awayPlayer - 1][awayOpponent - 1] pour des away scores de 1 à 11.
 */
const KAZAROSS_MET_11: number[][] = [
    // 1-away
    [0.5, 0.698, 0.754, 0.825, 0.855, 0.891, 0.911, 0.933, 0.946, 0.959, 0.967],
    // 2-away
    [0.302, 0.5, 0.598, 0.672, 0.73, 0.772, 0.811, 0.838, 0.864, 0.883, 0.901],
    // 3-away
    [0.246, 0.402, 0.5, 0.581, 0.643, 0.694, 0.733, 0.769, 0.799, 0.824, 0.847],
    // 4-away
    [0.175, 0.328, 0.419, 0.5, 0.566, 0.62, 0.665, 0.704, 0.738, 0.767, 0.793],
    // 5-away
    [0.145, 0.27, 0.357, 0.434, 0.5, 0.557, 0.605, 0.647, 0.683, 0.716, 0.744],
    // 6-away
    [0.109, 0.228, 0.306, 0.38, 0.443, 0.5, 0.55, 0.594, 0.633, 0.668, 0.699],
    // 7-away
    [0.089, 0.189, 0.267, 0.335, 0.395, 0.45, 0.5, 0.545, 0.586, 0.623, 0.656],
    // 8-away
    [0.067, 0.162, 0.231, 0.296, 0.353, 0.406, 0.455, 0.5, 0.542, 0.58, 0.615],
    // 9-away
    [0.054, 0.136, 0.201, 0.262, 0.317, 0.367, 0.414, 0.458, 0.5, 0.539, 0.575],
    // 10-away
    [0.041, 0.117, 0.176, 0.233, 0.284, 0.332, 0.377, 0.42, 0.461, 0.5, 0.536],
    // 11-away
    [0.033, 0.099, 0.153, 0.207, 0.256, 0.301, 0.344, 0.385, 0.425, 0.464, 0.5],
];

/**
 * Retourne la probabilité de gain du match pour un joueur étant à `awayPlayer` points
 * contre un adversaire à `awayOpponent` points.
 */
export function getMatchEquity(awayPlayer: number, awayOpponent: number): number {
    // Cas limites immédiats
    if (awayPlayer <= 0) return 1.0;
    if (awayOpponent <= 0) return 0.0;
    if (awayPlayer === awayOpponent) return 0.5;

    // Consultation directe de la table Kazaross jusqu'à 11-away
    if (awayPlayer <= 11 && awayOpponent <= 11) {
        return KAZAROSS_MET_11[awayPlayer - 1][awayOpponent - 1];
    }

    // Extrapolation logistique pour les matches très longs (> 11 points)
    const z = (0.85 * (awayOpponent - awayPlayer)) / Math.sqrt(awayPlayer + awayOpponent);
    const prob = 1 / (1 + Math.exp(-z));
    return Number(Math.max(0.01, Math.min(0.99, prob)).toFixed(3));
}

/**
 * Calcule le Prix du Gammon (Gammon Price) pour un joueur donné.
 *
 * Le Prix du Gammon mesure le surcroît d'équité de match conféré par la victoire
 * par gammon (2 pts) par rapport à une victoire simple (1 pt), normalisé par
 * le coût d'une défaite simple.
 *
 * En partie d'argent : vaut exactement 0.50.
 * À 1-away (DMP ou Crawford pour le meneur) : vaut exactement 0.00 (aucun gain de gammon).
 */
export function calculateGammonPrice(
    awayPlayer: number,
    awayOpponent: number,
    isMoneyPlay: boolean = false,
): number {
    if (isMoneyPlay) {
        return 0.5;
    }

    // Si le joueur n'a besoin que d'un seul point (1-away), le gammon ne lui rapporte rien
    if (awayPlayer <= 1) {
        return 0.0;
    }

    const meSingleWin = getMatchEquity(awayPlayer - 1, awayOpponent);
    const meGammonWin = getMatchEquity(awayPlayer - 2, awayOpponent);
    const meSingleLoss = getMatchEquity(awayPlayer, awayOpponent - 1);

    const deltaWin = meSingleWin - meSingleLoss;
    if (deltaWin <= 0.001) {
        return 0.5;
    }

    const gammonBonus = meGammonWin - meSingleWin;
    const price = gammonBonus / deltaWin;

    return Number(Math.max(0.0, Math.min(1.2, price)).toFixed(2));
}

/**
 * Calcule le seuil de prise de videau (Take Point).
 *
 * En partie d'argent : vaut 25% (0.25).
 * En match play : calculé par la formule de Risk / (Risk + Reward).
 */
export function calculateTakePoint(
    awayPlayer: number,
    awayOpponent: number,
    isMoneyPlay: boolean = false,
): number {
    if (isMoneyPlay) {
        return 0.25;
    }

    // À DMP ou à 1-away pour le joueur, le videau est sans objet ou prise obligatoire
    if (awayPlayer <= 1 && awayOpponent <= 1) {
        return 0.0;
    }

    const meDrop = getMatchEquity(awayPlayer, awayOpponent - 1);
    const meWinDoubled = getMatchEquity(awayPlayer - 2, awayOpponent);
    const meLoseDoubled = getMatchEquity(awayPlayer, awayOpponent - 2);

    const risk = meDrop - meLoseDoubled;
    const reward = meWinDoubled - meDrop;
    const total = risk + reward;

    if (total <= 0.001) {
        return 0.25;
    }

    const tp = risk / total;
    return Number(Math.max(0.05, Math.min(0.45, tp)).toFixed(2));
}

/**
 * Construit l'objet complet `MatchContext` intégrant toutes les métriques MET.
 */
export function buildMatchContext(params: BuildMatchContextParams): MatchContext {
    const {
        matchLength,
        scoreX,
        scoreO,
        cubeValue = 1,
        cubeOwner = null,
        crawfordAlreadyPlayed = false,
    } = params;

    const isMoneyPlay = matchLength <= 0;

    let pointsToWinX = 0;
    let pointsToWinO = 0;
    let isCrawford = Boolean(params.crawford);
    let isPostCrawford = false;
    let isDMP = false;

    if (isMoneyPlay) {
        pointsToWinX = 0;
        pointsToWinO = 0;
    } else {
        pointsToWinX = Math.max(1, matchLength - scoreX);
        pointsToWinO = Math.max(1, matchLength - scoreO);

        // Détection de DMP (1-away, 1-away)
        if (pointsToWinX === 1 && pointsToWinO === 1) {
            isDMP = true;
        }

        // Détection de Crawford et Post-Crawford
        const leaderIsOneAway = pointsToWinX === 1 || pointsToWinO === 1;
        if (leaderIsOneAway && !isDMP) {
            if (isCrawford) {
                isPostCrawford = false;
            } else if (crawfordAlreadyPlayed) {
                isPostCrawford = true;
            } else {
                // Si non spécifié mais score à 1-away, première manche Crawford
                isCrawford = true;
                isPostCrawford = false;
            }
        }
    }

    // Match Equity (probabilité globale de remporter le match)
    const meX = isMoneyPlay ? 0.5 : getMatchEquity(pointsToWinX, pointsToWinO);
    const meO = isMoneyPlay ? 0.5 : Number((1.0 - meX).toFixed(3));

    // Prix du gammon pour chaque joueur
    const gpX = calculateGammonPrice(pointsToWinX, pointsToWinO, isMoneyPlay);
    const gpO = calculateGammonPrice(pointsToWinO, pointsToWinX, isMoneyPlay);

    // Seuil de prise (Take Point) pour chaque joueur
    const tpX = calculateTakePoint(pointsToWinX, pointsToWinO, isMoneyPlay);
    const tpO = calculateTakePoint(pointsToWinO, pointsToWinX, isMoneyPlay);

    return {
        matchLength,
        scoreX,
        scoreO,
        crawford: isCrawford,
        postCrawford: isPostCrawford,
        isMoneyPlay,
        isDMP,
        pointsToWin: {
            X: pointsToWinX,
            O: pointsToWinO,
        },
        gammonPrice: {
            X: gpX,
            O: gpO,
        },
        takePoint: {
            X: tpX,
            O: tpO,
        },
        matchEquity: {
            X: meX,
            O: meO,
        },
        cubeValue,
        cubeOwner,
    };
}
