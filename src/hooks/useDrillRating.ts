'use client';

/**
 * @file src/hooks/useDrillRating.ts
 * @description Hook dédié (< 150 lignes, validation Zod stricte aux frontières I/O)
 * gérant de manière 100 % cloisonnée :
 * - `erPrScore` (`0.0` à `30.0`, initialisé à `6.3`, évolution par dixièmes `-0.1` / `+0.4`)
 * - `erhScore` (`0.0` à `30.0`, initialisé à `6.1`, évolution par dixièmes `-0.1` / `+0.4`)
 * - `eloRating` (`1500`)
 * Strictement 0 `any`, < 150 lignes.
 */

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import {
    QUIZ_ER_STORAGE_KEY,
    QUIZ_ERH_STORAGE_KEY,
    DEFAULT_ER_STATE,
    DEFAULT_ERH_STATE,
    type QuizErState,
    type QuizErhState,
} from '../features/drills/quizRatingStore';
import { computeTenthsMetricDelta } from '../features/drills/drillSubAgentsPipeline';

const QuizErStateSchema = z.object({
    mode: z.literal('ER'),
    erPrScore: z.number().min(0).max(30).default(6.3),
    lastDeltaTenths: z.number().default(0),
    erRating: z.number().int().min(400).max(3500),
    lastDeltaEr: z.number().int(),
    solvedCount: z.number().int().min(0),
    updatedAt: z.string(),
});

const QuizErhStateSchema = z.object({
    mode: z.literal('ERH'),
    erhScore: z.number().min(0).max(30).default(6.1),
    lastDeltaTenths: z.number().default(0),
    erhRating: z.number().int().min(400).max(3500),
    lastDeltaErh: z.number().int(),
    solvedCount: z.number().int().min(0),
    updatedAt: z.string(),
});

function readValidatedErState(): QuizErState {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ER_STATE;
    try {
        const raw = window.localStorage.getItem(QUIZ_ER_STORAGE_KEY);
        if (!raw) return DEFAULT_ER_STATE;
        const parsed = QuizErStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : DEFAULT_ER_STATE;
    } catch {
        return DEFAULT_ER_STATE;
    }
}

function readValidatedErhState(): QuizErhState {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ERH_STATE;
    try {
        const raw = window.localStorage.getItem(QUIZ_ERH_STORAGE_KEY);
        if (!raw) return DEFAULT_ERH_STATE;
        const parsed = QuizErhStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : DEFAULT_ERH_STATE;
    } catch {
        return DEFAULT_ERH_STATE;
    }
}

export interface UseDrillRatingReturn {
    readonly modeLabel: 'ER' | 'ERH';
    readonly erPrScore: number;
    readonly erhScore: number;
    readonly activeMetricScore: number;
    readonly activeTenthsDelta: number;
    readonly ratingValue: number;
    readonly ratingDelta: number;
    readonly solvedCount: number;
    readonly recordAttempt: (isCorrect: boolean, tier?: number, equityLoss?: number) => void;
    readonly recordOutcome: (isCorrect: boolean, tier?: number, equityLoss?: number) => void;
}

export function useDrillRating(isErMode: boolean): UseDrillRatingReturn {
    const [erState, setErState] = useState<QuizErState>(() => readValidatedErState());
    const [erhState, setErhState] = useState<QuizErhState>(() => readValidatedErhState());

    useEffect(() => {
        if (isErMode) setErState(readValidatedErState());
        else setErhState(readValidatedErhState());
    }, [isErMode]);

    const recordAttempt = useCallback(
        (isCorrect: boolean, tier: number = 2, equityLoss: number = 0.084) => {
            const safeTier = Math.max(1, Math.min(4, tier));
            const tenthsDelta = computeTenthsMetricDelta(isCorrect, equityLoss);
            const eloDelta = isCorrect
                ? 10 + safeTier * 3
                : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));

            if (isErMode) {
                const current = readValidatedErState();
                const next: QuizErState = {
                    mode: 'ER',
                    erPrScore: Math.max(0, Math.min(30, Number((current.erPrScore + tenthsDelta).toFixed(1)))),
                    lastDeltaTenths: tenthsDelta,
                    erRating: Math.max(800, current.erRating + eloDelta),
                    lastDeltaEr: eloDelta,
                    solvedCount: current.solvedCount + 1,
                    updatedAt: new Date().toISOString(),
                };
                if (typeof window !== 'undefined' && window.localStorage) {
                    try { window.localStorage.setItem(QUIZ_ER_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                }
                setErState(next);
            } else {
                const current = readValidatedErhState();
                const next: QuizErhState = {
                    mode: 'ERH',
                    erhScore: Math.max(0, Math.min(30, Number((current.erhScore + tenthsDelta).toFixed(1)))),
                    lastDeltaTenths: tenthsDelta,
                    erhRating: Math.max(800, current.erhRating + eloDelta),
                    lastDeltaErh: eloDelta,
                    solvedCount: current.solvedCount + 1,
                    updatedAt: new Date().toISOString(),
                };
                if (typeof window !== 'undefined' && window.localStorage) {
                    try { window.localStorage.setItem(QUIZ_ERH_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
                }
                setErhState(next);
            }
        },
        [isErMode],
    );

    return {
        modeLabel: isErMode ? 'ER' : 'ERH',
        erPrScore: erState.erPrScore,
        erhScore: erhState.erhScore,
        activeMetricScore: isErMode ? erState.erPrScore : erhState.erhScore,
        activeTenthsDelta: isErMode ? erState.lastDeltaTenths : erhState.lastDeltaTenths,
        ratingValue: isErMode ? erState.erRating : erhState.erhRating,
        ratingDelta: isErMode ? erState.lastDeltaEr : erhState.lastDeltaErh,
        solvedCount: isErMode ? erState.solvedCount : erhState.solvedCount,
        recordAttempt,
        recordOutcome: recordAttempt,
    };
}

export default useDrillRating;
