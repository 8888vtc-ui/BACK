'use client';

/**
 * Bouton Mute / Unmute du HUD supérieur — feedback audio du jeu.
 * Extrait de `MatchHud.tsx` (LOI 5 : composants ≤ 300 lignes).
 *
 * L'état (`isMuted`, `toggleMute`) vient de `useSoundManager` appelé par le
 * parent, afin de rester synchronisé avec le menu ⚙️.
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
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition active:scale-95 ${isMuted
                ? 'border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50'
                : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                }`}
        >
            <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
        </button>
    );
};

export default HudMuteButton;
