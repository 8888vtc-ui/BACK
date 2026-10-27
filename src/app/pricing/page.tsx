import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SubscriptionModal from '../../components/subscription/SubscriptionModal';
import ManageSubscriptionBanner from '../../components/subscription/ManageSubscriptionBanner';

export const metadata: Metadata = {
    title: 'Coach IA Illimité & Abonnement Prestige | Backgammon Tour',
    description:
        'Modèle éthique Zero Ads, Zero Coins, Pure Skill. Le jeu en ligne est 100 % gratuit. Débloquez les analyses illimites du Coach Grand-Maître Monte-Carlo.',
};

export default function PricingPage() {
    return (
        <main
            data-testid="pricing-page"
            className="flex h-dvh max-h-dvh flex-col items-center overflow-y-auto overscroll-y-contain bg-[radial-gradient(ellipse_at_top,#2a1116_0%,#140b06_45%,#06080e_100%)] px-4 py-6 text-[#fdf8eb] sm:px-8 sm:py-10"
        >
            {/* Barre supérieure de navigation retour */}
            <div className="mb-6 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
                <Link
                    href="/"
                    data-testid="pricing-back-lobby-link"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#180d07]/90 px-4 py-2 text-xs font-bold text-[#fce8b2] shadow-sm transition hover:border-white/25 hover:text-white"
                >
                    <span aria-hidden="true" className="text-[#f3c65f]">
                        ⚜
                    </span>
                    <span>Retour au Salon Principal</span>
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Link
                        href="/puzzles"
                        className="rounded-xl border border-white/10 bg-[#140b06]/85 px-3.5 py-2 font-bold text-[#e8dcc6] transition hover:border-white/25 hover:text-white"
                    >
                        🧩 Puzzles Tactiques
                    </Link>
                    <Link
                        href="/drills"
                        className="rounded-xl border border-white/10 bg-[#140b06]/85 px-3.5 py-2 font-bold text-[#e8dcc6] transition hover:border-white/25 hover:text-white"
                    >
                        🎯 Drills de Gaffes
                    </Link>
                    <Link
                        href="/academy"
                        className="rounded-xl border border-white/10 bg-[#140b06]/85 px-3.5 py-2 font-bold text-[#e8dcc6] transition hover:border-white/25 hover:text-white"
                    >
                        🏛️ Gammon Academy
                    </Link>
                </div>
            </div>

            {/* Vitrine centrale d'abonnement Prestige */}
            <SubscriptionModal inlineMode={true} initialPlan="coach_yearly" />

            {/* Tableau comparatif Éthique : Gratuit à vie vs Coach Illimité */}
            <section
                aria-label="Comparatif des formules"
                data-testid="pricing-comparison-section"
                className="mt-8 w-full max-w-4xl rounded-3xl border border-white/10 bg-[#140b06]/90 p-5 sm:p-7 shadow-2xl"
            >
                <div className="text-center">
                    <h2 className="font-serif text-lg sm:text-xl font-black uppercase tracking-wider text-[#f3c65f]">
                        Notre Charte Éthique : « Zero Ads, Zero Coins, Pure Skill »
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#e8dcc6]/75">
                        Inspiré de Lichess et Chess.com : aucune vente de jetons virtuels, aucun avantage pay-to-win.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#0e0704]/90 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-sm font-black uppercase tracking-wider text-[#fdf8eb]">
                                Accès Club (Gratuit à vie)
                            </h3>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-950/50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300">
                                0,00 €
                            </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#e8dcc6]/85">
                            <li>✓ Parties en ligne &amp; contre IA 100 % illimitées</li>
                            <li>✓ Calcul exact du Performance Rating (PR) par le moteur Monte-Carlo</li>
                            <li>✓ Score complet &amp; Statistiques de chance aux dés illimités</li>
                            <li>✓ 3 revues de match complètes avec Coach Grand-Maître offertes / 24h</li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-[#f3c65f] bg-gradient-to-b from-[#2e1318]/90 to-[#180c07]/95 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-serif text-sm font-black uppercase tracking-wider text-[#f3c65f]">
                                ⚜ Coach Illimité VIP
                            </h3>
                            <span className="rounded-full border border-white/10 bg-[#3d181c] px-2.5 py-0.5 font-mono text-xs font-bold text-[#fce8b2]">
                                Dès 6,67 € / mois
                            </span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#fdf8eb]">
                            <li>⚜ Analyses et explications du Coach IA illimitées (24h/24)</li>
                            <li>⚜ Bibliothèque de révision des gaffes avec répétition espacée (FSRS)</li>
                            <li>⚜ Puzzles tactiques quotidiens illimités &amp; Drills personnalisés</li>
                            <li>⚜ Essai gratuit de 7 jours sur la formule annuelle (-33 %, soit 39,89 € / an)</li>
                            <li>⚜ Garantie Satisfait ou Remboursé pendant 30 jours sans condition</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Gestion flexible : Pause 1-3 mois & Tunnel de rétention Cancel Flow */}
            <ManageSubscriptionBanner />
        </main>
    );
}
