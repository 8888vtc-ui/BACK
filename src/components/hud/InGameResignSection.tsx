'use client';

import React, { useState } from 'react';

export const RESIGN_TIERS: ReadonlyArray<{
    mult: 1 | 2 | 3;
    label: string;
    badge: string;
    cardClass: string;
    badgeClass: string;
}> = [
    {
        mult: 1,
        label: 'Simple',
        badge: 'Enjeu ×1',
        cardClass:
            'border-white/15 bg-gradient-to-b from-[#171b24] to-[#0d1017] text-slate-200 hover:border-[#d4af37]/50 hover:text-white',
        badgeClass: 'text-slate-400',
    },
    {
        mult: 2,
        label: 'Gammon',
        badge: 'Double ×2',
        cardClass:
            'border-amber-500/40 bg-gradient-to-b from-[#2a1b08] to-[#140c03] text-amber-100 hover:border-amber-400 hover:text-white',
        badgeClass: 'text-amber-400 font-semibold',
    },
    {
        mult: 3,
        label: 'Backgammon',
        badge: '👑 Critique ×3',
        cardClass:
            'border-rose-500/60 bg-gradient-to-b from-[#330910] to-[#180307] text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.18)] hover:border-rose-400 hover:text-white',
        badgeClass: 'text-rose-400 font-bold',
    },
];

export interface InGameResignSectionProps {
    effectiveCube: number;
    onResignGame: (multiplier: 1 | 2 | 3) => void;
    onClose: () => void;
}

export function InGameResignSection({
    effectiveCube,
    onResignGame,
    onClose,
}: InGameResignSectionProps) {
    const [pendingResignMultiplier, setPendingResignMultiplier] = useState<1 | 2 | 3 | null>(null);

    const handleConfirmResign = () => {
        if (pendingResignMultiplier !== null) {
            onResignGame(pendingResignMultiplier);
            setPendingResignMultiplier(null);
            onClose();
        }
    };

    const pointsAtStake = pendingResignMultiplier ? effectiveCube * pendingResignMultiplier : effectiveCube;

    return (
        <div className="border-t border-[#d4af37]/20 pt-3">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-rose-300/90">
                    Concéder la Manche (Videau {effectiveCube}×)
                </span>
                <span className="text-[9px] italic text-slate-400">
                    Validation en 2 étapes
                </span>
            </div>

            {pendingResignMultiplier === null ? (
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {RESIGN_TIERS.map(({ mult, label, badge, cardClass, badgeClass }) => {
                        const pts = effectiveCube * mult;
                        return (
                            <button
                                key={mult}
                                type="button"
                                data-testid={`ingame-resign-${mult}x-btn`}
                                onClick={() => setPendingResignMultiplier(mult)}
                                className={`flex flex-col items-center justify-between gap-0.5 rounded-xl border px-2 py-2.5 text-center transition active:scale-95 ${cardClass}`}
                            >
                                <span className={`text-[8px] uppercase tracking-widest ${badgeClass}`}>
                                    {badge}
                                </span>
                                <span className="font-serif text-xs font-black whitespace-nowrap">
                                    {label}
                                </span>
                                <span className="font-mono text-[10px] font-bold opacity-85 whitespace-nowrap">
                                    ({pts} pt{pts > 1 ? 's' : ''})
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div
                    data-testid="resign-confirmation-banner"
                    className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-rose-500/75 bg-gradient-to-r from-[#3b0a10] to-[#1f0508] p-2.5 shadow-lg"
                >
                    <span className="text-xs font-bold text-rose-100">
                        Confirmer la concession de {pointsAtStake} pt{pointsAtStake > 1 ? 's' : ''} ?
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            data-testid="cancel-resign-btn"
                            onClick={() => setPendingResignMultiplier(null)}
                            className="rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-black/60"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            data-testid="confirm-resign-btn"
                            onClick={handleConfirmResign}
                            className="rounded-lg border border-rose-300/50 bg-gradient-to-b from-rose-600 to-rose-800 px-2.5 py-1 text-[11px] font-black uppercase text-white shadow hover:brightness-110"
                        >
                            Concéder (-{pointsAtStake})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
