'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import { buildErhOpponentScenario } from '../../features/drills/adaptiveQuizEngine';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import {
    computePositionTelemetry,
    buildCandidateMathTable,
    DrillContextGrid,
    DrillPreValidationReadingCard,
    DrillPrMathRankingTable,
} from './DrillPositionContextAndReading';

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

    const isPrMathMode = drillMode === 'pr_math';
    const tierInfo = TIER_LABELS[currentBlunder.tier ?? 1] ?? TIER_LABELS[1];
    const erhScenario = useMemo(() => buildErhOpponentScenario(currentBlunder), [currentBlunder]);
    const telemetry = useMemo(() => computePositionTelemetry(currentBlunder), [currentBlunder]);
    const mathRankingRows = useMemo(
        () => (validationResult ? buildCandidateMathTable(currentBlunder, validationResult.playedNotation) : []),
        [currentBlunder, validationResult],
    );

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
            !isPrMathMode ? erhScenario.exploitExplanation : '',
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
        <section data-testid="drill-position-card" className="w-full h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#0e121b]/95 p-2 sm:p-2.5 shadow-xl overflow-hidden">
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {/* 1. En-tête des badges (Quizz #N, Palier, Thème, Jet à jouer) */}
                <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/10 pb-1">
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                        <span className="font-bold text-[#f3c65f]">Quizz #{currentIndex + 1}</span>
                        <span className="sr-only">{totalBlunders}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                            {tierInfo.badge}
                        </span>
                        <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                                isPrMathMode
                                    ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                                    : 'border-amber-500/40 bg-amber-950/80 text-amber-200'
                            }`}
                        >
                            {currentBlunder.conceptName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 text-[11px]">
                        <span className="text-[#a5b0c4] font-semibold">Jet à jouer :</span>
                        <span className="rounded border border-white/10 bg-[#180c06] px-1 py-0.2 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[0]}</span>
                        <span className="rounded border border-white/10 bg-[#180c06] px-1 py-0.2 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[1]}</span>
                    </div>
                </div>

                {/* 2. BLOC OBLIGATOIRE : CONTEXTE DE LA POSITION (Camp au trait, Score/Format, Videau, Course) */}
                <DrillContextGrid telemetry={telemetry} />

                <span className="sr-only">
                    Erreur piégeuse à éviter : {currentBlunder.playedMove} (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
                </span>

                {/* 3. Barre d'actions : Indice + Réinitialiser + Bouton VALIDER */}
                {!validationResult && (
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={onToggleHint} className="rounded-lg border border-white/10 bg-[#1a1109] px-2 py-1 text-[11px] font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="drill-hint-toggle">💡 {showHint ? 'Masquer' : 'Indice'}</button>
                            <button type="button" onClick={onResetAttempt} className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-semibold text-[#e2d2b5] hover:border-white/25 transition" data-testid="drill-reset-btn">↺ Réinitialiser</button>
                        </div>
                        {onValidateAttempt && (
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
                )}

                {/* 4. Mode Quizz ERH : Thème stratégique & psychologie humaine à observer avant le coup */}
                {!isPrMathMode && !validationResult && (
                    <div
                        data-testid="erh-opponent-scenario-card"
                        className="rounded-xl border border-[#d4af37]/35 bg-gradient-to-r from-[#1c130b] via-[#130e09] to-[#1c130b] p-2 space-y-1"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="rounded-md border border-[#f3c65f]/50 bg-[#f3c65f]/15 px-1.5 py-0.5 text-[10px] font-extrabold text-[#f3c65f]">
                                🧠 {erhScenario.badgeLabel}
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

                {/* 5. Boutons de coups candidats : Séparation stricte Quizz PR (sans icône rose 🎯) vs Quizz ERH */}
                {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && !validationResult && (
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2 space-y-1.5" data-testid="quiz-qcm-choices">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold ${isPrMathMode ? 'text-emerald-300' : 'text-[#f3c65f]'}`}>
                                {isPrMathMode
                                    ? '📐 Sélectionnez le coup mathématiquement optimal (ou jouez sur le plateau) :'
                                    : '🧠 Sélectionnez le meilleur plan stratégique (ou jouez sur le plateau) :'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {currentBlunder.quizChoices.map((choice, idx) => {
                                const isStaged = stagedNotation === choice;
                                const letter = String.fromCharCode(65 + idx);
                                return (
                                    <button
                                        key={choice}
                                        type="button"
                                        onClick={() => onSelectQuizChoice(choice)}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-xs font-extrabold transition ${
                                            isStaged
                                                ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200'
                                                : isPrMathMode
                                                    ? 'border-emerald-500/25 bg-[#121822] text-[#fdf8eb] hover:border-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-200'
                                                    : 'border-[#d4af37]/25 bg-[#161b26] text-[#fdf8eb] hover:border-[#f3c65f] hover:bg-[#23190f] hover:text-[#f3c65f]'
                                        }`}
                                    >
                                        <span className={`rounded px-1 py-0.2 text-[10px] font-bold ${isPrMathMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#d4af37]/20 text-[#f3c65f]'}`}>
                                            {letter}
                                        </span>
                                        <span>{choice}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {showHint && currentBlunder.hint && !validationResult && (
                    <div className="rounded-xl border border-[#f3c65f]/40 bg-[#180c06]/90 p-2 text-[11px] text-[#fdf8eb] leading-snug" data-testid="drill-hint-box">
                        <span className="font-bold text-[#f3c65f]">💡 Indice : </span>{currentBlunder.hint}
                    </div>
                )}

                {/* 6. Exploitation de l'espace inférieur avant validation : Carte "Lecture de Position" */}
                {!validationResult && (
                    <DrillPreValidationReadingCard
                        telemetry={telemetry}
                        blunder={currentBlunder}
                        isPrMathMode={isPrMathMode}
                    />
                )}

                {/* 7. Après validation : Rapport complet du Coach IA (Classement ΔEMG en Quizz PR / Explication 3 points en Quizz ERH) */}
                {validationResult && (
                    <div className={`flex-1 w-full rounded-xl border p-2.5 text-[11px] space-y-2 ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100' : 'border-rose-500/60 bg-rose-950/70 text-rose-100'}`} data-testid="drill-feedback-banner">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                <h3 className="text-xs font-black">{validationResult.feedbackMessage}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                {!validationResult.isCorrect && (
                                    <button type="button" onClick={onResetAttempt} className="rounded-lg border border-rose-400 bg-rose-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-rose-500 transition" data-testid="drill-retry-btn">↺ Réessayer</button>
                                )}
                                <button type="button" onClick={onNextBlunder} className="rounded-lg border border-emerald-400 bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white hover:bg-emerald-500 transition shadow" data-testid="drill-next-btn">
                                    Quizz Suivant →
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/40 px-2.5 py-1.5 text-xs">
                            <span>1. Le Verdict — Votre coup : <strong className={`font-mono ${validationResult.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>{validationResult.playedNotation}</strong></span>
                            <span>Coup optimal : <strong className="font-mono text-emerald-300">{validationResult.optimalNotation}</strong></span>
                        </div>

                        {/* En mode Quizz PR : Classement exact des 4 coups avec ΔEMG et probabilités Win / Gammon */}
                        {isPrMathMode && <DrillPrMathRankingTable rows={mathRankingRows} />}

                        {/* Point 2 : Pourquoi les autres coups sont dangereux */}
                        {mistakeReasonText && (
                            <div className="rounded-lg border border-rose-400/35 bg-rose-950/60 p-2 text-xs text-rose-100 leading-snug">
                                <strong className="text-rose-300 block mb-0.5">
                                    2. Pourquoi l&apos;erreur ({validationResult.isCorrect ? currentBlunder.playedMove : validationResult.playedNotation}) est dangereuse :
                                </strong>
                                {mistakeReasonText}
                            </div>
                        )}

                        {/* Point 3 : Pourquoi le coup optimal gagne & La Règle d'Or à retenir */}
                        {activeOptimalExplanation && (
                            <div className="rounded-lg border border-emerald-400/35 bg-emerald-950/50 p-2 space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-extrabold text-emerald-300">
                                        3. La Règle d&apos;Or — Pourquoi {validationResult.optimalNotation} est optimal
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
                                📜 Règle d&apos;Or : « {currentBlunder.proverb} »
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
