import type { GameState, GamePhase } from '../gameStateReducer';
import {
    computeLegalTargets,
    applyMove,
    type Player,
    type Move,
} from '../../engine/backgammonEngine';
import { evaluateWin } from '../../engine/aiHeuristics';
import { validateArrowSource, recordFlightEvent } from '../../utils/gameFlightRecorder';
import { formatMoveSequenceNotationAbsolute } from '../../lib/engine/evaluator';
import type { MatchLogEntry } from '../../actions/types';
import { revealSessionServerSeed, createProvablyFairSession } from '../../lib/crypto/provablyFairRng';
import type { HumanMoveAction } from './humanMoveActions';

export function executeHumanMove(
    state: GameState,
    action: Extract<HumanMoveAction, { type: 'PLAY_MOVE' } | { type: 'MOVE_CHECKER' }>,
): GameState {
    const currentPf = state.provablyFair ?? createProvablyFairSession();
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
        const winTurnMoves: Move[] = [
            ...state.moveHistory.flatMap((h) => (h.move ? [h.move] : [])),
            move,
        ];
        const winLogEntry: MatchLogEntry = Object.freeze({
            turnIndex: (state.matchLog?.length ?? 0) + 1,
            player: state.boardState.turn,
            dice: Object.freeze([state.boardState.dice![0], state.boardState.dice![1]]) as readonly [number, number],
            boardBefore: Object.freeze([...(state.moveHistory[0]?.board ?? state.boardState.board)]),
            movePlayed: Object.freeze(winTurnMoves),
            boardAfter: Object.freeze([...newBoard]),
            notation: formatMoveSequenceNotationAbsolute(winTurnMoves, state.boardState.turn),
            timestamp: Date.now(),
        });

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
            matchLog: Object.freeze([...(state.matchLog ?? []), winLogEntry]),
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
