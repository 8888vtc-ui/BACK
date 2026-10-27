/**
 * Sous-reducer pour les actions de match (START_NEW_GAME, RESET_MATCH, NEW_MATCH, RESIGN_GAME, SET_DIFFICULTY, APPLY_REMOTE_STATE).
 * Conforme à SCALABILITY.md (< 250 lignes, 0 any).
 */

import type { BackgammonGameState, GameAction } from '../gameStateReducer';
import type { Player } from '../../engine/backgammonEngine';
import { createInitialState } from '../../engine/backgammonEngine';
import { evaluateWin, type GameResult, type WinType, type AIDifficulty } from '../../engine/aiHeuristics';
import {
    createProvablyFairSession,
    revealSessionServerSeed,
} from '../../lib/crypto/provablyFairRng';

export type MatchAction = Extract<
    GameAction,
    | { type: 'START_NEW_GAME' }
    | { type: 'RESET_MATCH' }
    | { type: 'NEW_MATCH'; matchLength: number; difficulty: AIDifficulty }
    | { type: 'RESIGN_GAME'; multiplier: 1 | 2 | 3; winner?: Player }
    | { type: 'SET_DIFFICULTY'; difficulty: AIDifficulty }
    | { type: 'APPLY_REMOTE_STATE' }
>;

export function isMatchAction(action: GameAction): action is MatchAction {
    switch (action.type) {
        case 'START_NEW_GAME':
        case 'RESET_MATCH':
        case 'NEW_MATCH':
        case 'RESIGN_GAME':
        case 'SET_DIFFICULTY':
        case 'APPLY_REMOTE_STATE':
            return true;
        default:
            return false;
    }
}

export function handleMatchAction(
    state: BackgammonGameState,
    action: MatchAction,
): BackgammonGameState {
    const currentPf = state.provablyFair ?? createProvablyFairSession();

    switch (action.type) {
        case 'SET_DIFFICULTY': {
            return {
                ...state,
                difficulty: action.difficulty,
            };
        }

        case 'NEW_MATCH': {
            const fresh = createInitialState(action.matchLength);
            return {
                ...state,
                boardState: fresh,
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                doublingOfferedBy: null,
                gameResult: null,
                crawfordAlreadyPlayed: false,
                matchLength: action.matchLength,
                difficulty: action.difficulty,
                lastOpponentDice: null,
                lastOpponentMoves: null,
                opponentHighlight: null,
                opponentStatusMessage: null,
                moveHistory: [],
                matchLog: [],
                provablyFair: createProvablyFairSession({
                    clientSeedA: currentPf.clientSeedA,
                    clientSeedB: currentPf.clientSeedB,
                }),
            };
        }

        case 'START_NEW_GAME': {
            let nextScoreX = state.boardState.scoreX;
            let nextScoreO = state.boardState.scoreO;
            let crawfordAlreadyPlayed = state.crawfordAlreadyPlayed;

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
                provablyFair: createProvablyFairSession({
                    clientSeedA: currentPf.clientSeedA,
                    clientSeedB: currentPf.clientSeedB,
                }),
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
                provablyFair: createProvablyFairSession({
                    clientSeedA: currentPf.clientSeedA,
                    clientSeedB: currentPf.clientSeedB,
                }),
            };
        }

        case 'RESIGN_GAME': {
            if (state.phase === 'GAME_OVER') return state;

            const winner: Player = action.winner ?? 'O';
            const loser: Player = winner === 'X' ? 'O' : 'X';
            const multiplier: 1 | 2 | 3 = action.multiplier;
            const winType: WinType =
                multiplier === 3 ? 'backgammon' : multiplier === 2 ? 'gammon' : 'single';
            const pointsWon = multiplier * state.boardState.cubeValue;

            const nextScoreX = winner === 'X' ? state.boardState.scoreX + pointsWon : state.boardState.scoreX;
            const nextScoreO = winner === 'O' ? state.boardState.scoreO + pointsWon : state.boardState.scoreO;

            const result: GameResult = {
                winner,
                loser,
                winType,
                multiplier,
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
                selected: null,
                moveHistory: [],
                gameResult: result,
                provablyFair: revealSessionServerSeed(currentPf),
            };
        }

        case 'APPLY_REMOTE_STATE': {
            const nextBoard = action.board;
            const baseScoreX = action.scoreX !== undefined ? action.scoreX : state.boardState.scoreX;
            const baseScoreO = action.scoreO !== undefined ? action.scoreO : state.boardState.scoreO;
            const win = evaluateWin(nextBoard, action.cubeValue ?? state.boardState.cubeValue);
            const nextScoreX = win
                ? win.winner === 'X'
                    ? baseScoreX + win.pointsWon
                    : baseScoreX
                : baseScoreX;
            const nextScoreO = win
                ? win.winner === 'O'
                    ? baseScoreO + win.pointsWon
                    : baseScoreO
                : baseScoreO;

            let crawfordAlreadyPlayed = state.crawfordAlreadyPlayed;
            if (action.crawford === true) {
                crawfordAlreadyPlayed = true;
            } else if (action.crawford === false && action.scoreX === 0 && action.scoreO === 0) {
                crawfordAlreadyPlayed = false;
            }

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
                    crawford: action.crawford !== undefined ? action.crawford : state.boardState.crawford,
                },
                phase: win ? 'GAME_OVER' : action.phase !== undefined ? action.phase : state.phase,
                usedDice: action.usedDice !== undefined ? action.usedDice : state.usedDice,
                selected: null,
                moveHistory: [],
                doublingOfferedBy:
                    action.doublingOfferedBy !== undefined ? action.doublingOfferedBy : state.doublingOfferedBy,
                crawfordAlreadyPlayed,
                gameResult: win ?? (action.phase && action.phase !== 'GAME_OVER' ? null : state.gameResult),
                provablyFair: win ? revealSessionServerSeed(currentPf) : currentPf,
            };
        }
    }
}
