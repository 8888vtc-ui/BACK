import type { GameState, GameAction, OpponentMoveArrow } from '../gameStateReducer';
import { annotateOpponentMoveHits } from '../gameStateReducer';
import {
    generateLegalMoves,
    type BoardState,
    type MoveSequence,
} from '../../engine/backgammonEngine';
import {
    evaluateWin,
    selectBestOpponentSequence,
} from '../../engine/aiHeuristics';
import {
    findBestBoardMove,
    formatMoveSequenceNotationAbsolute,
} from '../../lib/engine/evaluator';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../../features/openings';
import { recordSessionRoll, revealSessionServerSeed, createProvablyFairSession } from '../../lib/crypto/provablyFairRng';
import type { MatchLogEntry } from '../../actions/types';

export type OpponentMoveAction = Extract<
    GameAction,
    | { type: 'PLAY_OPPONENT' }
    | { type: 'OPPONENT_PREPARE_ROLL' }
    | { type: 'OPPONENT_START_TURN' }
    | { type: 'OPPONENT_SHOW_ARROWS' }
    | { type: 'OPPONENT_APPLY_STEP' }
    | { type: 'OPPONENT_FINISH_TURN' }
>;

export function handleOpponentMoveAction(state: GameState, action: OpponentMoveAction): GameState {
    const currentPf = state.provablyFair ?? createProvablyFairSession();

    switch (action.type) {
        case 'PLAY_OPPONENT': {
            if (state.phase === 'GAME_OVER') return state;

            const rollRecord = recordSessionRoll(currentPf, 'O', action.dice);
            const rolledDice: [number, number] = rollRecord.dice;

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
                    provablyFair: rollRecord.nextSession,
                };
            }

            let best: MoveSequence | null = null;
            if (state.difficulty !== 'beginner' && isInitialBoardPosition(state.boardState.board)) {
                best = findOpeningBookSequenceForOpponent(state.boardState.board, rolledDice, legalSeqs);
            }
            if (!best && (state.difficulty === 'expert' || state.difficulty === 'grandmaster')) {
                const unified = findBestBoardMove(stateWithDice, rolledDice, 2);
                if (unified?.sequence) {
                    best = unified.sequence;
                }
            }
            if (!best && state.difficulty === 'intermediate') {
                const unified = findBestBoardMove(stateWithDice, rolledDice, 1);
                if (unified?.sequence) {
                    best = unified.sequence;
                }
            }
            if (!best) {
                best = selectBestOpponentSequence(legalSeqs, 'O', state.difficulty);
            }
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
                    provablyFair: rollRecord.nextSession,
                };
            }

            const annotatedOpponentMoves = annotateOpponentMoveHits(state.boardState.board, best.moves);
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
                    opponentHighlight: annotatedOpponentMoves,
                    provablyFair: revealSessionServerSeed(rollRecord.nextSession),
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
                opponentHighlight: annotatedOpponentMoves,
                opponentStatusMessage: null,
                provablyFair: rollRecord.nextSession,
            };
        }

        case 'OPPONENT_PREPARE_ROLL': {
            if (state.phase === 'GAME_OVER') return state;
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    dice: null,
                    turn: 'O',
                },
                phase: 'OPPONENT_THINKING',
                opponentBoardBefore: [...state.boardState.board],
                opponentHighlight: null,
                lastOpponentDice: null,
                opponentStatusMessage: action.statusMessage ?? "L'ordinateur lance les dés...",
            };
        }

        case 'OPPONENT_START_TURN': {
            if (state.phase === 'GAME_OVER') return state;
            const isDouble = action.dice[0] === action.dice[1];
            const rollRecord = recordSessionRoll(currentPf, 'O', action.dice);
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    dice: action.dice,
                    turn: 'O',
                },
                phase: 'OPPONENT_THINKING',
                opponentBoardBefore: state.opponentBoardBefore ?? [...state.boardState.board],
                usedDice: isDouble ? [false, false, false, false] : [false, false],
                lastOpponentDice: action.dice,
                opponentHighlight: null,
                opponentStatusMessage: action.statusMessage,
                provablyFair: rollRecord.nextSession,
            };
        }

        case 'OPPONENT_SHOW_ARROWS': {
            if (state.phase === 'GAME_OVER') return state;
            return {
                ...state,
                opponentHighlight: action.arrows,
                opponentStatusMessage: action.statusMessage ?? state.opponentStatusMessage,
            };
        }

        case 'OPPONENT_APPLY_STEP': {
            if (state.phase === 'GAME_OVER') return state;
            const newUsed = [...state.usedDice];
            if (action.usedDiceIndex >= 0 && action.usedDiceIndex < newUsed.length) {
                newUsed[action.usedDiceIndex] = true;
            }
            const hitOnStep =
                Boolean(action.move.isHit) ||
                (action.move.to >= 1 && action.move.to <= 24 && state.boardState.board[action.move.to] === 1);
            const stepArrow: OpponentMoveArrow = hitOnStep
                ? { from: action.move.from, to: action.move.to, isHit: true }
                : { from: action.move.from, to: action.move.to };
            return {
                ...state,
                boardState: {
                    ...state.boardState,
                    board: action.board,
                },
                usedDice: newUsed,
                opponentHighlight: [stepArrow],
                opponentStatusMessage: action.statusMessage,
            };
        }

        case 'OPPONENT_FINISH_TURN': {
            if (state.phase === 'GAME_OVER') return state;
            const trueBoardBefore = state.opponentBoardBefore ?? state.boardState.board;
            const oLogEntry: MatchLogEntry = Object.freeze({
                turnIndex: (state.matchLog?.length ?? 0) + 1,
                player: 'O',
                dice: Object.freeze([action.dice[0], action.dice[1]]) as readonly [number, number],
                boardBefore: Object.freeze([...trueBoardBefore]),
                movePlayed: Object.freeze(action.moves.map((m) => ({ ...m }))),
                boardAfter: Object.freeze([...action.finalBoard]),
                notation: formatMoveSequenceNotationAbsolute(action.moves, 'O'),
                timestamp: Date.now(),
            });
            const nextMatchLog: ReadonlyArray<MatchLogEntry> = Object.freeze([...(state.matchLog ?? []), oLogEntry]);

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
                    opponentBoardBefore: null,
                    lastOpponentDice: action.dice,
                    lastOpponentMoves: action.moves,
                    opponentHighlight: action.moves && action.moves.length > 0 ? action.moves : state.opponentHighlight,
                    opponentStatusMessage: null,
                    matchLog: nextMatchLog,
                    provablyFair: revealSessionServerSeed(currentPf),
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
                opponentBoardBefore: null,
                usedDice: [false, false],
                selected: null,
                lastOpponentDice: action.dice,
                lastOpponentMoves: action.moves,
                opponentHighlight: action.moves && action.moves.length > 0 ? action.moves : state.opponentHighlight,
                opponentStatusMessage: null,
                matchLog: nextMatchLog,
            };
        }
    }
}
