'use client';

/**
 * @file src/components/drills/DrillCoachFeedback.tsx
 * @description Panneau de Coaching Interactif en Pleine Page Zéro-Scroll (Architecture Tesla 3-Secondes) :
 * - Gère le 1er essai raté (`attemptsLeft === 1`) : affiche un indice socratique ciblé + pénalité immédiate (`+0.2`), SANS dévoiler la réponse optimale.
 * - Gère la nuance à 0.010 EMG (`NEAR_OPTIMAL`).
 * - Sur Coup Optimal (`OPTIMAL`) : affiche uniquement `Pourquoi ce coup est optimal` + `Règle à retenir` (sans bloc d'erreur).
 * - Sur Erreur finale (`attemptsLeft === 0`) : affiche les 3 blocs complets + notification de création de carte FSRS v5 si `ΔEMG >= 0.080`.
 * - Strictement <= 235 lignes, 0 `any`, 0 emoji.
 */

import React, { useMemo, useState } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import {
    runFlashPedagogicalCoach,
} from '../../features/drills/drillSubAgentsPipeline';
import { evaluateMoveBlunderGate } from '../../lib/coachSystemPrompt';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useTranslation } from '../../i18n';
import { buildCandidateMathTable, DrillPrMathRankingTable } from './DrillPositionContextAndReading';
import {
    isCubeDecisionQuiz,
    extractCubeTelemetry,
} from '../../features/drills/drillCubeDecisionHelper';

