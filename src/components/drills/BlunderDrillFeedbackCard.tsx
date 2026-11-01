'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import { buildErhOpponentScenario } from '../../features/drills/adaptiveQuizEngine';
import { useCoachVoice } from '../../hooks/useCoachVoice';

export interface BlunderDrillFeedbackCardProps {
    currentBlunder: PlayerBlunderRecord;
    currentIndex: number;
    totalBlunders: number;
    showHint: boolean;
    onToggleHint: () => void;
    onResetAttempt: () => void;
    validationResult: DrillValidationResult | null;
    onNextBlunder: () => void;
    onSelectQuizChoice?: (notation: string) => void;
    onValidateAttempt?: () => void;
    canValidateAttempt?: boolean;
    stagedNotation?: string | null;
    drillMode?: 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';
}

const TIER_LABELS: Record<number, { badge: string; color: string }> = {
    1: { badge: '🌱 Palier 1 · Débutant', color: 'border-emerald-500/40 bg-emerald-950/70 text-emerald-200' },
    2: { badge: '⚔️ Palier 2 · Intermédiaire', color: 'border-amber-500/40 bg-amber-950/70 text-amber-200' },
    3: { badge: '🏆 Palier 3 · Club', color: 'border-sky-500/40 bg-sky-950/70 text-sky-200' },
    4: { badge: '👑 Palier 4 · Grand-Maître', color: 'border-purple-500/40 bg-purple-950/70 text-purple-200' },
};

