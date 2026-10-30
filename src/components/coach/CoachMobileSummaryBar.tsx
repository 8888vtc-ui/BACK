'use client';

/**
 * Barre résumée du Coach sur tablette / fenêtre réduite (md..lg).
 *
 * Rôle :
 *   Affiche une pilule flottante en haut à droite sous le MatchHeader :
 *     `PR actuel | Dernier verdict | [Ouvrir l'analyse]`
 *   Sans jamais entrer en collision avec le MobileThumbDock (< md) ni avec
 *   la MoveTimelineBar en bas du plateau.
 */

import React from 'react';
import { classifyDecisionTier, getTierStyle } from './CoachMoveComparisonCard';
import type { CoachDisplayVerdict } from './coachPanelHelpers';

export interface CoachMobileSummaryBarProps {
    /** Performance Rating courant (null si aucune décision). */
    pr: number | null;
    /** Verdict du dernier coup analysé. */
    verdict: CoachDisplayVerdict | null;
    /** Perte d'équité du dernier coup. */
    equityLoss: number | null;
    /** Analyse en cours. */
    isAnalyzing?: boolean;
    /** Ouvre le Bottom Sheet d'analyse. */
    onOpen: () => void;
    /** Langue d'affichage. */
    locale?: string;
}

const CoachMobileSummaryBarComponent: React.FC<CoachMobileSummaryBarProps> = ({
    pr,
    verdict,
    equityLoss,
    isAnalyzing = false,
    onOpen,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');

    if (!verdict && !isAnalyzing) return null;

    const tier = classifyDecisionTier(equityLoss);
    const style = getTierStyle(tier, isEn);
    const lossLabel =
        equityLoss !== null && Math.abs(equityLoss) > 0.0005
            ? ` (-${Math.abs(equityLoss).toFixed(3)})`
            : '';

    return (
        <div
            data-testid="coach-mobile-summary-bar"
            className="hidden md:flex lg:hidden [@media(max-height:600px)]:!hidden fixed top-14 right-3 z-30 max-w-md items-center gap-2 rounded-2xl border border-[#d4af37]/50 bg-[#120b06]/95 px-3 py-1.5 text-[#fdf8eb] backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
        >
            {/* PR actuel */}
            <div className="flex flex-col items-center leading-none shrink-0">
                <span
                    data-testid="coach-mobile-pr"
                    className="font-mono text-sm font-black text-[#f3c65f]"
                >
                    {pr !== null && Number.isFinite(pr) ? pr.toFixed(2) : '--'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    PR
                </span>
            </div>

            <div className="h-6 w-px bg-[#d4af37]/30 shrink-0" aria-hidden="true" />

            {/* Dernier verdict */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {isAnalyzing ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#f3c65f]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#f3c65f]" />
                        {isEn ? 'Analyzing…' : 'Analyse en cours…'}
                    </span>
                ) : (
                    <span
                        data-testid="coach-mobile-verdict"
                        className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.bannerClass} ${style.textClass}`}
                    >
                        <span aria-hidden="true">{style.icon}</span>
                        <span className="truncate">
                            {style.label}
                            {lossLabel}
                        </span>
                    </span>
                )}
            </div>

            {/* Ouvrir l'analyse */}
            <button
                type="button"
                onClick={onOpen}
                data-testid="coach-mobile-open-btn"
                className="shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#e5c158]/55 bg-gradient-to-b from-[#33230f] to-[#1a1106] px-2.5 text-xs font-bold text-[#fce8b2] shadow-md transition active:scale-95 hover:border-[#f3c65f]"
            >
                <span aria-hidden="true">🎓</span>
                <span>{isEn ? 'Open analysis' : "Ouvrir l'analyse"}</span>
            </button>
        </div>
    );
};

export const CoachMobileSummaryBar = React.memo(CoachMobileSummaryBarComponent);
export default CoachMobileSummaryBar;
