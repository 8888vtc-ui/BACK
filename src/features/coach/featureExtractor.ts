/**
 * Extracteur de concepts stratégiques — le pont entre les mathématiques du
 * moteur et le LLM qui expliquera l'erreur au joueur.
 *
 * Module 100 % pur : ne dépend que de `BoardState` (moteur de règles), aucune
 * dépendance au moteur WASM, au réseau ou à React.
 *
 * Perspective : toutes les features sont exprimées du point de vue du joueur
 * qui vient de jouer (`initialState.turn`). Les numéros de flèches sont donc
 * « miroirés » pour O :
 *   - jan intérieur : 1-6 pour X, 19-24 pour O ;
 *   - ancre avancée : 20-22 pour X, 3-5 pour O ;
 *   - Point 5 (Golden Point) : 5 pour X, 20 pour O ;
 *   - Bar Point (Point 7) : 7 pour X, 18 pour O.
 *
 * Le comptage des tirs (shots) est EXACT : il énumère les 36 combinaisons de
 * dés et compte les tirs directs et indirects, en incluant les pions adverses
 * sur la barre (qui rentrent sur le jan intérieur adverse et peuvent frapper
 * un blot sur leur point d'entrée).
 */

import { BoardState, Player, pipCount, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { countShotsExact } from '../../lib/engine/shotCounter';
import { computeShotExposure, ShotExposure } from '../../lib/engine/shotExposure';
import { computeKeithCount } from '../../lib/engine/keithCount';

export type { ShotExposure } from '../../lib/engine/shotExposure';

export type ContactStatus = 'contact' | 'pureRace';

export interface PipCountDiff {
    /** Pip count du joueur qui vient de jouer. */
    player: number;
    /** Pip count de l'adversaire. */
    opponent: number;
    /** Qui mène la course (pip count le plus faible). */
    leader: Player | 'tie';
    /** player - opponent : négatif = le joueur mène, positif = il est en retard. */
    diff: number;
}

export interface BlotAnalysis {
    /** Flèche du blot (1-24, numérotation standard). */
    point: number;
    /** Lancers (sur 36) qui frappent directement (1 à 6 cases). */
    directShots: number;
    /** Lancers (sur 36) qui frappent indirectement (7+ cases, deux dés). */
    indirectShots: number;
    /** directShots + indirectShots. */
    totalShots: number;
}

export interface BlotsAndShots {
    /** Blots laissés par le coup du joueur. */
    user: BlotAnalysis[];
    /** Blots laissés par le meilleur coup du moteur. */
    best: BlotAnalysis[];
}

/** Exposition globale exacte (union des 36 lancers) après chaque coup. */
export interface ShotExposureComparison {
    user: ShotExposure;
    best: ShotExposure;
}

/** Keith Count après le coup du joueur (pertinent en course pure). */
export interface KeithCountDiff {
    player: number;
    opponent: number;
    /** player - opponent : négatif = le joueur est en avance. */
    diff: number;
}

export interface BoardStructure {
    /** Nombre de portes (points faits) dans le jan intérieur du joueur. */
    innerBoardPoints: number;
    /** Présence de l'ancre avancée (20-22 pour X, 3-5 pour O). */
    advancedAnchor: boolean;
    /** Contrôle du Point 5 (Golden Point). */
    goldenPoint: boolean;
    /** Contrôle du Bar Point (Point 7). */
    barPoint: boolean;
    /** Longueur de la plus grande prime (suite de portes consécutives). */
    longestPrime: number;
}

export interface TacticalBoardDiff {
    /** Porte du 5 (Golden Point : 5 pour X, 20 pour O) réellement créée (>= 2 pions) par le coup optimal. */
    goldenPointCreatedByBest: boolean;
    /** Porte du 7 (Bar Point : 7 pour X, 18 pour O) réellement créée (>= 2 pions) par le coup optimal. */
    barPointCreatedByBest: boolean;
    /** Porte intérieure (1..6 pour X, 19..24 pour O) réellement créée (>= 2 pions) par le coup optimal. */
    homeGateCreatedByBest: boolean;
    /** Prime (>= 4 portes consécutives) construite ou préservée par le coup optimal mais pas par le coup joué. */
    primeExtendedByBest: boolean;
    /** Ancre avancée (>= 2 pions sur 20..22 pour X, 3..5 pour O) créée ou préservée par le coup optimal. */
    anchorCreatedOrKeptByBest: boolean;
    /** Pion arrière (23..24 pour X, 1..2 pour O) évadé ou splitté par le coup optimal mais pas par le coup joué. */
    rearCheckerEscapedByBest: boolean;
    /** Frappe d'un blot adverse réalisée par le coup optimal mais pas par le coup joué. */
    hitMadeByBest: boolean;
    /** Rupture effective du contact (passage de 'contact' à 'pureRace' en fin de partie <= 100 pips) par le coup optimal. */
    contactBrokenByBest: boolean;
}

export interface TacticalDelta {
    /** Nombre de pions adverses mis à la barre par le coup joué. */
    userOpponentHitCount: number;
    /** Nombre de pions adverses mis à la barre par le meilleur coup. */
    bestOpponentHitCount: number;
    /** Différence de portes fermées dans le jan intérieur (meilleur - joué). */
    homePointsDelta: number;
    /** Différence de longueur de prime consécutive (meilleur - joué). */
    primeLengthDelta: number;
}

export interface BgsageMoveMetrics {
    equity: number;
    cubelessEquity: number;
    winProb: number;
    winGammonProb: number;
    winBackgammonProb: number;
    loseGammonProb: number;
    loseBackgammonProb: number;
    playerGamePlan: string;
    opponentGamePlan: string;
    evalLevel?: string;
}

export interface BgsageStrategicInsights {
    isRace: boolean;
    playerGamePlan: string;
    opponentGamePlan: string;
    evalLevel: string;
    playedMetrics?: BgsageMoveMetrics;
    optimalMetrics?: BgsageMoveMetrics;
}

import {
    computeMarketWindowMetrics,
    countExactMarketLosers,
    type MarketWindowMetrics,
    type MarketWindowParams,
    type VolatilityLevel,
} from './marketWindow';

export {
    computeMarketWindowMetrics,
    countExactMarketLosers,
    type MarketWindowMetrics,
    type MarketWindowParams,
    type VolatilityLevel,
};

export interface StrategicFeatures {
    /** Joueur dont le coup est analysé (perspective des features). */
    player: Player;
    pipCountDiff: PipCountDiff;
    blotsAndShots: BlotsAndShots;
    /** Union exacte des lancers frappants + duplication (absent si features construites à la main). */
    shotExposure?: ShotExposureComparison;
    /** Keith Count des deux joueurs après le coup joué. */
    keithCount?: KeithCountDiff;
    boardStructure: BoardStructure;
    /** Structure du plateau avant le coup (initialState). */
    beforeBoardStructure?: BoardStructure;
    /** Structure du plateau après le meilleur coup recommandé (bestEndState). */
    bestBoardStructure?: BoardStructure;
    /** Différentiel tactique (frappes à la barre, portes créées, prime). */
    tacticalDelta?: TacticalDelta;
    /** Comparaison tactique vérifiée entre boardBefore, userEndState et bestEndState. */
    tacticalDiff?: TacticalBoardDiff;
    contactStatus: ContactStatus;
    /** Analyse de la fenêtre de marché (Market Window) et volatilité du videau. */
    marketWindow?: MarketWindowMetrics;
    /** Métriques neurales enrichies fournies par Open Sage (bgsage-service). */
    bgsage?: BgsageStrategicInsights;
}

// ---------------------------------------------------------------------------
// Helpers de perspective
// ---------------------------------------------------------------------------

function other(player: Player): Player {
    return player === 'X' ? 'O' : 'X';
}

function homeBoardRange(player: Player): [number, number] {
    return player === 'X' ? [1, 6] : [19, 24];
}

function advancedAnchorPoints(player: Player): number[] {
    return player === 'X' ? [20, 21, 22] : [3, 4, 5];
}

function goldenPointOf(player: Player): number {
    return player === 'X' ? 5 : 20;
}

function barPointOf(player: Player): number {
    return player === 'X' ? 7 : 18;
}

function isMadePoint(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v >= 2 : v <= -2;
}

function isBlot(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v === 1 : v === -1;
}

export function analyzeBlots(board: number[], player: Player): BlotAnalysis[] {
    const opponent = other(player);
    const result: BlotAnalysis[] = [];
    for (let p = 1; p <= 24; p++) {
        if (!isBlot(board, p, player)) continue;
        const { direct, indirect } = countShotsExact(board, p, opponent);
        result.push({ point: p, directShots: direct, indirectShots: indirect, totalShots: direct + indirect });
    }
    return result;
}

function computeLongestPrime(board: number[], player: Player): number {
    let longest = 0;
    let current = 0;
    for (let p = 1; p <= 24; p++) {
        if (isMadePoint(board, p, player)) {
            current++;
            if (current > longest) longest = current;
        } else {
            current = 0;
        }
    }
    return longest;
}

export function analyzeBoardStructure(board: number[], player: Player): BoardStructure {
    const [lo, hi] = homeBoardRange(player);
    let innerBoardPoints = 0;
    for (let p = lo; p <= hi; p++) {
        if (isMadePoint(board, p, player)) innerBoardPoints++;
    }
    const advancedAnchor = advancedAnchorPoints(player).some((p) => isMadePoint(board, p, player));
    const goldenPoint = isMadePoint(board, goldenPointOf(player), player);
    const barPoint = isMadePoint(board, barPointOf(player), player);
    const longestPrime = computeLongestPrime(board, player);
    return { innerBoardPoints, advancedAnchor, goldenPoint, barPoint, longestPrime };
}

function classifyContact(board: number[]): ContactStatus {
    if (board[X_BAR] > 0 || board[O_BAR] < 0) return 'contact';
    let maxX = 0;
    let minX = 25;
    let maxO = 0;
    let minO = 25;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v > 0) {
            if (p > maxX) maxX = p;
            if (p < minX) minX = p;
        } else if (v < 0) {
            if (p > maxO) maxO = p;
            if (p < minO) minO = p;
        }
    }
    if (maxX < minO || maxO < minX) return 'pureRace';
    return 'contact';
}

