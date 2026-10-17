'use client';

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    EloCalculationResult,
} from '../../features/multiplayer/types';
import { getEloTier } from '../../features/multiplayer/elo';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export interface MultiplayerResultModalProps {
    isOpen: boolean;
    matchInfo: MultiplayerMatchInfo;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile;
    eloResult: EloCalculationResult;
    onRematch: () => void;
    onClose: () => void;
    theme?: ThemeName;
}

export default function MultiplayerResultModal({
    isOpen,
    matchInfo,
    localProfile,
    opponentProfile,
    eloResult,
    onRematch,
    onClose,
    theme,
}: MultiplayerResultModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    if (!isOpen) return null;

    const isLocalX = matchInfo.localRole === 'X';
    const localDelta = isLocalX ? eloResult.deltaX : eloResult.deltaO;
    const isWinner = localDelta > 0;

    const oldRating = isLocalX
        ? eloResult.playerXNewRating - eloResult.deltaX
        : eloResult.playerONewRating - eloResult.deltaO;

    const newRating = isLocalX ? eloResult.playerXNewRating : eloResult.playerONewRating;
    const tier = getEloTier(newRating);

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${modalClasses.overlay}`}
            data-testid="multiplayer-result-modal"
        >
            <div className={`relative w-full max-w-md overflow-hidden rounded-2xl p-6 shadow-2xl text-center transition-all ${modalClasses.container}`}>
                {/* Icône de victoire ou défaite */}
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 border border-slate-700 text-4xl shadow-inner">
                    {isWinner ? '🏆' : '⚔️'}
                </div>

                <h2
                    className={`text-2xl font-black tracking-tight ${
                        isWinner
                            ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                            : 'text-slate-300'
                    }`}
                >
                    {isWinner ? 'VICTOIRE !' : 'DÉFAITE'}
                </h2>

                <p className="text-xs text-slate-400 mt-1 mb-5">
                    Match contre <span className="font-semibold text-white">{opponentProfile.displayName}</span> ({matchInfo.matchLength} pts)
                </p>

                {/* Carte de Variation Elo */}
                <div className="mb-6 rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Évolution Classement Elo
                    </div>

                    <div className="flex items-center justify-center gap-3 my-2">
                        <span className="text-sm font-mono text-slate-400">{oldRating}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-2xl font-extrabold font-mono text-white">
                            {newRating}
                        </span>

                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                                localDelta >= 0
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                        >
                            {localDelta >= 0 ? `+${localDelta}` : localDelta} Elo
                        </span>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                        <span>{tier.badge}</span>
                        <span className={`font-semibold ${tier.colorClass}`}>{tier.title}</span>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={onRematch}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                        data-testid="rematch-button"
                    >
                        ⚡ Rejouer (Recherche Match)
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        data-testid="close-result-button"
                    >
                        Retour au menu principal
                    </button>
                </div>
            </div>
        </div>
    );
}
