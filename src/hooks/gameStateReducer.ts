/**
 * Reducer pur et types d'état de la machine à états Backgammon (`src/hooks/gameStateReducer.ts`).
 *
 * Extrait selon la doctrine atomique et budgets R1 (SCALABILITY.md).
 * Strictement pur, déterministe et testable isolément.
 */

import {
    BoardState,
    Player,
    Move,
    MoveSequence,
    createInitialState,
    applyMove,
    generateLegalMoves,
    computeLegalTargets,
} from '../engine/backgammonEngine';
import {
    recordFlightEvent,
    validateArrowSource,
} from '../utils/gameFlightRecorder';
import {
    evaluateWin,
    selectBestOpponentSequence,
    type WinType,
    type GameResult,
    type AIDifficulty,
} from '../engine/aiHeuristics';
import {
    findBestBoardMove,
    formatMoveSequenceNotationAbsolute,
} from '../lib/engine/evaluator';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../features/openings';
import type { GamePhase as StrictGamePhase, MatchLogEntry } from '../actions/types';
import type { AutoConfirmMode } from './useTurnConfirmation';
import type { GameSpeed } from '../lib/gameFeel/speedPresets';
import type { Locale } from '../lib/i18n/types';
import {
    createProvablyFairSession,
    recordSessionRoll,
    revealSessionServerSeed,
    updateSessionClientSeeds,
    type ProvablyFairSessionState,
} from '../lib/crypto/provablyFairRng';

export type GamePhase =
    | 'WAITING_FOR_ROLL'
    | 'DOUBLING_OFFERED'
    | 'PLAYING_MOVES'
    | 'OPPONENT_THINKING'
    | 'GAME_OVER';

export interface OpponentMoveArrow {
    from: number;
    to: number;
    isHit?: boolean;
}

export function annotateOpponentMoveHits(
    boardBefore: ReadonlyArray<number>,
    moves: ReadonlyArray<Move & { isHit?: boolean }>,
): OpponentMoveArrow[] {
    let simBoard = [...boardBefore];
    return moves.map((m) => {
        const hitOnStep = m.to >= 1 && m.to <= 24 && simBoard[m.to] === 1;
        const isHit = Boolean(m.isHit || hitOnStep);
        simBoard = applyMove(simBoard, { from: m.from, to: m.to }, 'O');
        return isHit ? { from: m.from, to: m.to, isHit: true } : { from: m.from, to: m.to };
    });
}

/**
 * Dérive la phase stricte gouvernée par la LOI 2 (Machine à États Finis Unique)
 */
export function deriveStrictGamePhase(
    phase: GamePhase,
    usedDice: boolean[],
    opponentHighlight: OpponentMoveArrow[] | null,
    gameResult: GameResult | null,
): StrictGamePhase {
    if (phase === 'GAME_OVER' || gameResult) return 'GAME_OVER';
    if (phase === 'DOUBLING_OFFERED') return 'AI_TURN_ROLLING';
    if (phase === 'WAITING_FOR_ROLL') return 'HUMAN_WAITING_ROLL';
    if (phase === 'PLAYING_MOVES') {
        const allUsed = usedDice.length > 0 && usedDice.every(Boolean);
        return allUsed ? 'HUMAN_READY_TO_COMMIT' : 'HUMAN_MOVING';
    }
    if (phase === 'OPPONENT_THINKING') {
        if (opponentHighlight && opponentHighlight.length > 0) {
            return 'AI_TURN_SHOWING_ARROWS';
        }
        return 'AI_TURN_ROLLING';
    }
    return 'HUMAN_WAITING_ROLL';
}

export interface UseBackgammonGameOptions {
    matchLength?: number;
    initialScoreX?: number;
    initialScoreO?: number;
    initialTurn?: Player;
    initialDifficulty?: AIDifficulty;
    autoOpponent?: boolean;
    opponentDelayMs?: number;
    stepDelayMs?: number;
    arrowPreviewMs?: number;
    forcedOpponentDice?: [number, number];
    playerColor?: Player;
    onGameOver?: (result: GameResult) => void;
    locale?: Locale;
    autoConfirm?: boolean;
    autoConfirmTurn?: boolean;
    autoConfirmMode?: AutoConfirmMode;
    gameSpeed?: GameSpeed;
}

