/**
 * Sous-reducer pour les lancers de dés et graines RNG (ROLL_DICE, SET_CLIENT_SEEDS).
 * Conforme à SCALABILITY.md (< 150 lignes, 0 any).
 */

import type { BackgammonGameState, GameAction, GamePhase } from '../gameStateReducer';
import type { BoardState, Player } from '../../engine/backgammonEngine';
import { generateLegalMoves } from '../../engine/backgammonEngine';
import { recordFlightEvent } from '../../utils/gameFlightRecorder';
import {
    createProvablyFairSession,
    recordSessionRoll,
    updateSessionClientSeeds,
} from '../../lib/crypto/provablyFairRng';

export type RollAction = Extract<GameAction, { type: 'ROLL_DICE' } | { type: 'SET_CLIENT_SEEDS' }>;

export function isRollAction(action: GameAction): action is RollAction {
    return action.type === 'ROLL_DICE' || action.type === 'SET_CLIENT_SEEDS';
}

export function handleRollAction(
    state: BackgammonGameState,
    action: RollAction,
): BackgammonGameState {
    const currentPf = state.provablyFair ?? createProvablyFairSession();

    switch (action.type) {
        case 'ROLL_DICE': {
            if (state.phase !== 'WAITING_FOR_ROLL') return state;

            const rollRecord = recordSessionRoll(
                currentPf,
                state.boardState.turn,
                action.dice,
            );
            const dice: [number, number] = rollRecord.dice;
            const d1 = dice[0];
            const d2 = dice[1];
            const isDouble = d1 === d2;
            const initialUsedDice: boolean[] = isDouble ? [false, false, false, false] : [false, false];

            const nextBoardState: BoardState = {
                ...state.boardState,
                dice,
            };

            const legalSeqs = generateLegalMoves(nextBoardState, dice);

            recordFlightEvent({
                ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                event: 'DICE_ROLLED',
                player: state.boardState.turn,
                dice,
                isAiThinking: false,
                boardBefore: [...state.boardState.board],
                boardAfter: [...state.boardState.board],
                arrows: [],
                statusMessage: null,
            });

            if (legalSeqs.length === 0) {
                if (action.deferBlockedTransition) {
                    return {
                        ...state,
                        boardState: nextBoardState,
                        phase: 'PLAYING_MOVES',
                        usedDice: isDouble ? [true, true, true, true] : [true, true],
                        selected: null,
                        opponentHighlight: null,
                        opponentStatusMessage: 'Bloqué — aucun coup possible',
                        provablyFair: rollRecord.nextSession,
                    };
                }

                const nextTurn: Player = state.boardState.turn === 'X' ? 'O' : 'X';
                const nextPhase: GamePhase =
                    nextTurn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL';

                recordFlightEvent({
                    ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                    event: 'TURN_FINISHED',
                    player: state.boardState.turn,
                    dice,
                    isAiThinking: false,
                    boardBefore: [...state.boardState.board],
                    boardAfter: [...state.boardState.board],
                    arrows: [],
                    statusMessage: 'Bloqué - tour passé',
                });

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
                    provablyFair: rollRecord.nextSession,
                };
            }

            return {
                ...state,
                boardState: nextBoardState,
                phase: 'PLAYING_MOVES',
                usedDice: initialUsedDice,
                selected: null,
                opponentHighlight: null,
                opponentStatusMessage: null,
                provablyFair: rollRecord.nextSession,
            };
        }

        case 'SET_CLIENT_SEEDS': {
            return {
                ...state,
                provablyFair: updateSessionClientSeeds(
                    currentPf,
                    action.clientSeedA,
                    action.clientSeedB,
                ),
            };
        }
    }
}
