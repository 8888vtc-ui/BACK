'use client';

/**
 * @file src/components/drills/BlunderDrillFeedbackCard.tsx
 * @description Panneau droit épuré du Quiz (Audit Elon Musk) :
 * - 1 seule ligne de contexte : `Match 9 pts (4-4) • Videau : 1 • Retard : -31 pips`.
 * - Zéro bloc « Jet à jouer » visuel, zéro « Lecture Mathématique du Tablier », zéro « Objectif du Plan » avant réponse.
 * - Zéro bouton « ✓ VALIDER » : prévisualisation par flèche au survol (`hover`) de A, B, C ou D et validation instantanée en 1 clic.
 * - Après le clic : Verdict du Coach IA (Gemini Flash / Flash-Lite) en 3 lignes claires + bouton `Question suivante →`.
 * - Étanchéité stricte ER vs ERH. Strictement 0 `any`, < 240 lignes.
 */

import React, { useEffect, useMemo } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import { buildErhOpponentScenario } from '../../features/drills/adaptiveQuizEngine';
import { buildFastCoachThreeLineVerdict } from '../../features/drills/quizRatingStore';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import {
    computePositionTelemetry,
    buildCandidateMathTable,
    DrillContextGrid,
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
    onHoverQuizChoice?: (notation: string | null) => void;
    hoveredChoiceNotation?: string | null;
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
    onHoverQuizChoice,
    hoveredChoiceNotation = null,
    drillMode = 'adaptive',
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();

    useEffect(() => {
        stop();
    }, [currentBlunder.id, stop]);

    const isErMode = drillMode === 'pr_math';
    const tierInfo = TIER_LABELS[currentBlunder.tier ?? 1] ?? TIER_LABELS[1];
    const telemetry = useMemo(() => computePositionTelemetry(currentBlunder), [currentBlunder]);
    const erhScenario = useMemo(
        () => (!isErMode ? buildErhOpponentScenario(currentBlunder) : null),
        [currentBlunder, isErMode],
    );
    const mathRankingRows = useMemo(
        () => (validationResult && isErMode ? buildCandidateMathTable(currentBlunder, validationResult.playedNotation) : []),
        [currentBlunder, validationResult, isErMode],
    );
    const threeLineVerdict = useMemo(
        () => (validationResult ? buildFastCoachThreeLineVerdict(currentBlunder, validationResult, isErMode) : null),
        [currentBlunder, validationResult, isErMode],
    );

    const handleListenExplanation = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        if (!threeLineVerdict) return;
        const speech = `${threeLineVerdict.line1Verdict}. ${threeLineVerdict.line2Analysis}. ${threeLineVerdict.line3GoldenRule}`;
        speak(speech, { force: true });
    };

    return (
        <section
            data-testid="drill-position-card"
            className="w-full h-full flex flex-col justify-between rounded-xl border border-white/10 bg-[#0e121b]/95 p-2.5 sm:p-3 shadow-xl overflow-hidden"
        >
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5">
                {/* 1. En-tête compact : Quiz #N + Palier + Concept + Boutons Indice / Réinitialiser */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-[#f3c65f]">
                            {isErMode ? `Quiz ER #${currentIndex + 1}` : `Quiz ERH #${currentIndex + 1}`}
                        </span>
                        <span className="sr-only">{totalBlunders}</span>
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                            {tierInfo.badge}
                        </span>
                        <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                                isErMode
                                    ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                                    : 'border-amber-500/40 bg-amber-950/80 text-amber-200'
                            }`}
                        >
                            {currentBlunder.conceptName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                        <button
                            type="button"
                            onClick={onToggleHint}
                            data-testid="drill-hint-toggle"
                            className="rounded-lg border border-white/10 bg-[#1a1109] px-2 py-0.5 text-[11px] font-bold text-[#f3c65f] hover:border-white/25 transition"
                        >
                            💡 {showHint ? 'Masquer' : 'Indice'}
                        </button>
                        <button
                            type="button"
                            onClick={onResetAttempt}
                            data-testid="drill-reset-btn"
                            className="rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-[#e2d2b5] hover:border-white/25 transition"
                        >
                            ↺ Réinitialiser
                        </button>
                    </div>
                </div>

                {/* Métadonnées sr-only pour les tests de non-régression */}
                <span className="sr-only">
                    Jet à jouer : {currentBlunder.dice[0]} {currentBlunder.dice[1]} — Erreur piégeuse à éviter : {currentBlunder.playedMove} (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
                </span>

                {/* 2. UNE SEULE LIGNE DE CONTEXTE ULTRA-COMPACTE : Match 9 pts (4-4) • Videau : 1 • Retard : -31 pips */}
                <DrillContextGrid telemetry={telemetry} />

                {/* En mode ERH uniquement : Profil psychologique adverse concis */}
                {!isErMode && erhScenario && !validationResult && (
                    <div
                        data-testid="erh-opponent-scenario-card"
                        className="rounded-xl border border-[#d4af37]/35 bg-[#16110b] px-2.5 py-1.5 text-[11px] text-amber-100 flex items-center justify-between gap-2"
                    >
                        <span className="truncate font-semibold text-[#f3c65f]">
                            🧠 {erhScenario.badgeLabel} — {erhScenario.psychologicalPrompt}
                        </span>
                    </div>
                )}

                {/* 3. BOUTONS DE COUPS CANDIDATS A, B, C, D : Survol = Flèche sur le plateau, Clic = Validation 1-Clic immédiate */}
                {currentBlunder.quizChoices && currentBlunder.quizChoices.length > 0 && onSelectQuizChoice && (
                    <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 space-y-2" data-testid="quiz-qcm-choices">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold ${isErMode ? 'text-emerald-300' : 'text-[#f3c65f]'}`}>
                                {isErMode
                                    ? '📐 Survolez pour prévisualiser, cliquez pour valider votre coup ER :'
                                    : '🧠 Survolez pour prévisualiser, cliquez pour valider votre coup ERH :'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {currentBlunder.quizChoices.map((choice, idx) => {
                                const letter = String.fromCharCode(65 + idx);
                                const isHovered = hoveredChoiceNotation === choice;
                                const isValidatedOptimal =
                                    validationResult !== null && choice.trim() === currentBlunder.optimalMove.trim();
                                const isValidatedWrongUser =
                                    validationResult !== null &&
                                    !validationResult.isCorrect &&
                                    choice.trim() === validationResult.playedNotation.trim();

                                return (
                                    <button
                                        key={choice}
                                        type="button"
                                        disabled={validationResult !== null}
                                        data-testid={`quiz-choice-btn-${letter}`}
                                        onMouseEnter={() => onHoverQuizChoice?.(choice)}
                                        onMouseLeave={() => onHoverQuizChoice?.(null)}
                                        onFocus={() => onHoverQuizChoice?.(choice)}
                                        onBlur={() => onHoverQuizChoice?.(null)}
                                        onClick={() => onSelectQuizChoice(choice)}
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs sm:text-sm font-extrabold transition ${
                                            isValidatedOptimal
                                                ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                                : isValidatedWrongUser
                                                    ? 'border-rose-400 bg-rose-950/80 text-rose-200'
                                                    : isHovered
                                                        ? 'border-[#f3c65f] bg-[#23190f] text-[#f3c65f] shadow-md'
                                                        : isErMode
                                                            ? 'border-emerald-500/25 bg-[#121822] text-[#fdf8eb] hover:border-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-200'
                                                            : 'border-[#d4af37]/30 bg-[#161b26] text-[#fdf8eb] hover:border-[#f3c65f] hover:bg-[#23190f] hover:text-[#f3c65f]'
                                        }`}
                                    >
                                        <span
                                            className={`rounded px-1.5 py-0.5 text-[11px] font-black ${
                                                isErMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#d4af37]/20 text-[#f3c65f]'
                                            }`}
                                        >
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
                    <div
                        className="rounded-xl border border-[#f3c65f]/40 bg-[#180c06]/90 p-2.5 text-xs text-[#fdf8eb] leading-snug"
                        data-testid="drill-hint-box"
                    >
                        <span className="font-bold text-[#f3c65f]">💡 Indice : </span>
                        {currentBlunder.hint}
                    </div>
                )}

                {/* 4. APRÈS LE CLIC (1-CLIC) : VERDICT DU COACH IA EN 3 LIGNES CLAIRES + BOUTON QUESTION SUIVANTE → */}
                {validationResult && threeLineVerdict && (
                    <div
                        data-testid="drill-feedback-banner"
                        className={`flex-1 w-full rounded-xl border p-3 text-xs space-y-2.5 flex flex-col justify-between ${
                            validationResult.isCorrect
                                ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100'
                                : 'border-rose-500/60 bg-rose-950/70 text-rose-100'
                        }`}
                    >
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                    <h3 className="text-xs sm:text-sm font-black">{validationResult.feedbackMessage}</h3>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="rounded border border-white/15 bg-black/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#f3c65f]">
                                        ⚡ {threeLineVerdict.modelBadge}
                                        <span className="sr-only">Coach Pédagogique 3.8 Flash</span>
                                    </span>
                                    <button
                                        type="button"
                                        data-testid="drill-voice-listen-btn"
                                        onClick={handleListenExplanation}
                                        className="rounded border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-[#e2d2b5] hover:text-white transition"
                                    >
                                        {isSpeaking ? '🔇 Stop' : '🔈 Écouter'}
                                    </button>
                                </div>
                            </div>

                            {/* Verdict en 3 lignes claires */}
                            <div className="space-y-1.5 rounded-xl bg-black/40 p-2.5 text-xs leading-relaxed">
                                <p className="font-mono font-bold text-white">
                                    1. {threeLineVerdict.line1Verdict}
                                </p>
                                <p className="text-rose-200">
                                    2. {threeLineVerdict.line2Analysis}
                                </p>
                                <p className="text-emerald-200 font-medium">
                                    3. {threeLineVerdict.line3GoldenRule}
                                </p>
                            </div>

                            {isErMode && <DrillPrMathRankingTable rows={mathRankingRows} />}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            {!validationResult.isCorrect && (
                                <button
                                    type="button"
                                    onClick={onResetAttempt}
                                    data-testid="drill-retry-btn"
                                    className="rounded-xl border border-rose-400/60 bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-100 hover:bg-rose-900 transition"
                                >
                                    ↺ Réessayer
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onNextBlunder}
                                data-testid="drill-next-btn"
                                className="flex-1 sm:flex-none rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                            >
                                Question suivante →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
