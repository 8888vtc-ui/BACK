'use client';

/**
 * SubscriptionModal — Modale & Vitrine d'Abonnement Prestige ("Salon Privé Monte-Carlo").
 *
 * Charte esthétique :
 * - Luxe horloger, acajou profond (#140b06), cuir grenat (#2b1116), laiton brossé (#d4af37) & orfèvrerie (#f3c65f).
 * - Modèle éthique strict : "Zero Ads, Zero Coins, Pure Skill" (le jeu pur est 100 % gratuit et illimité).
 *
 * Structure de l'offre :
 * - Sélecteur à bascule Mensuel (9,99 € TTC / mois) / Annuel (79,99 € TTC / an, recommandé avec badge
 *   "Économisez 33 % — 6,67 € / mois" et 7 jours d'essai gratuit).
 * - Liste des 4 bénéfices exclusifs du Coach IA.
 * - Bouton d'action sécurisé par Stripe avec garantie satisfait ou remboursé.
 */

import React, { useState, useCallback } from 'react';
import {
    STRIPE_PLANS,
    EXCLUSIVE_COACH_BENEFITS_FR,
    EXCLUSIVE_COACH_BENEFITS_EN,
} from '../../lib/stripe/stripePlans';

export interface SubscriptionModalProps {
    /** Contrôle l'affichage de la modale (ignoré si `inlineMode` est true). */
    readonly isOpen?: boolean;
    /** Callback de fermeture de la modale. */
    readonly onClose?: () => void;
    /** Identifiant utilisateur connecté (transmis à Stripe `client_reference_id` et `metadata`). */
    readonly userId?: string | null;
    /** Email utilisateur pré-rempli pour Stripe Checkout. */
    readonly userEmail?: string | null;
    /** Plan sélectionné par défaut ('coach_yearly' recommandé). */
    readonly initialPlan?: 'coach_monthly' | 'coach_yearly';
    /** Mode d'intégration directe dans la page `/pricing` sans overlay modal. */
    readonly inlineMode?: boolean;
    /** Langue d'affichage ('fr' | 'en'). */
    readonly locale?: string;
    /** Callback optionnel appelé après création de la session Stripe Checkout. */
    readonly onCheckoutCreated?: (session: {
        sessionId: string;
        url: string;
        tier: 'coach_monthly' | 'coach_yearly';
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
    const isEn = locale === 'en';
    const [selectedTier, setSelectedTier] = useState<'coach_monthly' | 'coach_yearly'>(
        initialPlan,
    );
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
                headers: {
                    'Content-Type': 'application/json',
                },
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
                tier?: 'coach_monthly' | 'coach_yearly';
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

            if (typeof window !== 'undefined') {
                window.location.assign(data.url);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : isEn
                      ? 'Stripe connection error'
                      : 'Erreur de connexion à Stripe';
            setErrorMsg(message);
        } finally {
            setIsSubmitting(false);
        }
    }, [activePlan, isEn, onCheckoutCreated, userEmail, userId]);

    if (!inlineMode && !isOpen) {
        return null;
    }

