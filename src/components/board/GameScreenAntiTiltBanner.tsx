'use client';

import React from 'react';
import { useTranslation } from '../../i18n';
import type { useMultiplayerGame } from '../../hooks/useMultiplayerGame';
import type { useTiltDetector } from '../../hooks/useTiltDetector';

export interface GameScreenAntiTiltBannerProps {
    readonly tilt: ReturnType<typeof useTiltDetector>;
    readonly multiplayer: ReturnType<typeof useMultiplayerGame>;
}

export const GameScreenAntiTiltBanner: React.FC<GameScreenAntiTiltBannerProps> = ({
    tilt,
    multiplayer,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    if (!tilt.showTiltAlert && !multiplayer.quickChatMessage) {
        return null;
    }

    return (
        <div
            data-testid="active-antitilt-swapdice-bar"
            className="fixed top-12 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#0d0a08]/95 px-2.5 py-1 text-xs text-[#f7f3e8] shadow-2xl backdrop-blur-md whitespace-nowrap"
        >
            {multiplayer.quickChatMessage && (
                <div
                    data-testid="live-quick-chat-bubble"
                    className="flex items-center gap-1.5 rounded-xl border border-[#f3c65f]/50 bg-[#1a1208] px-2.5 py-1 text-[11px] font-bold text-[#fde68a] animate-fade-in"
                >
                    <span>
                        {multiplayer.quickChatMessage.player === (multiplayer.matchInfo?.localRole ?? 'X')
                            ? (isEn ? 'You:' : 'Vous :')
                            : `${multiplayer.opponentProfile?.displayName ?? (isEn ? 'Opponent' : 'Adversaire')}:`}
                    </span>
                    <span>
                        {multiplayer.quickChatMessage.messageId === 'gg'
                            ? (isEn ? 'Good game!' : 'Bonne partie !')
                            : multiplayer.quickChatMessage.messageId === 'nice_move'
                              ? (isEn ? 'Well played!' : 'Bien joué !')
                              : multiplayer.quickChatMessage.messageId === 'unlucky'
                                ? (isEn ? 'Tough luck!' : 'Pas de chance !')
                                : multiplayer.quickChatMessage.messageId === 'thinking'
                                  ? (isEn ? 'Thinking...' : 'Je réfléchis...')
                                  : (isEn ? 'Thanks!' : 'Merci !')}
                    </span>
                </div>
            )}
            {tilt.showTiltAlert && (
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <span>{isEn ? 'Anti-Tilt Pause: take 5s before playing' : 'Pause Anti-Tilt : respirez 5s avant de jouer'}</span>
                    <button
                        type="button"
                        onClick={tilt.dismissTiltAlert}
                        className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white hover:bg-white/20"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
    );
};


