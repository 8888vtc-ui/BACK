import type { MutableRefObject } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import { generateLegalMoves } from '../../engine/backgammonEngine';
import { soundEngine } from '../../lib/sound/soundEngine';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import type { Locale } from '../../lib/i18n/types';
import {
    formatOpponentDiceRollStatus,
    formatOpponentBlockedStatus,
} from '../../lib/i18n/engineMessages';
import { recordFlightEvent } from '../../utils/gameFlightRecorder';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import {
    getBetweenMovesPauseMs,
    getSpeedPreset,
    type GameSpeed,
} from '../../lib/gameFeel/speedPresets';
import { generateProvablyFairRoll } from '../../lib/crypto/provablyFairRng';
import type {
    GameAction,
    UseBackgammonGameOptions,
} from '../gameStateReducer';
import { annotateOpponentMoveHits } from '../gameStateReducer';
import { evaluateOpponentDoubleAsync } from './opponentCubeDecision';
import { resolveOpponentMoveSequence, pickOpeningBook, pickLocalMove } from './opponentMoveCalculator';
import { runOpponentAnimation } from './opponentAnimationRunner';

export const BOT_FLIGHT_ESTIMATE_MS = 250;

export interface ExecuteOpponentTurnParams {
    yieldOffsetMs: number;
    canIADouble: boolean;
    forcedOpponentDice?: [number, number];
    isCustomTestTiming: boolean;
    opponentDelayMs: number;
    stepDelayMs: number;
    difficulty: AIDifficulty;
    locale: Locale;
    dispatch: (action: GameAction) => void;
    gameSpeedRef: MutableRefObject<GameSpeed> | { readonly current: GameSpeed };
    provablyFairRef: MutableRefObject<{
        serverSeed: string;
        clientSeed: string;
        nonce: number;
    }> | { readonly current: { serverSeed: string; clientSeed: string; nonce: number } };
    boardStateRef: MutableRefObject<BoardState> | { readonly current: BoardState };
    opponentTurnInProgressRef: MutableRefObject<boolean>;
    opponentTurnTokenRef: MutableRefObject<number>;
    currentTurnToken: number;
    opponentTimersRef: MutableRefObject<NodeJS.Timeout[]>;
    clearOpponentTimers: () => void;
}

export async function executeOpponentTurn({
    yieldOffsetMs,
    canIADouble,
    forcedOpponentDice,
    isCustomTestTiming,
    opponentDelayMs,
    stepDelayMs,
    difficulty,
    locale,
    dispatch,
    gameSpeedRef,
    provablyFairRef,
    boardStateRef,
    opponentTurnInProgressRef,
    opponentTurnTokenRef,
    currentTurnToken,
    opponentTimersRef,
    clearOpponentTimers,
}: ExecuteOpponentTurnParams): Promise<void> {
    const isTurnAborted = () =>
        !opponentTurnInProgressRef.current || opponentTurnTokenRef.current !== currentTurnToken;

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

    let shouldBotDouble = false;
    if (!isCustomTestTiming) {
        const handoffMs = Math.max(0, preset.T0_TURN_HANDOFF_MS - yieldOffsetMs);
        const cubePromise = canIADouble && !forcedOpponentDice
            ? evaluateOpponentDoubleAsync(boardStateRef.current, difficulty)
            : Promise.resolve(false);
        const [botDoubleResult] = await Promise.all([cubePromise, waitOpponent(handoffMs)]);
        if (isTurnAborted()) return;
        shouldBotDouble = botDoubleResult;
    }

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
    const humanReadMs = isCustomTestTiming
        ? 0
        : legalSeqs.length <= 1
          ? Math.round(T2_READ_MS * 0.65)
          : legalSeqs.length >= 12
            ? T2_READ_MS + 180
            : T2_READ_MS;
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

    if (isCustomTestTiming) {
        revealDice(initialStatus);
    } else {
        const tStart = setTimeout(() => revealDice(initialStatus), T1_ROLL_MS);
        opponentTimersRef.current.push(tStart);
    }

    let best: ReturnType<typeof pickOpeningBook> = null;
    if (isCustomTestTiming) {
        best = pickOpeningBook(currentBoardState.board, rolledDice, legalSeqs, difficulty) ??
            pickLocalMove(stateWithDice, rolledDice, legalSeqs, difficulty);
    } else {
        const movePromise = resolveOpponentMoveSequence({
            stateWithDice,
            currentBoard: currentBoardState.board,
            rolledDice,
            legalSeqs,
            difficulty,
            computeHardDeadlineMs: preset.COMPUTE_HARD_DEADLINE_MS,
            isCustomTestTiming,
        });

        const [resolved] = await Promise.all([
            movePromise,
            waitOpponent(T1_ROLL_MS + humanReadMs),
        ]);
        if (isTurnAborted()) return;
        best = resolved;
    }
    if (isTurnAborted()) return;

    const rawMoves = best ? best.moves : [];
    const moves = annotateOpponentMoveHits(currentBoardState.board, rawMoves);
    const isForced = legalSeqs.length <= 1;
    const previewMs = isCustomTestTiming || isForced ? 0 : preset.T3_ARROW_PREVIEW_MS;
    const flightEstimateMs = isCustomTestTiming
        ? 0
        : Math.round(BOT_FLIGHT_ESTIMATE_MS * preset.T4_FLIGHT_SPEED_FACTOR);
    const stepIntervalMs = isCustomTestTiming
        ? stepDelayMs
        : flightEstimateMs + getBetweenMovesPauseMs(preset, isDoubleRoll);
    const movementStartMs = isCustomTestTiming ? opponentDelayMs : previewMs;

    runOpponentAnimation({
        currentBoardState,
        rolledDice,
        moves,
        best,
        isCustomTestTiming,
        preset,
        flightEstimateMs,
        stepIntervalMs,
        arrowPreviewMs: previewMs,
        movementStartMs,
        initialStatus,
        locale,
        dispatch,
        boardStateRef,
        opponentTurnInProgressRef,
        opponentTimersRef,
        clearOpponentTimers,
    });
}
