'use client';

import React from 'react';

export interface SelectedHeatmapCellDetail {
    title: string;
    description?: string;
    phaseLabel: string;
    errorCount: number;
    blunderCount: number;
    totalEquityLoss: number;
}

export interface ConceptsHeatmapDetailCardProps {
    cell: SelectedHeatmapCellDetail;
}

export const ConceptsHeatmapDetailCard: React.FC<ConceptsHeatmapDetailCardProps> = ({ cell }) => {
    if (cell.errorCount <= 0) return null;

    return (
        <div
            className="rounded-xl border border-white/10 bg-gradient-to-r from-amber-950/40 to-slate-900 p-4 space-y-2 animate-in fade-in"
            data-testid="heatmap-selected-detail"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded border border-white/10 bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 uppercase">
                            Phase : {cell.phaseLabel}
                        </span>
                        <h4 className="text-sm font-black text-white">
                            {cell.title}
                        </h4>
                    </div>
                    {cell.description && (
                        <p className="text-xs text-slate-300 mt-0.5">
                            {cell.description}
                        </p>
                    )}
                    <p className="text-xs sm:text-sm text-slate-200 mt-1">
                        {cell.errorCount} faute(s) dont {cell.blunderCount} blunder(s) relevé(s) — Perte cumulée de {cell.totalEquityLoss} ΔEq.
                    </p>
                </div>

                <a
                    href="/drills"
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-md hover:from-amber-400 hover:to-yellow-400 transition shrink-0"
                >
                    🎯 Entraîner en Drill
                </a>
            </div>
        </div>
    );
};

export default React.memo(ConceptsHeatmapDetailCard);
