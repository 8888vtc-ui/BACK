'use client';

/**
 * @file src/hooks/useDrillRating.ts
 * @description Hook dédié (< 150 lignes, validation Zod stricte aux frontières I/O)
 * gérant de manière 100 % cloisonnée le score ER (dans le Quiz ER `/puzzles`)
 * et le score ERH (dans le Quiz ERH `/drills`).
 *
 * Invariants :
 * - Zéro mélange entre les payloads `ER` (`bg_quiz_er_rating_v1`) et `ERH` (`bg_quiz_erh_rating_v1`).
 * - Évolution temps réel à chaque coup (+ en vert sur coup optimal, - en rouge sur erreur).
 * - Strictement 0 `any`, < 150 lignes.
 */

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import {
    QUIZ_ER_STORAGE_KEY,
    QUIZ_ERH_STORAGE_KEY,
    type QuizErState,
    type QuizErhState,
} from '../features/drills/quizRatingStore';

const QuizErStateSchema = z.object({
    mode: z.literal('ER'),
    erRating: z.number().int().min(400).max(3500),
    lastDeltaEr: z.number().int(),
    solvedCount: z.number().int().min(0),
    updatedAt: z.string(),
});

const QuizErhStateSchema = z.object({
    mode: z.literal('ERH'),
    erhRating: z.number().int().min(400).max(3500),
    lastDeltaErh: z.number().int(),
    solvedCount: z.number().int().min(0),
    updatedAt: z.string(),
});

const FALLBACK_ER: QuizErState = {
    mode: 'ER',
    erRating: 1500,
    lastDeltaEr: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

const FALLBACK_ERH: QuizErhState = {
    mode: 'ERH',
    erhRating: 1500,
    lastDeltaErh: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

function readValidatedErState(): QuizErState {
    if (typeof window === 'undefined' || !window.localStorage) return FALLBACK_ER;
    try {
        const raw = window.localStorage.getItem(QUIZ_ER_STORAGE_KEY);
        if (!raw) return FALLBACK_ER;
        const parsed = QuizErStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : FALLBACK_ER;
    } catch {
        return FALLBACK_ER;
    }
}

function readValidatedErhState(): QuizErhState {
    if (typeof window === 'undefined' || !window.localStorage) return FALLBACK_ERH;
    try {
        const raw = window.localStorage.getItem(QUIZ_ERH_STORAGE_KEY);
        if (!raw) return FALLBACK_ERH;
        const parsed = QuizErhStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : FALLBACK_ERH;
    } catch {
        return FALLBACK_ERH;
    }
}

export interface UseDrillRatingReturn {
    readonly modeLabel: 'ER' | 'ERH';
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
        (isCorrect: boolean, tier: number = 2, equityLoss: number = 0.08) => {
            const safeTier = Math.max(1, Math.min(4, tier));
            const delta = isCorrect
                ? 10 + safeTier * 3
                : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));

            if (isErMode) {
                const current = readValidatedErState();
                const next: QuizErState = {
                    mode: 'ER',
                    erRating: Math.max(800, current.erRating + delta),
                    lastDeltaEr: delta,
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
                    erhRating: Math.max(800, current.erhRating + delta),
                    lastDeltaErh: delta,
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
        ratingValue: isErMode ? erState.erRating : erhState.erhRating,
        ratingDelta: isErMode ? erState.lastDeltaEr : erhState.lastDeltaErh,
        solvedCount: isErMode ? erState.solvedCount : erhState.solvedCount,
        recordAttempt,
        recordOutcome: recordAttempt,
    };
}

export default useDrillRating;
