'use client';

import React from 'react';
import Link from 'next/link';
import type { ConceptMetric, PlayerProgressionStats } from '../../lib/stats/statsAggregator';

export interface ProgressionConceptsSectionProps {
    weakestConcepts: ConceptMetric[];
    concepts: ConceptMetric[];
    recentExplanations: PlayerProgressionStats['recentExplanations'];
}

export const ProgressionConceptsSection: React.FC<ProgressionConceptsSectionProps> = ({
    weakestConcepts,
    concepts,
    recentExplanations,
}) => {
    return (
        <div className="space-y-6">
            {/* CONCEPTS STRATÉGIQUES À TRAVAILLER EN PRIORITÉ */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#fdf8eb] flex items-center gap-2">
                            <span>🎯</span>
                            <span>Concepts Stratégiques à Travailler en Priorité</span>
                        </h2>
                        <p className="text-xs text-[#a5b0c4]">
                            Les failles tactiques ayant causé le plus de perte d&apos;équité lors de vos dernières parties.
                        </p>
                    </div>
                    <span className="rounded-full bg-rose-950/80 border border-rose-600/60 px-3 py-1 text-xs font-bold text-rose-300">
                        {weakestConcepts.length} axe(s) critique(s)
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="weakest-concepts-grid">
                    {weakestConcepts.map((concept, idx) => (
                        <div
                            key={concept.id}
                            className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#150c07]/95 via-[#0e121b] to-[#080a0f] p-5 shadow-xl flex flex-col justify-between relative overflow-hidden"
                        >
                            <div className="absolute top-3 right-3">
                                <span className="rounded bg-rose-950/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-200 border border-rose-700/60">
                                    Priorité {idx + 1}
                                </span>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold text-[#f3c65f] uppercase tracking-wider">
                                    {concept.category}
                                </span>
                                <h3 className="mt-1 text-sm font-bold text-[#fdf8eb] leading-snug">
                                    {concept.name}
                                </h3>
                                <p className="mt-2 text-xs text-[#e2d2b5] leading-relaxed">
                                    {concept.description}
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#090b10]/90 p-2.5 text-xs border border-white/10">
                                    <div>
                                        <p className="text-[11px] text-[#a5b0c4]">Fautes commises</p>
                                        <p className="font-mono font-bold text-[#fdf8eb] mt-0.5">
                                            {concept.errorCount} {concept.blunderCount > 0 ? `(${concept.blunderCount} blunders)` : ''}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-[#a5b0c4]">Équité perdue</p>
                                        <p className="font-mono font-bold text-rose-400 mt-0.5">
                                            -{concept.totalEquityLoss.toFixed(3)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-[#a5b0c4] font-medium">Niveau de maîtrise</span>
                                        <span className="font-mono font-bold text-[#f3c65f]">
                                            {concept.masteryScore}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-[#090b10] border border-white/10 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-rose-500 to-[#d4af37] transition-all duration-500"
                                            style={{ width: `${concept.masteryScore}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-xl border border-white/10 bg-[#180c06]/80 p-3 text-xs text-[#e2d2b5] leading-relaxed">
                                💡 <span className="font-bold text-[#f3c65f]">Conseil du Coach :</span> {concept.recommendation}
                            </div>

                            <div className="mt-3">
                                <Link
                                    href="/drills"
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-[#f3c65f] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                                    data-testid={`drill-concept-btn-${concept.id}`}
                                >
                                    <span>🎯</span>
                                    <span>Rejouer les blunders en Drill</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* MATRICE GLOBALE DE MAÎTRISE DES CONCEPTS */}
            <section className="rounded-3xl border border-white/10 bg-[#0e121b]/95 p-5 shadow-xl space-y-4">
                <div className="border-b border-white/10 pb-3">
                    <h2 className="text-base font-bold text-[#fdf8eb] flex items-center gap-2">
                        <span>🧩</span>
                        <span>Matrice Globale de Maîtrise des Concepts de Backgammon</span>
                    </h2>
                    <p className="text-xs text-[#a5b0c4] mt-0.5">
                        Vue d&apos;ensemble de votre solidité tactique sur les 6 piliers fondamentaux.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="all-concepts-matrix">
                    {concepts.map((concept) => (
                        <div
                            key={concept.id}
                            className="rounded-2xl border border-white/10 bg-[#090b10]/90 p-4 space-y-3 hover:border-white/20 transition"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#f3c65f] uppercase tracking-wider">
                                    {concept.category}
                                </span>
                                <span
                                    className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${
                                        concept.priority === 'high'
                                            ? 'bg-rose-950 text-rose-300 border border-rose-700/60'
                                            : concept.priority === 'medium'
                                                ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                                                : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                    }`}
                                >
                                    {concept.priority === 'high' ? 'À travailler' : concept.priority === 'medium' ? 'Perfectible' : 'Maîtrisé'}
                                </span>
                            </div>

                            <h3 className="text-xs font-bold text-[#fdf8eb] leading-tight">
                                {concept.name}
                            </h3>

                            <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[11px] text-[#a5b0c4]">Maîtrise</span>
                                    <span className="font-mono text-xs font-semibold text-[#fdf8eb]">
                                        {concept.masteryScore}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full ${
                                            concept.masteryScore >= 75
                                                ? 'bg-emerald-500'
                                                : concept.masteryScore >= 50
                                                    ? 'bg-[#d4af37]'
                                                    : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${concept.masteryScore}%` }}
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-[#a5b0c4] italic">
                                {concept.recommendation}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* DERNIÈRES ERREURS CLÉS DU COACH */}
            {recentExplanations.length > 0 && (
                <section className="rounded-2xl border border-white/10 bg-[#0d121d]/90 p-5 shadow-xl space-y-4">
                    <div className="border-b border-white/10 pb-3">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <span>🔍</span>
                            <span>Dernières Erreurs Clés Analysées par le Coach</span>
                        </h2>
                        <p className="text-xs text-slate-300 mt-0.5">
                            Rappel de vos situations de jeu récentes et des leçons associées.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {recentExplanations.map((exp) => (
                            <div
                                key={exp.id}
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-2 text-xs"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase tracking-wider text-rose-400">
                                            {exp.verdict}
                                        </span>
                                        <span className="text-slate-500">·</span>
                                        <span className="font-mono text-slate-300">
                                            {exp.equity_loss ? `-${Math.abs(exp.equity_loss).toFixed(3)} équité` : ''}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400">
                                        {new Date(exp.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                                    <span className="text-rose-400">Joué : {exp.played_move}</span>
                                    <span className="text-emerald-400">Optimal : {exp.optimal_move}</span>
                                </div>

                                <p className="text-slate-200 font-semibold">{exp.summary}</p>
                                <p className="text-slate-300 leading-relaxed">{exp.explanation}</p>

                                {exp.advice && (
                                    <div className="rounded-md bg-amber-950/30 border border-white/10 p-2 text-amber-200 text-xs">
                                        💡 {exp.advice}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default React.memo(ProgressionConceptsSection);
