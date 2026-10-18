/**
 * Service de Persistance Offline-First pour Backgammon.
 *
 * Architecture :
 * 1. Écrit immédiatement dans IndexedDB (accès local 0ms et résistant aux pannes).
 * 2. Enfile la mutation dans la Sync Queue.
 * 3. Tente la synchronisation vers Supabase si en ligne.
 * 4. Déclenche automatiquement le vidage de la file à la reconnexion (événement 'online').
 */

import { putRecord, getRecord, getAllRecords } from './idb';
import {
    enqueueSync,
    processSyncQueue,
    subscribeSyncStatus,
    SyncStatus,
} from './syncQueue';
import { getCurrentUser } from '../supabase/auth';
import * as supabaseModule from '../supabase/client';

export interface LocalGameRecord {
    id: string;
    user_id?: string;
    opponent_type: 'ai' | 'human';
    opponent_difficulty?: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | null;
    match_length: number;
    score_x: number;
    score_o: number;
    winner?: 'X' | 'O' | null;
    win_type?: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    points_won?: number;
    cube_value: number;
    cube_owner?: 'X' | 'O' | null;
    is_crawford: boolean;
    status: 'in_progress' | 'completed' | 'abandoned';
    started_at: string;
    ended_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface LocalMoveRecord {
    id: string;
    game_id: string;
    user_id?: string;
    move_number: number;
    player: 'X' | 'O';
    dice: number[];
    move_notation: string;
    board_before: number[];
    board_after: number[];
    equity_loss?: number | null;
    verdict?: string | null;
    optimal_move?: string | null;
    played_at: string;
}

export interface LocalCoachExplanationRecord {
    id: string;
    user_id?: string;
    game_id?: string | null;
    move_id?: string | null;
    position_key: string;
    played_move: string;
    optimal_move: string;
    verdict: string;
    equity_loss: number;
    summary: string;
    explanation: string;
    key_concept?: string | null;
    advice?: string | null;
    source: 'llm' | 'rule-based' | 'cache';
    created_at: string;
}

let isInitialized = false;

/**
 * Initialise l'écouteur automatique de reconnexion réseau.
 */
export function initOfflineSync(): void {
    if (isInitialized || typeof window === 'undefined') return;
    isInitialized = true;

    // Si Supabase n'est pas configuré -> mode local-only, aucun écouteur réseau nécessaire
    if (!supabaseModule.isSupabaseConfigured()) {
        return;
    }

    window.addEventListener('online', () => {
        console.log('[OfflineSync] Connexion réseau rétablie, vidage de la file de synchronisation...');
        processSyncQueue();
    });

    // Synchronisation initiale au démarrage si en ligne
    if (window.navigator.onLine) {
        processSyncQueue();
    }
}

/**
 * Persiste une nouvelle partie (Offline-first).
 */
export async function persistNewGame(game: LocalGameRecord): Promise<void> {
    const user = await getCurrentUser().catch(() => null);
    const enriched: LocalGameRecord = {
        ...game,
        user_id: game.user_id || user?.id || 'anonymous_player',
    };

    // 1. Stockage local immédiat dans IndexedDB
    await putRecord('games', enriched);

    // 2. Enfilement Supabase uniquement si configuré
    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('games', 'insert', enriched);

        // 3. Déclenchement de synchronisation si en ligne
        if (typeof window !== 'undefined' && window.navigator.onLine) {
            processSyncQueue();
        }
    }
}

/**
 * Met à jour une partie existante (Offline-first).
 */
export async function persistGameUpdate(
    gameId: string,
    updates: Partial<LocalGameRecord>,
): Promise<void> {
    const existing = await getRecord<LocalGameRecord>('games', gameId);
    const updated: LocalGameRecord = {
        ...(existing || ({} as LocalGameRecord)),
        ...updates,
        id: gameId,
        updated_at: new Date().toISOString(),
    };

    // 1. Mise à jour locale immédiate
    await putRecord('games', updated);

    // 2. Enfilement dans la file Supabase si configuré
    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('games', 'update', updated);

        // 3. Synchronisation
        if (typeof window !== 'undefined' && window.navigator.onLine) {
            processSyncQueue();
        }
    }
}

/**
 * Enregistre un coup joué (Offline-first).
 */
export async function persistMove(move: LocalMoveRecord): Promise<void> {
    const user = await getCurrentUser().catch(() => null);
    const enriched: LocalMoveRecord = {
        ...move,
        user_id: move.user_id || user?.id || 'anonymous_player',
    };

    await putRecord('moves', enriched);

    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('moves', 'insert', enriched);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            processSyncQueue();
        }
    }
}

/**
 * Enregistre une explication générée par le Coach IA (Offline-first).
 */
export async function persistCoachExplanation(
    explanation: LocalCoachExplanationRecord,
): Promise<void> {
    const user = await getCurrentUser().catch(() => null);
    const enriched: LocalCoachExplanationRecord = {
        ...explanation,
        user_id: explanation.user_id || user?.id || 'anonymous_player',
    };

    await putRecord('coach_explanations', enriched);

    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('coach_explanations', 'insert', enriched);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            processSyncQueue();
        }
    }
}

export { subscribeSyncStatus, processSyncQueue };
export type { SyncStatus };
