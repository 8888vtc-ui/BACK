'use client';

import React from 'react';
import { Sparkles, Lock } from 'lucide-react';
import type { PlayerEloProfile, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { CountryFlagSvg } from '../common/CountryFlagSvg';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { useTranslation } from '../../i18n';

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
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const stats = useAuthenticPlayerStats();
    const isGuest = localProfile.isGuest !== undefined ? localProfile.isGuest : !stats.canHavePR;
    const localName = isGuest ? (isEn ? 'Guest Player' : 'Joueur Invité') : (localProfile.displayName || stats.pseudo || (isEn ? 'Player' : 'Joueur'));

    return (
        <div className="py-6 space-y-6 animate-fade-in text-center" data-testid="lobby-matched-view">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5 text-xs font-bold text-emerald-300 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{isEn ? 'Opponent found!' : 'Adversaire trouvé !'}</span>
            </span>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                {/* Joueur Local */}
                <div className="space-y-1.5 text-center">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-md">
                        {localProfile.avatarUrl ? (
                            <img src={localProfile.avatarUrl} alt={localName} className="h-full w-full object-cover" />
                        ) : (
                            localName.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {localName} ({isEn ? 'You' : 'Vous'})
                    </div>
                    {isGuest ? (
                        <div className="inline-flex items-center justify-center gap-1 rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-stone-300">
                            <Lock className="w-3 h-3 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>{isEn ? 'Guest Mode (No PR / Elo)' : 'Mode Invité (Sans PR / Elo)'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                            <span className="text-amber-400 font-bold">{stats.eloRating ?? localProfile.rating} Elo</span>
                            <span className="text-slate-600">•</span>
                            <span className="rounded border border-emerald-400/40 bg-emerald-950/60 px-1.5 py-0.2 text-[11px] font-bold text-emerald-300">
                                {stats.hasRealPR && stats.globalPR !== null ? `PR ${stats.globalPR.toFixed(1)}` : (isEn ? 'Calibrating' : 'En calibrage')}
                            </span>
                        </div>
                    )}
                    <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                        {matchInfo.localRole === 'X' ? (isEn ? 'White Checkers (X)' : 'Pions Blancs (X)') : (isEn ? 'Black Checkers (O)' : 'Pions Noirs (O)')}
                    </div>
                </div>

                {/* Adversaire */}
                <div className="space-y-1.5 text-center border-l border-white/10 pl-4">
                    <div className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-rose-500 to-amber-600 text-xl font-bold text-white shadow-md">
                        {opponentProfile.avatarUrl ? (
                            <img src={opponentProfile.avatarUrl} alt={opponentProfile.displayName} className="h-full w-full object-cover" />
                        ) : (
                            opponentProfile.username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                        {opponentProfile.displayName}
                    </div>
                    {opponentProfile.countryName && (
                        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-300/90 truncate">
                            <CountryFlagSvg countryName={opponentProfile.countryName} />
                            <span>{opponentProfile.countryName} · {isEn ? 'Online' : 'En ligne'}</span>
                        </div>
                    )}
                    {isGuest ? (
                        <div className="inline-flex items-center justify-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                            <span>{isEn ? 'Online · Casual Match' : 'En ligne · Match Amical'}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                            <span className="text-amber-400 font-bold">{opponentProfile.rating} Elo</span>
                            {typeof opponentProfile.averagePr === 'number' && (
                                <>
                                    <span className="text-slate-600">•</span>
                                    <span className="rounded border border-amber-400/40 bg-amber-950/60 px-1.5 py-0.2 text-[11px] font-bold text-amber-200">
                                        PR {opponentProfile.averagePr.toFixed(1)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                    <div className="inline-block rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">
                        {matchInfo.localRole === 'X' ? (isEn ? 'Black Checkers (O)' : 'Pions Noirs (O)') : (isEn ? 'White Checkers (X)' : 'Pions Blancs (X)')}
                    </div>
                </div>
            </div>

            <div className="text-xs text-slate-400 font-mono animate-pulse">
                {isEn ? 'Connecting to game board...' : 'Connexion au plateau de jeu en cours...'}
            </div>
        </div>
    );
};