export interface MoveHistoryEntry {
    board: number[];
    usedDice: boolean[];
    move?: Move;
}

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
    opponentHighlight: OpponentMoveArrow[] | null;
    opponentStatusMessage: string | null;
    moveHistory: MoveHistoryEntry[];
    matchLog: ReadonlyArray<MatchLogEntry>;
    opponentBoardBefore?: number[] | null;
    provablyFair?: ProvablyFairSessionState;
}

export type GameAction =
    | { type: 'ROLL_DICE'; dice?: [number, number]; deferBlockedTransition?: boolean }
    | { type: 'SELECT_CHECKER'; point: number; die?: 0 | 1 | null }
    | { type: 'DESELECT' }
    | { type: 'SET_SELECTED_DIE'; die: 0 | 1 }
    | { type: 'MOVE_CHECKER'; destination: number; from?: number; die?: 0 | 1; deferCommit?: boolean }
    | { type: 'PLAY_MOVE'; from: number; to: number; die?: 0 | 1; deferCommit?: boolean }
    | { type: 'COMMIT_HUMAN_TURN' }
    | { type: 'OFFER_DOUBLE' }
    | { type: 'TAKE_DOUBLE' }
    | { type: 'PASS_DOUBLE' }
    | { type: 'PLAY_OPPONENT'; dice?: [number, number] }
    | { type: 'OPPONENT_PREPARE_ROLL'; statusMessage?: string }
    | { type: 'OPPONENT_START_TURN'; dice: [number, number]; statusMessage: string }
    | { type: 'OPPONENT_SHOW_ARROWS'; arrows: OpponentMoveArrow[]; statusMessage?: string }
    | {
        type: 'OPPONENT_APPLY_STEP';
        board: number[];
        move: Move & { isHit?: boolean };
        usedDiceIndex: number;
        statusMessage: string;
    }
    | {
        type: 'OPPONENT_FINISH_TURN';
        finalBoard: number[];
        dice: [number, number];
        moves: Array<Move & { isHit?: boolean }>;
        gameResult?: GameResult | null;
    }
    | { type: 'UNDO_MOVE' }
    | { type: 'REWIND_TO_LOG_TURN'; turnIndex?: number }
    | { type: 'SET_DIFFICULTY'; difficulty: AIDifficulty }
    | { type: 'SET_CLIENT_SEEDS'; clientSeedA: string; clientSeedB?: string }
    | { type: 'START_NEW_GAME' }
    | { type: 'RESET_MATCH' }
    | { type: 'NEW_MATCH'; matchLength: number; difficulty: AIDifficulty }
    | { type: 'RESIGN_GAME'; multiplier: 1 | 2 | 3; winner?: Player }
    | {
        type: 'APPLY_REMOTE_STATE';
        board: number[];
        dice?: [number, number] | null;
        turn?: Player;
        usedDice?: boolean[];
        phase?: GamePhase;
        cubeValue?: number;
        cubeOwner?: Player | null;
        scoreX?: number;
        scoreO?: number;
        crawford?: boolean;
        doublingOfferedBy?: Player | null;
    };

export function createInitialGameState(
    matchLength = 7,
    initialScoreX = 0,
    initialScoreO = 0,
    initialTurn: Player = 'X',
    autoOpponent = true,
    initialDifficulty: AIDifficulty = 'expert',
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
        matchLog: [],
        provablyFair: createProvablyFairSession(),
    };
}

