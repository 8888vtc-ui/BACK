'use client';

/**
 * @file src/components/lobby/ModuleProgressCard.tsx
 * @description Carte d'engagement active d'un module d'apprentissage (Audit Haute Horlogerie).
 * Icônes vectorielles `lucide-react`, courbe `cubic-bezier(0.22,1,0.36,1)`, et statut d'invitation dynamique.
 * Strictement 0 `any`, < 120 lignes.
 */

import React from 'react';
import { BarChart3, BookOpen, Flame, Puzzle } from 'lucide-react';
import type { LobbyModuleId } from './LobbyScreen';

export type ModuleActionBadge =
    | 'Continuer'
    | "S'entraîner"
    | 'Analyser'
    | 'Résoudre →'
    | 'Corriger →'
    | 'Étudier →'
    | 'Calibrer mon PR →'
    | 'Lancer un match →';

export interface ModuleProgressCardProps {
    id: LobbyModuleId;
    testId: string;
    icon: string;
    title: string;
    liveMetricLabel: string;
    progressPct: number;
    actionBadge: ModuleActionBadge;
    highlightBadge?: string | null;
    /** Texte d'engagement affiché à la place de `0%` lorsque la carte est à l'état initial. */
    zeroStateLabel?: string;
    /** Largeur visuelle minimale de la jauge pré-amorcée lorsque `progressPct === 0`. */
    primedGaugePct?: number;
    tooltip?: string;
    onSelect: (id: LobbyModuleId) => void;
}

function renderVectorModuleIcon(id: LobbyModuleId): React.ReactNode {
    switch (id) {
        case 'puzzles':
            return <Puzzle size={17} strokeWidth={1.5} aria-hidden="true" className="text-[#10B981]" />;
        case 'drills':
            return <Flame size={17} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />;
        case 'openings':
            return <BookOpen size={17} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />;
        default:
            return <BarChart3 size={17} strokeWidth={1.5} aria-hidden="true" className="text-[#10B981]" />;
    }
}

const ModuleProgressCardComponent: React.FC<ModuleProgressCardProps> = ({
    id,
    testId,
    title,
    liveMetricLabel,
    progressPct,
    actionBadge,
    highlightBadge,
    zeroStateLabel,
    primedGaugePct,
    tooltip,
    onSelect,
}) => {
    const clampedPct = Math.max(0, Math.min(100, Math.round(progressPct)));
    const barWidthPct = clampedPct === 0 && primedGaugePct ? primedGaugePct : clampedPct;
    const rightStatusLabel = clampedPct === 0 && zeroStateLabel ? zeroStateLabel : `${clampedPct}%`;

    return (
        <button
            type="button"
            data-testid={testId}
            title={tooltip}
            onClick={() => onSelect(id)}
            className="group relative flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-[#0B0E14]/90 p-3 text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[1px] hover:border-white/15 hover:bg-white/[0.03] active:scale-[0.99]"
        >
            <div className="flex w-full items-center justify-between gap-1.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] transition-transform duration-200 group-hover:scale-105">
                    {renderVectorModuleIcon(id)}
                </span>
                <span
                    data-testid={`${testId}-action-badge`}
                    className="rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#F3E5AB] transition-all duration-150 group-hover:border-[#D4AF37]/60 group-hover:bg-[#D4AF37]/20"
                >
                    {actionBadge}
                </span>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white">{title}</span>
                <span data-testid={`${testId}-live-metric`} className="text-[11px] font-medium text-[#34D399] leading-tight">
                    {liveMetricLabel}
                </span>
            </div>

            <div className="w-full pt-0.5">
                <div className="mb-1 flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400">
                    <span>{highlightBadge ?? 'Progression'}</span>
                    <span className="font-semibold text-zinc-200">{rightStatusLabel}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                        data-testid={`${testId}-progress-bar`}
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#10B981] transition-all duration-300"
                        style={{ width: `${barWidthPct}%` }}
                    />
                </div>
            </div>
        </button>
    );
};

export const ModuleProgressCard = React.memo(ModuleProgressCardComponent);
export default ModuleProgressCard;
