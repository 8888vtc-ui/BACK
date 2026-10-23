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
export * from './gameStateReducer';
import { useOpponentTurnOrchestrator } from './useOpponentTurnOrchestrator';
import {
    type GamePhase,
    type OpponentMoveArrow,
    type UseBackgammonGameOptions,
    type BackgammonGameState,
    type GameAction,
    createInitialGameState,
    backgammonGameReducer,
    gameReducer,
    annotateOpponentMoveHits,
    deriveStrictGamePhase,
} from './gameStateReducer';

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

    useOpponentTurnOrchestrator({
        autoOpponent,
        boardState,
        phase,
        matchLength,
        difficulty,
        options,
        dispatch,
        locale,
        gameSpeedRef,
        provablyFairRef,
        boardStateRef,
        opponentTurnInProgressRef,
        opponentTurnTokenRef,
        opponentTimersRef,
        clearOpponentTimers,
    });

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
