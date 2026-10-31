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

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {/* Joueur Local */}
                <div className="space-y-1.5 text-center">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#f3c65f]/40 bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-md">
                        {localProfile.avatarUrl ? (
                            <img src={localProfile.avatarUrl} alt={localProfile.displayName} className="h-full w-full object-cover" />
                        ) : (
                            localProfile.displayName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {localProfile.displayName} (Vous)
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                        <span className="text-amber-400 font-bold">{localProfile.rating} Elo</span>
                        <span className="text-slate-600">•</span>
                        <span className="rounded border border-emerald-400/40 bg-emerald-950/60 px-1.5 py-0.2 text-[11px] font-bold text-emerald-300">
                            PR {(localProfile.averagePr ?? 8.5).toFixed(2)}
                        </span>
                    </div>
                    <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                        Pions {matchInfo.localRole === 'X' ? '⚪ Blancs (X)' : '⚫ Noirs (O)'}
                    </div>
                </div>

                {/* Adversaire */}
                <div className="space-y-1.5 text-center border-l border-white/10 pl-4">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#f3c65f]/40 bg-gradient-to-br from-rose-500 to-amber-600 text-xl font-bold text-white shadow-md">
                        {opponentProfile.avatarUrl ? (
                            <>
                                <img src={opponentProfile.avatarUrl} alt={opponentProfile.displayName} className="h-full w-full object-cover" />
                                {opponentProfile.countryFlag && (
                                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[11px] leading-tight">
                                        {opponentProfile.countryFlag}
                                    </span>
                                )}
                            </>
                        ) : (
                            opponentProfile.countryFlag ?? opponentProfile.username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {opponentProfile.displayName}
                    </div>
                    {opponentProfile.countryName && (
                        <div className="text-[11px] font-medium text-emerald-300/90 truncate">
                            Club {opponentProfile.countryName}
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                        <span className="text-amber-400 font-bold">{opponentProfile.rating} Elo</span>
                        <span className="text-slate-600">•</span>
                        <span className="rounded border border-amber-400/40 bg-amber-950/60 px-1.5 py-0.2 text-[11px] font-bold text-amber-200">
                            PR {(opponentProfile.averagePr ?? 8.5).toFixed(2)}
                        </span>
                    </div>
                    <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
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
