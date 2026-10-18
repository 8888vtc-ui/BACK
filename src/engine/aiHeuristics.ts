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

export type WinType = 'single' | 'gammon' | 'backgammon' | 'pass';

export interface GameResult {
    winner: Player;
    loser: Player;
    winType: WinType;
    multiplier: number;
    pointsWon: number;
}

export type AIDifficulty = 'beginner' | 'intermediate' | 'expert';

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
 * Heuristique d'évaluation de position pour sélectionner le meilleur coup légal pour l'IA ('O').
 */
export function scoreBoardForOpponent(board: number[], player: Player = 'O'): number {
    const win = evaluateWin(board, 1);
    if (win && win.winner === player) return 100000;

    const pips = pipCount(board);
    const borneOff = borneOffCount(board, player);

    let score = 0;
    // Pions sortis
    score += borneOff * 250;

    // Course aux pips
    score += (pips.X - pips.O) * 3;

    if (player === 'O') {
        // Frapper un pion adverse X (l'envoyer sur la barre)
        score += board[X_BAR] * 120;

        // Pénaliser ses propres blots vulnérables
        for (let p = 1; p <= 24; p++) {
            if (board[p] === -1) score -= 35;
            if (board[p] <= -2 && p >= 19) score += 40; // Portes sécurisées dans son jan intérieur
        }
        // Pénaliser les pions bloqués sur sa propre barre
        score += board[O_BAR] * 60; // board[O_BAR] est négatif pour O
    }

    return score;
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
    const noise = (randomFn() - 0.5) * 220;
    return base + noise;
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
    if (win && win.winner === player) return 100000;

    const baseScore = scoreBoardForOpponent(board, player);

    // Échantillon représentatif de lancers de dés adverses (X)
    const testRolls: [number, number][] = [
        [2, 1], [3, 1], [4, 2], [5, 3], [6, 1], [5, 4], [6, 3], [3, 3]
    ];

    let totalWorstO = 0;
    const dummyState: BoardState = {
        board,
        turn: 'X',
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
            totalWorstO += baseScore + 60;
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
    return Math.round(0.3 * baseScore + 0.7 * expectedScoreAfterReply);
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
    difficulty: AIDifficulty = 'intermediate',
    randomFn: () => number = Math.random,
): MoveSequence | null {
    if (legalSeqs.length === 0) return null;

    let bestSeq = legalSeqs[0];
    let bestScore = -Infinity;

    for (const seq of legalSeqs) {
        let score = 0;
        if (difficulty === 'beginner') {
            score = scoreBoard0PlyNoisy(seq.board, player, randomFn);
        } else if (difficulty === 'expert') {
            score = scoreBoard2PlyForOpponent(seq.board, player);
        } else {
            score = scoreBoard1Ply(seq.board, player);
        }

        if (score > bestScore) {
            bestScore = score;
            bestSeq = seq;
        }
    }

    return bestSeq;
}
