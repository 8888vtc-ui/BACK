/**
 * Route SSG SEO Internationale par Pays (`/countries/[country]`).
 *
 * Génère statiquement les 6 pages stratégiques par marché linguistique :
 * - `/countries/france-monaco` (`fr-FR`)
 * - `/countries/usa-uk` (`en-US`)
 * - `/countries/deutschland-dach` (`de-DE`)
 * - `/countries/espana-latam` (`es-ES`)
 * - `/countries/brasil-portugal` (`pt-BR`)
 * - `/countries/monde-arabe-mena` (`ar-SA`)
 *
 * Strictement 0 `any`, < 220 lignes.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    COUNTRY_STRATEGIC_CATALOG,
    getCountryStrategicPageBySlug,
} from '../../../features/seo/countryStrategicCatalog';

export function generateStaticParams(): Array<{ country: string }> {
    return COUNTRY_STRATEGIC_CATALOG.map((entry) => ({
        country: entry.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ country: string }>;
}): Promise<Metadata> {
    const resolved = await params;
    const entry = getCountryStrategicPageBySlug(resolved.country);
    if (!entry) {
        return {
            title: 'Backgammon Tour — Cercle Monte-Carlo',
        };
    }

    const languagesMap: Record<string, string> = {};
    for (const item of COUNTRY_STRATEGIC_CATALOG) {
        languagesMap[item.hreflang] = `/countries/${item.slug}`;
    }

    return {
        title: entry.seoTitle,
        description: entry.seoDescription,
        keywords: [...entry.keywords],
        alternates: {
            canonical: `/countries/${entry.slug}`,
            languages: languagesMap,
        },
        openGraph: {
            title: entry.seoTitle,
            description: entry.seoDescription,
            url: `/countries/${entry.slug}`,
            type: 'website',
        },
    };
}

export default async function CountryStrategicPage({
    params,
}: {
    params: Promise<{ country: string }>;
}) {
    const resolved = await params;
    const entry = getCountryStrategicPageBySlug(resolved.country);
    if (!entry) {
        notFound();
    }

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: entry.hreflang,
        mainEntity: entry.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    const langParam = entry.langCode === 'fr' ? '' : `?lang=${entry.langCode}`;

    return (
        <main
            dir={entry.dir}
            lang={entry.langCode}
            data-testid={`country-seo-page-${entry.slug}`}
            className="h-dvh max-h-dvh w-full overflow-y-auto bg-[#090806] text-[#f7f3e8] px-4 py-6 sm:px-8 sm:py-10"
        >
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            <div className="mx-auto max-w-4xl space-y-6 pb-12">
                {/* Barre supérieure + Sélecteur rapide entre les 6 éditions pays */}
                <nav
                    aria-label="Éditions nationales Backgammon Tour"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#120e09]/95 px-4 py-2.5 text-xs"
                >
                    <Link
                        href={`/${langParam}`}
                        className="font-bold text-[#f3c65f] hover:underline"
                    >
                        ← Backgammon Tour ({entry.countryName})
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {COUNTRY_STRATEGIC_CATALOG.map((item) => (
                            <Link
                                key={item.slug}
                                href={`/countries/${item.slug}`}
                                className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition ${
                                    item.slug === entry.slug
                                        ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-white'
                                        : 'border-white/10 bg-black/40 text-stone-300 hover:text-white'
                                }`}
                            >
                                {item.flag} {item.langCode.toUpperCase()}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Hero principal avec H1 natif et 3 CTAs directs */}
                <header className="rounded-3xl border border-[#d4af37]/40 bg-gradient-to-b from-[#1a130b] to-[#0e0b08] p-6 sm:p-8 shadow-2xl space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#f3c65f]/40 bg-[#f3c65f]/10 px-3 py-1 text-xs font-extrabold text-[#f3c65f]">
                        <span>{entry.flag}</span>
                        <span>{entry.countryName} · {entry.nativeGameName}</span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                        {entry.h1}
                    </h1>
                    <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed">
                        {entry.heroSubtitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                            href={`/${langParam}`}
                            data-testid="country-cta-play"
                            className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:brightness-105"
                        >
                            {entry.ctaPlayLabel}
                        </Link>
                        <Link
                            href={`/drills${langParam}`}
                            data-testid="country-cta-quiz"
                            className="rounded-xl border border-emerald-400/50 bg-emerald-950/50 px-5 py-3 text-xs sm:text-sm font-extrabold text-emerald-200 hover:bg-emerald-900/60 transition"
                        >
                            {entry.ctaQuizLabel}
                        </Link>
                        <Link
                            href={`/academy${langParam}#learn-rules`}
                            data-testid="country-cta-rules"
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs sm:text-sm font-bold text-stone-200 hover:bg-white/10 transition"
                        >
                            {entry.ctaRulesLabel}
                        </Link>
                    </div>
                </header>

                {/* Double Section Éditoriale : Culture Nationale + Méthode ERH */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="rounded-2xl border border-white/10 bg-[#120e09]/90 p-5 space-y-2">
                        <h2 className="text-base font-black text-[#f3c65f]">
                            🏛️ {entry.culturalHookTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                            {entry.culturalHookBody}
                        </p>
                    </section>

                    <section className="rounded-2xl border border-cyan-500/30 bg-cyan-950/15 p-5 space-y-2">
                        <h2 className="text-base font-black text-cyan-300">
                            🧠 {entry.erhSectionTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                            {entry.erhSectionBody}
                        </p>
                    </section>
                </div>

                {/* Tournois & Clubs Locaux du Pays */}
                <section className="rounded-2xl border border-white/10 bg-[#120e09]/90 p-5 space-y-3">
                    <h2 className="text-base font-black text-white">
                        🏆 {entry.localHighlightsTitle}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {entry.localHighlights.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 p-3.5 hover:border-[#f3c65f]/50 transition"
                            >
                                <div>
                                    <div className="text-xs sm:text-sm font-bold text-white">{item.name}</div>
                                    <div className="text-[11px] text-stone-400">📍 {item.city}</div>
                                </div>
                                <span className="rounded-lg border border-[#f3c65f]/40 bg-[#f3c65f]/10 px-2.5 py-1 text-[10px] font-bold text-[#f3c65f]">
                                    {item.badge}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* FAQ Structurée Native (Rich Snippets Google) */}
                <section className="rounded-2xl border border-white/10 bg-[#120e09]/90 p-5 space-y-3">
                    <h2 className="text-base font-black text-[#f3c65f]">
                        ❓ FAQ — {entry.nativeGameName} ({entry.countryName})
                    </h2>
                    <div className="space-y-2.5">
                        {entry.faqs.map((faq, idx) => (
                            <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-3.5 space-y-1">
                                <h3 className="text-xs sm:text-sm font-bold text-white">{faq.question}</h3>
                                <p className="text-xs text-stone-300 leading-relaxed">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

