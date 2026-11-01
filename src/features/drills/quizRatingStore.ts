/**
 * @file src/features/drills/quizRatingStore.ts
 * @description Store et persistance 100 % cloisonnés entre `ER / PR` (`0.0` à `30.0`, initialisé à `6.3`),
 * `ERH` (`0.0` à `30.0`, initialisé à `6.1`) et le `Rating` compétitif (`1500`).
 *
 * Règle métier fondamentale :
 * - En Backgammon, plus `ER / PR` ou `ERH` est BAS, meilleur est le joueur (`0.0` = Perfection, `30.0` = Novice).
 * - Coup Optimal (`0.000 EMG`) : `ER / PR` (ou `ERH`) BAISSE par dixièmes (`-0.1` ou `-0.2`, ex: `6.3` ➔ `6.2`).
 * - Erreur / Blunder (`-0.084 EMG`) : `ER / PR` (ou `ERH`) MONTE par dixièmes (`+0.2` à `+0.5`, ex: `6.3` ➔ `6.7`).
 * - Strictement 0 `any`, < 190 lignes.
 */

import type { PlayerBlunderRecord, DrillValidationResult } from './types';
import { computeTenthsMetricDelta } from './drillSubAgentsPipeline';

export const QUIZ_ER_STORAGE_KEY = 'bg_quiz_er_rating_v1';
export const QUIZ_ERH_STORAGE_KEY = 'bg_quiz_erh_rating_v1';

export interface QuizErState {
    readonly mode: 'ER';
    readonly erPrScore: number;       // Échelle 0.0 à 30.0 (initialisé à 6.3)
    readonly lastDeltaTenths: number; // -0.1 / -0.2 (progression) ou +0.3 / +0.4 / +0.5 (erreur)
    readonly erRating: number;        // Rating compétitif 1500
    readonly lastDeltaEr: number;     // Delta Elo
    readonly solvedCount: number;
    readonly updatedAt: string;
}

export interface QuizErhState {
    readonly mode: 'ERH';
    readonly erhScore: number;        // Échelle 0.0 à 30.0 (initialisé à 6.1)
    readonly lastDeltaTenths: number; // -0.1 / -0.2 (progression) ou +0.3 / +0.4 / +0.5 (erreur)
    readonly erhRating: number;       // Rating compétitif 1500
    readonly lastDeltaErh: number;    // Delta Elo
    readonly solvedCount: number;
    readonly updatedAt: string;
}

export interface FastCoachThreeLineVerdict {
    readonly modelBadge: 'Gemini Flash-Lite' | 'Gemini Flash';
    readonly line1Verdict: string;
    readonly line2Analysis: string;
    readonly line3GoldenRule: string;
}

export const DEFAULT_ER_STATE: QuizErState = {
    mode: 'ER',
    erPrScore: 6.3,
    lastDeltaTenths: 0,
    erRating: 1500,
    lastDeltaEr: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

export const DEFAULT_ERH_STATE: QuizErhState = {
    mode: 'ERH',
    erhScore: 6.1,
    lastDeltaTenths: 0,
    erhRating: 1500,
    lastDeltaErh: 0,
    solvedCount: 0,
    updatedAt: '2026-11-01T00:00:00.000Z',
};

export function getQuizErState(): QuizErState {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ER_STATE;
    try {
        const raw = window.localStorage.getItem(QUIZ_ER_STORAGE_KEY);
        if (!raw) return DEFAULT_ER_STATE;
        const parsed = JSON.parse(raw) as Partial<QuizErState>;
        if (parsed.mode !== 'ER') return DEFAULT_ER_STATE;
        return {
            mode: 'ER',
            erPrScore: typeof parsed.erPrScore === 'number' && parsed.erPrScore >= 0 && parsed.erPrScore <= 30 ? parsed.erPrScore : 6.3,
            lastDeltaTenths: typeof parsed.lastDeltaTenths === 'number' ? parsed.lastDeltaTenths : 0,
            erRating: typeof parsed.erRating === 'number' ? parsed.erRating : 1500,
            lastDeltaEr: typeof parsed.lastDeltaEr === 'number' ? parsed.lastDeltaEr : 0,
            solvedCount: typeof parsed.solvedCount === 'number' ? parsed.solvedCount : 0,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : DEFAULT_ER_STATE.updatedAt,
        };
    } catch {
        return DEFAULT_ER_STATE;
    }
}

export function getQuizErhState(): QuizErhState {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_ERH_STATE;
    try {
        const raw = window.localStorage.getItem(QUIZ_ERH_STORAGE_KEY);
        if (!raw) return DEFAULT_ERH_STATE;
        const parsed = JSON.parse(raw) as Partial<QuizErhState>;
        if (parsed.mode !== 'ERH') return DEFAULT_ERH_STATE;
        return {
            mode: 'ERH',
            erhScore: typeof parsed.erhScore === 'number' && parsed.erhScore >= 0 && parsed.erhScore <= 30 ? parsed.erhScore : 6.1,
            lastDeltaTenths: typeof parsed.lastDeltaTenths === 'number' ? parsed.lastDeltaTenths : 0,
            erhRating: typeof parsed.erhRating === 'number' ? parsed.erhRating : 1500,
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
    equityLoss: number = 0.084,
): QuizErState {
    const prev = getQuizErState();
    const safeTier = Math.max(1, Math.min(4, tier));
    const tenthsDelta = computeTenthsMetricDelta(isCorrect, equityLoss);
    const nextScore = Math.max(0, Math.min(30, Number((prev.erPrScore + tenthsDelta).toFixed(1))));
    const eloDelta = isCorrect ? 10 + safeTier * 3 : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));
    const next: QuizErState = {
        mode: 'ER',
        erPrScore: nextScore,
        lastDeltaTenths: tenthsDelta,
        erRating: Math.max(800, prev.erRating + eloDelta),
        lastDeltaEr: eloDelta,
        solvedCount: prev.solvedCount + 1,
        updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.setItem(QUIZ_ER_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
    return next;
}

export function recordQuizErhAttempt(
    isCorrect: boolean,
    tier: number = 2,
    equityLoss: number = 0.084,
): QuizErhState {
    const prev = getQuizErhState();
    const safeTier = Math.max(1, Math.min(4, tier));
    const tenthsDelta = computeTenthsMetricDelta(isCorrect, equityLoss);
    const nextScore = Math.max(0, Math.min(30, Number((prev.erhScore + tenthsDelta).toFixed(1))));
    const eloDelta = isCorrect ? 10 + safeTier * 3 : -Math.max(8, Math.min(22, Math.round(8 + Math.abs(equityLoss) * 45)));
    const next: QuizErhState = {
        mode: 'ERH',
        erhScore: nextScore,
        lastDeltaTenths: tenthsDelta,
        erhRating: Math.max(800, prev.erhRating + eloDelta),
        lastDeltaErh: eloDelta,
        solvedCount: prev.solvedCount + 1,
        updatedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
        try { window.localStorage.setItem(QUIZ_ERH_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
    return next;
}

export function buildFastCoachThreeLineVerdict(
    blunder: PlayerBlunderRecord,
    validation: DrillValidationResult,
    isErMode: boolean,
): FastCoachThreeLineVerdict {
    const modelBadge: 'Gemini Flash-Lite' | 'Gemini Flash' = (blunder.tier ?? 1) >= 3 ? 'Gemini Flash' : 'Gemini Flash-Lite';
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
    return {
        modelBadge,
        line1Verdict,
        line2Analysis,
        line3GoldenRule: isErMode ? `Règle ER : ${baseExplanation}` : `Règle ERH : ${baseExplanation}`,
    };
}
