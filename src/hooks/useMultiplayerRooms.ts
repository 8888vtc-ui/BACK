/**
 * @file src/hooks/useMultiplayerRooms.ts
 * @description Gestion des salons privés et reconnexion de session active (< 200 lignes, 0 any).
 */
import { useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
} from '../features/multiplayer/types';
import { createMultiplayerMatchInfo } from '../features/multiplayer/matchmakingQueue';
import {
    createGameRoom,
    joinGameRoomByCode,
    subscribeToGameRoom,
} from '../features/multiplayer/roomService';
import {
    createMatchClock,
    getRecommendedClockConfig,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';
import {
    saveActiveSession,
    clearActiveSession,
    loadActiveSession,
    type ActiveGameSession,
} from '../features/multiplayer/sessionRecovery';

export interface UseMultiplayerRoomsParams {
    localProfile: PlayerEloProfile;
    privateRoomCode: string | null;
    recoverableSession: ActiveGameSession | null;
    setStatus: Dispatch<SetStateAction<MatchmakingState>>;
    setMatchInfo: Dispatch<SetStateAction<MultiplayerMatchInfo | null>>;
    setOpponentProfile: Dispatch<SetStateAction<PlayerEloProfile | null>>;
    setPrivateRoomCode: Dispatch<SetStateAction<string | null>>;
    setEloResult: Dispatch<SetStateAction<EloCalculationResult | null>>;
    setQuickChatMessage: Dispatch<SetStateAction<{ player: Player; messageId: string } | null>>;
    setDisconnectCountdown: Dispatch<SetStateAction<number | null>>;
    setClockState: Dispatch<SetStateAction<MatchClockState | null>>;
    setIsReconnecting: Dispatch<SetStateAction<boolean>>;
    setRecoverableSession: Dispatch<SetStateAction<ActiveGameSession | null>>;
    currentTurnRef: MutableRefObject<Player>;
    clockConfigRef: MutableRefObject<ClockConfig>;
    connectToRealtime: (info: MultiplayerMatchInfo, opponent: PlayerEloProfile) => void;
}

export function useMultiplayerRooms({
    localProfile,
    privateRoomCode,
    recoverableSession,
    setStatus,
    setMatchInfo,
    setOpponentProfile,
    setPrivateRoomCode,
    setEloResult,
    setQuickChatMessage,
    setDisconnectCountdown,
    setClockState,
    setIsReconnecting,
    setRecoverableSession,
    currentTurnRef,
    clockConfigRef,
    connectToRealtime,
}: UseMultiplayerRoomsParams) {
    const initMatchedRoom = useCallback((info: MultiplayerMatchInfo, opponent: PlayerEloProfile) => {
        setMatchInfo(info);
        setOpponentProfile(opponent);
        setStatus('matched');
        currentTurnRef.current = 'X';

        const cfg = getRecommendedClockConfig(info.matchLength, 'delay');
        clockConfigRef.current = cfg;
        setClockState(createMatchClock(cfg, 'X', Date.now()));

        saveActiveSession({
            roomId: info.roomId,
            code: privateRoomCode || 'BG-MATCH',
            localRole: info.localRole,
            matchLength: info.matchLength,
            localProfile,
            opponentProfile: opponent,
            startedAt: Date.now(),
            lastHeartbeat: Date.now(),
        });
        setRecoverableSession(null);

        setTimeout(() => connectToRealtime(info, opponent), 1800);
    }, [privateRoomCode, localProfile, currentTurnRef, clockConfigRef, setMatchInfo, setOpponentProfile, setStatus, setClockState, setRecoverableSession, connectToRealtime]);

    const createPrivateRoom = useCallback(async (matchLength = 7): Promise<string> => {
        setStatus('searching');
        setEloResult(null);
        setQuickChatMessage(null);
        setDisconnectCountdown(null);

        const room = await createGameRoom({ host: localProfile, matchLength, roomType: 'private_code' });
        setPrivateRoomCode(room.code);

        const subscription = subscribeToGameRoom(room.id, localProfile.id, {
            onRoomStateChange: (updatedRoom) => {
                if (updatedRoom.status === 'in_progress' && updatedRoom.player_o_id) {
                    subscription.unsubscribe();
                    const opp: PlayerEloProfile = {
                        id: updatedRoom.player_o_id,
                        username: updatedRoom.player_o_name,
                        displayName: updatedRoom.player_o_name,
                        rating: updatedRoom.player_o_rating,
                    };
                    initMatchedRoom(createMultiplayerMatchInfo(updatedRoom.id, localProfile, opp, matchLength, localProfile.id), opp);
                }
            },
            onActionReceived: () => {},
            onPresenceChange: () => {},
        });

        return room.code;
    }, [localProfile, setStatus, setEloResult, setQuickChatMessage, setDisconnectCountdown, setPrivateRoomCode, initMatchedRoom]);

    const joinPrivateRoom = useCallback(async (code: string): Promise<void> => {
        setStatus('connecting');
        setEloResult(null);
        setQuickChatMessage(null);

        const room = await joinGameRoomByCode({ code, guest: localProfile });
        const opp: PlayerEloProfile = {
            id: room.player_x_id || room.host_id || 'host',
            username: room.player_x_name,
            displayName: room.player_x_name,
            rating: room.player_x_rating,
        };

        initMatchedRoom(createMultiplayerMatchInfo(room.id, opp, localProfile, room.match_length, localProfile.id), opp);
    }, [localProfile, setStatus, setEloResult, setQuickChatMessage, initMatchedRoom]);

    const reconnectActiveSession = useCallback(async () => {
        const session = recoverableSession || loadActiveSession();
        if (!session) return;
        setIsReconnecting(true);
        setStatus('connecting');

        const info: MultiplayerMatchInfo = {
            roomId: session.roomId,
            playerX: session.localRole === 'X' ? session.localProfile : session.opponentProfile,
            playerO: session.localRole === 'O' ? session.localProfile : session.opponentProfile,
            matchLength: session.matchLength,
            startedAt: new Date(session.startedAt).toISOString(),
            localRole: session.localRole,
        };

        const cfg = getRecommendedClockConfig(session.matchLength, 'delay');
        clockConfigRef.current = cfg;
        setClockState(createMatchClock(cfg, 'X', Date.now()));

        setMatchInfo(info);
        setOpponentProfile(session.opponentProfile);
        setRecoverableSession(null);

        connectToRealtime(info, session.opponentProfile);
        setIsReconnecting(false);
    }, [recoverableSession, setIsReconnecting, setStatus, clockConfigRef, setClockState, setMatchInfo, setOpponentProfile, setRecoverableSession, connectToRealtime]);

    const dismissRecoverableSession = useCallback(() => {
        clearActiveSession();
        setRecoverableSession(null);
    }, [setRecoverableSession]);

    return { initMatchedRoom, createPrivateRoom, joinPrivateRoom, reconnectActiveSession, dismissRecoverableSession };
}
