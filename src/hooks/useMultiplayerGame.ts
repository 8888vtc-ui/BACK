'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, Move } from '../engine/backgammonEngine';
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
import { calculateMatchElo, DEFAULT_INITIAL_ELO } from '../features/multiplayer/elo';
import {
    createGameRoom,
    joinGameRoomByCode,
    subscribeToGameRoom,
} from '../features/multiplayer/roomService';
import { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import {
    createMatchClock,
    computeClockTick,
    switchClockTurn,
    pauseClock,
    resumeClock,
    syncClockState,
    getRecommendedClockConfig,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';
import {
    saveActiveSession,
    loadActiveSession,
    clearActiveSession,
    touchActiveSession,
    isSessionRecoverable,
    fetchRecoverableRoomSnapshot,
    type ActiveGameSession,
} from '../features/multiplayer/sessionRecovery';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { getCurrentUser, getUserProfile } from '../lib/supabase/auth';

const TURN_TIME_LIMIT_SECONDS = 45;
const DISCONNECT_GRACE_SECONDS = 45;

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
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
    leaveMatch: () => void;
    onRemoteAction?: (action: RealtimeBroadcastAction) => void;
}

export function useMultiplayerGame(
    onRemoteActionCallback?: (action: RealtimeBroadcastAction) => void,
): UseMultiplayerGameReturn {
    const [status, setStatus] = useState<MatchmakingState>('idle');
    const [matchInfo, setMatchInfo] = useState<MultiplayerMatchInfo | null>(null);
    const [opponentProfile, setOpponentProfile] = useState<PlayerEloProfile | null>(null);
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(TURN_TIME_LIMIT_SECONDS);
    const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
    const [eloResult, setEloResult] = useState<EloCalculationResult | null>(null);
    const [quickChatMessage, setQuickChatMessage] = useState<{ player: Player; messageId: string } | null>(null);
    const [privateRoomCode, setPrivateRoomCode] = useState<string | null>(null);
    const [clockState, setClockState] = useState<MatchClockState | null>(null);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const [recoverableSession, setRecoverableSession] = useState<ActiveGameSession | null>(null);

    const [localProfile, setLocalProfile] = useState<PlayerEloProfile>(() => {
        const guestId = typeof window !== 'undefined'
            ? localStorage.getItem('bg_guest_id') || `guest_${Math.random().toString(36).slice(2, 8)}`
            : 'guest_local';
        if (typeof window !== 'undefined') localStorage.setItem('bg_guest_id', guestId);

        return {
            id: guestId,
            username: `Joueur_${guestId.slice(-4)}`,
            displayName: `Joueur #${guestId.slice(-4)}`,
            rating: DEFAULT_INITIAL_ELO,
            isGuest: true,
        };
    });

    const clockConfigRef = useRef<ClockConfig>(getRecommendedClockConfig(7, 'delay'));
    const realtimeRef = useRef<MultiplayerRealtimeManager | null>(null);
    const turnTimerRef = useRef<ReturnType<typeof setInterval>>(null);
    const disconnectTimerRef = useRef<ReturnType<typeof setInterval>>(null);
    const currentTurnRef = useRef<Player>('X');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    // 1. Détection d'une session récupérable au démarrage
    useEffect(() => {
        const saved = loadActiveSession();
        if (saved && isSessionRecoverable(saved)) {
            setRecoverableSession(saved);
        }
    }, []);

    // 2. Écouteurs de perte / reprise de connexion réseau (Window online / offline)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOffline = () => {
            if (status === 'connected') {
                setIsReconnecting(true);
                setClockState((prev) => (prev ? pauseClock(prev) : null));
            }
        };

        const handleOnline = async () => {
            if (status === 'connected' || isReconnecting) {
                setIsReconnecting(true);
                if (matchInfo) {
                    await fetchRecoverableRoomSnapshot(matchInfo.roomId);
                }
                setClockState((prev) => (prev ? resumeClock(prev) : null));
                setIsReconnecting(false);
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [status, isReconnecting, matchInfo]);

    const handleMatchOver = useCallback(
        (winner: Player, _winType: string, _pointsWon: number) => {
            if (!matchInfo) return;
            setStatus('game_over');
            clearActiveSession();
            setRecoverableSession(null);

            const ratingX = matchInfo.playerX.rating;
            const ratingO = matchInfo.playerO.rating;
            const elo = calculateMatchElo(ratingX, ratingO, winner);
            setEloResult(elo);

            // Mettre à jour l'Elo local
            const newLocalRating =
                matchInfo.localRole === 'X' ? elo.playerXNewRating : elo.playerONewRating;

            setLocalProfile((prev) => ({
                ...prev,
                rating: newLocalRating,
            }));

            // Sauvegarder dans Supabase si connecté
            if (isSupabaseConfigured() && !localProfile.isGuest) {
                supabase
                    .from('profiles')
                    .update({
                        rating: newLocalRating,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', localProfile.id)
                    .then(() => {}, () => {});
            }
        },
        [matchInfo, localProfile],
    );

    const broadcastResign = useCallback(
        (reason: 'surrender' | 'timeout' | 'disconnect' = 'surrender') => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'RESIGNED',
                player: matchInfo.localRole,
                reason,
                timestamp: Date.now(),
            });
            const winner = matchInfo.localRole === 'X' ? 'O' : 'X';
            handleMatchOver(winner, reason, 1);
        },
        [matchInfo, handleMatchOver],
    );

    const hasClockState = clockState !== null;
    const isClockPaused = clockState?.isPaused ?? false;
    const isClockFlagFallen = clockState?.isFlagFallen ?? false;

    // 3. Ticking précis de la pendule de match (WBF delay / flag fall)
    useEffect(() => {
        if (status !== 'connected' || !hasClockState || isClockPaused || isClockFlagFallen) {
            return;
        }

        const interval = setInterval(() => {
            setClockState((prev) => {
                if (!prev || prev.isPaused || prev.isFlagFallen) return prev;
                const tick = computeClockTick(prev, Date.now());

                if (tick.isFlagFallen && !prev.isFlagFallen) {
                    if (matchInfo && tick.flagFallenPlayer === matchInfo.localRole) {
                        broadcastResign('timeout');
                    }
                    return {
                        ...prev,
                        bankXMs: tick.bankXMs,
                        bankOMs: tick.bankOMs,
                        isFlagFallen: true,
                        flagFallenPlayer: tick.flagFallenPlayer,
                    };
                }

                return {
                    ...prev,
                    bankXMs: tick.bankXMs,
                    bankOMs: tick.bankOMs,
                    delayRemainingMs: tick.delayRemainingMs,
                };
            });
        }, 500);

        return () => clearInterval(interval);
    }, [status, hasClockState, isClockPaused, isClockFlagFallen, matchInfo, broadcastResign]);

    // 4. Heartbeat de persistance de session (touch toutes les 10s)
    useEffect(() => {
        if (status !== 'connected') return;
        const interval = setInterval(() => {
            touchActiveSession();
        }, 10000);
        return () => clearInterval(interval);
    }, [status]);

    // Récupération du profil Supabase réel si connecté
    useEffect(() => {
        let mounted = true;
        async function loadProfile() {
            try {
                const user = await getCurrentUser();
                if (user && mounted) {
                    const prof = await getUserProfile(user.id);
                    setLocalProfile({
                        id: user.id,
                        username: prof?.username || user.email?.split('@')[0] || 'Joueur',
                        displayName: prof?.display_name || 'Champion',
                        rating: prof?.rating || DEFAULT_INITIAL_ELO,
                        avatarUrl: prof?.avatar_url,
                        isGuest: false,
                    });
                }
            } catch {
                // Invité local
            }
        }
        loadProfile();
        return () => {
            mounted = false;
        };
    }, []);

    // Horloge de réflexion par tour (45s)
    useEffect(() => {
        if (status !== 'connected') {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
            return;
        }

        setTurnTimeRemaining(TURN_TIME_LIMIT_SECONDS);
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);

        turnTimerRef.current = setInterval(() => {
            setTurnTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(turnTimerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
        };
    }, [status]);

    // Détection d'expiration du temps de jeu
    useEffect(() => {
        if (turnTimeRemaining === 0 && status === 'connected' && matchInfo) {
            const isLocalPlayerTurn = matchInfo.localRole === currentTurnRef.current;
            if (isLocalPlayerTurn) {
                // Le joueur local a dépassé son temps : abandon par forfait temps
                broadcastResign('timeout');
            }
        }
    }, [turnTimeRemaining, status, matchInfo, broadcastResign]);

    const isMyTurn = Boolean(
        matchInfo && status === 'connected' && currentTurnRef.current === matchInfo.localRole,
    );

    /**
     * Lance la recherche de match public avec matchmaking Elo.
     */
    const startMatchmaking = useCallback(
        async (preferredMatchLength = 7) => {
            setStatus('searching');
            setEloResult(null);
            setQuickChatMessage(null);
            setDisconnectCountdown(null);

            const startTime = Date.now();
            const myTicket = createMatchmakingTicket(localProfile, preferredMatchLength, startTime);

            // 1. Tenter un appariement réel via Supabase si disponible
            if (isSupabaseConfigured()) {
                try {
                    // Vérifier si un adversaire en attente correspond
                    const { data: waitingTickets } = await supabase
                        .from('matchmaking_queue')
                        .select('*')
                        .eq('status', 'waiting')
                        .neq('user_id', localProfile.id)
                        .order('created_at', { ascending: true })
                        .limit(10);

                    if (waitingTickets && waitingTickets.length > 0) {
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
                        if (match) {
                            const oppProfile: PlayerEloProfile = {
                                id: match.userId,
                                username: match.username,
                                displayName: match.displayName,
                                rating: match.rating,
                            };

                            const roomId = generateRoomId(localProfile.id, oppProfile.id);
                            const roles = assignPlayerRoles(localProfile, oppProfile);
                            const info = createMultiplayerMatchInfo(
                                roomId,
                                roles.playerX,
                                roles.playerO,
                                preferredMatchLength,
                                localProfile.id,
                            );

                            // Marquer le ticket comme matched
                            await supabase
                                .from('matchmaking_queue')
                                .update({
                                    status: 'matched',
                                    matched_room_id: roomId,
                                    matched_opponent_id: localProfile.id,
                                    matched_opponent_name: localProfile.displayName,
                                    matched_role: roles.playerO.id === oppProfile.id ? 'O' : 'X',
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', match.id);

                            initMatchedRoom(info, oppProfile);
                            return;
                        }
                    }

                    // Aucun adversaire immédiat : insérer son ticket
                    await supabase.from('matchmaking_queue').insert({
                        user_id: localProfile.isGuest ? null : localProfile.id,
                        guest_id: localProfile.isGuest ? localProfile.id : null,
                        display_name: localProfile.displayName,
                        rating: localProfile.rating,
                        match_length: preferredMatchLength,
                        status: 'waiting',
                    });
                } catch (err) {
                    console.warn('[Matchmaking] Erreur queue Supabase :', err);
                }
            }

            // Fallback / simulation de matchmaking réactif après un temps de recherche réaliste (3s - 5s)
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = setTimeout(() => {
                const simulatedOpponents: PlayerEloProfile[] = [
                    { id: 'sim_opp_1', username: 'Alexandre_Paris', displayName: 'Alexandre', rating: Math.round(localProfile.rating + (Math.random() * 80 - 40)) },
                    { id: 'sim_opp_2', username: 'Nadia_Marseille', displayName: 'Nadia M.', rating: Math.round(localProfile.rating + (Math.random() * 120 - 60)) },
                    { id: 'sim_opp_3', username: 'MasterJan_75', displayName: 'Julien B.', rating: Math.round(localProfile.rating + (Math.random() * 100 - 50)) },
                    { id: 'sim_opp_4', username: 'GrandMaître_AI', displayName: 'Elena Rostova', rating: Math.round(localProfile.rating + 35) },
                ];
                const opponent = simulatedOpponents[Math.floor(Math.random() * simulatedOpponents.length)];
                const roomId = generateRoomId(localProfile.id, opponent.id);
                const roles = assignPlayerRoles(localProfile, opponent);
                const info = createMultiplayerMatchInfo(
                    roomId,
                    roles.playerX,
                    roles.playerO,
                    preferredMatchLength,
                    localProfile.id,
                );

                initMatchedRoom(info, opponent);
            }, 3200);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [localProfile],
    );

    const createPrivateRoom = useCallback(
        async (matchLength = 7): Promise<string> => {
            setStatus('searching');
            setEloResult(null);
            setQuickChatMessage(null);
            setDisconnectCountdown(null);

            const room = await createGameRoom({
                host: localProfile,
                matchLength,
                roomType: 'private_code',
            });

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
                        const info = createMultiplayerMatchInfo(
                            updatedRoom.id,
                            localProfile,
                            opp,
                            matchLength,
                            localProfile.id,
                        );
                        initMatchedRoom(info, opp);
                    }
                },
                onActionReceived: () => {},
                onPresenceChange: () => {},
            });

            return room.code;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [localProfile],
    );

    const joinPrivateRoom = useCallback(
        async (code: string): Promise<void> => {
            setStatus('connecting');
            setEloResult(null);
            setQuickChatMessage(null);

            const room = await joinGameRoomByCode({
                code,
                guest: localProfile,
            });

            const opp: PlayerEloProfile = {
                id: room.player_x_id || room.host_id || 'host',
                username: room.player_x_name,
                displayName: room.player_x_name,
                rating: room.player_x_rating,
            };

            const info = createMultiplayerMatchInfo(
                room.id,
                opp,
                localProfile,
                room.match_length,
                localProfile.id,
            );

            initMatchedRoom(info, opp);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [localProfile],
    );

    function initMatchedRoom(info: MultiplayerMatchInfo, opponent: PlayerEloProfile) {
        setMatchInfo(info);
        setOpponentProfile(opponent);
        setStatus('matched');
        currentTurnRef.current = 'X';

        // Initialisation de la pendule de match (WBF Delay)
        const cfg = getRecommendedClockConfig(info.matchLength, 'delay');
        clockConfigRef.current = cfg;
        setClockState(createMatchClock(cfg, 'X', Date.now()));

        // Sauvegarde de la session active pour reconnexion en cas de coupure
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

        // Petit délai de célébration/présentation de l'adversaire (1.8s) avant la connexion au plateau
        setTimeout(() => {
            connectToRealtime(info, opponent);
        }, 1800);
    }

    function connectToRealtime(info: MultiplayerMatchInfo, opponent: PlayerEloProfile) {
        setStatus('connecting');

        if (realtimeRef.current) {
            realtimeRef.current.disconnect();
        }

        const manager = new MultiplayerRealtimeManager(
            info.roomId,
            {
                userId: localProfile.id,
                username: localProfile.displayName,
                role: info.localRole,
                lastPing: Date.now(),
            },
            {
                onActionReceived: (action) => {
                    handleRemoteAction(action);
                },
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
                onChannelStatusChange: (channelStatus) => {
                    if (channelStatus === 'SUBSCRIBED') {
                        setStatus('connected');
                    } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
                        setStatus('error');
                    }
                },
            },
        );

        realtimeRef.current = manager;
        manager.connect().catch(() => {
            setStatus('connected');
        });
    }

    function startDisconnectCountdown() {
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
        let secondsLeft = DISCONNECT_GRACE_SECONDS;
        setDisconnectCountdown(secondsLeft);

        disconnectTimerRef.current = setInterval(() => {
            secondsLeft -= 1;
            setDisconnectCountdown(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(disconnectTimerRef.current!);
                // Forfait de l'adversaire déconnecté
                if (matchInfo) {
                    handleMatchOver(matchInfo.localRole, 'disconnect', 1);
                }
            }
        }, 1000);
    }

    function handleRemoteAction(action: RealtimeBroadcastAction) {
        if (onRemoteActionCallback) {
            onRemoteActionCallback(action);
        }

        switch (action.type) {
            case 'TURN_FINISHED':
                currentTurnRef.current = action.nextTurn;
                setTurnTimeRemaining(TURN_TIME_LIMIT_SECONDS);
                setClockState((prev) =>
                    prev ? switchClockTurn(prev, action.nextTurn, clockConfigRef.current, Date.now()) : null,
                );
                break;
            case 'CLOCK_SYNC':
                setClockState((prev) =>
                    prev
                        ? syncClockState(prev, {
                              bankXMs: action.bankXMs,
                              bankOMs: action.bankOMs,
                              delayRemainingMs: action.delayRemainingMs,
                              activePlayer: action.activePlayer,
                              turnStartedAt: action.turnStartedAt,
                              isFlagFallen: action.isFlagFallen,
                          })
                        : null,
                );
                break;
            case 'QUICK_CHAT':
                setQuickChatMessage({ player: action.player, messageId: action.messageId });
                setTimeout(() => setQuickChatMessage(null), 4000);
                break;
            case 'RESIGNED':
                if (matchInfo) {
                    const winner = action.player === 'X' ? 'O' : 'X';
                    handleMatchOver(winner, action.reason || 'surrender', 1);
                }
                break;
            default:
                break;
        }
    }

    const cancelMatchmaking = useCallback(() => {
        if (realtimeRef.current) {
            realtimeRef.current.disconnect();
            realtimeRef.current = null;
        }
        clearActiveSession();
        setRecoverableSession(null);
        setClockState(null);
        setStatus('idle');
        setMatchInfo(null);
        setOpponentProfile(null);
        setPrivateRoomCode(null);
        setDisconnectCountdown(null);
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    }, []);

    const leaveMatch = useCallback(() => {
        cancelMatchmaking();
    }, [cancelMatchmaking]);

    // Diffusion des événements de jeu
    const broadcastDiceRolled = useCallback(
        (dice: [number, number]) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DICE_ROLLED',
                player: matchInfo.localRole,
                dice,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

    const broadcastMovePlayed = useCallback(
        (move: Move, newBoard: number[], usedDice: [boolean, boolean] | boolean[]) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'CHECKER_MOVED',
                player: matchInfo.localRole,
                move,
                board: newBoard,
                usedDice,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

    const broadcastTurnFinished = useCallback(
        (nextTurn: Player) => {
            if (!matchInfo || !realtimeRef.current) return;
            currentTurnRef.current = nextTurn;
            realtimeRef.current.sendAction({
                type: 'TURN_FINISHED',
                player: matchInfo.localRole,
                nextTurn,
                timestamp: Date.now(),
            });

            // Passage de tour sur la pendule de match et synchronisation broadcast
            setClockState((prev) => {
                if (!prev) return null;
                const updated = switchClockTurn(prev, nextTurn, clockConfigRef.current, Date.now());
                realtimeRef.current?.sendAction({
                    type: 'CLOCK_SYNC',
                    player: matchInfo.localRole,
                    bankXMs: updated.bankXMs,
                    bankOMs: updated.bankOMs,
                    delayRemainingMs: updated.delayRemainingMs,
                    activePlayer: updated.activePlayer,
                    turnStartedAt: updated.turnStartedAt,
                    isFlagFallen: updated.isFlagFallen,
                    timestamp: Date.now(),
                });
                return updated;
            });
        },
        [matchInfo],
    );

    const broadcastDoubleOffered = useCallback(
        (cubeValue: number) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_OFFERED',
                player: matchInfo.localRole,
                cubeValue,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

    const broadcastDoubleAccepted = useCallback(
        (cubeValue: number) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_ACCEPTED',
                player: matchInfo.localRole,
                cubeValue,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

    const broadcastDoublePassed = useCallback(
        (winner: Player) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_PASSED',
                player: matchInfo.localRole,
                winner,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

    const sendQuickChat = useCallback(
        (messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => {
            if (!matchInfo || !realtimeRef.current) return;
            setQuickChatMessage({ player: matchInfo.localRole, messageId });
            setTimeout(() => setQuickChatMessage(null), 3000);
            realtimeRef.current.sendAction({
                type: 'QUICK_CHAT',
                player: matchInfo.localRole,
                messageId,
                timestamp: Date.now(),
            });
        },
        [matchInfo],
    );

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recoverableSession]);

    const dismissRecoverableSession = useCallback(() => {
        clearActiveSession();
        setRecoverableSession(null);
    }, []);

    return {
        status,
        matchInfo,
        localProfile,
        opponentProfile,
        turnTimeRemaining,
        disconnectCountdown,
        eloResult,
        quickChatMessage,
        isMyTurn,
        privateRoomCode,
        clockState,
        isReconnecting,
        recoverableSession,
        startMatchmaking,
        createPrivateRoom,
        joinPrivateRoom,
        cancelMatchmaking,
        reconnectActiveSession,
        dismissRecoverableSession,
        broadcastDiceRolled,
        broadcastMovePlayed,
        broadcastTurnFinished,
        broadcastDoubleOffered,
        broadcastDoubleAccepted,
        broadcastDoublePassed,
        broadcastResign,
        sendQuickChat,
        handleMatchOver,
        leaveMatch,
    };
}
