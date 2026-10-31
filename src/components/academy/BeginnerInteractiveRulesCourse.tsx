'use client';

/**
 * @file src/components/academy/BeginnerInteractiveRulesCourse.tsx
 * @description Parcours Interactif + Vidéo Masterclass Animée « Apprendre à Jouer au Backgammon » (Spécial Débutant).
 * Inclut un lecteur vidéo interactif complet (plateau animé étape par étape + sous-titres cinéma + voix-off Web Speech).
 * Loi de Scalabilité : React.memo, 0 `any`.
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import MiniBoardDiagram from '../board/MiniBoardDiagram';
import {
    BEGINNER_RULES_LESSONS,
    getCompletedBeginnerLessons,
    markBeginnerLessonCompleted,
    type BeginnerLessonQuizOption,
} from '../../features/academy/beginnerRulesCourse';

interface InteractiveBoardMission {
    readonly optimalMove: string;
    readonly highlightedPoints: ReadonlyArray<number>;
    readonly prompt: string;
    readonly successFeedback: string;
    readonly videoScriptBefore: string;
    readonly videoScriptAfter: string;
    readonly delta: Readonly<Record<number, number>>;
}

const LESSON_BOARD_MISSIONS: Readonly<Record<string, InteractiveBoardMission>> = {
    'lesson-1-horseshoe': {
        optimalMove: '8/5 6/5',
        highlightedPoints: [8, 6, 5],
        prompt: '👆 Touchez la Case 5 (ou 8 / 6) sur le plateau pour avancer 2 dames et bâtir votre 1re Porte !',
        successFeedback: '✨ Coup joué sur le plateau (8/5 6/5) ! Vos deux dames se rejoignent sur la Case 5 en avançant vers votre Maison.',
        videoScriptBefore: 'Chapitre 1 sur 5 — Le Sens de Marche : vos 15 dames claires partent de la case 24 et descendent en fer à cheval jusqu’à votre Maison, cases 6 à 1.',
        videoScriptAfter: 'Regardez le plateau : avec le 3 et le 1, la dame de la case 8 et celle de la case 6 rejoignent la case 5 pour former votre première Porte !',
        delta: { 8: -1, 6: -1, 5: 2 },
    },
    'lesson-2-dice-doubles': {
        optimalMove: '24/18 13/7',
        highlightedPoints: [24, 18, 13, 7],
        prompt: '👆 Touchez la Case 18 ou 7 sur le plateau pour jouer votre Double 6 Turbo (4 déplacements de 6 cases) !',
        successFeedback: '🚀 Turbo Double 6 exécuté sur le plateau ! Vos 2 dames du fond (24→18) et 2 dames du milieu (13→7) ont bondi de 24 cases au total.',
        videoScriptBefore: 'Chapitre 2 sur 5 — Les Dés et les Doubles : au Backgammon, tirer deux dés identiques comme Double 6 vous offre quatre déplacements de 6 cases !',
        videoScriptAfter: 'Animation du Double 6 : vos deux dames du fond bondissent de 24 en 18, et deux dames du point 13 avancent en 7. Soit 24 cases d’un seul coup !',
        delta: { 24: -2, 18: 2, 13: -2, 7: 2 },
    },
    'lesson-3-doors-and-hits': {
        optimalMove: '6/3 6/5',
        highlightedPoints: [6, 5, 3, 1],
        prompt: '👆 Touchez la Case 5 (Porte blindée 🛡️) ou la Case 1 (Pion adverse isolé ⚠️) sur le plateau !',
        successFeedback: '🏰 Bien vu sur le plateau ! Vos Portes (2+ dames) forment un bouclier imprenable tandis que le pion adverse isolé est envoyé sur la Barre.',
        videoScriptBefore: 'Chapitre 3 sur 5 — Portes et Frappes : deux dames sur la même flèche créent une Porte infranchissable. Une dame seule est un pion isolé vulnérable.',
        videoScriptAfter: 'Exécution : vous consolidez vos portes en 5 et 3 tandis que le pion adverse isolé est frappé et envoyé en prison sur la Barre centrale !',
        delta: { 6: -2, 5: 1, 3: 1 },
    },
    'lesson-4-bearoff': {
        optimalMove: '6/0 4/0',
        highlightedPoints: [6, 4],
        prompt: '👆 Touchez la Case 6 ou la Case 4 sur le plateau pour sortir 2 dames hors du tablier avec le 6 et le 4 !',
        successFeedback: '🏁 Sortie effectuée sur le plateau ! Vos dames des cases 6 et 4 rejoignent le râtelier de victoire.',
        videoScriptBefore: 'Chapitre 4 sur 5 — La Sortie des Dames : dès que vos 15 dames sont toutes réunies dans votre Maison (cases 1 à 6), vous pouvez les sortir du plateau.',
        videoScriptAfter: 'Avec les dés 6 et 4, vos dames des cases 6 et 4 sortent définitivement hors du tablier : le premier qui sort ses 15 dames gagne !',
        delta: { 6: -1, 4: -1 },
    },
    'lesson-5-cube-and-gammon': {
        optimalMove: '3/0 2/0',
        highlightedPoints: [3, 2],
        prompt: '👆 Touchez la Case 3 ou la Case 2 sur le plateau pour vider votre Maison et décrocher le Gammon (x2) !',
        successFeedback: '💎 Coup gagnant simulé sur le plateau ! Vous sortez vos dames avant que l’adversaire n’en ait sorti une seule : c’est un Gammon (2 pts) !',
        videoScriptBefore: 'Chapitre 5 sur 5 — Le Videau et le Gammon : tournez le dé multiplicateur sur 2 pour doubler les enjeux, ou sortez tout avant l’adversaire pour un Gammon !',
        videoScriptAfter: 'Victoire par Gammon sur le plateau : vos dernières dames des cases 3 et 2 sortent alors que l’adversaire n’en a sorti aucune. Vous marquez double !',
        delta: { 3: -1, 2: -1 },
    },
};

function speakNarration(text: string, enabled: boolean): void {
    if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1.04;
        window.speechSynthesis.speak(utterance);
    } catch {
        // Ignore speech synthesis errors in headless/unsupported browsers
    }
}

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
    }, []);

    const activeLesson = BEGINNER_RULES_LESSONS[activeStepIdx] ?? BEGINNER_RULES_LESSONS[0];
    const mission = LESSON_BOARD_MISSIONS[activeLesson.id] ?? LESSON_BOARD_MISSIONS['lesson-1-horseshoe'];
    const isLessonCompleted = completedIds.includes(activeLesson.id);
    const totalCompleted = completedIds.length;
    const progressPct = Math.round((totalCompleted / BEGINNER_RULES_LESSONS.length) * 100);

    // Moteur d'animation automatique de la Vidéo Masterclass (10 chapitres visuels : Avant -> Après sur les 5 leçons)
    useEffect(() => {
        if (!isVideoPlaying) return;
        const script = isBoardSimulated ? mission.videoScriptAfter : mission.videoScriptBefore;
        speakNarration(script, isVoiceEnabled);

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
                try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
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
        setIsVideoPlaying(false);
        setActiveStepIdx(idx);
        setSelectedOption(null);
        setIsBoardSimulated(false);
        setBoardFeedback(null);
    };

    const handleBoardPointClick = (point: number) => {
        if (mission.highlightedPoints.includes(point)) {
            setIsBoardSimulated(true);
            setBoardFeedback(mission.successFeedback);
            return;
        }
        const count = displayedBoard[point] ?? 0;
        const zone = point <= 6 ? 'votre Maison 🏠' : point >= 19 ? 'la Maison adverse' : 'le parcours';
        const status =
            count >= 2
                ? `Porte protégée (${count} dames à vous 🛡️)`
                : count === 1
                  ? 'Pion isolé à vous (attention, frappable ⚠️)'
                  : count === -1
                    ? 'Pion adverse isolé (cible de frappe 🎯)'
                    : count <= -2
                      ? `Porte adverse (${Math.abs(count)} dames ennemies ⛔)`
                      : 'Case libre';
        setBoardFeedback(`📍 Case ${point} (${zone}) : ${status}. Touchez la case ${mission.highlightedPoints[0]} pour jouer le coup de la leçon !`);
    };

    const handleAnswerQuiz = (option: BeginnerLessonQuizOption) => {
        setSelectedOption(option);
        if (option.isCorrect) {
            setIsBoardSimulated(true);
            setBoardFeedback(mission.successFeedback);
            void markBeginnerLessonCompleted(activeLesson.id).then((updated) => setCompletedIds(updated));
        }
    };

    const handleNextLesson = () => {
        if (activeStepIdx < BEGINNER_RULES_LESSONS.length - 1) {
            setActiveStepIdx((prev) => prev + 1);
            setSelectedOption(null);
            setIsBoardSimulated(false);
            setBoardFeedback(null);
        }
    };

    const videoStepProgressPct = Math.round(((activeStepIdx * 2 + (isBoardSimulated ? 2 : 1)) / (BEGINNER_RULES_LESSONS.length * 2)) * 100);
    const activeVideoSubtitle = isBoardSimulated ? mission.videoScriptAfter : mission.videoScriptBefore;

    return (
        <section
            id="learn-rules"
            aria-labelledby="beginner-rules-heading"
            data-testid="beginner-interactive-rules-course"
            className="rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#1a1308]/95 via-[#0f1626]/95 to-[#080c15]/95 p-5 sm:p-7 shadow-2xl space-y-5"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/60 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                        🌱 Nouveau au Backgammon ? · Vidéo Masterclass &amp; Plateau Interactif
                    </span>
                    <h2 id="beginner-rules-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                        Apprendre les Règles en 5 Étapes Ludiques (Vidéo Animée &amp; Quiz)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Lancez la vidéo explicative complète avec voix-off ou touchez directement le plateau pour jouer chaque coup !
                    </p>
                </div>
                <div data-testid="beginner-course-progress-badge" className="flex flex-col items-end rounded-2xl border border-white/10 bg-black/40 px-4 py-2">
                    <span className="text-xs font-extrabold text-amber-300">
                        🏆 Progression : {totalCompleted}/{BEGINNER_RULES_LESSONS.length} ({progressPct} %)
                    </span>
                    <div className="mt-1.5 h-2 w-36 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-300" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Barre Lecteur Vidéo Masterclass Complète (5 Chapitres Animés + Voix-Off) */}
            <div
                data-testid="beginner-masterclass-video-player"
                className="rounded-2xl border border-[#f3c65f]/50 bg-gradient-to-r from-[#140e05] via-[#0e1525] to-[#140e05] p-3.5 sm:p-4 shadow-[0_0_24px_rgba(243,198,95,0.15)] space-y-2.5"
            >
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleToggleVideo}
                            data-testid="masterclass-play-pause-btn"
                            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider shadow transition ${
                                isVideoPlaying
                                    ? 'border-amber-300 bg-amber-400 text-slate-950'
                                    : 'border-[#f3c65f] bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-[#fef08a] hover:brightness-110'
                            }`}
                        >
                            <span>{isVideoPlaying ? '⏸ Pause Vidéo' : '🎬 Lancer la Vidéo Complète (5 Chapitres)'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsVoiceEnabled((prev) => !prev)}
                            data-testid="masterclass-voice-toggle-btn"
                            className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                isVoiceEnabled
                                    ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-200'
                                    : 'border-white/10 bg-white/5 text-slate-400'
                            }`}
                        >
                            {isVoiceEnabled ? '🔊 Voix-Off ON' : '🔇 Muet'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                        <span>Chapitre {activeStepIdx + 1}/5 · {isBoardSimulated ? 'Coup en cours' : 'Position initiale'}</span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">{videoStepProgressPct}%</span>
                    </div>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
                        style={{ width: `${videoStepProgressPct}%` }}
                    />
                </div>

                <div
                    data-testid="masterclass-video-subtitles"
                    className="rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 text-xs sm:text-sm font-medium text-amber-100 leading-relaxed flex items-center gap-2"
                >
                    <span className="text-amber-400 shrink-0">🎙️</span>
                    <span>{activeVideoSubtitle}</span>
                </div>
            </div>

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
                            <span className="text-xs font-bold truncate">{lesson.icon} Étape {lesson.stepNumber}</span>
                            <span className="ml-1 text-xs font-black">{done ? '✅' : active ? '👉' : '○'}</span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
                <div className="lg:col-span-5 rounded-2xl border border-amber-400/25 bg-[#080c15]/90 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-200">
                        <span>{activeLesson.icon} Plateau Interactif</span>
                        <div className="flex items-center gap-1.5">
                            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                                Dés : {activeLesson.dice[0]}-{activeLesson.dice[1]}
                            </span>
                            <button
                                type="button"
                                data-testid="beginner-board-sim-toggle-btn"
                                onClick={() => {
                                    const next = !isBoardSimulated;
                                    setIsBoardSimulated(next);
                                    setBoardFeedback(next ? mission.successFeedback : null);
                                }}
                                className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-extrabold transition ${
                                    isBoardSimulated
                                        ? 'border-emerald-400/70 bg-emerald-950/80 text-emerald-200'
                                        : 'border-amber-400/60 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30'
                                }`}
                            >
                                {isBoardSimulated ? '⏮ Position avant' : '▶ Jouer sur le plateau'}
                            </button>
                        </div>
                    </div>
                    <MiniBoardDiagram
                        board={displayedBoard}
                        dice={[activeLesson.dice[0], activeLesson.dice[1]]}
                        turn="X"
                        optimalMove={mission.optimalMove}
                        hideOptimalArrow={isBoardSimulated}
                        highlightedPoints={mission.highlightedPoints}
                        onPointClick={handleBoardPointClick}
                    />
                    <div
                        data-testid="beginner-board-interactive-feedback"
                        className={`rounded-xl border px-3 py-2 text-xs leading-relaxed transition ${
                            boardFeedback
                                ? 'border-emerald-400/50 bg-emerald-950/50 text-emerald-100 font-semibold'
                                : 'border-amber-400/30 bg-amber-950/30 text-amber-200'
                        }`}
                    >
                        {boardFeedback ?? mission.prompt}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300 italic">💡 {activeLesson.visualCaption}</p>
                </div>

                <div className="lg:col-span-7 space-y-4">
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
                            {activeLesson.keyRuleBullets.map((bullet, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-amber-400 font-bold">✦</span>
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div data-testid="beginner-lesson-quiz-box" className="rounded-2xl border border-indigo-500/40 bg-indigo-950/25 p-4 space-y-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">🎯 Quiz Express — À vous de jouer !</div>
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
                                    <div className="text-xs sm:text-sm font-black text-emerald-300">{activeLesson.bravoTitle}</div>
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
