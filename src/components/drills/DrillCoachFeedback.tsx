'use client';

/**
 * @file src/components/drills/DrillCoachFeedback.tsx
 * @description Panneau de Coaching Interactif immédiat au clic (propulsé par les 2 Sous-Agents IA
 * `FlashLite-Tactical-Extractor` ("flashlight") & `Flash-Pedagogical-Coach` ("flash")) :
 * 1. En-tête du Verdict chiffré : `❌ Erreur (-0.XXX EMG | Impact ER / PR : +X.X | ERH : Palier ...)` + perte en % de victoire.
 * 2. Bloc 1 — Pourquoi ton coup est une erreur (Diagnostic Causal).
 * 3. Bloc 2 — Pourquoi le meilleur coup est supérieur (La Solution).
 * 4. Bloc 3 — Comment t'améliorer (Règle d'Or / Actionable Rule of Thumb).
 * 5. Boutons d'action interactifs : `[👁️ Voir la menace sur le plateau]`, `[🔄 Réessayer]`, `[➡️ Puzzle Suivant]`.
 * - Strictement < 190 lignes, 0 `any`.
 */

import React, { useMemo, useState } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import {
    ERH_TOOLTIP_TEXT,
    runFlashPedagogicalCoach,
} from '../../features/drills/drillSubAgentsPipeline';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import { buildCandidateMathTable, DrillPrMathRankingTable } from './DrillPositionContextAndReading';

export interface DrillCoachFeedbackProps {
    readonly currentBlunder: PlayerBlunderRecord;
    readonly validationResult: DrillValidationResult;
    readonly isErMode: boolean;
    readonly ratingDelta?: number;
    readonly liveRatingDelta?: number;
    readonly onResetAttempt?: () => void;
    readonly onRetryAttempt?: () => void;
    readonly onToggleThreatPreview?: (notation: string | null) => void;
    readonly onNextBlunder: () => void;
}

