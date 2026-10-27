'use client';

/**
 * Sous-hook d'orchestration asynchrone du tour Bot IA (`src/hooks/useOpponentTurnOrchestrator.ts`).
 *
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md).
 * Gère le pipeline de jeu complet de l'adversaire synthétique :
 * - Évaluation du videau (Janowski local pour les tests + Open Sage Cloud Run en jeu réel)
 * - Lancer de dés cryptographique Provably Fair
 * - Résolution d'ouverture / appel Open Sage (Cloud Run) / repli local
 * - Animation fluide séquentielle des déplacements et son haptique (Game Feel)
 * - Watchdog de sécurité anti-blocage (garantie mathématique 0 gel)
 */

import { useEffect, type MutableRefObject } from 'react';
import type { BoardState, Move, MoveSequence } from '../engine/backgammonEngine';
import { applyMove, generateLegalMoves, O_BAR, O_OFF } from '../engine/backgammonEngine';
import { soundEngine } from '../lib/sound/soundEngine';
import { sensoryFeedbackController } from '../lib/sound/SensoryFeedbackController';
import { computeHitEjectDelayMs } from '../lib/gameFeel/flightPhysics';
import type { Locale } from '../lib/i18n/types';
import {
    formatOpponentDiceRollStatus,
    formatOpponentMoveStepStatus,
    formatOpponentBlockedStatus,
    getBoardPointLabel,
} from '../lib/i18n/engineMessages';
import { recordFlightEvent, validateArrowSource, getDisplayArrowsForMoves } from '../utils/gameFlightRecorder';
import {
    evaluateWin,
    selectBestOpponentSequence,
    type AIDifficulty,
} from '../engine/aiHeuristics';
import {
    analyzeBoardMoves,
    evaluateBoard,
    findBestBoardMove,
    shouldOfferDouble,
} from '../lib/engine/evaluator';
import { selectBotMoveWithBgsage, evaluateBotCubeWithBgsage } from '../lib/engine/bgsageClient';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../features/openings';
import {
    CUBE_DECISION_BUDGET_MS,
    getBetweenMovesPauseMs,
    getSpeedPreset,
    type GameSpeed,
} from '../lib/gameFeel/speedPresets';
import { generateProvablyFairRoll } from '../lib/crypto/provablyFairRng';
import type {
    BackgammonGameState,
    GameAction,
    GamePhase,
    UseBackgammonGameOptions,
} from './gameStateReducer';
import { annotateOpponentMoveHits } from './gameStateReducer';

/**
 * Durée de vol moyenne d'un pion du bot (profil Tournament, ~6 flèches ≈ 250 ms) avant
 * application du facteur de vitesse du profil (Game Feel Spec §2).
 */
export const BOT_FLIGHT_ESTIMATE_MS = 250;

export interface UseOpponentTurnOrchestratorParams {
    readonly autoOpponent: boolean;
    readonly boardState: BoardState;
    readonly phase: GamePhase;
    readonly matchLength: number;
    readonly difficulty: AIDifficulty;
    readonly options: UseBackgammonGameOptions;
    readonly dispatch: (action: GameAction) => void;
    readonly locale: Locale;
    readonly gameSpeedRef: MutableRefObject<GameSpeed> | { readonly current: GameSpeed };
    readonly provablyFairRef: MutableRefObject<{
        serverSeed: string;
        clientSeed: string;
        nonce: number;
    }> | { readonly current: { serverSeed: string; clientSeed: string; nonce: number } };
    readonly boardStateRef: MutableRefObject<BoardState> | { readonly current: BoardState };
    readonly opponentTurnInProgressRef: MutableRefObject<boolean>;
    readonly opponentTurnTokenRef: MutableRefObject<number>;
    readonly opponentTimersRef: MutableRefObject<NodeJS.Timeout[]>;
    readonly clearOpponentTimers: () => void;
}

export function useOpponentTurnOrchestrator({
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
}: UseOpponentTurnOrchestratorParams): void {
    const {
        opponentDelayMs = 400,
        stepDelayMs = 250,
        arrowPreviewMs = 250,
        forcedOpponentDice,
    } = options;

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
        const isBotDmp = matchLength > 0 && boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
        const isBotOneAway = matchLength > 0 && boardState.scoreO === matchLength - 1;
        const canIADouble =
            !boardState.crawford &&
            !isBotDmp &&
            !isBotOneAway &&
            !isInitialBoardPosition(boardState.board) &&
            (boardState.cubeOwner === null || boardState.cubeOwner === 'O') &&
            !(matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength));

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
                    if (localPreCheck.cubelessEquity < 0.30) return false;
                    const sageCube = await evaluateBotCubeWithBgsage(iaCubeState, difficulty, CUBE_DECISION_BUDGET_MS);
                    return sageCube ? sageCube.shouldDouble : shouldOfferDouble(localPreCheck.cubelessEquity);
                } catch {
                    return false;
                }
            };

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
                    if (difficulty === 'intermediate') {
                        const unified = findBestBoardMove(stateWithDice, rolledDice, 1);
                        if (unified?.sequence) return unified.sequence;
                    }
                    if (difficulty === 'beginner') {
                        const analysis = analyzeBoardMoves(stateWithDice, rolledDice, {
                            candidateMoves: legalSeqs,
                            ply: 1,
                            maxMoves: 64,
                        });
                        if (analysis.moves.length > 0) {
                            let bestMove = analysis.moves[0];
                            let bestNoisyEq = -Infinity;
                            for (const cand of analysis.moves) {
                                const noisyEq = cand.equity + (Math.random() - 0.5) * 0.28;
                                if (noisyEq > bestNoisyEq && cand.moves && cand.board) {
                                    bestNoisyEq = noisyEq;
                                    bestMove = cand;
                                }
                            }
                            if (bestMove.moves && bestMove.board) {
                                return { moves: bestMove.moves, board: bestMove.board };
                            }
                        }
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

            // === T3 : flèches d'intention sur la position AVANT déplacement ===
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

            // === T4 / T5 : déplacement séquentiel des pions ===
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
            // eslint-disable-next-line react-hooks/exhaustive-deps
            if (boardStateRef.current.turn !== 'O') {
                clearOpponentTimers();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardState.turn, phase, difficulty, autoOpponent, opponentDelayMs, stepDelayMs, arrowPreviewMs, forcedOpponentDice, locale]);
}
