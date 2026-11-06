'use client';

import React from 'react';
import { useTranslation } from '../../i18n';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';

interface PlayerTierGateSwitchProps {
    readonly currentGate: PlayerTierGate;
    readonly onSelectGate: (gate: PlayerTierGate) => void;
    readonly compact?: boolean;
}

const GATES: ReadonlyArray<{
    readonly id: PlayerTierGate;
    readonly labelFr: string;
    readonly labelEn: string;
}> = [
    { id: 'BEGINNER', labelFr: 'Débutant', labelEn: 'Beginner' },
    { id: 'INTERMEDIATE', labelFr: 'Intermédiaire', labelEn: 'Intermediate' },
    { id: 'EXPERT', labelFr: 'Expert / Pro', labelEn: 'Expert / Pro' },
];

export const PlayerTierGateSwitch: React.FC<PlayerTierGateSwitchProps> = React.memo(({
    currentGate,
    onSelectGate,
    compact = false,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    return (
        <div
            data-testid="player-tier-gate-switch"
            role="group"
            aria-label={isEn ? 'Select player level' : 'Sélection du niveau de jeu'}
            className={`inline-flex items-center rounded-xl border border-white/10 bg-black/60 p-0.5 backdrop-blur-md shadow-inner ${
                compact ? 'gap-0.5' : 'gap-1'
            }`}
        >
            {GATES.map((g) => {
                const isActive = currentGate === g.id;
                return (
                    <button
                        key={g.id}
                        type="button"
                        data-testid={`tier-gate-btn-${g.id.toLowerCase()}`}
                        onClick={() => onSelectGate(g.id)}
                        aria-pressed={isActive}
                        className={`relative rounded-lg font-sans transition-all duration-150 touch-manipulation select-none whitespace-nowrap px-3 sm:px-3.5 py-1.5 text-sm sm:text-base ${
                            isActive
                                ? 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/50 font-semibold shadow-sm'
                                : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'
                        }`}
                    >
                        <span>{isEn ? g.labelEn : g.labelFr}</span>
                    </button>
                );
            })}
        </div>
    );
});
PlayerTierGateSwitch.displayName = 'PlayerTierGateSwitch';
