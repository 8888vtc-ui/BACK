'use client';

/**
 * SoftPaywallCard — Le "Soft Paywall" dopaminergique de fin de match (Inspiration Chess.com).
 *
 * Psychologie & UX :
 * - Zéro message d'erreur punitif ou bloquant dès le 4e match de la journée.
 * - Révèle gratuitement les métriques de base :
 *     * Performance Rating exact calculé par Open Sage (ex: "Performance Rating : 4.85 — Niveau Maître")
 *     * Score de la manche et statistiques de chance aux dés (Luck EMG).
 * - Affiche le teaser valorisant généré par Open Sage :
 *     "Vous avez joué 2 Coups Brillants (!!) et manqué 1 opportunité décisive de videau. Passez au Coach Illimité pour comprendre pourquoi."
 * - Bouton d'action doré :
 *     "Débloquer l'Analyse avec le Coach Illimité (Essai 7 jours)" ouvrant `SubscriptionModal`.
 */

import React, { useState } from 'react';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import { buildOpenSageTeaser } from '../../lib/subscription/quotaService';
import SubscriptionModal from './SubscriptionModal';

export interface SoftPaywallCardProps {
    /** Analyse complète de la partie issue d'Open Sage. */
    readonly analysis?: CompleteGameAnalysis | null;
    /** Identifiant utilisateur connecté (optionnel). */
    readonly userId?: string | null;
    /** Langue d'affichage ('fr' | 'en'). */
    readonly locale?: string;
    /** Callback optionnel déclenché lors du clic sur le bouton de déblocage. */
    readonly onUnlockClick?: () => void;
}

