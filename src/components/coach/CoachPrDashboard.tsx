'use client';

/**
 * Tableau de bord PR du Coach — jauge visuelle + compteurs de décisions.
 *
 * Rôle :
 *   Affiche en bas du panneau Coach sous forme ultra-compacte :
 *   - le Performance Rating (PR) courant, le badge de niveau et le % de précision ;
 *   - une jauge graduée fine ;
 *   - la grille en ligne des 4 paliers de décisions (Optimal / Bon / Imprécision / Blunder) ;
 *   - la perte d'équité cumulée du match.
 *
 * Composant 100 % muet (LOI 5) : tous les compteurs sont calculés par le parent
 * (`useCoach`) et transmis prêts à afficher.
 */

import React from 'react';

/** Compteurs des 4 paliers de décisions (exigence 3.3 du cahier des charges). */
export interface DecisionCounters {
    optimal: number;
    good: number;
    inaccuracy: number;
    blunder: number;
}

export interface CoachPrDashboardProps {
    /** Performance Rating courant (0 = parfait). */
    pr: number;
    /** Nombre total de décisions analysées. */
    decisionsCount: number;
    /** Perte d'équité cumulée (valeur positive). */
    totalEquityLoss: number;
    /** Compteurs par palier. */
    counters: DecisionCounters;
    /** Callback au clic sur le compteur de blunders (filtre / revue). */
    onBlunderClick?: () => void;
}

/** Niveau de performance dérivé du PR. */
interface PrLevel {
    label: string;
    icon: string;
    /** Classes Tailwind du badge. */
    badgeClass: string;
    /** Couleur de la barre de progression. */
    barClass: string;
    /** Borne supérieure du niveau (pour le calcul du remplissage). */
    max: number;
}

/**
 * Détermine le niveau de performance à partir du PR.
 * Seuils : 2.5 / 5.0 / 8.5 / 13.0.
 */
export function getPrLevel(pr: number): PrLevel {
    if (pr <= 2.5) {
        return {
            label: 'Classe Mondiale / Grand-Maître',
            icon: '🏆',
            badgeClass: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300',
            barClass: 'bg-emerald-400',
            max: 2.5,
        };
    }
    if (pr <= 5.0) {
        return {
            label: 'Maître / Tournoi',
            icon: '⭐',
            badgeClass: 'border-green-500/60 bg-green-500/15 text-green-300',
            barClass: 'bg-green-400',
            max: 5.0,
        };
    }
    if (pr <= 8.5) {
        return {
            label: 'Avancé / Club',
            icon: '📈',
            badgeClass: 'border-blue-500/60 bg-blue-500/15 text-blue-300',
            barClass: 'bg-blue-400',
            max: 8.5,
        };
    }
    if (pr <= 13.0) {
        return {
            label: 'Intermédiaire',
            icon: '🎯',
            badgeClass: 'border-amber-500/60 bg-amber-500/15 text-amber-300',
            barClass: 'bg-amber-400',
            max: 13.0,
        };
    }
    return {
        label: 'Apprentissage',
        icon: '🎓',
        badgeClass: 'border-rose-500/60 bg-rose-500/15 text-rose-300',
        barClass: 'bg-rose-400',
        max: 20.0,
    };
}

/**
 * Pourcentage de précision : part des décisions Optimal + Bon.
 */
export function computeAccuracy(counters: DecisionCounters): number {
    const total = counters.optimal + counters.good + counters.inaccuracy + counters.blunder;
    if (total === 0) return 0;
    return ((counters.optimal + counters.good) / total) * 100;
}

