'use client';

/**
 * Tableau interactif des 15 Rouleaux d'Ouverture au Backgammon (Équité Open Sage 3-Ply).
 * Loi de Scalabilité : strictement 0 any, < 300 lignes.
 */

import React, { useMemo, useState } from 'react';
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
        if (activeFilter === 'all') return OPENING_ROLLS_15;
        return OPENING_ROLLS_15.filter((item) => item.category === activeFilter);
    }, [activeFilter]);

    return (
        <section
            id="openings-guide"
            aria-labelledby="openings-guide-heading"
            data-testid="academy-openings-section"
            className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-[0_14px_38px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,245,205,0.18)] space-y-5"
        >
            <div className="space-y-2">
                <h2
                    id="openings-guide-heading"
                    className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]"
                >
                    {content.openingsSectionTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {content.openingsSectionDesc}
                </p>
            </div>

            {/* Filtres de catégories d'ouvertures */}
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
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold tracking-wide transition ${
                                isActive
                                    ? 'border-[#f3c65f] bg-gradient-to-b from-[#3b2b12] to-[#1c1306] text-[#fff6d6] shadow-md'
                                    : 'border-[#d4af37]/25 bg-black/40 text-slate-300 hover:border-[#d4af37]/60 hover:text-amber-100'
                            }`}
                        >
                            {btn.label}
                        </button>
                    );
                })}
            </div>

            {/* Tableau responsive des 15 ouvertures */}
            <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#070a11]/90">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                        <tr className="border-b border-[#d4af37]/30 bg-[#101624] text-[11px] font-extrabold uppercase tracking-wider text-[#e5c158]">
                            <th className="py-3 px-3.5">{content.colRoll}</th>
                            <th className="py-3 px-3.5">{content.colName}</th>
                            <th className="py-3 px-3.5">{content.colOptimal}</th>
                            <th className="py-3 px-3.5">{content.colAlt}</th>
                            <th className="py-3 px-3.5">{content.colEquity}</th>
                            <th className="py-3 px-3.5">{content.colStrategy}</th>
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
                                    <td className="py-3 px-3.5 font-mono font-black text-base text-[#f5cf70] whitespace-nowrap">
                                        🎲 {entry.roll}
                                    </td>
                                    <td className="py-3 px-3.5 font-serif font-bold text-[#fdf8eb]">
                                        {entry.nickname[locale] ?? entry.nickname.en}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono font-extrabold text-emerald-300 whitespace-nowrap">
                                        {entry.optimalMove}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono text-xs text-slate-400">
                                        {entry.alternativeMove}
                                    </td>
                                    <td className="py-3 px-3.5 whitespace-nowrap">
                                        <span
                                            className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-xs font-bold ${
                                                isPositive
                                                    ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                                                    : 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                                            }`}
                                        >
                                            {entry.equity3Ply}
                                        </span>
                                        <div className="mt-1 text-[10px] text-slate-400 font-mono">
                                            W: {entry.winPct} · G: {entry.gammonPct}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3.5 text-xs text-slate-300 leading-relaxed min-w-[240px]">
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
