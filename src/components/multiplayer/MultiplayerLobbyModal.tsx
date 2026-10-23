'use client';

import React, { useState, useEffect } from 'react';
import type { PlayerEloProfile, MatchmakingState, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { getEloTier } from '../../features/multiplayer/elo';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';
import { LobbyMatchedVersus } from './LobbyMatchedVersus';
import { LobbyPrivateRoomTab } from './LobbyPrivateRoomTab';
import { LobbyLeaderboardTab } from './LobbyLeaderboardTab';

export interface MultiplayerLobbyModalProps {
    isOpen: boolean;
    status: MatchmakingState;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null;
    matchInfo: MultiplayerMatchInfo | null;
    privateRoomCode: string | null;
    onStartSearch: (matchLength: number) => void;
    onCreatePrivateRoom: (matchLength: number) => Promise<string>;
    onJoinPrivateRoom: (code: string) => Promise<void>;
    onCancelSearch: () => void;
    onClose: () => void;
    theme?: ThemeName;
}

export type LobbyTab = 'matchmaking' | 'private_room' | 'leaderboard';

export default function MultiplayerLobbyModal({
    isOpen,
    status,
    localProfile,
    opponentProfile,
    matchInfo,
    privateRoomCode,
    onStartSearch,
    onCreatePrivateRoom,
    onJoinPrivateRoom,
    onCancelSearch,
    onClose,
    theme,
}: MultiplayerLobbyModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    const [activeTab, setActiveTab] = useState<LobbyTab>('matchmaking');
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    const localTier = getEloTier(localProfile.rating);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval> | null = null;
        if (status === 'searching' || status === 'connecting') {
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            data-testid="multiplayer-lobby-modal"
        >
            <div
                className="relative w-full max-w-xl rounded-3xl border border-[#d4af37]/55 bg-gradient-to-b from-[#17110b]/98 via-[#0d121d]/98 to-[#070a10]/98 p-6 text-[#fdf8eb] shadow-[0_28px_80px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,245,205,0.25)] transition-all"
            >
                {/* Bouton Fermer */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={status === 'matched' || status === 'connecting'}
                    className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-black/50 text-amber-200/80 hover:border-[#f3c65f] hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Fermer le lobby"
                >
                    ✕
                </button>

                {/* 1. Profil du Joueur Local & Statut En ligne */}
                <div className="mb-6 flex items-center justify-between border-b border-slate-700/60 pb-4 pr-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-lg font-bold text-slate-950 shadow-md">
                            {localProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-white">
                                    {localProfile.displayName}
                                </h2>
                                {localProfile.isGuest && (
                                    <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                                        Invité
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span>{localTier.badge}</span>
                                <span className={localTier.colorClass}>{localTier.title}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono font-bold text-amber-400">
                                    {localProfile.rating} Elo
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>142 joueurs en ligne</span>
                    </div>
                </div>

                {/* ÉTAT MATCHED : Présentation Versus de l'adversaire */}
                {(status === 'matched' || (status === 'connecting' && opponentProfile)) &&
                opponentProfile &&
                matchInfo ? (
                    <LobbyMatchedVersus
                        localProfile={localProfile}
                        opponentProfile={opponentProfile}
                        matchInfo={matchInfo}
                    />
                ) : (
                    <>
                        {/* 2. Barre d'Onglets du Lobby */}
                        <div className="mb-5 flex rounded-xl bg-slate-800/60 p-1 border border-slate-700/60">
                            {[
                                { id: 'matchmaking', label: '⚡ Matchmaking Classé' },
                                { id: 'private_room', label: '🔑 Salon Privé' },
                                { id: 'leaderboard', label: '🏆 Classement' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => {
                                        if (status === 'idle') {
                                            setActiveTab(tab.id as LobbyTab);
                                        }
                                    }}
                                    disabled={status !== 'idle'}
                                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                    } ${status !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ONGLET 1 : MATCHMAKING PUBLIC */}
                        {activeTab === 'matchmaking' && (
                            <div className="space-y-5">
                                {status === 'idle' ? (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                                Format du match classé :
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
                                                                ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500/60 shadow-lg shadow-amber-500/10'
                                                                : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
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
                                            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3.5 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                            data-testid="start-matchmaking-button"
                                        >
                                            ⚡ Lancer la recherche ({selectedLength} pts)
                                        </button>
                                    </>
                                ) : (
                                    /* Écran Recherche Active */
                                    <div className="py-6 text-center space-y-4" data-testid="matchmaking-searching">
                                        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                                            <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-ping" />
                                            <div className="absolute inset-2 rounded-full border border-amber-400/40 animate-pulse" />
                                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-2xl text-amber-400 shadow-inner">
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
                                            <div className="text-[11px] text-amber-400/90 mt-1">
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
                                            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                            data-testid="cancel-matchmaking-button"
                                        >
                                            Annuler la recherche
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ONGLET 2 : SALON PRIVÉ */}
                        {activeTab === 'private_room' && (
                            <LobbyPrivateRoomTab
                                privateRoomCode={privateRoomCode}
                                selectedLength={selectedLength}
                                onCreatePrivateRoom={onCreatePrivateRoom}
                                onJoinPrivateRoom={onJoinPrivateRoom}
                                onCancelSearch={onCancelSearch}
                            />
                        )}

                        {/* ONGLET 3 : CLASSEMENT */}
                        {activeTab === 'leaderboard' && <LobbyLeaderboardTab />}
                    </>
                )}
            </div>
        </div>
    );
}
