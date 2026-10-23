'use client';

import { useReducer, useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { sensoryFeedbackController } from '../lib/sound/SensoryFeedbackController';
import { computeHitEjectDelayMs } from '../lib/gameFeel/flightPhysics';
import { Locale } from '../lib/i18n/types';
import {
    formatOpponentDiceRollStatus,
    formatOpponentMoveStepStatus,
    formatOpponentBlockedStatus,
    getBoardPointLabel,
} from '../lib/i18n/engineMessages';
import { addMonitoringBreadcrumb } from '../lib/monitoring/sentry';
import {
    recordFlightEvent,
    validateArrowSource,
    getDisplayArrowsForMoves,
} from '../utils/gameFlightRecorder';
import {
    evaluateWin,
    scoreBoardForOpponent,
    scoreBoard0PlyNoisy,
    scoreBoard1Ply,
    scoreBoard2PlyForOpponent,
    selectBestOpponentSequence,
    type WinType,
    type GameResult,
    type AIDifficulty,
} from '../engine/aiHeuristics';
import {
    evaluateBoard,
    findBestBoardMove,
    shouldOfferDouble,
    shouldTakeDouble,
    formatMoveSequenceNotationAbsolute,
} from '../lib/engine/evaluator';
import { selectBotMoveWithBgsage, evaluateBotCubeWithBgsage } from '../lib/engine/bgsageClient';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../features/openings';
import type { GamePhase as StrictGamePhase, MatchLogEntry } from '../actions/types';
import { commitHumanMoveAction } from '../actions/commitHumanMoveAction';
import { replayFromLogAction } from '../actions/replayFromLogAction';
import { runAiTurnAction } from '../actions/runAiTurnAction';
import {
    AUTO_CONFIRM_TURN_STORAGE_KEY,
    getNextAutoConfirmMode,
    getSavedAutoConfirmMode,
    getSavedAutoConfirmPreference,
    saveAutoConfirmMode,
    saveAutoConfirmPreference,
    shouldAutoConfirmTurn,
    type AutoConfirmMode,
} from './useTurnConfirmation';
import {
    CUBE_DECISION_BUDGET_MS,
    getBetweenMovesPauseMs,
    getSpeedPreset,
    type GameSpeed,
} from '../lib/gameFeel/speedPresets';
import { getSavedGameSpeed, saveGameSpeed } from '../lib/settings/gameplaySettings';
import {
    createProvablyFairSession,
    generateProvablyFairRoll,
    recordSessionRoll,
    revealSessionServerSeed,
    updateSessionClientSeeds,
    type ProvablyFairSessionState,
} from '../lib/crypto/provablyFairRng';
import {
    createMoveTimingTracker,
    type MoveTimingTracker,
    type MatchTelemetryMetadata,
} from '../lib/telemetry/moveTiming';

/** Délai fluide (ms) de validation automatique lorsque `autoConfirmTurn === true`. */
export const AUTO_CONFIRM_TURN_DELAY_MS = 250;
/**
 * Durée de vol moyenne d'un pion du bot (profil Tournament, ~6 flèches ≈ 250 ms) avant
 * application du facteur de vitesse du profil (Game Feel Spec §2).
 */
export const BOT_FLIGHT_ESTIMATE_MS = 250;
export { AUTO_CONFIRM_TURN_STORAGE_KEY };

export {
    evaluateWin,
    scoreBoardForOpponent,
    scoreBoard0PlyNoisy,
    scoreBoard1Ply,
    scoreBoard2PlyForOpponent,
    selectBestOpponentSequence,
};
export type { WinType, GameResult, AIDifficulty, StrictGamePhase, MatchLogEntry };

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
    // Videau proposé : aucune action de lancer/déplacement tant que Prendre/Passer n'est pas tranché.
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
    /** Valider automatiquement la fin de tour après 250ms (défaut : false — persisté dans localStorage). */
    autoConfirm?: boolean;
    /** Alias explicite pour l'option Validation auto (persistée dans localStorage, défaut : false). */
    autoConfirmTurn?: boolean;
    /** Mode étendu d'auto-confirmation (`never` | `forced_only` | `always_except_cube` | `always`). */
    autoConfirmMode?: AutoConfirmMode;
    /** Profil de cadence du bot (coach / tournament / blitz). Défaut : préférence persistée, sinon tournament. */
    gameSpeed?: GameSpeed;
}

