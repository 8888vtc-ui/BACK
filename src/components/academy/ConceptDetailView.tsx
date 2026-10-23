'use client';

/**
 * Vue encyclopédique dédiée à un Concept Stratégique Grand-Maître (`/academy/concepts/[slug]`).
 * Alimentée par les 21 concepts de `KNOWLEDGE_BASE_CONCEPTS`.
 * Loi de Scalabilité : strictement 0 any, < 250 lignes.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import { KNOWLEDGE_BASE_CONCEPTS } from '../../features/knowledge/knowledgeBaseData';
import { useTranslation } from '../../i18n';

export interface ConceptDetailViewProps {
    readonly slug: string;
}

const ConceptDetailViewComponent: React.FC<ConceptDetailViewProps> = ({ slug }) => {
    const { locale, dir } = useTranslation();
    const langKey: 'fr' | 'en' = locale === 'fr' ? 'fr' : 'en';

    const concept = useMemo(
        () => KNOWLEDGE_BASE_CONCEPTS.find((c) => c.slug === slug) ?? KNOWLEDGE_BASE_CONCEPTS[0],
        [slug],
    );

    return (
        <div
            dir={dir}
            data-testid={`concept-detail-${concept.slug}`}
            className="h-dvh w-full overflow-y-auto text-slate-100 flex flex-col relative"
            style={{
                background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.16) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
            }}
        >
            <AppNavbar activeTab="academy" />

            <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
                    <Link href="/" className="hover:text-amber-200">Backgammon Tour</Link>
                    <span>/</span>
                    <Link href="/academy" className="hover:text-amber-200">Gammon Academy</Link>
                    <span>/</span>
                    <span className="font-bold text-[#f5cf70]">{concept.title[langKey]}</span>
                </nav>

                <article className="rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#1e170b]/95 via-[#0e1422]/95 to-[#080c15]/95 p-6 sm:p-8 shadow-2xl space-y-6">
                    <header className="space-y-2 border-b border-white/10 pb-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#d4af37]/40 bg-black/50 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#f3c65f]">
                                🏛️ {concept.author} · {concept.difficulty.toUpperCase()}
                            </span>
                            {concept.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="font-serif text-2xl sm:text-4xl font-black text-[#fff6d6]">
                            {concept.title[langKey]}
                        </h1>
                        <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                            {concept.summary[langKey]}
                        </p>
                    </header>

                    {/* Règle d'Or & Formule Mathématique */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[#d4af37]/35 bg-[#070b13] p-5 space-y-2">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-[#f5cf70]">
                                ★ Règle d’Or Grand-Maître
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                                {concept.goldenRule[langKey]}
                            </p>
                        </div>

                        {concept.formulaOrRule && (
                            <div className="rounded-2xl border border-emerald-400/35 bg-[#070b13] p-5 space-y-2">
                                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                    📐 {concept.formulaOrRule.name}
                                </div>
                                {concept.formulaOrRule.formula && (
                                    <div className="font-mono text-xs sm:text-sm font-bold text-emerald-200 bg-black/50 p-2.5 rounded-xl border border-emerald-500/20">
                                        {concept.formulaOrRule.formula}
                                    </div>
                                )}
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {concept.formulaOrRule.explanation[langKey]}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Explication Théorique Approfondie */}
                    <div className="space-y-3">
                        <h2 className="font-serif text-lg font-bold text-[#f5cf70]">
                            Analyse Stratégique & Mécanique d’Équité
                        </h2>
                        {concept.explanation[langKey].map((paragraph, idx) => (
                            <p key={idx} className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    {/* Exemples Pratiques Certifiés */}
                    {concept.practicalExamples.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="font-serif text-lg font-bold text-[#f5cf70]">
                                Exemples de Tournoi & Décisions 3-Ply
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {concept.practicalExamples.map((ex, idx) => (
                                    <div key={idx} className="rounded-2xl border border-[#d4af37]/30 bg-black/40 p-4 space-y-2">
                                        <div className="text-xs font-bold text-amber-200">{ex.positionDesc[langKey]}</div>
                                        <div className="font-mono text-xs font-extrabold text-emerald-300">
                                            ✓ {ex.bestPlay}
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed">{ex.reasoning[langKey]}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                        <Link
                            href="/academy"
                            className="rounded-xl border border-[#d4af37]/40 bg-[#0b101b] px-4 py-2 text-xs font-bold text-amber-200 hover:border-[#f3c65f]"
                        >
                            ← Gammon Academy
                        </Link>
                        <Link
                            href="/drills"
                            className="rounded-xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-5 py-2 text-xs font-black uppercase tracking-wider text-[#1c1004]"
                        >
                            🎯 S’entraîner sur ce Concept (Drills)
                        </Link>
                    </div>
                </article>

                {/* Maillage Interne : Les 21 Concepts Grand-Maître */}
                <section className="rounded-3xl border border-[#d4af37]/30 bg-[#090d16]/95 p-5 space-y-3">
                    <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-[#f3c65f]">
                        Bibliothèque Complète des 21 Concepts Stratégiques Grand-Maître
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {KNOWLEDGE_BASE_CONCEPTS.map((item) => {
                            const isCurrent = item.slug === concept.slug;
                            return (
                                <Link
                                    key={item.slug}
                                    href={`/academy/concepts/${item.slug}`}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                                        isCurrent
                                            ? 'border-[#f3c65f] bg-[#3b2b12] text-[#fff6d6]'
                                            : 'border-[#d4af37]/25 bg-black/40 text-slate-300 hover:border-[#f3c65f] hover:text-amber-200'
                                    }`}
                                >
                                    {item.title[langKey]}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};

export const ConceptDetailView = React.memo(ConceptDetailViewComponent);
export default ConceptDetailView;