const CoachPrDashboardComponent: React.FC<CoachPrDashboardProps> = ({
    pr,
    decisionsCount,
    totalEquityLoss,
    counters,
    onBlunderClick,
}) => {
    const level = getPrLevel(pr);
    const accuracy = computeAccuracy(counters);
    // Remplissage de la jauge : 100 % à PR 0, 0 % à la borne haute du niveau.
    const fillPercent = Math.max(0, Math.min(100, 100 - (pr / level.max) * 100));

    const cells: Array<{
        key: keyof DecisionCounters;
        icon: string;
        label: string;
        className: string;
        onClick?: () => void;
    }> = [
        {
            key: 'optimal',
            icon: '✅',
            label: 'Optimaux',
            className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        },
        {
            key: 'good',
            icon: '👍',
            label: 'Bons',
            className: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
        },
        {
            key: 'inaccuracy',
            icon: '⚠️',
            label: 'Imprécisions',
            className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        },
        {
            key: 'blunder',
            icon: '❌',
            label: 'Blunders',
            className: 'border-rose-500/50 bg-rose-500/15 text-rose-300',
            onClick: onBlunderClick,
        },
    ];

    return (
        <section
            data-testid="coach-pr-dashboard"
            aria-label="Tableau de bord Performance Rating"
            className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2.5 space-y-2"
        >
            {/* 1. Bandeau compact : PR + Badge de niveau + Précision + Total ΔEq */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                        <span
                            data-testid="coach-pr-value"
                            className="font-mono text-lg font-black leading-none text-white"
                        >
                            {decisionsCount > 0 ? pr.toFixed(2) : '--'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            PR
                        </span>
                    </div>
                    <span
                        data-testid="coach-pr-level"
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${level.badgeClass}`}
                    >
                        <span aria-hidden="true">{level.icon}</span>
                        <span>{level.label}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2.5 text-[11px]">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500">
                            Précision
                        </span>
                        <span
                            data-testid="coach-accuracy-value"
                            className="font-mono font-bold text-slate-200"
                        >
                            {decisionsCount > 0 ? `${accuracy.toFixed(1)}%` : '--'}
                        </span>
                    </div>
                    <span className="text-slate-700">·</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[11px] uppercase tracking-wider text-slate-500">
                            ΔEq
                        </span>
                        <span
                            data-testid="coach-total-equity-loss"
                            className="font-mono font-bold text-rose-300"
                        >
                            -{totalEquityLoss.toFixed(3)}
                        </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                        ({decisionsCount} déc.)
                    </span>
                </div>
            </div>

            {/* Jauge graduée fine */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                    data-testid="coach-pr-gauge"
                    className={`h-full rounded-full transition-all duration-500 ${level.barClass}`}
                    style={{ width: `${fillPercent}%` }}
                />
            </div>

            {/* 2. Grille compacte en ligne des 4 paliers */}
            <div className="grid grid-cols-4 gap-1">
                {cells.map((cell) => {
                    const value = counters[cell.key];
                    const isClickable = Boolean(cell.onClick) && value > 0;
                    const Tag = isClickable ? 'button' : 'div';
                    return (
                        <Tag
                            key={cell.key}
                            {...(isClickable
                                ? {
                                      type: 'button' as const,
                                      onClick: cell.onClick,
                                      title: `Voir les ${cell.label.toLowerCase()} (${value})`,
                                  }
                                : {})}
                            data-testid={`coach-counter-${cell.key}`}
                            className={`flex items-center justify-between rounded-lg border px-1.5 py-1 transition ${cell.className} ${
                                isClickable ? 'cursor-pointer hover:brightness-125 active:scale-95' : ''
                            }`}
                        >
                            <span className="inline-flex items-center gap-1 min-w-0">
                                <span aria-hidden="true" className="text-[11px] leading-none shrink-0">
                                    {cell.icon}
                                </span>
                                <span className="truncate text-[11px] font-semibold uppercase tracking-wide opacity-85">
                                    {cell.label}
                                </span>
                            </span>
                            <span className="font-mono text-xs font-black leading-none ml-1">
                                {value}
                            </span>
                        </Tag>
                    );
                })}
            </div>

            {/* 3. Cap de Progression en direct (0 Blunder = Pro, 1 Blunder = Bon Joueur) */}
            {decisionsCount > 0 && (
                <div
                    data-testid="coach-live-blunder-target"
                    className="flex items-center justify-between rounded-lg border border-slate-800/90 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold text-slate-300"
                >
                    <span>
                        {counters.blunder === 0
                            ? '🏆 Exécution Pro en cours : 0 Blunder'
                            : counters.blunder === 1
                              ? '🎯 Palier Bon Joueur : 1 seul Blunder (visez 0 de plus !)'
                              : `⚡ Cap Manche : ${counters.blunder} Blunders — verrouillez vos portes & le Videau`}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-indigo-300">
                        {counters.blunder === 0 && counters.inaccuracy > 0
                            ? `${counters.inaccuracy} micro-blunder(s)`
                            : `Cap ≤ 1`}
                    </span>
                </div>
            )}
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachPrDashboard = React.memo(CoachPrDashboardComponent);
export default CoachPrDashboard;
