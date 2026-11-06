/**
 * Service de Clôture de Match Multijoueur & Calcul Glicko-2 Composite.
 * Découpé depuis roomService.ts pour respecter la règle .ts <= 400 lignes.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import type { GameRoomRecord } from '../../lib/supabase/types';
import { calculateMultiplayerGlicko2Rating } from './galaxyRating';
import type { HeadToHeadCompositeResult } from '../../lib/rating/glicko2Composite';

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
export async function concludeGameRoomInternal(
    params: ConcludeGameRoomParams,
    getRoomFn: (roomId: string) => Promise<GameRoomRecord | null>,
    updateMockRoomFn: (roomId: string, updated: GameRoomRecord) => void,
): Promise<ConcludedRoomResult> {
    const room = await getRoomFn(params.roomId);
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
        updateMockRoomFn(room.id, updatedRoom);

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
