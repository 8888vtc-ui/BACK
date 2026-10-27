'use client';

/**
 * Vue détaillée d'un Rouleau d'Ouverture spécifique (`/academy/openings/[roll]`).
 * Combine les données multilingues 6 langues (`OPENING_ROLLS_15`) et l'analyse profonde (`OPENING_BOOK`).
 * Loi de Scalabilité : strictement 0 any, < 250 lignes.
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import { OPENING_ROLLS_15 } from '../../features/academy/academyData';
import { OPENING_BOOK } from '../../features/openings/openingDatabase';
import { useTranslation, type PrimaryLocale } from '../../i18n';

export interface OpeningRollDetailViewProps {
    readonly roll: string;
}

const OpeningRollDetailViewComponent: React.FC<OpeningRollDetailViewProps> = ({ roll }) => {
    const { locale, dir } = useTranslation();
    const safeLocale: PrimaryLocale =
        locale === 'fr' || locale === 'en' || locale === 'es' || locale === 'pt' || locale === 'de' || locale === 'ar'
            ? locale
            : 'en';

    const guideEntry = useMemo(
        () => OPENING_ROLLS_15.find((item) => item.roll === roll) ?? OPENING_ROLLS_15[0],
        [roll],
    );

    const bookEntry = useMemo(() => {
        const parts = guideEntry.roll.split('-').map(Number);
        return OPENING_BOOK.find(
            (b) =>
                (b.dice[0] === parts[0] && b.dice[1] === parts[1]) ||
                (b.dice[0] === parts[1] && b.dice[1] === parts[0]),
        );
    }, [guideEntry.roll]);

    return (
        <div
            dir={dir}
            data-testid={`opening-detail-${guideEntry.roll}`}
            className="h-dvh w-full overflow-y-auto text-slate-100 flex flex-col relative"
            style={{
                background: 'radial-gradient(ellipse 85% 50% at 50% -8%, rgba(212, 175, 55, 0.16) 0%, rgba(20, 28, 46, 0.92) 42%, #090d16 78%, #04060b 100%)',
            }}
        >
            <AppNavbar activeTab="academy" />

            <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6">
                {/* Fil d'Ariane SEO (Breadcrumbs) */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                    <Link href="/" className="hover:text-amber-200">Backgammon Tour</Link>
                    <span>/</span>
                    <Link href="/academy" className="hover:text-amber-200">Gammon Academy</Link>
                    <span>/</span>
                    <span className="font-mono font-bold text-[#f5cf70]">🎲 {guideEntry.roll}</span>
                </nav>

                {/* Carte Principale du Jet d'Ouverture */}
                <article className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#1e170b]/95 via-[#0e1422]/95 to-[#080c15]/95 p-6 sm:p-8 shadow-2xl space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                        <div className="space-y-1.5">
                            <span className="inline-block rounded-full border border-white/10 bg-black/50 px-3 py-0.5 text-xs font-extrabold uppercase tracking-widest text-[#f3c65f]">
                                MONTE-CARLO 3-PLY · OPENING ROLL {guideEntry.roll}
                            </span>
                            <h1 className="font-serif text-2xl sm:text-4xl font-black text-[#fff6d6]">
                                🎲 {guideEntry.roll} — {guideEntry.nickname[safeLocale] ?? guideEntry.nickname.en}
                            </h1>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-emerald-500/15 px-5 py-3 text-center">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-200">3-Ply Equity</div>
                            <div className="font-mono text-2xl font-black text-emerald-300">{guideEntry.equity3Ply}</div>
                            <div className="text-xs font-mono text-slate-200">
                                Win: {guideEntry.winPct} · Gammon: {guideEntry.gammonPct}
                            </div>
                        </div>
                    </div>

                    {/* Coup Optimal vs Alternative */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-[#070b13] p-5 space-y-2">
                            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-300">
                                ✓ Optimal Move (Monte-Carlo 3-Ply &amp; XG)
                            </div>
                            <div className="font-mono text-2xl font-black text-white">{guideEntry.optimalMove}</div>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                                {guideEntry.strategicNote[safeLocale] ?? guideEntry.strategicNote.en}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#070b13] p-5 space-y-2">
                            <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-300">
                                ⚖️ Score / DMP Alternative
                            </div>
                            <div className="font-mono text-xl font-bold text-amber-100">{guideEntry.alternativeMove}</div>
                            {bookEntry?.keyRule && (
                                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{bookEntry.keyRule}</p>
                            )}
                        </div>
                    </div>

                    {/* Citation de Grand-Maître & Analyse des Variantes Inférieures */}
                    {bookEntry && (
                        <div className="space-y-4">
                            {bookEntry.masterQuote && (
                                <blockquote className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm italic text-amber-100">
                                    {bookEntry.masterQuote.proverb}
                                    <footer className="mt-1 not-italic font-bold text-[#f3c65f]">
                                        — {bookEntry.masterQuote.author} ({bookEntry.masterQuote.book})
                                    </footer>
                                </blockquote>
                            )}

                            {bookEntry.alternatives.length > 0 && (
                                <div className="space-y-2">
                                    <h2 className="font-serif text-base sm:text-lg font-bold text-[#f5cf70]">
                                        Erreurs Fréquentes &amp; Pertes d’Équité (ΔEq) sur {guideEntry.roll}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {bookEntry.alternatives.map((alt, idx) => (
                                            <div key={idx} className="rounded-xl border border-white/10 bg-rose-950/20 p-3.5 space-y-1">
                                                <div className="flex items-center justify-between font-mono text-xs sm:text-sm font-bold">
                                                    <span className="text-slate-100">{alt.notation} ({alt.style})</span>
                                                    <span className="text-rose-300">{alt.equityLoss.toFixed(3)} Eq</span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-200">{alt.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CTA vers le Plateau */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                        <Link
                            href="/academy"
                            className="rounded-xl border border-white/10 bg-[#0b101b] px-4 py-2 text-xs sm:text-sm font-bold text-amber-200 hover:border-[#f3c65f]"
                        >
                            ← Gammon Academy
                        </Link>
                        <Link
                            href="/"
                            className="rounded-xl border border-[#fef08a] bg-gradient-to-b from-[#f5cf70] to-[#b38428] px-5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1c1004]"
                        >
                            🎲 Pratiquer {guideEntry.roll} contre l’IA 3-Ply
                        </Link>
                    </div>
                </article>

                {/* Maillage Interne : Les 15 Rouleaux d'Ouverture */}
                <section className="rounded-3xl border border-white/10 bg-[#090d16]/95 p-5 space-y-3">
                    <h2 className="font-serif text-sm sm:text-base font-bold uppercase tracking-wider text-[#f3c65f]">
                        Explorer les 15 Rouleaux d’Ouverture Certifiés 3-Ply
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {OPENING_ROLLS_15.map((item) => {
                            const isCurrent = item.roll === guideEntry.roll;
                            return (
                                <Link
                                    key={item.roll}
                                    href={`/academy/openings/${item.roll}`}
                                    className={`rounded-xl border px-3 py-1.5 font-mono text-xs sm:text-sm font-bold transition ${
                                        isCurrent
                                            ? 'border-[#f3c65f] bg-[#3b2b12] text-[#fff6d6]'
                                            : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/25 hover:text-amber-200'
                                    }`}
                                >
                                    🎲 {item.roll} ({item.optimalMove})
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};

export const OpeningRollDetailView = React.memo(OpeningRollDetailViewComponent);
export default OpeningRollDetailView;
