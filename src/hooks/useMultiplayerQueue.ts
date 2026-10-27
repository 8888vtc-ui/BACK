/**
 * @file src/hooks/useMultiplayerQueue.ts
 * @description File d'attente de matchmaking public et appariement Elo (< 200 lignes, 0 any).
 */
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    MatchmakingState,
    EloCalculationResult,
} from '../features/multiplayer/types';
import {
    createMatchmakingTicket,
    findMatchInQueue,
    generateRoomId,
    assignPlayerRoles,
    createMultiplayerMatchInfo,
} from '../features/multiplayer/matchmakingQueue';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export interface UseMultiplayerQueueParams {
    localProfile: PlayerEloProfile;
    setStatus: Dispatch<SetStateAction<MatchmakingState>>;
    setEloResult: Dispatch<SetStateAction<EloCalculationResult | null>>;
    setQuickChatMessage: Dispatch<SetStateAction<{ player: Player; messageId: string } | null>>;
    setDisconnectCountdown: Dispatch<SetStateAction<number | null>>;
    initMatchedRoom: (info: MultiplayerMatchInfo, opponent: PlayerEloProfile) => void;
}

export function useMultiplayerQueue({
    localProfile,
    setStatus,
    setEloResult,
    setQuickChatMessage,
    setDisconnectCountdown,
    initMatchedRoom,
}: UseMultiplayerQueueParams) {
    const startMatchmaking = useCallback(async (preferredMatchLength = 7) => {
        setStatus('searching');
        setEloResult(null);
        setQuickChatMessage(null);
        setDisconnectCountdown(null);

        const startTime = Date.now();
        const myTicket = createMatchmakingTicket(localProfile, preferredMatchLength, startTime);

        if (isSupabaseConfigured()) {
            try {
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
    }, [localProfile, setStatus, setEloResult, setQuickChatMessage, setDisconnectCountdown, initMatchedRoom]);

    return { startMatchmaking };
}
