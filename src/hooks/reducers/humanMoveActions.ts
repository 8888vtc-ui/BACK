import type { GameState, GameAction, GamePhase } from '../gameStateReducer';
import {
    computeLegalTargets,
    type Player,
    type Move,
} from '../../engine/backgammonEngine';
import { recordFlightEvent } from '../../utils/gameFlightRecorder';
import { formatMoveSequenceNotationAbsolute } from '../../lib/engine/evaluator';
import type { MatchLogEntry } from '../../actions/types';
import { executeHumanMove } from './humanMoveExecutor';

export type HumanMoveAction = Extract<
    GameAction,
    | { type: 'SELECT_CHECKER' }
    | { type: 'DESELECT' }
    | { type: 'SET_SELECTED_DIE' }
    | { type: 'MOVE_CHECKER' }
    | { type: 'PLAY_MOVE' }
    | { type: 'COMMIT_HUMAN_TURN' }
    | { type: 'UNDO_MOVE' }
    | { type: 'REWIND_TO_LOG_TURN' }
>;

export function handleHumanMoveAction(state: GameState, action: HumanMoveAction): GameState {
    switch (action.type) {
        case 'SELECT_CHECKER': {
            if (state.phase !== 'PLAYING_MOVES' || !state.boardState.dice) {
                return state;
            }

            const { leftDieTargets, rightDieTargets } = computeLegalTargets(
                state.boardState,
                state.boardState.dice,
                state.usedDice,
            );

            if (action.die !== undefined && action.die !== null) {
                const targets = action.die === 0 ? leftDieTargets : rightDieTargets;
                if (targets.has(action.point)) {
                    return {
                        ...state,
                        selected: { point: action.point, die: action.die },
                    };
                }
                const fallbackDie: 0 | 1 = (1 - action.die) as 0 | 1;
                const fallbackTargets = fallbackDie === 0 ? leftDieTargets : rightDieTargets;
                if (fallbackTargets.has(action.point)) {
                    return {
                        ...state,
                        selected: { point: action.point, die: fallbackDie },
                    };
                }
                return state;
            }

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
        case 'MOVE_CHECKER':
            return executeHumanMove(state, action);

        case 'COMMIT_HUMAN_TURN': {
            if (state.phase !== 'PLAYING_MOVES' || !state.boardState.dice) {
                return state;
            }

            const nextTurn: Player = state.boardState.turn === 'X' ? 'O' : 'X';
            const nextPhase: GamePhase =
                nextTurn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL';

            const isBlockedTurn = state.moveHistory.length === 0;
            const boardBefore = isBlockedTurn
                ? state.boardState.board
                : (state.moveHistory[0]?.board ?? state.boardState.board);

            recordFlightEvent({
                ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                event: 'TURN_FINISHED',
                player: state.boardState.turn,
                dice: state.boardState.dice,
                isAiThinking: false,
                boardBefore: [...boardBefore],
                boardAfter: [...state.boardState.board],
                arrows: [],
                statusMessage: isBlockedTurn ? 'Bloqué — aucun coup possible' : null,
            });

            let nextMatchLog = state.matchLog ?? [];
            if (!isBlockedTurn) {
                const turnMoves: Move[] = state.moveHistory.flatMap((h) => (h.move ? [h.move] : []));
                const xLogEntry: MatchLogEntry = Object.freeze({
                    turnIndex: nextMatchLog.length + 1,
                    player: state.boardState.turn,
                    dice: Object.freeze([state.boardState.dice[0], state.boardState.dice[1]]) as readonly [number, number],
                    boardBefore: Object.freeze([...boardBefore]),
                    movePlayed: Object.freeze(turnMoves),
                    boardAfter: Object.freeze([...state.boardState.board]),
                    notation: formatMoveSequenceNotationAbsolute(turnMoves, state.boardState.turn),
                    timestamp: Date.now(),
                });
                nextMatchLog = Object.freeze([...nextMatchLog, xLogEntry]);
            }

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    dice: null,
                    turn: nextTurn,
                },
                phase: nextPhase,
                usedDice: [false, false],
                selected: null,
                opponentStatusMessage: null,
                moveHistory: [],
                matchLog: nextMatchLog,
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

        case 'REWIND_TO_LOG_TURN': {
            if (state.phase === 'PLAYING_MOVES' && state.moveHistory.length > 0 && action.turnIndex === undefined) {
                const first = state.moveHistory[0];
                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        board: [...first.board],
                    },
                    usedDice: [...first.usedDice],
                    selected: null,
                    moveHistory: [],
                };
            }
            const log = state.matchLog ?? [];
            if (log.length === 0) return state;

            let targetIdx = -1;
            if (action.turnIndex !== undefined) {
                targetIdx = log.findIndex((e) => e.turnIndex === action.turnIndex);
            } else {
                for (let i = log.length - 1; i >= 0; i--) {
                    if (log[i].player === 'X' && log[i].dice[0] > 0 && log[i].dice[1] > 0) {
                        targetIdx = i;
                        break;
                    }
                }
            }
            if (targetIdx < 0) return state;

            const targetEntry = log[targetIdx];
            if (targetEntry.player === 'X' && targetEntry.dice[0] > 0 && targetEntry.dice[1] > 0) {
                const d0 = targetEntry.dice[0];
                const d1 = targetEntry.dice[1];
                const isDouble = d0 === d1;
                return {
                    ...state,
                    boardState: {
                        ...state.boardState,
                        board: [...targetEntry.boardBefore],
                        dice: [d0, d1],
                        turn: 'X',
                        doubled: false,
                        resigned: 0,
                    },
                    phase: 'PLAYING_MOVES',
                    usedDice: isDouble ? [false, false, false, false] : [false, false],
                    selected: null,
                    doublingOfferedBy: null,
                    gameResult: null,
                    opponentBoardBefore: null,
                    opponentHighlight: null,
                    opponentStatusMessage: null,
                    moveHistory: [],
                    matchLog: Object.freeze(log.slice(0, targetIdx)),
                };
            }

            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: [...targetEntry.boardAfter],
                    dice: null,
                    turn: 'X',
                    doubled: false,
                    resigned: 0,
                },
                phase: 'WAITING_FOR_ROLL',
                usedDice: [false, false],
                selected: null,
                doublingOfferedBy: null,
                gameResult: null,
                opponentBoardBefore: null,
                opponentHighlight: null,
                opponentStatusMessage: null,
                moveHistory: [],
                matchLog: Object.freeze(log.slice(0, targetIdx + 1)),
            };
        }
    }
}
