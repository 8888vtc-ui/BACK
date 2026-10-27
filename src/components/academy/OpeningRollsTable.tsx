'use client';

/**
 * Tableau interactif des 15 Rouleaux d'Ouverture au Backgammon (Équité Monte-Carlo 3-Ply).
 * Loi de Scalabilité : strictement 0 any, < 300 lignes.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    OPENING_ROLLS_15,
    type OpeningCategory,
    type OpeningRollGuideEntry,
} from '../../features/academy/academyData';
import type { AcademyLocaleContent } from '../../features/academy/academyTranslations';
import type { PrimaryLocale } from '../../lib/i18n/types';

export interface OpeningRollsTableProps {
    readonly content: AcademyLocaleContent;
    readonly locale: PrimaryLocale;
}

type FilterOption = 'all' | OpeningCategory;

const OpeningRollsTableComponent: React.FC<OpeningRollsTableProps> = ({ content, locale }) => {
    const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filterButtons = useMemo<ReadonlyArray<{ id: FilterOption; label: string }>>(
        () => [
            { id: 'all', label: content.filterAll },
            { id: 'make-point', label: content.filterMakePoint },
            { id: 'split-build', label: content.filterSplit },
            { id: 'slot-attack', label: content.filterSlot },
            { id: 'running', label: content.filterRun },
        ],
        [content],
    );

    const filteredRolls = useMemo<ReadonlyArray<OpeningRollGuideEntry>>(() => {
        const baseList =
            activeFilter === 'all'
                ? OPENING_ROLLS_15
                : OPENING_ROLLS_15.filter((item) => item.category === activeFilter);
        const query = searchQuery.trim().toLowerCase();
        if (!query) return baseList;

        return baseList.filter((item) => {
            const nicknameStr = item.nickname[locale] || item.nickname.en || '';
            const noteStr = item.strategicNote[locale] || item.strategicNote.en || '';
            return (
                item.roll.includes(query) ||
                item.optimalMove.toLowerCase().includes(query) ||
                nicknameStr.toLowerCase().includes(query) ||
                noteStr.toLowerCase().includes(query)
            );
        });
    }, [activeFilter, searchQuery, locale]);

    return (
        <section
            id="openings-guide"
            aria-labelledby="openings-guide-heading"
            data-testid="academy-openings-section"
            className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-[0_14px_38px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,245,205,0.18)] space-y-5"
        >
            <div className="space-y-2">
                <h2
                    id="openings-guide-heading"
                    className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]"
                >
                    {content.openingsSectionTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {content.openingsSectionDesc}
                </p>
            </div>

            {/* Filtres de catégories d'ouvertures et champ de recherche rapide */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                    role="group"
                    aria-label="Filtrer les 15 rouleaux d'ouverture"
                    data-testid="academy-openings-filters"
                    className="flex flex-wrap gap-2"
                >
                    {filterButtons.map((btn) => {
                        const isActive = activeFilter === btn.id;
                        return (
                            <button
                                key={btn.id}
                                type="button"
                                data-testid={`academy-filter-${btn.id}`}
                                aria-pressed={isActive}
                                onClick={() => setActiveFilter(btn.id)}
                                className={`rounded-full border px-4 py-1.5 text-xs sm:text-sm font-bold tracking-wide transition ${
                                    isActive
                                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#3b2b12] to-[#1c1306] text-[#fff6d6] shadow-md'
                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-amber-100'
                                }`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative min-w-[230px] flex-1 sm:flex-initial">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-amber-400/70"
                    >
                        🔍
                    </span>
                    <input
                        id="academy-openings-search-input"
                        name="openingsSearch"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher (ex: 3-1, 6-5, slot)..."
                        aria-label="Rechercher un rouleau ou un coup d'ouverture"
                        data-testid="academy-openings-search-input"
                        className="w-full rounded-full border border-white/10 bg-black/50 py-2 pl-9 pr-3.5 text-xs sm:text-sm text-amber-100 placeholder:text-slate-400 focus:border-[#f3c65f] focus:outline-none focus:ring-1 focus:ring-[#f3c65f]"
                    />
                </div>
            </div>

            {/* Tableau responsive des ouvertures */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#070a11]/90">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-[#101624] text-xs font-extrabold uppercase tracking-wider text-[#e5c158]">
                            <th className="py-3.5 px-4">{content.colRoll}</th>
                            <th className="py-3.5 px-4">{content.colName}</th>
                            <th className="py-3.5 px-4">{content.colOptimal}</th>
                            <th className="py-3.5 px-4">{content.colAlt}</th>
                            <th className="py-3.5 px-4">{content.colEquity}</th>
                            <th className="py-3.5 px-4">{content.colStrategy}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredRolls.map((entry) => {
                            const isPositive = entry.equity3Ply.startsWith('+');
                            return (
                                <tr
                                    key={entry.id}
                                    data-testid={`opening-row-${entry.roll}`}
                                    className="hover:bg-white/[0.03] transition"
                                >
                                    <td className="py-3.5 px-4 font-mono font-black text-base sm:text-lg text-[#f5cf70] whitespace-nowrap">
                                        <Link
                                            href={`/academy/openings/${entry.roll}`}
                                            className="hover:underline hover:text-amber-200 inline-flex items-center gap-1.5"
                                        >
                                            <span>🎲 {entry.roll}</span>
                                            <span className="text-xs text-amber-300/80">↗</span>
                                        </Link>
                                    </td>
                                    <td className="py-3.5 px-4 font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">
                                        <Link
                                            href={`/academy/openings/${entry.roll}`}
                                            className="hover:text-[#f5cf70] transition"
                                        >
                                            {entry.nickname[locale] ?? entry.nickname.en}
                                        </Link>
                                    </td>
                                    <td className="py-3.5 px-4 font-mono text-sm sm:text-base font-extrabold text-emerald-300 whitespace-nowrap">
                                        {entry.optimalMove}
                                    </td>
                                    <td className="py-3.5 px-4 font-mono text-xs sm:text-sm text-slate-300">
                                        {entry.alternativeMove}
                                    </td>
                                    <td className="py-3.5 px-4 whitespace-nowrap">
                                        <span
                                            className={`inline-block rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs sm:text-sm font-bold ${
                                                isPositive
                                                    ? 'bg-emerald-500/15 text-emerald-300'
                                                    : 'bg-amber-500/15 text-amber-200'
                                            }`}
                                        >
                                            {entry.equity3Ply}
                                        </span>
                                        <div className="mt-1 text-xs text-slate-300 font-mono">
                                            W: {entry.winPct} · G: {entry.gammonPct}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 text-xs sm:text-sm text-slate-200 leading-relaxed min-w-[260px]">
                                        {entry.strategicNote[locale] ?? entry.strategicNote.en}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export const OpeningRollsTable = React.memo(OpeningRollsTableComponent);
export default OpeningRollsTable;
