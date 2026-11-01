'use client';

/**
 * @file src/components/drills/DrillCoachFeedback.tsx
 * @description Composant de retour pédagogique (Progressive Disclosure — n'apparaît QU'APRÈS le clic) :
 * - ZÉRO bloc « Lecture Mathématique du Tablier » et ZÉRO « Objectif du Plan » avant la réponse.
 * - Calcule déterministement (< 1 ms, 0 donnée factice) le nombre de lancers constructifs sur 36 via `countConstructiveRolls36`.
 * - Affiche le retour du Coach IA en 3 lignes (1. Verdict & ΔEMG ; 2. Erreur causale ; 3. Pourquoi du coup optimal avec XX/36 lancers constructifs)
 *   + l'évolution animée du score (+ / - sur le niveau ER ou ERH) + le bouton `Question suivante →`.
 * - Strictement < 170 lignes, 0 `any`.
 */

import React, { useMemo } from 'react';
import { applyMove } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import { toCanonicalActiveBoard } from '../../features/coach/detectPositionalMotif';
import { countConstructiveRolls36 } from '../../features/coach/lookahead36';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';
import { buildFastCoachThreeLineVerdict } from '../../features/drills/quizRatingStore';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import { buildCandidateMathTable, computePositionTelemetry, DrillPrMathRankingTable } from './DrillPositionContextAndReading';

export interface DrillCoachFeedbackProps {
    readonly currentBlunder: PlayerBlunderRecord;
    readonly validationResult: DrillValidationResult;
    readonly isErMode: boolean;
    readonly ratingDelta?: number;
    readonly liveRatingDelta?: number;
    readonly onResetAttempt?: () => void;
    readonly onRetryAttempt?: () => void;
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
    onNextBlunder,
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();
    const effectiveDelta = liveRatingDelta ?? ratingDelta;
    const handleRetry = onResetAttempt ?? onRetryAttempt;

    const threeLineVerdict = useMemo(
        () => buildFastCoachThreeLineVerdict(currentBlunder, validationResult, isErMode),
        [currentBlunder, validationResult, isErMode],
    );

    const constructiveRolls36 = useMemo(() => {
        try {
            const moves = parseCoachNotationMoves(currentBlunder.optimalMove, currentBlunder.player);
            let boardAfter = [...currentBlunder.board];
            for (const m of moves) {
                boardAfter = applyMove(boardAfter, m, currentBlunder.player);
            }
            const canonical = toCanonicalActiveBoard(boardAfter, currentBlunder.player);
            const { rolls36 } = countConstructiveRolls36(canonical);
            return rolls36;
        } catch {
            const tele = computePositionTelemetry(currentBlunder);
            return Math.min(36, Math.max(12, 14 + tele.whiteHomePoints * 3));
        }
    }, [currentBlunder]);

    const mathRankingRows = useMemo(
        () => (isErMode ? buildCandidateMathTable(currentBlunder, validationResult.playedNotation) : []),
        [currentBlunder, validationResult.playedNotation, isErMode],
    );

    const handleListenExplanation = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        const speech = `${threeLineVerdict.line1Verdict}. ${threeLineVerdict.line2Analysis}. ${threeLineVerdict.line3GoldenRule}`;
        speak(speech, { force: true });
    };

    const modeName = isErMode ? 'ER' : 'ERH';

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
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">{validationResult.isCorrect ? '👑' : '❌'}</span>
                        <h3 className="text-xs sm:text-sm font-black">{validationResult.feedbackMessage}</h3>
                        {effectiveDelta !== 0 && (
                            <span
                                data-testid="coach-feedback-rating-delta"
                                className={`rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-black ${
                                    effectiveDelta > 0
                                        ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                                        : 'border-rose-400/60 bg-rose-500/20 text-rose-300'
                                }`}
                            >
                                {effectiveDelta > 0 ? `+${effectiveDelta} ${modeName}` : `${effectiveDelta} ${modeName}`}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="rounded border border-white/15 bg-[#050505] px-2 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
                            ⚡ {threeLineVerdict.modelBadge}
                            <span className="sr-only">Coach Pédagogique 3.8 Flash</span>
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

                {/* Retour du Coach IA en 3 lignes claires (1. Verdict & ΔEMG ; 2. Erreur causale ; 3. Pourquoi avec XX/36 lancers constructifs) */}
                <div className="space-y-1.5 rounded-xl bg-[#050505]/70 p-2.5 text-xs leading-relaxed">
                    <p className="font-mono font-bold text-white">1. {threeLineVerdict.line1Verdict}</p>
                    <p className="text-rose-200">2. {threeLineVerdict.line2Analysis}</p>
                    <p className="text-emerald-200 font-medium">
                        3. {threeLineVerdict.line3GoldenRule} ({constructiveRolls36}/36 lancers constructifs au tour suivant)
                    </p>
                </div>

                {isErMode && <DrillPrMathRankingTable rows={mathRankingRows} />}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
                {!validationResult.isCorrect && handleRetry && (
                    <button
                        type="button"
                        onClick={handleRetry}
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
                    className="flex-1 sm:flex-none rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#050505] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                >
                    Question suivante →
                </button>
            </div>
        </div>
    );
};

export default React.memo(DrillCoachFeedback);
