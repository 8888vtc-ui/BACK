'use client';

import React from 'react';
import type { CompleteGameAnalysis } from '../../features/rating';

export interface ProgressionMatchesHistoryProps {
    analyses: CompleteGameAnalysis[];
    onSelectAnalysis: (analysis: CompleteGameAnalysis) => void;
}

export const ProgressionMatchesHistory: React.FC<ProgressionMatchesHistoryProps> = ({
    analyses,
    onSelectAnalysis,
}) => {
    if (analyses.length === 0) return null;

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>📜</span>
                        <span>Historique des Matchs &amp; Évaluation du Moteur ({analyses.length})</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                        Consultez le diagnostic détaillé coup par coup et la note PR de chacune de vos parties.
                    </p>
                </div>
            </div>

            <div className="divide-y divide-white/10" data-testid="game-analyses-list">
                {analyses.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-white/[0.03] px-2 rounded-xl transition cursor-pointer"
                        onClick={() => onSelectAnalysis(item)}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {item.winner === item.player ? '🏆' : '🏳️'}
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white">
                                        Match {item.matchLength} pts ({item.scoreX} - {item.scoreO})
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            item.winner === item.player
                                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                                : 'border border-white/10 bg-white/5 text-slate-300'
                                        }`}
                                    >
                                        {item.winner === item.player ? 'Victoire' : 'Défaite'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    {new Date(item.date).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: 'short',
                                    })}{' '}
                                    · {item.totalMovesCount} coups · Erreur moy. : -{item.errorRate.toFixed(3)} ΔEq
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                                <div className="flex items-baseline gap-1.5 justify-end">
                                    <span className="text-[11px] uppercase font-bold text-slate-400">
                                        PR :
                                    </span>
                                    <span className="font-mono text-base font-black text-amber-300">
                                        {item.performanceRating}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-blue-300 font-bold">
                                    ~{item.estimatedRating} Elo ({item.prCategory})
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAnalysis(item);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200 transition shadow-sm"
                                data-testid={`review-game-btn-${item.id}`}
                            >
                                🔍 Détails
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(ProgressionMatchesHistory);
