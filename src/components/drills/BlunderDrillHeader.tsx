'use client';

import React from 'react';
import Link from 'next/link';
import type { BlunderBankStats } from '../../features/drills/types';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    ERH_METHOD_VOICE_INTRO,
    QUIZ_PREMIUM_CONFIG,
    type AdaptivePlayerProfile,
    type AdaptiveQuizCategoryId,
} from '../../features/drills/adaptiveQuizEngine';
import { useCoachVoice } from '../../hooks/useCoachVoice';

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
    streak = 0,
    onResetAllMastery,
    onClose,
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();
    const [showRadar, setShowRadar] = React.useState<boolean>(false);
    const overallMastery = adaptiveProfile?.overallMastery ?? stats.masteryRate;
    const seenCount = adaptiveProfile?.seenQuizIds.length ?? 0;

    const handleSpeakErhIntro = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        speak(ERH_METHOD_VOICE_INTRO, { force: true });
    };

    return (
        <div className="w-full shrink-0 space-y-1">
            {/* En-tête compact pour colonne latérale Paysage : Retour + Uniquement les 2 Quizz (PR & ERH) */}
            <header className="w-full flex flex-col gap-1.5 rounded-xl border border-white/10 bg-[#0e121b]/95 p-2 shadow-md">
                <div className="flex items-center justify-between gap-1.5">
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

                    <h1 className="truncate text-[11px] sm:text-xs font-black tracking-tight text-[#fdf8eb]">
                        {drillMode === 'pr_math' ? '📐 Quizz PR (Maths)' : '🧠 Quizz ERH (Psycho)'}
                        <span className="sr-only">Parcours Adaptatif IA</span>
                    </h1>
                    <span className="sr-only" data-testid="premium-launch-badge">
                        {QUIZ_PREMIUM_CONFIG.premiumLabel}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] shrink-0">
                        {drillMode === 'adaptive' && (
                            <button
                                type="button"
                                data-testid="erh-voice-manifest-btn"
                                onClick={handleSpeakErhIntro}
                                title="Pourquoi la Psychologie (ERH) ?"
                                className="rounded-lg border border-[#f3c65f]/40 bg-[#1a1109] px-1.5 py-0.5 text-[11px] font-bold text-[#f3c65f] hover:bg-[#2a1b0e] transition"
                            >
                                {isSpeaking ? '🔇' : '🎙️'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowRadar((prev) => !prev)}
                            className="rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-semibold text-[#f3c65f] hover:border-white/25 transition"
                        >
                            📊 {overallMastery}%
                        </button>
                        <span className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                            🔥 {streak}
                        </span>
                        <span className="sr-only" data-testid="mastered-count">
                            {seenCount} / {stats.totalBlunders}
                        </span>
                    </div>
                </div>

                {onSelectDrillMode && (
                    <div
                        role="tablist"
                        aria-label="Mode du Quizz"
                        data-testid="drill-mode-tabs"
                        className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/50 p-0.5"
                    >
                        <button
                            type="button"
                            role="tab"
                            data-testid="drill-mode-tab-pr"
                            aria-selected={drillMode === 'pr_math'}
                            onClick={() => onSelectDrillMode('pr_math')}
                            className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition text-center ${
                                drillMode === 'pr_math'
                                    ? 'bg-emerald-400 text-slate-950 shadow'
                                    : 'text-[#e2d2b5] hover:text-white'
                            }`}
                        >
                            📐 Quizz PR (Maths)
                        </button>
                        <button
                            type="button"
                            role="tab"
                            data-testid="drill-mode-tab-adaptive"
                            aria-selected={drillMode === 'adaptive'}
                            onClick={() => onSelectDrillMode('adaptive')}
                            className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition text-center ${
                                drillMode === 'adaptive'
                                    ? 'bg-[#f3c65f] text-slate-950 shadow'
                                    : 'text-[#e2d2b5] hover:text-white'
                            }`}
                        >
                            🧠 Quizz ERH
                        </button>
                        <button
                            type="button"
                            role="tab"
                            data-testid="drill-mode-tab-personal"
                            aria-selected={drillMode === 'personal_blunders'}
                            onClick={() => onSelectDrillMode('personal_blunders')}
                            className="sr-only"
                        >
                            <span>🔥 Revoir Mes Blunders</span>
                            <span>{personalBlundersCount}</span>
                        </button>
                    </div>
                )}
            </header>

            <div className={showRadar ? 'w-full rounded-xl border border-white/10 bg-[#0e121b]/90 px-3 py-1.5' : 'sr-only'} data-testid="adaptive-skill-radar">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-[#e2d2b5] font-medium">
                        {drillMode === 'personal_blunders'
                            ? adaptiveReasonLabel || '🔥 Vos Blunders de Match : Rejouez et corrigez vos propres erreurs.'
                            : drillMode === 'pr_math'
                                ? '🎯 Mode Quizz PR : Trouvez le coup mathématiquement optimal (Équité pure GNU Backgammon).'
                                : '🧠 Mode Quizz ERH : La psychologie est un facteur vital au Backgammon — adaptez votre coup au profil psychologique de l’adversaire.'}
                    </p>
                    <button type="button" onClick={onResetAllMastery} className="text-[#a5b0c4] hover:text-white underline text-[11px]">
                        Réinitialiser
                    </button>
                </div>

                {showRadar && (
                    <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-9 gap-1.5">
                        {ADAPTIVE_QUIZ_CATEGORIES.map((cat) => {
                            const state = adaptiveProfile?.categories[cat.id];
                            const level = state?.level ?? 1;
                            const mastery = state?.masteryScore ?? 25;
                            const isTarget = activeCategoryId === cat.id;
                            return (
                                <div
                                    key={cat.id}
                                    className={`flex flex-col justify-between rounded-lg border px-2 py-1 ${
                                        isTarget ? 'border-[#f3c65f] bg-[#2a1b0e]' : 'border-white/10 bg-black/40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1 text-[11px]">
                                        <span className="font-bold text-[#fdf8eb] truncate">{cat.shortLabel}</span>
                                        <span className="font-mono text-[#f3c65f]">N{level}</span>
                                    </div>
                                    <div className="text-[11px] font-mono text-[#a5b0c4]">{mastery}%</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(BlunderDrillHeader);
