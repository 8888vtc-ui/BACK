'use client';

/**
 * Cours explicatif de fin de partie (IA) & Mode "Galaxy Mistake Review" Fluide (< 300 lignes, 0 any).
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import { analyzePlaystyle } from '../../features/coach/playstyleProfiler';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import { useGameReviewCourseStream } from './useGameReviewCourseStream';

export interface GameReviewCourseProps {
    analysis: CompleteGameAnalysis;
    language?: 'fr' | 'en';
}

export function GameReviewCourse({ analysis, language = 'fr' }: GameReviewCourseProps) {
    const [mistakeIdx, setMistakeIdx] = useState<number>(0);
    const [showGrandmasterSolution, setShowGrandmasterSolution] = useState<boolean>(false);

    const mistakes = useMemo(
        () =>
            (analysis.evaluatedMoves ?? []).filter(
                (m) => m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler',
            ),
        [analysis.evaluatedMoves],
    );

    const { course, isLoading, error, generate } = useGameReviewCourseStream(analysis, mistakes, language);
    const activeMistake = mistakes[mistakeIdx] ?? null;

    // Navigation clavier fluide Galaxy Mistake Review (ArrowRight, ArrowLeft, Space)
    useEffect(() => {
        if (mistakes.length === 0) return;
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.tagName === 'BUTTON' ||
                    target.isContentEditable)
            ) {
                return;
            }
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

                    <MiniBoardDiagram
                        board={activeMistake.boardBefore}
                        dice={activeMistake.dice}
                        turn={activeMistake.player}
                        playedMove={activeMistake.playedNotation}
                        optimalMove={activeMistake.optimalNotation}
                        hideOptimalArrow={!showGrandmasterSolution}
                        locale={language}
                    />
                </div>
            )}

            {/* 3 Volets Gemini (Diagnostic / Concept Clé) */}
            {(course.diagnostic || course.keyConcept) && (
                <div data-testid="course-three-pillars" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {course.diagnostic && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-3 text-xs text-rose-100">
                            <p className="font-bold uppercase tracking-wider text-rose-300">
                                🎯 {language === 'en' ? 'The Diagnostic' : 'Le Diagnostic'}
                            </p>
                            <p className="mt-1 leading-relaxed">{course.diagnostic}</p>
                        </div>
                    )}
                    {course.keyConcept && (
                        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-100">
                            <p className="font-bold uppercase tracking-wider text-amber-300">
                                💡 {course.keyConcept.title}
                            </p>
                            <p className="mt-1 leading-relaxed">{course.keyConcept.explanation}</p>
                        </div>
                    )}
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
                <Link
                    href="/drills"
                    data-testid="train-weaknesses-btn"
                    className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:from-amber-300 hover:to-amber-400 transition"
                >
                    🎯 {language === 'en' ? 'Train on my weak points' : "S'entraîner sur mes points faibles"}
                </Link>

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
