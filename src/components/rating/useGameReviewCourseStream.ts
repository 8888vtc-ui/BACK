'use client';

/**
 * Hook de streaming SSE (/api/coach/review) et de synchronisation Supabase
 * des erreurs récurrentes pour GameReviewCourse (< 160 lignes, 0 any).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { CompleteGameAnalysis, EvaluatedTurn } from '../../features/rating/types';
import type { GameReviewCourseData } from '../../features/coach/gameReviewPrompts';
import { upsertRecurringError } from '../../lib/supabase/db';
import { getCurrentUser } from '../../lib/supabase/auth';

export interface UseGameReviewCourseStreamReturn {
    course: GameReviewCourseData | null;
    isLoading: boolean;
    error: string | null;
    generate: () => Promise<void>;
}

export function useGameReviewCourseStream(
    analysis: CompleteGameAnalysis,
    mistakes: EvaluatedTurn[],
    language: 'fr' | 'en',
): UseGameReviewCourseStreamReturn {
    const [course, setCourse] = useState<GameReviewCourseData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Synchronisation parallèle des blunders vers la table Supabase `recurring_errors`
    useEffect(() => {
        if (mistakes.length === 0) return;
        let cancelled = false;
        void (async () => {
            try {
                const user = await getCurrentUser();
                if (!user || cancelled) return;
                const blunderMistakes = mistakes.filter(
                    (m) => m.verdict === 'blunder' || m.verdict === 'howler',
                );
                await Promise.allSettled(
                    blunderMistakes.map((m) => {
                        const concept = m.conceptId || 'positional';
                        return upsertRecurringError(user.id, concept, concept, Math.abs(m.equityLoss));
                    }),
                );
            } catch {
                // Repli silencieux hors-ligne
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [mistakes]);

    const generate = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);
        setCourse(null);

        try {
            const response = await fetch('/api/coach/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
                body: JSON.stringify({ analysis, language }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let accumulated = '';
            let receivedFull = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data:')) continue;
                    const dataStr = trimmed.replace(/^data:\s*/, '');
                    if (dataStr === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.full) {
                            receivedFull = true;
                            setCourse(parsed.full as GameReviewCourseData);
                        } else if (parsed.content) {
                            accumulated += parsed.content;
                        }
                    } catch {
                        // Ligne partielle ignorée
                    }
                }
            }

            if (!receivedFull && accumulated.trim()) {
                try {
                    setCourse(JSON.parse(accumulated.trim()) as GameReviewCourseData);
                } catch {
                    setError(language === 'en' ? 'Could not parse lesson.' : 'Impossible de lire le cours généré.');
                }
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setError(
                    language === 'en'
                        ? 'The lesson could not be generated. Please try again.'
                        : "Le cours n'a pas pu être généré. Réessaie.",
                );
            }
        } finally {
            if (abortRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [analysis, language]);

    useEffect(() => {
        void generate();
        return () => abortRef.current?.abort();
    }, [generate]);

    return { course, isLoading, error, generate };
}
