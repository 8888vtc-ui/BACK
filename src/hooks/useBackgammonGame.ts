'use client';

import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    BoardState,
    Player,
    Move,
    MoveSequence,
    createInitialState,
    applyMove,
    borneOffCount,
    pipCount,
    generateLegalMoves,
    computeLegalTargets,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../engine/backgammonEngine';
import { soundEngine } from '../lib/sound/soundEngine';
import { Locale } from '../lib/i18n/types';
import {
    formatOpponentDiceRollStatus,
    formatOpponentMoveStepStatus,
    formatOpponentBlockedStatus,
    getBoardPointLabel,
} from '../lib/i18n/engineMessages';
import { addMonitoringBreadcrumb } from '../lib/monitoring/sentry';

export type GamePhase =
    | 'WAITING_FOR_ROLL'
    | 'DOUBLING_OFFERED'
    | 'PLAYING_MOVES'
    | 'OPPONENT_THINKING'
    | 'GAME_OVER';

export type WinType = 'single' | 'gammon' | 'backgammon' | 'pass';

export interface GameResult {
    winner: Player;
    loser: Player;
    winType: WinType;
    multiplier: number;
    pointsWon: number;
}

export type AIDifficulty = 'beginner' | 'intermediate' | 'expert';

export interface UseBackgammonGameOptions {
    matchLength?: number;
    initialScoreX?: number;
    initialScoreO?: number;
    initialTurn?: Player;
    initialDifficulty?: AIDifficulty;
    autoOpponent?: boolean;
    opponentDelayMs?: number;
    stepDelayMs?: number;
    forcedOpponentDice?: [number, number];
    playerColor?: Player;
    onGameOver?: (result: GameResult) => void;
    locale?: Locale;
}

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

// ---------------------------------------------------------------------------
// Reducer de la machine à états
// ---------------------------------------------------------------------------

export interface BackgammonGameState {
    boardState: BoardState;
    phase: GamePhase;
    usedDice: boolean[];
    selected: { point: number; die: 0 | 1 | null } | null;
    doublingOfferedBy: Player | null;
    gameResult: GameResult | null;
    crawfordAlreadyPlayed: boolean;
    matchLength: number;
    autoOpponent: boolean;
    difficulty: AIDifficulty;
    lastOpponentDice: [number, number] | null;
    lastOpponentMoves: Move[] | null;
    opponentHighlight: { from: number; to: number }[] | null;
    opponentStatusMessage: string | null;
    /** Historique des sous-mouvements du tour courant (pour Undo). */
    moveHistory: { board: number[]; usedDice: boolean[] }[];
}

export type GameAction =
    | { type: 'ROLL_DICE'; dice?: [number, number] }
    | { type: 'SELECT_CHECKER'; point: number; die?: 0 | 1 | null }
    | { type: 'DESELECT' }
    | { type: 'SET_SELECTED_DIE'; die: 0 | 1 }
    | { type: 'MOVE_CHECKER'; destination: number; from?: number; die?: 0 | 1 }
    | { type: 'PLAY_MOVE'; from: number; to: number; die?: 0 | 1 }
    | { type: 'OFFER_DOUBLE' }
    | { type: 'TAKE_DOUBLE' }
    | { type: 'PASS_DOUBLE' }
    | { type: 'PLAY_OPPONENT'; dice?: [number, number] }
    | { type: 'OPPONENT_START_TURN'; dice: [number, number]; statusMessage: string }
    | {
        type: 'OPPONENT_APPLY_STEP';
        board: number[];
        move: Move;
        usedDiceIndex: number;
        statusMessage: string;
    }
    | {
        type: 'OPPONENT_FINISH_TURN';
        finalBoard: number[];
        dice: [number, number];
        moves: Move[];
        gameResult?: GameResult | null;
    }
    | { type: 'UNDO_MOVE' }
    | { type: 'SET_DIFFICULTY'; difficulty: AIDifficulty }
    | { type: 'START_NEW_GAME' }
    | { type: 'RESET_MATCH' }
    | {
        type: 'APPLY_REMOTE_STATE';
        board: number[];
        dice?: [number, number] | null;
        turn?: Player;
        usedDice?: boolean[];
        phase?: GamePhase;
        cubeValue?: number;
        cubeOwner?: Player | null;
    };

