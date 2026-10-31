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
            erhScenario.exploitExplanation,
            currentBlunder.whyFailed ? `Pourquoi l'erreur échoue : ${currentBlunder.whyFailed}` : '',
            activeOptimalExplanation ? `Pourquoi ${validationResult?.optimalNotation ?? currentBlunder.optimalMove} est optimal : ${activeOptimalExplanation}` : '',
        ]
            .filter(Boolean)
            .join(' ');
        if (fullSpeech) {
            speak(fullSpeech, { force: true });
        }
    };

    return (
        <section data-testid="drill-position-card" className="w-full rounded-2xl border border-white/10 bg-[#0e121b]/95 p-3.5 sm:p-4 shadow-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#f3c65f]">Défi {currentIndex + 1} sur {totalBlunders}</span>
                    <span className={`rounded border px-2 py-0.5 text-xs font-bold ${tierInfo.color}`}>
                        {tierInfo.badge}
                    </span>
                    <span className="rounded border border-rose-500/40 bg-rose-950/80 px-2 py-0.5 text-xs font-bold text-rose-200">{currentBlunder.conceptName}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs">
                    <span className="text-[#a5b0c4] font-semibold">Jet à jouer :</span>
                    <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[0]}</span>
                    <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[1]}</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-[#e2d2b5]">
                    <span className="text-[#a5b0c4]">Erreur piégeuse à éviter : </span>
                    <span className="font-mono font-bold text-rose-400 underline decoration-rose-500/50">{currentBlunder.playedMove}</span>
                    <span className="ml-2 font-mono text-xs text-rose-300">(-{currentBlunder.equityLoss.toFixed(3)} ΔEq)</span>
                </p>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onToggleHint} className="rounded-xl border border-white/10 bg-[#1a1109] px-3 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="drill-hint-toggle">💡 {showHint ? 'Masquer indice' : 'Indice'}</button>
                    <button type="button" onClick={onResetAttempt} className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-[#e2d2b5] hover:border-white/25 transition" data-testid="drill-reset-btn">↺ Réinitialiser</button>
                </div>
            </div>

            {/* Carte Psychologique ERH : affichée uniquement en mode Quizz ERH (Psychologie), jamais en Quizz PR */}
            {drillMode !== 'pr_math' && (
                <div
                    data-testid="erh-opponent-scenario-card"
                    className="rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#1c130b] via-[#130e09] to-[#1c130b] p-2.5 space-y-1"
                >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="rounded-md border border-[#f3c65f]/50 bg-[#f3c65f]/15 px-2 py-0.5 text-xs font-extrabold text-[#f3c65f]">
                            {erhScenario.badgeLabel}
                        </span>
                        <button
                            type="button"
                            data-testid="erh-scenario-voice-btn"
                            onClick={handleSpeakErhBriefing}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#f3c65f]/40 bg-black/45 px-2 py-0.5 text-[11px] font-bold text-[#f3c65f] hover:bg-[#24190e] transition"
                        >
                            <span>{isSpeaking ? '🔇 Stop' : '🎙️ Écouter'}</span>
                        </button>
                    </div>
                    <p className="text-xs text-amber-50/95 leading-snug font-medium">
                        {erhScenario.psychologicalPrompt}
                    </p>
                </div>
            )}

            {/* Mode Quiz Express QCM (4 propositions cliquables OU jeu direct sur le plateau) */}
            {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && !validationResult?.isCorrect && (
                <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 space-y-2" data-testid="quiz-qcm-choices">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#f3c65f]">⚡ Quiz Express : Choisissez le meilleur coup (ou déplacez les pions sur le plateau)</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {currentBlunder.quizChoices.map((choice) => {
                            const isPickedWrong = validationResult && !validationResult.isCorrect && validationResult.playedNotation === choice;
                            return (
                                <button
                                    key={choice}
                                    type="button"
                                    onClick={() => onSelectQuizChoice(choice)}
                                    className={`rounded-xl border px-3 py-2 font-mono text-xs font-extrabold transition ${
                                        isPickedWrong
                                            ? 'border-rose-500 bg-rose-950/70 text-rose-200'
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
                <div className="rounded-xl border border-white/10 bg-[#180c06]/90 p-3 text-xs text-[#fdf8eb] leading-relaxed" data-testid="drill-hint-box">
                    <span className="font-bold text-[#f3c65f]">💡 Conseil pédagogique : </span>{currentBlunder.hint}
                </div>
            )}

            {validationResult && (
                <div className={`w-full rounded-xl border p-3.5 text-xs ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100' : 'border-rose-500/50 bg-rose-950/60 text-rose-100'}`} data-testid="drill-feedback-banner">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                <h3 className="text-sm font-bold">{validationResult.feedbackMessage}</h3>
                            </div>
                            <p className="text-xs text-slate-200">
                                <span>Coup joué : <strong className="font-mono text-white">{validationResult.playedNotation}</strong></span>
                                <span className="mx-2 text-slate-500">|</span>
                                <span>Coup optimal certifié : <strong className="font-mono text-emerald-300">{validationResult.optimalNotation}</strong></span>
                            </p>

                            {/* Explication systématique de POURQUOI l'erreur échoue */}
                            {currentBlunder.whyFailed && (
                                <p className="text-xs text-rose-200/95 pt-1 leading-relaxed">
                                    <strong className="text-rose-300">❌ Pourquoi l&apos;erreur ({currentBlunder.playedMove}) échoue : </strong>
                                    {currentBlunder.whyFailed}
                                </p>
                            )}

                            {/* Explication de POURQUOI le coup optimal gagne + Rotation des variantes IA 3.8 Flash */}
                            {activeOptimalExplanation && (
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-md border border-[#f3c65f]/40 bg-[#1a1109] px-2 py-0.5 text-[11px] font-extrabold text-[#f3c65f]">
                                            🧠 Coach Pédagogique 3.8 Flash (Accès Premium Offert)
                                        </span>
                                        <button
                                            type="button"
                                            data-testid="drill-voice-listen-btn"
                                            onClick={handleListenExplanation}
                                            title={isSpeaking ? "Arrêter la lecture vocale" : "Écouter l'explication tout en observant le plateau"}
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition ${
                                                isSpeaking
                                                    ? 'border-amber-400/70 bg-amber-950/70 text-amber-200 animate-pulse'
                                                    : 'border-white/15 bg-black/35 text-[#e2d2b5] hover:border-[#f3c65f]/60 hover:text-white'
                                            }`}
                                        >
                                            <span>{isSpeaking ? '🔇 Stop' : '🔈 Écouter'}</span>
                                        </button>
                                        {variants.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setVariantIdx((prev) => prev + 1)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-black/30 px-2 py-0.5 text-[11px] font-bold text-emerald-300 hover:border-emerald-300 transition"
                                            >
                                                🔄 Autre angle pédagogique ({(variantIdx % variants.length) + 1}/{variants.length})
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-100 leading-relaxed">
                                        <strong className="text-emerald-300">✅ Pourquoi {validationResult.optimalNotation} est optimal : </strong>
                                        {activeOptimalExplanation}
                                    </p>
                                </div>
                            )}

                            {currentBlunder.proverb && (
                                <p className="text-xs italic text-[#f3c65f] pt-0.5">
                                    📜 « {currentBlunder.proverb} »
                                </p>
                            )}
                        </div>
                        <div className="shrink-0">
                            {validationResult.isCorrect ? (
                                <button type="button" onClick={onNextBlunder} className="rounded-xl border border-emerald-400 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition" data-testid="drill-next-btn">Défi suivant →</button>
                            ) : (
                                <button type="button" onClick={onResetAttempt} className="rounded-xl border border-rose-400 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition" data-testid="drill-retry-btn">↺ Réessayer ce coup</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
