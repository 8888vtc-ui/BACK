import type { MutableRefObject } from 'react';
import type { BoardState, Move, MoveSequence } from '../../engine/backgammonEngine';
import { applyMove, O_BAR, O_OFF } from '../../engine/backgammonEngine';
import { soundEngine } from '../../lib/sound/soundEngine';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import { computeHitEjectDelayMs } from '../../lib/gameFeel/flightPhysics';
import type { Locale } from '../../lib/i18n/types';
import {
    formatOpponentMoveStepStatus,
    getBoardPointLabel,
} from '../../lib/i18n/engineMessages';
import { recordFlightEvent, validateArrowSource, getDisplayArrowsForMoves } from '../../utils/gameFlightRecorder';
import { evaluateWin } from '../../engine/aiHeuristics';
import type { SpeedPreset } from '../../lib/gameFeel/speedPresets';
import type { GameAction } from '../gameStateReducer';

export interface RunOpponentAnimationParams {
    currentBoardState: BoardState;
    rolledDice: [number, number];
    moves: Array<Move & { isHit?: boolean }>;
    best: MoveSequence | null;
    isCustomTestTiming: boolean;
    preset: SpeedPreset;
    flightEstimateMs: number;
    stepIntervalMs: number;
    arrowPreviewMs: number;
    movementStartMs: number;
    initialStatus: string;
    locale: Locale;
    dispatch: (action: GameAction) => void;
    boardStateRef: MutableRefObject<BoardState> | { readonly current: BoardState };
    opponentTurnInProgressRef: MutableRefObject<boolean>;
    opponentTimersRef: MutableRefObject<NodeJS.Timeout[]>;
    clearOpponentTimers: () => void;
}

export function runOpponentAnimation({
    currentBoardState,
    rolledDice,
    moves,
    best,
    isCustomTestTiming,
    preset,
    flightEstimateMs,
    stepIntervalMs,
    arrowPreviewMs,
    movementStartMs,
    initialStatus,
    locale,
    dispatch,
    boardStateRef,
    opponentTurnInProgressRef,
    opponentTimersRef,
    clearOpponentTimers,
}: RunOpponentAnimationParams): void {
    // Watchdog de sécurité
    const totalEstimatedMs = arrowPreviewMs + moves.length * stepIntervalMs + preset.END_OF_TURN_BREATH_MS + 800;
    const tWatchdog = setTimeout(() => {
        if (opponentTurnInProgressRef.current) {
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

    // Flèches d'intention sur la position AVANT déplacement
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

    // Déplacement séquentiel des pions
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

    // FIN DU TOUR
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
}
