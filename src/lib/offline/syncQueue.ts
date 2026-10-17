/**
 * File de synchronisation locale (Sync Queue) pour Supabase.
 *
 * Enregistre les mutations offline dans IndexedDB et les dépile
 * de façon ordonnée dès que la connexion internet est rétablie.
 *
 * Comportement :
 * 1. Détection 'Supabase non configuré' -> mode local-only (ne pas enqueue).
 * 2. Bornage strict de la file à 200 éléments max avec toast d'erreur explicite.
 * 3. Dépilement avec backoff exponentiel (1s, 2s, 4s... max 60s).
 * 4. Purge immédiate et garantie des mutations réussies.
 */

import {
    putRecord,
    getAllRecords,
    deleteRecord,
    clearStore,
} from './idb';
import * as supabaseModule from '../supabase/client';
import { toast } from '../../components/toast/ToastContext';
import { addMonitoringBreadcrumb } from '../monitoring/sentry';

export type SyncTable = 'games' | 'moves' | 'coach_explanations';
export type SyncAction = 'insert' | 'update';

export interface SyncQueueItem {
    id: string;
    table: SyncTable;
    action: SyncAction;
    payload: any;
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

/**
 * Génère un identifiant unique universel pour les mutations de synchronisation.
 */
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Ajoute une mutation à la file d'attente de synchronisation si Supabase est configuré.
 * Si Supabase n'est pas configuré, bascule en mode local-only (n'enfile rien).
 * Si la file a atteint sa limite maximale (200), refuse l'ajout et déclenche un toast d'erreur.
 */
export async function enqueueSync(
    table: SyncTable,
    action: SyncAction,
    payload: any,
): Promise<string | null> {
    // 1. Détection 'Supabase non configuré' -> mode local-only (ne pas enqueue)
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
        notifyListeners(0);
        return null;
    }

    // 2. Bornage strict de la file (max 200) avec toast explicite au lieu d'un compteur qui grossit
    const count = await getPendingSyncCount();
    if (count >= MAX_SYNC_QUEUE_SIZE) {
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

/**
 * Retourne le nombre d'éléments en attente de synchronisation.
 * Si Supabase n'est pas configuré, retourne toujours 0.
 */
export async function getPendingSyncCount(): Promise<number> {
    if (!supabaseModule.isSupabaseConfigured()) {
        return 0;
    }
    const items = await getAllRecords<SyncQueueItem>('sync_queue');
    return items.length;
}

/**
 * Dépile et traite la file de synchronisation vers Supabase avec backoff exponentiel.
 * @param force Si true (ex: clic sur 'Réessayer'), ignore le délai de backoff exponentiel.
 */
export async function processSyncQueue(force: boolean = false): Promise<{
    synced: number;
    failed: number;
    remaining: number;
}> {
    // 1. Si Supabase n'est pas configuré -> Mode local-only direct
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
        notifyListeners(0);
        return { synced: 0, failed: 0, remaining: 0 };
    }

    // 2. Verrou de concurrence pour éviter les traitements parallèles simultanés
    if (isProcessingQueue) {
        const count = await getPendingSyncCount();
        return { synced: 0, failed: 0, remaining: count };
    }

    // 3. Détection hors-ligne navigateur
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
            // Backoff exponentiel : si un délai de réessai futur existe et qu'on ne force pas, reporter
            if (!force && item.nextRetryAt && now < item.nextRetryAt) {
                failedCount++;
                continue;
            }

            try {
                // Synchronisation avec Supabase
                if (item.table === 'games') {
                    if (item.action === 'insert') {
                        const { error } = await supabaseModule.supabase.from('games').upsert(item.payload);
                        if (error) throw error;
                    } else if (item.action === 'update') {
                        const { id, ...updates } = item.payload;
                        const { error } = await supabaseModule.supabase.from('games').update(updates).eq('id', id);
                        if (error) throw error;
                    }
                } else if (item.table === 'moves') {
                    const { error } = await supabaseModule.supabase.from('moves').upsert(item.payload);
                    if (error) throw error;
                } else if (item.table === 'coach_explanations') {
                    const { error } = await supabaseModule.supabase.from('coach_explanations').upsert(item.payload);
                    if (error) throw error;
                }

                // Purge du succès : retrait garanti de la file
                await deleteRecord('sync_queue', item.id);
                syncedCount++;
            } catch (err: any) {
                console.warn(`[SyncQueue] Échec de synchronisation de l'élément ${item.id} (${item.table}):`, err.message || err);
                item.attempts = (item.attempts || 0) + 1;
                item.lastError = err.message || 'Erreur réseau';

                addMonitoringBreadcrumb({
                    category: 'sync_queue_item_error',
                    message: `Échec synchro ${item.id} (${item.table}): ${err.message || 'Erreur réseau'}`,
                    level: 'warning',
                    data: { itemId: item.id, table: item.table, attempts: item.attempts },
                });

                // Backoff exponentiel : 1s, 2s, 4s, 8s, 16s, 32s, max 60s
                const delayMs = Math.min(60000, 1000 * Math.pow(2, item.attempts - 1));
                item.nextRetryAt = Date.now() + delayMs;

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

/**
 * Vide complètement la file de synchronisation.
 */
export async function clearSyncQueue(): Promise<void> {
    await clearStore('sync_queue');
    if (!supabaseModule.isSupabaseConfigured()) {
        currentStatus = 'local-only';
    } else {
        currentStatus = 'idle';
    }
    notifyListeners(0);
}
