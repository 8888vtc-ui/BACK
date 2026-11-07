import type { BoardState, MoveSequence } from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { selectBotMoveWithBgsage } from '../../lib/engine/bgsageClient';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../../features/openings';
import { recordBotMoveEquityLoss } from '../../features/personas/botRealPr';
import { computePersonaBiasDelta } from '../../features/personas/botPersonas';
import {
    computeHumanThinkingDelay,
    resolveMoveThinkingContext,
    HUMAN_BLUNDER_CAP_EMG,
    type HumanThinkingDelay,
} from '../../features/personas/humanPersonaPool';

export function computeOpponentThinkingDelay(params: {
    readonly legalMoveCount: number;
    readonly isContact: boolean;
    readonly closeDecisionsCount: number;
    readonly isOpening?: boolean;
    readonly uniformFn?: () => number;
}): HumanThinkingDelay {
    const context = resolveMoveThinkingContext(params);
    return computeHumanThinkingDelay(context, params.uniformFn);
}

export function getOpponentBlunderCap(difficulty: AIDifficulty): number {
    return HUMAN_BLUNDER_CAP_EMG[difficulty] ?? 0.035;
}

const RETRY_DELAYS_MS = [0];

export interface ResolveOpponentMoveParams {
    stateWithDice: BoardState;
    currentBoard: number[];
    rolledDice: [number, number];
    legalSeqs: MoveSequence[];
    difficulty: AIDifficulty;
    computeHardDeadlineMs: number;
    isCustomTestTiming: boolean;
    onEngineRetry?: (attempt: number) => void;
    isAborted?: () => boolean;
}

export function pickOpeningBook(
    board: number[],
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    try {
        if (difficulty !== 'beginner' && isInitialBoardPosition(board)) {
            return findOpeningBookSequenceForOpponent(board, rolledDice, legalSeqs);
        }
    } catch {
        // Livre indisponible : on passe à Open Sage
    }
    return null;
}

export function pickTestStubMove(
    board: number[],
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    return pickOpeningBook(board, rolledDice, legalSeqs, difficulty) ?? legalSeqs[0] ?? null;
}

function wait(ms: number): Promise<void> {
    return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

export async function resolveOpponentMoveSequence({
    stateWithDice,
    currentBoard,
    rolledDice,
    legalSeqs,
    difficulty,
    computeHardDeadlineMs,
    isCustomTestTiming,
    onEngineRetry,
    isAborted,
}: ResolveOpponentMoveParams): Promise<MoveSequence | null> {
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return legalSeqs[0];

    const book = pickOpeningBook(currentBoard, rolledDice, legalSeqs, difficulty);
    if (book) return book;

    if (isCustomTestTiming) {
        return pickTestStubMove(currentBoard, rolledDice, legalSeqs, difficulty);
    }

    const timeoutMs = Math.min(Math.max(computeHardDeadlineMs, 600), 900);
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
        if (isAborted?.()) return null;
        await wait(RETRY_DELAYS_MS[attempt] ?? 400);
        if (isAborted?.()) return null;
        try {
            const choice = await selectBotMoveWithBgsage(stateWithDice, legalSeqs, difficulty, timeoutMs);
            if (choice?.sequence) {
                recordBotMoveEquityLoss(choice.equityLoss, choice.isForced);
                return choice.sequence;
            }
        } catch {
            // Nouvel essai rapide
        }
        onEngineRetry?.(attempt + 1);
    }

    // Repli tactique déterministe anti-interruption de partie (si Cloud Run ne répond pas après 2 essais)
    let bestFallback = legalSeqs[0];
    let bestScore = -Infinity;
    for (const seq of legalSeqs) {
        const score = computePersonaBiasDelta(currentBoard, seq.board, difficulty);
        if (score > bestScore) {
            bestScore = score;
            bestFallback = seq;
        }
    }
    return bestFallback;
}
