/**
 * Service de gestion des Salles (Rooms), Actions et Synchronisation Supabase Realtime.
 *
 * Fonctionnalités :
 * - Création de salon privé avec code d'invitation (ex: 'BG-8492')
 * - Rejoindre un salon par code
 * - Enregistrement atomique des coups avec trigger de séquençage
 * - Souscription Realtime hybride (Postgres Changes CDC + Presence + Broadcast)
 * - Fallback in-memory & BroadcastChannel résilient pour tests, hors-ligne et multi-onglets
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any).
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { GameRoomRecord, RoomActionRecord } from '../../lib/supabase/types';
import type { PlayerEloProfile } from './types';
import { generateRoomCode } from './realtimeSchema';
import { createInitialState } from '../../engine/backgammonEngine';
import {
    concludeGameRoomInternal,
    type ConcludeGameRoomParams,
    type ConcludedRoomResult,
} from './roomConcludeService';
import {
    pushRoomAction as pushRoomActionInternal,
    fetchRoomActions as fetchRoomActionsInternal,
    type PushActionParams,
} from './roomActionService';

export type { ConcludeGameRoomParams, ConcludedRoomResult, PushActionParams };

export interface CreateRoomParams {
    host: PlayerEloProfile;
    matchLength?: number;
    roomType?: 'public_matchmaking' | 'private_code';
    timeLimitSeconds?: number;
}

export interface JoinRoomParams {
    code: string;
    guest: PlayerEloProfile;
}

export interface RoomSubscriptionCallbacks {
    onRoomStateChange: (room: GameRoomRecord) => void;
    onActionReceived: (action: RoomActionRecord) => void;
    onPresenceChange: (isOpponentOnline: boolean) => void;
}

// Registre Mock en mémoire pour tests & mode hors-ligne
const mockRoomsRegistry = new Map<string, GameRoomRecord>();

interface MockSubscriber {
    roomId: string;
    localUserId: string;
    callbacks: RoomSubscriptionCallbacks;
}

const mockSubscribers = new Set<MockSubscriber>();

function getBroadcastChannel(name: string): BroadcastChannel | null {
    if (typeof globalThis !== 'undefined' && typeof globalThis.BroadcastChannel !== 'undefined') {
        try {
            return new globalThis.BroadcastChannel(name);
        } catch {
            return null;
        }
    }
    return null;
}

const crossTabChannel = getBroadcastChannel('bg_rooms_sync');
if (crossTabChannel) {
    crossTabChannel.onmessage = (event: MessageEvent<GameRoomRecord>) => {
        const room = event.data;
        if (!room || !room.id) return;
        mockRoomsRegistry.set(room.id, room);
        if (room.code) mockRoomsRegistry.set(room.code.toUpperCase(), room);
        notifyMockSubscribers(room);
    };
}

function notifyMockSubscribers(room: GameRoomRecord): void {
    for (const sub of mockSubscribers) {
        if (sub.roomId === room.id) {
            sub.callbacks.onRoomStateChange(room);
            if (room.status === 'in_progress') sub.callbacks.onPresenceChange(true);
        }
    }
}

let roomCounter = 0;

/**
 * Crée une nouvelle salle de jeu multijoueur.
 */
