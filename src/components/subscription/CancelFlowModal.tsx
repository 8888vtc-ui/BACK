'use client';

/**
 * CancelFlowModal — Tunnel de Rétention Dynamique en 3 Étapes (Anti-Churn Volontaire).
 *
 * Respecte strictement les règles du Blueprint SaaS 2025–2026 :
 * - Étape 1 : Enquête de motif à choix unique (`too_expensive`, `low_usage`, `missing_feature`, `switching_competitor`).
 * - Étape 2 : Offre Primaire de Sauvetage (Pause 1 à 3 mois ou Remise -25 % sur 3 mois — jamais >= 50 %) + Offre de Repli.
 * - Étape 3 : Confirmation sans friction ni formulation culpabilisante (aucun dark pattern, conservation des données).
 */

import React, { useState } from 'react';
import {
    resolveCancelSaveOffer,
    trackSaasLifecycleEvent,
    type CancelReason,
} from '../../lib/subscription/retentionEngine';

export interface CancelFlowModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly userFirstName?: string;
    readonly currentMonthlyPriceEur?: number;
    readonly locale?: 'fr' | 'en';
    readonly onAcceptSaveOffer?: (payload: {
        readonly reason: CancelReason;
        readonly offerType: string;
        readonly pauseMonths?: 1 | 2 | 3;
    }) => void;
    readonly onConfirmCancel?: (reason: CancelReason) => void;
}

const REASONS: ReadonlyArray<{
    readonly id: CancelReason;
    readonly labelFr: string;
    readonly labelEn: string;
}> = [
    {
        id: 'low_usage',
        labelFr: "Je ne joue pas assez en ce moment / Pause temporaire",
        labelEn: "I'm not playing enough right now / Temporary break",
    },
    {
        id: 'too_expensive',
        labelFr: "C'est trop cher pour mon budget actuel",
        labelEn: "It's too expensive for my current budget",
    },
    {
        id: 'missing_feature',
        labelFr: 'Il me manque une fonctionnalité ou j’ai rencontré un problème',
        labelEn: 'Missing a feature or encountered an issue',
    },
    {
        id: 'switching_competitor',
        labelFr: 'J’utilise un autre logiciel d’analyse (XG / GNU BG)',
        labelEn: 'I am switching to another analysis tool (XG / GNU BG)',
    },
] as const;

