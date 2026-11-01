'use client';

/**
 * Vue principale du Hub SEO "Gammon Academy" (`/academy`).
 *
 * Contient :
 * 1. Guide interactif des 15 Rouleaux d'Ouverture (`OpeningRollsTable`) avec liens profonds `/academy/openings/[roll]`
 * 2. Guide de Maîtrise du Videau (Take Point 21.5% / 25%, Crawford, Jacoby, MET Kazaross-XG2)
 * 3. Calculateur Interactif d'Équité de Match (MET), Take Point & Course de Keith (`MatchEquityCalculator`)
 * 4. Plans de Jeu Grand-Maître, Keith Count & Échelle PR Monte-Carlo 3-Ply
 * 5. Grille des 21 Concepts Stratégiques (`/academy/concepts/[slug]`) & Matrice Terminologique 6 langues (`AcademyKnowledgeGrid`)
 * 6. Foire Aux Questions (FAQ SEO) & Maillage interne vers Salon, Drills et Puzzles
 * Loi de Scalabilité : strictement 0 any, < 250 lignes.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import BeginnerInteractiveRulesCourse from './BeginnerInteractiveRulesCourse';
import ErVsErhBenchmarkShowcase from './ErVsErhBenchmarkShowcase';
import OpeningRollsTable from './OpeningRollsTable';
import MatchEquityCalculator from './MatchEquityCalculator';
import AcademyKnowledgeGrid from './AcademyKnowledgeGrid';
import { getAcademyContent } from '../../features/academy/academyTranslations';
import { useTranslation, type PrimaryLocale } from '../../i18n';

type AcademyTab = 'beginner' | 'club' | 'pro';

const GammonAcademyViewComponent: React.FC = () => {
    const { locale, dir } = useTranslation();
    const [activeTab, setActiveTab] = useState<AcademyTab>('beginner');
    const safeLocale: PrimaryLocale =
        locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'pt' || locale === 'de' || locale === 'ar'
            ? locale
            : 'en';
    const content = useMemo(() => getAcademyContent(safeLocale), [safeLocale]);

    const showBeginner = activeTab === 'beginner';
    const showClub = activeTab === 'club';
    const showPro = activeTab === 'pro';

    return (
        <div
            dir={dir}
            data-testid="gammon-academy-view"
            className="h-dvh w-full overflow-y-auto text-slate-100 selection:bg-amber-600/40 flex flex-col relative"
            style={{
                background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.14) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
            }}
        >
            <AppNavbar activeTab="academy" />

            <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-5 sm:px-6">
                {/* Hero Header épuré (Zéro boîte encadrée, titre court, pills sur 1 seule ligne) */}
                <header className="pt-2 pb-1 text-center space-y-3">
                    <h1 className="font-serif bg-gradient-to-b from-[#fff9e6] via-[#f0cb69] to-[#b38428] bg-clip-text text-2xl sm:text-3xl font-black tracking-wide text-transparent">
                        {content.heroTitle}
                    </h1>
                    <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-300 truncate sm:whitespace-normal">
                        {content.heroSubtitle}
                    </p>

                    {/* Segmented Control / Pills fine et compacte sur une seule ligne */}
                    <nav aria-label="Niveaux de l'Académie" className="inline-flex flex-wrap items-center justify-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 p-1">
                        <button
                            type="button" data-testid="academy-tab-beginner" aria-pressed={activeTab === 'beginner'}
                            onClick={() => setActiveTab('beginner')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${activeTab === 'beginner' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-sm' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'}`}
                        >
                            🌱 1. Niveau Débutant
                        </button>
                        <button
                            type="button" data-testid="academy-tab-club" aria-pressed={activeTab === 'club'}
                            onClick={() => setActiveTab('club')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${activeTab === 'club' ? 'bg-[#f3c65f]/20 text-[#f3c65f] border border-[#f3c65f]/50 shadow-sm' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'}`}
                        >
                            🎲 2. Niveau Club
                        </button>
                        <button
                            type="button" data-testid="academy-tab-pro" aria-pressed={activeTab === 'pro'}
                            onClick={() => setActiveTab('pro')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${activeTab === 'pro' ? 'bg-amber-400/20 text-amber-200 border border-amber-300/50 shadow-sm' : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'}`}
                        >
                            🏆 3. Grand-Maître Pro
                        </button>
                    </nav>
                </header>

                {/* DÉMONSTRATION SCIENTIFIQUE : ER vs ERH (10 200 Parties vs 100 Robots Humains + 5 000 Machine) */}
                <ErVsErhBenchmarkShowcase />

                {/* PALIER 1 : Parcours Débutant Interactif */}
                <div className={showBeginner ? 'space-y-8' : 'hidden'}>
                    <BeginnerInteractiveRulesCourse />
                </div>

                {/* PALIER 2 : Les 15 Rouleaux d'Ouverture & Maîtrise du Videau */}
                <div className={showClub ? 'space-y-8' : 'hidden'}>
                    <OpeningRollsTable content={content} locale={safeLocale} />

                    <section
                        id="doubling-cube-guide"
                        aria-labelledby="cube-guide-heading"
                        data-testid="academy-cube-section"
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 space-y-4"
                    >
                        <div className="space-y-1">
                            <h2 id="cube-guide-heading" className="font-serif text-lg sm:text-xl font-bold tracking-wide text-[#f5cf70]">
                                {content.cubeSectionTitle}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.cubeSectionDesc}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.cubePillars.map((pillar, idx) => (
                                <article key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
                                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.summary}</p>
                                    <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 font-mono text-xs font-bold text-amber-200">
                                        {pillar.formula}
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                                        {pillar.details.map((detail, dIdx) => (
                                            <li key={dIdx}>{detail}</li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                {/* PALIER 3 : Calculateur MET Kazaross-XG2, Plans de Jeu Grand-Maître & 21 Concepts */}
                <div className={showPro ? 'space-y-8' : 'hidden'}>
                    <MatchEquityCalculator locale={safeLocale} />

                    {/* SECTION III : Plans de Jeu Grand-Maître, Keith Count & Performance Rating (PR) */}
                    <section
                        id="grandmaster-strategy"
                        aria-labelledby="strategy-guide-heading"
                        data-testid="academy-strategy-section"
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 space-y-4"
                    >
                        <div className="space-y-1">
                            <h2 id="strategy-guide-heading" className="font-serif text-lg sm:text-xl font-bold tracking-wide text-[#f5cf70]">
                                {content.strategySectionTitle}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{content.strategySectionDesc}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.strategyPillars.map((pillar, idx) => (
                                <article key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
                                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.summary}</p>
                                    <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 font-mono text-xs font-bold text-emerald-300">
                                        {pillar.formula}
                                    </div>
                                    <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                                        {pillar.details.map((detail, dIdx) => (
                                            <li key={dIdx}>{detail}</li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* SECTION IV : 21 Concepts Grand-Maître & Matrice Terminologique (6 Langues) */}
                    <AcademyKnowledgeGrid content={content} locale={safeLocale} />
                </div>

                {/* SECTION V : FAQ SEO Officielle */}
                <section
                    id="seo-faq"
                    aria-labelledby="faq-heading"
                    data-testid="academy-faq-section"
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-6 space-y-4"
                >
                    <div className="space-y-1">
                        <h2 id="faq-heading" className="font-serif text-lg sm:text-xl font-bold tracking-wide text-[#f5cf70]">
                            {content.faqSectionTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300">{content.faqSectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.faqs.map((faq, idx) => (
                            <article key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1.5">
                                <h3 className="font-serif text-sm font-bold text-[#fdf8eb]">{faq.question}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">{faq.answer}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Pied de page CTA & Maillage Interne */}
                <footer className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#23190c] via-[#131a2b] to-[#23190c] p-6 text-center space-y-4 shadow-2xl">
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-[#fff6d6]">{content.ctaPlayTitle}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="rounded-2xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-5 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1c1004] shadow-lg hover:scale-105 transition"
                        >
                            {content.ctaPlayBtn}
                        </Link>
                        <Link
                            href="/drills"
                            className="rounded-2xl border border-white/10 bg-[#0b101b] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200 hover:border-[#f3c65f] transition"
                        >
                            {content.ctaDrillsBtn}
                        </Link>
                        <Link
                            href="/puzzles"
                            className="rounded-2xl border border-white/10 bg-[#0b101b] px-5 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-200 hover:border-[#f3c65f] transition"
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
