/**
 * Heuristiques d'évaluation de position pour l'IA — module 100 % pur.
 *
 * Centralise les fonctions d'évaluation de position (0-ply, 1-ply, 2-ply) et la
 * détection de fin de partie, utilisées par l'adversaire IA.
 *
 * Ce module ne dépend d'aucun composant React : il est testable isolément et
 * réutilisable par le hook `useBackgammonGame` ou tout autre consommateur.
 */

import {
    BoardState,
    Player,
    Move,
    MoveSequence,
    X_BAR,
    O_BAR,
    pipCount,
    borneOffCount,
    generateLegalMoves,
} from './backgammonEngine';
import { evaluateBoard } from '../lib/engine/evaluator';

export type WinType = 'single' | 'gammon' | 'backgammon' | 'pass';

export interface GameResult {
    winner: Player;
    loser: Player;
    winType: WinType;
    multiplier: number;
    pointsWon: number;
}

export type AIDifficulty = 'beginner' | 'expert' | 'grandmaster';

/**
 * Évalue si le plateau actuel correspond à une fin de partie (tous les 15 pions sortis).
 * Calcule avec précision le type de victoire :
 * - Simple : le perdant a sorti au moins 1 pion (1x).
 * - Gammon : le perdant n'a sorti aucun pion (2x).
 * - Backgammon : le perdant n'a sorti aucun pion ET a encore au moins 1 pion sur la barre ou dans le jan intérieur du vainqueur (3x).
 */
export function evaluateWin(board: number[], cubeValue: number = 1): GameResult | null {
    const validCube = cubeValue && cubeValue > 0 ? cubeValue : 1;
    const xOff = borneOffCount(board, 'X');
    const oOff = borneOffCount(board, 'O');

    if (xOff === 15) {
        const winner: Player = 'X';
        const loser: Player = 'O';

        if (oOff > 0) {
            return { winner, loser, winType: 'single', multiplier: 1, pointsWon: validCube };
        }

        // O n'a sorti aucun pion : vérifie si O est sur la barre ou dans le jan intérieur de X (1..6)
        let inHomeOrBar = board[O_BAR] < 0;
        if (!inHomeOrBar) {
            for (let p = 1; p <= 6; p++) {
                if (board[p] < 0) {
                    inHomeOrBar = true;
                    break;
                }
            }
        }

        if (inHomeOrBar) {
            return { winner, loser, winType: 'backgammon', multiplier: 3, pointsWon: 3 * validCube };
        }
        return { winner, loser, winType: 'gammon', multiplier: 2, pointsWon: 2 * validCube };
    }

    if (oOff === 15) {
        const winner: Player = 'O';
        const loser: Player = 'X';

        if (xOff > 0) {
            return { winner, loser, winType: 'single', multiplier: 1, pointsWon: validCube };
        }

        // X n'a sorti aucun pion : vérifie si X est sur la barre ou dans le jan intérieur de O (19..24)
        let inHomeOrBar = board[X_BAR] > 0;
        if (!inHomeOrBar) {
            for (let p = 19; p <= 24; p++) {
                if (board[p] > 0) {
                    inHomeOrBar = true;
                    break;
                }
            }
        }

        if (inHomeOrBar) {
            return { winner, loser, winType: 'backgammon', multiplier: 3, pointsWon: 3 * validCube };
        }
        return { winner, loser, winType: 'gammon', multiplier: 2, pointsWon: 2 * validCube };
    }

    return null;
}

/**
 * Détermine si les deux armées se sont déjà croisées (course pure / bear-off).
 *
 * En course pure, aucun pion Blanc (X) n'est « derrière » le pion Noir (O) le plus
 * avancé : l'adversaire ne peut plus frapper, donc les bonus de portes/ancres et les
 * pénalités de blots exposés n'ont plus de sens.
 */
export function isContactPosition(board: number[]): boolean {
    // Pion Noir (O) le plus avancé = flèche la plus haute (O avance de 1 vers 24).
    let furthestO = 0;
    for (let p = 1; p <= 24; p++) {
        if (board[p] < 0) {
            furthestO = p;
            break;
        }
    }
    // Pion Blanc (X) le plus avancé = flèche la plus basse (X avance de 24 vers 1).
    let furthestX = 25;
    for (let p = 24; p >= 1; p--) {
        if (board[p] > 0) {
            furthestX = p;
            break;
        }
    }

    // Contact si un pion Blanc est encore « derrière » (flèche plus haute) le pion Noir le plus avancé.
    return furthestX > furthestO;
}