export const CancelFlowModal: React.FC<CancelFlowModalProps> = ({
    isOpen,
    onClose,
    userFirstName = 'Maître',
    currentMonthlyPriceEur = 9.99,
    locale = 'fr',
    onAcceptSaveOffer,
    onConfirmCancel,
}) => {
    const isEn = locale === 'en';
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedReason, setSelectedReason] = useState<CancelReason>('low_usage');
    const [pauseMonths, setPauseMonths] = useState<1 | 2 | 3>(2);
    const [resolutionMessage, setResolutionMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const offer = resolveCancelSaveOffer(selectedReason, currentMonthlyPriceEur);

    const handleAcceptPrimary = () => {
        onAcceptSaveOffer?.({
            reason: selectedReason,
            offerType: offer.primaryOfferType,
            pauseMonths: offer.primaryOfferType === 'pause_1_to_3_months' ? pauseMonths : undefined,
        });
        setResolutionMessage(
            offer.primaryOfferType === 'pause_1_to_3_months'
                ? isEn
                    ? `Your subscription is paused for ${pauseMonths} month(s). Zero charge during this period.`
                    : `Votre abonnement est mis en pause pour ${pauseMonths} mois. Aucun prélèvement durant cette période.`
                : isEn
                  ? 'Your save offer (-25% for 3 months) has been applied immediately.'
                  : 'Votre offre privilège (-25 % pendant 3 mois) a été appliquée immédiatement.',
        );
        setStep(3);
    };

    const handleFinalCancel = () => {
        onConfirmCancel?.(selectedReason);
        setResolutionMessage(
            isEn
                ? 'Your subscription has been canceled. Your PR history and FSRS blunder bank remain preserved on your Free account.'
                : 'Votre abonnement est résilié. Votre historique PR et votre banque FSRS restent intégralement conservés sur votre compte Gratuit.',
        );
        setStep(3);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-flow-title"
            data-testid="cancel-flow-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070402]/85 p-4 backdrop-blur-md"
        >
            <div className="relative w-full max-w-lg rounded-3xl border border-[#d4af37]/50 bg-gradient-to-b from-[#23120b] to-[#110804] p-6 text-[#fdf8eb] shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={isEn ? 'Close modal' : 'Fermer'}
                    data-testid="cancel-flow-close-btn"
                    className="absolute right-4 top-4 rounded-xl border border-[#d4af37]/30 px-2.5 py-1 text-xs text-[#e8dcc6] hover:border-[#f3c65f]"
                >
                    ✕
                </button>

                <span className="inline-block rounded-full border border-[#d4af37]/40 bg-[#2b1116] px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#fce8b2]">
                    {isEn ? `Step ${step} of 3` : `Étape ${step} sur 3`}
                </span>

                <h2
                    id="cancel-flow-title"
                    className="mt-2 font-serif text-xl font-black text-[#f3c65f]"
                >
                    {isEn
                        ? `Manage your VIP membership, ${userFirstName}`
                        : `Gestion de votre abonnement, ${userFirstName}`}
                </h2>

                {step === 1 && (
                    <div data-testid="cancel-flow-step-1" className="mt-4 space-y-3">
                        <p className="text-xs text-[#e8dcc6]/85">
                            {isEn
                                ? 'To help us tailor the best option for your account, what is the main reason for your change today?'
                                : 'Afin de vous proposer la solution la plus adaptée à votre compte, quelle est la raison principale de votre démarche ?'}
                        </p>

                        <div className="space-y-2">
                            {REASONS.map((r) => (
                                <label
                                    key={r.id}
                                    data-testid={`cancel-reason-${r.id}`}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs transition ${
                                        selectedReason === r.id
                                            ? 'border-[#f3c65f] bg-[#2c150c]'
                                            : 'border-[#d4af37]/25 bg-[#140b06]/80'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancel-reason"
                                        checked={selectedReason === r.id}
                                        onChange={() => setSelectedReason(r.id)}
                                        className="accent-[#f3c65f]"
                                    />
                                    <span>{isEn ? r.labelEn : r.labelFr}</span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    trackSaasLifecycleEvent('cancel_flow_initiated', {
                                        cancel_reason: selectedReason,
                                        tenure_months: 3,
                                        plan_tier: 'coach_yearly',
                                    });
                                    setStep(2);
                                }}
                                data-testid="cancel-flow-next-step-btn"
                                className="rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-black uppercase text-[#140b06]"
                            >
                                {isEn ? 'Continue' : 'Continuer'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div data-testid="cancel-flow-step-2" className="mt-4 space-y-4">
                        <div className="rounded-2xl border border-[#f3c65f]/60 bg-[#28130b] p-4 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                                {isEn ? 'Recommended Alternative' : 'Option Recommandée pour Vous'}
                            </span>
                            <h3
                                data-testid="cancel-save-offer-title"
                                className="font-serif text-base font-bold text-[#fdf8eb]"
                            >
                                {isEn ? offer.primaryTitleEn : offer.primaryTitleFr}
                            </h3>
                            <p className="text-xs text-[#e8dcc6]/85">
                                {isEn ? offer.primaryDescriptionEn : offer.primaryDescriptionFr}
                            </p>

                            {offer.primaryOfferType === 'pause_1_to_3_months' && (
                                <div
                                    data-testid="cancel-pause-duration-selector"
                                    className="flex items-center gap-2 pt-2"
                                >
                                    {offer.allowedPauseMonths.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setPauseMonths(m)}
                                            data-testid={`pause-duration-${m}m`}
                                            className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                                                pauseMonths === m
                                                    ? 'border-[#f3c65f] bg-[#f3c65f] text-[#140b06]'
                                                    : 'border-[#d4af37]/40 text-[#fce8b2]'
                                            }`}
                                        >
                                            {m} {isEn ? 'month(s)' : 'mois'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleAcceptPrimary}
                                data-testid="cancel-accept-save-offer-btn"
                                className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#8b6914] via-[#d4af37] to-[#f3c65f] py-2.5 text-xs font-black uppercase tracking-wider text-[#140b06]"
                            >
                                {isEn ? 'Apply this option' : 'Activer cette option en 1 clic'}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-[#e8dcc6]/70 underline hover:text-white"
                            >
                                {isEn ? '← Back' : '← Retour'}
                            </button>

                            <button
                                type="button"
                                onClick={handleFinalCancel}
                                data-testid="cancel-confirm-final-btn"
                                className="rounded-xl border border-[#d4af37]/30 px-3.5 py-2 font-semibold text-[#e8dcc6] hover:border-rose-400 hover:text-rose-200"
                            >
                                {isEn ? 'Continue cancellation' : 'Continuer l’annulation'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div data-testid="cancel-flow-step-3" className="mt-4 space-y-4">
                        <p
                            data-testid="cancel-flow-resolution-msg"
                            className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-xs text-emerald-200"
                        >
                            {resolutionMessage}
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full rounded-xl border border-[#d4af37]/50 py-2 text-xs font-bold text-[#fce8b2]"
                        >
                            {isEn ? 'Return to Backgammon Tour' : 'Retourner au Salon'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CancelFlowModal;