export async function createGameRoom(params: CreateRoomParams): Promise<GameRoomRecord> {
    const { host, matchLength = 7, roomType = 'private_code', timeLimitSeconds = 45 } = params;
    const initialBoard = createInitialState(matchLength).board;
    const code = generateRoomCode();
    const now = new Date().toISOString();

    const newRoom: GameRoomRecord = {
        id: `room_${Date.now()}_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : ++roomCounter}`,
        code,
        room_type: roomType,
        status: 'waiting',
        match_length: matchLength,
        host_id: host.isGuest ? null : host.id,
        guest_id: null,
        host_guest_token: host.isGuest ? host.id : null,
        guest_guest_token: null,
        player_x_id: host.isGuest ? null : host.id,
        player_o_id: null,
        player_x_name: host.displayName,
        player_o_name: 'En attente...',
        player_x_rating: host.rating,
        player_o_rating: 1500,
        board: initialBoard,
        score_x: 0,
        score_o: 0,
        turn: 'X', dice: null, used_dice: [false, false], cube_value: 1, cube_owner: null,
        doubling_offered_by: null, is_crawford: false, time_control_type: 'per_turn',
        time_limit_seconds: timeLimitSeconds, clock_x_ms: timeLimitSeconds * 1000, clock_o_ms: timeLimitSeconds * 1000,
        last_turn_started_at: now, sequence_number: 0, winner: null, win_type: null,
        points_won: 0, elo_delta_x: null, elo_delta_o: null, created_at: now, updated_at: now,
    };

    if (!isSupabaseConfigured()) {
        mockRoomsRegistry.set(newRoom.id, newRoom);
        mockRoomsRegistry.set(code.toUpperCase(), newRoom);
        crossTabChannel?.postMessage(newRoom);
        return newRoom;
    }

    try {
        const { data, error } = await supabase
            .from('game_rooms')
            .insert({
                code: newRoom.code,
                room_type: newRoom.room_type,
                status: newRoom.status,
                match_length: newRoom.match_length,
                host_id: newRoom.host_id,
                host_guest_token: newRoom.host_guest_token,
                player_x_id: newRoom.player_x_id,
                player_x_name: newRoom.player_x_name,
                player_x_rating: newRoom.player_x_rating,
                board: newRoom.board,
                score_x: newRoom.score_x,
                score_o: newRoom.score_o,
                turn: newRoom.turn,
                used_dice: newRoom.used_dice,
                cube_value: newRoom.cube_value,
                time_control_type: newRoom.time_control_type,
                time_limit_seconds: newRoom.time_limit_seconds,
                clock_x_ms: newRoom.clock_x_ms,
                clock_o_ms: newRoom.clock_o_ms,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Impossible de créer la salle : ${error?.message ?? 'réponse vide de Supabase.'}`);
        }

        return data;
    } catch (err) {
        throw new Error(`Impossible de créer la salle : ${err instanceof Error ? err.message : 'erreur inconnue.'}`);
    }
}

/**
 * Rejoint une salle existante via son code d'invitation (ex: 'BG-8492').
 */
export async function joinGameRoomByCode(params: JoinRoomParams): Promise<GameRoomRecord> {
    const { code, guest } = params;
    let cleanCode = code.trim().toUpperCase().replace(/^BG_/, 'BG-');
    if (!cleanCode.startsWith('BG-') && /^[2-9A-HJ-NP-Z]{4}$/i.test(cleanCode)) cleanCode = `BG-${cleanCode}`;

    if (!isSupabaseConfigured()) {
        const room = mockRoomsRegistry.get(cleanCode);
        if (!room) {
            throw new Error(`Aucune salle trouvée pour le code "${cleanCode}".`);
        }
        if (room.status !== 'waiting' && room.status !== 'ready') {
            throw new Error(`La salle "${cleanCode}" est déjà en cours ou terminée.`);
        }

        const updatedRoom: GameRoomRecord = {
            ...room,
            guest_id: guest.isGuest ? null : guest.id,
            guest_guest_token: guest.isGuest ? guest.id : null,
            player_o_id: guest.isGuest ? null : guest.id,
            player_o_name: guest.displayName,
            player_o_rating: guest.rating,
            status: 'in_progress' as const,
            updated_at: new Date().toISOString(),
        };

        mockRoomsRegistry.set(room.id, updatedRoom);
        mockRoomsRegistry.set(cleanCode, updatedRoom);
        if (room.code) mockRoomsRegistry.set(room.code.toUpperCase(), updatedRoom);
        notifyMockSubscribers(updatedRoom);
        crossTabChannel?.postMessage(updatedRoom);
        return updatedRoom;
    }

    // 1. Chercher la salle correspondante la plus récente
    const { data: foundRoom, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('code', cleanCode)
        .in('status', ['waiting', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError || !foundRoom) {
        throw new Error(`Aucune salle active trouvée pour le code "${cleanCode}".`);
    }

    // 2. Mettre à jour avec les informations de l'invité
    const updatePayload = {
        guest_id: guest.isGuest ? null : guest.id,
        guest_guest_token: guest.isGuest ? guest.id : null,
        player_o_id: guest.isGuest ? null : guest.id,
        player_o_name: guest.displayName,
        player_o_rating: guest.rating,
        status: 'in_progress' as const,
        updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateError } = await supabase
        .from('game_rooms').update(updatePayload).eq('id', foundRoom.id).select('*');
    if (updateError) throw new Error(`Impossible de rejoindre la salle : ${updateError.message}`);

    const updatedRoom: GameRoomRecord = (updatedRows && updatedRows[0])
        ? (updatedRows[0] as GameRoomRecord)
        : ({ ...foundRoom, ...updatePayload } as GameRoomRecord);

    mockRoomsRegistry.set(foundRoom.id, updatedRoom);
    mockRoomsRegistry.set(cleanCode, updatedRoom);
    notifyMockSubscribers(updatedRoom);
    crossTabChannel?.postMessage(updatedRoom);
    supabase.channel(`realtime_room_${foundRoom.id}`).send({
        type: 'broadcast',
        event: 'room_state',
        payload: updatedRoom,
    }).catch(() => {});
    return updatedRoom;
}

/**
 * Enregistre une action de jeu dans room_actions (délégué à roomActionService.ts).
 */
export async function pushRoomAction(params: PushActionParams): Promise<RoomActionRecord> {
    return pushRoomActionInternal(params, (roomId, boardAfter, nextSeq) => {
        const room = mockRoomsRegistry.get(roomId);
        if (room) {
            const updated: GameRoomRecord = {
                ...room,
                board: boardAfter,
                sequence_number: nextSeq,
                updated_at: new Date().toISOString(),
            };
            mockRoomsRegistry.set(roomId, updated);
            notifyMockSubscribers(updated);
        }
    });
}

/**
 * Récupère l'historique des actions d'une salle par ordre chronologique.
 */
export async function fetchRoomActions(roomId: string): Promise<RoomActionRecord[]> {
    return fetchRoomActionsInternal(roomId);
}

/**
 * Récupère les données d'une salle de jeu par son ID.
 */
export async function getGameRoom(roomId: string): Promise<GameRoomRecord | null> {
    if (!isSupabaseConfigured()) {
        return mockRoomsRegistry.get(roomId) || null;
    }

    const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

    if (error || !data) {
        return null;
    }

    return data as GameRoomRecord;
}

/**
 * Souscription Realtime hybride : écoute les changements CDC Postgres de la salle
 * et des actions, ainsi que la présence des joueurs sur le canal WebSocket.
 */
export function subscribeToGameRoom(
    roomId: string,
    localUserId: string,
    callbacks: RoomSubscriptionCallbacks,
): { unsubscribe: () => void } {
    const subEntry: MockSubscriber = { roomId, localUserId, callbacks };
    mockSubscribers.add(subEntry);

    const existingRoom = mockRoomsRegistry.get(roomId);
    if (existingRoom && existingRoom.status === 'in_progress') {
        setTimeout(() => callbacks.onRoomStateChange(existingRoom), 10);
    }

    if (!isSupabaseConfigured() || typeof window === 'undefined') {
        return {
            unsubscribe: () => {
                mockSubscribers.delete(subEntry);
            },
        };
    }

    const channelName = `realtime_room_${roomId}`;
    const channel = supabase.channel(channelName, {
        config: {
            presence: { key: localUserId },
            broadcast: { ack: false, self: false },
        },
    });

    channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
            const updatedRoom = payload.new as GameRoomRecord;
            if (updatedRoom) callbacks.onRoomStateChange(updatedRoom);
        },
    );

    channel.on('broadcast', { event: 'room_state' }, (payload) => {
        const updatedRoom = payload.payload as GameRoomRecord;
        if (updatedRoom) callbacks.onRoomStateChange(updatedRoom);
    });

    channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_actions', filter: `room_id=eq.${roomId}` },
        (payload) => {
            const newAction = payload.new as RoomActionRecord;
            if (newAction) callbacks.onActionReceived(newAction);
        },
    );

    channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let opponentPresent = false;
        for (const key of Object.keys(state)) {
            if (key !== localUserId) {
                opponentPresent = true;
                break;
            }
        }
        callbacks.onPresenceChange(opponentPresent);
    });

    channel.subscribe();

    return {
        unsubscribe: () => {
            mockSubscribers.delete(subEntry);
            supabase.removeChannel(channel).catch(() => { });
        },
    };
}

/**
 * Clôture un match multijoueur (délégué à roomConcludeService.ts).
 */
export async function concludeGameRoom(
    params: ConcludeGameRoomParams,
): Promise<ConcludedRoomResult> {
    return concludeGameRoomInternal(
        params,
        getGameRoom,
        (roomId, updated) => {
            mockRoomsRegistry.set(roomId, updated);
            if (updated.code) mockRoomsRegistry.set(updated.code, updated);
        },
    );
}