/**
 * Évaluation de position pour sélectionner le meilleur coup légal pour l'IA.
 *
 * Délègue au moteur d'évaluation unifié [`evaluateBoard`](../lib/engine/evaluator.ts),
 * qui combine :
 *   - Table exacte de bear-off (PR 0.00) ;
 *   - Keith Count officiel en course pure ;
 *   - Heuristique tri-phase en contact.
 *
 * Ceci ALIGNE la force de l'adversaire IA sur celle du coach : l'IA ne commet
 * plus d'erreurs que le coach signalerait lui-même. La gestion de difficulté
 * (bruit débutant, 2-ply expert) reste assurée par `selectBestOpponentSequence`.
 *
 * L'équité retournée est bornée entre -1.000 et +1.000 (équité cubeful).
 */
export function scoreBoardForOpponent(board: number[], player: Player = 'O'): number {
    const win = evaluateWin(board, 1);
    if (win && win.winner === player) return 1.0;
    if (win && win.winner !== player) return -1.0;

    // Construit un BoardState minimal du point de vue de `player`.
    const state: BoardState = {
        board,
        turn: player,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };

    // Délègue au moteur unifié (bear-off exact + Keith + contact tri-phase).
    const evaluation = evaluateBoard(state, 2);
    return evaluation.cubefulEquity;
}

/**
 * Évaluation 0-ply bruité (débutant).
 */
export function scoreBoard0PlyNoisy(
    board: number[],
    player: Player = 'O',
    randomFn: () => number = Math.random,
): number {
    const base = scoreBoardForOpponent(board, player);
    const noise = (randomFn() - 0.5) * 0.2;
    return Math.tanh(base + noise);
}

/**
 * Évaluation 1-ply déterministe (intermédiaire).
 */
export function scoreBoard1Ply(board: number[], player: Player = 'O'): number {
    return scoreBoardForOpponent(board, player);
}

/**
 * Évaluation 2-ply expectimax (expert) :
 * Anticipe la riposte de l'adversaire (X) sur un échantillon représentatif de dés
 * et déduit l'espérance de la pire réplique subie par O.
 */
export function scoreBoard2PlyForOpponent(board: number[], player: Player = 'O'): number {
    const win = evaluateWin(board, 1);
    if (win && win.winner === player) return 1.0;
    if (win && win.winner !== player) return -1.0;

    const baseScore = scoreBoardForOpponent(board, player);

    // Échantillon représentatif de lancers de dés adverses (X)
    const testRolls: [number, number][] = [
        [2, 1], [3, 1], [4, 2], [5, 3], [6, 1], [5, 4], [6, 3], [3, 3]
    ];

    const adversary: Player = player === 'X' ? 'O' : 'X';
    let totalWorstO = 0;
    const dummyState: BoardState = {
        board,
        turn: adversary,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };

    for (const roll of testRolls) {
        const xSeqs = generateLegalMoves(dummyState, roll);
        if (xSeqs.length === 0) {
            totalWorstO += baseScore + 0.05;
            continue;
        }

        let minScoreForO = Infinity;
        for (const xSeq of xSeqs) {
            const scoreO = scoreBoardForOpponent(xSeq.board, player);
            if (scoreO < minScoreForO) {
                minScoreForO = scoreO;
            }
        }
        totalWorstO += minScoreForO;
    }

    const expectedScoreAfterReply = totalWorstO / testRolls.length;
    return Math.tanh(0.3 * baseScore + 0.7 * expectedScoreAfterReply);
}

/**
 * Sélectionne la meilleure séquence de coups selon le niveau de difficulté de l'IA :
 * - beginner : 0-ply bruité
 * - intermediate : 1-ply déterministe
 * - expert : 2-ply expectimax
 */
export function selectBestOpponentSequence(
    legalSeqs: MoveSequence[],
    player: Player = 'O',
    difficulty: AIDifficulty = 'expert',
    randomFn: () => number = Math.random,
): MoveSequence | null {
    if (legalSeqs.length === 0) return null;

    let bestSeq = legalSeqs[0];
    let bestScore = -Infinity;

    for (const seq of legalSeqs) {
        let score = 0;
        if (difficulty === 'beginner') {
            score = scoreBoard0PlyNoisy(seq.board, player, randomFn);
        } else {
            // expert (2-ply) et grandmaster (3-ply) : repli heuristique 2-ply.
            score = scoreBoard2PlyForOpponent(seq.board, player);
        }

        if (score > bestScore) {
            bestScore = score;
            bestSeq = seq;
        }
    }

    return bestSeq;
}