export const BlunderDrillFeedbackCard: React.FC<BlunderDrillFeedbackCardProps> = ({
    currentBlunder,
    currentIndex,
    totalBlunders,
    showHint,
    onToggleHint,
    onResetAttempt,
    validationResult,
    onNextBlunder,
    onSelectQuizChoice,
    onValidateAttempt,
    canValidateAttempt = false,
    stagedNotation = null,
    drillMode = 'adaptive',
}) => {
    const [variantIdx, setVariantIdx] = useState<number>(0);
    const { isSpeaking, speak, stop } = useCoachVoice();

    useEffect(() => {
        setVariantIdx(0);
        stop();
    }, [currentBlunder.id, stop]);

    const tierInfo = TIER_LABELS[currentBlunder.tier ?? 1] ?? TIER_LABELS[1];
    const erhScenario = useMemo(() => buildErhOpponentScenario(currentBlunder), [currentBlunder]);
    const variants = currentBlunder.commentaryVariants && currentBlunder.commentaryVariants.length > 0
        ? currentBlunder.commentaryVariants
        : [currentBlunder.explanation];
    const activeOptimalExplanation = variants[variantIdx % variants.length] ?? currentBlunder.explanation;
    const mistakeReasonText = validationResult?.specificMistakeReason || currentBlunder.whyFailed;

    const handleSpeakErhBriefing = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        speak(erhScenario.voiceBriefingText, { force: true });
    };

    const handleListenExplanation = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        const fullSpeech = [
            drillMode !== 'pr_math' ? erhScenario.exploitExplanation : '',
            mistakeReasonText ? `Pourquoi l'erreur échoue : ${mistakeReasonText}` : '',
            activeOptimalExplanation ? `Pourquoi ${validationResult?.optimalNotation ?? currentBlunder.optimalMove} est optimal : ${activeOptimalExplanation}` : '',
        ]
            .filter(Boolean)
            .join(' ');
        if (fullSpeech) {
            speak(fullSpeech, { force: true });
        }
    };

    return (
        <section data-testid="drill-position-card" className="w-full h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#0e121b]/95 p-2 sm:p-2.5 shadow-xl space-y-1.5 overflow-hidden">
            <div className="space-y-1.5 overflow-y-auto pr-0.5">
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/10 pb-1">
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="font-bold text-[#f3c65f]">Quizz #{currentIndex + 1}</span>
                        <span className="sr-only">{totalBlunders}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                            {tierInfo.badge}
                        </span>
                        <span className="rounded border border-rose-500/40 bg-rose-950/80 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">{currentBlunder.conceptName}</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 text-[11px]">
                        <span className="text-[#a5b0c4] font-semibold">Jet à jouer :</span>
                        <span className="rounded border border-white/10 bg-[#180c06] px-1 py-0.2 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[0]}</span>
                        <span className="rounded border border-white/10 bg-[#180c06] px-1 py-0.2 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[1]}</span>
                    </div>
                </div>

                {/* Barre d'actions : Indice + Réinitialiser + Bouton VALIDER */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span className="sr-only">
                        Erreur piégeuse à éviter : {currentBlunder.playedMove} (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
                    </span>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={onToggleHint} className="rounded-lg border border-white/10 bg-[#1a1109] px-2 py-1 text-[11px] font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="drill-hint-toggle">💡 {showHint ? 'Masquer' : 'Indice'}</button>
                        <button type="button" onClick={onResetAttempt} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-semibold text-[#e2d2b5] hover:border-white/25 transition" data-testid="drill-reset-btn">↺ Réinitialiser</button>
                    </div>
                    {onValidateAttempt && !validationResult?.isCorrect && (
                        <button
                            type="button"
                            onClick={onValidateAttempt}
                            disabled={!canValidateAttempt}
                            data-testid="drill-validate-btn"
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide transition shadow-md ${
                                canValidateAttempt
                                    ? 'border-emerald-300 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 hover:brightness-110 animate-pulse'
                                    : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            ✓ Valider {stagedNotation ? `(${stagedNotation})` : ''}
                        </button>
                    )}
                </div>

                {/* Carte Psychologique ERH : affichée uniquement en mode Quizz ERH (Psychologie), jamais en Quizz PR */}
                {drillMode !== 'pr_math' && (
                    <div
                        data-testid="erh-opponent-scenario-card"
                        className="rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#1c130b] via-[#130e09] to-[#1c130b] p-1.5 space-y-1"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="rounded-md border border-[#f3c65f]/50 bg-[#f3c65f]/15 px-1.5 py-0.5 text-[10px] font-extrabold text-[#f3c65f]">
                                {erhScenario.badgeLabel}
                            </span>
                            <button
                                type="button"
                                data-testid="erh-scenario-voice-btn"
                                onClick={handleSpeakErhBriefing}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#f3c65f]/40 bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-[#f3c65f] hover:bg-[#24190e] transition"
                            >
                                <span>{isSpeaking ? '🔇 Stop' : '🎙️ Écouter'}</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-amber-50/95 leading-snug font-medium">
                            {erhScenario.psychologicalPrompt}
                        </p>
                    </div>
                )}

                {/* Mode Quiz Express QCM (4 propositions cliquables OU jeu direct sur le plateau) */}
                {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && !validationResult?.isCorrect && (
                    <div className="rounded-xl border border-white/10 bg-black/35 p-1.5 space-y-1" data-testid="quiz-qcm-choices">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#f3c65f]">⚡ Choisissez ou jouez sur le plateau :</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                            {currentBlunder.quizChoices.map((choice) => {
                                const isPickedWrong = validationResult && !validationResult.isCorrect && validationResult.playedNotation === choice;
                                const isStaged = stagedNotation === choice;
                                return (
                                    <button
                                        key={choice}
                                        type="button"
                                        onClick={() => onSelectQuizChoice(choice)}
                                        className={`rounded-lg border px-2 py-1 font-mono text-[11px] font-extrabold transition ${
                                            isPickedWrong
                                                ? 'border-rose-500 bg-rose-950/70 text-rose-200'
                                                : isStaged
                                                    ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200'
                                                    : 'border-white/15 bg-[#161b26] text-[#fdf8eb] hover:border-[#f3c65f] hover:bg-[#23190f] hover:text-[#f3c65f]'
                                        }`}
                                    >
                                        🎯 {choice}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {showHint && currentBlunder.hint && (
                    <div className="rounded-xl border border-white/10 bg-[#180c06]/90 p-2.5 text-xs text-[#fdf8eb] leading-snug" data-testid="drill-hint-box">
                        <span className="font-bold text-[#f3c65f]">💡 Indice : </span>{currentBlunder.hint}
                    </div>
                )}

                {validationResult && (
                    <div className={`w-full rounded-xl border p-3 text-xs space-y-2 ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100' : 'border-rose-500/60 bg-rose-950/70 text-rose-100'}`} data-testid="drill-feedback-banner">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                <h3 className="text-xs sm:text-sm font-black">{validationResult.feedbackMessage}</h3>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/40 px-2.5 py-1.5 text-xs">
                            <span>Votre coup : <strong className={`font-mono ${validationResult.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>{validationResult.playedNotation}</strong></span>
                            <span>Meilleur coup : <strong className="font-mono text-emerald-300">{validationResult.optimalNotation}</strong></span>
                        </div>

                        {/* Explication claire et détaillée de POURQUOI le coup joué est une erreur */}
                        {mistakeReasonText && (
                            <div className="rounded-lg border border-rose-400/35 bg-rose-950/60 p-2 text-xs text-rose-100 leading-snug">
                                <strong className="text-rose-300 block mb-0.5">
                                    ❌ Pourquoi l&apos;erreur ({validationResult.isCorrect ? currentBlunder.playedMove : validationResult.playedNotation}) est mauvaise :
                                </strong>
                                {mistakeReasonText}
                            </div>
                        )}

                        {/* Explication de POURQUOI le coup optimal gagne */}
                        {activeOptimalExplanation && (
                            <div className="rounded-lg border border-emerald-400/35 bg-emerald-950/50 p-2 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-extrabold text-emerald-300">
                                        ✅ Pourquoi {validationResult.optimalNotation} est le meilleur coup
                                        <span className="sr-only">Coach Pédagogique 3.8 Flash</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            data-testid="drill-voice-listen-btn"
                                            onClick={handleListenExplanation}
                                            className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-[#e2d2b5] hover:text-white transition"
                                        >
                                            <span>{isSpeaking ? '🔇 Stop' : '🔈 Écouter'}</span>
                                        </button>
                                        {variants.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setVariantIdx((prev) => prev + 1)}
                                                className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-black/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:border-emerald-300 transition"
                                            >
                                                🔄 ({(variantIdx % variants.length) + 1}/{variants.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-100 leading-snug">
                                    {activeOptimalExplanation}
                                </p>
                            </div>
                        )}

                        {currentBlunder.proverb && (
                            <p className="text-[11px] italic text-[#f3c65f]">
                                📜 « {currentBlunder.proverb} »
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            {!validationResult.isCorrect && (
                                <button type="button" onClick={onResetAttempt} className="rounded-xl border border-rose-400 bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition" data-testid="drill-retry-btn">↺ Réessayer sur le plateau</button>
                            )}
                            <button type="button" onClick={onNextBlunder} className="rounded-xl border border-emerald-400 bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-500 transition shadow" data-testid="drill-next-btn">
                                {validationResult.isCorrect ? 'Quizz suivant →' : 'Compris · Quizz suivant →'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
