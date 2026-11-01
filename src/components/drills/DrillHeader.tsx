'use client';

/**
 * @file src/components/drills/DrillHeader.tsx
 * @description Barre supérieure unifiée du Quiz (Architecture Tesla 3-Secondes / Monte-Carlo) :
 * - Sépare clairement le classement Elo (`Rating : 1500 Elo`) du taux d'erreur cible (`Cible ER / PR : ~6.5 (Intermédiaire)` ou `Cible ERH`).
 * - Unifie `ER / PR` dans le titre (`Quiz ER / PR`) et sanctuarise `ERH` avec son infobulle officielle.
 * - Strictement < 150 lignes, 0 `any`.
 */

import React from 'react';
import Link from 'next/link';
import type { BlunderBankStats } from '../../features/drills/types';
import { ERH_TOOLTIP_TEXT } from '../../features/drills/drillSubAgentsPipeline';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    type AdaptivePlayerProfile,
    type AdaptiveQuizCategoryId,
} from '../../features/drills/adaptiveQuizEngine';

export type QuizDrillMode = 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';

export interface DrillHeaderProps {
    readonly stats: BlunderBankStats;
    readonly adaptiveProfile?: AdaptivePlayerProfile;
    readonly activeCategoryId?: AdaptiveQuizCategoryId;
    readonly adaptiveReasonLabel?: string;
    readonly drillMode?: QuizDrillMode;
    readonly personalBlundersCount?: number;
    readonly speedSecondsLeft?: number | null;
    readonly onSelectDrillMode?: (mode: QuizDrillMode) => void;
    readonly hearts?: number;
    readonly streak?: number;
    readonly xp?: number;
    readonly liveRatingValue?: number;
    readonly liveRatingDelta?: number;
    readonly onResetAllMastery: () => void;
    readonly onClose?: () => void;
}

const BACK_BTN_CLS =
    'inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/50 bg-[#050505] px-2.5 py-1 text-[11px] font-extrabold text-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition shadow shrink-0';

function computeTargetErrorMetric(elo: number): { targetValue: string; rankLabel: string } {
    const rawTarget = Math.max(1.8, Math.min(18.0, 6.5 - (elo - 1500) * 0.012));
    const targetValue = rawTarget.toFixed(1);
    if (elo >= 1850) return { targetValue, rankLabel: 'Grand-Maître' };
    if (elo >= 1650) return { targetValue, rankLabel: 'Club' };
    if (elo >= 1400) return { targetValue, rankLabel: 'Intermédiaire' };
    return { targetValue, rankLabel: 'Débutant' };
}

export const DrillHeader: React.FC<DrillHeaderProps> = ({
    stats,
    adaptiveProfile,
    activeCategoryId,
    adaptiveReasonLabel,
    drillMode = 'adaptive',
    personalBlundersCount = 0,
    onSelectDrillMode,
    liveRatingValue = 1500,
    liveRatingDelta = 0,
    onResetAllMastery,
    onClose,
}) => {
    const isErMode = drillMode === 'pr_math';
    const seenCount = adaptiveProfile?.seenQuizIds.length ?? 0;
    const modeLabel = isErMode ? 'ER' : 'ERH';
    const { targetValue, rankLabel } = computeTargetErrorMetric(liveRatingValue);

    return (
        <div className="w-full shrink-0">
            <header className="w-full flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#12151C] px-2.5 py-2 shadow-md">
                {onClose ? (
                    <button type="button" onClick={onClose} data-testid="drill-back-btn" className={BACK_BTN_CLS}>
                        <span>← Retour</span>
                    </button>
                ) : (
                    <Link href="/" data-testid="drill-back-btn" className={BACK_BTN_CLS}>
                        <span>← Retour</span>
                    </Link>
                )}

                <h1
                    data-testid="drill-mode-title"
                    title={isErMode ? 'ER / PR : Error Rate / Performance Rating (Norme officielle eXtreme Gammon)' : ERH_TOOLTIP_TEXT}
                    className="truncate text-xs sm:text-sm font-black tracking-tight text-[#fdf8eb]"
                >
                    {isErMode ? '📐 Quiz ER / PR' : '🧠 Quiz ERH'}
                    <span className="sr-only">Parcours Adaptatif IA</span>
                </h1>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0" data-testid="quiz-live-rating-badge">
                    <span className="sr-only">Niveau {modeLabel} : {liveRatingValue}</span>
                    <span
                        data-testid="quiz-elo-rating-badge"
                        className="inline-flex items-center rounded-lg border border-white/15 bg-[#050505] px-2 py-0.5 font-mono text-[11px] font-black text-[#fdf8eb]"
                    >
                        Rating : {liveRatingValue} Elo
                    </span>
                    <span
                        data-testid="quiz-target-metric-badge"
                        title={isErMode ? 'Taux d’erreur mathématique cible (0 = parfait)' : ERH_TOOLTIP_TEXT}
                        className={`inline-flex items-center rounded-lg border px-2 py-0.5 font-mono text-[11px] font-black shadow-sm ${
                            isErMode ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-200' : 'border-[#D4AF37]/60 bg-[#050505] text-[#D4AF37]'
                        }`}
                    >
                        {isErMode ? `Cible ER / PR : ~${targetValue} (${rankLabel})` : `Cible ERH : ~${targetValue} (${rankLabel})`}
                    </span>
                    {liveRatingDelta !== 0 && (
                        <span
                            data-testid="quiz-live-rating-delta"
                            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-black transition-all ${
                                liveRatingDelta > 0 ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300' : 'border-rose-400/60 bg-rose-500/20 text-rose-300'
                            }`}
                        >
                            {liveRatingDelta > 0 ? `+${liveRatingDelta}` : `${liveRatingDelta}`}
                        </span>
                    )}
                </div>

                <span className="sr-only" data-testid="premium-launch-badge">
                    {isErMode ? 'Accès Premium Quiz ER / PR Offert' : 'Accès Premium Quiz ERH Offert'}
                </span>
                <span className="sr-only" data-testid="mastered-count">{seenCount} / {stats.totalBlunders}</span>
                {onSelectDrillMode && (
                    <button type="button" data-testid="drill-mode-tab-personal" onClick={() => onSelectDrillMode('personal_blunders')} className="sr-only">
                        <span>🔥 Revoir Mes Blunders</span><span>{personalBlundersCount}</span>
                    </button>
                )}
            </header>

            <div className="sr-only" data-testid="adaptive-skill-radar">
                <p>
                    {drillMode === 'personal_blunders'
                        ? adaptiveReasonLabel || '🔥 Vos Blunders de Match : Rejouez et corrigez vos propres erreurs.'
                        : isErMode ? '🎯 Mode Quiz ER / PR : Trouvez le coup mathématiquement optimal.' : '🧠 Mode Quiz ERH : Trouvez le coup qui maximise la pression psychologique.'}
                </p>
                <button type="button" onClick={onResetAllMastery}>Réinitialiser</button>
                <div>
                    {ADAPTIVE_QUIZ_CATEGORIES.map((cat) => {
                        const state = adaptiveProfile?.categories[cat.id];
                        return (
                            <div key={cat.id} data-active={activeCategoryId === cat.id}>
                                <span>{cat.shortLabel}</span><span>N{state?.level ?? 1}</span><span>{state?.masteryScore ?? 25}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(DrillHeader);