export function createInitialGameState(
    matchLength = 7,
    initialScoreX = 0,
    initialScoreO = 0,
    initialTurn: Player = 'X',
    autoOpponent = true,
    initialDifficulty: AIDifficulty = 'intermediate',
): BackgammonGameState {
    const isCrawford =
        matchLength > 0 &&
        (initialScoreX === matchLength - 1 || initialScoreO === matchLength - 1);

    return {
        boardState: {
            ...createInitialState(matchLength),
            scoreX: initialScoreX,
            scoreO: initialScoreO,
            turn: initialTurn,
            crawford: isCrawford,
        },
        phase: autoOpponent && initialTurn === 'O' ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL',
        usedDice: [false, false],
        selected: null,
        doublingOfferedBy: null,
        gameResult: null,
        crawfordAlreadyPlayed: isCrawford,
        matchLength,
        autoOpponent,
        difficulty: initialDifficulty,
        lastOpponentDice: null,
        lastOpponentMoves: null,
        opponentHighlight: null,
        opponentStatusMessage: null,
        moveHistory: [],
    };
}

export function backgammonGameReducer(
    state: BackgammonGameState,
    action: GameAction,
): BackgammonGameState {
    switch (action.type) {
        case 'ROLL_DICE': {
            if (state.phase !== 'WAITING_FOR_ROLL') return state;

            const d1 = action.dice ? action.dice[0] : Math.floor(Math.random() * 6) + 1;
            const d2 = action.dice ? action.dice[1] : Math.floor(Math.random() * 6) + 1;
            const dice: [number, number] = [d1, d2];
            const isDouble = d1 === d2;
            const initialUsedDice: boolean[] = isDouble ? [false, false, false, false] : [false, false];

            const nextBoardState: BoardState = {
                ...state.boardState,
                dice,
            };

            const legalSeqs = generateLegalMoves(nextBoardState, dice);

            if (legalSeqs.length === 0) {
                // Fanned / bloqué
                const nextTurn: Player = state.boardState.turn === 'X' ? 'O' : 'X';
                const nextPhase: GamePhase =
                    nextTurn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL';

                return {
                    ...state,
                    boardState: {
                        ...nextBoardState,
                        dice: null,
                        turn: nextTurn,
                    },
                    phase: nextPhase,
                    usedDice: [false, false],
                    selected: null,
                };
            }

            return {
                ...state,
                boardState: nextBoardState,
                phase: 'PLAYING_MOVES',
                usedDice: initialUsedDice,
                selected: null,
                // Efface l'historique visuel du dernier coup de l'IA au lancer du joueur
                opponentHighlight: null,
            };
        }

        case 'SELECT_CHECKER': {
            if (state.phase !== 'PLAYING_MOVES' || !state.boardState.dice) return state;

            const { leftDieTargets, rightDieTargets } = computeLegalTargets(
                state.boardState,
                state.boardState.dice,
                state.usedDice,
            );

            const isDouble = state.boardState.dice[0] === state.boardState.dice[1];
            if (isDouble) {
                if (leftDieTargets.has(action.point) || rightDieTargets.has(action.point)) {
                    return {
                        ...state,
                        selected: { point: action.point, die: 0 },
                    };
                }
                return state;
            }

            if (action.die !== undefined && action.die !== null) {
                const targets = action.die === 0 ? leftDieTargets : rightDieTargets;
                if (targets.has(action.point)) {
                    return {
                        ...state,
                        selected: { point: action.point, die: action.die },
                    };
                }
                return state;
            }

            // Si aucun dé n'est spécifié (sélection du pion avec affichage de toutes ses cibles)
            if (leftDieTargets.has(action.point) || rightDieTargets.has(action.point)) {
                return {
                    ...state,
                    selected: { point: action.point, die: null },
                };
            }
            return state;
        }

        case 'DESELECT': {
            if (!state.selected) return state;
            return {
                ...state,
                selected: null,
            };
        }

        case 'SET_SELECTED_DIE': {
            if (!state.selected || !state.boardState.dice) return state;
            const isDouble = state.boardState.dice[0] === state.boardState.dice[1];
            if (isDouble) return state;

            const { leftDieTargets, rightDieTargets } = computeLegalTargets(
                state.boardState,
                state.boardState.dice,
                state.usedDice,
            );
            const targets = action.die === 0 ? leftDieTargets : rightDieTargets;
            if (targets.has(state.selected.point)) {
                return {
                    ...state,
                    selected: { point: state.selected.point, die: action.die },
                };
            }
            return state;
        }

        case 'PLAY_MOVE':
        case 'MOVE_CHECKER': {
            const dest = action.type === 'PLAY_MOVE' ? action.to : action.destination;
            const from = action.from !== undefined ? action.from : state.selected?.point;

            if (from === undefined || state.phase !== 'PLAYING_MOVES' || !state.boardState.dice) {
                return state;
            }

            const { leftDieTargets, rightDieTargets } = computeLegalTargets(
                state.boardState,
                state.boardState.dice,
                state.usedDice,
            );

            const isDouble = state.boardState.dice[0] === state.boardState.dice[1];
            let chosenDie: 0 | 1 | null = null;

            if (isDouble) {
                const validDests = (leftDieTargets.get(from) ?? []).concat(rightDieTargets.get(from) ?? []);
                if (validDests.includes(dest)) {
                    chosenDie = 0;
                }
            } else {
                const requestedDie = action.die !== undefined ? action.die : state.selected?.die;
                const leftDests = leftDieTargets.get(from) ?? [];
                const rightDests = rightDieTargets.get(from) ?? [];

                if (requestedDie === 0 && leftDests.includes(dest)) {
                    chosenDie = 0;
                } else if (requestedDie === 1 && rightDests.includes(dest)) {
                    chosenDie = 1;
                } else if (leftDests.includes(dest)) {
                    chosenDie = 0;
                } else if (rightDests.includes(dest)) {
                    chosenDie = 1;
                }
            }

            if (chosenDie === null) {
                return state;
            }

            const move: Move = { from, to: dest };
            const newBoard = applyMove(state.boardState.board, move, state.boardState.turn);

            // Enregistre un snapshot pour permettre l'Undo du sous-mouvement
            const moveHistory = [
                ...state.moveHistory,
                { board: state.boardState.board, usedDice: [...state.usedDice] },
            ];

            let newUsed: boolean[];
            if (isDouble) {
                newUsed = [...state.usedDice];
                while (newUsed.length < 4) newUsed.push(false);
                const firstUnused = newUsed.findIndex((u) => !u);
                if (firstUnused !== -1) {
                    newUsed[firstUnused] = true;
                }
            } else {
                newUsed = [state.usedDice[0] ?? false, state.usedDice[1] ?? false];
                newUsed[chosenDie] = true;
            }

            // 1. Victoire immédiate
            const win = evaluateWin(newBoard, state.boardState.cubeValue);
            if (win) {
                const nextScoreX = win.winner === 'X' ? state.boardState.scoreX + win.pointsWon : state.boardState.scoreX;
                const nextScoreO = win.winner === 'O' ? state.boardState.scoreO + win.pointsWon : state.boardState.scoreO;

                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        board: newBoard,
                        scoreX: nextScoreX,
                        scoreO: nextScoreO,
                    },
                    phase: 'GAME_OVER',
                    usedDice: newUsed,
                    selected: null,
                    gameResult: win,
                    moveHistory: [],
                };
            }

            // 2. Vérification de fin de tour selon les règles officielles (tous dés consommés ou aucun coup restant possible)
            const stateAfterMove = { ...state.boardState, board: newBoard };
            const nextTargets = computeLegalTargets(stateAfterMove, state.boardState.dice, newUsed);
            const allUsed = newUsed.every(Boolean);
            const noMoreMoves = nextTargets.leftDieTargets.size === 0 && nextTargets.rightDieTargets.size === 0;
            const turnFinished = allUsed || noMoreMoves;

            if (turnFinished) {
                const nextTurn: Player = state.boardState.turn === 'X' ? 'O' : 'X';
                const nextPhase: GamePhase =
                    nextTurn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL';

                return {
                    ...state,
                    boardState: {
                        ...stateAfterMove,
                        dice: null,
                        turn: nextTurn,
                    },
                    phase: nextPhase,
                    usedDice: [false, false],
                    selected: null,
                    moveHistory: [],
                };
            }

            return {
                ...state,
                boardState: stateAfterMove,
                usedDice: newUsed,
                selected: null,
                moveHistory,
            };
        }

        case 'OFFER_DOUBLE': {
            if (state.phase !== 'WAITING_FOR_ROLL') return state;
            if (state.boardState.crawford) return state;
            if (state.boardState.cubeOwner !== null && state.boardState.cubeOwner !== state.boardState.turn) {
                return state;
            }
            if (
                state.matchLength > 0 &&
                (state.boardState.scoreX >= state.matchLength || state.boardState.scoreO >= state.matchLength)
            ) {
                return state;
            }

            return {
                ...state,
                phase: 'DOUBLING_OFFERED',
                doublingOfferedBy: state.boardState.turn,
            };
        }

        case 'TAKE_DOUBLE': {
            if (state.phase !== 'DOUBLING_OFFERED' || !state.doublingOfferedBy) return state;

            const acceptingPlayer: Player = state.doublingOfferedBy === 'X' ? 'O' : 'X';
            const nextCubeValue = state.boardState.cubeValue === 1 ? 2 : state.boardState.cubeValue * 2;

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    cubeValue: nextCubeValue,
                    cubeOwner: acceptingPlayer,
                },
                phase: 'WAITING_FOR_ROLL',
                doublingOfferedBy: null,
            };
        }

        case 'PASS_DOUBLE': {
            if (state.phase !== 'DOUBLING_OFFERED' || !state.doublingOfferedBy) return state;

            const winner = state.doublingOfferedBy;
            const loser: Player = winner === 'X' ? 'O' : 'X';
            const pointsWon = state.boardState.cubeValue;

            const nextScoreX = winner === 'X' ? state.boardState.scoreX + pointsWon : state.boardState.scoreX;
            const nextScoreO = winner === 'O' ? state.boardState.scoreO + pointsWon : state.boardState.scoreO;

            const result: GameResult = {
                winner,
                loser,
                winType: 'pass',
                multiplier: 1,
                pointsWon,
            };

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    scoreX: nextScoreX,
                    scoreO: nextScoreO,
                },
                phase: 'GAME_OVER',
                doublingOfferedBy: null,
                gameResult: result,
            };
        }

        case 'PLAY_OPPONENT': {
            if (state.phase === 'GAME_OVER') return state;

            const d1 = action.dice ? action.dice[0] : Math.floor(Math.random() * 6) + 1;
            const d2 = action.dice ? action.dice[1] : Math.floor(Math.random() * 6) + 1;
            const rolledDice: [number, number] = [d1, d2];

            const stateWithDice: BoardState = {
                ...state.boardState,
                dice: rolledDice,
                turn: 'O',
            };

            const legalSeqs = generateLegalMoves(stateWithDice, rolledDice);

            if (legalSeqs.length === 0) {
                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        dice: null,
                        turn: 'X',
                    },
                    phase: 'WAITING_FOR_ROLL',
                    usedDice: [false, false],
                    selected: null,
                    lastOpponentDice: rolledDice,
                    lastOpponentMoves: [],
                };
            }

            const best = selectBestOpponentSequence(legalSeqs, 'O', state.difficulty);
            if (!best) {
                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        dice: null,
                        turn: 'X',
                    },
                    phase: 'WAITING_FOR_ROLL',
                    usedDice: [false, false],
                    selected: null,
                    lastOpponentDice: rolledDice,
                    lastOpponentMoves: [],
                };
            }

            const win = evaluateWin(best.board, state.boardState.cubeValue);
            if (win) {
                const nextScoreX = win.winner === 'X' ? state.boardState.scoreX + win.pointsWon : state.boardState.scoreX;
                const nextScoreO = win.winner === 'O' ? state.boardState.scoreO + win.pointsWon : state.boardState.scoreO;

                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        board: best.board,
                        dice: rolledDice,
                        scoreX: nextScoreX,
                        scoreO: nextScoreO,
                    },
                    phase: 'GAME_OVER',
                    gameResult: win,
                    lastOpponentDice: rolledDice,
                    lastOpponentMoves: best.moves,
                };
            }

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: best.board,
                    dice: null,
                    turn: 'X',
                },
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                lastOpponentDice: rolledDice,
                lastOpponentMoves: best.moves,
                opponentHighlight: null,
                opponentStatusMessage: null,
            };
        }

        case 'OPPONENT_START_TURN': {
            if (state.phase === 'GAME_OVER') return state;
            const isDouble = action.dice[0] === action.dice[1];
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    dice: action.dice,
                    turn: 'O',
                },
                phase: 'OPPONENT_THINKING',
                usedDice: isDouble ? [false, false, false, false] : [false, false],
                lastOpponentDice: action.dice,
                opponentHighlight: null,
                opponentStatusMessage: action.statusMessage,
            };
        }

        case 'OPPONENT_APPLY_STEP': {
            if (state.phase === 'GAME_OVER') return state;
            const newUsed = [...state.usedDice];
            if (action.usedDiceIndex >= 0 && action.usedDiceIndex < newUsed.length) {
                newUsed[action.usedDiceIndex] = true;
            }
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: action.board,
                },
                usedDice: newUsed,
                opponentHighlight: [
                    ...(state.opponentHighlight ?? []),
                    { from: action.move.from, to: action.move.to },
                ],
                opponentStatusMessage: action.statusMessage,
            };
        }

        case 'OPPONENT_FINISH_TURN': {
            if (state.phase === 'GAME_OVER') return state;
            if (action.gameResult) {
                const nextScoreX = action.gameResult.winner === 'X' ? state.boardState.scoreX + action.gameResult.pointsWon : state.boardState.scoreX;
                const nextScoreO = action.gameResult.winner === 'O' ? state.boardState.scoreO + action.gameResult.pointsWon : state.boardState.scoreO;
                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        board: action.finalBoard,
                        scoreX: nextScoreX,
                        scoreO: nextScoreO,
                    },
                    phase: 'GAME_OVER',
                    gameResult: action.gameResult,
                    lastOpponentDice: action.dice,
                    lastOpponentMoves: action.moves,
                    opponentHighlight: null,
                    opponentStatusMessage: null,
                };
            }

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: action.finalBoard,
                    dice: null,
                    turn: 'X',
                },
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                lastOpponentDice: action.dice,
                lastOpponentMoves: action.moves,
                // Conserve le dernier coup joué (historique visuel) jusqu'au prochain lancer du joueur
                opponentHighlight: state.opponentHighlight,
                opponentStatusMessage: null,
            };
        }

        case 'UNDO_MOVE': {
            if (state.phase !== 'PLAYING_MOVES' || state.moveHistory.length === 0) {
                return state;
            }
            const last = state.moveHistory[state.moveHistory.length - 1];
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: last.board,
                },
                usedDice: [...last.usedDice],
                selected: null,
                moveHistory: state.moveHistory.slice(0, -1),
            };
        }

        case 'SET_DIFFICULTY': {
            return {
                ...state,
                difficulty: action.difficulty,
            };
        }

        case 'START_NEW_GAME': {
            let nextScoreX = state.boardState.scoreX;
            let nextScoreO = state.boardState.scoreO;
            let crawfordAlreadyPlayed = state.crawfordAlreadyPlayed;

            // Si le match était déjà terminé (atteinte de matchLength), réinitialise les scores pour un nouveau cycle
            if (state.matchLength > 0 && (nextScoreX >= state.matchLength || nextScoreO >= state.matchLength)) {
                nextScoreX = 0;
                nextScoreO = 0;
                crawfordAlreadyPlayed = false;
            }

            let isCrawford = false;
            if (state.matchLength > 0) {
                const eitherAtCrawford =
                    nextScoreX === state.matchLength - 1 || nextScoreO === state.matchLength - 1;
                if (eitherAtCrawford && !crawfordAlreadyPlayed) {
                    isCrawford = true;
                    crawfordAlreadyPlayed = true;
                }
            }

            const fresh = createInitialState(state.matchLength);
            return {
                ...state,
                boardState: {
                    ...fresh,
                    scoreX: nextScoreX,
                    scoreO: nextScoreO,
                    crawford: isCrawford,
                    cubeValue: 1,
                    cubeOwner: null,
                    dice: null,
                    turn: 'X',
                },
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                doublingOfferedBy: null,
                gameResult: null,
                crawfordAlreadyPlayed,
                lastOpponentDice: null,
                lastOpponentMoves: null,
                opponentHighlight: null,
                opponentStatusMessage: null,
                moveHistory: [],
            };
        }

        case 'RESET_MATCH': {
            const fresh = createInitialState(state.matchLength);
            return {
                ...state,
                boardState: fresh,
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                doublingOfferedBy: null,
                gameResult: null,
                crawfordAlreadyPlayed: false,
                lastOpponentDice: null,
                lastOpponentMoves: null,
                opponentHighlight: null,
                opponentStatusMessage: null,
                moveHistory: [],
            };
        }

        case 'APPLY_REMOTE_STATE': {
            const nextBoard = action.board;
            const win = evaluateWin(nextBoard, action.cubeValue ?? state.boardState.cubeValue);
            const nextScoreX = win
                ? win.winner === 'X'
                    ? state.boardState.scoreX + win.pointsWon
                    : state.boardState.scoreX
                : state.boardState.scoreX;
            const nextScoreO = win
                ? win.winner === 'O'
                    ? state.boardState.scoreO + win.pointsWon
                    : state.boardState.scoreO
                : state.boardState.scoreO;

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: nextBoard,
                    dice: action.dice !== undefined ? action.dice : state.boardState.dice,
                    turn: action.turn !== undefined ? action.turn : state.boardState.turn,
                    cubeValue: action.cubeValue !== undefined ? action.cubeValue : state.boardState.cubeValue,
                    cubeOwner: action.cubeOwner !== undefined ? action.cubeOwner : state.boardState.cubeOwner,
                    scoreX: nextScoreX,
                    scoreO: nextScoreO,
                },
                phase: win ? 'GAME_OVER' : action.phase !== undefined ? action.phase : state.phase,
                usedDice: action.usedDice !== undefined ? action.usedDice : state.usedDice,
                selected: null,
                gameResult: win ?? state.gameResult,
            };
        }

        default:
            return state;
    }
}

