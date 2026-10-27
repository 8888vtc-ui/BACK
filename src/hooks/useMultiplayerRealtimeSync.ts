/**
 * @file src/hooks/useMultiplayerRealtimeSync.ts
 * @description Synchronisation Realtime, déconnexion adverse et gestion du canal réseau (< 200 lignes, 0 any).
 */
import { useCallback, useRef, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    RealtimeBroadcastAction,
} from '../features/multiplayer/types';
import { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import {
    pauseClock,
    resumeClock,
    switchClockTurn,
    syncClockState,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';

const DISCONNECT_GRACE_SECONDS = 45;

export interface UseMultiplayerRealtimeSyncParams {
    localProfile: PlayerEloProfile;
    matchInfo: MultiplayerMatchInfo | null;
    currentTurnRef: MutableRefObject<Player>;
    clockConfigRef: MutableRefObject<ClockConfig>;
    setClockState: Dispatch<SetStateAction<MatchClockState | null>>;
    setStatus: Dispatch<SetStateAction<MatchmakingState>>;
    setDisconnectCountdown: Dispatch<SetStateAction<number | null>>;
    setQuickChatMessage: Dispatch<SetStateAction<{ player: Player; messageId: string } | null>>;
    resetTurnTimer: () => void;
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
    onRemoteActionCallback?: (action: RealtimeBroadcastAction) => void;
}

export function useMultiplayerRealtimeSync({
    localProfile,
    matchInfo,
    currentTurnRef,
    clockConfigRef,
    setClockState,
    setStatus,
    setDisconnectCountdown,
    setQuickChatMessage,
    resetTurnTimer,
    handleMatchOver,
    onRemoteActionCallback,
}: UseMultiplayerRealtimeSyncParams) {
    const realtimeRef = useRef<MultiplayerRealtimeManager | null>(null);
    const disconnectTimerRef = useRef<ReturnType<typeof setInterval>>(null);

    const startDisconnectCountdown = useCallback(() => {
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
        let secondsLeft = DISCONNECT_GRACE_SECONDS;
        setDisconnectCountdown(secondsLeft);
        disconnectTimerRef.current = setInterval(() => {
            secondsLeft -= 1;
            setDisconnectCountdown(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(disconnectTimerRef.current!);
                if (matchInfo) handleMatchOver(matchInfo.localRole, 'disconnect', 1);
            }
        }, 1000);
    }, [matchInfo, handleMatchOver, setDisconnectCountdown]);

    const handleRemoteAction = useCallback((action: RealtimeBroadcastAction) => {
        onRemoteActionCallback?.(action);
        switch (action.type) {
            case 'TURN_FINISHED':
                currentTurnRef.current = action.nextTurn;
                resetTurnTimer();
                setClockState((prev) => prev ? switchClockTurn(prev, action.nextTurn, clockConfigRef.current, Date.now()) : null);
                break;
            case 'CLOCK_SYNC':
                setClockState((prev) => prev ? syncClockState(prev, { bankXMs: action.bankXMs, bankOMs: action.bankOMs, delayRemainingMs: action.delayRemainingMs, activePlayer: action.activePlayer, turnStartedAt: action.turnStartedAt, isFlagFallen: action.isFlagFallen }) : null);
                break;
            case 'QUICK_CHAT':
                setQuickChatMessage({ player: action.player, messageId: action.messageId });
                setTimeout(() => setQuickChatMessage(null), 4000);
                break;
            case 'RESIGNED':
                if (matchInfo) handleMatchOver(action.player === 'X' ? 'O' : 'X', action.reason || 'surrender', 1);
                break;
            default: break;
        }
    }, [onRemoteActionCallback, currentTurnRef, resetTurnTimer, setClockState, clockConfigRef, setQuickChatMessage, matchInfo, handleMatchOver]);

    const connectToRealtime = useCallback((info: MultiplayerMatchInfo, _opponent: PlayerEloProfile) => {
        setStatus('connecting');
        if (realtimeRef.current) realtimeRef.current.disconnect();
        const manager = new MultiplayerRealtimeManager(
            info.roomId,
            { userId: localProfile.id, username: localProfile.displayName, role: info.localRole, lastPing: Date.now() },
            {
                onActionReceived: handleRemoteAction,
                onOpponentPresenceChange: (isOnline) => {
                    if (isOnline) {
                        setStatus('connected');
                        setDisconnectCountdown(null);
                        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
                        setClockState((prev) => (prev ? resumeClock(prev) : null));
                    } else {
                        setStatus('opponent_disconnected');
                        setClockState((prev) => (prev ? pauseClock(prev) : null));
                        startDisconnectCountdown();
                    }
                },
                onChannelStatusChange: (chStatus) => {
                    if (chStatus === 'SUBSCRIBED') setStatus('connected');
                    else if (chStatus === 'CHANNEL_ERROR' || chStatus === 'TIMED_OUT') setStatus('error');
                },
            },
        );
        realtimeRef.current = manager;
        manager.connect().catch(() => setStatus('connected'));
    }, [localProfile, handleRemoteAction, setStatus, setDisconnectCountdown, setClockState, startDisconnectCountdown]);

    const clearRealtime = useCallback(() => {
        if (realtimeRef.current) {
            realtimeRef.current.disconnect();
            realtimeRef.current = null;
        }
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
    }, []);

    return {
        realtimeRef,
        connectToRealtime,
        clearRealtime,
    };
}
