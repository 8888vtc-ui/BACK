'use client';

/**
 * Bannière récapitulative PR / Accuracy % / 5 catégories Open Sage (< 300 lignes, 0 any).
 */

import React from 'react';
import {
    REPORT_CATEGORY_META,
    type ReportMoveCategory,
    type ReportMoveClassificationBreakdown,
} from './postMatchReportHelpers';

export interface MatchBlunderBannerProps {
    playerCategory: string;
    playerPr: number;
    quotaBadgeLabel: string;
    opponentPr: number | null | undefined;
    accuracyPct: number;
    reportBreakdown: ReportMoveClassificationBreakdown;
    locale: string;
}

export const MatchBlunderBanner: React.FC<MatchBlunderBannerProps> = ({
    playerCategory,
    playerPr,
    quotaBadgeLabel,
    opponentPr,
    accuracyPct,
    reportBreakdown,
    locale,
}) => {
    const isEn = locale === 'en';
    const categoryBadges: Array<{ key: keyof ReportMoveClassificationBreakdown; cat: ReportMoveCategory; count: number }> = [
        { key: 'best', cat: 'best', count: reportBreakdown.best },
        { key: 'inaccuracy', cat: 'inaccuracy', count: reportBreakdown.inaccuracy },
        { key: 'mistake', cat: 'mistake', count: reportBreakdown.mistake },
        { key: 'blunder', cat: 'blunder', count: reportBreakdown.blunder },
        { key: 'cubeBlunder', cat: 'cube_blunder', count: reportBreakdown.cubeBlunder },
    ];

    return (
        <section
            data-testid="match-blunder-banner"
            aria-label={isEn ? 'Performance & Accuracy Summary' : 'Bannière de Performance et Précision'}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#221309] via-[#150c06] to-[#0d0704] p-4 shadow-[inset_0_1px_0_rgba(255,245,205,0.12)] space-y-3"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-b from-[#3b2310] to-[#1a0e06] text-2xl text-[#f3c65f] shadow-md">
                        ⚜
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                data-testid="match-report-level-badge"
                                className="rounded-full border border-white/15 bg-[#2f1b0c] px-3 py-0.5 text-xs font-black uppercase tracking-wider text-[#fce8b2]"
                            >
                                {isEn ? `Level: ${playerCategory}` : `Niveau ${playerCategory}`}
                            </span>
                            <span data-testid="match-report-pr-badge" className="font-mono text-sm font-black text-[#f3c65f]">
                                PR: {playerPr.toFixed(2)}
                            </span>
                            <span
                                data-testid="daily-quota-badge"
                                className="rounded-full border border-white/10 bg-[#140b06] px-2.5 py-0.5 text-[11px] font-semibold text-[#f3c65f]"
                            >
                                {quotaBadgeLabel}
                            </span>
                            {opponentPr !== null && opponentPr !== undefined && (
                                <span className="font-mono text-xs text-[#e8dcc6]/65">
                                    vs {isEn ? 'Opponent PR' : 'PR Adv.'}: {opponentPr.toFixed(2)}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs text-[#e8dcc6]/75">
                            {isEn
                                ? 'Grandmaster Match Review & Blunder Report (Monte-Carlo / XG2 scale)'
                                : 'Revue de Match Grand-Maître & Analyse des Gaffes (Échelle Monte-Carlo / XG2)'}
                        </p>
                    </div>
                </div>

                <div
                    data-testid="match-report-accuracy"
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#120a05]/90 px-4 py-2"
                >
                    <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#e8dcc6]/70">
                            {isEn ? 'Accuracy' : 'Taux de précision'}
                        </span>
                        <span className="font-mono text-xl font-black text-emerald-300">
                            {accuracyPct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            <div data-testid="match-report-classification-grid" className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                {categoryBadges.map(({ key, cat, count }) => {
                    const meta = REPORT_CATEGORY_META[cat];
                    return (
                        <div
                            key={key}
                            data-testid={`report-cat-${cat}`}
                            className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 ${meta.badgeClass}`}
                        >
                            <span className="flex items-center gap-1.5 text-[10px] font-bold">
                                <span aria-hidden="true">{meta.icon}</span>
                                <span>{isEn ? meta.shortEn : meta.shortFr}</span>
                            </span>
                            <span className="font-mono text-sm font-black">{count}</span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default MatchBlunderBanner;
