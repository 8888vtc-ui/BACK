'use client';

/**
 * Barre High-Dopamine & Rivaux IA (« Dopamine Juice Banner », < 210 lignes, 0 any).
 *
 * Réunit les 4 mécaniques d'addiction saine et de tension dramatique contre l'IA :
 *   1. 🎭 Rival IA Incarné (Boss Ladder) avec avatar, PR cible et réplique réactive en direct.
 *   2. ✨ Badge « Coup Brillant !! » (seul coup optimal avec écart >= 0.060 Eq) & « Combo de Maître xN ».
 *   3. 🎰 Tension Dramatique du Videau (« High Stakes Cube » x2, x4, x8 ou Quitte ou Double).
 *   4. 👻 Défi « Ghost Match / Balle de Match » (retour 1-clic sur la pire gaffe pour inverser le match)
 *      & « 🔥 Revanche » immédiate zéro-friction.
 */

import React, { useMemo } from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoachHelpers';
import {
    getAiRivalForDifficulty,
    computeDopamineMetricsFromHistory,
    resolveAiRivalQuote,
} from '../../lib/gameFeel/aiRivals';
import { useTranslation } from '../../i18n';

export interface DopamineJuiceBannerProps {
    readonly difficulty?: AIDifficulty;
    readonly coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    readonly cubeValue?: number;
    readonly doublingOfferedBy?: Player | null;
    readonly onTriggerGhostChallenge?: (turnIndex: number) => void;
    readonly onInstantRematch?: () => void;
    readonly locale?: string;
}

