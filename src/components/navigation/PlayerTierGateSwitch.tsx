'use client';

import React from 'react';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';

interface PlayerTierGateSwitchProps {
    readonly currentGate: PlayerTierGate;
    readonly onSelectGate: (gate: PlayerTierGate) => void;
    readonly compact?: boolean;
}

const GATES: ReadonlyArray<{ readonly id: PlayerTierGate; readonly label: string; readonly badge: string }> = [
    { id: 'BEGINNER', label: 'Débutant', badge: '🌱 Découverte' },
    { id: 'INTERMEDIATE', label: 'Intermédiaire', badge: '♟️ Club' },
    { id: 'EXPERT', label: 'Expert / Pro', badge: '🏆 3-Ply' },
];

export const PlayerTierGateSwitch: React.FC<PlayerTierGateSwitchProps> = React.memo(({
    currentGate,
    onSelectGate,
    compact = false,
}) => {
    return (
        <div
            data-testid="player-tier-gate-switch"
            role="group"
            aria-label="Sélection du niveau de jeu"
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
                        className={`relative rounded-lg font-sans font-bold transition-all duration-150 touch-manipulation select-none whitespace-nowrap ${
                            compact
                                ? 'px-3 py-1.5 text-xs sm:text-sm'
                                : 'px-4 py-2 text-sm sm:text-base'
                        } ${
                            isActive
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#b88924] text-slate-950 font-black shadow-[0_2px_10px_rgba(212,175,55,0.35)]'
                                : 'text-stone-300 hover:text-white hover:bg-white/[0.04]'
                        }`}
                    >
                        <span>{g.label}</span>
                    </button>
                );
            })}
        </div>
    );
});
PlayerTierGateSwitch.displayName = 'PlayerTierGateSwitch';

