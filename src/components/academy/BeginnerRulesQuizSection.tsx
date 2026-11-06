'use client';

/**
 * @file src/components/academy/BeginnerRulesQuizSection.tsx
 * @description Section Règles & Quiz Interactif pour le parcours Débutant (< 180 lignes, 0 any, 0 emoji).
 */

import React from 'react';
import Link from 'next/link';
import { Target, CheckCircle2, ChevronRight, Dices } from 'lucide-react';
import type { BeginnerRuleLesson, BeginnerLessonQuizOption } from '../../features/academy/beginnerRulesCourse';

export interface BeginnerRulesQuizSectionProps {
    readonly activeLesson: BeginnerRuleLesson;
    readonly isLessonCompleted: boolean;
    readonly selectedOption: BeginnerLessonQuizOption | null;
    readonly activeStepIdx: number;
    readonly totalSteps: number;
    readonly onAnswerQuiz: (option: BeginnerLessonQuizOption) => void;
    readonly onNextLesson: () => void;
}

export const BeginnerRulesQuizSection: React.FC<BeginnerRulesQuizSectionProps> = React.memo(({
    activeLesson,
    isLessonCompleted,
    selectedOption,
    activeStepIdx,
    totalSteps,
    onAnswerQuiz,
    onNextLesson,
}) => {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 data-testid="beginner-active-lesson-title" className="font-serif text-base sm:text-lg font-black text-white">
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
                    {activeLesson.keyRuleBullets.map((bullet: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">✦</span>
                            <span>{bullet}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div data-testid="beginner-lesson-quiz-box" className="rounded-2xl border border-indigo-500/40 bg-indigo-950/25 p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-300">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Quiz Express — À vous de jouer !</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-white">{activeLesson.quizQuestion}</p>
                <div className="space-y-2">
                    {activeLesson.quizOptions.map((opt: BeginnerLessonQuizOption) => {
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
                                onClick={() => onAnswerQuiz(opt)}
                                className={`w-full rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition ${stateCls}`}
                            >
                                <span className="mr-2 font-black uppercase text-amber-300">{opt.id}.</span>
                                <span>{opt.text}</span>
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
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-300">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{activeLesson.bravoTitle}</span>
                            </div>
                        )}
                        <p className="text-xs sm:text-sm leading-relaxed">{selectedOption.feedbackText}</p>
                        {selectedOption.isCorrect && activeStepIdx < totalSteps - 1 && (
                            <button
                                type="button"
                                data-testid="beginner-next-lesson-btn"
                                onClick={onNextLesson}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-400 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow hover:brightness-105 transition"
                            >
                                <span>Leçon suivante ({activeLesson.stepNumber + 1}/{totalSteps})</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {selectedOption.isCorrect && activeStepIdx === totalSteps - 1 && (
                            <Link
                                href="/"
                                data-testid="beginner-launch-first-match-link"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow"
                            >
                                <Dices className="w-3.5 h-3.5 text-[#1c1004]" />
                                <span>Lancer ma 1re partie accompagnée !</span>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

BeginnerRulesQuizSection.displayName = 'BeginnerRulesQuizSection';

