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

export type QuizDrillMode = 'adaptive' | 'personal_blunders' | 'speed_60s';

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
    speedSecondsLeft = null,
    onSelectDrillMode,
    hearts = 5,
    streak = 0,
    xp = 0,
    onResetAllMastery,
    onClose,
}) => {
    const { isSpeaking, speak, stop } = useCoachVoice();
    const [showMobileRadar, setShowMobileRadar] = React.useState<boolean>(false);
    const overallLevel = adaptiveProfile?.overallLevel ?? 1.0;
    const overallMastery = adaptiveProfile?.overallMastery ?? stats.masteryRate;
    const seenCount = adaptiveProfile?.seenQuizIds.length ?? 0;
    const playerErhIndex = Math.max(1.2, Number((24 - overallMastery * 0.21).toFixed(1)));

    const handleSpeakErhIntro = () => {
        if (isSpeaking) {
            stop();
            return;
        }
        speak(ERH_METHOD_VOICE_INTRO, { force: true });
    };

    return (
        <div className="w-full space-y-1.5 sm:space-y-2.5">
            {/* En-tête Zéro Sous-Menu : Parcours Adaptatif Automatique + Badge Premium Offert */}
            <header className="w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-[#0e121b]/95 px-2.5 py-2 sm:px-4 sm:py-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f3c65f]/40 bg-[#1a1109] text-lg">🎯</span>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-base sm:text-xl font-black tracking-tight text-[#fdf8eb]">Parcours Adaptatif IA &amp; Quizz ERH</h1>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300" data-testid="premium-launch-badge">
                                {QUIZ_PREMIUM_CONFIG.premiumLabel}
                            </span>
                            <button
                                type="button"
                                data-testid="erh-voice-manifest-btn"
                                onClick={handleSpeakErhIntro}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-extrabold transition ${
                                    isSpeaking
                                        ? 'border-amber-400 bg-amber-950/80 text-amber-200 animate-pulse'
                                        : 'border-[#f3c65f]/50 bg-[#1a1109] text-[#f3c65f] hover:bg-[#2a1b0e]'
                                }`}
                            >
                                <span>{isSpeaking ? '🔇 Stop Voix ERH' : "🎙️ Qu'est-ce que le ERH ? (Écouter)"}</span>
                            </button>
                        </div>
                        <p className="text-xs text-[#a5b0c4]">
                            {adaptiveReasonLabel || 'Sélection aléatoire intelligente ciblée sur vos faiblesses · Zéro doublon garanti'}
                        </p>
                        {onSelectDrillMode && (
                            <div
                                role="tablist"
                                aria-label="Mode du Quizz"
                                data-testid="drill-mode-tabs"
                                className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/50 p-1"
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    data-testid="drill-mode-tab-adaptive"
                                    aria-selected={drillMode === 'adaptive'}
                                    onClick={() => onSelectDrillMode('adaptive')}
                                    className={`rounded-lg px-3 py-1 text-xs font-extrabold transition ${
                                        drillMode === 'adaptive'
                                            ? 'bg-[#f3c65f] text-slate-950 shadow'
                                            : 'text-[#e2d2b5] hover:text-white'
                                    }`}
                                >
                                    🎭 Quizz ERH (Psychologie &amp; Niveau Adverse)
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    data-testid="drill-mode-tab-personal"
                                    aria-selected={drillMode === 'personal_blunders'}
                                    onClick={() => onSelectDrillMode('personal_blunders')}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold transition ${
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
                                <button
                                    type="button"
                                    role="tab"
                                    data-testid="drill-mode-tab-speed60"
                                    aria-selected={drillMode === 'speed_60s'}
                                    onClick={() => onSelectDrillMode('speed_60s')}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold transition ${
                                        drillMode === 'speed_60s'
                                            ? 'bg-emerald-400 text-slate-950 shadow'
                                            : 'text-[#e2d2b5] hover:text-white'
                                    }`}
                                >
                                    <span>⚡ Défi Éclair 60s</span>
                                    {speedSecondsLeft !== null && (
                                        <span className="rounded-full bg-slate-950/80 px-1.5 py-0.2 font-mono text-[11px] text-emerald-300">
                                            {speedSecondsLeft}s
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gamification HUD Cercle Monte-Carlo : Cœurs, Série, Sceaux d'Or, Indice ERH & Niveau */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-2.5 py-1.5 flex items-center gap-1" title="Vies restantes">
                        <span aria-label="Vies">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < hearts ? 'opacity-100' : 'opacity-25 grayscale'}>❤️</span>
                            ))}
                        </span>
                    </div>
                    <div className="rounded-xl border border-amber-500/35 bg-amber-950/30 px-2.5 py-1.5 font-mono font-extrabold text-amber-300" title="Série de lectures justes consécutives">
                        🔥 {streak}
                    </div>
                    <div className="rounded-xl border border-[#f3c65f]/45 bg-[#1a1109] px-2.5 py-1.5 font-mono font-extrabold text-[#f3c65f]" title="Sceaux d'Or Monte-Carlo gagnés">
                        ⚜️ {xp} Sceaux d&apos;Or
                    </div>
                    <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/30 px-2.5 py-1.5 font-mono font-extrabold text-cyan-200" title="Votre Indice ERH (Error Rate Humain — plus il est bas, plus votre lecture est fine)">
                        🧠 ERH {playerErhIndex}
                    </div>
                    <div className="rounded-xl border border-purple-500/35 bg-purple-950/30 px-2.5 py-1.5 font-mono font-extrabold text-purple-200" title="Niveau Moyen sur les 9 Catégories">
                        👑 Niv. {overallLevel.toFixed(1)}/4
                    </div>
                    <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-1.5">
                        <span className="text-emerald-400 font-bold uppercase mr-1.5">Vus (0 doublon)</span>
                        <span className="font-mono font-extrabold text-emerald-300" data-testid="mastered-count">{seenCount} / {stats.totalBlunders}</span>
                    </div>
                    {onClose ? (
                        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</button>
                    ) : (
                        <Link href="/" className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</Link>
                    )}
                </div>
            </header>

            {/* Radar de Progression Automatique sur les 9 Techniques (Compact & Dépliable sur Mobile < 640px) */}
            <div className="w-full rounded-2xl border border-white/10 bg-[#0e121b]/90 px-2.5 py-2 sm:p-3 space-y-2" data-testid="adaptive-skill-radar">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => setShowMobileRadar((prev) => !prev)}
                        className="font-bold text-[#fdf8eb] text-left flex items-center gap-1.5 sm:cursor-default"
                    >
                        <span>📊 Progression par Catégorie</span>
                        <span className="hidden sm:inline text-[#a5b0c4] font-normal">(Le moteur cible automatiquement vos jauges les plus basses)</span>
                        <span className="sm:hidden rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-[#f3c65f]">
                            {showMobileRadar ? '▲ Masquer' : '▼ 9 jauges'}
                        </span>
                    </button>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="font-mono font-bold text-[#f3c65f]">Maîtrise globale : {overallMastery}%</span>
                        <button type="button" onClick={onResetAllMastery} className="text-[#e2d2b5] hover:text-[#f3c65f] underline text-xs font-semibold transition">🔄 Réinitialiser mon profil</button>
                    </div>
                </div>

                <div className={`${showMobileRadar ? 'grid' : 'hidden sm:grid'} grid-cols-3 sm:grid-cols-9 gap-1.5`}>
                    {ADAPTIVE_QUIZ_CATEGORIES.map((cat) => {
                        const state = adaptiveProfile?.categories[cat.id];
                        const level = state?.level ?? 1;
                        const mastery = state?.masteryScore ?? 25;
                        const isTarget = activeCategoryId === cat.id;
                        const barColor =
                            mastery >= 75
                                ? 'bg-emerald-400'
                                : mastery >= 45
                                  ? 'bg-[#f3c65f]'
                                  : 'bg-rose-400';

                        return (
                            <div
                                key={cat.id}
                                title={`${cat.fullName} — Niveau ${level}/4 (${mastery}% de maîtrise)`}
                                className={`flex flex-col justify-between rounded-xl border px-2 py-1.5 transition ${
                                    isTarget
                                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#2a1b0e] to-[#140d07] shadow-md'
                                        : 'border-white/10 bg-black/40'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-[#fdf8eb] truncate">
                                        {cat.icon} {cat.shortLabel}
                                    </span>
                                    <span className={`font-mono text-[11px] font-black ${isTarget ? 'text-[#f3c65f]' : 'text-[#a5b0c4]'}`}>
                                        N{level}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                        style={{ width: `${Math.max(8, Math.min(100, mastery))}%` }}
                                    />
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-[#a5b0c4]">
                                    <span>{mastery}%</span>
                                    {isTarget && <span className="text-[#f3c65f] font-bold">Ciblé</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(BlunderDrillHeader);
