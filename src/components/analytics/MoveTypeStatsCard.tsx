'use client';

import React from 'react';
import type { MoveTypeMetric } from '../../features/analytics/types';

export interface MoveTypeStatsCardProps {
    metrics: MoveTypeMetric[];
}

export default function MoveTypeStatsCard({ metrics }: MoveTypeStatsCardProps) {
    if (!metrics || metrics.length === 0) return null;

    return (
        <div
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4"
            data-testid="move-type-stats-card"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>🎯</span>
                        <span>Taux d'Erreur &amp; Maîtrise par Type de Coup</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Performance comparée par phase de jeu et nature tactique des décisions.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {metrics.map((metric) => {
                    const isHighMastery = metric.masteryPercentage >= 80;
                    const isMediumMastery = metric.masteryPercentage >= 65 && metric.masteryPercentage < 80;

                    return (
                        <div
                            key={metric.type}
                            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3 hover:border-slate-700 transition shadow-sm flex flex-col justify-between"
                            data-testid={`move-type-card-${metric.type}`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{metric.icon}</span>
                                        <h4 className="text-sm font-black text-white">
                                            {metric.label}
                                        </h4>
                                    </div>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold border ${
                                            isHighMastery
                                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                                : isMediumMastery
                                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                                                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                        }`}
                                    >
                                        {metric.masteryPercentage}%
                                    </span>
                                </div>

                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                    {metric.description}
                                </p>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                {/* Barre de progression de maîtrise */}
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            isHighMastery
                                                ? 'bg-emerald-500'
                                                : isMediumMastery
                                                ? 'bg-amber-500'
                                                : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${metric.masteryPercentage}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
                                        <div className="text-[11px] text-slate-400 font-sans uppercase">Coups</div>
                                        <div className="text-white font-bold">{metric.decisionsCount}</div>
                                    </div>

                                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
                                        <div className="text-[11px] text-slate-400 font-sans uppercase">Taux ΔEq</div>
                                        <div
                                            className={`font-bold ${
                                                metric.errorRate === 0
                                                    ? 'text-emerald-400'
                                                    : metric.errorRate > 0.05
                                                    ? 'text-rose-400'
                                                    : 'text-amber-400'
                                            }`}
                                        >
                                            {metric.errorRate.toFixed(3)}
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80">
                                        <div className="text-[11px] text-slate-400 font-sans uppercase">Blunders</div>
                                        <div
                                            className={`font-bold ${
                                                metric.blunderCount > 0 ? 'text-rose-400' : 'text-slate-400'
                                            }`}
                                        >
                                            {metric.blunderCount}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
