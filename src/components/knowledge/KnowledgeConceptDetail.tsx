'use client';

import React from 'react';
import type { TheoryConcept, TheoryDifficulty } from '../../features/knowledge';

export interface KnowledgeConceptDetailProps {
    concept: TheoryConcept;
    isEn: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}

const DIFFICULTY_MAP: Record<TheoryDifficulty, { labelFr: string; labelEn: string; color: string }> = {
    beginner: { labelFr: 'Débutant', labelEn: 'Beginner', color: 'bg-emerald-500/20 text-emerald-300 border-white/10' },
    intermediate: { labelFr: 'Intermédiaire', labelEn: 'Intermediate', color: 'bg-blue-500/20 text-blue-300 border-white/10' },
    advanced: { labelFr: 'Avancé', labelEn: 'Advanced', color: 'bg-purple-500/20 text-purple-300 border-white/10' },
    master: { labelFr: 'Grand-Maître', labelEn: 'Grandmaster', color: 'bg-amber-500/20 text-amber-300 border-white/10' },
};

export const KnowledgeConceptDetail: React.FC<KnowledgeConceptDetailProps> = ({
    concept,
    isEn,
    containerRef,
}) => {
    return (
        <div
            ref={containerRef}
            className="flex-1 sm:w-3/5 md:w-2/3 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/50"
        >
            <div className="space-y-6 max-w-3xl">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-white/10">
                            👤 {concept.author}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${DIFFICULTY_MAP[concept.difficulty].color}`}>
                            {isEn ? DIFFICULTY_MAP[concept.difficulty].labelEn : DIFFICULTY_MAP[concept.difficulty].labelFr}
                        </span>
                    </div>

                    <h1
                        data-testid="kb-detail-title"
                        className="text-xl sm:text-2xl font-black tracking-tight text-white"
                    >
                        {isEn ? concept.title.en : concept.title.fr}
                    </h1>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {concept.tags.map((tag) => (
                            <span key={tag} className="text-xs font-semibold text-slate-300 bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-white/10">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-white/10 p-4 space-y-2 shadow-inner">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                        <span>💡</span> {isEn ? 'Key Takeaway' : 'À Retenir Absolument'}
                    </h3>
                    <p className="text-sm font-semibold text-white leading-relaxed">
                        {isEn ? concept.keyTakeaway.en : concept.keyTakeaway.fr}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1 border-t border-white/10">
                        {isEn ? concept.summary.en : concept.summary.fr}
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span>🧠</span> {isEn ? 'Theoretical Foundation' : 'Fondements Théoriques'}
                    </h3>
                    <div className="space-y-2 text-sm text-slate-200 leading-relaxed">
                        {(isEn ? concept.explanation.en : concept.explanation.fr).map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>
                </div>

                {concept.formulaOrRule && (
                    <div className="rounded-2xl bg-slate-900/90 border border-white/10 p-4 space-y-2 shadow-md">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                <span>📐</span> {concept.formulaOrRule.name}
                            </h4>
                        </div>
                        {concept.formulaOrRule.formula && (
                            <div className="rounded-xl bg-slate-950 p-3 font-mono text-sm font-black text-amber-300 border border-white/10">
                                {concept.formulaOrRule.formula}
                            </div>
                        )}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            {isEn
                                ? concept.formulaOrRule.explanation.en
                                : concept.formulaOrRule.explanation.fr}
                        </p>
                    </div>
                )}

                {concept.practicalExamples.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <span>🎯</span> {isEn ? 'Practical Examples & Key Positions' : 'Exemples Pratiques & Positions Types'}
                        </h3>
                        <div className="space-y-3">
                            {concept.practicalExamples.map((ex, idx) => (
                                <div key={idx} className="rounded-2xl bg-slate-900/60 border border-white/10 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs sm:text-sm font-semibold text-slate-200">
                                            {isEn ? ex.positionDesc.en : ex.positionDesc.fr}
                                        </span>
                                        <span className="font-mono text-xs font-black text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-white/10 shrink-0">
                                            ✓ {ex.bestPlay}
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        <strong className="text-slate-200">{isEn ? 'Reasoning:' : 'Raisonnement :'}</strong>{' '}
                                        {isEn ? ex.reasoning.en : ex.reasoning.fr}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-amber-950/20 border border-white/10 p-4 space-y-1">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🏆</span> {isEn ? 'Grandmaster Golden Rule' : "Règle d'Or de Grand-Maître"}
                    </h4>
                    <p className="text-sm font-bold text-amber-200 italic leading-relaxed">
                        « {isEn ? concept.goldenRule.en : concept.goldenRule.fr} »
                    </p>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🌐</span> {isEn ? 'Authoritative Sources & Data References' : 'Sources Fiables & Références Documentaires'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {concept.sources.map((src, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl bg-slate-900/40 border border-white/10 p-3 text-xs flex flex-col justify-between"
                            >
                                <div>
                                    <span className="text-xs uppercase font-bold text-blue-300 block">
                                        [{src.type}] {src.author}
                                    </span>
                                    <strong className="text-white block mt-0.5 text-sm">{src.title}</strong>
                                    {src.details && <p className="text-slate-300 text-xs mt-0.5">{src.details}</p>}
                                </div>
                                {src.url && (
                                    <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 text-blue-300 hover:text-blue-200 inline-flex items-center gap-1 text-xs font-semibold"
                                    >
                                        <span>{isEn ? 'Read on Backgammon Galore' : 'Consulter sur Backgammon Galore'}</span>
                                        <span>↗</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(KnowledgeConceptDetail);
