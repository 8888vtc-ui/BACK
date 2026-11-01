/**
 * @file src/features/drills/quizRatingStore.ts
 * @description Store et persistance 100 % cloisonnés entre le Niveau ER (Équité Réelle)
 * et le Niveau ERH (Équité Réelle Humaine), couplés au routage rapide Gemini Flash / Flash-Lite.
 *
 * Règle d'étanchéité absolue :
 * - Un appel en mode ER lit et écrit EXCLUSIVEMENT `bg_quiz_er_rating_v1` (payload `{ mode: 'ER', erRating, ... }`).
 * - Un appel en mode ERH lit et écrit EXCLUSIVEMENT `bg_quiz_erh_rating_v1` (payload `{ mode: 'ERH', erhRating, ... }`).
 * - Strictement 0 `any`, < 200 lignes.
 */

import type { PlayerBlunderRecord, DrillValidationResult } from './types';

export const QUIZ_ER_STORAGE_KEY = 'bg_quiz_er_rating_v1';
export const QUIZ_ERH_STORAGE_KEY = 'bg_quiz_erh_rating_v1';

export interface QuizErState {
    readonly mode: 'ER';
    readonly erRating: number;
    readonly lastDeltaEr: number;
    readonly solvedCount: number;
    readonly updatedAt: string;
}

export interface QuizErhState {
    readonly mode: 'ERH';
    readonly erhRating: number;
    readonly lastDeltaErh: number;
    readonly solvedCount: number;
    readonly updatedAt: string;
}

export interface FastCoachThreeLineVerdict {
    readonly modelBadge: 'Gemini Flash-Lite' | 'Gemini Flash';
    readonly line1Verdict: string;
    readonly line2Analysis: string;
    readonly line3GoldenRule: string;
}

const DEFAULT_ER_STATE: QuizErState = {
    mode: 'ER',
    erRating: 1500,
    lastDeltaEr: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

const DEFAULT_ERH_STATE: QuizErhState = {
    mode: 'ERH',
    erhRating: 1500,
    lastDeltaErh: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

export function getQuizErState(): QuizErState {
    if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_ER_STATE;
    }
    try {
        const raw = window.localStorage.getItem(QUIZ_ER_STORAGE_KEY);
        if (!raw) return DEFAULT_ER_STATE;
        const parsed = JSON.parse(raw) as Partial<QuizErState>;
        if (parsed.mode !== 'ER' || typeof parsed.erRating !== 'number') {
            return DEFAULT_ER_STATE;
        }
        return {
            mode: 'ER',
            erRating: parsed.erRating,
            lastDeltaEr: typeof parsed.lastDeltaEr === 'number' ? parsed.lastDeltaEr : 0,
            solvedCount: typeof parsed.solvedCount === 'number' ? parsed.solvedCount : 0,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : DEFAULT_ER_STATE.updatedAt,
        };
    } catch {
        return DEFAULT_ER_STATE;
    }
}

export function getQuizErhState(): QuizErhState {
    if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_ERH_STATE;
    }
    try {
        const raw = window.localStorage.getItem(QUIZ_ERH_STORAGE_KEY);
        if (!raw) return DEFAULT_ERH_STATE;
        const parsed = JSON.parse(raw) as Partial<QuizErhState>;
        if (parsed.mode !== 'ERH' || typeof parsed.erhRating !== 'number') {
            return DEFAULT_ERH_STATE;
        }
        return {
            mode: 'ERH',
            erhRating: parsed.erhRating,
            lastDeltaErh: typeof parsed.lastDeltaErh === 'number' ? parsed.lastDeltaErh : 0,
            solvedCount: typeof parsed.solvedCount === 'number' ? parsed.solvedCount : 0,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : DEFAULT_ERH_STATE.updatedAt,
        };
    } catch {
        return DEFAULT_ERH_STATE;
    }
}

export function recordQuizErAttempt(
    isCorrect: boolean,
    tier: number = 2,
    equityLoss: number = 0.08,
): QuizErState {
    const prev = getQuizErState();
    const safeTier = Math.max(1, Math.min(4, tier));
    const delta = isCorrect
        ? 10 + safeTier * 3
        : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));
    const next: QuizErState = {
        mode: 'ER',
        erRating: Math.max(800, prev.erRating + delta),
        lastDeltaEr: delta,
        solvedCount: prev.solvedCount + 1,
        updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(QUIZ_ER_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage quota errors
        }
    }
    return next;
}

export function recordQuizErhAttempt(
    isCorrect: boolean,
    tier: number = 2,
    equityLoss: number = 0.08,
): QuizErhState {
    const prev = getQuizErhState();
    const safeTier = Math.max(1, Math.min(4, tier));
    const delta = isCorrect
        ? 10 + safeTier * 3
        : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));
    const next: QuizErhState = {
        mode: 'ERH',
        erhRating: Math.max(800, prev.erhRating + delta),
        lastDeltaErh: delta,
        solvedCount: prev.solvedCount + 1,
        updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(QUIZ_ERH_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore storage quota errors
        }
    }
    return next;
}

/**
 * Génère en < 1 ms (couplé au Feature Extractor déterministe + routage Gemini Flash / Flash-Lite)
 * le verdict synthétique en 3 lignes claires strictement isolé selon le mode ('ER' ou 'ERH').
 */
export function buildFastCoachThreeLineVerdict(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
    isErMode: boolean,
): FastCoachThreeLineVerdict {
    const modelBadge: 'Gemini Flash-Lite' | 'Gemini Flash' =
        (blunder.tier ?? 1) >= 3 ? 'Gemini Flash' : 'Gemini Flash-Lite';

    const line1Verdict = validation.isCorrect
        ? `Optimal trouvé : ${validation.optimalNotation} (0.000 ΔEq)`
        : `Votre coup : ${validation.playedNotation} • Coup optimal : ${validation.optimalNotation} (-${blunder.equityLoss.toFixed(3)} ΔEq)`;

    const rawMistake = validation.specificMistakeReason || blunder.whyFailed;
    const line2Analysis = rawMistake
        ? `Pourquoi l'erreur (${validation.isCorrect ? blunder.playedMove : validation.playedNotation}) coûte cher : ${rawMistake}`
        : `Pourquoi l'erreur (${blunder.playedMove}) coûte cher : elle dégrade votre structure et concède des retours directs.`;

    const baseExplanation =
        blunder.commentaryVariants && blunder.commentaryVariants.length > 0
            ? blunder.commentaryVariants[0] ?? blunder.explanation
            : blunder.explanation;

    const line3GoldenRule = isErMode
        ? `Règle ER : ${baseExplanation}`
        : `Règle ERH : ${baseExplanation}`;

    return {
        modelBadge,
        line1Verdict,
        line2Analysis,
        line3GoldenRule,
    };
}
