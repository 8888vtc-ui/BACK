'use client';

/**
 * Bouton Mute / Unmute du HUD supérieur — Médaillon en Laiton Brossé & Ébène.
 * Extrait de `MatchHud.tsx` (LOI 5 : composants ≤ 300 lignes).
 */

import React from 'react';

export interface HudMuteButtonProps {
    isMuted: boolean;
    onToggle: () => void;
}

export const HudMuteButton: React.FC<HudMuteButtonProps> = ({ isMuted, onToggle }) => {
    const label = isMuted ? 'Activer le son' : 'Couper le son';

    return (
        <button
            type="button"
            onClick={onToggle}
            data-testid="hud-mute-btn"
            aria-label={label}
            aria-pressed={isMuted}
            title={label}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border text-xs transition active:scale-95 ${
                isMuted
                    ? 'border-rose-500/50 bg-[#24080b] text-rose-300 hover:border-rose-400'
                    : 'border-[#d4af37]/40 bg-[#180c06] text-[#f3c65f] hover:border-[#f3c65f] hover:text-white'
            }`}
        >
            <span
                aria-hidden="true"
                className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]"
            >
                {isMuted ? '🔇' : '🔊'}
            </span>
        </button>
    );
};

export default HudMuteButton;
