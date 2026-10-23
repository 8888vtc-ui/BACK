/**
 * File de synchronisation locale (Sync Queue) pour Supabase.
 *
 * Enregistre les mutations offline dans IndexedDB et les dépile
 * de façon ordonnée dès que la connexion internet est rétablie.
 *
 * Résilience avancée :
 * 1. Détection 'Supabase non configuré' -> mode local-only (ne pas enqueue).
 * 2. Bornage strict de la file à 200 éléments max avec toast d'alerte.
 * 3. Déduplication des mutations identiques (insert/update) et fusion intelligente.
 * 4. Dépilement avec backoff exponentiel et gigue aléatoire (jitter anti-thundering herd).
 * 5. Détection fine des conflits horodatés et purge garantie des mutations réussies.
 */

import {
    putRecord,
    getAllRecords,
    deleteRecord,
    clearStore,
} from './idb';
import * as supabaseModule from '../supabase/client';
import type { Database } from '../supabase/types';
import { toast } from '../../components/toast/ToastContext';
import { addMonitoringBreadcrumb } from '../monitoring/sentry';

type GameInsert = Database['public']['Tables']['games']['Insert'];
type GameUpdate = Database['public']['Tables']['games']['Update'];
type MoveInsert = Database['public']['Tables']['moves']['Insert'];
type CoachExplanationInsert = Database['public']['Tables']['coach_explanations']['Insert'];

export type SyncTable = 'games' | 'moves' | 'coach_explanations';
export type SyncAction = 'insert' | 'update';

export interface SyncQueueItem {
    id: string;
    table: SyncTable;
    action: SyncAction;
    payload: Record<string, unknown>;
    createdAt: number;
    attempts: number;
    lastError?: string;
    nextRetryAt?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'local-only';

export const MAX_SYNC_QUEUE_SIZE = 200;

type SyncListener = (status: SyncStatus, pendingCount: number) => void;
const listeners = new Set<SyncListener>();
let currentStatus: SyncStatus = 'idle';
let isProcessingQueue = false;

function notifyListeners(pendingCount: number) {
    listeners.forEach((fn) => fn(currentStatus, pendingCount));
}

export function subscribeSyncStatus(listener: SyncListener): () => void {
    listeners.add(listener);
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
        listener('local-only', 0);
    } else {
        getPendingSyncCount().then((count) => listener(currentStatus, count));
    }
    return () => {
        listeners.delete(listener);
    };
}

function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Compare deux horodatages ISO/epoch pour détecter un conflit d'écrasement obsolète.
 * Retourne true si incomingPayload est plus récent ou égal à existingPayload.
 */
export function isPayloadNewerOrEqual(
    existingPayload: Record<string, unknown>,
    incomingPayload: Record<string, unknown>,
): boolean {
    const existingTs = existingPayload.updated_at ?? existingPayload.played_at ?? existingPayload.created_at;
    const incomingTs = incomingPayload.updated_at ?? incomingPayload.played_at ?? incomingPayload.created_at;
    if (typeof existingTs !== 'string' || typeof incomingTs !== 'string') return true;
    const tExisting = Date.parse(existingTs);
    const tIncoming = Date.parse(incomingTs);
    if (Number.isNaN(tExisting) || Number.isNaN(tIncoming)) return true;
    return tIncoming >= tExisting;
}

/**
 * Ajoute une mutation à la file avec déduplication des mutations identiques et résolution de conflit horodaté.
 */
export async function enqueueSync(
    table: SyncTable,
    action: SyncAction,
    payload: Record<string, unknown>,
): Promise<string | null> {
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
        notifyListeners(0);
        return null;
    }

    const items = await getAllRecords<SyncQueueItem>('sync_queue');

    // Déduplication par table + payload.id (fusion insert+update ou update+update ou insert dupliqué)
    if (payload.id) {
        const existing = items.find((i) => i.table === table && i.payload.id === payload.id);
        if (existing) {
            if (isPayloadNewerOrEqual(existing.payload, payload)) {
                existing.payload = { ...existing.payload, ...payload };
                existing.createdAt = Date.now();
            }
            existing.attempts = 0;
            existing.nextRetryAt = undefined;
            await putRecord('sync_queue', existing);
            return existing.id;
        }
    }

    if (items.length >= MAX_SYNC_QUEUE_SIZE) {
        toast.error(
            'File de synchronisation saturée (200 max)',
            'La file de synchronisation locale a atteint son plafond de 200 mutations. Vérifiez votre connexion internet ou cliquez sur Réessayer pour purger les éléments en attente.',
        );
        return null;
    }

    const item: SyncQueueItem = {
        id: generateUUID(),
        table,
        action,
        payload,
        createdAt: Date.now(),
        attempts: 0,
    };

    await putRecord<SyncQueueItem>('sync_queue', item);
    const updatedCount = await getPendingSyncCount();
    notifyListeners(updatedCount);
    return item.id;
}

