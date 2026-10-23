'use client';

import React from 'react';
import type { PlayerEloProfile, MultiplayerMatchInfo } from '../../features/multiplayer/types';

export interface LobbyMatchedVersusProps {
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile;
    matchInfo: MultiplayerMatchInfo;
}

export const LobbyMatchedVersus: React.FC<LobbyMatchedVersusProps> = ({
    localProfile,
    opponentProfile,
    matchInfo,
}) => {
    return (
        <div className="py-6 space-y-6 animate-fade-in text-center" data-testid="lobby-matched-view">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5 text-xs font-bold text-emerald-300 animate-pulse">
                ✨ Adversaire trouvé ! Préparation du match...
            </span>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
                {/* Joueur Local */}
                <div className="space-y-1.5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-md">
                        {localProfile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {localProfile.displayName} (Vous)
                    </div>
                    <div className="text-xs font-mono text-amber-400">
                        {localProfile.rating} Elo
                    </div>
                    <div className="inline-block rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                        Pions {matchInfo.localRole === 'X' ? '⚪ Blancs (X)' : '⚫ Noirs (O)'}
                    </div>
                </div>

                {/* Adversaire */}
                <div className="space-y-1.5 text-center border-l border-slate-700/60 pl-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-xl font-bold text-white shadow-md">
                        {opponentProfile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {opponentProfile.displayName}
                    </div>
                    <div className="text-xs font-mono text-amber-400">
                        {opponentProfile.rating} Elo
                    </div>
                    <div className="inline-block rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                        Pions {matchInfo.localRole === 'X' ? '⚫ Noirs (O)' : '⚪ Blancs (X)'}
                    </div>
                </div>
            </div>

            <div className="text-xs text-slate-400 font-mono animate-pulse">
                Connexion au plateau de jeu en cours...
            </div>
        </div>
    );
};