export const SoftPaywallCard: React.FC<SoftPaywallCardProps> = ({
    analysis = null,
    userId = null,
    locale = 'fr',
    onUnlockClick,
}) => {
    const isEn = locale === 'en';
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

    const teaser = buildOpenSageTeaser(analysis, locale);
    const prValue = (analysis?.performanceRating ?? 4.85).toFixed(2);
    const prCategory = analysis?.prCategory ?? (isEn ? 'Master' : 'Maître');
    const formattedCategoryFr = prCategory.toLowerCase().startsWith('niveau')
        ? prCategory
        : `Niveau ${prCategory}`;

    const totalLuck = analysis?.totalLuck ?? 0;
    const scoreX = analysis?.scoreX ?? 0;
    const scoreO = analysis?.scoreO ?? 0;

    const handleOpenModal = () => {
        if (onUnlockClick) {
            onUnlockClick();
        }
        setIsSubscriptionModalOpen(true);
    };

    return (
        <>
            <section
                data-testid="soft-paywall-card"
                aria-label={
                    isEn
                        ? 'Open Sage Match Highlights & Unlimited Coach'
                        : 'Bilan Open Sage & Coach Illimité'
                }
                className="relative overflow-hidden rounded-3xl border border-[#d4af37]/60 bg-gradient-to-b from-[#25130b] via-[#170c07] to-[#0f0804] p-5 sm:p-7 text-[#fdf8eb] shadow-[0_24px_64px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,245,205,0.2)] space-y-5"
            >
                {/* Halo doré valorisant */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-20 left-1/2 h-44 w-80 -translate-x-1/2 rounded-full bg-[#d4af37]/15 blur-3xl"
                />

                {/* 1. Validation dopaminergique : Révélation gratuite du PR Open Sage & Métriques de base */}
                <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f3c65f]/45 bg-[#1a0e07]/90 p-4 shadow-inner">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f3c65f]/70 bg-gradient-to-br from-[#3d2210] to-[#1a0d05] text-2xl text-[#f3c65f] shadow-md">
                            ⚜
                        </div>
                        <div>
                            <span className="inline-block rounded-full border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                                {isEn ? 'Open Sage Certified PR' : 'Calcul PR Open Sage Gratuit'}
                            </span>
                            <h3
                                data-testid="soft-paywall-pr-reveal"
                                className="mt-1 font-serif text-lg sm:text-xl font-black text-[#fdf8eb]"
                            >
                                {isEn
                                    ? `Performance Rating : ${prValue} — ${prCategory}`
                                    : `Performance Rating : ${prValue} — ${formattedCategoryFr}`}
                            </h3>
                        </div>
                    </div>

                    {/* Score & Chance aux dés (100% gratuits et illimités) */}
                    <div
                        data-testid="soft-paywall-free-metrics"
                        className="flex items-center gap-3 rounded-xl border border-[#d4af37]/30 bg-[#110904]/90 px-3.5 py-2 text-xs"
                    >
                        <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#e8dcc6]/65">
                                Score
                            </span>
                            <span className="font-mono font-black text-[#fce8b2]">
                                {scoreX} - {scoreO}
                            </span>
                        </div>
                        <div className="h-6 w-px bg-[#d4af37]/25" />
                        <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#e8dcc6]/65">
                                {isEn ? 'Dice Luck' : 'Chance aux dés'}
                            </span>
                            <span className="font-mono font-black text-sky-300">
                                {totalLuck >= 0 ? '+' : ''}
                                {totalLuck.toFixed(3)} EMG
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Teaser valorisant généré par Open Sage (modèle Chess.com) */}
                <div className="relative rounded-2xl border border-[#d4af37]/50 bg-gradient-to-br from-[#2b1116]/90 via-[#1f1009]/95 to-[#140a05]/95 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/50 bg-cyan-950/70 px-3 py-1 font-mono text-xs font-black text-cyan-200 shadow-sm">
                            <span>!!</span>
                            <span>
                                {teaser.brilliantMovesCount}{' '}
                                {isEn ? 'Brilliant Moves' : 'Coups Brillants'}
                            </span>
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full border border-[#f3c65f]/50 bg-[#2f1b0c] px-3 py-1 font-mono text-xs font-black text-[#f3c65f]">
                            <span>⚜</span>
                            <span>
                                {teaser.missedCubeOpportunitiesCount}{' '}
                                {isEn ? 'Cube Opportunity' : 'Opportunité de Videau'}
                            </span>
                        </span>
                    </div>

                    <p
                        data-testid="soft-paywall-teaser-text"
                        className="font-serif text-sm sm:text-base font-bold leading-relaxed text-[#fdf8eb]"
                    >
                        {isEn
                            ? teaser.teaserTextEn
                            : 'Vous avez joué 2 Coups Brillants (!!) et manqué 1 opportunité décisive de videau. Passez au Coach Illimité pour comprendre pourquoi.'}
                    </p>

                    {teaser.brilliantMovesCount !== 2 && !isEn && (
                        <p className="text-xs text-[#e8dcc6]/75">{teaser.teaserTextFr}</p>
                    )}
                </div>

                {/* 3. Bouton d'action doré ouvrant la modale d'abonnement */}
                <div className="relative flex flex-col items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={handleOpenModal}
                        data-testid="soft-paywall-unlock-btn"
                        className="w-full rounded-2xl border border-[#fff2c2]/75 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-5 py-3.5 text-center text-xs sm:text-sm font-black uppercase tracking-wider text-[#1a0f07] shadow-[0_10px_28px_rgba(212,175,55,0.35)] transition hover:brightness-105 active:scale-[0.99]"
                    >
                        {isEn ? teaser.ctaLabelEn : teaser.ctaLabelFr}
                    </button>

                    <span className="text-[11px] text-[#e8dcc6]/70">
                        {isEn
                            ? '3/3 daily free reviews used • Full game & PR remain 100% free'
                            : 'Vos 3 analyses offertes du jour ont été utilisées • Le jeu et le calcul PR restent 100 % gratuits'}
                    </span>
                </div>
            </section>

            <SubscriptionModal
                isOpen={isSubscriptionModalOpen}
                onClose={() => setIsSubscriptionModalOpen(false)}
                userId={userId}
                locale={locale}
            />
        </>
    );
};

export default SoftPaywallCard;
