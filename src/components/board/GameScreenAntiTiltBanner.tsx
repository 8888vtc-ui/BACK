'use client';

import React from 'react';
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
    if (!tilt.showTiltAlert && !multiplayer.quickChatMessage) {
        return null;
    }

    return (
        <div
            data-testid="active-antitilt-swapdice-bar"
            className="fixed top-2 left-24 z-40 flex flex-wrap items-center gap-2 rounded-xl border border-[#d4af37]/40 bg-[#0d0a08]/95 px-2.5 py-1 text-xs text-[#f7f3e8] shadow-2xl backdrop-blur-md"
        >
            {multiplayer.quickChatMessage && (
                <div
                    data-testid="live-quick-chat-bubble"
                    className="flex items-center gap-1.5 rounded-xl border border-[#f3c65f]/50 bg-[#1a1208] px-2.5 py-1 text-[11px] font-bold text-[#fde68a] animate-fade-in"
                >
                    <span>
                        {multiplayer.quickChatMessage.player === (multiplayer.matchInfo?.localRole ?? 'X')
                            ? 'Vous :'
                            : `${multiplayer.opponentProfile?.displayName ?? 'Adversaire'} :`}
                    </span>
                    <span>
                        {multiplayer.quickChatMessage.messageId === 'gg'
                            ? '👋 Bonne partie !'
                            : multiplayer.quickChatMessage.messageId === 'nice_move'
                              ? '👏 Bien joué !'
                              : multiplayer.quickChatMessage.messageId === 'unlucky'
                                ? '😅 Pas de chance !'
                                : multiplayer.quickChatMessage.messageId === 'thinking'
                                  ? '🤔 Je réfléchis...'
                                  : '🙏 Merci !'}
                    </span>
                </div>
            )}
            {tilt.showTiltAlert && (
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                    <span>🧘 Pause Anti-Tilt : respirez 5s avant de jouer</span>
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