// Fonctions d'évaluation IA importées depuis `../engine/aiHeuristics.ts` (module isolé).

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
    opponentHighlight: OpponentMoveArrow[] | null;
    opponentStatusMessage: string | null;
    /** Historique des sous-mouvements du tour courant (pour Undo). */
    moveHistory: { board: number[]; usedDice: boolean[]; move?: Move }[];
    /** Journal immuable des tours de match (LOI 3). */
    matchLog: ReadonlyArray<MatchLogEntry>;
    /** Session cryptographique Provably Fair (Commit-Play-Reveal HMAC-SHA256). */
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

            // Boîte noire : enregistre le lancer des dés du joueur
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

                // Fanned / bloqué (mode synchrone / reducer direct)
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
                // Efface l'historique visuel du dernier coup de l'IA au lancer du joueur
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

            // Boîte noire : enregistre le coup joué par le joueur actif
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

            // Enregistre un snapshot pour permettre l'Undo du sous-mouvement
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
                    provablyFair: revealSessionServerSeed(currentPf),
                };
            }

            // 2. Vérification de fin de tour selon les règles officielles (tous dés consommés ou aucun coup restant possible)
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
            // L'IA propose le videau AVANT son lancer, alors que la phase est déjà
            // OPPONENT_THINKING : sans cette tolérance l'offre était rejetée et le
            // tour de l'IA restait gelé indéfiniment.
            const isBotPreRollOffer =
                state.phase === 'OPPONENT_THINKING' && state.boardState.turn === 'O' && !state.boardState.dice;
            if (state.phase !== 'WAITING_FOR_ROLL' && !isBotPreRollOffer) return state;
            if (state.boardState.crawford) return state;

            // Règle du Double Match Point (DMP) : le videau est gelé pour les deux joueurs
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
                // Le joueur qui a doublé garde la main : si c'est l'IA, elle lance ensuite.
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
            // Sélection différenciée selon le niveau du bot :
            // - expert : 1-ply déterministe via findBestBoardMove
            // - grandmaster : 2-ply Expectimax (Beam Search Top-6 + anticipation des répliques)
            // - intermediate : 1-ply légèrement bruité
            // - beginner : 0-ply fortement bruité
            if (!best && state.difficulty === 'expert') {
                const unified = findBestBoardMove(stateWithDice, rolledDice, 2);
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
            const oLogEntry: MatchLogEntry = Object.freeze({
                turnIndex: (state.matchLog?.length ?? 0) + 1,
                player: 'O',
                dice: Object.freeze([action.dice[0], action.dice[1]]) as readonly [number, number],
                boardBefore: Object.freeze([...state.boardState.board]),
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
 * Hook de jeu Backgammon : machine à états intégrée.
 */
export function useBackgammonGame(options: UseBackgammonGameOptions = {}) {
    const {
        matchLength = 7,
        initialScoreX = 0,
        initialScoreO = 0,
        initialTurn = 'X',
        initialDifficulty = 'expert',
        autoOpponent = true,
        opponentDelayMs = 400,
        stepDelayMs = 200,
        arrowPreviewMs = 0,
        forcedOpponentDice,
        playerColor = 'X',
        onGameOver,
        locale = 'fr',
        autoConfirm,
        autoConfirmTurn: initialAutoConfirmTurn,
    } = options;

    const explicitAutoConfirm = initialAutoConfirmTurn ?? autoConfirm;
    const explicitAutoConfirmMode = options.autoConfirmMode;

    const [autoConfirmTurn, setAutoConfirmTurnState] = useState<boolean>(() => {
        if (explicitAutoConfirmMode !== undefined) {
            return explicitAutoConfirmMode === 'always' || explicitAutoConfirmMode === 'always_except_cube';
        }
        if (explicitAutoConfirm !== undefined) return explicitAutoConfirm;
        return getSavedAutoConfirmPreference(false);
    });

    const [autoConfirmMode, setAutoConfirmModeState] = useState<AutoConfirmMode>(() => {
        if (explicitAutoConfirmMode !== undefined) return explicitAutoConfirmMode;
        if (explicitAutoConfirm !== undefined) return explicitAutoConfirm ? 'always' : 'never';
        return getSavedAutoConfirmMode(getSavedAutoConfirmPreference(false) ? 'always' : 'never');
    });

    useEffect(() => {
        if (explicitAutoConfirmMode !== undefined) {
            setAutoConfirmModeState(explicitAutoConfirmMode);
            setAutoConfirmTurnState(
                explicitAutoConfirmMode === 'always' || explicitAutoConfirmMode === 'always_except_cube',
            );
        } else if (explicitAutoConfirm !== undefined) {
            setAutoConfirmTurnState(explicitAutoConfirm);
            setAutoConfirmModeState(explicitAutoConfirm ? 'always' : 'never');
        }
    }, [explicitAutoConfirm, explicitAutoConfirmMode]);

    const setAutoConfirmTurn = useCallback((enabled: boolean) => {
        setAutoConfirmTurnState(enabled);
        setAutoConfirmModeState(enabled ? 'always' : 'never');
        saveAutoConfirmPreference(enabled);
    }, []);

    const toggleAutoConfirmTurn = useCallback(() => {
        setAutoConfirmTurnState((prev) => {
            const next = !prev;
            setAutoConfirmModeState(next ? 'always' : 'never');
            saveAutoConfirmPreference(next);
            return next;
        });
    }, []);

    const setAutoConfirmMode = useCallback((mode: AutoConfirmMode) => {
        const enabled = mode === 'always' || mode === 'always_except_cube';
        setAutoConfirmModeState(mode);
        setAutoConfirmTurnState(enabled);
        saveAutoConfirmMode(mode);
        saveAutoConfirmPreference(enabled);
    }, []);

    const cycleAutoConfirmMode = useCallback(() => {
        setAutoConfirmModeState((prev) => {
            const next = getNextAutoConfirmMode(prev);
            const enabled = next === 'always' || next === 'always_except_cube';
            setAutoConfirmTurnState(enabled);
            saveAutoConfirmMode(next);
            saveAutoConfirmPreference(enabled);
            return next;
        });
    }, []);

    const explicitGameSpeed = options.gameSpeed;
    const [gameSpeed, setGameSpeedState] = useState<GameSpeed>(() => explicitGameSpeed ?? getSavedGameSpeed());
    useEffect(() => {
        if (explicitGameSpeed !== undefined) setGameSpeedState(explicitGameSpeed);
    }, [explicitGameSpeed]);
    const gameSpeedRef = useRef<GameSpeed>(gameSpeed);
    gameSpeedRef.current = gameSpeed;
    const setGameSpeed = useCallback((speed: GameSpeed) => {
        setGameSpeedState(speed);
        saveGameSpeed(speed);
    }, []);

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

    const isDMP = useMemo(() => {
        if (matchLength <= 0) return false;
        return boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
    }, [matchLength, boardState.scoreX, boardState.scoreO]);

    const canDouble = useMemo(() => {
        if (boardState.crawford) return false;
        if (isDMP) return false;
        if (phase !== 'WAITING_FOR_ROLL') return false;
        if (boardState.cubeOwner !== null && boardState.cubeOwner !== boardState.turn) return false;
        if (matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength)) return false;
        return true;
    }, [boardState.crawford, isDMP, phase, boardState.cubeOwner, boardState.turn, boardState.scoreX, boardState.scoreO, matchLength]);

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

    const currentProvablyFair = state.provablyFair ?? createProvablyFairSession();
    const provablyFairRef = useRef<ProvablyFairSessionState>(currentProvablyFair);
    provablyFairRef.current = currentProvablyFair;

    // Télémétrie anti-triche IA (Move Timing + Détection perte de focus blur / visibilitychange)
    const moveTimingTrackerRef = useRef<MoveTimingTracker | null>(null);
    if (!moveTimingTrackerRef.current) {
        moveTimingTrackerRef.current = createMoveTimingTracker();
    }
    const lastTrackedHumanDiceRef = useRef<readonly [number, number] | null>(null);

    useEffect(() => {
        return moveTimingTrackerRef.current?.attachBrowserListeners();
    }, []);

    useEffect(() => {
        const tracker = moveTimingTrackerRef.current;
        if (!tracker) return;

        if (phase === 'PLAYING_MOVES' && boardState.turn === humanPlayer && boardState.dice) {
            if (!tracker.isDecisionInProgress()) {
                tracker.markDiceRolled((state.matchLog?.length ?? 0) + 1);
            }
            lastTrackedHumanDiceRef.current = [boardState.dice[0], boardState.dice[1]];
        } else if (tracker.isDecisionInProgress()) {
            const committedDice = lastTrackedHumanDiceRef.current ?? [1, 1];
            tracker.recordMoveValidated({
                turnIndex: state.matchLog?.length ?? 1,
                player: humanPlayer,
                dice: committedDice,
            });
            lastTrackedHumanDiceRef.current = null;
        }
    }, [phase, boardState.turn, boardState.dice, humanPlayer, state.matchLog?.length]);

    const opponentTurnInProgressRef = useRef(false);
    const opponentTimersRef = useRef<NodeJS.Timeout[]>([]);
    const opponentTurnTokenRef = useRef<number>(0);
    const humanTimersRef = useRef<NodeJS.Timeout[]>([]);

    const clearOpponentTimers = useCallback(() => {
        opponentTurnTokenRef.current += 1;
        opponentTimersRef.current.forEach(clearTimeout);
        opponentTimersRef.current = [];
    }, []);

    const clearHumanTimers = useCallback(() => {
        humanTimersRef.current.forEach(clearTimeout);
        humanTimersRef.current = [];
    }, []);

    // Nettoie les timers au démontage du hook
    useEffect(() => {
        return () => {
            opponentTurnInProgressRef.current = false;
            clearOpponentTimers();
            clearHumanTimers();
            sensoryFeedbackController.cancelScheduledTimers();
        };
    }, [clearOpponentTimers, clearHumanTimers]);

    const strictGamePhase = deriveStrictGamePhase(
        phase,
        usedDice,
        state.opponentHighlight,
        gameResult,
    );

    // Gestion temporisée du tour humain :
    // 1. Jet bloqué (Fanned, 0 coup légal) : affiche les dés et "Bloqué — aucun coup possible" pendant 1200ms avant de passer la main.
    // 2. Fin de tour :
    //    - Si `autoConfirmTurn === false` (Mode Manuel par défaut) : reste en `HUMAN_READY_TO_COMMIT` jusqu'au clic sur "Valider" (ou Espace / Entrée).
    //    - Si `autoConfirmTurn === true` (Mode Rapide) : valide automatiquement après 250ms (`AUTO_CONFIRM_TURN_DELAY_MS`).
    useEffect(() => {
        clearHumanTimers();
        if (phase !== 'PLAYING_MOVES' || !boardState.dice || boardState.turn !== humanPlayer) {
            return;
        }

        const isBlockedFanned =
            state.moveHistory.length === 0 &&
            state.opponentStatusMessage === 'Bloqué — aucun coup possible';

        if (isBlockedFanned) {
            const tBlocked = setTimeout(() => {
                dispatch({ type: 'COMMIT_HUMAN_TURN' });
            }, 1200);
            humanTimersRef.current.push(tBlocked);
            return () => {
                clearHumanTimers();
            };
        }

        if (strictGamePhase === 'HUMAN_READY_TO_COMMIT' && state.moveHistory.length > 0) {
            const turnStartBoard = state.moveHistory[0]?.board ?? boardState.board;
            const isForcedSingleChoice =
                autoConfirmMode === 'forced_only' || autoConfirmMode === 'always_except_cube'
                    ? generateLegalMoves({ ...boardState, board: turnStartBoard, turn: humanPlayer }, boardState.dice).length <= 1
                    : false;
            const opponentCanDoubleNextTurn =
                !boardState.crawford &&
                !isDMP &&
                (boardState.cubeOwner === null || boardState.cubeOwner === 'O') &&
                (matchLength <= 0 || boardState.scoreO < matchLength - 1);

            const shouldAutoCommit = shouldAutoConfirmTurn({
                mode: autoConfirmMode,
                isForcedSingleChoice,
                opponentCanDoubleNextTurn,
            });

            if (shouldAutoCommit) {
                const tAutoCommit = setTimeout(() => {
                    dispatch({ type: 'COMMIT_HUMAN_TURN' });
                }, AUTO_CONFIRM_TURN_DELAY_MS);
                humanTimersRef.current.push(tAutoCommit);
                return () => {
                    clearHumanTimers();
                };
            }
        }
    }, [
        phase,
        boardState,
        humanPlayer,
        strictGamePhase,
        state.moveHistory,
        state.opponentStatusMessage,
        clearHumanTimers,
        autoConfirmTurn,
        autoConfirmMode,
        isDMP,
        matchLength,
    ]);

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

        const isCustomTestTiming = options.opponentDelayMs !== undefined;

        // --- Décision de l'IA sur le videau (Janowski) ---
        // Au début du tour de l'IA (avant le lancer des dés), si elle a accès au
        // videau et que son équité cubeless est >= +0.420, elle propose de doubler.
        const isBotDmp = matchLength > 0 && boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
        const isBotOneAway = matchLength > 0 && boardState.scoreO === matchLength - 1;
        const canIADouble =
            !boardState.crawford &&
            !isBotDmp &&
            !isBotOneAway &&
            !isInitialBoardPosition(boardState.board) &&
            (boardState.cubeOwner === null || boardState.cubeOwner === 'O') &&
            !(matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength));
        // Heuristique locale réservée au harnais de tests déterministe : en jeu réel,
        // la décision de videau est 100 % cloud (Open Sage, cf. runOpponentTurn).
        if (canIADouble && !forcedOpponentDice && isCustomTestTiming) {
            const iaState: BoardState = {
                ...boardState,
                turn: 'O',
                dice: null,
            };
            const iaEval = evaluateBoard(iaState, isCustomTestTiming ? 2 : 1);
            if (shouldOfferDouble(iaEval.cubelessEquity)) {
                opponentTurnInProgressRef.current = false;
                clearOpponentTimers();
                dispatch({ type: 'OFFER_DOUBLE' });
                return;
            }
        }

        // Mode immédiat (ex. tests unitaires ou délai à 0)
        if (opponentDelayMs === 0) {
            dispatch({ type: 'PLAY_OPPONENT', dice: forcedOpponentDice });
            return;
        }

        opponentTurnInProgressRef.current = true;
        clearOpponentTimers();

        if (!isCustomTestTiming) {
            // === TEMPS 1 (t = 0ms) : Transition immédiate 60 FPS avant le calcul 2-ply ===
            dispatch({
                type: 'OPPONENT_PREPARE_ROLL',
                statusMessage: locale === 'en' ? 'Black (AI) is rolling the dice...' : "L'ordinateur lance les dés...",
            });
        }

        const currentTurnToken = opponentTurnTokenRef.current;
        const isTurnAborted = () =>
            !opponentTurnInProgressRef.current || opponentTurnTokenRef.current !== currentTurnToken;

        const runOpponentTurn = async (yieldOffsetMs: number) => {
            if (isTurnAborted()) return;

            // Profil de cadence (Game Feel Spec §3) — source unique de vérité de la chronométrie du bot.
            const preset = getSpeedPreset(gameSpeedRef.current);
            const waitOpponent = (ms: number) =>
                new Promise<void>((resolve) => {
                    if (ms <= 0) {
                        resolve();
                        return;
                    }
                    const t = setTimeout(resolve, ms);
                    opponentTimersRef.current.push(t);
                });

            // === T0 : passage de main, masque la vérification du videau (Open Sage, budget court) ===
            const cubeCheck = async (): Promise<boolean> => {
                if (!canIADouble || forcedOpponentDice || isCustomTestTiming || isInitialBoardPosition(boardStateRef.current.board)) {
                    return false;
                }
                try {
                    const iaCubeState: BoardState = {
                        ...boardStateRef.current,
                        turn: 'O',
                        dice: null,
                    };
                    const localPreCheck = evaluateBoard(iaCubeState, 1);
                    // Appel réseau uniquement si l'évaluation locale indique un avantage réel (>= +0.30).
                    if (localPreCheck.cubelessEquity < 0.30) return false;
                    const sageCube = await evaluateBotCubeWithBgsage(iaCubeState, difficulty, CUBE_DECISION_BUDGET_MS);
                    return sageCube ? sageCube.shouldDouble : shouldOfferDouble(localPreCheck.cubelessEquity);
                } catch {
                    // Repli silencieux si bgsage est indisponible
                    return false;
                }
            };

            // Le harnais de tests déterministe reste 100 % synchrone (aucun await exécuté).
            const handoffMs = Math.max(0, preset.T0_TURN_HANDOFF_MS - yieldOffsetMs);
            const shouldBotDouble = isCustomTestTiming
                ? false
                : (await Promise.all([cubeCheck(), waitOpponent(handoffMs)]))[0];
            if (isTurnAborted()) return;
            if (shouldBotDouble) {
                opponentTurnInProgressRef.current = false;
                clearOpponentTimers();
                dispatch({ type: 'OFFER_DOUBLE' });
                return;
            }

            const T1_ROLL_MS = isCustomTestTiming ? 0 : preset.T1_DICE_ROLL_ANIMATION_MS;
            const T2_READ_MS = isCustomTestTiming ? 0 : preset.T2_DICE_READ_PAUSE_MS;

            const rolledDice: [number, number] =
                forcedOpponentDice ??
                (boardStateRef.current.dice
                    ? [boardStateRef.current.dice[0], boardStateRef.current.dice[1]]
                    : generateProvablyFairRoll(
                          provablyFairRef.current.serverSeed,
                          provablyFairRef.current.clientSeed,
                          provablyFairRef.current.nonce,
                          provablyFairRef.current.nonce === 0,
                      ));
            const isDoubleRoll = rolledDice[0] === rolledDice[1];

            const currentBoardState = boardStateRef.current;
            const stateWithDice: BoardState = {
                ...currentBoardState,
                dice: rolledDice,
                turn: 'O',
            };

            const legalSeqs = generateLegalMoves(stateWithDice, rolledDice);
            const initialStatus = formatOpponentDiceRollStatus(rolledDice[0], rolledDice[1], locale);

            const revealDice = (statusMessage: string) => {
                dispatch({
                    type: 'OPPONENT_START_TURN',
                    dice: rolledDice,
                    statusMessage,
                });
                if (!isCustomTestTiming) {
                    soundEngine.playDiceRoll();
                    sensoryFeedbackController.triggerGranularDiceRoll();
                }
                recordFlightEvent({
                    ts: performance.now(),
                    event: 'DICE_ROLLED',
                    player: 'O',
                    dice: rolledDice,
                    isAiThinking: true,
                    boardBefore: [...currentBoardState.board],
                    boardAfter: [...currentBoardState.board],
                    arrows: [],
                    statusMessage,
                });
            };

            // Si aucun coup légal n'est possible (bloqué/fanned)
            if (legalSeqs.length === 0) {
                const blockedStatus = formatOpponentBlockedStatus(locale);
                const fullBlockedStatus = `${initialStatus} — ${blockedStatus}`;
                if (T1_ROLL_MS > 0) {
                    const tBlockedStart = setTimeout(() => revealDice(fullBlockedStatus), T1_ROLL_MS);
                    opponentTimersRef.current.push(tBlockedStart);
                } else {
                    revealDice(fullBlockedStatus);
                }

                const tBlockedFinish = setTimeout(() => {
                    dispatch({
                        type: 'OPPONENT_FINISH_TURN',
                        finalBoard: currentBoardState.board,
                        dice: rolledDice,
                        moves: [],
                    });
                    opponentTurnInProgressRef.current = false;
                }, isCustomTestTiming ? opponentDelayMs + stepDelayMs : T1_ROLL_MS + T2_READ_MS + preset.NO_MOVE_ANNOUNCE_MS);
                opponentTimersRef.current.push(tBlockedFinish);
                return;
            }

            // === T1 : les dés roulent PENDANT que l'IA calcule (Parallel Roll & Compute Pipeline) ===
            // Calcul du coup optimal via Open Sage (bgsage-service sur Google Cloud Run) en priorité,
            // avec livre d'ouvertures au tour 1 et repli local infaillible hors-ligne.
            const pickOpeningBook = (): MoveSequence | null => {
                try {
                    if (difficulty !== 'beginner' && isInitialBoardPosition(currentBoardState.board)) {
                        return findOpeningBookSequenceForOpponent(currentBoardState.board, rolledDice, legalSeqs);
                    }
                } catch {
                    // Livre indisponible : on continue avec les moteurs
                }
                return null;
            };
            const pickLocal = (): MoveSequence | null => {
                try {
                    if (difficulty === 'expert' || difficulty === 'grandmaster') {
                        const unified = findBestBoardMove(stateWithDice, rolledDice, 2);
                        if (unified?.sequence) return unified.sequence;
                    }
                } catch {
                    // Repli sur l'heuristique ci-dessous
                }
                try {
                    return selectBestOpponentSequence(legalSeqs, 'O', difficulty);
                } catch {
                    return legalSeqs[0] ?? null;
                }
            };
            const computeRemote = async (): Promise<MoveSequence | null> => {
                const book = pickOpeningBook();
                if (book) return book;
                if (legalSeqs.length <= 1) return null;
                try {
                    const sageChoice = await selectBotMoveWithBgsage(
                        stateWithDice,
                        legalSeqs,
                        difficulty,
                        preset.COMPUTE_HARD_DEADLINE_MS,
                    );
                    return sageChoice?.sequence ?? null;
                } catch {
                    return null;
                }
            };

            if (isCustomTestTiming) {
                revealDice(initialStatus);
            } else {
                const tStart = setTimeout(() => revealDice(initialStatus), T1_ROLL_MS);
                opponentTimersRef.current.push(tStart);
            }

            // === T2 : lecture des dés — masque le reste de la latence réseau ===
            let best: MoveSequence | null;
            if (isCustomTestTiming) {
                best = pickOpeningBook() ?? pickLocal();
            } else {
                const [remote] = await Promise.all([computeRemote(), waitOpponent(T1_ROLL_MS + T2_READ_MS)]);
                if (isTurnAborted()) return;
                best = remote ?? pickLocal();
            }
            if (isTurnAborted()) return;

            const rawMoves = best ? best.moves : [];
            const moves = annotateOpponentMoveHits(currentBoardState.board, rawMoves);
            const isForced = legalSeqs.length <= 1;
            const arrowPreviewMs = isCustomTestTiming || isForced ? 0 : preset.T3_ARROW_PREVIEW_MS;
            const flightEstimateMs = isCustomTestTiming
                ? 0
                : Math.round(BOT_FLIGHT_ESTIMATE_MS * preset.T4_FLIGHT_SPEED_FACTOR);
            const stepIntervalMs = isCustomTestTiming
                ? stepDelayMs
                : flightEstimateMs + getBetweenMovesPauseMs(preset, isDoubleRoll);

            // Watchdog de sécurité : garantit mathématiquement qu'aucun tour IA ne reste bloqué
            const totalEstimatedMs = arrowPreviewMs + moves.length * stepIntervalMs + preset.END_OF_TURN_BREATH_MS + 800;
            const tWatchdog = setTimeout(() => {
                if (opponentTurnInProgressRef.current) {
                    // eslint-disable-next-line no-console
                    console.warn('[WATCHDOG] Opponent turn exceeded timeout, forcing completion');
                    opponentTurnInProgressRef.current = false;
                    clearOpponentTimers();
                    const curBoard = boardStateRef.current.board;
                    const win = evaluateWin(curBoard, boardStateRef.current.cubeValue);
                    recordFlightEvent({
                        ts: typeof performance !== 'undefined' ? performance.now() : Date.now(),
                        event: win ? 'GAME_OVER' : 'TURN_FINISHED',
                        player: 'O',
                        dice: rolledDice,
                        isAiThinking: false,
                        boardBefore: [...curBoard],
                        boardAfter: [...curBoard],
                        arrows: [],
                        statusMessage: null,
                    });
                    dispatch({
                        type: 'OPPONENT_FINISH_TURN',
                        finalBoard: curBoard,
                        dice: rolledDice,
                        moves: [],
                        gameResult: win,
                    });
                }
            }, Math.max(4500, totalEstimatedMs + 1000));
            opponentTimersRef.current.push(tWatchdog);

            // === T3 : flèches d'intention sur la position AVANT déplacement (sautées si coup forcé / Blitz) ===
            const displayArrows = moves.length > 0
                ? getDisplayArrowsForMoves(moves, currentBoardState.board, 'O')
                : [];
            const showArrowsNow = displayArrows.length > 0 && (isCustomTestTiming || arrowPreviewMs > 0);

            if (showArrowsNow) {
                const arrowsStatus = isCustomTestTiming ? initialStatus : "L'ordinateur prépare son déplacement...";
                dispatch({
                    type: 'OPPONENT_SHOW_ARROWS',
                    arrows: displayArrows,
                    statusMessage: arrowsStatus,
                });
                if (!isCustomTestTiming) {
                    recordFlightEvent({
                        ts: performance.now(),
                        event: 'AI_ARROWS_DISPLAYED',
                        player: 'O',
                        dice: rolledDice,
                        isAiThinking: true,
                        boardBefore: [...currentBoardState.board],
                        boardAfter: [...currentBoardState.board],
                        arrows: displayArrows.map((a) => {
                            const { sourceValid, sourceValue } = validateArrowSource(currentBoardState.board, a.from, 'O');
                            return { from: a.from, to: a.to, sourceValid, sourceValue };
                        }),
                        statusMessage: arrowsStatus,
                    });
                }
            }

            // === T4 / T5 : déplacement séquentiel des pions (cadence accélérée de 25 % en double) ===
            const movementStartMs = isCustomTestTiming ? opponentDelayMs : arrowPreviewMs;
            let currentBoard = currentBoardState.board;

            moves.forEach((m, idx) => {
                const tStep = setTimeout(() => {
                    const isHit = m.to !== O_OFF && currentBoard[m.to] === 1;
                    if (isHit) {
                        soundEngine.playCheckerHit();
                        const hitEjectDelayMs = computeHitEjectDelayMs(flightEstimateMs);
                        if (hitEjectDelayMs > 0) {
                            const tHit = setTimeout(() => {
                                sensoryFeedbackController.triggerBlotHit();
                            }, hitEjectDelayMs);
                            opponentTimersRef.current.push(tHit);
                        } else {
                            sensoryFeedbackController.triggerBlotHit();
                        }
                    } else {
                        soundEngine.playCheckerSlide();
                        sensoryFeedbackController.triggerStandardCheckerMove();
                    }

                    const { sourceValid, sourceValue } = validateArrowSource(currentBoard, m.from, 'O');
                    const boardBefore = [...currentBoard];

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

                    recordFlightEvent({
                        ts: performance.now(),
                        event: 'MOVE_APPLIED',
                        player: 'O',
                        dice: rolledDice,
                        isAiThinking: true,
                        boardBefore,
                        boardAfter: [...currentBoard],
                        arrows: [{ from: m.from, to: m.to, sourceValid, sourceValue }],
                        statusMessage: stepStatus,
                    });

                    dispatch({
                        type: 'OPPONENT_APPLY_STEP',
                        board: currentBoard,
                        move: m,
                        usedDiceIndex: idx,
                        statusMessage: stepStatus,
                    });
                }, movementStartMs + idx * stepIntervalMs);
                opponentTimersRef.current.push(tStep);
            });

            // === FIN DU TOUR : court répit visuel après l'atterrissage du dernier pion ===
            const finishMs = isCustomTestTiming
                ? movementStartMs + moves.length * stepIntervalMs + 200
                : movementStartMs +
                  Math.max(0, moves.length - 1) * stepIntervalMs +
                  flightEstimateMs +
                  preset.END_OF_TURN_BREATH_MS;
            const tFinish = setTimeout(() => {
                const finalBoard = best ? best.board : currentBoard;
                const win = evaluateWin(finalBoard, boardStateRef.current.cubeValue);

                recordFlightEvent({
                    ts: performance.now(),
                    event: win ? 'GAME_OVER' : 'TURN_FINISHED',
                    player: 'O',
                    dice: rolledDice,
                    isAiThinking: false,
                    boardBefore: [...currentBoardState.board],
                    boardAfter: [...finalBoard],
                    arrows: [],
                    statusMessage: null,
                });

                dispatch({
                    type: 'OPPONENT_FINISH_TURN',
                    finalBoard,
                    dice: rolledDice,
                    moves,
                    gameResult: win,
                });
                opponentTurnInProgressRef.current = false;
                clearOpponentTimers();
            }, finishMs);
            opponentTimersRef.current.push(tFinish);
        };

        if (isCustomTestTiming) {
            runOpponentTurn(0);
        } else {
            const tYield = setTimeout(() => runOpponentTurn(16), 16);
            opponentTimersRef.current.push(tYield);
        }

        return () => {
            // Ne nettoie les timers QUE si le tour change réellement ou au unmount (pas à chaque step)
            if (boardStateRef.current.turn !== 'O') {
                clearOpponentTimers();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardState.turn, phase, difficulty, autoOpponent, opponentDelayMs, stepDelayMs, arrowPreviewMs, forcedOpponentDice, locale]);

    const isCustomTestTiming = options.opponentDelayMs !== undefined;

    const rollDice = useCallback((forcedDice?: [number, number]) => {
        clearHumanTimers();
        dispatch({
            type: 'ROLL_DICE',
            dice: forcedDice,
            deferBlockedTransition: !isCustomTestTiming,
        });
    }, [clearHumanTimers, isCustomTestTiming]);

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
        dispatch({
            type: 'MOVE_CHECKER',
            destination,
            from,
            die,
            deferCommit: !isCustomTestTiming,
        });
    }, [isCustomTestTiming]);

    const playMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        dispatch({
            type: 'PLAY_MOVE',
            from,
            to,
            die,
            deferCommit: !isCustomTestTiming,
        });
    }, [isCustomTestTiming]);

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
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        dispatch({ type: 'START_NEW_GAME' });
    }, [clearOpponentTimers, clearHumanTimers]);

    const setDifficulty = useCallback((difficulty: AIDifficulty) => {
        dispatch({ type: 'SET_DIFFICULTY', difficulty });
    }, []);

    const resetMatch = useCallback(() => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        moveTimingTrackerRef.current?.reset();
        lastTrackedHumanDiceRef.current = null;
        dispatch({ type: 'RESET_MATCH' });
    }, [clearOpponentTimers, clearHumanTimers]);

    /** Démarre une nouvelle partie avec un format et un niveau d'IA choisis. */
    const startNewMatch = useCallback((newMatchLength: number, newDifficulty: AIDifficulty) => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        moveTimingTrackerRef.current?.reset();
        lastTrackedHumanDiceRef.current = null;
        dispatch({ type: 'NEW_MATCH', matchLength: newMatchLength, difficulty: newDifficulty });
    }, [clearOpponentTimers, clearHumanTimers]);

    const updateClientSeeds = useCallback((clientSeedA: string, clientSeedB?: string) => {
        dispatch({ type: 'SET_CLIENT_SEEDS', clientSeedA, clientSeedB });
    }, []);

    useEffect(() => {
        if (!autoOpponent) return;
        if (phase === 'DOUBLING_OFFERED' && doublingOfferedBy === 'X') {
            const cubeDelay = isCustomTestTiming ? opponentDelayMs : 500;
            let cancelled = false;
            const timer = setTimeout(async () => {
                // 1. En production (hors tests synchrones), on interroge Open Sage (bgsage-service)
                //    du point de vue du doubleur ('X') : O accepte (Take) ssi doubleTake <= doublePass (1.0).
                if (!isCustomTestTiming) {
                    try {
                        const doublerState: BoardState = {
                            ...boardState,
                            turn: 'X',
                            dice: null,
                        };
                        const sageCube = await evaluateBotCubeWithBgsage(doublerState, difficulty, 2000);
                        if (!cancelled && sageCube) {
                            if (sageCube.shouldTake) {
                                dispatch({ type: 'TAKE_DOUBLE' });
                            } else {
                                dispatch({ type: 'PASS_DOUBLE' });
                            }
                            return;
                        }
                    } catch {
                        // Repli local si bgsage est indisponible
                    }
                }

                if (cancelled) return;
                // 2. Repli local déterministe (Janowski) :
                //    Take si équité cubeless >= -0.540 (~23% de gain), sinon Pass.
                const iaState: BoardState = {
                    ...boardState,
                    turn: 'O',
                    dice: null,
                };
                const iaEval = evaluateBoard(iaState, 2);
                if (shouldTakeDouble(iaEval.cubelessEquity)) {
                    dispatch({ type: 'TAKE_DOUBLE' });
                } else {
                    dispatch({ type: 'PASS_DOUBLE' });
                }
            }, cubeDelay);
            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }
    }, [phase, doublingOfferedBy, autoOpponent, opponentDelayMs, isCustomTestTiming, boardState, difficulty]);

    const applyRemoteState = useCallback(
        (payload: {
            board: number[];
            dice?: [number, number] | null;
            turn?: Player;
            usedDice?: [boolean, boolean] | boolean[];
            phase?: GamePhase;
            cubeValue?: number;
            cubeOwner?: Player | null;
            scoreX?: number;
            scoreO?: number;
            crawford?: boolean;
            doublingOfferedBy?: Player | null;
        }) => {
            clearOpponentTimers();
            clearHumanTimers();
            opponentTurnInProgressRef.current = false;
            dispatch({ type: 'APPLY_REMOTE_STATE', ...payload });
        },
        [clearOpponentTimers, clearHumanTimers],
    );

    const resignGame = useCallback(
        (multiplier: 1 | 2 | 3 = 1, winner?: Player) => {
            clearOpponentTimers();
            clearHumanTimers();
            opponentTurnInProgressRef.current = false;
            dispatch({
                type: 'RESIGN_GAME',
                multiplier,
                winner: winner ?? (humanPlayer === 'X' ? 'O' : 'X'),
            });
        },
        [clearOpponentTimers, clearHumanTimers, humanPlayer],
    );

    // Pont d'inspection & contrôle QA / E2E Playwright en navigateur
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qaTarget = window as unknown as {
            __BG_QA__?: {
                getState: () => BackgammonGameState;
                dispatch: (action: GameAction) => void;
                rollDice: (dice?: [number, number]) => void;
                offerDouble: () => void;
                takeDouble: () => void;
                passDouble: () => void;
                resignGame: (multiplier?: 1 | 2 | 3, winner?: Player) => void;
                applyRemoteState: typeof applyRemoteState;
                startNewGame: () => void;
                startNewMatch: (matchLength: number, difficulty: AIDifficulty) => void;
                setAutoConfirmTurn: (enabled: boolean) => void;
            };
        };
        qaTarget.__BG_QA__ = {
            getState: () => state,
            dispatch,
            rollDice,
            offerDouble,
            takeDouble,
            passDouble,
            resignGame,
            applyRemoteState,
            startNewGame,
            startNewMatch,
            setAutoConfirmTurn,
        };
    }, [
        state,
        rollDice,
        offerDouble,
        takeDouble,
        passDouble,
        resignGame,
        applyRemoteState,
        startNewGame,
        startNewMatch,
        setAutoConfirmTurn,
    ]);

    return {
        state: boardState,
        phase,
        gamePhase: strictGamePhase,
        matchLog: state.matchLog ?? [],
        commitHumanMove: (moves?: Move[]) => {
            const currentGPhase = deriveStrictGamePhase(
                phase,
                usedDice,
                state.opponentHighlight,
                gameResult,
            );
            const res = commitHumanMoveAction({
                currentPhase: currentGPhase,
                turnIndex: (state.matchLog?.length ?? 0) + 1,
                player: boardState.turn,
                dice: boardState.dice ?? [1, 1],
                boardBefore: state.moveHistory[0]?.board ?? boardState.board,
                movesPlayed: moves ?? state.moveHistory.flatMap((h) => (h.move ? [h.move] : [])),
                boardAfter: boardState.board,
                matchLog: state.matchLog ?? [],
                isGameOver: !!gameResult,
            });
            if (currentGPhase === 'HUMAN_READY_TO_COMMIT') {
                clearHumanTimers();
                dispatch({ type: 'COMMIT_HUMAN_TURN' });
            }
            return res;
        },
        replayFromLog: (entry: MatchLogEntry, showBefore?: boolean) => {
            return replayFromLogAction({ logEntry: entry, showBefore });
        },
        runAiTurn: (dice: [number, number], turnIndex?: number) => {
            return runAiTurnAction(
                {
                    currentBoard: boardState.board,
                    turnIndex: turnIndex ?? (state.matchLog?.length ?? 0) + 1,
                    dice,
                    difficulty: state.difficulty,
                    rollDurationMs: getSpeedPreset(gameSpeedRef.current).T1_DICE_ROLL_ANIMATION_MS,
                    previewDurationMs: getSpeedPreset(gameSpeedRef.current).T3_ARROW_PREVIEW_MS,
                    isGameOver: !!gameResult,
                },
                {
                    onPhaseChange: (p) => {
                        // La phase stricte est dérivée ; on pilote le reducer via les actions existantes.
                        if (p === 'AI_TURN_ROLLING') {
                            dispatch({ type: 'OPPONENT_PREPARE_ROLL' });
                        } else if (p === 'AI_TURN_SHOWING_ARROWS') {
                            dispatch({ type: 'OPPONENT_START_TURN', dice, statusMessage: "L'ordinateur prépare son déplacement..." });
                        }
                    },
                    onArrowsReady: (arrows) => {
                        dispatch({ type: 'OPPONENT_SHOW_ARROWS', arrows });
                    },
                    onApplyBoard: (board) => {
                        dispatch({ type: 'OPPONENT_FINISH_TURN', finalBoard: [...board], dice, moves: [] });
                    },
                    onLogEntryAdded: () => {
                        // L'entrée de log est déjà écrite par OPPONENT_FINISH_TURN dans le reducer.
                    },
                },
            );
        },
        isAiThinking: phase === 'OPPONENT_THINKING' || (boardState.turn === 'O' && state.autoOpponent),
        humanPlayer,
        isHumanTurn,
        dice,
        usedDice,
        leftDieTargets,
        rightDieTargets,
        selected,
        canDouble,
        isDMP,
        doublingOfferedBy,
        gameResult,
        isMatchOver,
        matchWinner,
        isCrawfordNext,
        crawfordAlreadyPlayed: state.crawfordAlreadyPlayed,
        autoOpponent: state.autoOpponent,
        difficulty: state.difficulty,
        lastOpponentDice: state.lastOpponentDice,
        lastOpponentMoves: state.lastOpponentMoves,
        opponentHighlight: state.opponentHighlight,
        opponentStatusMessage: state.opponentStatusMessage,
        moveHistory: state.moveHistory,
        canUndo: state.moveHistory.length > 0 && phase === 'PLAYING_MOVES',
        isAwaitingConfirmation:
            strictGamePhase === 'HUMAN_READY_TO_COMMIT' &&
            state.moveHistory.length > 0 &&
            phase === 'PLAYING_MOVES',
        autoConfirmTurn,
        setAutoConfirmTurn,
        toggleAutoConfirmTurn,
        autoConfirmMode,
        setAutoConfirmMode,
        cycleAutoConfirmMode,
        gameSpeed,
        setGameSpeed,
        undoMove: () => {
            clearHumanTimers();
            dispatch({ type: 'UNDO_MOVE' });
        },
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
        startNewMatch,
        resignGame,
        applyRemoteState,
        provablyFair: currentProvablyFair,
        serverSeedHash: currentProvablyFair.serverSeedHash,
        serverSeed:
            currentProvablyFair.isRevealed || phase === 'GAME_OVER'
                ? currentProvablyFair.serverSeed
                : null,
        clientSeed: currentProvablyFair.clientSeed,
        updateClientSeeds,
        telemetry: moveTimingTrackerRef.current.getMatchMetadata(),
        moveTimingTracker: moveTimingTrackerRef.current,
    };
}

export type UseBackgammonGameReturn = ReturnType<typeof useBackgammonGame>;
