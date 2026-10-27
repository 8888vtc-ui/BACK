'use client';

import React from 'react';
import { TRIAL_TIMELINE_STEPS } from '../../lib/stripe/stripePlans';

export interface SubscriptionTrialAndBenefitsProps {
    isEn: boolean;
    benefits: readonly string[];
}

export const SubscriptionTrialAndBenefits: React.FC<SubscriptionTrialAndBenefitsProps> = ({
    isEn,
    benefits,
}) => {
    return (
        <>
            <div
                data-testid="subscription-trial-timeline"
                className="mt-4 grid grid-cols-1 gap-2 rounded-2xl border border-[#d4af37]/30 bg-[#120a05]/85 p-3.5 sm:grid-cols-3"
            >
                {TRIAL_TIMELINE_STEPS.map((step, i) => (
                    <div key={i} className="flex flex-col gap-0.5 text-left">
                        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#f3c65f]">
                            {isEn ? step.dayLabelEn : step.dayLabelFr}
                        </span>
                        <span className="text-xs font-bold text-[#fdf8eb]">{isEn ? step.titleEn : step.titleFr}</span>
                        <span className="text-[11px] text-[#e8dcc6]/75">{isEn ? step.descEn : step.descFr}</span>
                    </div>
                ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#d4af37]/35 bg-[#120a05]/90 p-3.5">
                <ul data-testid="subscription-benefits-list" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs text-[#fdf8eb]">
                    {benefits.map((benefit, index) => (
                        <li key={index} data-testid={`subscription-benefit-${index}`} className="font-semibold">
                            {benefit}
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
};

export default React.memo(SubscriptionTrialAndBenefits);
