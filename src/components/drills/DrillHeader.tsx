'use client';

/**
 * @file src/components/drills/DrillHeader.tsx
 * @description Barre supérieure unifiée du Quiz (Architecture Tesla 3-Secondes / Monte-Carlo) :
 * - Affiche clairement : `Quiz ER / PR` (ou `Mes Erreurs` en mode erreurs personnelles).
 * - Affiche le compteur d'essais `Essais : 2/2` ("Active Recall / 2e Chance") sans emoji système.
 * - Affiche nos 2 indicateurs officiels : `ER / PR` et `Rating` (verrouillés avec cadenas en mode Invité).
 * - Strictement <= 200 lignes, 0 any, 0 PR_ONLY, 0 emoji.
 */

import React from 'react';
import Link from 'next/link';
import { Flame, Target, GraduationCap, Compass, Lock } from 'lucide-react';
import type { BlunderBankStats } from '../../features/drills/types';
import { roundToHalfStep } from '../../features/drills/adaptiveNPlus1Selector';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    type AdaptivePlayerProfile,
    type AdaptiveQuizCategoryId,
} from '../../features/drills/adaptiveQuizEngine';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { useTranslation } from '../../i18n';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';

export type QuizDrillMode = 'adaptive' | 'pr_math' | 'personal_blunders' | 'speed_60s';

export interface DrillHeaderProps {
    readonly stats: BlunderBankStats;
    readonly adaptiveProfile?: AdaptivePlayerProfile;
    readonly activeCategoryId?: AdaptiveQuizCategoryId;
    readonly adaptiveReasonLabel?: string;
    readonly drillMode?: QuizDrillMode;
    readonly personalBlundersCount?: number;
    readonly isPersonalMatchBlunder?: boolean;
    readonly speedSecondsLeft?: number | null;
    readonly onSelectDrillMode?: (mode: QuizDrillMode) => void;
    readonly hearts?: number;
    readonly attemptsLeft?: number;
    readonly maxAttempts?: number;
    readonly streak?: number;
    readonly xp?: number;
    readonly erPrScore?: number;
    readonly activeTenthsDelta?: number;
    readonly liveRatingValue?: number;
    readonly liveRatingDelta?: number;
    readonly targetQuizEr?: number;
    readonly onResetAllMastery: () => void;
    readonly onClose?: () => void;
}

const BACK_BTN_CLS = 'inline-flex items-center gap-1 rounded-lg border border-[#D4AF37]/50 bg-[#050505] px-2 py-1 text-[11px] font-extrabold text-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition shadow shrink-0';