    const cardContent = (
        <div
            data-testid="subscription-prestige-card"
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d4af37]/60 bg-gradient-to-b from-[#23120b] via-[#170c07] to-[#0e0704] p-5 sm:p-8 text-[#fdf8eb] shadow-[0_32px_90px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,245,205,0.22)]"
        >
            {/* Halo décoratif Cuir Grenat & Orfèvrerie */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#5a1822]/35 via-[#d4af37]/20 to-[#5a1822]/35 blur-3xl"
            />

            {/* Bouton de fermeture (en mode modale) */}
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

            {/* En-tête Horloger & Manifeste Éthique */}
            <div className="relative flex flex-col items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f3c65f]/70 bg-gradient-to-br from-[#3d181c] via-[#28130b] to-[#120804] text-2xl text-[#f3c65f] shadow-[0_8px_24px_rgba(212,175,55,0.25),inset_0_1px_1px_rgba(255,245,200,0.35)]">
                    ⚜
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/45 bg-[#2b1116]/85 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#fce8b2]">
                    Zero Ads • Zero Coins • Pure Skill
                </span>

                <h2
                    id="subscription-modal-title"
                    className="mt-3 font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#fdf8eb]"
                >
                    {isEn ? 'Unlimited Grandmaster AI Coach' : 'Coach IA Grand-Maître Illimité'}
                </h2>

                <p className="mt-1.5 max-w-lg text-xs sm:text-sm text-[#e8dcc6]/80">
                    {isEn
                        ? 'Online play is 100% free forever. Unlock unlimited Open Sage & Gemini match reviews to master the cube and eliminate blunders.'
                        : 'Le jeu en ligne est 100 % gratuit et illimité. Débloquez l’accompagnement pédagogique illimité du Coach IA (Open Sage + Gemini) pour maîtriser le videau et éliminer vos gaffes.'}
                </p>
            </div>

            {/* Sélecteur à bascule Mensuel / Annuel */}
            <div className="relative mt-6 flex flex-col items-center">
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
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                            selectedTier === 'coach_monthly'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07] shadow-md'
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
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                            selectedTier === 'coach_yearly'
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] text-[#1a0f07] shadow-md'
                                : 'text-[#e8dcc6]/75 hover:text-[#fdf8eb]'
                        }`}
                    >
                        <span>{isEn ? 'Annual (79,99 €)' : 'Annuel (79,99 €)'}</span>
                        <span
                            data-testid="subscription-discount-badge"
                            className="rounded-full border border-[#d4af37]/60 bg-[#2b1116] px-2.5 py-0.5 text-[10px] font-extrabold normal-case tracking-normal text-[#f3c65f]"
                        >
                            {isEn
                                ? STRIPE_PLANS.coach_yearly.badgeEn
                                : STRIPE_PLANS.coach_yearly.badgeFr}
                        </span>
                    </button>
                </div>
            </div>

            {/* Grille comparative des 2 offres avec mise en avant de l'Annuel */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Carte Mensuelle */}
                <div
                    onClick={() => setSelectedTier('coach_monthly')}
                    data-testid="plan-card-monthly"
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                        selectedTier === 'coach_monthly'
                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#2b180d] to-[#170c06] shadow-[0_0_25px_rgba(212,175,55,0.2)]'
                            : 'border-[#d4af37]/25 bg-[#140b06]/80 opacity-80 hover:border-[#d4af37]/50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-serif text-sm font-black uppercase tracking-wider text-[#fce8b2]">
                            {isEn ? 'Monthly Plan' : 'Plan Mensuel'}
                        </span>
                        <span className="font-mono text-xs text-[#e8dcc6]/70">
                            {STRIPE_PLANS.coach_monthly.priceId}
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl font-black text-[#fdf8eb]">
                            9,99 €
                        </span>
                        <span className="text-xs text-[#e8dcc6]/75">
                            {isEn ? 'TTC / month' : 'TTC / mois'}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#e8dcc6]/70">
                        {isEn
                            ? 'Flexible monthly billing, cancel anytime.'
                            : 'Liberté totale sans engagement, résiliable en 1 clic.'}
                    </p>
                </div>

                {/* Carte Annuelle (Recommandée) */}
                <div
                    onClick={() => setSelectedTier('coach_yearly')}
                    data-testid="plan-card-yearly"
                    className={`relative cursor-pointer rounded-2xl border p-4 transition ${
                        selectedTier === 'coach_yearly'
                            ? 'border-[#f3c65f] bg-gradient-to-b from-[#35161b] via-[#26140b] to-[#170c06] shadow-[0_0_28px_rgba(212,175,55,0.28)]'
                            : 'border-[#d4af37]/35 bg-[#180d07]/85 opacity-85 hover:border-[#d4af37]/60'
                    }`}
                >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-serif text-sm font-black uppercase tracking-wider text-[#f3c65f]">
                            {isEn ? 'Annual Plan (Recommended)' : 'Plan Annuel (Recommandé)'}
                        </span>
                        <span className="rounded-full border border-[#f3c65f]/60 bg-[#3d181c] px-2 py-0.5 text-[10px] font-black text-[#fce8b2]">
                            -33 %
                        </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl font-black text-[#f3c65f]">
                            79,99 €
                        </span>
                        <span className="text-xs text-[#e8dcc6]/80">
                            {isEn ? 'TTC / year (6,67 € / mo)' : 'TTC / an (soit 6,67 € / mois)'}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-300">
                        ✨ {isEn ? 'Includes 7-day free trial' : 'Inclut 7 jours d’essai gratuit (0,00 € aujourd’hui)'}
                    </p>
                </div>
            </div>

            {/* Liste des 4 bénéfices exclusifs */}
            <div className="mt-5 rounded-2xl border border-[#d4af37]/35 bg-[#120a05]/90 p-4">
                <h3 className="mb-2.5 font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f]">
                    {isEn ? 'Exclusive VIP Coach Privileges' : 'Privilèges Exclusifs Coach Illimité'}
                </h3>
                <ul
                    data-testid="subscription-benefits-list"
                    className="space-y-2 text-xs sm:text-sm text-[#fdf8eb]"
                >
                    {benefits.map((benefit, index) => (
                        <li
                            key={index}
                            data-testid={`subscription-benefit-${index}`}
                            className="flex items-start gap-2.5 leading-relaxed"
                        >
                            <span className="font-semibold text-[#fdf8eb]">{benefit}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {errorMsg && (
                <div
                    role="alert"
                    data-testid="subscription-checkout-error"
                    className="mt-4 rounded-xl border border-rose-500/50 bg-rose-950/50 px-3.5 py-2.5 text-xs font-semibold text-rose-200"
                >
                    {errorMsg}
                </div>
            )}

            {/* Bouton d'action sécurisé par Stripe */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSubscribe()}
                    data-testid="stripe-checkout-submit-btn"
                    className="w-full rounded-2xl border border-[#fff2c2]/70 bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] px-6 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-[#1a0f07] shadow-[0_12px_32px_rgba(212,175,55,0.35)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                >
                    {isSubmitting
                        ? isEn
                            ? 'Redirecting to Stripe Checkout…'
                            : 'Redirection sécurisée vers Stripe…'
                        : selectedTier === 'coach_yearly'
                          ? isEn
                              ? 'Start 7-Day Free Trial (Then 79,99 € / year)'
                              : 'Démarrer mon Essai Gratuit de 7 jours (puis 79,99 € / an)'
                          : isEn
                            ? 'Subscribe Monthly (9,99 € TTC / month)'
                            : 'S’abonner au Coach Illimité (9,99 € TTC / mois)'}
                </button>

                <p
                    data-testid="stripe-security-guarantee"
                    className="text-center text-[11px] text-[#e8dcc6]/70"
                >
                    🔒{' '}
                    {isEn
                        ? 'Secured by Stripe Billing • 14-day money-back guarantee • Cancel in 1 click'
                        : 'Paiement 100 % sécurisé par Stripe • Garantie satisfait ou remboursé • Résiliable en 1 clic'}
                </p>
            </div>
        </div>
    );

    if (inlineMode) {
        return cardContent;
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-modal-title"
            data-testid="subscription-modal"
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070402]/85 p-3 backdrop-blur-md sm:p-6 animate-in fade-in duration-200"
        >
            {cardContent}
        </div>
    );
};

export default SubscriptionModal;
