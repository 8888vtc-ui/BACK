'use client';

import React, { useState, useEffect } from 'react';
import type { PlayerEloProfile, MatchmakingState, MultiplayerMatchInfo } from '../../features/multiplayer/types';
import { getEloTier, ELO_TIERS } from '../../features/multiplayer/elo';
import { isValidRoomCode } from '../../features/multiplayer/realtimeSchema';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

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

interface LeaderboardEntry {
    rank: number;
    displayName: string;
    rating: number;
    winRate: number;
    tierBadge: string;
    tierTitle: string;
    isLocalUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, displayName: 'Elena Rostova', rating: 2284, winRate: 78, tierBadge: '👑', tierTitle: 'Légende' },
    { rank: 2, displayName: 'Alexandre_Paris', rating: 2190, winRate: 74, tierBadge: '👑', tierTitle: 'Légende' },
    { rank: 3, displayName: 'Julien B. (Master)', rating: 2045, winRate: 70, tierBadge: '💎', tierTitle: 'Grand-Maître' },
    { rank: 4, displayName: 'Nadia M.', rating: 1980, winRate: 67, tierBadge: '💎', tierTitle: 'Grand-Maître' },
    { rank: 5, displayName: 'Marc_Backgammon', rating: 1870, winRate: 64, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 6, displayName: 'Sophie_L', rating: 1795, winRate: 62, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 7, displayName: 'Karim_T', rating: 1720, winRate: 59, tierBadge: '⚔️', tierTitle: 'Maître' },
    { rank: 8, displayName: 'Luc_Tournament', rating: 1650, winRate: 55, tierBadge: '🎯', tierTitle: 'Compétiteur' },
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
    theme,
}: MultiplayerLobbyModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    const [activeTab, setActiveTab] = useState<LobbyTab>('matchmaking');
    const [selectedLength, setSelectedLength] = useState<number>(7);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const [inputCode, setInputCode] = useState<string>('');
    const [joinError, setJoinError] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<boolean>(false);

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

    const handleCopyCode = async (codeToCopy: string) => {
        try {
            await navigator.clipboard.writeText(codeToCopy);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleJoinWithCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setJoinError(null);
        const code = inputCode.trim().toUpperCase();

        if (!isValidRoomCode(code)) {
            setJoinError('Le format du code est invalide (ex: BG-8421).');
            return;
        }

        try {
            setIsJoining(true);
            await onJoinPrivateRoom(code);
        } catch (err: unknown) {
            setJoinError(err instanceof Error ? err.message : 'Impossible de rejoindre ce salon.');
        } finally {
            setIsJoining(false);
        }
    };

    const handleCreateRoom = async () => {
        setJoinError(null);
        await onCreatePrivateRoom(selectedLength);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in ${modalClasses.overlay}`}
            data-testid="multiplayer-lobby-modal"
        >
            <div className={`relative w-full max-w-xl overflow-hidden rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/90 transition-all ${modalClasses.container}`}>
                {/* Bouton fermer si pas en recherche active */}
                {status === 'idle' && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        aria-label="Fermer le salon"
                    >
                        ✕
                    </button>
                )}

                {/* 1. Profil du Joueur & Titre */}
                <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-xl font-bold text-slate-950 shadow-lg shadow-amber-500/20">
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

                        {/* ONGLET 2 : SALON PRIVÉ (CODE D'INVITATION) */}
                        {activeTab === 'private_room' && (
                            <div className="space-y-5" data-testid="private-room-tab">
                                {privateRoomCode ? (
                                    /* Code créé, en attente de l'ami */
                                    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5 text-center space-y-4">
                                        <div className="text-xs uppercase font-bold tracking-wider text-amber-400">
                                            Votre Salon Privé est ouvert
                                        </div>

                                        <div className="flex items-center justify-center gap-3">
                                            <span className="font-mono text-3xl font-black tracking-widest text-white bg-slate-800/90 border border-slate-700 px-5 py-2.5 rounded-2xl shadow-inner">
                                                {privateRoomCode}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(privateRoomCode)}
                                                className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-all"
                                            >
                                                {copiedCode ? '✓ Copié !' : '📋 Copier'}
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-400">
                                            Partagez ce code à un ami pour qu'il rejoigne votre partie en direct.
                                        </p>

                                        <div className="flex items-center justify-center gap-2 text-xs text-amber-300/80 animate-pulse">
                                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                                            <span>En attente de connexion de l'adversaire...</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={onCancelSearch}
                                            className="text-xs text-slate-400 hover:text-white underline transition"
                                        >
                                            Fermer ce salon
                                        </button>
                                    </div>
                                ) : (
                                    /* Choix Créer ou Rejoindre */
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Créer */}
                                        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                <span>➕</span>
                                                <span>Créer un Salon</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                Générez un code unique et invitez un adversaire pour un match personnalisé.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleCreateRoom}
                                                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                                            >
                                                Générer un code
                                            </button>
                                        </div>

                                        {/* Rejoindre */}
                                        <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                                <span>🚪</span>
                                                <span>Rejoindre par Code</span>
                                            </div>
                                            <form onSubmit={handleJoinWithCode} className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={inputCode}
                                                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                                    placeholder="Ex: BG-8492"
                                                    maxLength={7}
                                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                                                />
                                                {joinError && (
                                                    <div className="text-[10px] text-rose-400">{joinError}</div>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={isJoining || inputCode.length < 4}
                                                    className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-bold text-slate-950 transition-all disabled:opacity-50"
                                                >
                                                    {isJoining ? 'Connexion...' : 'Rejoindre'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ONGLET 3 : CLASSEMENT MONDIAL */}
                        {activeTab === 'leaderboard' && (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1" data-testid="leaderboard-tab">
                                {MOCK_LEADERBOARD.map((player) => (
                                    <div
                                        key={player.rank}
                                        className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-800/30 px-3.5 py-2 text-xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-black text-slate-400 w-5">
                                                #{player.rank}
                                            </span>
                                            <div>
                                                <div className="font-bold text-white">
                                                    {player.displayName}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                                    <span>{player.tierBadge}</span>
                                                    <span>{player.tierTitle}</span>
                                                    <span>•</span>
                                                    <span>{player.winRate}% victoires</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="font-mono font-bold text-amber-400">
                                            {player.rating} Elo
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
