'use client';

/**
 * Modale Multijoueur — Cercle Monte-Carlo.
 *
 * Rôle :
 *   Clarifie les 2 actions principales du mode multijoueur :
 *   1. Matchmaking Rapide (appariement automatique selon l'Elo)
 *   2. Salon Privé par Code (BG-XXXX, création ou connexion directe entre amis / club)
 *
 * Loi 5 de Scalabilité : strictement 0 any, < 300 lignes.
 */

import React, { useState, useEffect } from 'react';
import type { PlayerEloProfile, MatchmakingState, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { getEloTier } from '../../features/multiplayer/elo';
import { type ThemeName } from '../../hooks/useBoardTheme';
import { LobbyMatchedVersus } from './LobbyMatchedVersus';
import { LobbyPrivateRoomTab } from './LobbyPrivateRoomTab';

export interface MultiplayerLobbyModalProps {
    isOpen: boolean;
    status: MatchmakingState;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null;
    matchInfo: MultiplayerMatchInfo | null;
    privateRoomCode: string | null;
    onStartSearch?: (matchLength: number) => void;
    onCreatePrivateRoom: (matchLength: number) => Promise<string>;
    onJoinPrivateRoom: (code: string) => Promise<void>;
    onCancelSearch: () => void;
    onClose: () => void;
    theme?: ThemeName;
}

const MATCH_FORMATS: ReadonlyArray<{ pts: number; label: string; sub: string }> = [
    { pts: 0, label: 'Money', sub: 'Jacoby' },
    { pts: 1, label: '1 pt', sub: 'Blitz' },
    { pts: 3, label: '3 pts', sub: 'Rapide' },
    { pts: 5, label: '5 pts', sub: 'Standard' },
    { pts: 7, label: '7 pts', sub: 'Tournoi' },
    { pts: 11, label: '11 pts', sub: 'Master' },
];

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
}: MultiplayerLobbyModalProps) {
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const localTier = getEloTier(localProfile.rating);

    useEffect(() => {
        if (status !== 'searching' || privateRoomCode) {
            setElapsedSeconds(0);
            return;
        }
        setElapsedSeconds(0);
        const timer = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [status, privateRoomCode]);

    if (!isOpen) return null;

    const isMatched =
        (status === 'matched' || (status === 'connecting' && opponentProfile)) &&
        Boolean(opponentProfile && matchInfo);
    const isSearchingPublic = status === 'searching' && !privateRoomCode;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            data-testid="multiplayer-lobby-modal"
        >
            <div
                className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950/98 p-6 text-slate-100 shadow-2xl transition-all"
            >
                {/* Bouton Fermer */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={status === 'matched' || status === 'connecting'}
                    className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Fermer le salon multijoueur"
                >
                    ✕
                </button>

                {/* 1. En-tête du Joueur Local */}
                <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4 pr-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-base font-black text-slate-950 shadow-sm">
                            {localProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-extrabold text-white">
                                    {localProfile.displayName}
                                </h2>
                                {localProfile.isGuest && (
                                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                        Invité
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span>{localTier.badge}</span>
                                <span className={localTier.colorClass}>{localTier.title}</span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono font-bold text-amber-300">
                                    {localProfile.rating} Elo
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>En ligne</span>
                    </div>
                </div>

                {/* ÉTAT MATCHED : Présentation Versus de l'adversaire */}
                {isMatched && opponentProfile && matchInfo ? (
                    <LobbyMatchedVersus
                        localProfile={localProfile}
                        opponentProfile={opponentProfile}
                        matchInfo={matchInfo}
                    />
                ) : isSearchingPublic ? (
                    /* ÉTAT RECHERCHE MATCHMAKING RAPIDE EN COURS */
                    <div className="py-6 text-center space-y-4" data-testid="matchmaking-searching">
                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                            <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping" />
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-amber-500/15 text-2xl text-amber-300">
                                📡
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-base font-bold text-white">
                                Recherche d&apos;un adversaire...
                            </div>
                            <div className="text-xs text-slate-300 font-mono">
                                Temps écoulé : {elapsedSeconds}s • Format : {selectedLength === 0 ? 'Money Game' : `${selectedLength} pts`}
                            </div>
                            <div className="text-xs text-amber-300/90">
                                {elapsedSeconds < 5
                                    ? 'Tolérance stricte (±100 Elo)'
                                    : elapsedSeconds < 10
                                      ? 'Élargissement de la recherche (±250 Elo)'
                                      : 'Recherche élargie (Appariement prioritaire)'}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCancelSearch}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition-colors"
                            data-testid="cancel-matchmaking-button"
                        >
                            Annuler la recherche
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Sélecteur de format commun : Match (Crawford) vs Money Game (Jacoby) */}
                        {!privateRoomCode && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Formule de jeu :
                                    </label>
                                    <span className="font-mono text-xs text-amber-300">
                                        {selectedLength === 0 ? '💰 Money Game · Règle de Jacoby' : `🏆 Match ${selectedLength} pts · Règle de Crawford`}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                    {MATCH_FORMATS.map((format) => {
                                        const active = selectedLength === format.pts;
                                        return (
                                            <button
                                                key={format.pts}
                                                type="button"
                                                onClick={() => setSelectedLength(format.pts)}
                                                className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-all ${
                                                    active
                                                        ? 'border-[#f3c65f] bg-[#f3c65f]/15 text-white shadow-sm'
                                                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white'
                                                }`}
                                            >
                                                <span className="text-xs font-bold">{format.label}</span>
                                                <span className="text-[11px] text-slate-400">{format.sub}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ACTION PRINCIPALE 1 : Matchmaking Rapide */}
                        {!privateRoomCode && (
                            <section
                                data-testid="lobby-action-matchmaking"
                                className="rounded-xl border border-white/10 bg-slate-900/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-white whitespace-nowrap">
                                            ⚡ Matchmaking Rapide
                                        </span>
                                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-amber-300 whitespace-nowrap shrink-0">
                                            Classé Elo
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Trouvez immédiatement un adversaire en ligne de niveau proche ({localProfile.rating} Elo).
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onStartSearch?.(selectedLength)}
                                    data-testid="start-matchmaking-button"
                                    className="shrink-0 rounded-xl border border-[#f3c65f] bg-[#f3c65f] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-sm hover:bg-[#f7d37c] transition-all"
                                >
                                    ⚡ Lancer la recherche ({selectedLength === 0 ? 'Money' : `${selectedLength} pts`})
                                </button>
                            </section>
                        )}

                        {/* ACTION PRINCIPALE 2 : Salon Privé par Code (BG-XXXX) */}
                        <section
                            data-testid="lobby-action-private-room"
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                    🔑 Salon Privé par Code
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                    Ami &amp; Club · Code BG-XXXX
                                </span>
                            </div>

                            <LobbyPrivateRoomTab
                                privateRoomCode={privateRoomCode}
                                selectedLength={selectedLength}
                                onCreatePrivateRoom={onCreatePrivateRoom}
                                onJoinPrivateRoom={onJoinPrivateRoom}
                                onCancelSearch={onCancelSearch}
                            />
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
