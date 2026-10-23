'use client';

/**
 * Barre résumée du Coach sur mobile (< lg).
 *
 * Rôle :
 *   Affiche en bas de l'écran une barre compacte toujours visible :
 *     `PR actuel | Dernier verdict | [Ouvrir l'analyse]`
 *   Le toucher du bouton déplie le Bottom Sheet (`CoachMobileDrawer`).
 *
 *   La barre n'apparaît que si une analyse existe ou si le Coach est en cours
 *   d'analyse, afin de ne pas encombrer l'écran de jeu.
 *
 * Composant 100 % muet (LOI 5).
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `CoachMobileDrawer.tsx`.
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
    const isEn = locale === 'en';

    // Rien à résumer : ni analyse, ni calcul en cours.
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
            className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-indigo-500/50 bg-slate-950/95 px-3 py-2 backdrop-blur-xl shadow-2xl"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
            {/* PR actuel */}
            <div className="flex flex-col items-center leading-none shrink-0">
                <span
                    data-testid="coach-mobile-pr"
                    className="font-mono text-sm font-black text-white"
                >
                    {pr !== null && Number.isFinite(pr) ? pr.toFixed(2) : '--'}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                    PR
                </span>
            </div>

            <div className="h-7 w-px bg-slate-700 shrink-0" aria-hidden="true" />

            {/* Dernier verdict */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
                {isAnalyzing ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                        {isEn ? 'Analyzing…' : 'Analyse en cours…'}
                    </span>
                ) : (
                    <span
                        data-testid="coach-mobile-verdict"
                        className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.bannerClass} ${style.textClass}`}
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
                className="shrink-0 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3 text-xs font-bold text-white shadow-md transition active:scale-95"
            >
                <span aria-hidden="true">🎓</span>
                <span>{isEn ? 'Open analysis' : "Ouvrir l'analyse"}</span>
            </button>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachMobileSummaryBar = React.memo(CoachMobileSummaryBarComponent);
export default CoachMobileSummaryBar;
