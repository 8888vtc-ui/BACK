/**
 * Service de Persistance Offline-First pour Backgammon.
 *
 * Architecture résiliente :
 * 1. Écrit immédiatement dans IndexedDB (accès local 0ms et résistant aux crashs).
 * 2. Supporte les écritures par lot sécurisées (writeBatch).
 * 3. Enfile les mutations dans la Sync Queue avec déduplication et horodatage.
 * 4. Tente la synchronisation vers Supabase si en ligne avec replay à la reconnexion.
 */

import { putRecord, getRecord, writeBatch, getAllRecords } from './idb';
import {
    enqueueSync,
    processSyncQueue,
    flushSyncQueue,
    subscribeSyncStatus,
    SyncStatus,
} from './syncQueue';
import { getCurrentUser } from '../supabase/auth';
import * as supabaseModule from '../supabase/client';

export interface LocalGameRecord {
    id: string;
    user_id?: string;
    opponent_type: 'ai' | 'human';
    opponent_difficulty?: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | 'legend' | null;
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

export interface LocalGameAnalysisRecord {
    id: string;
    game_id: string;
    user_id?: string;
    error_rate: number;
    bmab_rating: string;
    performance_rating: number;
    cube_performance_rating?: number;
    created_at: string;
    raw_data: Record<string, unknown>;
}

export interface LocalRecurrentMistakeRecord {
    id: string;
    game_id?: string;
    category: string;
    position_xgid: string;
    played_move: string;
    optimal_move: string;
    equity_loss: number;
    created_at: string;
}

let isInitialized = false;

/**
 * Initialise l'écouteur automatique de reconnexion réseau.
 */
export function initOfflineSync(): void {
    if (isInitialized || typeof window === 'undefined') return;
    isInitialized = true;

    if (!supabaseModule.isSupabaseConfigured()) {
        return;
    }

    window.addEventListener('online', () => {
        console.log('[OfflineSync] Connexion rétablie, vidage de la file de synchronisation...');
        flushSyncQueue();
    });

    if (window.navigator.onLine) {
        flushSyncQueue();
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

    await putRecord('games', enriched);

    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('games', 'insert', enriched as unknown as Record<string, unknown>);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            flushSyncQueue();
        }
    }
}

/**
 * Met à jour une partie existante sans écraser les propriétés existantes (videau, scores).
 */
export async function persistGameUpdate(
    gameId: string,
    updates: Partial<LocalGameRecord>,
): Promise<void> {
    const existing = await getRecord<LocalGameRecord>('games', gameId);
    const nowIso = new Date().toISOString();
    const updated: LocalGameRecord = {
        opponent_type: existing?.opponent_type ?? 'ai',
        match_length: existing?.match_length ?? 7,
        score_x: existing?.score_x ?? 0,
        score_o: existing?.score_o ?? 0,
        cube_value: existing?.cube_value ?? 1,
        cube_owner: existing?.cube_owner ?? null,
        is_crawford: existing?.is_crawford ?? false,
        status: existing?.status ?? 'in_progress',
        started_at: existing?.started_at ?? nowIso,
        created_at: existing?.created_at ?? nowIso,
        ...existing,
        ...updates,
        id: gameId,
        updated_at: updates.updated_at || nowIso,
    };

    await putRecord('games', updated);

    if (supabaseModule.isSupabaseConfigured()) {
        await enqueueSync('games', 'update', updated as unknown as Record<string, unknown>);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            flushSyncQueue();
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
        await enqueueSync('moves', 'insert', enriched as unknown as Record<string, unknown>);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            flushSyncQueue();
        }
    }
}

/**
 * Enregistre un lot de coups en une seule transaction atomique (writeBatch).
 */
export async function persistMovesBatch(moves: LocalMoveRecord[]): Promise<void> {
    if (moves.length === 0) return;
    const user = await getCurrentUser().catch(() => null);
    const enrichedList = moves.map((m) => ({
        ...m,
        user_id: m.user_id || user?.id || 'anonymous_player',
    }));

    await writeBatch('moves', enrichedList);

    if (supabaseModule.isSupabaseConfigured()) {
        for (const move of enrichedList) {
            await enqueueSync('moves', 'insert', move as unknown as Record<string, unknown>);
        }
        if (typeof window !== 'undefined' && window.navigator.onLine) {
            flushSyncQueue();
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
        await enqueueSync('coach_explanations', 'insert', enriched as unknown as Record<string, unknown>);

        if (typeof window !== 'undefined' && window.navigator.onLine) {
            flushSyncQueue();
        }
    }
}

/**
 * Sauvegarde une analyse de partie dans le store IDB v2 'game_analyses'.
 */
export async function persistLocalGameAnalysis(
    analysisRecord: LocalGameAnalysisRecord,
): Promise<void> {
    await putRecord('game_analyses', analysisRecord);
}

/**
 * Sauvegarde une erreur récurrente dans le store IDB v2 'recurrent_mistakes'.
 */
export async function persistRecurrentMistake(
    mistakeRecord: LocalRecurrentMistakeRecord,
): Promise<void> {
    await putRecord('recurrent_mistakes', mistakeRecord);
}

/**
 * Recherche une explication Coach dans le cache IndexedDB local par `position_key`.
 */
export async function getLocalCoachExplanationByKey(
    positionKey: string,
): Promise<LocalCoachExplanationRecord | null> {
    if (!positionKey) return null;
    const all = await getAllRecords<LocalCoachExplanationRecord>('coach_explanations');
    const matches = all.filter((r) => r.position_key === positionKey && Boolean(r.explanation));
    if (matches.length === 0) return null;
    matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return matches.find((m) => m.source === 'llm') ?? matches[0] ?? null;
}

/**
 * Charge toutes les erreurs récurrentes stockées localement dans IndexedDB ('recurrent_mistakes').
 */
export async function loadLocalRecurrentMistakes(): Promise<LocalRecurrentMistakeRecord[]> {
    return getAllRecords<LocalRecurrentMistakeRecord>('recurrent_mistakes');
}

/**
 * Charge les parties récentes sauvegardées localement dans IndexedDB.
 */
export async function loadRecentGames(limit = 10): Promise<LocalGameRecord[]> {
    const all = await getAllRecords<LocalGameRecord>('games');
    return all
        .sort((a, b) => new Date(b.created_at || b.started_at).getTime() - new Date(a.created_at || a.started_at).getTime())
        .slice(0, limit);
}

export { subscribeSyncStatus, processSyncQueue, flushSyncQueue };
export type { SyncStatus };
