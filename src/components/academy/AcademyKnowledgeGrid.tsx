'use client';

/**
 * Grille des 21 Concepts Stratégiques Grand-Maître (`/academy/concepts/[slug]`)
 * et Matrice Terminologique Internationale (6 langues).
 * Loi de Scalabilité : strictement 0 any, < 200 lignes.
 */

import React from 'react';
import Link from 'next/link';
import { KNOWLEDGE_BASE_CONCEPTS } from '../../features/knowledge/knowledgeBaseData';
import type { AcademyLocaleContent } from '../../features/academy/academyTranslations';
import {
    BACKGAMMON_TERMINOLOGY_MATRIX,
    type BackgammonTermKey,
    type PrimaryLocale,
} from '../../i18n';

export interface AcademyKnowledgeGridProps {
    readonly content: AcademyLocaleContent;
    readonly locale: PrimaryLocale;
}

const FEATURED_TERM_KEYS: readonly BackgammonTermKey[] = [
    'doublingCube',
    'goldenPoint',
    'barPoint',
    'pipCount',
    'prime',
    'blot',
    'bearOff',
    'crawfordRule',
    'doubleMatchPoint',
    'takePoint',
    'gammonPrice',
    'performanceRating',
    'blunder',
    'fischerIncrement',
] as const;

const AcademyKnowledgeGridComponent: React.FC<AcademyKnowledgeGridProps> = ({ content, locale }) => {
    const langKey: 'fr' | 'en' = locale === 'fr' ? 'fr' : 'en';

    return (
        <div className="space-y-8">
            {/* Bibliothèque des 21 Concepts Grand-Maître (Maillage SEO Programmatique) */}
            <section
                id="concepts-library"
                aria-labelledby="concepts-library-heading"
                data-testid="academy-concepts-library"
                className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-4"
            >
                <div className="space-y-1">
                    <h2
                        id="concepts-library-heading"
                        className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]"
                    >
                        {locale === 'fr'
                            ? 'Encyclopédie des 21 Concepts Grand-Maître (Magriel, Woolsey, Kazaross, Mochy)'
                            : '21 Grandmaster Strategy Concepts (Magriel, Woolsey, Kazaross, Mochy)'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                        {locale === 'fr'
                            ? 'Chaque fiche contient la formule mathématique officielle, la règle d’or et des positions de tournoi évaluées en 3-Ply :'
                            : 'Each guide includes the official mathematical formula, golden rule, and 3-Ply tournament positions:'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {KNOWLEDGE_BASE_CONCEPTS.map((concept) => (
                        <Link
                            key={concept.slug}
                            href={`/academy/concepts/${concept.slug}`}
                            data-testid={`concept-link-${concept.slug}`}
                            className="group rounded-2xl border border-[#d4af37]/25 bg-[#080c15]/90 p-4 hover:border-[#f3c65f] transition space-y-1.5 flex flex-col justify-between"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-300/90">
                                    <span>{concept.author}</span>
                                    <span className="text-emerald-300">{concept.difficulty}</span>
                                </div>
                                <h3 className="font-serif text-sm font-bold text-[#fdf8eb] group-hover:text-[#f5cf70] transition">
                                    {concept.title[langKey]} ↗
                                </h3>
                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {concept.summary[langKey]}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* SECTION IV : Matrice Terminologique Internationale (6 Langues) */}
            <section
                id="lexicon-matrix"
                aria-labelledby="glossary-heading"
                data-testid="academy-glossary-section"
                className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-4"
            >
                <div className="space-y-1">
                    <h2 id="glossary-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                        {content.glossarySectionTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300">{content.glossarySectionDesc}</p>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#070a11]/90">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-[#d4af37]/30 bg-[#101624] font-extrabold uppercase tracking-wider text-[#e5c158]">
                                <th className="py-2.5 px-3">🇫🇷 FR</th>
                                <th className="py-2.5 px-3">🇬🇧 EN</th>
                                <th className="py-2.5 px-3">🇪🇸 ES</th>
                                <th className="py-2.5 px-3">🇵🇹 PT</th>
                                <th className="py-2.5 px-3">🇩🇪 DE</th>
                                <th className="py-2.5 px-3">🇸🇦 AR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {FEATURED_TERM_KEYS.map((termKey) => {
                                const row = BACKGAMMON_TERMINOLOGY_MATRIX[termKey];
                                return (
                                    <tr key={termKey} className="hover:bg-white/[0.03]">
                                        <td className="py-2.5 px-3 font-semibold text-amber-100">{row.fr}</td>
                                        <td className="py-2.5 px-3 font-semibold text-slate-200">{row.en}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{row.es}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{row.pt}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{row.de}</td>
                                        <td className="py-2.5 px-3 text-amber-200" dir="rtl">{row.ar}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export const AcademyKnowledgeGrid = React.memo(AcademyKnowledgeGridComponent);
export default AcademyKnowledgeGrid;