export interface DrillCoachFeedbackProps {
    readonly currentBlunder: PlayerBlunderRecord;
    readonly validationResult: DrillValidationResult;
    readonly isErMode: boolean;
    readonly attemptsLeft?: number;
    readonly currentMetricScore?: number;
    readonly fsrsScheduled?: boolean;
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
    attemptsLeft = 0,
    currentMetricScore = 6.3,
    fsrsScheduled = false,
    onResetAttempt,
    onRetryAttempt,
    onToggleThreatPreview,
    onNextBlunder,
}) => {
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { isSpeaking, speak, stop } = useCoachVoice();
    const [threatHighlighted, setThreatHighlighted] = useState<boolean>(false);
    const handleRetry = onResetAttempt ?? onRetryAttempt;

    const isCube = useMemo(() => isCubeDecisionQuiz(currentBlunder), [currentBlunder]);
    const cubeTelemetry = useMemo(() => (isCube ? extractCubeTelemetry(currentBlunder) : null), [isCube, currentBlunder]);

    const coachReport = useMemo(
        () => runFlashPedagogicalCoach(currentBlunder, validationResult, currentMetricScore, isErMode),
        [currentBlunder, validationResult, currentMetricScore, isErMode],
    );

    const optimalWhyWins = useMemo(() => {
        if (!isCube || !cubeTelemetry) return coachReport.block2WhyOptimalWins;
        const optLetter = coachReport.extractorFacts.optimalLetter;
        const optNot = currentBlunder.optimalMove;
        return isEn
            ? `Optimal cube decision is ${optLetter} (${optNot}): ${cubeTelemetry.winPct}% Win, ${cubeTelemetry.gammonPct}% Gammon and Take Point of ${cubeTelemetry.takePointPct}%.`
            : `La décision optimale de videau est ${optLetter} (${optNot}) : ${cubeTelemetry.winPct}% de victoire, ${cubeTelemetry.gammonPct}% de Gammon et un seuil de prise (Take Point) de ${cubeTelemetry.takePointPct}%.`;
    }, [isCube, cubeTelemetry, coachReport.block2WhyOptimalWins, coachReport.extractorFacts.optimalLetter, currentBlunder.optimalMove, isEn]);

    const mathRankingRows = useMemo(
        () => (isErMode ? buildCandidateMathTable(currentBlunder, validationResult.playedNotation) : []),
        [currentBlunder, validationResult.playedNotation, isErMode],
    );

    const isFirstFailureSocratic = !validationResult.isCorrect && attemptsLeft === 1;
    const gateCheck = evaluateMoveBlunderGate(coachReport.extractorFacts.deltaEmg);
    const isNearOptimal = gateCheck.category === 'NEAR_OPTIMAL_GOOD_MOVE' || coachReport.verdictTier === 'NEAR_OPTIMAL';

    const handleListenExplanation = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        const parts = isFirstFailureSocratic
            ? [coachReport.socraticFirstAttemptHint]
            : [
                  coachReport.headerSeverityLine,
                  coachReport.block1WhyError ?? '',
                  optimalWhyWins,
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
            className={`flex-1 min-h-0 w-full rounded-xl border p-2.5 text-xs flex flex-col justify-between overflow-hidden ${
                isFirstFailureSocratic
                    ? 'border-amber-500/60 bg-amber-950/70 text-amber-100'
                    : isNearOptimal
                        ? 'border-teal-400/60 bg-teal-950/65 text-teal-100'
                        : validationResult.isCorrect
                            ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100'
                            : 'border-rose-500/60 bg-rose-950/70 text-rose-100'
            }`}
        >
            <div className="space-y-1.5 overflow-y-auto pr-0.5">
                {/* 1. BANNIÈRE CHIFFRÉE */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5" data-testid="coach-verdict-header">
                    <span
                        title="ER / PR : Error Rate / Performance Rating officiel (0.0 = Perfection, 30.0 = Novice)"
                        className="font-mono text-xs font-black text-white"
                    >
                        {isBeginner
                            ? validationResult.isCorrect
                                ? 'Coup Optimal ! (+100% de chances de victoire préservées)'
                                : `Erreur (-${coachReport.extractorFacts.winChanceLossPct.toFixed(1)}% de chances de victoire)`
                            : isFirstFailureSocratic
                                ? `1er Essai Imprécis (${coachReport.extractorFacts.deltaEmg.toFixed(3)} EMG | Impact ER / PR : +0.2 | Essais : 1/2 ●○)`
                                : isNearOptimal
                                    ? gateCheck.feedbackMessage
                                    : coachReport.headerSeverityLine}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {!validationResult.isCorrect && (
                            <span
                                data-testid="coach-win-drop-badge"
                                className="rounded-md border border-rose-400/60 bg-rose-500/25 px-2 py-0.5 font-mono text-[10px] font-extrabold text-rose-200"
                            >
                                {coachReport.winChanceDropBadge}
                            </span>
                        )}
                        <button
                            type="button"
                            data-testid="drill-voice-listen-btn"
                            onClick={handleListenExplanation}
                            className="rounded border border-white/15 bg-[#050505] px-2 py-0.5 text-[10px] font-bold text-[#e2d2b5] hover:text-white transition"
                        >
                            {isSpeaking ? 'Stop' : 'Écouter'}
                        </button>
                    </div>
                </div>

                <span className="sr-only">Coach Pédagogique</span>

                {/* 2. CORPS PÉDAGOGIQUE : SOCRATIQUE (Essai 1/2) OU SOLUTION 3-PLY COMPLÈTE */}
                {isFirstFailureSocratic ? (
                    <div className="space-y-1.5 rounded-xl bg-[#050505]/80 p-2.5 text-xs leading-snug" data-testid="socratic-first-attempt-box">
                        <div className="font-bold text-amber-300">
                            Indice Socratique (2e chance — réduisez votre pénalité de moitié !) :
                        </div>
                        <p className="text-amber-100">{coachReport.socraticFirstAttemptHint}</p>
                    </div>
                ) : (
                    <div className="space-y-1.5 rounded-xl bg-[#050505]/75 p-2 text-xs leading-snug">
                        {isCube && cubeTelemetry && (
                            <div
                                data-testid="drill-cube-telemetry-badge"
                                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#12151C] px-2.5 py-1 text-[11px] font-mono font-bold"
                            >
                                <span className="text-emerald-400" data-testid="cube-win-pct">
                                    {isEn ? `Win: ${cubeTelemetry.winPct}%` : `% de victoire : ${cubeTelemetry.winPct}%`}
                                </span>
                                <span className="text-amber-400" data-testid="cube-gammon-pct">
                                    {isEn ? `Gammon: ${cubeTelemetry.gammonPct}%` : `% de Gammon : ${cubeTelemetry.gammonPct}%`}
                                </span>
                                <span className="text-cyan-400" data-testid="cube-take-point-pct">
                                    {isEn ? `Take Point: ${cubeTelemetry.takePointPct}%` : `Seuil de prise (Take Point) : ${cubeTelemetry.takePointPct}%`}
                                </span>
                            </div>
                        )}
                        {!validationResult.isCorrect && coachReport.block1WhyError && (
                            <div data-testid="coach-block-1-error" className="text-rose-200">
                                <span className="font-bold text-rose-300">1. Pourquoi ton coup est une erreur : </span>
                                <span>{coachReport.block1WhyError}</span>
                            </div>
                        )}
                        <div data-testid="coach-block-2-optimal" className="text-emerald-200">
                            <span className="font-bold text-emerald-300">
                                {isNearOptimal
                                    ? 'Nuance 3-ply (Comment gagner +0.010 EMG) : '
                                    : validationResult.isCorrect
                                        ? 'Pourquoi ce coup est optimal : '
                                        : '2. Pourquoi le coup optimal gagne : '}
                            </span>
                            <span>{optimalWhyWins}</span>
                        </div>
                        <div
                            data-testid="coach-block-3-rule"
                            className="rounded-lg border border-[#D4AF37]/35 bg-[#12151C] px-2 py-1 font-semibold text-[#fdf8eb]"
                        >
                            {coachReport.block3RuleOfThumb}
                        </div>
                        {fsrsScheduled && !validationResult.isCorrect && (
                            <div
                                data-testid="fsrs-scheduled-badge"
                                className="rounded border border-amber-400/40 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-200"
                            >
                                Carte de révision FSRS v5 ajoutée à vos Blunders Personnels (ΔEMG ≥ 0.080)
                            </div>
                        )}
                    </div>
                )}

                {!isFirstFailureSocratic && isErMode && !isBeginner && <DrillPrMathRankingTable rows={mathRankingRows} />}
            </div>

            {/* 3. BOUTONS D'ACTION TOUJOURS VISIBLES EN BAS (Zéro Scroll) */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1.5 shrink-0">
                {!validationResult.isCorrect && !isFirstFailureSocratic && (
                    <button
                        type="button"
                        onClick={handleToggleThreat}
                        data-testid="drill-show-threat-btn"
                        className={`rounded-xl border px-2 py-1 text-[11px] font-bold transition ${
                            threatHighlighted
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]'
                                : 'border-white/15 bg-[#050505] text-slate-200 hover:border-[#D4AF37]/60'
                        }`}
                    >
                        Voir la menace sur le plateau
                    </button>
                )}
                {!validationResult.isCorrect && handleRetry && (
                    <button
                        type="button"
                        onClick={handleRetry}
                        data-testid="drill-retry-btn"
                        className="rounded-xl border border-amber-400/60 bg-amber-950/80 px-2.5 py-1 text-[11px] font-bold text-amber-100 hover:bg-amber-900 transition"
                    >
                        {isFirstFailureSocratic ? '2e Essai (Corriger)' : 'Réessayer'}
                    </button>
                )}
                {!isFirstFailureSocratic && (
                    <button
                        type="button"
                        onClick={onNextBlunder}
                        data-testid="drill-next-btn"
                        className="flex-1 sm:flex-none rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                    >
                        <span>Suivant →</span>
                        <span className="sr-only">Puzzle Suivant Question suivante →</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default React.memo(DrillCoachFeedback);
