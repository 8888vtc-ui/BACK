'use client';

/**
 * @file src/hooks/useDrillRating.ts
 * @description Hook dédié (< 130 lignes, validation Zod stricte aux frontières I/O)
 * gérant exclusivement nos 2 indicateurs officiels :
 * 1. `ER / PR` (`0.0` à `30.0`, initialisé à `6.3`, évolution par dixièmes `-0.1`/`-0.2` ou `+0.1` à `+0.5`)
 * 2. `Rating` compétitif (Elo / Glicko-2 autour de `1500`)
 * Loi 1 : Si `!isAuthenticated` (Joueur Invité), retourne `null` et n'écrit RIEN dans `localStorage`.
 * Strictement 0 `any`, < 160 lignes.
 */

import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import {
    QUIZ_ER_STORAGE_KEY,
    DEFAULT_ER_STATE,
    type QuizErState,
} from '../features/drills/quizRatingStore';
import { computeTenthsMetricDelta } from '../features/drills/drillSubAgentsPipeline';
import { checkIsPlayerRegistered, STATS_UPDATED_EVENT } from './useAuthenticPlayerStats';

const QuizErStateSchema = z.object({
    mode: z.literal('ER'),
    erPrScore: z.number().min(0).max(30).default(6.3),
    lastDeltaTenths: z.number().default(0),
    erRating: z.number().int().min(400).max(3500),
    lastDeltaEr: z.number().int(),
    solvedCount: z.number().int().min(0),
    updatedAt: z.string(),
});

export function readValidatedErState(): QuizErState | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (!checkIsPlayerRegistered()) return null;
    try {
        const raw = window.localStorage.getItem(QUIZ_ER_STORAGE_KEY);
        if (!raw) return DEFAULT_ER_STATE;
        const parsed = QuizErStateSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : DEFAULT_ER_STATE;
    } catch {
        return DEFAULT_ER_STATE;
    }
}

export interface UseDrillRatingReturn {
    readonly modeLabel: 'ER';
    readonly erPrScore: number | null;
    readonly erPrDelta: number;
    readonly activeMetricScore: number | null;
    readonly activeTenthsDelta: number;
    readonly ratingValue: number | null;
    readonly ratingDelta: number;
    readonly solvedCount: number;
    readonly recordAttempt: (isCorrect: boolean, tier?: number, equityLoss?: number, explicitTenthsDelta?: number) => void;
    readonly recordOutcome: (isCorrect: boolean, tier?: number, equityLoss?: number, explicitTenthsDelta?: number) => void;
}

export function useDrillRating(_isErMode?: boolean): UseDrillRatingReturn {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkIsPlayerRegistered());
    const [erState, setErState] = useState<QuizErState | null>(() => readValidatedErState());

    useEffect(() => {
        const sync = () => {
            const auth = checkIsPlayerRegistered();
            setIsAuthenticated(auth);
            setErState(readValidatedErState());
        };
        sync();
        window.addEventListener('storage', sync);
        window.addEventListener(STATS_UPDATED_EVENT, sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener(STATS_UPDATED_EVENT, sync);
        };
    }, []);

    const recordAttempt = useCallback(
        (isCorrect: boolean, tier: number = 2, equityLoss: number = 0.084, explicitTenthsDelta?: number) => {
            if (!checkIsPlayerRegistered()) return;
            const safeTier = Math.max(1, Math.min(4, tier));
            const tenthsDelta =
                typeof explicitTenthsDelta === 'number'
                    ? explicitTenthsDelta
                    : computeTenthsMetricDelta(isCorrect, equityLoss);
            const eloDelta =
                tenthsDelta === 0
                    ? 4
                    : isCorrect
                        ? 10 + safeTier * 3
                        : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));

            const current = readValidatedErState() ?? DEFAULT_ER_STATE;
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
                try {
                    window.localStorage.setItem(QUIZ_ER_STORAGE_KEY, JSON.stringify(next));
                } catch {
                    /* ignore */
                }
            }
            setErState(next);
        },
        [],
    );

    return {
        modeLabel: 'ER',
        erPrScore: isAuthenticated && erState ? erState.erPrScore : null,
        erPrDelta: isAuthenticated && erState ? erState.lastDeltaTenths : 0,
        activeMetricScore: isAuthenticated && erState ? erState.erPrScore : null,
        activeTenthsDelta: isAuthenticated && erState ? erState.lastDeltaTenths : 0,
        ratingValue: isAuthenticated && erState ? erState.erRating : null,
        ratingDelta: isAuthenticated && erState ? erState.lastDeltaEr : 0,
        solvedCount: isAuthenticated && erState ? erState.solvedCount : 0,
        recordAttempt,
        recordOutcome: recordAttempt,
    };
}

export default useDrillRating;
