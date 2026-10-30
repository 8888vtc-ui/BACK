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
import OpeningRollsTable from './OpeningRollsTable';
import MatchEquityCalculator from './MatchEquityCalculator';
import AcademyKnowledgeGrid from './AcademyKnowledgeGrid';
import { getAcademyContent } from '../../features/academy/academyTranslations';
import { useTranslation, type PrimaryLocale } from '../../i18n';

type AcademyTab = 'beginner' | 'club' | 'pro' | 'all';

const GammonAcademyViewComponent: React.FC = () => {
    const { locale, dir } = useTranslation();
    const [activeTab, setActiveTab] = useState<AcademyTab>('beginner');
    const safeLocale: PrimaryLocale =
        locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'pt' || locale === 'de' || locale === 'ar'
            ? locale
            : 'en';
    const content = useMemo(() => getAcademyContent(safeLocale), [safeLocale]);

    const showBeginner = activeTab === 'beginner' || activeTab === 'all';
    const showClub = activeTab === 'club' || activeTab === 'all';
    const showPro = activeTab === 'pro' || activeTab === 'all';

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

            <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
                {/* En-tête épuré Backgammon Tour — Académie (3 Paliers Caméléon : Débutant, Club, Pro) */}
                <header className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#1e170b]/95 via-[#0e1422]/95 to-[#080c15]/95 p-5 sm:p-7 text-center shadow-[0_18px_46px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,245,205,0.18)] space-y-4">
                    <span className="inline-block rounded-full border border-white/10 bg-black/50 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-[#f3c65f]">
                        🏛️ {content.heroBadge}
                    </span>
                    <h1 className="font-serif bg-gradient-to-b from-[#fff9e6] via-[#f0cb69] to-[#b38428] bg-clip-text text-2xl sm:text-4xl font-black tracking-wide text-transparent">
                        {content.heroTitle}
                    </h1>
                    <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {content.heroSubtitle}
                    </p>

                    {/* Sélecteur Progressif 3 Niveaux (Loi Elon Musk : Zéro surcharge cognitive) */}
                    <nav aria-label="Niveaux de l'Académie" className="mx-auto grid max-w-3xl grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                        <button
                            type="button" data-testid="academy-tab-beginner" aria-pressed={activeTab === 'beginner'}
                            onClick={() => setActiveTab('beginner')}
                            className={`flex flex-col items-center rounded-2xl border px-4 py-2.5 text-center transition ${activeTab === 'beginner' ? 'border-emerald-400 bg-emerald-950/75 text-white shadow-lg' : 'border-white/10 bg-[#0b101b] text-slate-300 hover:border-white/25'}`}
                        >
                            <span className="text-xs sm:text-sm font-black text-emerald-300">🌱 1. Niveau Débutant</span>
                            <span className="text-[11px] text-slate-400">Règles en 5 Étapes &amp; Quiz</span>
                        </button>
                        <button
                            type="button" data-testid="academy-tab-club" aria-pressed={activeTab === 'club'}
                            onClick={() => setActiveTab('club')}
                            className={`flex flex-col items-center rounded-2xl border px-4 py-2.5 text-center transition ${activeTab === 'club' ? 'border-[#f3c65f] bg-amber-950/50 text-white shadow-lg' : 'border-white/10 bg-[#0b101b] text-slate-300 hover:border-white/25'}`}
                        >
                            <span className="text-xs sm:text-sm font-black text-[#f3c65f]">🎲 2. Niveau Club</span>
                            <span className="text-[11px] text-slate-400">15 Ouvertures &amp; Videau (21,5 %)</span>
                        </button>
                        <button
                            type="button" data-testid="academy-tab-pro" aria-pressed={activeTab === 'pro'}
                            onClick={() => setActiveTab('pro')}
                            className={`flex flex-col items-center rounded-2xl border px-4 py-2.5 text-center transition ${activeTab === 'pro' ? 'border-amber-300 bg-slate-900 text-white shadow-lg' : 'border-white/10 bg-[#0b101b] text-slate-300 hover:border-white/25'}`}
                        >
                            <span className="text-xs sm:text-sm font-black text-amber-200">🏆 3. Grand-Maître Pro</span>
                            <span className="text-[11px] text-slate-400">Calculateur MET &amp; 21 Concepts</span>
                        </button>
                    </nav>
                    <div className="flex justify-center pt-1">
                        <button
                            type="button" data-testid="academy-tab-all" aria-pressed={activeTab === 'all'}
                            onClick={() => setActiveTab((prev) => (prev === 'all' ? 'beginner' : 'all'))}
                            className="text-xs font-semibold text-slate-400 underline-offset-4 hover:text-[#f3c65f] hover:underline transition"
                        >
                            {activeTab === 'all' ? '▴ Revenir à l’affichage guidé par niveau' : '📚 Afficher toute l’encyclopédie sur une seule page'}
                        </button>
                    </div>
                </header>

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
                    className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-5"
                >
                    <div className="space-y-2">
                        <h2 id="cube-guide-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.cubeSectionTitle}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{content.cubeSectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.cubePillars.map((pillar, idx) => (
                            <article key={idx} className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-5 space-y-3">
                                <span className="inline-block rounded-full border border-white/10 bg-amber-500/10 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#f3c65f]">
                                    {pillar.badge}
                                </span>
                                <h3 className="font-serif text-base sm:text-lg font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.summary}</p>
                                <div className="rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs sm:text-sm font-bold text-amber-200">
                                    {pillar.formula}
                                </div>
                                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 list-disc pl-4">
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
                    className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-5"
                >
                    <div className="space-y-2">
                        <h2 id="strategy-guide-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.strategySectionTitle}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{content.strategySectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.strategyPillars.map((pillar, idx) => (
                            <article key={idx} className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-5 space-y-3">
                                <span className="inline-block rounded-full border border-white/10 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                                    {pillar.badge}
                                </span>
                                <h3 className="font-serif text-base sm:text-lg font-bold text-[#fdf8eb]">{pillar.title}</h3>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{pillar.summary}</p>
                                <div className="rounded-xl border border-white/10 bg-black/50 p-3 font-mono text-xs sm:text-sm font-bold text-emerald-300">
                                    {pillar.formula}
                                </div>
                                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300 list-disc pl-4">
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
                    className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#131926]/95 to-[#090d16]/95 p-5 sm:p-7 shadow-xl space-y-4"
                >
                    <div className="space-y-1">
                        <h2 id="faq-heading" className="font-serif text-xl sm:text-2xl font-black tracking-wide text-[#f5cf70]">
                            {content.faqSectionTitle}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300">{content.faqSectionDesc}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {content.faqs.map((faq, idx) => (
                            <article key={idx} className="rounded-2xl border border-white/10 bg-[#080c15]/90 p-5 space-y-2">
                                <h3 className="font-serif text-sm sm:text-base font-bold text-[#fdf8eb]">{faq.question}</h3>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{faq.answer}</p>
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
