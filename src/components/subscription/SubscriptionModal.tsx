'use client';

/**
 * SubscriptionModal — Modale & Vitrine d'Abonnement Prestige (< 300 lignes, conforme R1).
 *
 * Implémente l'architecture psychologique du Blueprint SaaS 2025–2026 :
 * - Grille à 3 paliers avec Effet Leurre (Decoy : 9,99 €/mois | Cible : 79,99 €/an | Ancrage Club : 149,99 €/an 5 sièges).
 * - Économie formulée en % ET en valeur monétaire absolue ("Économisez 33 % — soit 39,89 € / an").
 * - Frise chronologique visuelle de l'essai (Adapty Trial-Format Timeline : Jour 0 → Jour 5 → Jour 7).
 * - Garantie Satisfait ou Remboursé pendant 30 jours sans condition sous le CTA.
 */

import React, { useState, useCallback } from 'react';
import {
    STRIPE_PLANS,
    EXCLUSIVE_COACH_BENEFITS_FR,
    EXCLUSIVE_COACH_BENEFITS_EN,
    type PaidSubscriptionTier,
} from '../../lib/stripe/stripePlans';
import SubscriptionPlanCards from './SubscriptionPlanCards';
import SubscriptionTrialAndBenefits from './SubscriptionTrialAndBenefits';

export interface SubscriptionModalProps {
    readonly isOpen?: boolean;
    readonly onClose?: () => void;
    readonly userId?: string | null;
    readonly userEmail?: string | null;
    readonly initialPlan?: PaidSubscriptionTier;
    readonly inlineMode?: boolean;
    readonly locale?: string;
    readonly onCheckoutCreated?: (session: {
        sessionId: string;
        url: string;
        tier: PaidSubscriptionTier;
    }) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    isOpen = true,
    onClose,
    userId = null,
    userEmail = null,
    initialPlan = 'coach_yearly',
    inlineMode = false,
    locale = 'fr',
    onCheckoutCreated,
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const [selectedTier, setSelectedTier] = useState<PaidSubscriptionTier>(initialPlan);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const activePlan = STRIPE_PLANS[selectedTier];
    const benefits = isEn ? EXCLUSIVE_COACH_BENEFITS_EN : EXCLUSIVE_COACH_BENEFITS_FR;

