'use client';

import { useState, useRef, useCallback } from 'react';
import type { Player, Move } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
    RealtimeBroadcastAction,
} from '../features/multiplayer/types';
import type { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import type { MatchClockState } from '../features/multiplayer/clockManager';
import type { ActiveGameSession } from '../features/multiplayer/sessionRecovery';
import { useMultiplayerLocalProfile } from './useMultiplayerLocalProfile';
import { useMultiplayerClockAndTimers } from './useMultiplayerClockAndTimers';
import { useMultiplayerBroadcasters } from './useMultiplayerBroadcasters';
import { useMultiplayerRoomOrchestrator } from './useMultiplayerRoomOrchestrator';

export interface UseMultiplayerGameReturn {
    status: MatchmakingState;
    matchInfo: MultiplayerMatchInfo | null;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile | null;
    turnTimeRemaining: number;
    disconnectCountdown: number | null;
    eloResult: EloCalculationResult | null;
    quickChatMessage: { player: Player; messageId: string } | null;
    isMyTurn: boolean;
    privateRoomCode: string | null;
    clockState: MatchClockState | null;
    isReconnecting: boolean;
    recoverableSession: ActiveGameSession | null;
    startMatchmaking: (preferredMatchLength?: number) => Promise<void>;
    createPrivateRoom: (matchLength?: number) => Promise<string>;
    joinPrivateRoom: (code: string) => Promise<void>;
    cancelMatchmaking: () => void;
    reconnectActiveSession: () => Promise<void>;
    dismissRecoverableSession: () => void;
    broadcastDiceRolled: (dice: [number, number]) => void;
    broadcastMovePlayed: (move: Move, newBoard: number[], usedDice: [boolean, boolean] | boolean[]) => void;
    broadcastTurnFinished: (nextTurn: Player) => void;
    broadcastDoubleOffered: (cubeValue: number) => void;
    broadcastDoubleAccepted: (cubeValue: number) => void;
    broadcastDoublePassed: (winner: Player) => void;
    broadcastResign: (reason?: 'surrender' | 'timeout' | 'disconnect') => void;
    sendQuickChat: (messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => void;
    handleMatchOver: (
        winner: Player,
        winType: string,
        pointsWon: number,
        prOptions?: { readonly prX?: number | null; readonly prO?: number | null },
    ) => void;
    leaveMatch: () => void;
    onRemoteAction?: (action: RealtimeBroadcastAction) => void;
}

/**
 * Hook de jeu Multijoueur Temps Réel (< 200 lignes, 0 any).
 */
export function useMultiplayerGame(
    onRemoteActionCallback?: (action: RealtimeBroadcastAction) => void,
): UseMultiplayerGameReturn {
    const [status, setStatus] = useState<MatchmakingState>('idle');
    const [matchInfo, setMatchInfo] = useState<MultiplayerMatchInfo | null>(null);
    const [opponentProfile, setOpponentProfile] = useState<PlayerEloProfile | null>(null);
    const [quickChatMessage, setQuickChatMessage] = useState<{ player: Player; messageId: string } | null>(null);
    const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);

    const realtimeRef = useRef<MultiplayerRealtimeManager | null>(null);
    const currentTurnRef = useRef<Player>('X');
    const timeoutResignHandlerRef = useRef<() => void>(() => {});
    const disconnectForfeitHandlerRef = useRef<(winner: Player) => void>(() => {});

    const onTimeoutResign = useCallback(() => {
        timeoutResignHandlerRef.current();
    }, []);

    const onDisconnectForfeit = useCallback((winner: Player) => {
        disconnectForfeitHandlerRef.current(winner);
    }, []);

    const clockAndTimers = useMultiplayerClockAndTimers({
        status,
        matchInfo,
        currentTurnRef,
        onTimeoutResign,
        onDisconnectForfeit,
    });

    const { localProfile, eloResult, setEloResult, handleMatchOver } = useMultiplayerLocalProfile({
        matchInfo,
        setStatus,
        setRecoverableSession: clockAndTimers.setRecoverableSession,
    });

    const broadcasters = useMultiplayerBroadcasters({
        matchInfo,
        realtimeRef,
        currentTurnRef,
        clockConfigRef: clockAndTimers.clockConfigRef,
        setClockState: clockAndTimers.setClockState,
        setQuickChatMessage,
        handleMatchOver,
    });

    timeoutResignHandlerRef.current = () => {
        broadcasters.broadcastResign('timeout');
    };
    disconnectForfeitHandlerRef.current = (winner: Player) => {
        handleMatchOver(winner, 'disconnect', 1);
    };

    const roomOrchestrator = useMultiplayerRoomOrchestrator({
        localProfile,
        matchInfo,
        privateRoomCode,
        recoverableSession: clockAndTimers.recoverableSession,
        realtimeRef,
        currentTurnRef,
        clockConfigRef: clockAndTimers.clockConfigRef,
        turnTimerRef: clockAndTimers.turnTimerRef,
        disconnectTimerRef: clockAndTimers.disconnectTimerRef,
        setStatus,
        setMatchInfo,
        setOpponentProfile,
        setPrivateRoomCode,
        setEloResult,
        setQuickChatMessage,
        setDisconnectCountdown: clockAndTimers.setDisconnectCountdown,
        setTurnTimeRemaining: clockAndTimers.setTurnTimeRemaining,
        setClockState: clockAndTimers.setClockState,
        setIsReconnecting: clockAndTimers.setIsReconnecting,
        setRecoverableSession: clockAndTimers.setRecoverableSession,
        startDisconnectCountdown: clockAndTimers.startDisconnectCountdown,
        handleMatchOver,
        onRemoteActionCallback,
    });

    const isMyTurn = Boolean(
        matchInfo && status === 'connected' && currentTurnRef.current === matchInfo.localRole,
    );

    return {
        status,
        matchInfo,
        localProfile,
        opponentProfile,
        turnTimeRemaining: clockAndTimers.turnTimeRemaining,
        disconnectCountdown: clockAndTimers.disconnectCountdown,
        eloResult,
        quickChatMessage,
        isMyTurn,
        privateRoomCode,
        clockState: clockAndTimers.clockState,
        isReconnecting: clockAndTimers.isReconnecting,
        recoverableSession: clockAndTimers.recoverableSession,
        ...roomOrchestrator,
        ...broadcasters,
        handleMatchOver,
    };
}
