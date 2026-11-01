'use client';

/**
 * @file src/components/drills/DrillHeader.tsx
 * @description Barre supérieure unifiée du Quiz (Architecture Tesla 3-Secondes / Monte-Carlo) :
 * - Affiche clairement et sans troncature : `📐 Quiz ER / PR` (ou `🧠 Quiz ERH`).
 * - Affiche séparément en haut à droite :
 *   1. `ER / PR : 6.3` (avec badge d'évolution par dixièmes après clic : `▼ -0.1 (Progression)` en vert ou `▲ +0.4 (Erreur)` en rouge)
 *   2. `ERH : 6.1`
 *   3. `Rating : 1500`
 * - Strictement < 160 lignes, 0 `any`.
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
    readonly erPrScore?: number;
    readonly erhScore?: number;
    readonly activeTenthsDelta?: number;
    readonly liveRatingValue?: number;
    readonly liveRatingDelta?: number;
    readonly onResetAllMastery: () => void;
    readonly onClose?: () => void;
}

const BACK_BTN_CLS =
    'inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/50 bg-[#050505] px-2 py-1 text-[11px] font-extrabold text-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition shadow shrink-0';

export const DrillHeader: React.FC<DrillHeaderProps> = ({
    stats,
    adaptiveProfile,
    activeCategoryId,
    adaptiveReasonLabel,
    drillMode = 'adaptive',
    personalBlundersCount = 0,
    onSelectDrillMode,
    erPrScore = 6.3,
    erhScore = 6.1,
    activeTenthsDelta = 0,
    liveRatingValue = 1500,
    liveRatingDelta = 0,
    onResetAllMastery,
    onClose,
}) => {
    const isErMode = drillMode === 'pr_math';
    const seenCount = adaptiveProfile?.seenQuizIds.length ?? 0;
    const modeLabel = isErMode ? 'ER' : 'ERH';
    const isImprovedTenths = activeTenthsDelta < 0;

    return (
        <div className="w-full shrink-0">
            <header className="w-full flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#12151C] px-2.5 py-2 shadow-md">
                <div className="flex items-center gap-2 shrink-0">
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
                        title={isErMode ? 'ER / PR : Error Rate / Performance Rating (0.0 = Perfection, 30.0 = Novice)' : ERH_TOOLTIP_TEXT}
                        className="whitespace-nowrap shrink-0 text-xs sm:text-sm font-black tracking-tight text-[#fdf8eb]"
                    >
                        {isErMode ? '📐 Quiz ER / PR' : '🧠 Quiz ERH'}
                        <span className="sr-only">Parcours Adaptatif IA</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0" data-testid="quiz-live-rating-badge">
                    <span className="sr-only">Niveau {modeLabel} : {liveRatingValue}</span>
                    <span
                        data-testid="quiz-target-metric-badge"
                        title="ER / PR : Error Rate / Performance Rating officiel (échelle 0.0 à 30.0 — plus bas est meilleur)"
                        className="inline-flex items-center rounded-lg border border-emerald-400/50 bg-emerald-950/60 px-2 py-0.5 font-mono text-[11px] font-black text-emerald-200"
                    >
                        ER / PR : {erPrScore.toFixed(1)}
                        <span className="sr-only">Cible ER / PR : ~6.5 (Intermédiaire)</span>
                    </span>
                    <span
                        data-testid="quiz-erh-metric-badge"
                        title={ERH_TOOLTIP_TEXT}
                        className="inline-flex items-center rounded-lg border border-[#D4AF37]/60 bg-[#050505] px-2 py-0.5 font-mono text-[11px] font-black text-[#D4AF37]"
                    >
                        ERH : {erhScore.toFixed(1)}
                    </span>
                    <span
                        data-testid="quiz-elo-rating-badge"
                        className="inline-flex items-center rounded-lg border border-white/15 bg-[#050505] px-2 py-0.5 font-mono text-[11px] font-black text-[#fdf8eb]"
                    >
                        Rating : {liveRatingValue}
                        <span className="sr-only">Rating : {liveRatingValue} Elo</span>
                    </span>
                    {activeTenthsDelta !== 0 && (
                        <span
                            data-testid="quiz-live-rating-delta"
                            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black transition-all ${
                                isImprovedTenths
                                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                                    : 'border-rose-400/60 bg-rose-500/20 text-rose-300'
                            }`}
                        >
                            {isImprovedTenths
                                ? `▼ ${activeTenthsDelta.toFixed(1)} (Progression)`
                                : `▲ +${activeTenthsDelta.toFixed(1)} (Erreur)`}
                            <span className="sr-only">{liveRatingDelta > 0 ? `+${liveRatingDelta}` : `${liveRatingDelta}`}</span>
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
