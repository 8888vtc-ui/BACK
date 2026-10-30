'use client';

/**
 * @file src/components/academy/BeginnerInteractiveRulesCourse.tsx
 * @description Parcours Interactif « Apprendre à Jouer au Backgammon en 5 Minutes » (Spécial Débutant).
 *
 * Combine :
 *   - 5 leçons visuelles avec diagramme vectoriel temps réel (`MiniBoardDiagram`)
 *   - Quiz interactif de mise en pratique immédiate à chaque étape
 *   - Célébration « 🎉 Bravo ! » + déblocage de badges + synchronisation Supabase / localStorage
 *
 * Loi de Scalabilité : React.memo, < 250 lignes, 0 `any`.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import {
    BEGINNER_RULES_LESSONS,
    getCompletedBeginnerLessons,
    markBeginnerLessonCompleted,
    type BeginnerLessonQuizOption,
} from '../../features/academy/beginnerRulesCourse';

const BeginnerInteractiveRulesCourseComponent: React.FC = () => {
    const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
    const [completedIds, setCompletedIds] = useState<ReadonlyArray<string>>([]);
    const [selectedOption, setSelectedOption] = useState<BeginnerLessonQuizOption | null>(null);

    useEffect(() => {
        setCompletedIds(getCompletedBeginnerLessons());
    }, []);

    const activeLesson = BEGINNER_RULES_LESSONS[activeStepIdx] ?? BEGINNER_RULES_LESSONS[0];
    const isLessonCompleted = completedIds.includes(activeLesson.id);
    const totalCompleted = completedIds.length;
    const progressPct = Math.round((totalCompleted / BEGINNER_RULES_LESSONS.length) * 100);

    const handleSelectStep = (idx: number) => {
        setActiveStepIdx(idx);
        setSelectedOption(null);
    };

    const handleAnswerQuiz = (option: BeginnerLessonQuizOption) => {
        setSelectedOption(option);
        if (option.isCorrect) {
            void markBeginnerLessonCompleted(activeLesson.id).then((updated) => {
                setCompletedIds(updated);
            });
        }
    };

    const handleNextLesson = () => {
        if (activeStepIdx < BEGINNER_RULES_LESSONS.length - 1) {
            setActiveStepIdx((prev) => prev + 1);
            setSelectedOption(null);
        }
    };

    return (
        <section
            id="learn-rules"
            aria-labelledby="beginner-rules-heading"
            data-testid="beginner-interactive-rules-course"
            className="rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#1a1308]/95 via-[#0f1626]/95 to-[#080c15]/95 p-5 sm:p-7 shadow-2xl space-y-5"
        >
            {/* En-tête & Barre de progression gamifiée */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                        🌱 Nouveau au Backgammon ? · Parcours Débutant Interactif
                    </span>
                    <h2 id="beginner-rules-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                        Apprendre les Règles en 5 Étapes Ludiques (Diagrammes &amp; Quiz)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Aucune connaissance requise : observez le plateau, répondez au mini-quiz et débloquez vos badges avec le Coach !
                    </p>
                </div>

                <div
                    data-testid="beginner-course-progress-badge"
                    className="flex flex-col items-end rounded-2xl border border-white/10 bg-black/40 px-4 py-2"
                >
                    <span className="text-xs font-extrabold text-amber-300">
                        🏆 Progression : {totalCompleted}/{BEGINNER_RULES_LESSONS.length} ({progressPct} %)
                    </span>
                    <div className="mt-1.5 h-2 w-36 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Sélecteur des 5 étapes */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Les 5 leçons débutant">
                {BEGINNER_RULES_LESSONS.map((lesson, idx) => {
                    const done = completedIds.includes(lesson.id);
                    const active = idx === activeStepIdx;
                    return (
                        <button
                            key={lesson.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            data-testid={`beginner-lesson-tab-${lesson.stepNumber}`}
                            onClick={() => handleSelectStep(idx)}
                            className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
                                active
                                    ? 'border-[#f3c65f] bg-[#2a1d0b] text-white shadow-md'
                                    : done
                                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200 hover:border-emerald-400'
                                      : 'border-white/10 bg-[#080c15] text-slate-300 hover:border-white/25'
                            }`}
                        >
                            <span className="text-xs font-bold truncate">
                                {lesson.icon} Étape {lesson.stepNumber}
                            </span>
                            <span className="ml-1 text-xs font-black">
                                {done ? '✅' : active ? '👉' : '○'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Grille principale : Diagramme visuel à gauche + Règles & Quiz interactif à droite */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#080c15]/90 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                        <span>{activeLesson.icon} Démonstration Visuelle</span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                            Dés : {activeLesson.dice[0]}-{activeLesson.dice[1]}
                        </span>
                    </div>
                    <MiniBoardDiagram
                        board={[...activeLesson.board]}
                        dice={[activeLesson.dice[0], activeLesson.dice[1]]}
                        turn="X"
                    />
                    <p className="text-xs leading-relaxed text-slate-300 italic">
                        💡 {activeLesson.visualCaption}
                    </p>
                </div>

                <div className="lg:col-span-7 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3
                                data-testid="beginner-active-lesson-title"
                                className="font-serif text-base sm:text-lg font-black text-white"
                            >
                                {activeLesson.title}
                            </h3>
                            {isLessonCompleted && (
                                <span className="rounded-full border border-emerald-400/50 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                                    {activeLesson.bravoRewardBadge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-amber-200">{activeLesson.subtitle}</p>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200">
                            {activeLesson.keyRuleBullets.map((bullet, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-400 font-bold">✦</span>
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quiz Interactif façon Chess.com / Duolingo */}
                    <div
                        data-testid="beginner-lesson-quiz-box"
                        className="rounded-2xl border border-indigo-500/40 bg-indigo-950/25 p-4 space-y-3"
                    >
                        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                            🎯 Quiz Express — À vous de jouer !
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-white">{activeLesson.quizQuestion}</p>

                        <div className="space-y-2">
                            {activeLesson.quizOptions.map((opt) => {
                                const isChosen = selectedOption?.id === opt.id;
                                const stateCls = isChosen
                                    ? opt.isCorrect
                                        ? 'border-emerald-400 bg-emerald-950/70 text-emerald-100'
                                        : 'border-rose-400 bg-rose-950/60 text-rose-100'
                                    : 'border-white/10 bg-slate-900/80 text-slate-200 hover:border-amber-400/60';
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        data-testid={`beginner-quiz-option-${opt.id}`}
                                        onClick={() => handleAnswerQuiz(opt)}
                                        className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition ${stateCls}`}
                                    >
                                        <span className="mr-2 font-black uppercase text-amber-300">{opt.id}.</span>
                                        {opt.text}
                                    </button>
                                );
                            })}
                        </div>

                        {selectedOption && (
                            <div
                                data-testid="beginner-quiz-feedback"
                                className={`rounded-xl border p-3 space-y-2 ${
                                    selectedOption.isCorrect
                                        ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-100'
                                        : 'border-amber-400/50 bg-amber-950/50 text-amber-100'
                                }`}
                            >
                                {selectedOption.isCorrect && (
                                    <div className="text-xs sm:text-sm font-black text-emerald-300">
                                        {activeLesson.bravoTitle}
                                    </div>
                                )}
                                <p className="text-xs sm:text-sm leading-relaxed">{selectedOption.feedbackText}</p>
                                {selectedOption.isCorrect && activeStepIdx < BEGINNER_RULES_LESSONS.length - 1 && (
                                    <button
                                        type="button"
                                        data-testid="beginner-next-lesson-btn"
                                        onClick={handleNextLesson}
                                        className="rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow hover:brightness-105 transition"
                                    >
                                        Leçon suivante ({activeLesson.stepNumber + 1}/5) →
                                    </button>
                                )}
                                {selectedOption.isCorrect && activeStepIdx === BEGINNER_RULES_LESSONS.length - 1 && (
                                    <Link
                                        href="/"
                                        data-testid="beginner-launch-first-match-link"
                                        className="inline-block rounded-xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow"
                                    >
                                        🎲 Lancer ma 1re partie accompagnée !
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export const BeginnerInteractiveRulesCourse = React.memo(BeginnerInteractiveRulesCourseComponent);
export default BeginnerInteractiveRulesCourse;
