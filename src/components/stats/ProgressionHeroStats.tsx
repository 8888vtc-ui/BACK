'use client';

import React from 'react';
import Link from 'next/link';

export interface ProgressionHeroStatsProps {
    performanceRating: number;
    prCategory: string;
    averageErrorRate: number;
    totalBlunders: number;
    totalDoubtful: number;
    totalGamesPlayed: number;
    totalGamesWon: number;
    winRate: number;
    onBackToGame?: () => void;
}

const PR_BADGE_COLORS: Record<string, string> = {
    'Grand-Maître': 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-950/40',
    'Maître': 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-cyan-950/40',
    'Expert': 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-blue-950/40',
    'Avancé': 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-indigo-950/40',
    'Intermédiaire': 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-950/40',
    'Débutant': 'bg-slate-800/80 border-slate-600 text-slate-300 shadow-slate-950/40',
};

export const ProgressionHeroStats: React.FC<ProgressionHeroStatsProps> = ({
    performanceRating,
    prCategory,
    averageErrorRate,
    totalBlunders,
    totalDoubtful,
    totalGamesPlayed,
    totalGamesWon,
    winRate,
    onBackToGame,
}) => {
    return (
        <div className="space-y-6">
            {/* Barre de navigation / Retour */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-r from-[#180c06] via-[#0e121b] to-[#080a0f] p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(243,198,95,0.18)]">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#fdf8eb] flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#2a170c] to-[#120904] text-lg shadow-inner">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📊</span>
                        </span>
                        <span>Tableau de Progression &amp; Analyse Stratégique</span>
                    </h1>
                    <p className="text-xs text-[#a5b0c4] mt-1">
                        Diagnostic en continu de vos décisions, calcul du Performance Rating (PR) et identification de vos axes de progrès.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/drills"
                        className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] hover:brightness-105 transition shadow-md flex items-center gap-1.5"
                    >
                        <span>🎯</span>
                        <span>Drills de Blunders</span>
                    </Link>

                    {onBackToGame ? (
                        <button
                            type="button"
                            onClick={onBackToGame}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition shadow-sm flex items-center gap-2"
                        >
                            <span>←</span>
                            <span>Retour au plateau</span>
                        </button>
                    ) : (
                        <Link
                            href="/"
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition shadow-sm flex items-center gap-2"
                        >
                            <span>←</span>
                            <span>Retour au plateau</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* HERO : Performance Rating (PR) & Taux d'Erreur Global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Carte PR */}
                <div className="md:col-span-1 rounded-2xl border border-white/10 bg-gradient-to-br from-[#180c06] via-[#0e121b] to-[#080a0f] p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-[#d4af37]/15 blur-2xl pointer-events-none" />
                    <p className="text-xs font-bold text-[#f3c65f] uppercase tracking-wider">
                        Performance Rating (PR)
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-4xl font-extrabold font-mono text-[#fdf8eb] tracking-tight" data-testid="stats-pr-value">
                            {performanceRating}
                        </span>
                        <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-md ${PR_BADGE_COLORS[prCategory] || PR_BADGE_COLORS['Intermédiaire']}`}
                            data-testid="stats-pr-category"
                        >
                            {prCategory}
                        </span>
                    </div>
                    <p className="mt-3 text-xs text-[#a5b0c4] leading-relaxed">
                        Échelle de référence du Backgammon de compétition. Plus le score est proche de 0, plus votre jeu approche la perfection mathématique.
                    </p>
                </div>

                {/* Carte Taux d'erreur moyen */}
                <div className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl">
                    <p className="text-xs font-bold text-[#e2d2b5] uppercase tracking-wider">
                        Taux d&apos;Erreur Moyen (Error Rate)
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold font-mono text-[#f3c65f]" data-testid="stats-error-rate">
                            {averageErrorRate.toFixed(3)}
                        </span>
                        <span className="text-xs text-[#a5b0c4]">équité / coup</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
                        <span className="text-[#a5b0c4]">Blunders :</span>
                        <strong className="font-mono text-red-400">{totalBlunders}</strong>
                        <span className="text-slate-600">·</span>
                        <span className="text-[#a5b0c4]">Doutes :</span>
                        <strong className="font-mono text-[#f3c65f]">{totalDoubtful}</strong>
                    </div>
                </div>

                {/* Carte Bilan des Parties */}
                <div className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl">
                    <p className="text-xs font-bold text-[#e2d2b5] uppercase tracking-wider">
                        Bilan des Parties
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                        <span className="text-3xl font-extrabold font-mono text-emerald-400">
                            {winRate}%
                        </span>
                        <span className="text-xs text-[#a5b0c4]">de victoires</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
                        <span className="text-[#a5b0c4]">Jouées :</span>
                        <strong className="font-mono text-[#fdf8eb]">{totalGamesPlayed}</strong>
                        <span className="text-slate-600">·</span>
                        <span className="text-[#a5b0c4]">Gagnées :</span>
                        <strong className="font-mono text-[#fdf8eb]">{totalGamesWon}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProgressionHeroStats);
