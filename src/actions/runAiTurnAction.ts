/**
 * Micro-programme atomique : Exécution du tour de l'IA avec Cadencement Humanisé (LOI 1, 2, 3 & Audit 19 / 20)
 */

import type { GamePhase, MatchLogEntry, RunAiTurnParams, RunAiTurnCallbacks } from './types';
import {
    applyMove,
    BoardState,
    generateLegalMoves,
    MoveSequence,
} from '../engine/backgammonEngine';
import { selectBotMoveWithBgsage, OPENSAGE_UNREACHABLE_ERROR_CODE } from '../lib/engine/bgsageClient';
import { recordBotMoveEquityLoss } from '../features/personas/botRealPr';
import { formatMoveSequenceNotationAbsolute } from '../lib/engine/evaluator';
import {
    AI_SUB_MOVE_SPACING_MS,
    computeHumanizedAiTiming,
} from '../engine/aiHumanizedTiming';

function waitMs(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAiTurnAction(
    params: RunAiTurnParams,
    callbacks: RunAiTurnCallbacks,
): Promise<MatchLogEntry> {
    const {
        currentBoard,
        turnIndex,
        dice,
        difficulty = 'expert',
        rollDurationMs = 700,
        previewDurationMs,
        subMoveSpacingMs,
        isGameOver = false,
    } = params;

    const boardBefore = Object.freeze([...currentBoard]);
    let movesPlayed: MoveSequence['moves'] = [];
    let boardAfter: ReadonlyArray<number> = boardBefore;
    let createdEntry: MatchLogEntry;

    try {
        callbacks.onPhaseChange('AI_TURN_ROLLING');
        await waitMs(rollDurationMs);

        const stateWithDice: BoardState = {
            board: [...boardBefore],
            turn: 'O',
            dice: [dice[0], dice[1]],
            cubeValue: params.cubeValue ?? 1,
            cubeOwner: params.cubeOwner ?? null,
            matchLength: params.matchLength ?? 7,
            scoreX: params.scoreX ?? 0,
            scoreO: params.scoreO ?? 0,
            crawford: params.crawford ?? false,
            doubled: false,
            resigned: 0,
        };

        const legalSeqs = generateLegalMoves(stateWithDice, [dice[0], dice[1]]);
        const selectMove =
            params.selectMove ??
            (async (st: BoardState, seqs: MoveSequence[]): Promise<MoveSequence | null> => {
                try {
                    const choice = await selectBotMoveWithBgsage(st, seqs, difficulty, 1800);
                    if (choice) {
                        recordBotMoveEquityLoss(choice.equityLoss, choice.isForced);
                        return choice.sequence;
                    }
                } catch {
                    // Fallback tactique ci-dessous
                }
                return seqs[0] ?? null;
            });
        const bestSeq = legalSeqs.length === 1 ? legalSeqs[0]! : (await selectMove(stateWithDice, legalSeqs)) ?? legalSeqs[0] ?? null;

        if (bestSeq && bestSeq.moves.length > 0) {
            movesPlayed = bestSeq.moves;
            boardAfter = Object.freeze([...bestSeq.board]);

            const timingPlan = computeHumanizedAiTiming({
                legalSequenceCount: legalSeqs.length,
                subMoveCount: movesPlayed.length,
                subMoveSpacingMs: subMoveSpacingMs ?? (previewDurationMs === 0 ? 0 : AI_SUB_MOVE_SPACING_MS),
            });

            const effectiveThinkMs = previewDurationMs !== undefined ? previewDurationMs : timingPlan.thinkDurationMs;

            callbacks.onPhaseChange('AI_TURN_SHOWING_ARROWS');
            if (callbacks.onArrowsReady) {
                callbacks.onArrowsReady(movesPlayed.map((m) => ({ from: m.from, to: m.to })));
            }
            await waitMs(effectiveThinkMs);

            if (callbacks.onSubMoveStep) {
                let runningBoard = [...boardBefore];
                for (let idx = 0; idx < movesPlayed.length; idx++) {
                    if (idx > 0 && timingPlan.subMoveSpacingMs > 0) {
                        await waitMs(timingPlan.subMoveSpacingMs);
                    }
                    const subMove = movesPlayed[idx];
                    runningBoard = applyMove(runningBoard, subMove, 'O');
                    callbacks.onSubMoveStep(Object.freeze([...runningBoard]), subMove, idx);
                }
            }
        }

        if (callbacks.onApplyBoard) {
            callbacks.onApplyBoard(boardAfter);
        }

        const notation = formatMoveSequenceNotationAbsolute([...movesPlayed], 'O');
        createdEntry = Object.freeze({
            turnIndex,
            player: 'O',
            dice: Object.freeze([dice[0], dice[1]]) as readonly [number, number],
            boardBefore,
            movePlayed: Object.freeze(movesPlayed.map((m) => ({ ...m }))),
            boardAfter,
            notation,
            timestamp: Date.now(),
        });

        if (callbacks.onLogEntryAdded) {
            callbacks.onLogEntryAdded(createdEntry);
        }
    } finally {
        const nextPhase: GamePhase = isGameOver ? 'GAME_OVER' : 'HUMAN_WAITING_ROLL';
        callbacks.onPhaseChange(nextPhase);
        if (callbacks.onTurnComplete) {
            callbacks.onTurnComplete(nextPhase);
        }
    }

    return createdEntry;
}