export async function getPendingSyncCount(): Promise<number> {
    if (!supabaseModule.isSupabaseConfigured()) {
        return 0;
    }
    const items = await getAllRecords<SyncQueueItem>('sync_queue');
    return items.length;
}

/**
 * Calcule le délai de réessai avec backoff exponentiel et gigue aléatoire (jitter).
 */
export function calculateRetryDelay(attempts: number): number {
    const baseDelay = Math.min(60000, 1000 * Math.pow(2, Math.max(0, attempts - 1)));
    const jitter = Math.floor(Math.random() * Math.min(1000, baseDelay * 0.25));
    return baseDelay + jitter;
}

function isDuplicateKeyConflict(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const code = (err as { code?: unknown }).code;
    const message = String((err as { message?: unknown }).message || '').toLowerCase();
    return code === '23505' || message.includes('duplicate key') || message.includes('already exists');
}

/**
 * Dépile et traite la file de synchronisation vers Supabase avec backoff et gigue.
 */
export async function processSyncQueue(force: boolean = false): Promise<{
    synced: number;
    failed: number;
    remaining: number;
}> {
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
        notifyListeners(0);
        return { synced: 0, failed: 0, remaining: 0 };
    }

    if (isProcessingQueue) {
        const count = await getPendingSyncCount();
        return { synced: 0, failed: 0, remaining: count };
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) {
        currentStatus = 'offline';
        const count = await getPendingSyncCount();
        notifyListeners(count);
        return { synced: 0, failed: 0, remaining: count };
    }

    isProcessingQueue = true;

    try {
        const items = await getAllRecords<SyncQueueItem>('sync_queue');
        if (items.length === 0) {
            currentStatus = 'idle';
            notifyListeners(0);
            return { synced: 0, failed: 0, remaining: 0 };
        }

        items.sort((a, b) => a.createdAt - b.createdAt);
        currentStatus = 'syncing';
        notifyListeners(items.length);

        addMonitoringBreadcrumb({
            category: 'sync_queue_flush_start',
            message: `Démarrage flush Sync Queue: ${items.length} mutation(s) en attente`,
            level: 'info',
            data: { total: items.length, force },
        });

        let syncedCount = 0;
        let failedCount = 0;
        const now = Date.now();

        for (const item of items) {
            if (!force && item.nextRetryAt && now < item.nextRetryAt) {
                failedCount++;
                continue;
            }

            try {
                if (item.table === 'games') {
                    if (item.action === 'insert') {
                        const { error } = await supabaseModule.supabase.from('games').upsert(item.payload as unknown as GameInsert);
                        if (error) throw error;
                    } else if (item.action === 'update') {
                        const { id, ...updates } = item.payload;
                        const { error } = await supabaseModule.supabase.from('games').update(updates as unknown as GameUpdate).eq('id', String(id));
                        if (error) throw error;
                    }
                } else if (item.table === 'moves') {
                    const { error } = await supabaseModule.supabase.from('moves').upsert(item.payload as unknown as MoveInsert);
                    if (error) throw error;
                } else if (item.table === 'coach_explanations') {
                    const { error } = await supabaseModule.supabase.from('coach_explanations').upsert(item.payload as unknown as CoachExplanationInsert);
                    if (error) throw error;
                }

                await deleteRecord('sync_queue', item.id);
                syncedCount++;
            } catch (err: unknown) {
                if (isDuplicateKeyConflict(err)) {
                    await deleteRecord('sync_queue', item.id);
                    syncedCount++;
                    continue;
                }
                const errMsg = err instanceof Error ? err.message : String(err);
                console.warn(`[SyncQueue] Échec de synchronisation de l'élément ${item.id} (${item.table}):`, errMsg);
                item.attempts = (item.attempts || 0) + 1;
                item.lastError = errMsg;

                addMonitoringBreadcrumb({
                    category: 'sync_queue_item_error',
                    message: `Échec synchro ${item.id} (${item.table}): ${errMsg}`,
                    level: 'warning',
                    data: { itemId: item.id, table: item.table, attempts: item.attempts },
                });

                item.nextRetryAt = Date.now() + calculateRetryDelay(item.attempts);
                await putRecord('sync_queue', item);
                failedCount++;
            }
        }

        const remaining = await getPendingSyncCount();
        currentStatus = failedCount > 0 ? 'error' : 'idle';
        notifyListeners(remaining);

        addMonitoringBreadcrumb({
            category: 'sync_queue_flush_finish',
            message: `Fin flush Sync Queue: ${syncedCount} synchronisé(s), ${failedCount} échec(s), ${remaining} restant(s)`,
            level: failedCount > 0 ? 'warning' : 'info',
            data: { syncedCount, failedCount, remaining },
        });

        return { synced: syncedCount, failed: failedCount, remaining };
    } finally {
        isProcessingQueue = false;
    }
}

export const flushSyncQueue = processSyncQueue;

export async function clearSyncQueue(): Promise<void> {
    await clearStore('sync_queue');
    currentStatus = supabaseModule.isSupabaseConfigured() ? 'idle' : 'local-only';
    notifyListeners(0);
}
