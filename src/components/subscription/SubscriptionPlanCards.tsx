'use client';

import React from 'react';
import { STRIPE_PLANS, type PaidSubscriptionTier } from '../../lib/stripe/stripePlans';

export interface SubscriptionPlanCardsProps {
    selectedTier: PaidSubscriptionTier;
    onSelectTier: (tier: PaidSubscriptionTier) => void;
    isEn: boolean;
}

export const SubscriptionPlanCards: React.FC<SubscriptionPlanCardsProps> = ({
    selectedTier,
    onSelectTier,
    isEn,
}) => {
    return (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
                onClick={() => onSelectTier('coach_monthly')}
                data-testid="plan-card-monthly"
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedTier === 'coach_monthly'
                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#2b180d] to-[#170c06]'
                        : 'border-[#d4af37]/25 bg-[#140b06]/80 opacity-85'
                }`}
            >
                <span className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2]">
                    {isEn ? 'Starter Monthly' : 'Plan Mensuel (1 Joueur)'}
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-black text-[#fdf8eb]">9,99 €</span>
                    <span className="text-xs text-[#e8dcc6]/75">{isEn ? '/ mo' : 'TTC / mois'}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#e8dcc6]/70">
                    {STRIPE_PLANS.coach_monthly.unitCostPerSeatMonthlyFr}
                </p>
            </div>

            <div
                onClick={() => onSelectTier('coach_yearly')}
                data-testid="plan-card-yearly"
                className={`relative cursor-pointer rounded-2xl border p-4 transition ${
                    selectedTier === 'coach_yearly'
                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#35161b] via-[#26140b] to-[#170c06] shadow-[0_0_28px_rgba(212,175,55,0.28)]'
                        : 'border-[#d4af37]/35 bg-[#180d07]/85 opacity-90'
                }`}
            >
                <div className="flex items-center justify-between gap-1">
                    <span className="font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f]">
                        {isEn ? 'Annual (Most Popular)' : 'Plan Annuel (Le Plus Populaire)'}
                    </span>
                    <span className="rounded-full border border-[#f3c65f]/60 bg-[#3d181c] px-2 py-0.5 text-[10px] font-black text-[#fce8b2]">
                        -33 %
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-black text-[#f3c65f]">6,67 €</span>
                    <span className="text-xs text-[#e8dcc6]/80">
                        {isEn ? '/ mo (79,99 € / yr)' : '/ mois (79,99 € TTC / an)'}
                    </span>
                </div>
                <p data-testid="annual-absolute-savings-label" className="mt-1 text-[11px] font-bold text-amber-300">
                    {isEn ? STRIPE_PLANS.coach_yearly.annualSavingsLabelEn : STRIPE_PLANS.coach_yearly.annualSavingsLabelFr}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-emerald-300">
                    ✨ {isEn ? 'Includes 7-day free trial' : 'Inclut 7 jours d’essai gratuit (0,00 € aujourd’hui)'}
                </p>
            </div>

            <div
                onClick={() => onSelectTier('club_chouette')}
                data-testid="plan-card-club"
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                    selectedTier === 'club_chouette'
                        ? 'border-[#f3c65f] bg-gradient-to-b from-[#2b180d] to-[#170c06]'
                        : 'border-[#d4af37]/25 bg-[#140b06]/80 opacity-85'
                }`}
            >
                <div className="flex items-center justify-between">
                    <span className="font-serif text-xs font-black uppercase tracking-wider text-[#fce8b2]">
                        {isEn ? 'Club & Chouette (5 Seats)' : 'Pack Club & Chouette'}
                    </span>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        2,50 € / joueur
                    </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-black text-[#fdf8eb]">149,99 €</span>
                    <span className="text-xs text-[#e8dcc6]/75">{isEn ? '/ yr' : 'TTC / an'}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#e8dcc6]/80">
                    {isEn ? STRIPE_PLANS.club_chouette.annualSavingsLabelEn : STRIPE_PLANS.club_chouette.annualSavingsLabelFr}
                </p>
            </div>
        </div>
    );
};

export default React.memo(SubscriptionPlanCards);
