'use client';

/**
 * ManageSubscriptionBanner — Barre de gestion d'abonnement (Pause 1-3 mois, Régularisation Dunning 1-clic & Cancel Flow).
 */

import React, { useState } from 'react';
import CancelFlowModal from './CancelFlowModal';

export const ManageSubscriptionBanner: React.FC = () => {
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    return (
        <>
            <div
                data-testid="manage-subscription-banner"
                className="mt-6 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/30 bg-[#120a05]/85 px-5 py-3.5 text-xs text-[#e8dcc6]"
            >
                <div>
                    <span className="font-bold text-[#fce8b2]">
                        ⚜ Gestion flexible sans engagement :
                    </span>{' '}
                    <span>
                        Besoin d’une pause de 1 à 3 mois, d’ajuster votre palier ou de mettre à jour votre carte ?
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setIsCancelOpen(true)}
                    data-testid="open-cancel-flow-btn"
                    className="rounded-xl border border-[#d4af37]/45 bg-[#1d1008] px-3.5 py-1.5 text-xs font-bold text-[#f3c65f] transition hover:border-[#f3c65f] hover:text-white"
                >
                    Mettre en pause / Gérer mon abonnement
                </button>
            </div>

            <CancelFlowModal
                isOpen={isCancelOpen}
                onClose={() => setIsCancelOpen(false)}
            />
        </>
    );
};

export default ManageSubscriptionBanner;
