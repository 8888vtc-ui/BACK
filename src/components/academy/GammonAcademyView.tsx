'use client';

/**
 * Vue principale du Hub SEO "Gammon Academy" (`/academy`).
 *
 * Contient :
 * 1. Guide interactif des 15 Rouleaux d'Ouverture (`OpeningRollsTable`)
 * 2. Guide de Maîtrise du Videau (Take Point 21.5% / 25%, Crawford, Jacoby, MET Kazaross-XG2)
 * 3. Plans de Jeu Grand-Maître, Keith Count & Échelle PR Open Sage 3-Ply
 * 4. Matrice Terminologique Multilingue (FR, EN, ES, PT, DE, AR)
 * 5. Foire Aux Questions (FAQ SEO) & Maillage interne vers Salon, Drills et Puzzles
 * Loi de Scalabilité : strictement 0 any, < 300 lignes.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import OpeningRollsTable from './OpeningRollsTable';
import { getAcademyContent } from '../../features/academy/academyTranslations';
import {
    useTranslation,
    BACKGAMMON_TERMINOLOGY_MATRIX,
    type BackgammonTermKey,
    type PrimaryLocale,
} from '../../i18n';

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

const GammonAcademyViewComponent: React.FC = () => {
    const { locale, dir } = useTranslation();
    const safeLocale: PrimaryLocale =
        locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'pt' || locale === 'de' || locale === 'ar'
            ? locale
            : 'en';
    const content = useMemo(() => getAcademyContent(safeLocale), [safeLocale]);

    return (
        <div
            dir={dir}
            data-testid="gammon-academy-view"
            className="h-dvh w-full overflow-y-auto text-slate-100 selection:bg-amber-600/40 flex flex-col relative"
            style={{
                background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.16) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
            }}
        >
            <AppNavbar activeTab="academy" />

            <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
                {/* En-tête Encyclopédique Gammon Academy */}
                <header className="rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#1e170b]/95 via-[#0e1422]/95 to-[#080c15]/95 p-6 sm:p-8 text-center shadow-[0_18px_46px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,245,205,0.22)] space-y-4">
                    <span className="inline-block rounded-full border border-[#d4af37]/45 bg-black/50 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#f3c65f]">
                        🏛️ {content.heroBadge}
                    </span>
                    <h1 className="font-serif bg-gradient-to-b from-[#fff9e6] via-[#f0cb69] to-[#b38428] bg-clip-text text-2xl sm:text-4xl font-black tracking-wide text-transparent">
                        {content.heroTitle}
                    </h1>
                    <p className="mx-auto max-w-3xl text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {content.heroSubtitle}
                    </p>

                    {/* Sommaire d'ancres rapides (Maillage Interne) */}
                    <nav aria-label="Sommaire Gammon Academy" className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <a href="#openings-guide" className="rounded-full border border-[#d4af37]/35 bg-[#0b101b] px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] transition">
                            {content.navOpenings}
                        </a>
                        <a href="#doubling-cube-guide" className="rounded-full border border-[#d4af37]/35 bg-[#0b101b] px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] transition">
                            {content.navCube}
                        </a>
                        <a href="#grandmaster-strategy" className="rounded-full border border-[#d4af37]/35 bg-[#0b101b] px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] transition">
                            {content.navStrategy}
                        </a>
                        <a href="#lexicon-matrix" className="rounded-full border border-[#d4af37]/35 bg-[#0b101b] px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] transition">
                            {content.navGlossary}
                        </a>
                        <a href="#seo-faq" className="rounded-full border border-[#d4af37]/35 bg-[#0b101b] px-3.5 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] transition">
                            {content.navFaq}
                        </a>
                    </nav>
                </header>

                {/* SECTION I : Les 15 Rouleaux d'Ouverture */}
                <OpeningRollsTable content={content} locale={safeLocale} />

                {/* SECTION II : Guide de Maîtrise du Videau (Doubling Cube) */}
                <section
                    id="doubling-cube-guide"
                    aria-labelledby="cube-guide-heading"
                    data-testid="academy-cube-section"
                    className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-5"
                >
                    <div className="space-y-2">
                        <h2 id="cube-guide-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.cubeSectionTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.cubeSectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.cubePillars.map((pillar, idx) => (
                            <article
                                key={idx}
                                className="rounded-2xl border border-[#d4af37]/30 bg-[#080c15]/90 p-5 space-y-3"
                            >
                                <span className="inline-block rounded-full border border-[#d4af37]/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f3c65f]">
                                    {pillar.badge}
                                </span>
                                <h3 className="font-serif text-base font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">{pillar.summary}</p>
                                <div className="rounded-xl border border-amber-400/30 bg-black/50 p-3 font-mono text-xs font-bold text-amber-200">
                                    {pillar.formula}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                                    {pillar.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                {/* SECTION III : Plans de Jeu Grand-Maître, Keith Count & Performance Rating (PR) */}
                <section
                    id="grandmaster-strategy"
                    aria-labelledby="strategy-guide-heading"
                    data-testid="academy-strategy-section"
                    className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-5"
                >
                    <div className="space-y-2">
                        <h2 id="strategy-guide-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.strategySectionTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.strategySectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.strategyPillars.map((pillar, idx) => (
                            <article
                                key={idx}
                                className="rounded-2xl border border-[#d4af37]/30 bg-[#080c15]/90 p-5 space-y-3"
                            >
                                <span className="inline-block rounded-full border border-[#d4af37]/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                                    {pillar.badge}
                                </span>
                                <h3 className="font-serif text-base font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">{pillar.summary}</p>
                                <div className="rounded-xl border border-emerald-400/30 bg-black/50 p-3 font-mono text-xs font-bold text-emerald-300">
                                    {pillar.formula}
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                                    {pillar.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            </article>
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

                {/* SECTION V : FAQ SEO Officielle */}
                <section
                    id="seo-faq"
                    aria-labelledby="faq-heading"
                    data-testid="academy-faq-section"
                    className="rounded-3xl border border-[#d4af37]/35 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-4"
                >
                    <div className="space-y-1">
                        <h2 id="faq-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.faqSectionTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300">{content.faqSectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.faqs.map((faq, idx) => (
                            <article key={idx} className="rounded-2xl border border-[#d4af37]/25 bg-[#080c15]/90 p-5 space-y-2">
                                <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{faq.question}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Pied de page CTA & Maillage Interne */}
                <footer className="rounded-3xl border border-[#f3c65f]/50 bg-gradient-to-r from-[#23190c] via-[#131a2b] to-[#23190c] p-6 text-center space-y-4 shadow-2xl">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#fff6d6]">{content.ctaPlayTitle}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="rounded-2xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow-lg hover:scale-105 transition"
                        >
                            {content.ctaPlayBtn}
                        </Link>
                        <Link
                            href="/drills"
                            className="rounded-2xl border border-[#d4af37]/50 bg-[#0b101b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-200 hover:border-[#f3c65f] transition"
                        >
                            {content.ctaDrillsBtn}
                        </Link>
                        <Link
                            href="/puzzles"
                            className="rounded-2xl border border-[#d4af37]/50 bg-[#0b101b] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-200 hover:border-[#f3c65f] transition"
                        >
                            {content.ctaPuzzlesBtn}
                        </Link>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export const GammonAcademyView = React.memo(GammonAcademyViewComponent);
export default GammonAcademyView;
