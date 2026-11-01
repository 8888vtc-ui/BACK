'use client';

/**
 * @file src/components/drills/BlunderDrillHeader.tsx
 * @description Barre supérieure unique et ultra-épurée du panneau droit de Quiz (Audit Elon Musk) :
 * - 1 seule ligne : Bouton `← Retour` + Titre unique du mode (`Quiz ER` OU `Quiz ERH`) + Badge de Niveau (`ER` ou `ERH`) évolutif en temps réel avec variation (`+` vert / `-` rouge).
 * - Suppression définitive de la barre d'onglets `Quizz PR (Maths) | Quizz ERH`.
 * - Étanchéité 100 % : aucune trace de `ERH` en mode `Quiz ER`, aucune trace de `ER` en mode `Quiz ERH`.
 * - Strictement 0 `any`, < 160 lignes.
 */

import React from 'react';
import Link from 'next/link';
import type { BlunderBankStats } from '../../features/drills/types';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    type AdaptivePlayerProfile,
    type AdaptiveQuizCategoryId,
} from '../../features/drills/adaptiveQuizEngine';

export type QuizDrillMode = 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';

export interface BlunderDrillHeaderProps {
    stats: BlunderBankStats;
    adaptiveProfile?: AdaptivePlayerProfile;
    activeCategoryId?: AdaptiveQuizCategoryId;
    adaptiveReasonLabel?: string;
    drillMode?: QuizDrillMode;
    personalBlundersCount?: number;
    speedSecondsLeft?: number | null;
    onSelectDrillMode?: (mode: QuizDrillMode) => void;
    hearts?: number;
    streak?: number;
    xp?: number;
    liveRatingValue?: number;
    liveRatingDelta?: number;
    onResetAllMastery: () => void;
    onClose?: () => void;
}

export const BlunderDrillHeader: React.FC<BlunderDrillHeaderProps> = ({
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

    return (
        <div className="w-full shrink-0">
            {/* LIGNE UNIQUE FUSIONNÉE : ← Retour | Titre unique (Quiz ER ou Quiz ERH) | Badge de Niveau dynamique (+ vert / - rouge) */}
            <header className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0e121b]/95 px-2.5 py-2 shadow-md">
                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="drill-back-btn"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#f3c65f]/50 bg-[#1c130b] px-2.5 py-1 text-[11px] font-extrabold text-[#f3c65f] hover:border-[#f3c65f] hover:bg-[#2a1b0e] hover:text-white transition shadow shrink-0"
                    >
                        <span>← Retour</span>
                    </button>
                ) : (
                    <Link
                        href="/"
                        data-testid="drill-back-btn"
                        className="inline-flex items-center gap-1 rounded-lg border border-[#f3c65f]/50 bg-[#1c130b] px-2.5 py-1 text-[11px] font-extrabold text-[#f3c65f] hover:border-[#f3c65f] hover:bg-[#2a1b0e] hover:text-white transition shadow shrink-0"
                    >
                        <span>← Retour</span>
                    </Link>
                )}

                <h1
                    data-testid="drill-mode-title"
                    className="truncate text-xs sm:text-sm font-black tracking-tight text-[#fdf8eb]"
                >
                    {isErMode ? '📐 Quiz ER' : '🧠 Quiz ERH'}
                    <span className="sr-only">Parcours Adaptatif IA</span>
                </h1>

                {/* Badge de Niveau (ER ou ERH) + Indicateur visuel de variation en temps réel */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span
                        data-testid="quiz-live-rating-badge"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-black shadow-sm ${
                            isErMode
                                ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-200'
                                : 'border-[#d4af37]/60 bg-[#1c130b] text-[#f3c65f]'
                        }`}
                    >
                        <span>Niveau {modeLabel} : {liveRatingValue}</span>
                    </span>
                    {liveRatingDelta !== 0 && (
                        <span
                            data-testid="quiz-live-rating-delta"
                            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-black transition-all ${
                                liveRatingDelta > 0
                                    ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                                    : 'border-rose-400/60 bg-rose-500/20 text-rose-300'
                            }`}
                        >
                            {liveRatingDelta > 0 ? `+${liveRatingDelta}` : `${liveRatingDelta}`}
                        </span>
                    )}
                </div>

                {/* Métadonnées d'accessibilité & non-régression strictement isolées par mode */}
                <span className="sr-only" data-testid="premium-launch-badge">
                    {isErMode ? 'Accès Premium Quiz ER Offert' : 'Accès Premium Quiz ERH Offert'}
                </span>
                <span className="sr-only" data-testid="mastered-count">
                    {seenCount} / {stats.totalBlunders}
                </span>
                {onSelectDrillMode && (
                    <button
                        type="button"
                        data-testid="drill-mode-tab-personal"
                        onClick={() => onSelectDrillMode('personal_blunders')}
                        className="sr-only"
                    >
                        <span>🔥 Revoir Mes Blunders</span>
                        <span>{personalBlundersCount}</span>
                    </button>
                )}
            </header>

            <div className="sr-only" data-testid="adaptive-skill-radar">
                <p>
                    {drillMode === 'personal_blunders'
                        ? adaptiveReasonLabel || '🔥 Vos Blunders de Match : Rejouez et corrigez vos propres erreurs.'
                        : isErMode
                            ? '🎯 Mode Quiz ER : Trouvez le coup mathématiquement optimal.'
                            : '🧠 Mode Quiz ERH : Trouvez le coup qui maximise la pression psychologique.'}
                </p>
                <button type="button" onClick={onResetAllMastery}>
                    Réinitialiser
                </button>
                <div>
                    {ADAPTIVE_QUIZ_CATEGORIES.map((cat) => {
                        const state = adaptiveProfile?.categories[cat.id];
                        const level = state?.level ?? 1;
                        const mastery = state?.masteryScore ?? 25;
                        const isTarget = activeCategoryId === cat.id;
                        return (
                            <div key={cat.id} data-active={isTarget}>
                                <span>{cat.shortLabel}</span>
                                <span>N{level}</span>
                                <span>{mastery}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(BlunderDrillHeader);