export const DrillHeader: React.FC<DrillHeaderProps> = ({
    stats, adaptiveProfile, activeCategoryId, adaptiveReasonLabel,
    drillMode = 'adaptive', personalBlundersCount = 0, isPersonalMatchBlunder = false,
    onSelectDrillMode, attemptsLeft = 2, maxAttempts = 2, erPrScore = 6.3,
    activeTenthsDelta = 0, liveRatingValue = 1500, liveRatingDelta = 0,
    targetQuizEr, onResetAllMastery, onClose,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { tierGate } = usePlayerTierGate();
    const authenticStats = useAuthenticPlayerStats();
    const isBeginner = tierGate === 'BEGINNER';
    const isPersonal = drillMode === 'personal_blunders' || Boolean(isPersonalMatchBlunder);
    const seenCount = adaptiveProfile?.seenQuizIds.length ?? 0;
    const isImprovedTenths = activeTenthsDelta < 0;
    const heartsDisplay = Array.from({ length: maxAttempts }, (_, idx) => (idx < attemptsLeft ? '●' : '○')).join('');
    const effectiveQuizTargetEr = typeof targetQuizEr === 'number'
        ? roundToHalfStep(targetQuizEr)
        : roundToHalfStep(Math.max(0.5, erPrScore - 0.5));

    const targetBadgeText = isPersonal
        ? (isEn ? `From your match • Quiz Level: ER / PR ${effectiveQuizTargetEr.toFixed(1)}` : `Issu de ton match • Niveau Quiz : ER / PR ${effectiveQuizTargetEr.toFixed(1)}`)
        : (isEn ? `Quiz Calibration: ER / PR ${effectiveQuizTargetEr.toFixed(1)} (N+1 Target)` : `Calibrage Quiz : ER / PR ${effectiveQuizTargetEr.toFixed(1)} (Objectif N+1)`);

    return (
        <div className="w-full shrink-0">
            <header className="w-full flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-[#D4AF37]/30 bg-[#12151C] px-2.5 py-1.5 shadow-md">
                <div className="flex items-center gap-2 shrink-0">
                    {onClose ? (
                        <button type="button" onClick={onClose} data-testid="drill-back-btn" className={BACK_BTN_CLS}><span>{isEn ? '← Back' : '← Retour'}</span></button>
                    ) : (
                        <Link href="/" data-testid="drill-back-btn" className={BACK_BTN_CLS}><span>{isEn ? '← Back' : '← Retour'}</span></Link>
                    )}
                    <h1 data-testid="drill-mode-title" title="ER / PR : Error Rate / Performance Rating (0.0 = Perfection, 30.0 = Novice)" className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs sm:text-sm font-black tracking-tight text-[#fdf8eb]">
                        {drillMode === 'personal_blunders' ? (
                            <><Flame className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} /><span>{isEn ? 'My Blunders' : 'Mes Erreurs'}</span></>
                        ) : isBeginner ? (
                            <><GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>{isEn ? 'Beginner Tactical Challenge' : 'Défi Tactique Débutant'}</span></>
                        ) : (
                            <><Compass className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} /><span>Quiz ER / PR</span></>
                        )}
                        <span className="sr-only">
                            {drillMode === 'personal_blunders' ? 'Mes Erreurs' : 'Quiz ER / PR'} Parcours Adaptatif IA
                        </span>
                    </h1>
                    {isBeginner && (
                        <span data-testid="beginner-friendly-badge" className="rounded border border-emerald-400/40 bg-emerald-950/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                            {isEn ? 'Beginner Accuracy: Simple & Clear' : 'Précision Débutant : Simple & Efficace'}
                        </span>
                    )}
                    <span data-testid="quiz-attempts-counter" title="2 essais maximum par position (Active Recall / 2e Chance)" className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-black ${attemptsLeft === 2 ? 'border-emerald-400/40 bg-emerald-950/50 text-emerald-200' : attemptsLeft === 1 ? 'border-amber-400/50 bg-amber-950/60 text-amber-200' : 'border-rose-400/50 bg-rose-950/60 text-rose-200'}`}>
                        <span>{isEn ? 'Tries:' : 'Essais :'} {attemptsLeft}/{maxAttempts}</span><span>{heartsDisplay}</span>
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-w-0" data-testid="quiz-live-rating-badge">
                    <button
                        type="button"
                        onClick={!authenticStats.canHavePR ? openTermsAndPrPolicyModal : undefined}
                        data-testid="quiz-target-metric-badge"
                        title="ER / PR : Error Rate / Performance Rating officiel (réservé aux comptes connectés — Clause CGU §4)"
                        className="inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-lg border border-emerald-400/50 bg-emerald-950/60 px-2 py-0.5 font-mono text-[11px] font-black text-emerald-200"
                    >
                        {!authenticStats.canHavePR && <Lock className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />}
                        <span>
                            {!authenticStats.canHavePR
                                ? (isEn ? 'PR Locked (Account required — ToS §4)' : 'PR Verrouillé (Compte requis — Clause CGU §4)')
                                : isBeginner
                                ? `${isEn ? 'Accuracy:' : 'Précision :'} ${Math.max(50, Math.round(100 - erPrScore * 1.5))} %`
                                : `ER / PR : ${erPrScore.toFixed(1)}`}
                        </span>
                    </button>
                    <span data-testid="quiz-nplus1-target-badge" title={targetBadgeText} className="inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-lg border border-[#D4AF37]/60 bg-[#050505] px-2 py-0.5 font-mono text-[11px] font-black text-[#D4AF37]">
                        <Target className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>
                            {!authenticStats.canHavePR
                                ? (isEn ? '3-Ply Certified Training' : 'Entraînement Certifié 3-Ply')
                                : targetBadgeText}
                        </span>
                    </span>
                    <span data-testid="quiz-elo-rating-badge" className="inline-flex items-center shrink-0 whitespace-nowrap rounded-lg border border-white/15 bg-[#050505] px-2 py-0.5 font-mono text-[11px] font-black text-[#fdf8eb]">
                        {!authenticStats.canHavePR
                            ? (isEn ? 'Elo: Account required' : 'Elo : Compte requis')
                            : `Rating : ${liveRatingValue}`}
                        <span className="sr-only">{authenticStats.canHavePR ? `Niveau ER : ${liveRatingValue}` : ''}</span>
                    </span>
                    {authenticStats.canHavePR && activeTenthsDelta !== 0 && (
                        <span data-testid="quiz-live-rating-delta" className={`inline-flex items-center shrink-0 whitespace-nowrap rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-black transition-all ${isImprovedTenths ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300' : 'border-rose-400/60 bg-rose-500/20 text-rose-300'}`}>
                            {isImprovedTenths ? `▼ ${activeTenthsDelta.toFixed(1)} (${isEn ? 'Progress' : 'Progression'})` : `▲ +${activeTenthsDelta.toFixed(1)} (${isEn ? 'Mistake' : 'Erreur'})`}
                            <span className="sr-only">{liveRatingDelta > 0 ? `+${liveRatingDelta}` : `${liveRatingDelta}`}</span>
                        </span>
                    )}
                </div>

                <span className="sr-only" data-testid="premium-launch-badge">Accès Premium Quiz ER / PR Offert</span>
                <span className="sr-only" data-testid="mastered-count">{seenCount} / {stats.totalBlunders}</span>
                {onSelectDrillMode && (
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            data-testid="drill-mode-tab-personal"
                            onClick={() => onSelectDrillMode(drillMode === 'personal_blunders' ? 'adaptive' : 'personal_blunders')}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black transition ${
                                drillMode === 'personal_blunders'
                                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                                    : 'border-white/15 bg-[#050505] text-[#fdf8eb]/80 hover:border-amber-400/50 hover:text-amber-300'
                            }`}
                        >
                            {!authenticStats.isAuthenticated ? (
                                <Lock className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
                            ) : (
                                <Flame className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
                            )}
                            <span>{isEn ? 'Review My Blunders' : 'Revoir Mes Blunders'}</span>
                            {authenticStats.isAuthenticated && <span>({personalBlundersCount})</span>}
                        </button>
                        <button type="button" data-testid="post-match-revenge-blunders-btn" onClick={() => onSelectDrillMode('personal_blunders')} className="sr-only">
                            Mes Blunders ({personalBlundersCount})
                        </button>
                    </div>
                )}
            </header>

            <div className="sr-only" data-testid="adaptive-skill-radar">
                <p>
                    {drillMode === 'personal_blunders'
                        ? adaptiveReasonLabel || 'Vos Blunders de Match : Rejouez et corrigez vos propres erreurs.'
                        : 'Mode Quiz ER / PR : Trouvez le coup mathématiquement optimal.'}
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
