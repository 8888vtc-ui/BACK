'use client';

/**
 * Carte interactive gamifiée d'un module d'apprentissage (Audit 4 / 5 — ModuleProgressCard).
 *
 * Affiche :
 *   - Icône, titre, compteur dynamique en direct (streak, erreurs à réviser, ouvertures)
 *   - Jauge de progression colorée Or / Émeraude
 *   - Badge d'action explicite ('Continuer', 'S'entraîner', 'Analyser')
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React from 'react';
import type { LobbyModuleId } from './LobbyScreen';

export interface ModuleProgressCardProps {
    id: LobbyModuleId;
    testId: string;
    icon: string;
    title: string;
    liveMetricLabel: string;
    progressPct: number;
    actionBadge: 'Continuer' | "S'entraîner" | 'Analyser' | 'Résoudre →' | 'Corriger →' | 'Étudier →';
    highlightBadge?: string | null;
    tooltip?: string;
    onSelect: (id: LobbyModuleId) => void;
}

const ModuleProgressCardComponent: React.FC<ModuleProgressCardProps> = ({
    id,
    testId,
    icon,
    title,
    liveMetricLabel,
    progressPct,
    actionBadge,
    highlightBadge,
    tooltip,
    onSelect,
}) => {
    const clampedPct = Math.max(0, Math.min(100, Math.round(progressPct)));

    return (
        <button
            type="button"
            data-testid={testId}
            title={tooltip}
            onClick={() => onSelect(id)}
            className="group relative flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/50 p-3 text-left transition-all duration-150 hover:border-white/25 hover:bg-slate-800/70 active:scale-[0.98]"
        >
            {/* Ligne supérieure : Icône + Badge d'action */}
            <div className="flex w-full items-center justify-between gap-1.5">
                <span aria-hidden="true" className="text-lg leading-none transition-transform group-hover:scale-105">
                    {icon}
                </span>
                <span
                    data-testid={`${testId}-action-badge`}
                    className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition group-hover:border-amber-400/40 group-hover:bg-amber-400/15 group-hover:text-amber-200"
                >
                    {actionBadge}
                </span>
            </div>

            {/* Titre & Compteur dynamique */}
            <div className="flex flex-col gap-0.5">
                <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-white">
                    {title}
                </span>
                <span
                    data-testid={`${testId}-live-metric`}
                    className="text-[11px] font-medium text-emerald-400/90 leading-tight"
                >
                    {liveMetricLabel}
                </span>
            </div>

            {/* Barre de progression Or / Émeraude + Pourcentage ou Streak */}
            <div className="w-full pt-0.5">
                <div className="mb-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{highlightBadge ?? 'Progression'}</span>
                    <span className="font-bold text-slate-200">{clampedPct}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                        data-testid={`${testId}-progress-bar`}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${clampedPct}%` }}
                    />
                </div>
            </div>
        </button>
    );
};

export const ModuleProgressCard = React.memo(ModuleProgressCardComponent);
export default ModuleProgressCard;
