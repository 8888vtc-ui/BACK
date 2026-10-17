'use client';

import React, { useState, useEffect } from 'react';
import type { PlayerEloProfile, MatchmakingState, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { getEloTier } from '../../features/multiplayer/elo';

export interface MatchmakingModalProps {
    isOpen: boolean;
    status: MatchmakingState;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null;
    matchInfo: MultiplayerMatchInfo | null;
    onStartSearch: (matchLength: number) => void;
    onCancelSearch: () => void;
    onClose: () => void;
}

export default function MatchmakingModal({
    isOpen,
    status,
    localProfile,
    opponentProfile,
    matchInfo,
    onStartSearch,
    onCancelSearch,
    onClose,
}: MatchmakingModalProps) {
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    const localTier = getEloTier(localProfile.rating);
    const opponentTier = opponentProfile ? getEloTier(opponentProfile.rating) : null;

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        if (status === 'searching') {
            setElapsedSeconds(0);
            timer = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            setElapsedSeconds(0);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in"
            data-testid="matchmaking-modal"
        >
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/80 ring-1 ring-white/10">
                {/* Bouton fermer si pas en recherche active */}
                {status === 'idle' && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                )}

                {/* En-tête */}
                <div className="text-center mb-6">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-2xl shadow-inner">
                        🏆
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white">
                        Matchmaking Multijoueur Elo
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        Affrontez des joueurs en temps réel et hissez-vous au classement mondial.
                    </p>
                </div>

                {/* Profil local */}
                <div className="mb-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-md">
                            {localProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-white">
                                {localProfile.displayName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                                <span>{localTier.badge}</span>
                                <span className={localTier.colorClass}>{localTier.title}</span>
                                <span className="text-slate-500">•</span>
                                <span className="font-mono font-medium text-amber-400">
                                    {localProfile.rating} Elo
                                </span>
                            </div>
                        </div>
                    </div>
                    {localProfile.isGuest && (
                        <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                            Invité
                        </span>
                    )}
                </div>

                {/* VUE 1 : IDLE - Choix de longueur et bouton lancer */}
                {status === 'idle' && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-2">
                                Format du match :
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { pts: 1, label: '1 pt', sub: 'Blitz' },
                                    { pts: 3, label: '3 pts', sub: 'Rapide' },
                                    { pts: 5, label: '5 pts', sub: 'Standard' },
                                    { pts: 7, label: '7 pts', sub: 'Tournoi' },
                                ].map((format) => (
                                    <button
                                        key={format.pts}
                                        type="button"
                                        onClick={() => setSelectedLength(format.pts)}
                                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                                            selectedLength === format.pts
                                                ? 'border-amber-500 bg-amber-500/10 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                                                : 'border-slate-800 bg-slate-800/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                                        }`}
                                    >
                                        <span className="text-sm font-bold">{format.label}</span>
                                        <span className="text-[10px] text-slate-500">{format.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => onStartSearch(selectedLength)}
                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] hover:shadow-amber-500/30 active:scale-[0.99]"
                            data-testid="start-matchmaking-button"
                        >
                            ⚡ Lancer la recherche ({selectedLength} pts)
                        </button>
                    </div>
                )}

                {/* VUE 2 : SEARCHING - Radar animé et chronomètre */}
                {status === 'searching' && (
                    <div className="py-6 text-center space-y-4" data-testid="matchmaking-searching">
                        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
                            <div className="absolute inset-2 rounded-full border border-amber-400/40 animate-pulse" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-2xl text-amber-400">
                                📡
                            </div>
                        </div>

                        <div>
                            <div className="text-base font-bold text-white">
                                Recherche d'un adversaire...
                            </div>
                            <div className="text-xs text-slate-400 mt-1 font-mono">
                                Temps écoulé : {elapsedSeconds}s • Format : {selectedLength} pts
                            </div>
                            <div className="text-[11px] text-amber-400/80 mt-1">
                                {elapsedSeconds < 5
                                    ? 'Tolérance stricte (±100 Elo)'
                                    : elapsedSeconds < 10
                                    ? 'Élargissement de la recherche (±250 Elo)'
                                    : 'Recherche élargie (Appariement garanti...)'}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCancelSearch}
                            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            data-testid="cancel-matchmaking-button"
                        >
                            Annuler la recherche
                        </button>
                    </div>
                )}

                {/* VUE 3 : MATCHED - Présentation de l'adversaire et compte à rebours */}
                {(status === 'matched' || status === 'connecting') && opponentProfile && matchInfo && (
                    <div className="py-4 space-y-5 animate-fade-in" data-testid="matchmaking-matched">
                        <div className="text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                                ✨ Adversaire trouvé !
                            </span>
                        </div>

                        {/* Carte Versus */}
                        <div className="grid grid-cols-2 gap-3 items-center rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                            {/* Joueur Local */}
                            <div className="text-center space-y-1">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white text-lg">
                                    {localProfile.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-xs font-bold text-white truncate">
                                    {localProfile.displayName} (Vous)
                                </div>
                                <div className="text-[11px] font-mono text-amber-400">
                                    {localProfile.rating} Elo
                                </div>
                                <div className="inline-block rounded bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                                    Pions {matchInfo.localRole === 'X' ? '⚪ Blancs (X)' : '⚫ Noirs (O)'}
                                </div>
                            </div>

                            {/* Adversaire */}
                            <div className="text-center space-y-1 border-l border-slate-700/60 pl-3">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 font-bold text-white text-lg">
                                    {opponentProfile.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-xs font-bold text-white truncate">
                                    {opponentProfile.displayName}
                                </div>
                                <div className="text-[11px] font-mono text-amber-400">
                                    {opponentProfile.rating} Elo
                                </div>
                                <div className="inline-block rounded bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">
                                    Pions {matchInfo.localRole === 'X' ? '⚫ Noirs (O)' : '⚪ Blancs (X)'}
                                </div>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 animate-pulse">
                            Connexion au plateau de match en cours...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
