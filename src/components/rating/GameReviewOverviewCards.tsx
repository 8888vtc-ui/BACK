'use client';

/**
 * Cartes de synthèse (PR, Elo estimé, Issue du match) et jauge de répartition des décisions
 * pour la modale GameReviewModal (< 200 lignes, 0 any).
 */

import React from 'react';
import type { CompleteGameAnalysis } from '../../features/rating/types';

export interface GameReviewOverviewCardsProps {
    analysis: CompleteGameAnalysis;
}

export const GameReviewOverviewCards: React.FC<GameReviewOverviewCardsProps> = ({ analysis }) => {
    const breakdownSum =
        analysis.breakdown.optimal +
        analysis.breakdown.acceptable +
        analysis.breakdown.doubtful +
        analysis.breakdown.blunder +
        analysis.breakdown.howler;
    const totalDecisions = Math.max(1, breakdownSum || analysis.unforcedDecisionsCount);
    const displayCategory = analysis.prCategory === 'Débutant' ? 'En Progression' : analysis.prCategory;

    return (
        <div className="space-y-4">
            {/* Cartes Clés : PR & Elo Estimé */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* PR Card */}
                <div className="rounded-2xl border border-white/10 bg-[#1c1008]/90 p-4 relative overflow-hidden">
                    <span className="text-[11px] font-bold text-[#f3c65f] uppercase tracking-wider">
                        Performance Rating (PR)
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span
                            className="text-3xl sm:text-4xl font-extrabold font-mono text-white"
                            data-testid="review-pr-value"
                        >
                            {analysis.performanceRating}
                        </span>
                        <span className="rounded-full border border-white/10 bg-[#2f1b0c] px-2 py-0.5 text-xs font-bold text-[#fce8b2]">
                            {displayCategory}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-[#e8dcc6]/70">
                        Erreur moyenne : -{analysis.errorRate} ΔEq / coup
                        {analysis.snowieErrorRate !== undefined && (
                            <span className="ml-2 text-[#e8dcc6]/50">
                                (Snowie ER: -{analysis.snowieErrorRate})
                            </span>
                        )}
                    </p>
                    {analysis.luckAdjustedPR !== undefined && (
                        <p className="mt-0.5 text-[11px] text-[#f3c65f]/85 font-mono" data-testid="review-luck-adjusted-pr">
                            PR Ajusté Chance : {analysis.luckAdjustedPR} • Luck :{' '}
                            {(analysis.totalLuck ?? 0) >= 0 ? '+' : ''}
                            {(analysis.totalLuck ?? 0).toFixed(3)} EMG
                        </p>
                    )}
                </div>

                {/* Elo Estimé Card */}
                <div className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Niveau Elo Estimé
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span
                            className="text-3xl sm:text-4xl font-extrabold font-mono text-amber-300"
                            data-testid="review-elo-value"
                        >
                            {analysis.estimatedRating}
                        </span>
                        <span className="text-xs text-amber-400/80 font-bold">Elo</span>
                    </div>
                    <p className="mt-1 text-xs text-[#e8dcc6]/70">
                        Étalonnage compétitif officiel WBF / Galaxy
                    </p>
                </div>

                {/* Résultat Manche Card */}
                <div className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4 flex flex-col justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-[#e8dcc6]/70 uppercase tracking-wider">
                            Issue du match
                        </span>
                        <p className="mt-1 text-sm font-bold text-white">
                            {analysis.winner === analysis.player
                                ? `🎉 Victoire Joueur ${analysis.player}`
                                : `Défaite Joueur ${analysis.player}`}
                        </p>
                    </div>
                    <div className="text-xs text-[#e8dcc6]/70 flex items-center justify-between border-t border-white/10 pt-2 mt-2">
                        <span>Score : {analysis.scoreX} - {analysis.scoreO}</span>
                        <span>{analysis.unforcedDecisionsCount} décisions libres</span>
                    </div>
                </div>
            </div>

            {/* Jauge de Répartition des Coups */}
            <div className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#e8dcc6]">
                        Répartition de la qualité des décisions ({analysis.unforcedDecisionsCount})
                    </span>
                </div>

                <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#0d0704]">
                    {analysis.breakdown.optimal > 0 && (
                        <div
                            title={`Optimal : ${analysis.breakdown.optimal}`}
                            className="bg-emerald-500 transition-all duration-300"
                            style={{ width: `${(analysis.breakdown.optimal / totalDecisions) * 100}%` }}
                        />
                    )}
                    {analysis.breakdown.acceptable > 0 && (
                        <div
                            title={`Acceptable : ${analysis.breakdown.acceptable}`}
                            className="bg-teal-500 transition-all duration-300"
                            style={{ width: `${(analysis.breakdown.acceptable / totalDecisions) * 100}%` }}
                        />
                    )}
                    {analysis.breakdown.doubtful > 0 && (
                        <div
                            title={`Douteux : ${analysis.breakdown.doubtful}`}
                            className="bg-amber-500 transition-all duration-300"
                            style={{ width: `${(analysis.breakdown.doubtful / totalDecisions) * 100}%` }}
                        />
                    )}
                    {analysis.breakdown.blunder > 0 && (
                        <div
                            title={`Blunder : ${analysis.breakdown.blunder}`}
                            className="bg-rose-500 transition-all duration-300"
                            style={{ width: `${(analysis.breakdown.blunder / totalDecisions) * 100}%` }}
                        />
                    )}
                    {analysis.breakdown.howler > 0 && (
                        <div
                            title={`Howler : ${analysis.breakdown.howler}`}
                            className="bg-red-600 transition-all duration-300"
                            style={{ width: `${(analysis.breakdown.howler / totalDecisions) * 100}%` }}
                        />
                    )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Optimal : <strong>{analysis.breakdown.optimal}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-300">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        Acceptable : <strong>{analysis.breakdown.acceptable}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Douteux : <strong>{analysis.breakdown.doubtful}</strong>
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-300">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        Blunder : <strong>{analysis.breakdown.blunder}</strong>
                    </span>
                    {analysis.breakdown.howler > 0 && (
                        <span className="flex items-center gap-1.5 text-red-300">
                            <span className="h-2 w-2 rounded-full bg-red-600" />
                            Howler : <strong>{analysis.breakdown.howler}</strong>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameReviewOverviewCards;
