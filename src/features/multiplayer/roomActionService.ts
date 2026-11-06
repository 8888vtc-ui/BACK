/**
 * @file src/features/multiplayer/roomActionService.ts
 * @description Service d'enregistrement des actions de jeu en base Supabase room_actions (< 150 lignes, 0 any).
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { GameRoomRecord, RoomActionRecord } from '../../lib/supabase/types';

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

const mockActionsRegistry = new Map<string, RoomActionRecord[]>();

/**
 * Enregistre une action de jeu dans room_actions (avec fallback mock).
 */
export async function pushRoomAction(
    params: PushActionParams,
    onMockRoomUpdate?: (roomId: string, boardAfter: number[], nextSeq: number) => void,
): Promise<RoomActionRecord> {
    const {
        roomId, player, actionType, boardAfter, dice = null,
        moveFrom = null, moveTo = null, moveNotation = null,
        cubeValue = null, timeSpentMs = 0,
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

        if (onMockRoomUpdate) {
            onMockRoomUpdate(roomId, boardAfter, nextSeq);
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
 * Récupère l'historique des actions d'une salle par ordre chronologique.
 */
export async function fetchRoomActions(roomId: string): Promise<RoomActionRecord[]> {
    if (!isSupabaseConfigured()) {
        return mockActionsRegistry.get(roomId) || [];
    }

    const { data, error } = await supabase
        .from('room_actions')
        .select('*')
        .eq('room_id', roomId)
        .order('sequence_number', { ascending: true });

    if (error) {
        throw new Error(`Impossible de récupérer les actions de la salle : ${error.message}`);
    }

    return (data || []) as RoomActionRecord[];
}

