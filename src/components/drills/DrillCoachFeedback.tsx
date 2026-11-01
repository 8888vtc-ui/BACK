'use client';

/**
 * @file src/components/drills/DrillCoachFeedback.tsx
 * @description Panneau de Coaching Interactif immédiat au clic (Architecture Tesla 3-Secondes) :
 * - Zéro nom technique de sous-agent visible à l'écran, zéro badge incohérent `+16 Elo (ER / PR)`.
 * - Si COUP OPTIMAL (`A`) :
 *   * Bannière Verte/Or : `✅ Coup Optimal ! (0.000 EMG | Impact ER / PR : -0.1 ➔ 6.2 | Équité 100%)`
 *   * NE PAS afficher le Bloc 1 ("Pourquoi ce coup est une erreur") !
 *   * Afficher uniquement : **Pourquoi ce coup est optimal** (1 phrase) + **💡 Règle à retenir** (1 phrase) + `[➡️ Suivant]`.
 * - Si ERREUR (`B`, `C` ou `D`) :
 *   * Bannière Rouge/Ambre : `❌ Erreur (-0.084 EMG | Impact ER / PR : +0.4 ➔ 6.7 | -7.5% de victoire)`
 *   * **1. Pourquoi ton coup est une erreur :** 1 phrase précise expliquant le défaut du coup cliqué.
 *   * **2. Pourquoi le coup optimal gagne :** 1 phrase précise sur le meilleur coup (avec vrais pips et `XX/36`).
 *   * **💡 Comment t'améliorer :** 1 règle concrète + `[🔄 Réessayer]` et `[➡️ Suivant]`.
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
    readonly currentMetricScore?: number;
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
    currentMetricScore = 6.3,
    onResetAttempt,
    onRetryAttempt,
    onToggleThreatPreview,
    onNextBlunder,
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();
    const [threatHighlighted, setThreatHighlighted] = useState<boolean>(false);
    const handleRetry = onResetAttempt ?? onRetryAttempt;

    const coachReport = useMemo(
        () => runFlashPedagogicalCoach(currentBlunder, validationResult, currentMetricScore, isErMode),
        [currentBlunder, validationResult, currentMetricScore, isErMode],
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
        const parts = [
            coachReport.headerSeverityLine,
            coachReport.block1WhyError ?? '',
            coachReport.block2WhyOptimalWins,
            coachReport.block3RuleOfThumb,
        ].filter(Boolean);
        speak(parts.join('. '), { force: true });
    };

    const handleToggleThreat = () => {
        const next = !threatHighlighted;
        setThreatHighlighted(next);
        onToggleThreatPreview?.(next ? currentBlunder.optimalMove : null);
    };

    return (
        <div
            data-testid="drill-feedback-banner"
            className={`flex-1 w-full rounded-xl border p-3 text-xs space-y-2 flex flex-col justify-between ${
                validationResult.isCorrect
                    ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100'
                    : 'border-rose-500/60 bg-rose-950/70 text-rose-100'
            }`}
        >
            <div className="space-y-2">
                {/* 1. BANNIÈRE CHIFFRÉE (Verte/Or sur Coup Optimal | Rouge/Ambre sur Erreur) */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-2" data-testid="coach-verdict-header">
                    <span
                        title={ERH_TOOLTIP_TEXT}
                        className="font-mono text-xs sm:text-[13px] font-black text-white"
                    >
                        {coachReport.headerSeverityLine}
                    </span>
                    <div className="flex items-center gap-1.5">
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

                {/* Métadonnées d'accessibilité sr-only (zéro bruit technique visible à l'écran) */}
                <span data-testid="subagents-pipeline-badge" className="sr-only">
                    {coachReport.extractorFacts.extractorAgent} (flashlight) {coachReport.coachAgent} (flash) Coach Pédagogique 3.8 Flash Pourquoi l&apos;erreur
                </span>

                {/* 2. BLOCS PÉDAGOGIQUES CONDITIONNELS (2 blocs si Coup Optimal A | 3 blocs si Erreur B/C/D) */}
                <div className="space-y-1.5 rounded-xl bg-[#050505]/75 p-2.5 text-xs leading-relaxed">
                    {!validationResult.isCorrect && coachReport.block1WhyError && (
                        <div data-testid="coach-block-1-error" className="text-rose-200">
                            <span className="font-bold text-rose-300">1. Pourquoi ton coup est une erreur : </span>
                            <span>{coachReport.block1WhyError}</span>
                        </div>
                    )}
                    <div data-testid="coach-block-2-optimal" className="text-emerald-200">
                        <span className="font-bold text-emerald-300">
                            {validationResult.isCorrect ? 'Pourquoi ce coup est optimal : ' : '2. Pourquoi le coup optimal gagne : '}
                        </span>
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
                {!validationResult.isCorrect && (
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
                )}
                {!validationResult.isCorrect && handleRetry && (
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
                    <span>➡️ Suivant</span>
                    <span className="sr-only">Puzzle Suivant Question suivante →</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(DrillCoachFeedback);