export function backgammonGameReducer(
    state: BackgammonGameState,
    action: GameAction,
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
                        usedDice: initialUsedDice.map(() => true),
                        selected: null,
                        opponentHighlight: null,
                        opponentStatusMessage: 'Bloqué — aucun coup possible',
                        moveHistory: [],
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
                const higherDie: 0 | 1 = state.boardState.dice[1] > state.boardState.dice[0] ? 1 : 0;

                if (requestedDie === 0 && leftDests.includes(dest)) {
                    chosenDie = 0;
                } else if (requestedDie === 1 && rightDests.includes(dest)) {
                    chosenDie = 1;
                } else if (leftDests.includes(dest) && rightDests.includes(dest)) {
                    chosenDie = higherDie;
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
            const { sourceValid, sourceValue } = validateArrowSource(
                state.boardState.board,
                from,
                state.boardState.turn,
            );
            const newBoard = applyMove(state.boardState.board, move, state.boardState.turn);

            recordFlightEvent({
                ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                event: 'MOVE_APPLIED',
                player: state.boardState.turn,
                dice: state.boardState.dice,
                isAiThinking: false,
                boardBefore: [...state.boardState.board],
                boardAfter: [...newBoard],
                arrows: [{ from, to: dest, sourceValid, sourceValue }],
                statusMessage: null,
            });

            const moveHistory = [
                ...state.moveHistory,
                { board: state.boardState.board, usedDice: [...state.usedDice], move },
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
                    provablyFair: revealSessionServerSeed(currentPf),
                };
            }

            const stateAfterMove = { ...state.boardState, board: newBoard };
            const nextTargets = computeLegalTargets(stateAfterMove, state.boardState.dice, newUsed);
            const allUsed = newUsed.every(Boolean);
            const noMoreMoves = nextTargets.leftDieTargets.size === 0 && nextTargets.rightDieTargets.size === 0;
            const turnFinished = allUsed || noMoreMoves;

            if (turnFinished) {
                if (action.deferCommit) {
                    return {
                        ...state,
                        boardState: stateAfterMove,
                        phase: 'PLAYING_MOVES',
                        usedDice: noMoreMoves ? newUsed.map(() => true) : newUsed,
                        selected: null,
                        moveHistory,
                    };
                }

                const nextTurn: Player = state.boardState.turn === 'X' ? 'O' : 'X';
                const nextPhase: GamePhase =
                    nextTurn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL';

                recordFlightEvent({
                    ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                    event: 'TURN_FINISHED',
                    player: state.boardState.turn,
                    dice: state.boardState.dice,
                    isAiThinking: false,
                    boardBefore: [...state.boardState.board],
                    boardAfter: [...newBoard],
                    arrows: [],
                    statusMessage: null,
                });

                const turnMoves: Move[] = [
                    ...state.moveHistory.flatMap((h) => (h.move ? [h.move] : [])),
                    move,
                ];
                const xLogEntry: MatchLogEntry = Object.freeze({
                    turnIndex: (state.matchLog?.length ?? 0) + 1,
                    player: state.boardState.turn,
                    dice: Object.freeze([state.boardState.dice![0], state.boardState.dice![1]]) as readonly [number, number],
                    boardBefore: Object.freeze([...(state.moveHistory[0]?.board ?? state.boardState.board)]),
                    movePlayed: Object.freeze(turnMoves),
                    boardAfter: Object.freeze([...newBoard]),
                    notation: formatMoveSequenceNotationAbsolute(turnMoves, state.boardState.turn),
                    timestamp: Date.now(),
                });

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
                    matchLog: Object.freeze([...(state.matchLog ?? []), xLogEntry]),
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

        case 'OFFER_DOUBLE': {
            const isBotPreRollOffer =
                state.phase === 'OPPONENT_THINKING' && state.boardState.turn === 'O' && !state.boardState.dice;
            if (state.phase !== 'WAITING_FOR_ROLL' && !isBotPreRollOffer) return state;
            if (state.boardState.crawford) return state;

            const isDmp =
                state.matchLength > 0 &&
                state.boardState.scoreX === state.matchLength - 1 &&
                state.boardState.scoreO === state.matchLength - 1;
            if (isDmp) return state;

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
                opponentHighlight: null,
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
                phase: state.boardState.turn === 'O' && state.autoOpponent ? 'OPPONENT_THINKING' : 'WAITING_FOR_ROLL',
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
                provablyFair: revealSessionServerSeed(currentPf),
            };
        }

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

            // Si l'entrée ciblée est un tour IA (O), on reprend juste après ce tour (au début du tour X suivant)
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

        case 'SET_DIFFICULTY': {
            return {
                ...state,
                difficulty: action.difficulty,
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

        default:
            return state;
    }
}

/**
 * Alias conventionnel conforme à SCALABILITY.md.
 */
export const gameReducer = backgammonGameReducer;