/**
 * Hook de jeu Backgammon : machine à états intégrée.
 */
export function useBackgammonGame(options: UseBackgammonGameOptions = {}) {
    const {
        matchLength = 7,
        initialScoreX = 0,
        initialScoreO = 0,
        initialTurn = 'X',
        initialDifficulty = 'intermediate',
        autoOpponent = true,
        opponentDelayMs = 600,
        stepDelayMs = 900,
        forcedOpponentDice,
        playerColor = 'X',
        onGameOver,
        locale = 'fr',
    } = options;

    const [state, dispatch] = useReducer(
        backgammonGameReducer,
        undefined,
        () =>
            createInitialGameState(
                matchLength,
                initialScoreX,
                initialScoreO,
                initialTurn,
                autoOpponent,
                initialDifficulty,
            ),
    );

    const { boardState, phase, usedDice, selected, doublingOfferedBy, gameResult, difficulty } = state;
    const dice = boardState.dice;
    const humanPlayer: Player = playerColor;
    const isHumanTurn = boardState.turn === humanPlayer;

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!dice || phase !== 'PLAYING_MOVES') {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
        return computeLegalTargets(boardState, dice, usedDice);
    }, [boardState, dice, usedDice, phase]);

    const canDouble = useMemo(() => {
        if (boardState.crawford) return false;
        if (phase !== 'WAITING_FOR_ROLL') return false;
        if (boardState.cubeOwner !== null && boardState.cubeOwner !== boardState.turn) return false;
        if (matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength)) return false;
        return true;
    }, [boardState.crawford, boardState.cubeOwner, boardState.turn, boardState.scoreX, boardState.scoreO, phase, matchLength]);

    const isMatchOver = useMemo(() => {
        if (matchLength <= 0) return false;
        return boardState.scoreX >= matchLength || boardState.scoreO >= matchLength;
    }, [boardState.scoreX, boardState.scoreO, matchLength]);

    const matchWinner: Player | null = useMemo(() => {
        if (matchLength <= 0) return null;
        if (boardState.scoreX >= matchLength) return 'X';
        if (boardState.scoreO >= matchLength) return 'O';
        return null;
    }, [boardState.scoreX, boardState.scoreO, matchLength]);

    const isCrawfordNext = useMemo(() => {
        if (matchLength <= 0 || isMatchOver) return false;
        if (state.crawfordAlreadyPlayed) return false;
        return (
            boardState.scoreX === matchLength - 1 ||
            boardState.scoreO === matchLength - 1
        );
    }, [matchLength, isMatchOver, state.crawfordAlreadyPlayed, boardState.scoreX, boardState.scoreO]);

    const onGameOverRef = useRef(onGameOver);
    useEffect(() => {
        onGameOverRef.current = onGameOver;
    }, [onGameOver]);

    const lastReportedGameResultRef = useRef<GameResult | null>(null);

    useEffect(() => {
        if (gameResult && gameResult !== lastReportedGameResultRef.current) {
            lastReportedGameResultRef.current = gameResult;
            onGameOverRef.current?.(gameResult);
        } else if (!gameResult) {
            lastReportedGameResultRef.current = null;
        }
    }, [gameResult]);

    const playOpponentTurn = useCallback((forcedDice?: [number, number]) => {
        dispatch({ type: 'PLAY_OPPONENT', dice: forcedDice });
    }, []);

    const boardStateRef = useRef(boardState);
    boardStateRef.current = boardState;

    const opponentTurnInProgressRef = useRef(false);
    const opponentTimersRef = useRef<NodeJS.Timeout[]>([]);

    const clearOpponentTimers = useCallback(() => {
        opponentTimersRef.current.forEach(clearTimeout);
        opponentTimersRef.current = [];
    }, []);

    // Nettoie les timers au démontage du hook
    useEffect(() => {
        return () => {
            clearOpponentTimers();
        };
    }, [clearOpponentTimers]);

    useEffect(() => {
        if (!autoOpponent) return;

        // Réinitialise le verrou d'animation et annule les timers si ce n'est plus à l'ordinateur
        if (boardState.turn !== 'O' || phase !== 'OPPONENT_THINKING') {
            opponentTurnInProgressRef.current = false;
            clearOpponentTimers();
            return;
        }

        // Si une animation de coup est déjà en cours d'exécution, ne pas relancer
        if (opponentTurnInProgressRef.current) return;

        // Mode immédiat (ex. tests unitaires ou délai à 0)
        if (opponentDelayMs === 0) {
            dispatch({ type: 'PLAY_OPPONENT', dice: forcedOpponentDice });
            return;
        }

        opponentTurnInProgressRef.current = true;
        clearOpponentTimers();

        // Étape 1 : Lancer des dés visibles sur le plateau (Message de statut localisé)
        const rolledDice: [number, number] =
            forcedOpponentDice ??
            (boardStateRef.current.dice
                ? [boardStateRef.current.dice[0], boardStateRef.current.dice[1]]
                : [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
        const d1 = rolledDice[0];
        const d2 = rolledDice[1];

        const initialStatus = formatOpponentDiceRollStatus(d1, d2, locale);
        dispatch({
            type: 'OPPONENT_START_TURN',
            dice: rolledDice,
            statusMessage: initialStatus,
        });
        soundEngine.playDiceRoll();

        const currentBoardState = boardStateRef.current;
        const stateWithDice: BoardState = {
            ...currentBoardState,
            dice: rolledDice,
            turn: 'O',
        };

        const legalSeqs = generateLegalMoves(stateWithDice, rolledDice);

        addMonitoringBreadcrumb({
            category: 'ai_turn_start',
            message: `IA Tour démarré: dés=[${rolledDice.join(', ')}], coups légaux=${legalSeqs.length}`,
            level: 'info',
            data: { dice: rolledDice, legalMovesCount: legalSeqs.length, difficulty },
        });

        if (legalSeqs.length === 0) {
            // Aucun coup légal possible : statut de blocage localisé puis fin de tour
            const blockedStatus = formatOpponentBlockedStatus(locale);
            addMonitoringBreadcrumb({
                category: 'ai_turn_blocked',
                message: `IA bloquée: aucun coup légal pour les dés [${rolledDice.join(', ')}]`,
                level: 'info',
            });
            dispatch({
                type: 'OPPONENT_START_TURN',
                dice: rolledDice,
                statusMessage: `${initialStatus} — ${blockedStatus}`,
            });
            const tBlocked = setTimeout(() => {
                dispatch({
                    type: 'OPPONENT_FINISH_TURN',
                    finalBoard: boardStateRef.current.board,
                    dice: rolledDice,
                    moves: [],
                });
                opponentTurnInProgressRef.current = false;
            }, opponentDelayMs + stepDelayMs);
            opponentTimersRef.current.push(tBlocked);
            return;
        }

        const best = selectBestOpponentSequence(legalSeqs, 'O', difficulty);
        if (!best || best.moves.length === 0) {
            const blockedStatus = formatOpponentBlockedStatus(locale);
            addMonitoringBreadcrumb({
                category: 'ai_turn_blocked',
                message: `IA bloquée: séquence choisie vide`,
                level: 'info',
            });
            dispatch({
                type: 'OPPONENT_START_TURN',
                dice: rolledDice,
                statusMessage: `${initialStatus} — ${blockedStatus}`,
            });
            const tNoMove = setTimeout(() => {
                dispatch({
                    type: 'OPPONENT_FINISH_TURN',
                    finalBoard: boardStateRef.current.board,
                    dice: rolledDice,
                    moves: [],
                });
                opponentTurnInProgressRef.current = false;
            }, opponentDelayMs + stepDelayMs);
            opponentTimersRef.current.push(tNoMove);
            return;
        }

        // Étape 2 : Déplacement séquentiel et visible de chaque pion (Pacing localisé)
        let currentBoard = currentBoardState.board;
        const moves = best.moves;
        const stepDelay = stepDelayMs; // Pause visible entre chaque coup

        moves.forEach((m, idx) => {
            const tStep = setTimeout(() => {
                const isHit = m.to !== O_OFF && currentBoard[m.to] === 1;
                if (isHit) {
                    soundEngine.playCheckerHit();
                } else {
                    soundEngine.playCheckerSlide();
                }
                currentBoard = applyMove(currentBoard, m, 'O');
                const fromLabel = getBoardPointLabel(m.from, m.from === O_BAR, false, locale);
                const toLabel = getBoardPointLabel(m.to, false, m.to === O_OFF, locale);
                const stepStatus = formatOpponentMoveStepStatus(
                    idx + 1,
                    moves.length,
                    fromLabel,
                    toLabel,
                    locale,
                );
                addMonitoringBreadcrumb({
                    category: 'ai_turn_step',
                    message: `IA Coup ${idx + 1}/${moves.length}: ${fromLabel} -> ${toLabel}${isHit ? ' (FRAPPE)' : ''}`,
                    level: 'debug',
                    data: { step: idx + 1, totalSteps: moves.length, move: m, isHit },
                });
                dispatch({
                    type: 'OPPONENT_APPLY_STEP',
                    board: currentBoard,
                    move: m,
                    usedDiceIndex: idx,
                    statusMessage: stepStatus,
                });
            }, opponentDelayMs + idx * stepDelay);
            opponentTimersRef.current.push(tStep);
        });

        // Étape 3 : Fin du tour après absorption visuelle de la nouvelle position
        const tFinish = setTimeout(() => {
            const win = evaluateWin(best.board, boardStateRef.current.cubeValue);
            addMonitoringBreadcrumb({
                category: 'ai_turn_finish',
                message: `IA Tour terminé: ${moves.length} coups joués${win ? ` · Victoire ${win.winner}` : ''}`,
                level: 'info',
                data: { movesCount: moves.length, gameResult: win },
            });
            dispatch({
                type: 'OPPONENT_FINISH_TURN',
                finalBoard: best.board,
                dice: rolledDice,
                moves: best.moves,
                gameResult: win,
            });
            opponentTurnInProgressRef.current = false;
        }, opponentDelayMs + moves.length * stepDelay + Math.min(stepDelay, 700));
        opponentTimersRef.current.push(tFinish);

        return () => {
            // Ne nettoie les timers QUE si le tour change réellement ou au unmount (pas à chaque step)
            if (boardStateRef.current.turn !== 'O') {
                clearOpponentTimers();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardState.turn, phase, difficulty, autoOpponent, opponentDelayMs, stepDelayMs, forcedOpponentDice, locale]);

    const rollDice = useCallback((forcedDice?: [number, number]) => {
        dispatch({ type: 'ROLL_DICE', dice: forcedDice });
    }, []);

    const selectChecker = useCallback((point: number, die?: 0 | 1 | null) => {
        dispatch({ type: 'SELECT_CHECKER', point, die });
    }, []);

    const deselect = useCallback(() => {
        dispatch({ type: 'DESELECT' });
    }, []);

    const setSelectedDie = useCallback((die: 0 | 1) => {
        dispatch({ type: 'SET_SELECTED_DIE', die });
    }, []);

    const moveChecker = useCallback((destination: number, from?: number, die?: 0 | 1) => {
        dispatch({ type: 'MOVE_CHECKER', destination, from, die });
    }, []);

    const playMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        dispatch({ type: 'PLAY_MOVE', from, to, die });
    }, []);

    const offerDouble = useCallback(() => {
        dispatch({ type: 'OFFER_DOUBLE' });
    }, []);

    const takeDouble = useCallback(() => {
        dispatch({ type: 'TAKE_DOUBLE' });
    }, []);

    const passDouble = useCallback(() => {
        dispatch({ type: 'PASS_DOUBLE' });
    }, []);

    const startNewGame = useCallback(() => {
        clearOpponentTimers();
        opponentTurnInProgressRef.current = false;
        dispatch({ type: 'START_NEW_GAME' });
    }, [clearOpponentTimers]);

    const setDifficulty = useCallback((difficulty: AIDifficulty) => {
        dispatch({ type: 'SET_DIFFICULTY', difficulty });
    }, []);

    const resetMatch = useCallback(() => {
        clearOpponentTimers();
        opponentTurnInProgressRef.current = false;
        dispatch({ type: 'RESET_MATCH' });
    }, [clearOpponentTimers]);

    useEffect(() => {
        if (!autoOpponent) return;
        if (phase === 'DOUBLING_OFFERED' && doublingOfferedBy === 'X') {
            const timer = setTimeout(() => {
                const score = scoreBoardForOpponent(boardState.board, 'O');
                if (score < -500) {
                    dispatch({ type: 'PASS_DOUBLE' });
                } else {
                    dispatch({ type: 'TAKE_DOUBLE' });
                }
            }, opponentDelayMs);
            return () => clearTimeout(timer);
        }
    }, [phase, doublingOfferedBy, autoOpponent, opponentDelayMs, boardState.board]);

    const applyRemoteState = useCallback(
        (payload: {
            board: number[];
            dice?: [number, number] | null;
            turn?: Player;
            usedDice?: [boolean, boolean] | boolean[];
            phase?: GamePhase;
            cubeValue?: number;
            cubeOwner?: Player | null;
        }) => {
            dispatch({ type: 'APPLY_REMOTE_STATE', ...payload });
        },
        [],
    );

    return {
        state: boardState,
        phase,
        humanPlayer,
        isHumanTurn,
        dice,
        usedDice,
        leftDieTargets,
        rightDieTargets,
        selected,
        canDouble,
        doublingOfferedBy,
        gameResult,
        isMatchOver,
        matchWinner,
        isCrawfordNext,
        crawfordAlreadyPlayed: state.crawfordAlreadyPlayed,
        difficulty: state.difficulty,
        lastOpponentDice: state.lastOpponentDice,
        lastOpponentMoves: state.lastOpponentMoves,
        opponentHighlight: state.opponentHighlight,
        opponentStatusMessage: state.opponentStatusMessage,
        canUndo: state.moveHistory.length > 0 && phase === 'PLAYING_MOVES',
        undoMove: () => dispatch({ type: 'UNDO_MOVE' }),
        rollDice,
        selectChecker,
        deselect,
        setSelectedDie,
        moveChecker,
        playMove,
        offerDouble,
        takeDouble,
        passDouble,
        setDifficulty,
        playOpponentTurn,
        startNewGame,
        resetMatch,
        applyRemoteState,
    };
}
