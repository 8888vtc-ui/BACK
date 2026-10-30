/**
 * Types, interfaces et fonctions utilitaires pures de l'état de jeu (`src/hooks/gameStateTypes.ts`).
 * Conforme à SCALABILITY.md (< 200 lignes, 0 any).
 */

import {
    BoardState,
    Player,
    Move,
    createInitialState,
    applyMove,
} from '../engine/backgammonEngine';
import {
    type GameResult,
    type AIDifficulty,
} from '../engine/aiHeuristics';
import type { GamePhase as StrictGamePhase, MatchLogEntry } from '../actions/types';
import type { AutoConfirmMode } from './useTurnConfirmation';
import type { GameSpeed } from '../lib/gameFeel/speedPresets';
import type { Locale } from '../lib/i18n/types';
import {
    createProvablyFairSession,
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

export type GameState = BackgammonGameState;

export type GameAction =
    | { type: 'ROLL_DICE'; dice?: [number, number]; deferBlockedTransition?: boolean }
    | { type: 'SELECT_CHECKER'; point: number; die?: 0 | 1 | null }
    | { type: 'DESELECT' }
    | { type: 'SET_SELECTED_DIE'; die: 0 | 1 }
    | { type: 'MOVE_CHECKER'; destination: number; from?: number; die?: 0 | 1; deferCommit?: boolean }
    | { type: 'PLAY_MOVE'; from: number; to: number; die?: 0 | 1; deferCommit?: boolean }
    | { type: 'COMMIT_HUMAN_TURN' }
    | { type: 'OFFER_DOUBLE'; statusMessage?: string }
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
