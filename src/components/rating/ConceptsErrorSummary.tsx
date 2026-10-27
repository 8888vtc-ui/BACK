'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { EvaluatedTurn } from '../../features/rating/types';
import {
    STRATEGIC_CONCEPTS_CATALOG,
    categorizeExplanation,
} from '../../lib/stats/statsAggregator';

export interface ConceptsErrorSummaryProps {
    moves: EvaluatedTurn[];
    onSelectMoveIndex?: (index: number) => void;
}

export interface ConceptErrorGroup {
    conceptId: string;
    name: string;
    category: string;
    description: string;
    recommendation: string;
    totalErrors: number;
    blundersCount: number;
    doubtfulCount: number;
    totalEquityLoss: number;
    relatedMoveIndexes: number[];
}

export default function ConceptsErrorSummary({
    moves,
    onSelectMoveIndex,
}: ConceptsErrorSummaryProps) {
    // Regroupement des erreurs par concept stratégique
    const conceptGroups = useMemo<ConceptErrorGroup[]>(() => {
        const groupsMap = new Map<string, ConceptErrorGroup>();

        // Initialisation de la map avec le catalogue connu
        for (const c of STRATEGIC_CONCEPTS_CATALOG) {
            groupsMap.set(c.id, {
                conceptId: c.id,
                name: c.name,
                category: c.category,
                description: c.description,
                recommendation: c.recommendation,
                totalErrors: 0,
                blundersCount: 0,
                doubtfulCount: 0,
                totalEquityLoss: 0,
                relatedMoveIndexes: [],
            });
        }

        // Groupe de repli si concept non répertorié
        const fallbackGroup: ConceptErrorGroup = {
            conceptId: 'tactique_generale',
            name: 'Tactique générale & Gestion de position',
            category: 'Structure & Prime',
            description: 'Imprécision dans le choix des priorités tactiques sur ce tour.',
            recommendation: 'Évaluez toujours les 3 alternatives principales avant de jouer.',
            totalErrors: 0,
            blundersCount: 0,
            doubtfulCount: 0,
            totalEquityLoss: 0,
            relatedMoveIndexes: [],
        };

        // Analyse de chaque coup en erreur
        moves.forEach((m, index) => {
            if (m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler') {
                const cid =
                    m.conceptId ||
                    categorizeExplanation(m.explanation, `${m.playedNotation} ${m.optimalNotation}`);

                const group = groupsMap.get(cid) || fallbackGroup;
                group.totalErrors += 1;
                if (m.verdict === 'blunder' || m.verdict === 'howler') {
                    group.blundersCount += 1;
                } else {
                    group.doubtfulCount += 1;
                }
                group.totalEquityLoss += Math.abs(m.equityLoss);
                group.relatedMoveIndexes.push(index);
            }
        });

        // Filtrage des concepts ayant au moins 1 faute, triés par perte d'équité décroissante
        const activeGroups = Array.from(groupsMap.values()).filter((g) => g.totalErrors > 0);
        if (fallbackGroup.totalErrors > 0) {
            activeGroups.push(fallbackGroup);
        }

        return activeGroups.sort((a, b) => b.totalEquityLoss - a.totalEquityLoss);
    }, [moves]);

    if (conceptGroups.length === 0) {
        return (
            <div
                className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 to-slate-900 p-8 text-center space-y-2"
                data-testid="concepts-no-errors"
            >
                <div className="text-3xl">🏆</div>
                <h4 className="text-base font-black text-white">Exécution Stratégique Impeccable !</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Aucun concept en erreur n'a été relevé sur cette partie. Vos décisions sont en parfaite adéquation avec la théorie moderne Monte-Carlo 3-Ply.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4" data-testid="concepts-error-summary">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>🧠</span>
                        <span>Concepts Stratégiques à Travailler ({conceptGroups.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                        Diagnostics prioritaires basés sur vos erreurs et pertes d'équité réelles de la partie.
                    </p>
                </div>

                <Link
                    href="/drills"
                    className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition shadow-sm"
                >
                    <span>🎯</span>
                    <span>Accéder aux Drills</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {conceptGroups.map((group) => {
                    return (
                        <div
                            key={group.conceptId}
                            className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4 space-y-3 shadow-lg flex flex-col justify-between hover:border-[#d4af37]/40 transition"
                            data-testid={`concept-card-${group.conceptId}`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                                        {group.category}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-right font-mono text-xs">
                                        <span className="rounded-md bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 text-rose-300 font-bold">
                                            {group.blundersCount} blunder{group.blundersCount > 1 ? 's' : ''}
                                        </span>
                                        <span className="text-slate-400">
                                            -{group.totalEquityLoss.toFixed(3)} ΔEq
                                        </span>
                                    </div>
                                </div>

                                <h4 className="mt-2 text-sm font-extrabold text-white">
                                    {group.name}
                                </h4>

                                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                    {group.description}
                                </p>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-slate-800/80">
                                {/* Règle d'or de recommandation */}
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-xs text-amber-100">
                                    <span className="text-sm shrink-0">💡</span>
                                    <span className="leading-snug">{group.recommendation}</span>
                                </div>

                                {/* Actions sur les coups de ce concept */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1 flex-wrap text-[11px] text-slate-400">
                                        <span>Coups concernés :</span>
                                        {group.relatedMoveIndexes.map((idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => onSelectMoveIndex?.(idx)}
                                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-mono text-white text-[10px] font-bold"
                                                title={`Inspecter le coup #${idx + 1}`}
                                            >
                                                #{idx + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <Link
                                        href="/drills"
                                        className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 shrink-0"
                                    >
                                        <span>Entraîner</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