const DopamineJuiceBannerComponent: React.FC<DopamineJuiceBannerProps> = ({
    difficulty = 'expert',
    coachHistory = [],
    cubeValue = 1,
    doublingOfferedBy = null,
    onTriggerGhostChallenge,
    onInstantRematch,
    locale,
}) => {
    const { locale: contextLocale } = useTranslation();
    const activeLocale = (locale ?? contextLocale) as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja';
    const isEn = activeLocale !== 'fr';
    const rival = useMemo(() => getAiRivalForDifficulty(difficulty, activeLocale), [difficulty, activeLocale]);

    const metrics = useMemo(
        () => computeDopamineMetricsFromHistory(coachHistory),
        [coachHistory],
    );

    const rivalQuote = useMemo(
        () =>
            resolveAiRivalQuote({
                rival,
                metrics,
                cubeValue,
                doublingOffered: doublingOfferedBy !== null,
                locale: activeLocale,
            }),
        [rival, metrics, cubeValue, doublingOfferedBy, activeLocale],
    );

    const isHighStakes = doublingOfferedBy !== null || cubeValue >= 2;
    const worstBlunder = metrics.worstBlunderEntry;

    return (
        <section
            data-testid="dopamine-juice-banner"
            aria-label={isEn ? 'AI Rival & Live Match Tension' : 'Rival IA & Tension Temps Réel'}
            className="hidden md:flex w-full max-w-[1260px] mx-auto shrink-0 h-8 max-h-8 flex-nowrap items-center justify-between gap-2 overflow-x-auto whitespace-nowrap rounded-xl border border-[#d4af37]/40 bg-gradient-to-r from-[#140b06]/95 via-[#1c1008]/95 to-[#120a05]/95 px-2.5 py-0.5 text-[11px] text-amber-50 shadow-[0_6px_18px_rgba(0,0,0,0.65)] z-30"
        >
            {/* 1. Rival IA Incarné (Boss Ladder) + Bulle Réactive */}
            <div
                data-testid="dopamine-ai-rival-card"
                className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden"
            >
                <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#f3c65f]/60 bg-[#2a170b] text-xs shadow-inner"
                >
                    {rival.avatar}
                </span>
                <div className="min-w-0 flex flex-nowrap items-center gap-1.5 overflow-hidden">
                    <span className="font-serif font-black text-[#f3c65f] tracking-wide whitespace-nowrap">
                        {rival.name}
                    </span>
                    <span className="hidden sm:inline text-[11px] font-semibold text-amber-200/80 whitespace-nowrap">
                        · {isEn ? rival.titleEn : rival.titleFr}
                    </span>
                    <span
                        data-testid="dopamine-ai-rival-pr"
                        className="rounded border border-amber-400/40 bg-black/50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-300"
                    >
                        PR ~{rival.targetPr}
                    </span>
                    <span
                        data-testid="dopamine-ai-rival-quote"
                        className="truncate italic text-[11px] text-slate-200 max-w-[260px] sm:max-w-[380px] xl:max-w-[520px]"
                        title={rivalQuote}
                    >
                        « {rivalQuote} »
                    </span>
                </div>
            </div>

            {/* 2. Badges Dopamine : Coup Brillant !! + Combo de Maître + Tension Videau + Défi Ghost */}
            <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                {metrics.isBrilliantMove && (
                    <span
                        data-testid="dopamine-brilliant-badge"
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/80 bg-gradient-to-r from-cyan-950/90 via-teal-900/90 to-emerald-950/90 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)] animate-pulse"
                        title={
                            isEn
                                ? `Unique best move! Second choice lost -${metrics.brilliantMarginEq.toFixed(3)} Eq`
                                : `Seul coup optimal ! Le 2e choix perdait -${metrics.brilliantMarginEq.toFixed(3)} Eq`
                        }
                    >
                        <span aria-hidden="true">💎</span>
                        <span>
                            {isEn ? 'BRILLIANT !!' : 'COUP BRILLANT !!'} (+{metrics.brilliantMarginEq.toFixed(3)})
                        </span>
                    </span>
                )}

                {metrics.optimalStreak >= 1 && (
                    <span
                        data-testid="dopamine-combo-badge"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-extrabold tracking-wide ${
                            metrics.optimalStreak >= 3
                                ? 'border-amber-300/85 bg-gradient-to-r from-amber-600/35 to-emerald-600/35 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                : 'border-emerald-500/50 bg-emerald-950/75 text-emerald-200'
                        }`}
                    >
                        <span aria-hidden="true">{metrics.optimalStreak >= 3 ? '🔥' : '⚡'}</span>
                        <span>
                            {metrics.optimalStreak >= 3
                                ? isEn
                                    ? `MASTER COMBO x${metrics.optimalStreak}`
                                    : `COMBO MAÎTRE x${metrics.optimalStreak}`
                                : isEn
                                  ? `Optimal x${metrics.optimalStreak}`
                                  : `Série Optimale x${metrics.optimalStreak}`}
                        </span>
                    </span>
                )}

                {/* 3. Tension Dramatique du Videau (High Stakes Cube) */}
                {isHighStakes && (
                    <span
                        data-testid="dopamine-cube-stakes"
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-bold ${
                            doublingOfferedBy !== null
                                ? 'border-rose-400/90 bg-rose-950/90 text-rose-100 animate-pulse shadow-[0_0_14px_rgba(244,63,94,0.45)]'
                                : 'border-amber-400/75 bg-amber-950/80 text-amber-200'
                        }`}
                    >
                        <span aria-hidden="true">🎰</span>
                        <span>
                            {doublingOfferedBy !== null
                                ? isEn
                                    ? `DOUBLE OR NOTHING x${cubeValue * 2}!`
                                    : `QUITTE OU DOUBLE x${cubeValue * 2} !`
                                : isEn
                                  ? `HIGH STAKES x${cubeValue}`
                                  : `HAUTE TENSION x${cubeValue}`}
                        </span>
                    </span>
                )}

                {/* 4. Défi « Ghost Match / Balle de Match » (1-clic retour à la pire erreur) */}
                {worstBlunder && onTriggerGhostChallenge && (
                    <button
                        type="button"
                        data-testid="dopamine-ghost-challenge-btn"
                        onClick={() => onTriggerGhostChallenge(worstBlunder.turnIndex)}
                        title={
                            isEn
                                ? `Rewind to Turn #${worstBlunder.turnIndex} (-${Math.abs(worstBlunder.coachState.equityLoss).toFixed(3)} Eq) and beat your ghost!`
                                : `Revenir au Tour #${worstBlunder.turnIndex} (-${Math.abs(worstBlunder.coachState.equityLoss).toFixed(3)} Eq) pour inverser le destin du match !`
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-400/75 bg-gradient-to-r from-purple-950/90 to-indigo-950/90 px-2 py-0.5 font-mono text-[10px] font-extrabold text-purple-100 hover:border-purple-300 hover:text-white transition active:scale-95"
                    >
                        <span aria-hidden="true">👻</span>
                        <span>
                            {isEn
                                ? `Ghost Challenge (#${worstBlunder.turnIndex})`
                                : `Défi Ghost (Tour #${worstBlunder.turnIndex})`}
                        </span>
                    </button>
                )}

                {onInstantRematch && (
                    <button
                        type="button"
                        data-testid="dopamine-instant-rematch-btn"
                        onClick={onInstantRematch}
                        title={
                            isEn
                                ? `Instant rematch against ${rival.name}`
                                : `Revanche immédiate contre ${rival.name}`
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/55 bg-[#261409] px-2 py-0.5 text-[10px] font-bold text-[#f7e5b7] hover:border-[#f3c65f] hover:text-white transition active:scale-95"
                    >
                        <span aria-hidden="true">🔥</span>
                        <span className="hidden sm:inline">{isEn ? 'Rematch' : 'Revanche'}</span>
                    </button>
                )}
            </div>
        </section>
    );
};

export const DopamineJuiceBanner = React.memo(DopamineJuiceBannerComponent);
export default DopamineJuiceBanner;
