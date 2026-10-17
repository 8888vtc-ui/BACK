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
 * Simplification assumée : le comptage des tirs (shots) considère les pions de
 * l'adversaire présents sur les flèches 1-24 ; les pions adverses sur la barre
 * (qui doivent d'abord rentrer) ne sont pas comptés comme menaces directes.
 */

import { BoardState, Player, pipCount, X_BAR, O_BAR } from '../../engine/backgammonEngine';

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

export interface StrategicFeatures {
    /** Joueur dont le coup est analysé (perspective des features). */
    player: Player;
    pipCountDiff: PipCountDiff;
    blotsAndShots: BlotsAndShots;
    boardStructure: BoardStructure;
    contactStatus: ContactStatus;
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

// ---------------------------------------------------------------------------
// Helpers de lecture du plateau
// ---------------------------------------------------------------------------

function hasChecker(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v > 0 : v < 0;
}

function isMadePoint(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v >= 2 : v <= -2;
}

function isBlot(board: number[], point: number, player: Player): boolean {
    const v = board[point];
    return player === 'X' ? v === 1 : v === -1;
}

/** La flèche est bloquée pour `opponent` (l'autre joueur y a 2+ pions). */
function isBlockedFor(board: number[], point: number, opponent: Player): boolean {
    const v = board[point];
    return opponent === 'X' ? v <= -2 : v >= 2;
}

/** Distance (positive) d'un pion adverse en `from` jusqu'au blot, ou null s'il ne peut pas l'atteindre. */
function distanceToBlot(from: number, blot: number, opponent: Player): number | null {
    if (opponent === 'X') return from > blot ? from - blot : null;
    return from < blot ? blot - from : null;
}

// ---------------------------------------------------------------------------
// Comptage des tirs (shots)
// ---------------------------------------------------------------------------

function isLegalLanding(board: number[], point: number, opponent: Player): boolean {
    if (point < 1 || point > 24) return false;
    return !isBlockedFor(board, point, opponent);
}

function canHitDirect(board: number[], blot: number, opponent: Player, die: number): boolean {
    for (let q = 1; q <= 24; q++) {
        if (hasChecker(board, q, opponent) && distanceToBlot(q, blot, opponent) === die) {
            return true;
        }
    }
    return false;
}

function canHitIndirect(
    board: number[],
    blot: number,
    opponent: Player,
    d1: number,
    d2: number,
): boolean {
    const total = d1 + d2;
    for (let q = 1; q <= 24; q++) {
        if (!hasChecker(board, q, opponent)) continue;
        if (distanceToBlot(q, blot, opponent) !== total) continue;
        const mid1 = opponent === 'X' ? q - d1 : q + d1;
        const mid2 = opponent === 'X' ? q - d2 : q + d2;
        if (isLegalLanding(board, mid1, opponent) || isLegalLanding(board, mid2, opponent)) {
            return true;
        }
    }
    return false;
}

/** Compte, sur les 36 combinaisons de dés, les tirs directs et indirects sur un blot. */
function countShots(board: number[], blot: number, player: Player): { direct: number; indirect: number } {
    const opponent = other(player);
    let direct = 0;
    let indirect = 0;
    for (let d1 = 1; d1 <= 6; d1++) {
        for (let d2 = 1; d2 <= 6; d2++) {
            if (canHitDirect(board, blot, opponent, d1) || canHitDirect(board, blot, opponent, d2)) {
                direct++;
            } else if (canHitIndirect(board, blot, opponent, d1, d2)) {
                indirect++;
            }
        }
    }
    return { direct, indirect };
}

export function analyzeBlots(board: number[], player: Player): BlotAnalysis[] {
    const result: BlotAnalysis[] = [];
    for (let p = 1; p <= 24; p++) {
        if (!isBlot(board, p, player)) continue;
        const { direct, indirect } = countShots(board, p, player);
        result.push({ point: p, directShots: direct, indirectShots: indirect, totalShots: direct + indirect });
    }
    return result;
}

// ---------------------------------------------------------------------------
// Structure du plateau
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Classification contact / course
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API principale
// ---------------------------------------------------------------------------

/**
 * Compare l'état du plateau après le coup du joueur et après le meilleur coup
 * du moteur, et retourne un objet JSON structuré de concepts stratégiques.
 *
 * @param initialState  État avant le coup (définit le joueur analysé via `turn`).
 * @param userEndState  État après le coup réellement joué.
 * @param bestEndState  État après le meilleur coup du moteur.
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

    return {
        player,
        pipCountDiff: { player: playerPips, opponent: opponentPips, leader, diff },
        blotsAndShots: {
            user: analyzeBlots(userEndState.board, player),
            best: analyzeBlots(bestEndState.board, player),
        },
        boardStructure: analyzeBoardStructure(userEndState.board, player),
        contactStatus: classifyContact(userEndState.board),
    };
}