'use client';

import React from 'react';
import Link from 'next/link';
import type { BlunderBankStats } from '../../features/drills/types';
import { STRATEGIC_CONCEPTS_CATALOG } from '../../lib/stats/statsAggregator';

export interface BlunderDrillHeaderProps {
    stats: BlunderBankStats;
    selectedConceptFilter: string;
    onFilterChange: (conceptId: string) => void;
    onResetAllMastery: () => void;
    onClose?: () => void;
}

export const BlunderDrillHeader: React.FC<BlunderDrillHeaderProps> = ({
    stats,
    selectedConceptFilter,
    onFilterChange,
    onResetAllMastery,
    onClose,
}) => {
    return (
        <div className="w-full space-y-3">
            {/* En-tête compact & Compteurs de Maîtrise */}
            <header className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121b]/95 px-4 py-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1a1109] text-base">🎯</span>
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-[#fdf8eb]">Drills de Blunders</h1>
                    <span className="rounded-full border border-white/10 bg-[#1a1109] px-2.5 py-0.5 text-xs font-bold text-[#f3c65f]">Rejeu interactif</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"><span className="text-[#a5b0c4] font-bold uppercase mr-1.5">Banque</span><span className="font-mono font-extrabold text-[#fdf8eb]">{stats.totalBlunders}</span></div>
                    <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-1.5"><span className="text-emerald-400 font-bold uppercase mr-1.5">Maîtrisées</span><span className="font-mono font-extrabold text-emerald-300" data-testid="mastered-count">{stats.masteredCount} / {stats.totalBlunders}</span></div>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"><span className="text-[#f3c65f] font-bold uppercase mr-1.5">Maîtrise</span><span className="font-mono font-extrabold text-[#f3c65f]">{stats.masteryRate}%</span></div>
                    {onClose ? (
                        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</button>
                    ) : (
                        <Link href="/" className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</Link>
                    )}
                </div>
            </header>

            {/* Filtre par concept */}
            <div className="w-full flex items-center justify-between flex-wrap gap-2 text-xs rounded-2xl border border-white/10 bg-[#0e121b]/90 px-4 py-2">
                <div className="flex items-center gap-2">
                    <label htmlFor="drill-concept-filter" className="font-bold text-[#e2d2b5]">Concept :</label>
                    <select id="drill-concept-filter" name="conceptFilter" value={selectedConceptFilter} onChange={(e) => onFilterChange(e.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-3 py-1 text-xs text-[#fdf8eb] focus:outline-none focus:ring-1 focus:ring-[#f3c65f]" data-testid="concept-filter">
                        <option value="all">🎯 Tous les concepts ({stats.totalBlunders})</option>
                        {STRATEGIC_CONCEPTS_CATALOG.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                </div>
                <button type="button" onClick={onResetAllMastery} className="text-[#e2d2b5] hover:text-[#f3c65f] underline text-xs font-semibold transition">🔄 Réinitialiser la maîtrise</button>
            </div>
        </div>
    );
};

export default React.memo(BlunderDrillHeader);
