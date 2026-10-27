/**
 * Service de gestion des Salles (Rooms), Actions et Synchronisation Supabase Realtime.
 *
 * Fonctionnalités :
 * - Création de salon privé avec code d'invitation (ex: 'BG-8492')
 * - Rejoindre un salon par code
 * - Enregistrement atomique des coups avec trigger de séquençage
 * - Souscription Realtime hybride (Postgres Changes CDC + Presence + Broadcast)
 * - Fallback in-memory résilient pour le mode hors-ligne et les tests
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { GameRoomRecord, RoomActionRecord } from '../../lib/supabase/types';
import type { PlayerEloProfile } from './types';
import { generateRoomCode } from './realtimeSchema';
import { createInitialState } from '../../engine/backgammonEngine';
import { calculateMultiplayerGlicko2Rating } from './galaxyRating';
import type { HeadToHeadCompositeResult } from '../../lib/rating/glicko2Composite';

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

export interface PushActionParams {
    roomId: string;
    player: 'X' | 'O';
    actionType:
    | 'ROLL_DICE'
    | 'MOVE_CHECKER'
    | 'OFFER_DOUBLE'
    | 'ACCEPT_DOUBLE'
    | 'PASS_DOUBLE'
    | 'END_TURN'
    | 'RESIGN'
    | 'TIMEOUT'
    | 'SYNC_SNAPSHOT';
    boardAfter: number[];
    dice?: [number, number] | null;
    moveFrom?: number | null;
    moveTo?: number | null;
    moveNotation?: string | null;
    cubeValue?: number | null;
    timeSpentMs?: number;
}

export interface RoomSubscriptionCallbacks {
    onRoomStateChange: (room: GameRoomRecord) => void;
    onActionReceived: (action: RoomActionRecord) => void;
    onPresenceChange: (isOpponentOnline: boolean) => void;
}

// Registre Mock en mémoire pour tests & mode hors-ligne
const mockRoomsRegistry = new Map<string, GameRoomRecord>();
const mockActionsRegistry = new Map<string, RoomActionRecord[]>();

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
        turn: 'X',
        dice: null,
        used_dice: [false, false],
        cube_value: 1,
        cube_owner: null,
        doubling_offered_by: null,
        is_crawford: false,
        time_control_type: 'per_turn',
        time_limit_seconds: timeLimitSeconds,
        clock_x_ms: timeLimitSeconds * 1000,
        clock_o_ms: timeLimitSeconds * 1000,
        last_turn_started_at: now,
        sequence_number: 0,
        winner: null,
        win_type: null,
        points_won: 0,
        elo_delta_x: null,
        elo_delta_o: null,
        created_at: now,
        updated_at: now,
    };

    if (!isSupabaseConfigured()) {
        mockRoomsRegistry.set(newRoom.id, newRoom);
        mockRoomsRegistry.set(code.toUpperCase(), newRoom);
        mockActionsRegistry.set(newRoom.id, []);
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
            throw new Error(
                `Impossible de créer la salle : ${error?.message ?? 'réponse vide de Supabase.'}`,
            );
        }

        return data;
    } catch (err) {
        // Aucun repli silencieux : l'échec d'insertion Supabase doit remonter à l'appelant.
        // Le joueur ne doit jamais croire qu'il est connecté alors que la salle n'existe pas.
        throw new Error(
            `Impossible de créer la salle : ${err instanceof Error ? err.message : 'erreur inconnue.'}`,
        );
    }
}

/**
 * Rejoint une salle existante via son code d'invitation (ex: 'BG-8492').
 */
export async function joinGameRoomByCode(params: JoinRoomParams): Promise<GameRoomRecord> {
    const { code, guest } = params;
    const cleanCode = code.trim().toUpperCase();

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
            status: 'in_progress',
            updated_at: new Date().toISOString(),
        };

        mockRoomsRegistry.set(room.id, updatedRoom);
        mockRoomsRegistry.set(cleanCode, updatedRoom);
        return updatedRoom;
    }

    // 1. Chercher la salle correspondante
    const { data: foundRoom, error: findError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('code', cleanCode)
        .in('status', ['waiting', 'ready'])
        .single();

    if (findError || !foundRoom) {
        throw new Error(`Aucune salle active trouvée pour le code "${cleanCode}".`);
    }

    // 2. Mettre à jour avec les informations de l'invité
    const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({
            guest_id: guest.isGuest ? null : guest.id,
            guest_guest_token: guest.isGuest ? guest.id : null,
            player_o_id: guest.isGuest ? null : guest.id,
            player_o_name: guest.displayName,
            player_o_rating: guest.rating,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
        })
        .eq('id', foundRoom.id)
        .select('*')
        .single();

    if (updateError || !updatedRoom) {
        throw new Error(`Impossible de rejoindre la salle : ${updateError?.message}`);
    }

    return updatedRoom;
}

/**
 * Enregistre une action de jeu dans room_actions.
 * Le trigger Postgres incrémente le sequence_number et met à jour game_rooms.board.
 */
