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
        <div className="w-full space-y-1.5">
            {/* Barre supérieure ultra-compacte pour laisser le plateau immédiatement visible */}
            <header className="w-full flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0e121b]/95 px-3 py-2 shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-sm sm:text-base font-black tracking-tight text-[#fdf8eb]">
                        Parcours Adaptatif IA : Quizz PR &amp; Quizz ERH
                    </h1>
                    <span className="sr-only" data-testid="premium-launch-badge">
                        {QUIZ_PREMIUM_CONFIG.premiumLabel}
                    </span>

                    {onSelectDrillMode && (
                        <div
                            role="tablist"
                            aria-label="Mode du Quizz"
                            data-testid="drill-mode-tabs"
                            className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-black/50 p-1"
                        >
                            <button
                                type="button"
                                role="tab"
                                data-testid="drill-mode-tab-pr"
                                aria-selected={drillMode === 'pr_math'}
                                onClick={() => onSelectDrillMode('pr_math')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                                    drillMode === 'pr_math'
                                        ? 'bg-emerald-400 text-slate-950 shadow'
                                        : 'text-[#e2d2b5] hover:text-white'
                                }`}
                            >
                                🎯 Quizz PR (Mathématique)
                            </button>
                            <button
                                type="button"
                                role="tab"
                                data-testid="drill-mode-tab-adaptive"
                                aria-selected={drillMode === 'adaptive'}
                                onClick={() => onSelectDrillMode('adaptive')}
                                className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                                    drillMode === 'adaptive'
                                        ? 'bg-[#f3c65f] text-slate-950 shadow'
                                        : 'text-[#e2d2b5] hover:text-white'
                                }`}
                            >
                                🧠 Quizz ERH (Psychologie)
                            </button>
                            <button
                                type="button"
                                role="tab"
                                data-testid="drill-mode-tab-personal"
                                aria-selected={drillMode === 'personal_blunders'}
                                onClick={() => onSelectDrillMode('personal_blunders')}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                                    drillMode === 'personal_blunders'
                                        ? 'bg-rose-500 text-white shadow'
                                        : 'text-[#e2d2b5] hover:text-white'
                                }`}
                            >
                                <span>🔥 Revoir Mes Blunders</span>
                                <span className="rounded-full bg-black/40 px-1.5 py-0.2 font-mono text-[11px]">
                                    {personalBlundersCount}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                        type="button"
                        data-testid="erh-voice-manifest-btn"
                        onClick={handleSpeakErhIntro}
                        className="rounded-lg border border-[#f3c65f]/40 bg-[#1a1109] px-2.5 py-1 text-xs font-bold text-[#f3c65f] hover:bg-[#2a1b0e] transition"
                    >
                        {isSpeaking ? '🔇 Stop' : '🎙️ Pourquoi la Psychologie (ERH) ?'}
                    </button>
                    <span className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-2 py-1 font-mono font-bold text-amber-300">
                        🔥 {streak}
                    </span>
                    <span className="sr-only" data-testid="mastered-count">
                        {seenCount} / {stats.totalBlunders}
                    </span>
                    {onClose ? (
                        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-[#150c07] px-2.5 py-1 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour</button>
                    ) : (
                        <Link href="/" className="rounded-lg border border-white/10 bg-[#150c07] px-2.5 py-1 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour</Link>
                    )}
                </div>
            </header>

            {/* Bandeau explicatif concis (1 seule ligne) + bouton optionnel pour voir les 9 compétences */}
            <div className="w-full rounded-xl border border-white/10 bg-[#0e121b]/80 px-3 py-1.5" data-testid="adaptive-skill-radar">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-[#e2d2b5] font-medium">
                        {drillMode === 'personal_blunders'
                            ? adaptiveReasonLabel || '🔥 Vos Blunders de Match : Rejouez et corrigez vos propres erreurs.'
                            : drillMode === 'pr_math'
                                ? '🎯 Mode Quizz PR : Trouvez le coup mathématiquement optimal (Équité pure GNU Backgammon).'
                                : '🧠 Mode Quizz ERH : La psychologie est un facteur vital au Backgammon — adaptez votre coup au profil psychologique de l’adversaire.'}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowRadar((prev) => !prev)}
                            className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-[#f3c65f] hover:border-white/25 transition"
                        >
                            {showRadar ? '▲ Masquer jauges' : `📊 Compétences (${overallMastery}%)`}
                        </button>
                        {showRadar && (
                            <button type="button" onClick={onResetAllMastery} className="text-[#a5b0c4] hover:text-white underline text-[11px]">
                                Réinitialiser
                            </button>
                        )}
                    </div>
                </div>

                {showRadar && (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-9 gap-1.5">
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