/**
 * Compare l'état du plateau après le coup du joueur et après le meilleur coup
 * du moteur, et retourne un objet JSON structuré de concepts stratégiques.
 */
export function extractStrategicFeatures(
    initialState: BoardState,
    userEndState: BoardState,
    bestEndState: BoardState,
): StrategicFeatures {
    const player = initialState.turn;
    const opponent = other(player);

    const pips = pipCount(userEndState.board);
    const playerPips = pips[player];
    const opponentPips = pips[opponent];
    const diff = playerPips - opponentPips;
    const leader: Player | 'tie' = diff < 0 ? player : diff > 0 ? opponent : 'tie';

    const pipCountDiff: PipCountDiff = { player: playerPips, opponent: opponentPips, leader, diff };
    const blotsAndShots: BlotsAndShots = {
        user: analyzeBlots(userEndState.board, player),
        best: analyzeBlots(bestEndState.board, player),
    };
    const shotExposure: ShotExposureComparison = {
        user: computeShotExposure(userEndState.board, player),
        best: computeShotExposure(bestEndState.board, player),
    };
    const keithPlayer = computeKeithCount(userEndState.board, player).total;
    const keithOpponent = computeKeithCount(userEndState.board, opponent).total;
    const keithCount: KeithCountDiff = {
        player: keithPlayer,
        opponent: keithOpponent,
        diff: keithPlayer - keithOpponent,
    };
    const beforeBoardStructure = analyzeBoardStructure(initialState.board, player);
    const boardStructure = analyzeBoardStructure(userEndState.board, player);
    const bestBoardStructure = analyzeBoardStructure(bestEndState.board, player);

    // Calcul des pions adverses envoyés à la barre
    const oppBarIdx = player === 'X' ? O_BAR : X_BAR;
    const oppBarSign = player === 'X' ? -1 : 1;
    const initOppOnBar = Math.max(0, (initialState.board[oppBarIdx] ?? 0) * oppBarSign);
    const userOppOnBar = Math.max(0, (userEndState.board[oppBarIdx] ?? 0) * oppBarSign);
    const bestOppOnBar = Math.max(0, (bestEndState.board[oppBarIdx] ?? 0) * oppBarSign);

    const tacticalDelta: TacticalDelta = {
        userOpponentHitCount: Math.max(0, userOppOnBar - initOppOnBar),
        bestOpponentHitCount: Math.max(0, bestOppOnBar - initOppOnBar),
        homePointsDelta: bestBoardStructure.innerBoardPoints - boardStructure.innerBoardPoints,
        primeLengthDelta: bestBoardStructure.longestPrime - boardStructure.longestPrime,
    };

    const countRearCheckers = (board: number[], p: Player): number => {
        const rearPts = p === 'X' ? [23, 24] : [1, 2];
        const sign = p === 'X' ? 1 : -1;
        return rearPts.reduce((sum, pt) => sum + Math.max(0, (board[pt] ?? 0) * sign), 0);
    };

    const beforeRear = countRearCheckers(initialState.board, player);
    const userRear = countRearCheckers(userEndState.board, player);
    const bestRear = countRearCheckers(bestEndState.board, player);

    const beforeContact = classifyContact(initialState.board);
    const contactStatus = classifyContact(userEndState.board);
    const bestContact = classifyContact(bestEndState.board);

    const tacticalDiff: TacticalBoardDiff = {
        goldenPointCreatedByBest:
            !beforeBoardStructure.goldenPoint && bestBoardStructure.goldenPoint && !boardStructure.goldenPoint,
        barPointCreatedByBest:
            !beforeBoardStructure.barPoint && bestBoardStructure.barPoint && !boardStructure.barPoint,
        homeGateCreatedByBest:
            bestBoardStructure.innerBoardPoints > beforeBoardStructure.innerBoardPoints &&
            bestBoardStructure.innerBoardPoints > boardStructure.innerBoardPoints,
        primeExtendedByBest:
            bestBoardStructure.longestPrime >= 4 &&
            bestBoardStructure.longestPrime > boardStructure.longestPrime,
        anchorCreatedOrKeptByBest:
            bestBoardStructure.advancedAnchor && !boardStructure.advancedAnchor,
        rearCheckerEscapedByBest:
            bestRear < beforeRear && bestRear < userRear,
        hitMadeByBest:
            bestOppOnBar > initOppOnBar && bestOppOnBar > userOppOnBar,
        contactBrokenByBest:
            beforeContact === 'contact' &&
            bestContact === 'pureRace' &&
            contactStatus === 'contact' &&
            playerPips <= 100,
    };

    const marketWindow = computeMarketWindowMetrics({
        contactStatus,
        boardStructure,
        blotsAndShots,
        pipCountDiff,
        shotExposure,
        bestEndState,
        player,
    });

    return {
        player,
        pipCountDiff,
        blotsAndShots,
        shotExposure,
        keithCount,
        boardStructure,
        beforeBoardStructure,
        bestBoardStructure,
        tacticalDelta,
        tacticalDiff,
        contactStatus,
        marketWindow,
    };
}