export async function pushRoomAction(params: PushActionParams): Promise<RoomActionRecord> {
    const {
        roomId,
        player,
        actionType,
        boardAfter,
        dice = null,
        moveFrom = null,
        moveTo = null,
        moveNotation = null,
        cubeValue = null,
        timeSpentMs = 0,
    } = params;

    if (!isSupabaseConfigured()) {
        const actions = mockActionsRegistry.get(roomId) || [];
        const nextSeq = actions.length + 1;
        const newAction: RoomActionRecord = {
            id: `act_${Date.now()}_${nextSeq}`,
            room_id: roomId,
            sequence_number: nextSeq,
            player,
            action_type: actionType,
            dice: dice ? [dice[0], dice[1]] : null,
            move_from: moveFrom,
            move_to: moveTo,
            move_notation: moveNotation,
            cube_value: cubeValue,
            board_after: boardAfter,
            time_spent_ms: timeSpentMs,
            created_at: new Date().toISOString(),
        };

        actions.push(newAction);
        mockActionsRegistry.set(roomId, actions);

        const room = mockRoomsRegistry.get(roomId);
        if (room) {
            mockRoomsRegistry.set(roomId, {
                ...room,
                board: boardAfter,
                sequence_number: nextSeq,
                updated_at: new Date().toISOString(),
            });
        }

        return newAction;
    }

    const { data, error } = await supabase
        .from('room_actions')
        .insert({
            room_id: roomId,
            player,
            action_type: actionType,
            dice: dice ? [dice[0], dice[1]] : null,
            move_from: moveFrom,
            move_to: moveTo,
            move_notation: moveNotation,
            cube_value: cubeValue,
            board_after: boardAfter,
            time_spent_ms: timeSpentMs,
        })
        .select('*')
        .single();

    if (error || !data) {
        throw new Error(`Échec d'enregistrement de l'action de jeu : ${error?.message}`);
    }

    return data;
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
    if (!isSupabaseConfigured() || typeof window === 'undefined') {
        return { unsubscribe: () => { } };
    }

    const channelName = `realtime_room_${roomId}`;
    const channel = supabase.channel(channelName, {
        config: {
            presence: { key: localUserId },
            broadcast: { ack: false, self: false },
        },
    });

    // 1. Écoute des mutations CDC sur game_rooms (état dénormalisé)
    channel.on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'game_rooms',
            filter: `id=eq.${roomId}`,
        },
        (payload) => {
            const updatedRoom = payload.new as GameRoomRecord;
            if (updatedRoom) {
                callbacks.onRoomStateChange(updatedRoom);
            }
        },
    );

    // 2. Écoute des insertions de coups dans room_actions
    channel.on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'room_actions',
            filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
            const newAction = payload.new as RoomActionRecord;
            if (newAction) {
                callbacks.onActionReceived(newAction);
            }
        },
    );

    // 3. Suivi de présence (en ligne / déconnecté)
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
            supabase.removeChannel(channel).catch(() => { });
        },
    };
}

export interface ConcludeGameRoomParams {
    roomId: string;
    winner: 'X' | 'O';
    playerXPR: number;
    playerOPR: number;
}

export interface ConcludedRoomResult {
    room: GameRoomRecord;
    glicko2Result: HeadToHeadCompositeResult;
    deltaRatingX: number;
    deltaRatingO: number;
}

/**
 * Clôture un match multijoueur : calcule la mise à jour Glicko-2 Composite
 * (pondérée par la longueur w(L) = L/(L+4) et l'écart de PR Open Sage),
 * marque le salon comme terminé et persiste les nouveaux classements.
 */
export async function concludeGameRoom(
    params: ConcludeGameRoomParams,
): Promise<ConcludedRoomResult> {
    const room = await getGameRoom(params.roomId);
    if (!room) {
        throw new Error(`Salle "${params.roomId}" introuvable.`);
    }

    const glicko2Result = calculateMultiplayerGlicko2Rating({
        playerXRating: room.player_x_rating,
        playerORating: room.player_o_rating,
        winner: params.winner,
        playerXPR: params.playerXPR,
        playerOPR: params.playerOPR,
        matchLength: room.match_length || 7,
    });

    const newRatingX = Math.round(glicko2Result.playerX.rating);
    const newRatingO = Math.round(glicko2Result.playerO.rating);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured()) {
        const updatedRoom: GameRoomRecord = {
            ...room,
            status: 'completed',
            winner: params.winner,
            player_x_rating: newRatingX,
            player_o_rating: newRatingO,
            updated_at: now,
        };
        mockRoomsRegistry.set(room.id, updatedRoom);
        if (room.code) {
            mockRoomsRegistry.set(room.code, updatedRoom);
        }

        return {
            room: updatedRoom,
            glicko2Result,
            deltaRatingX: glicko2Result.playerX.ratingDelta,
            deltaRatingO: glicko2Result.playerO.ratingDelta,
        };
    }

    // Persistance dans Supabase
    const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({
            status: 'completed',
            winner: params.winner,
            player_x_rating: newRatingX,
            player_o_rating: newRatingO,
            updated_at: now,
        })
        .eq('id', params.roomId)
        .select('*')
        .single();

    if (updateError || !updatedRoom) {
        throw new Error(`Impossible de clôturer la salle : ${updateError?.message}`);
    }

    // Mise à jour des profils si les joueurs sont authentifiés
    if (room.player_x_id) {
        await supabase
            .from('profiles')
            .update({ rating: newRatingX, updated_at: now })
            .eq('id', room.player_x_id);
    }
    if (room.player_o_id) {
        await supabase
            .from('profiles')
            .update({ rating: newRatingO, updated_at: now })
            .eq('id', room.player_o_id);
    }

    return {
        room: updatedRoom as GameRoomRecord,
        glicko2Result,
        deltaRatingX: glicko2Result.playerX.ratingDelta,
        deltaRatingO: glicko2Result.playerO.ratingDelta,
    };
}
