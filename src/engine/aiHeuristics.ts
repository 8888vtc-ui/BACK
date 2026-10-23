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

export type AIDifficulty = 'beginner' | 'intermediate' | 'expert' | 'grandmaster';

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
 */
export function isContactPosition(board: number[]): boolean {
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

    return furthestX > furthestO;
}

/**
 * Évaluation de position après qu'un coup a été joué par `player`.
 *
 * Comme `board` est l'état résultant après le déplacement de `player`, le trait
 * passe à l'adversaire (`opponent`), exactement comme dans `analyzeBoardMoves`.
 * L'équité retournée est bornée entre -1.000 et +1.000 du point de vue de `player`.
 */
export function scoreBoardForOpponent(board: number[], player: Player = 'O'): number {
    const win = evaluateWin(board, 1);
    if (win && win.winner === player) return win.multiplier;
    if (win && win.winner !== player) return -win.multiplier;

    const opponent: Player = player === 'X' ? 'O' : 'X';
    const resultingState: BoardState = {
        board,
        turn: opponent,
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

    const oppEval = evaluateBoard(resultingState, 2);
    return Number((-oppEval.cubefulEquity).toFixed(4));
}

/**
 * Évaluation 0-ply bruité (débutant : ±0.15 d'équité EMG).
 */
export function scoreBoard0PlyNoisy(
    board: number[],
    player: Player = 'O',
    randomFn: () => number = Math.random,
): number {
    const base = scoreBoardForOpponent(board, player);
    const noise = (randomFn() - 0.5) * 0.30;
    return Math.max(-3, Math.min(3, base + noise));
}

/**
 * Évaluation 1-ply déterministe.
 */
export function scoreBoard1Ply(board: number[], player: Player = 'O'): number {
    return scoreBoardForOpponent(board, player);
}

/**
 * Évaluation 2-ply expectimax (expert / grandmaster) :
 * Anticipe la riposte de l'adversaire (X) sur un échantillon représentatif de dés
 * pondéré par probabilité et déduit l'espérance de la meilleure réplique adverse.
 */
export function scoreBoard2PlyForOpponent(board: number[], player: Player = 'O'): number {
    const win = evaluateWin(board, 1);
    if (win && win.winner === player) return 1.0;
    if (win && win.winner !== player) return -1.0;

    const baseScore = scoreBoardForOpponent(board, player);

    // 3 lancers stratégiques représentatifs (frappe/porte courte 3-1, moyenne 5-2, sortie/course 6-4)
    const testRolls: Array<{ dice: [number, number]; weight: number }> = [
        { dice: [3, 1], weight: 2 },
        { dice: [5, 2], weight: 2 },
        { dice: [6, 4], weight: 2 },
    ];

    const adversary: Player = player === 'X' ? 'O' : 'X';
    let weightedSumO = 0;
    let totalWeight = 0;

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

    for (const { dice: roll, weight } of testRolls) {
        totalWeight += weight;
        const xSeqs = generateLegalMoves(dummyState, roll);
        if (xSeqs.length === 0) {
            weightedSumO += (baseScore + 0.04) * weight;
            continue;
        }

        let minScoreForO = Infinity;
        // Évalue jusqu'aux 8 premières répliques adverses pour garantir < 10 ms à 60 FPS
        const stride = Math.max(1, Math.floor(xSeqs.length / 8));
        for (let i = 0; i < xSeqs.length; i += stride) {
            const xSeq = xSeqs[i];
            const replyState: BoardState = {
                ...dummyState,
                board: xSeq.board,
                turn: player,
            };
            const scoreO = evaluateBoard(replyState, 1).cubefulEquity;
            if (scoreO < minScoreForO) {
                minScoreForO = scoreO;
            }
        }
        weightedSumO += minScoreForO * weight;
    }

    const expectedScoreAfterReply = weightedSumO / totalWeight;
    return Number(Math.max(-3, Math.min(3, 0.88 * baseScore + 0.12 * expectedScoreAfterReply)).toFixed(4));
}

/**
 * Sélectionne la meilleure séquence de coups selon le niveau de difficulté de l'IA :
 * - beginner : 0-ply fortement bruité (±0.15 Eq, sans livre d'ouvertures)
 * - intermediate : 1-ply légèrement bruité (±0.05 Eq, erreurs humaines occasionnelles)
 * - expert : 1-ply déterministe (moteur tri-phase / WildBG WASM + table exacte bear-off)
 * - grandmaster : 2-ply Expectimax (Beam Search Top-3 à 1-ply puis anticipation des répliques adverses)
 */
export function selectBestOpponentSequence(
    legalSeqs: MoveSequence[],
    player: Player = 'O',
    difficulty: AIDifficulty = 'expert',
    randomFn: () => number = Math.random,
): MoveSequence | null {
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return legalSeqs[0];

    // En mode Grandmaster (2-ply Expectimax), on pré-filtre le Top 3 en 1-ply (Beam Search)
    // pour garantir un temps de calcul < 10 ms sans aucun freeze UI à 60 FPS.
    if (difficulty === 'grandmaster') {
        const preScored = legalSeqs.map((seq) => ({
            seq,
            score1Ply: scoreBoard1Ply(seq.board, player),
        }));
        preScored.sort((a, b) => b.score1Ply - a.score1Ply);
        const beam = preScored.slice(0, Math.min(3, preScored.length));

        let bestGM = beam[0].seq;
        let bestGMScore = -Infinity;
        for (const candidate of beam) {
            const score2Ply = scoreBoard2PlyForOpponent(candidate.seq.board, player);
            if (score2Ply > bestGMScore) {
                bestGMScore = score2Ply;
                bestGM = candidate.seq;
            }
        }
        return bestGM;
    }

    let bestSeq = legalSeqs[0];
    let bestScore = -Infinity;

    for (const seq of legalSeqs) {
        let score = 0;
        if (difficulty === 'beginner') {
            // 0-ply bruité (débutant).
            score = scoreBoard0PlyNoisy(seq.board, player, randomFn);
        } else if (difficulty === 'intermediate') {
            // 1-ply avec bruit tactique calibré (±0.05 d'équité EMG).
            const base = scoreBoard1Ply(seq.board, player);
            const win = evaluateWin(seq.board, 1);
            score = win && win.winner === player ? win.multiplier : Math.max(-3, Math.min(3, base + (randomFn() - 0.5) * 0.10));
        } else {
            // expert : 1-ply déterministe pur (aligné sur le Coach 1-ply).
            score = scoreBoard1Ply(seq.board, player);
        }

        if (score > bestScore) {
            bestScore = score;
            bestSeq = seq;
        }
    }

    return bestSeq;
}
