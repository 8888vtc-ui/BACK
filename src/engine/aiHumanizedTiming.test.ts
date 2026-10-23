import { describe, it, expect, vi } from 'vitest';
import {
    computeHumanizedAiTiming,
    yieldToMainThread,
    AI_FORCED_MOVE_THINK_MS,
    AI_COMPLEX_THINK_MIN_MS,
    AI_COMPLEX_THINK_MAX_MS,
    AI_SUB_MOVE_SPACING_MS,
} from './aiHumanizedTiming';
import { runAiTurnAction } from '../actions/runAiTurnAction';
import { createInitialState } from './backgammonEngine';

describe('aiHumanizedTiming — Fluidité de l’Adversaire IA (Audit 19 / 20)', () => {
    it('calibre la réflexion à 150ms pour un coup forcé (≤ 1 séquence) et entre 600ms et 1100ms pour un coup complexe', () => {
        const forced = computeHumanizedAiTiming({ legalSequenceCount: 1, subMoveCount: 1 });
        expect(forced.isForcedOrTrivial).toBe(true);
        expect(forced.thinkDurationMs).toBe(AI_FORCED_MOVE_THINK_MS);
        expect(forced.thinkDurationMs).toBe(150);

        const simpleChoice = computeHumanizedAiTiming({ legalSequenceCount: 2, subMoveCount: 2 });
        expect(simpleChoice.isForcedOrTrivial).toBe(false);
        expect(simpleChoice.thinkDurationMs).toBe(AI_COMPLEX_THINK_MIN_MS);
        expect(simpleChoice.thinkDurationMs).toBe(600);

        const mediumChoice = computeHumanizedAiTiming({ legalSequenceCount: 12, subMoveCount: 2 });
        expect(mediumChoice.thinkDurationMs).toBeGreaterThan(600);
        expect(mediumChoice.thinkDurationMs).toBeLessThan(1100);

        const highComplexity = computeHumanizedAiTiming({ legalSequenceCount: 35, subMoveCount: 4 });
        expect(highComplexity.thinkDurationMs).toBe(AI_COMPLEX_THINK_MAX_MS);
        expect(highComplexity.thinkDurationMs).toBe(1100);
    });

    it('espace séquentiellement chaque sous-coup de 180ms (0ms, 180ms, 360ms, 540ms)', () => {
        const doublePlan = computeHumanizedAiTiming({ legalSequenceCount: 8, subMoveCount: 4 });
        expect(doublePlan.subMoveSpacingMs).toBe(AI_SUB_MOVE_SPACING_MS);
        expect(doublePlan.subMoveSpacingMs).toBe(180);
        expect(doublePlan.subMoveOffsetsMs).toEqual([0, 180, 360, 540]);
    });

    it('exécute les sous-coups de l’IA pas-à-pas via onSubMoveStep sans bloquer le thread principal', async () => {
        await yieldToMainThread();

        const board = createInitialState().board;
        const steps: number[] = [];

        const entry = await runAiTurnAction(
            {
                currentBoard: board,
                turnIndex: 2,
                dice: [3, 1],
                difficulty: 'expert',
                rollDurationMs: 0,
                previewDurationMs: 0,
                subMoveSpacingMs: 0,
            },
            {
                onPhaseChange: vi.fn(),
                onSubMoveStep: (_partialBoard, _move, stepIdx) => {
                    steps.push(stepIdx);
                },
            },
        );

        expect(steps).toEqual([0, 1]);
        expect(entry.movePlayed).toHaveLength(2);
    });
});
