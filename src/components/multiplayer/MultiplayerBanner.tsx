'use client';

import React, { useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
} from '../../features/multiplayer/types';
import type { MatchClockState } from '../../features/multiplayer/clockManager';
import { formatClockTime } from '../../features/multiplayer/clockManager';

export interface MultiplayerBannerProps {
    status: MatchmakingState;
    matchInfo: MultiplayerMatchInfo;
    opponentProfile: PlayerEloProfile;
    localProfile: PlayerEloProfile;
    turn: Player;
    turnTimeRemaining: number;
    disconnectCountdown: number | null;
    quickChatMessage: { player: Player; messageId: string } | null;
    clockState?: MatchClockState | null;
    isReconnecting?: boolean;
    onSendQuickChat: (msg: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => void;
    onResign: () => void;
}

const QUICK_MESSAGES: Record<string, string> = {
    gg: '👏 Bien joué !',
    nice_move: '🎯 Joli coup !',
    unlucky: '🎲 Pas de chance...',
    thinking: '🤔 Je réfléchis...',
    thanks: '🙏 Merci pour la partie !',
};

export default function MultiplayerBanner({
    status,
    matchInfo,
    opponentProfile,
    localProfile,
    turn,
    turnTimeRemaining,
    disconnectCountdown,
    quickChatMessage,
    clockState = null,
    isReconnecting = false,
    onSendQuickChat,
    onResign,
}: MultiplayerBannerProps) {
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [showResignConfirm, setShowResignConfirm] = useState(false);

    const isMyTurn = matchInfo.localRole === turn;
    const opponentRole = matchInfo.localRole === 'X' ? 'O' : 'X';

    // Pourcentage restant du timer de réflexion (45s)
    const timerPercent = Math.max(0, Math.min(100, (turnTimeRemaining / 45) * 100));
    const isTimerCritical = turnTimeRemaining <= 10;

    return (
        <div
            className="w-full rounded-2xl border border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-3 shadow-xl backdrop-blur-md"
            data-testid="multiplayer-banner"
        >
            {/* Bannière de reconnexion suite à coupure réseau */}
            {isReconnecting && (
                <div
                    className="mb-2.5 flex items-center justify-between rounded-xl border border-sky-500/50 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-300 animate-pulse"
                    data-testid="reconnecting-warning"
                >
                    <span className="flex items-center gap-2 font-medium">
                        🔄 Coupure réseau détectée... Tentative de reconnexion automatique
                    </span>
                    <span className="font-mono text-sky-400">Reconnexion</span>
                </div>
            )}
            {/* Bannière d'alerte en cas de déconnexion de l'adversaire */}
            {status === 'opponent_disconnected' && disconnectCountdown !== null && (
                <div
                    className="mb-2.5 flex items-center justify-between rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 animate-pulse"
                    data-testid="disconnect-warning"
                >
                    <span className="flex items-center gap-2 font-medium">
                        ⚠️ Adversaire temporairement déconnecté...
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                        Forfait dans {disconnectCountdown}s
                    </span>
                </div>
            )}

            {/* Bulle de Quick Chat flottante */}
            {quickChatMessage && (
                <div className="mb-2 text-center animate-bounce">
                    <span className="inline-block rounded-full bg-slate-800 border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-300 shadow-md">
                        {quickChatMessage.player === matchInfo.localRole ? 'Vous' : opponentProfile.displayName} :{' '}
                        {QUICK_MESSAGES[quickChatMessage.messageId] || quickChatMessage.messageId}
                    </span>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* 1. Joueur Local (Gauche) */}
                <div className="flex items-center gap-2.5">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow ${
                            matchInfo.localRole === 'X'
                                ? 'border-2 border-slate-300 bg-slate-700'
                                : 'border-2 border-amber-500/60 bg-amber-900/60'
                        }`}
                    >
                        {matchInfo.localRole}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            <span>{localProfile.displayName} (Vous)</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Connecté" />
                        </div>
                        <div className="text-[10px] font-mono text-amber-400">
                            {localProfile.rating} Elo
                        </div>
                        {clockState && (
                            <div
                                className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-bold ${
                                    clockState.activePlayer === matchInfo.localRole
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                                        : 'bg-slate-800 text-slate-400'
                                }`}
                                data-testid="local-clock"
                            >
                                <span>⏱️</span>
                                <span>
                                    {formatClockTime(
                                        matchInfo.localRole === 'X' ? clockState.bankXMs : clockState.bankOMs,
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Centre : Indicateur de tour & Horloge de réflexion */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight shadow-sm transition-all ${
                                isMyTurn
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                        >
                            {isMyTurn ? '👉 À VOUS DE JOUER' : `Tour de ${opponentProfile.displayName}`}
                        </span>

                        <span
                            className={`font-mono text-xs font-bold ${
                                isTimerCritical ? 'text-rose-400 animate-ping' : 'text-slate-300'
                            }`}
                        >
                            ⏱️ {turnTimeRemaining}s
                        </span>
                    </div>

                    {/* Barre de timer */}
                    <div className="h-1.5 w-36 overflow-hidden rounded-full bg-slate-800">
                        <div
                            className={`h-full transition-all duration-1000 ${
                                isTimerCritical ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-amber-400'
                            }`}
                            style={{ width: `${timerPercent}%` }}
                        />
                    </div>
                </div>

                {/* 3. Adversaire (Droite) */}
                <div className="flex items-center gap-2.5">
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-white">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                                }`}
                                title={status === 'connected' ? 'En ligne' : 'Reconnexion'}
                            />
                            <span>{opponentProfile.displayName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-amber-400">
                            {opponentProfile.rating} Elo
                        </div>
                        {clockState && (
                            <div
                                className={`mt-1 inline-flex items-center justify-end gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-bold ${
                                    clockState.activePlayer === opponentRole
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                                        : 'bg-slate-800 text-slate-400'
                                }`}
                                data-testid="opponent-clock"
                            >
                                <span>
                                    {formatClockTime(
                                        opponentRole === 'X' ? clockState.bankXMs : clockState.bankOMs,
                                    )}
                                </span>
                                <span>⏱️</span>
                            </div>
                        )}
                    </div>
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow ${
                            opponentRole === 'X'
                                ? 'border-2 border-slate-300 bg-slate-700'
                                : 'border-2 border-amber-500/60 bg-amber-900/60'
                        }`}
                    >
                        {opponentRole}
                    </div>
                </div>

                {/* 4. Actions : Quick Chat & Abandon */}
                <div className="flex items-center gap-2 border-t border-slate-800/80 pt-2 w-full justify-end">
                    {/* Menu Quick Chat */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowChatMenu(!showChatMenu)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                            💬 Message
                        </button>

                        {showChatMenu && (
                            <div className="absolute right-0 bottom-full mb-2 z-20 w-44 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl space-y-1">
                                {(
                                    [
                                        ['gg', '👏 Bien joué !'],
                                        ['nice_move', '🎯 Joli coup !'],
                                        ['unlucky', '🎲 Pas de chance...'],
                                        ['thinking', '🤔 Je réfléchis...'],
                                        ['thanks', '🙏 Merci !'],
                                    ] as const
                                ).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            onSendQuickChat(key);
                                            setShowChatMenu(false);
                                        }}
                                        className="w-full rounded-lg px-2 py-1 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bouton Abandonner avec confirmation */}
                    {!showResignConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowResignConfirm(true)}
                            className="rounded-lg border border-rose-900/50 bg-rose-950/40 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-900/60 hover:text-rose-100 transition-colors"
                        >
                            🏳️ Abandonner
                        </button>
                    ) : (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                            <span className="text-[10px] text-rose-400">Confirmer ?</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowResignConfirm(false);
                                    onResign();
                                }}
                                className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-500"
                            >
                                Oui
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowResignConfirm(false)}
                                className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700"
                            >
                                Non
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