    const handleSubscribe = useCallback(async () => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: activePlan.priceId,
                    plan: activePlan.tier,
                    userId: userId ?? 'guest',
                    email: userEmail ?? undefined,
                }),
            });
            const data = (await response.json()) as {
                sessionId?: string;
                url?: string;
                tier?: PaidSubscriptionTier;
                error?: string;
            };
            if (!response.ok || !data.url) {
                throw new Error(
                    data.error ||
                        (isEn
                            ? 'Unable to start Stripe Checkout session.'
                            : 'Impossible de démarrer la session Stripe Checkout.'),
                );
            }
            if (onCheckoutCreated && data.sessionId) {
                onCheckoutCreated({
                    sessionId: data.sessionId,
                    url: data.url,
                    tier: data.tier ?? activePlan.tier,
                });
                return;
            }
            if (typeof window !== 'undefined') window.location.assign(data.url);
        } catch (err: unknown) {
            setErrorMsg(
                err instanceof Error
                    ? err.message
                    : isEn
                      ? 'Stripe connection error'
                      : 'Erreur de connexion à Stripe',
            );
        } finally {
            setIsSubmitting(false);
        }
    }, [activePlan, isEn, onCheckoutCreated, userEmail, userId]);

    if (!inlineMode && !isOpen) return null;

    const ctaText = isSubmitting
        ? isEn
            ? 'Redirecting to Stripe Checkout…'
            : 'Redirection sécurisée vers Stripe…'
        : selectedTier === 'coach_yearly'
          ? isEn
              ? 'Start 7-Day Free Trial (Then 79,99 € / year)'
              : 'Démarrer mon Essai Gratuit de 7 jours (puis 79,99 € / an)'
          : selectedTier === 'club_chouette'
            ? isEn
                ? 'Start 14-Day Club Trial (5 VIP Accounts — 149,99 € / year)'
                : 'Démarrer l’Essai Club 14 jours (5 Comptes VIP — 149,99 € / an)'
            : isEn
              ? 'Subscribe Monthly (9,99 € TTC / month)'
              : 'S’abonner au Coach Illimité (9,99 € TTC / mois)';

    const cardContent = (
        <div
            data-testid="subscription-prestige-card"
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#d4af37]/60 bg-gradient-to-b from-[#23120b] via-[#170c07] to-[#0e0704] p-5 sm:p-8 text-[#fdf8eb] shadow-[0_32px_90px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,245,205,0.22)]"
        >
            {!inlineMode && onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={isEn ? 'Close subscription modal' : "Fermer la fenêtre d'abonnement"}
                    data-testid="close-subscription-modal-btn"
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#1a0e07]/90 text-sm text-[#e8dcc6] transition hover:border-[#f3c65f] hover:text-white"
                >
                    ✕
                </button>
            )}

            <div className="relative flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/45 bg-[#2b1116]/85 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#fce8b2]">
                    ⚜ Zero Ads • Zero Coins • Pure Skill
                </span>
                <h2
                    id="subscription-modal-title"
                    className="mt-2 font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#fdf8eb]"
                >
                    {isEn ? 'Unlimited Grandmaster AI Coach' : 'Coach IA Grand-Maître Illimité'}
                </h2>
            </div>

            <div className="relative mt-4 flex flex-col items-center">
                <div
                    role="group"
                    aria-label={isEn ? 'Billing cycle selector' : "Sélecteur de fréquence d'abonnement"}
                    data-testid="billing-cycle-toggle"
                    className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#d4af37]/45 bg-[#110905]/95 p-1.5 shadow-inner"
                >
                    <button
                        type="button"
                        onClick={() => setSelectedTier('coach_monthly')}
                        data-testid="toggle-plan-monthly"
                        aria-pressed={selectedTier === 'coach_monthly'}
                        className={`rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition ${
                            selectedTier === 'coach_monthly'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07]'
                                : 'text-[#e8dcc6]/75 hover:text-[#fdf8eb]'
                        }`}
                    >
                        {isEn ? 'Monthly (9,99 €)' : 'Mensuel (9,99 €)'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTier('coach_yearly')}
                        data-testid="toggle-plan-yearly"
                        aria-pressed={selectedTier === 'coach_yearly'}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition ${
                            selectedTier === 'coach_yearly'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07]'
                                : 'text-[#e8dcc6]/75 hover:text-[#fdf8eb]'
                        }`}
                    >
                        <span>{isEn ? 'Annual (79,99 €)' : 'Annuel (79,99 €)'}</span>
                        <span
                            data-testid="subscription-discount-badge"
                            className="rounded-full border border-[#d4af37]/60 bg-[#2b1116] px-2.5 py-0.5 text-[10px] font-extrabold normal-case tracking-normal text-[#f3c65f]"
                        >
                            {isEn ? STRIPE_PLANS.coach_yearly.badgeEn : STRIPE_PLANS.coach_yearly.badgeFr}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedTier('club_chouette')}
                        data-testid="toggle-plan-club"
                        aria-pressed={selectedTier === 'club_chouette'}
                        className={`rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider transition ${
                            selectedTier === 'club_chouette'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07]'
                                : 'text-[#e8dcc6]/75 hover:text-[#fdf8eb]'
                        }`}
                    >
                        {isEn ? 'Club 5 Seats (149,99 €)' : 'Pack Club 5 Comptes (149,99 €)'}
                    </button>
                </div>
            </div>

            <SubscriptionPlanCards
                selectedTier={selectedTier}
                onSelectTier={setSelectedTier}
                isEn={isEn}
            />

            <SubscriptionTrialAndBenefits isEn={isEn} benefits={benefits} />

            {errorMsg && (
                <div role="alert" data-testid="subscription-checkout-error" className="mt-3 rounded-xl border border-rose-500/50 bg-rose-950/50 px-3.5 py-2 text-xs font-semibold text-rose-200">
                    {errorMsg}
                </div>
            )}

            <div className="mt-5 flex flex-col items-center gap-2">
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSubscribe()}
                    data-testid="stripe-checkout-submit-btn"
                    className="w-full rounded-2xl border border-[#fff2c2]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-6 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-[#1a0f07] shadow-[0_12px_32px_rgba(212,175,55,0.35)] transition hover:brightness-105 disabled:opacity-60"
                >
                    {ctaText}
                </button>
                <p data-testid="stripe-security-guarantee" className="text-center text-[11px] text-[#e8dcc6]/80">
                    🔒{' '}
                    {isEn
                        ? 'Secured by Stripe Billing (Apple Pay / Google Pay) • 30-day unconditional money-back guarantee • Cancel or Pause in 1 click'
                        : 'Paiement sécurisé Stripe (Apple Pay / Google Pay) • Garantie satisfait ou remboursé 30 jours sans condition • Pause ou résiliation en 1 clic'}
                </p>
            </div>
        </div>
    );

    if (inlineMode) return cardContent;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-modal-title"
            data-testid="subscription-modal"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070402]/85 p-3 backdrop-blur-md sm:p-6"
        >
            {cardContent}
        </div>
    );
};

export default SubscriptionModal;
