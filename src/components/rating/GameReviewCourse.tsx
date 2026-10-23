'use client';

/**
 * Cours explicatif de fin de partie (IA) & Mode "Galaxy Mistake Review" Fluide.
 *
 * Rôle :
 *   1. Consomme `POST /api/coach/review` (streaming SSE) pour générer un cours structuré.
 *   2. Intègre le navigateur interactif "Galaxy Mistake Review" avec raccourcis clavier :
 *      - Flèche droite (`ArrowRight`) : Prochaine erreur (Inaccuracy / Doubtful / Blunder / Howler)
 *      - Flèche gauche (`ArrowLeft`) : Erreur précédente
 *      - Espace (` `) : Afficher la solution du Grand Maître et les flèches tactiques
 *   3. Synchronise automatiquement chaque blunder dans la table Supabase `recurring_errors`
 *      et expose le bouton direct « S'entraîner sur mes points faibles ».
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import type { GameReviewCourseData } from '../../features/coach/gameReviewPrompts';
import { analyzePlaystyle } from '../../features/coach/playstyleProfiler';
import { upsertRecurringError } from '../../lib/supabase/db';
import { getCurrentUser } from '../../lib/supabase/auth';

export interface GameReviewCourseProps {
    analysis: CompleteGameAnalysis;
    language?: 'fr' | 'en';
}

export function GameReviewCourse({ analysis, language = 'fr' }: GameReviewCourseProps) {
    const [course, setCourse] = useState<GameReviewCourseData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasRequested, setHasRequested] = useState<boolean>(false);
    const [mistakeIdx, setMistakeIdx] = useState<number>(0);
    const [showGrandmasterSolution, setShowGrandmasterSolution] = useState<boolean>(false);
    const abortRef = useRef<AbortController | null>(null);

    const mistakes = useMemo(
        () =>
            (analysis.evaluatedMoves ?? []).filter(
                (m) => m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler',
            ),
        [analysis.evaluatedMoves],
    );

    const activeMistake = mistakes[mistakeIdx] ?? null;

    // Synchronisation automatique des blunders vers la table Supabase `recurring_errors`
    useEffect(() => {
        if (mistakes.length === 0) return;
        let cancelled = false;
        (async () => {
            try {
                const user = await getCurrentUser();
                if (!user || cancelled) return;
                for (const m of mistakes) {
                    if (m.verdict === 'blunder' || m.verdict === 'howler') {
                        const concept = m.conceptId || 'positional';
                        await upsertRecurringError(
                            user.id,
                            concept,
                            concept,
                            Math.abs(m.equityLoss),
                        );
                    }
                }
            } catch {
                // Repli silencieux hors-ligne
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [mistakes]);

    // Navigation clavier fluide Galaxy Mistake Review (ArrowRight, ArrowLeft, Space)
    useEffect(() => {
        if (mistakes.length === 0) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                setMistakeIdx((prev) => Math.min(mistakes.length - 1, prev + 1));
                setShowGrandmasterSolution(false);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setMistakeIdx((prev) => Math.max(0, prev - 1));
                setShowGrandmasterSolution(false);
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                setShowGrandmasterSolution((prev) => !prev);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [mistakes.length]);

    const generate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCourse(null);

        const controller = new AbortController();
        abortRef.current = controller;

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
                        : 'Le cours n\'a pas pu être généré. Réessaie.',
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [analysis, language]);

    useEffect(() => {
        if (!hasRequested) {
            setHasRequested(true);
            void generate();
        }
        return () => abortRef.current?.abort();
    }, [hasRequested, generate]);

    const playstyle = useMemo(
        () => course?.playstyleProfile ?? analyzePlaystyle(analysis, language),
        [course, analysis, language],
    );

    if (isLoading) {
        return (
            <div data-testid="game-review-course-loading" className="space-y-3 animate-pulse">
                <div className="h-5 w-2/3 rounded bg-slate-700/60" />
                <div className="h-4 w-full rounded bg-slate-700/40" />
                <div className="h-4 w-5/6 rounded bg-slate-700/40" />
            </div>
        );
    }

    if (error && !course) {
        return (
            <div data-testid="game-review-course-error" className="text-center py-6 space-y-3">
                <p className="text-sm text-rose-300">{error}</p>
                <button
                    type="button"
                    onClick={() => void generate()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition"
                >
                    {language === 'en' ? 'Retry' : 'Réessayer'}
                </button>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div data-testid="game-review-course" className="space-y-5 animate-in fade-in">
            <div className="space-y-2">
                <h3 className="text-lg font-black text-amber-300">{course.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{course.summary}</p>
            </div>

            {/* Galaxy Mistake Review Stepper */}
            {activeMistake && (
                <div
                    data-testid="galaxy-mistake-review-box"
                    className="rounded-xl border border-rose-500/40 bg-slate-950/75 p-3.5 space-y-3"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                            ⚡ Galaxy Mistake Review ({mistakeIdx + 1}/{mistakes.length}) — Coup #{activeMistake.moveNumber} [{activeMistake.dice[0]}-{activeMistake.dice[1]}]
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                data-testid="mistake-review-prev-btn"
                                disabled={mistakeIdx === 0}
                                onClick={() => {
                                    setMistakeIdx((p) => Math.max(0, p - 1));
                                    setShowGrandmasterSolution(false);
                                }}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 disabled:opacity-40"
                            >
                                ← Préc.
                            </button>
                            <button
                                type="button"
                                data-testid="mistake-review-solution-btn"
                                onClick={() => setShowGrandmasterSolution((v) => !v)}
                                className="rounded-lg border border-amber-400/60 bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-200"
                            >
                                {showGrandmasterSolution ? 'Masquer solution (Espace)' : 'Solution Grand-Maître (Espace)'}
                            </button>
                            <button
                                type="button"
                                data-testid="mistake-review-next-btn"
                                disabled={mistakeIdx >= mistakes.length - 1}
                                onClick={() => {
                                    setMistakeIdx((p) => Math.min(mistakes.length - 1, p + 1));
                                    setShowGrandmasterSolution(false);
                                }}
                                className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 disabled:opacity-40"
                            >
                                Suiv. →
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-rose-300">
                            Coup joué : <strong>{activeMistake.playedNotation}</strong> ({activeMistake.equityLoss.toFixed(3)} EMG)
                        </span>
                        {showGrandmasterSolution && (
                            <span
                                data-testid="mistake-review-gm-arrows"
                                className="rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 text-emerald-300 font-bold"
                            >
                                🏹 Flèches Grand-Maître : {activeMistake.optimalNotation}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Profil de Style de Jeu Contextuel */}
            <div
                data-testid="coach-playstyle-profile"
                className="rounded-xl border border-amber-500/30 bg-slate-950/60 p-3.5 space-y-2.5"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        {language === 'en' ? 'Playstyle Profile' : 'Profil de Style de Jeu'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-200 border border-amber-500/40">
                        {playstyle.archetypeLabel}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400">{language === 'en' ? 'Aggression' : 'Agressivité'}</div>
                        <div className="text-sm font-black text-rose-300">{playstyle.aggressionIndex}/100</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400">{language === 'en' ? 'Positional' : 'Positionnel'}</div>
                        <div className="text-sm font-black text-emerald-300">{playstyle.positionalSolidness}/100</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400">{language === 'en' ? 'Racing' : 'Course'}</div>
                        <div className="text-sm font-black text-sky-300">{playstyle.racingAccuracy}/100</div>
                    </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-amber-300">{language === 'en' ? 'Diagnostic: ' : 'Diagnostic : '}</span>
                    {playstyle.primaryWeakness}
                </p>
            </div>

            {course.strengths.length > 0 && (
                <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {language === 'en' ? 'Strengths' : 'Points forts'}
                    </h4>
                    <ul className="space-y-1">
                        {course.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                                <span className="text-emerald-400">✓</span>
                                <span>{s}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {course.lessons.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        {language === 'en' ? 'Key lessons' : 'Leçons clés'}
                    </h4>
                    {course.lessons.map((lesson, i) => (
                        <div key={i} className="rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-3">
                            <p className="text-sm font-bold text-indigo-200">{lesson.concept}</p>
                            <p className="text-xs text-slate-300 mt-1">{lesson.advice}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                    href="/drills"
                    data-testid="train-weaknesses-btn"
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:from-amber-300 hover:to-amber-400 transition"
                >
                    🎯 {language === 'en' ? 'Train on my weak points' : "S'entraîner sur mes points faibles"}
                </a>

                <button
                    type="button"
                    onClick={() => void generate()}
                    className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition"
                >
                    {language === 'en' ? 'Regenerate lesson' : 'Régénérer le cours'}
                </button>
            </div>
        </div>
    );
}

export default GameReviewCourse;
