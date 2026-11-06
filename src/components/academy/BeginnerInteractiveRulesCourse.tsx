'use client';

/**
 * @file src/components/academy/BeginnerInteractiveRulesCourse.tsx
 * @description Parcours Interactif + Vidéo Masterclass Animée « Apprendre à Jouer au Backgammon » (< 190 lignes, 0 any, 0 emoji).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Trophy, Check, ChevronRight } from 'lucide-react';
import { BEGINNER_RULES_LESSONS, getCompletedBeginnerLessons, markBeginnerLessonCompleted, type BeginnerLessonQuizOption } from '../../features/academy/beginnerRulesCourse';
import { LESSON_BOARD_MISSIONS, speakNarration, BeginnerMasterclassVideoPlayer } from './BeginnerCourseVideoPlayer';
import { BeginnerRulesBoardSection } from './BeginnerRulesBoardSection';
import { BeginnerRulesQuizSection } from './BeginnerRulesQuizSection';

const BeginnerInteractiveRulesCourseComponent: React.FC = () => {
    const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
    const [completedIds, setCompletedIds] = useState<ReadonlyArray<string>>([]);
    const [selectedOption, setSelectedOption] = useState<BeginnerLessonQuizOption | null>(null);
    const [isBoardSimulated, setIsBoardSimulated] = useState<boolean>(false);
    const [boardFeedback, setBoardFeedback] = useState<string | null>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);

    useEffect(() => {
        setCompletedIds(getCompletedBeginnerLessons());
        return () => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch {}
            }
        };
    }, []);

    const activeLesson = BEGINNER_RULES_LESSONS[activeStepIdx] ?? BEGINNER_RULES_LESSONS[0];
    const mission = LESSON_BOARD_MISSIONS[activeLesson.id] ?? LESSON_BOARD_MISSIONS['lesson-1-horseshoe'];
    const isLessonCompleted = completedIds.includes(activeLesson.id);
    const totalCompleted = completedIds.length;
    const progressPct = Math.round((totalCompleted / BEGINNER_RULES_LESSONS.length) * 100);

    useEffect(() => {
        if (!isVideoPlaying) return;
        speakNarration(isBoardSimulated ? mission.videoScriptAfter : mission.videoScriptBefore, isVoiceEnabled);
        const timer = window.setTimeout(() => {
            if (!isBoardSimulated) {
                setIsBoardSimulated(true);
                setBoardFeedback(mission.successFeedback);
            } else if (activeStepIdx < BEGINNER_RULES_LESSONS.length - 1) {
                setActiveStepIdx((prev) => prev + 1);
                setIsBoardSimulated(false);
                setSelectedOption(null);
                setBoardFeedback(null);
            } else {
                setIsVideoPlaying(false);
            }
        }, 4200);
        return () => window.clearTimeout(timer);
    }, [isVideoPlaying, isBoardSimulated, activeStepIdx, mission, isVoiceEnabled]);

    const handleToggleVideo = useCallback(() => {
        setIsVideoPlaying((prev) => {
            const next = !prev;
            if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch {}
            }
            return next;
        });
    }, []);

    const displayedBoard = React.useMemo(() => {
        const copy = [...activeLesson.board];
        if (!isBoardSimulated) return copy;
        for (const [pt, d] of Object.entries(mission.delta)) {
            const idx = Number(pt);
            if (idx >= 0 && idx <= 25) copy[idx] = (copy[idx] ?? 0) + d;
        }
        return copy;
    }, [activeLesson.board, isBoardSimulated, mission.delta]);

    const handleSelectStep = (idx: number) => {
        setIsVideoPlaying(false); setActiveStepIdx(idx); setSelectedOption(null); setIsBoardSimulated(false); setBoardFeedback(null);
    };

    const handleBoardPointClick = (point: number) => {
        if (mission.highlightedPoints.includes(point)) {
            setIsBoardSimulated(true); setBoardFeedback(mission.successFeedback); return;
        }
        const count = displayedBoard[point] ?? 0;
        const zone = point <= 6 ? 'votre Maison' : point >= 19 ? 'la Maison adverse' : 'le parcours';
        const status = count >= 2 ? `Porte protégée (${count} dames à vous)` : count === 1 ? 'Pion isolé à vous (attention, frappable)' : count === -1 ? 'Pion adverse isolé (cible de frappe)' : count <= -2 ? `Porte adverse (${Math.abs(count)} dames ennemies)` : 'Case libre';
        setBoardFeedback(`Case ${point} (${zone}) : ${status}. Touchez la case ${mission.highlightedPoints[0]} pour jouer le coup de la leçon !`);
    };

    const handleAnswerQuiz = (option: BeginnerLessonQuizOption) => {
        setSelectedOption(option);
        if (option.isCorrect) {
            setIsBoardSimulated(true); setBoardFeedback(mission.successFeedback);
            void markBeginnerLessonCompleted(activeLesson.id).then((updated) => setCompletedIds(updated));
        }
    };

    const handleNextLesson = () => {
        if (activeStepIdx < BEGINNER_RULES_LESSONS.length - 1) {
            setActiveStepIdx((prev) => prev + 1); setSelectedOption(null); setIsBoardSimulated(false); setBoardFeedback(null);
        }
    };

    const videoStepProgressPct = Math.round(((activeStepIdx * 2 + (isBoardSimulated ? 2 : 1)) / (BEGINNER_RULES_LESSONS.length * 2)) * 100);
    const activeVideoSubtitle = isBoardSimulated ? mission.videoScriptAfter : mission.videoScriptBefore;

    return (
        <section id="learn-rules" aria-labelledby="beginner-rules-heading" data-testid="beginner-interactive-rules-course" className="rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#1a1308]/95 via-[#0f1626]/95 to-[#080c15]/95 p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Nouveau au Backgammon ? · Vidéo Masterclass &amp; Plateau Interactif</span>
                    </span>
                    <h2 id="beginner-rules-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                        Apprendre les Règles en 5 Étapes Ludiques (Vidéo Animée &amp; Quiz)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Lancez la vidéo explicative complète avec voix-off ou touchez directement le plateau pour jouer chaque coup !
                    </p>
                </div>
                <div data-testid="beginner-course-progress-badge" className="flex flex-col items-end rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Progression : {totalCompleted}/{BEGINNER_RULES_LESSONS.length} ({progressPct} %)</span>
                    </div>
                    <div className="mt-1.5 h-2 w-36 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            </div>

            <BeginnerMasterclassVideoPlayer
                isVideoPlaying={isVideoPlaying} isVoiceEnabled={isVoiceEnabled} activeStepIdx={activeStepIdx}
                isBoardSimulated={isBoardSimulated} videoStepProgressPct={videoStepProgressPct} activeVideoSubtitle={activeVideoSubtitle}
                onToggleVideo={handleToggleVideo} onToggleVoice={() => setIsVoiceEnabled((prev) => !prev)}
            />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" role="tablist" aria-label="Les 5 leçons débutant">
                {BEGINNER_RULES_LESSONS.map((lesson, idx) => {
                    const done = completedIds.includes(lesson.id);
                    const active = idx === activeStepIdx;
                    return (
                        <button key={lesson.id} type="button" role="tab" aria-selected={active} data-testid={`beginner-lesson-tab-${lesson.stepNumber}`} onClick={() => handleSelectStep(idx)} className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${active ? 'border-[#f3c65f] bg-[#2a1d0b] text-white shadow-md' : done ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200 hover:border-emerald-400' : 'border-white/10 bg-[#080c15] text-slate-300 hover:border-white/25'}`}>
                            <span className="text-xs font-bold truncate">Étape {lesson.stepNumber}</span>
                            <span className="ml-1 text-xs font-black">
                                {done ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : active ? <ChevronRight className="w-3.5 h-3.5 text-amber-400 inline" /> : '○'}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
                <div className="lg:col-span-5">
                    <BeginnerRulesBoardSection
                        activeLesson={activeLesson}
                        mission={mission}
                        displayedBoard={displayedBoard}
                        isBoardSimulated={isBoardSimulated}
                        boardFeedback={boardFeedback}
                        onToggleSimulation={() => {
                            const next = !isBoardSimulated;
                            setIsBoardSimulated(next);
                            setBoardFeedback(next ? mission.successFeedback : null);
                        }}
                        onPointClick={handleBoardPointClick}
                    />
                </div>

                <div className="lg:col-span-7">
                    <BeginnerRulesQuizSection
                        activeLesson={activeLesson}
                        isLessonCompleted={isLessonCompleted}
                        selectedOption={selectedOption}
                        activeStepIdx={activeStepIdx}
                        totalSteps={BEGINNER_RULES_LESSONS.length}
                        onAnswerQuiz={handleAnswerQuiz}
                        onNextLesson={handleNextLesson}
                    />
                </div>
            </div>
        </section>
    );
};

export const BeginnerInteractiveRulesCourse = React.memo(BeginnerInteractiveRulesCourseComponent);
export default BeginnerInteractiveRulesCourse;
