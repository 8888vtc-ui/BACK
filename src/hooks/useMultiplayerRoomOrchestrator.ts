'use client';

import { useCallback, useRef } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
    RealtimeBroadcastAction,
} from '../features/multiplayer/types';
import {
    createMatchmakingTicket,
    findMatchInQueue,
    generateRoomId,
    assignPlayerRoles,
    createMultiplayerMatchInfo,
} from '../features/multiplayer/matchmakingQueue';
import {
    computeRealisticMatchmakingDelayMs,
    selectClubChallengerForRating,
} from '../features/multiplayer/clubChallengerPool';
import { createGameRoom, joinGameRoomByCode, subscribeToGameRoom } from '../features/multiplayer/roomService';
import { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import {
    createMatchClock, switchClockTurn, pauseClock, resumeClock, syncClockState,
    getRecommendedClockConfig, type MatchClockState, type ClockConfig,
} from '../features/multiplayer/clockManager';
import { saveActiveSession, loadActiveSession, clearActiveSession, type ActiveGameSession } from '../features/multiplayer/sessionRecovery';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { TURN_TIME_LIMIT_SECONDS } from './useMultiplayerClockAndTimers';

export interface UseMultiplayerRoomOrchestratorParams {
    localProfile: PlayerEloProfile;
    matchInfo: MultiplayerMatchInfo | null;
    privateRoomCode: string | null;
    recoverableSession: ActiveGameSession | null;
    realtimeRef: React.MutableRefObject<MultiplayerRealtimeManager | null>;
    currentTurnRef: React.MutableRefObject<Player>;
    clockConfigRef: React.MutableRefObject<ClockConfig>;
    turnTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    disconnectTimerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
    setStatus: React.Dispatch<React.SetStateAction<MatchmakingState>>;
    setMatchInfo: React.Dispatch<React.SetStateAction<MultiplayerMatchInfo | null>>;
    setOpponentProfile: React.Dispatch<React.SetStateAction<PlayerEloProfile | null>>;
    setPrivateRoomCode: React.Dispatch<React.SetStateAction<string | null>>;
    setEloResult: React.Dispatch<React.SetStateAction<EloCalculationResult | null>>;
    setQuickChatMessage: React.Dispatch<React.SetStateAction<{ player: Player; messageId: string } | null>>;
    setDisconnectCountdown: React.Dispatch<React.SetStateAction<number | null>>;
    setTurnTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
    setClockState: React.Dispatch<React.SetStateAction<MatchClockState | null>>;
    setIsReconnecting: React.Dispatch<React.SetStateAction<boolean>>;
    setRecoverableSession: React.Dispatch<React.SetStateAction<ActiveGameSession | null>>;
    startDisconnectCountdown: () => void;
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
    onRemoteActionCallback?: (action: RealtimeBroadcastAction) => void;
}

export function useMultiplayerRoomOrchestrator(params: UseMultiplayerRoomOrchestratorParams) {
    const {
        localProfile, matchInfo, privateRoomCode, recoverableSession, realtimeRef, currentTurnRef,
        clockConfigRef, turnTimerRef, disconnectTimerRef, setStatus, setMatchInfo, setOpponentProfile,
        setPrivateRoomCode, setEloResult, setQuickChatMessage, setDisconnectCountdown, setTurnTimeRemaining,
        setClockState, setIsReconnecting, setRecoverableSession, startDisconnectCountdown, handleMatchOver,
        onRemoteActionCallback,
    } = params;
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    function handleRemoteAction(action: RealtimeBroadcastAction) {
        if (onRemoteActionCallback) onRemoteActionCallback(action);
        if (action.type === 'TURN_FINISHED') {
            currentTurnRef.current = action.nextTurn;
            setTurnTimeRemaining(TURN_TIME_LIMIT_SECONDS);
            setClockState((prev) => prev ? switchClockTurn(prev, action.nextTurn, clockConfigRef.current, Date.now()) : null);
        } else if (action.type === 'CLOCK_SYNC') {
            setClockState((prev) => prev ? syncClockState(prev, action) : null);
        } else if (action.type === 'QUICK_CHAT') {
            setQuickChatMessage({ player: action.player, messageId: action.messageId });
            setTimeout(() => setQuickChatMessage(null), 4000);
        } else if (action.type === 'RESIGNED' && matchInfo) {
            handleMatchOver(action.player === 'X' ? 'O' : 'X', action.reason || 'surrender', 1);
        }
    }

    function connectToRealtime(info: MultiplayerMatchInfo) {
        setStatus('connecting');
        if (realtimeRef.current) realtimeRef.current.disconnect();
        const manager = new MultiplayerRealtimeManager(
            info.roomId,
            { userId: localProfile.id, username: localProfile.displayName, role: info.localRole, lastPing: Date.now() },
            {
                onActionReceived: (action) => handleRemoteAction(action),
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
                onChannelStatusChange: (s) => {
                    if (s === 'SUBSCRIBED') setStatus('connected');
                    else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('error');
                },
            },
        );
        realtimeRef.current = manager;
        manager.connect().catch(() => setStatus('connected'));
    }

    function initMatchedRoom(info: MultiplayerMatchInfo, opponent: PlayerEloProfile) {
        setMatchInfo(info); setOpponentProfile(opponent); setStatus('matched');
        currentTurnRef.current = 'X';
        const cfg = getRecommendedClockConfig(info.matchLength, 'delay');
        clockConfigRef.current = cfg;
        setClockState(createMatchClock(cfg, 'X', Date.now()));
        saveActiveSession({
            roomId: info.roomId, code: privateRoomCode || 'BG-MATCH', localRole: info.localRole,
            matchLength: info.matchLength, localProfile, opponentProfile: opponent,
            startedAt: Date.now(), lastHeartbeat: Date.now(),
        });
        setRecoverableSession(null);
        setTimeout(() => connectToRealtime(info), 1800);
    }

    const opponentProfileRef = useRef<PlayerEloProfile | null>(null);

    async function tryMatchHumanFromQueue(preferredMatchLength: number): Promise<boolean> {
        if (!isSupabaseConfigured()) return false;
        try {
            const myTicket = createMatchmakingTicket(localProfile, preferredMatchLength, Date.now());
            const { data: waitingTickets } = await supabase
                .from('matchmaking_queue')
                .select('*')
                .eq('status', 'waiting')
                .neq('user_id', localProfile.id)
                .order('created_at', { ascending: true })
                .limit(10);
            if (!waitingTickets?.length) return false;
            const candidates = waitingTickets.map((t) => ({
                id: t.id,
                userId: t.user_id || t.guest_id || 'remote',
                username: t.display_name,
                displayName: t.display_name,
                rating: t.rating,
                matchLength: t.match_length,
                joinedAt: new Date(t.created_at).getTime(),
                searchTolerance: 200,
            }));
            const match = findMatchInQueue(myTicket, candidates, Date.now());
            if (!match) return false;
            const opp = { id: match.userId, username: match.username, displayName: match.displayName, rating: match.rating };
            const roomId = generateRoomId(localProfile.id, opp.id);
            const roles = assignPlayerRoles(localProfile, opp);
            const info = createMultiplayerMatchInfo(roomId, roles.playerX, roles.playerO, preferredMatchLength, localProfile.id);
            await supabase
                .from('matchmaking_queue')
                .update({
                    status: 'matched',
                    matched_room_id: roomId,
                    matched_opponent_id: localProfile.id,
                    matched_opponent_name: localProfile.displayName,
                    matched_role: roles.playerO.id === opp.id ? 'O' : 'X',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', match.id);
            opponentProfileRef.current = opp;
            initMatchedRoom(info, opp);
            return true;
        } catch {
            return false;
        }
    }

    function scheduleClubChallengerMatch(preferredMatchLength: number, isRematch: boolean = false) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            // Priorité Humain contre Humain : ultime vérification de la file humaine avant d'engager un Bot actif
            if (!isRematch && (await tryMatchHumanFromQueue(preferredMatchLength))) {
                return;
            }
            const opp = selectClubChallengerForRating(localProfile.rating, {
                isRematch,
                previousChallenger: opponentProfileRef.current,
            });
            opponentProfileRef.current = opp;
            const roomId = generateRoomId(localProfile.id, opp.id);
            const info: MultiplayerMatchInfo = {
                ...createMultiplayerMatchInfo(roomId, localProfile, opp, preferredMatchLength, localProfile.id),
                isClubChallenger: true,
            };
            setMatchInfo(info);
            setOpponentProfile(opp);
            setStatus('matched');
            // Fin de la présentation Versus (1.4s) : passage à 'idle' pour fermer la modale et laisser place au plateau
            setTimeout(() => {
                setStatus((prev) => (prev === 'matched' ? 'idle' : prev));
            }, 1400);
            // Salutation courtoise et respectueuse de l'adversaire à l'ouverture de la table
            setTimeout(() => {
                setQuickChatMessage({ player: 'O', messageId: 'gg' });
                setTimeout(() => setQuickChatMessage(null), 3500);
            }, 2400);
        }, isRematch ? 600 : computeRealisticMatchmakingDelayMs());
    }

    const startMatchmaking = useCallback(async (preferredMatchLength = 7, options?: { isRematch?: boolean }) => {
        const isRematch = options?.isRematch === true;
        setStatus('searching'); setEloResult(null); setQuickChatMessage(null); setDisconnectCountdown(null);
        if (isRematch && opponentProfileRef.current?.clubBotDifficulty) {
            scheduleClubChallengerMatch(preferredMatchLength, true);
            return;
        }
        if (!isSupabaseConfigured()) {
            scheduleClubChallengerMatch(preferredMatchLength, false);
            return;
        }
        try {
            if (await tryMatchHumanFromQueue(preferredMatchLength)) {
                return;
            }
            await supabase.from('matchmaking_queue').insert({
                user_id: localProfile.isGuest ? null : localProfile.id, guest_id: localProfile.isGuest ? localProfile.id : null,
                display_name: localProfile.displayName, rating: localProfile.rating, match_length: preferredMatchLength, status: 'waiting',
            });
            scheduleClubChallengerMatch(preferredMatchLength, false);
        } catch (err) {
            console.warn('[Matchmaking] Erreur queue Supabase :', err);
            scheduleClubChallengerMatch(preferredMatchLength, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localProfile]);

    const createPrivateRoom = useCallback(async (matchLength = 7): Promise<string> => {
        setStatus('searching'); setEloResult(null); setQuickChatMessage(null); setDisconnectCountdown(null);
        const room = await createGameRoom({ host: localProfile, matchLength, roomType: 'private_code' });
        setPrivateRoomCode(room.code);
        const sub = subscribeToGameRoom(room.id, localProfile.id, {
            onRoomStateChange: (u) => {
                if (u.status === 'in_progress' && u.player_o_id) {
                    sub.unsubscribe();
                    const opp = { id: u.player_o_id, username: u.player_o_name, displayName: u.player_o_name, rating: u.player_o_rating };
                    initMatchedRoom(createMultiplayerMatchInfo(u.id, localProfile, opp, matchLength, localProfile.id), opp);
                }
            },
            onActionReceived: () => {}, onPresenceChange: () => {},
        });
        return room.code;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localProfile]);

    const joinPrivateRoom = useCallback(async (code: string): Promise<void> => {
        setStatus('connecting'); setEloResult(null); setQuickChatMessage(null);
        const room = await joinGameRoomByCode({ code, guest: localProfile });
        const opp = { id: room.player_x_id || room.host_id || 'host', username: room.player_x_name, displayName: room.player_x_name, rating: room.player_x_rating };
        initMatchedRoom(createMultiplayerMatchInfo(room.id, opp, localProfile, room.match_length, localProfile.id), opp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localProfile]);

    const cancelMatchmaking = useCallback(() => {
        if (realtimeRef.current) { realtimeRef.current.disconnect(); realtimeRef.current = null; }
        clearActiveSession(); setRecoverableSession(null); setClockState(null); setStatus('idle');
        setMatchInfo(null); setOpponentProfile(null); setPrivateRoomCode(null); setDisconnectCountdown(null);
        if (searchTimeoutRef.current) { clearTimeout(searchTimeoutRef.current); searchTimeoutRef.current = null; }
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    }, [realtimeRef, disconnectTimerRef, turnTimerRef, setRecoverableSession, setClockState, setStatus, setMatchInfo, setOpponentProfile, setPrivateRoomCode, setDisconnectCountdown]);

    const reconnectActiveSession = useCallback(async () => {
        const session = recoverableSession || loadActiveSession();
        if (!session) return;
        setIsReconnecting(true); setStatus('connecting');
        const info: MultiplayerMatchInfo = {
            roomId: session.roomId,
            playerX: session.localRole === 'X' ? session.localProfile : session.opponentProfile,
            playerO: session.localRole === 'O' ? session.localProfile : session.opponentProfile,
            matchLength: session.matchLength, startedAt: new Date(session.startedAt).toISOString(), localRole: session.localRole,
        };
        const cfg = getRecommendedClockConfig(session.matchLength, 'delay');
        clockConfigRef.current = cfg;
        setClockState(createMatchClock(cfg, 'X', Date.now()));
        setMatchInfo(info); setOpponentProfile(session.opponentProfile); setRecoverableSession(null);
        connectToRealtime(info); setIsReconnecting(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recoverableSession]);

    const dismissRecoverableSession = useCallback(() => { clearActiveSession(); setRecoverableSession(null); }, [setRecoverableSession]);

    return { startMatchmaking, createPrivateRoom, joinPrivateRoom, cancelMatchmaking, leaveMatch: cancelMatchmaking, reconnectActiveSession, dismissRecoverableSession };
}