export const DrillCoachFeedback: React.FC<DrillCoachFeedbackProps> = ({
    currentBlunder,
    validationResult,
    isErMode,
    ratingDelta = 0,
    liveRatingDelta,
    onResetAttempt,
    onRetryAttempt,
    onToggleThreatPreview,
    onNextBlunder,
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();
    const [threatHighlighted, setThreatHighlighted] = useState<boolean>(false);
    const effectiveDelta = liveRatingDelta ?? ratingDelta;
    const handleRetry = onResetAttempt ?? onRetryAttempt;

    const coachReport = useMemo(
        () => runFlashPedagogicalCoach(currentBlunder, validationResult),
        [currentBlunder, validationResult],
    );

    const mathRankingRows = useMemo(
        () => (isErMode ? buildCandidateMathTable(currentBlunder, validationResult.playedNotation) : []),
        [currentBlunder, validationResult.playedNotation, isErMode],
    );

    const handleListenExplanation = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        const speech = `${coachReport.headerSeverityLine}. ${coachReport.block1WhyError}. ${coachReport.block2WhyOptimalWins}. ${coachReport.block3RuleOfThumb}`;
        speak(speech, { force: true });
    };

    const handleToggleThreat = () => {
        const next = !threatHighlighted;
        setThreatHighlighted(next);
        onToggleThreatPreview?.(next ? currentBlunder.optimalMove : null);
    };

    const modeName = isErMode ? 'ER / PR' : 'ERH';

    return (
        <div
            data-testid="drill-feedback-banner"
            className={`flex-1 w-full rounded-xl border p-3 text-xs space-y-2.5 flex flex-col justify-between ${
                validationResult.isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100'
                    : 'border-rose-500/60 bg-rose-950/70 text-rose-100'
            }`}
        >
            <div className="space-y-2">
                {/* 1. EN-TÊTE DU VERDICT (Clair & Chiffré : ΔEMG | Impact ER / PR | ERH + % de victoire) */}
                <div className="flex flex-col gap-1.5 border-b border-white/10 pb-2" data-testid="coach-verdict-header">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                            title={ERH_TOOLTIP_TEXT}
                            className="font-mono text-xs sm:text-[13px] font-black text-white"
                        >
                            {coachReport.headerSeverityLine}
                        </span>
                        <span
                            data-testid="coach-win-drop-badge"
                            className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-extrabold ${
                                validationResult.isCorrect
                                    ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                    : 'border-rose-400/60 bg-rose-500/25 text-rose-200'
                            }`}
                        >
                            {coachReport.winChanceDropBadge}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <span
                                data-testid="subagents-pipeline-badge"
                                className="rounded border border-[#D4AF37]/40 bg-[#050505] px-2 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]"
                            >
                                ⚡ {coachReport.extractorFacts.extractorAgent} (flashlight) ➔ {coachReport.coachAgent} (flash)
                                <span className="sr-only">Coach Pédagogique 3.8 Flash</span>
                            </span>
                            {effectiveDelta !== 0 && (
                                <span
                                    data-testid="coach-feedback-rating-delta"
                                    className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black ${
                                        effectiveDelta > 0
                                            ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                                            : 'border-rose-400/60 bg-rose-500/20 text-rose-300'
                                    }`}
                                >
                                    {effectiveDelta > 0 ? `+${effectiveDelta} Elo (${modeName})` : `${effectiveDelta} Elo (${modeName})`}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            data-testid="drill-voice-listen-btn"
                            onClick={handleListenExplanation}
                            className="rounded border border-white/15 bg-[#050505] px-2 py-0.5 text-[11px] font-bold text-[#e2d2b5] hover:text-white transition"
                        >
                            {isSpeaking ? '🔇 Stop' : '🔈 Écouter'}
                        </button>
                    </div>
                </div>

                {/* 2. LES 3 BLOCS PÉDAGOGIQUES (1. Diagnostic Causal ; 2. Solution Optimale ; 3. Règle d'Or) */}
                <div className="space-y-1.5 rounded-xl bg-[#050505]/75 p-2.5 text-xs leading-relaxed">
                    <div data-testid="coach-block-1-error" className="text-rose-200">
                        <span className="font-bold text-rose-300">1. Pourquoi ce coup est une erreur : </span>
                        <span>{coachReport.block1WhyError}</span>
                    </div>
                    <div data-testid="coach-block-2-optimal" className="text-emerald-200">
                        <span className="font-bold text-emerald-300">2. Pourquoi le meilleur coup est supérieur : </span>
                        <span>{coachReport.block2WhyOptimalWins}</span>
                    </div>
                    <div
                        data-testid="coach-block-3-rule"
                        className="rounded-lg border border-[#D4AF37]/35 bg-[#12151C] px-2.5 py-1.5 font-semibold text-[#fdf8eb]"
                    >
                        {coachReport.block3RuleOfThumb}
                    </div>
                </div>

                {isErMode && <DrillPrMathRankingTable rows={mathRankingRows} />}
            </div>

            {/* 3. BOUTONS D'ACTION INTERACTIFS */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                <button
                    type="button"
                    onClick={handleToggleThreat}
                    data-testid="drill-show-threat-btn"
                    className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                        threatHighlighted
                            ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'border-white/15 bg-[#050505] text-slate-200 hover:border-[#D4AF37]/60'
                    }`}
                >
                    👁️ Voir la menace sur le plateau
                </button>
                {handleRetry && (
                    <button
                        type="button"
                        onClick={handleRetry}
                        data-testid="drill-retry-btn"
                        className="rounded-xl border border-rose-400/60 bg-rose-950/80 px-3 py-1.5 text-[11px] font-bold text-rose-100 hover:bg-rose-900 transition"
                    >
                        🔄 Réessayer
                    </button>
                )}
                <button
                    type="button"
                    onClick={onNextBlunder}
                    data-testid="drill-next-btn"
                    className="flex-1 sm:flex-none rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                >
                    <span>➡️ Puzzle Suivant</span>
                    <span className="sr-only">Question suivante →</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(DrillCoachFeedback);
