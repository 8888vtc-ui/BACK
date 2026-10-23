import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    enqueueSync,
    getPendingSyncCount,
    processSyncQueue,
    flushSyncQueue,
    clearSyncQueue,
    subscribeSyncStatus,
    calculateRetryDelay,
    isPayloadNewerOrEqual,
    MAX_SYNC_QUEUE_SIZE,
    type SyncQueueItem,
} from './syncQueue';
import * as supabaseModule from '../supabase/client';
import { toast } from '../../components/toast/ToastContext';
import { getAllRecords } from './idb';

describe('SyncQueue Module', () => {
    beforeEach(async () => {
        await clearSyncQueue();
        vi.restoreAllMocks();
    });

    describe('Mode local-only (Supabase non configuré)', () => {
        beforeEach(() => {
            vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
        });

        it('ne met rien en file si Supabase n’est pas configuré et retourne null', async () => {
            const result = await enqueueSync('games', 'insert', { id: 'g-local-1' });

            expect(result).toBeNull();
            expect(await getPendingSyncCount()).toBe(0);
        });

        it('notifie le statut local-only et ne tente aucun appel réseau', async () => {
            let capturedStatus = '';
            let capturedCount = -1;

            const unsub = subscribeSyncStatus((status, count) => {
                capturedStatus = status;
                capturedCount = count;
            });

            expect(capturedStatus).toBe('local-only');
            expect(capturedCount).toBe(0);

            const result = await flushSyncQueue();
            expect(result.synced).toBe(0);
            expect(result.failed).toBe(0);
            expect(result.remaining).toBe(0);

            unsub();
        });
    });

    describe('Mode synchronisation (Supabase configuré)', () => {
        beforeEach(() => {
            vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(true);
        });

        it('calcule un délai de backoff exponentiel avec gigue aléatoire', () => {
            const delay1 = calculateRetryDelay(1);
            expect(delay1).toBeGreaterThanOrEqual(1000);
            expect(delay1).toBeLessThanOrEqual(1300);

            const delay2 = calculateRetryDelay(2);
            expect(delay2).toBeGreaterThanOrEqual(2000);
            expect(delay2).toBeLessThanOrEqual(2600);

            const delayMax = calculateRetryDelay(10);
            expect(delayMax).toBeGreaterThanOrEqual(60000);
        });

        it('détecte les conflits horodatés via isPayloadNewerOrEqual et empêche un écrasement obsolète', async () => {
            expect(
                isPayloadNewerOrEqual(
                    { updated_at: '2026-10-23T10:00:00.000Z' },
                    { updated_at: '2026-10-23T10:05:00.000Z' },
                ),
            ).toBe(true);
            expect(
                isPayloadNewerOrEqual(
                    { updated_at: '2026-10-23T10:05:00.000Z' },
                    { updated_at: '2026-10-23T10:00:00.000Z' },
                ),
            ).toBe(false);

            await enqueueSync('games', 'update', {
                id: 'g-ts-1',
                score_x: 5,
                updated_at: '2026-10-23T12:00:00.000Z',
            });
            // Mutation obsolète reçue dans le désordre : ne doit pas écraser score_x = 5
            await enqueueSync('games', 'update', {
                id: 'g-ts-1',
                score_x: 1,
                updated_at: '2026-10-23T11:00:00.000Z',
            });

            const records = await getAllRecords<SyncQueueItem>('sync_queue');
            expect(records).toHaveLength(1);
            expect(records[0].payload.score_x).toBe(5);
        });

        it('déduplique et fusionne les requêtes identiques (insert/update) sur la même entité', async () => {
            const id1 = await enqueueSync('games', 'update', { id: 'g-dedup-1', score_x: 1 });
            expect(id1).toBeTruthy();
            expect(await getPendingSyncCount()).toBe(1);

            const id2 = await enqueueSync('games', 'update', { id: 'g-dedup-1', score_o: 2 });
            expect(id2).toBe(id1);
            expect(await getPendingSyncCount()).toBe(1);

            const records = await getAllRecords<SyncQueueItem>('sync_queue');
            expect(records.length).toBe(1);
            expect(records[0].payload.score_x).toBe(1);
            expect(records[0].payload.score_o).toBe(2);
        });

        it('enfile une mutation et incrémente le compte des éléments en attente', async () => {
            expect(await getPendingSyncCount()).toBe(0);

            const id1 = await enqueueSync('games', 'insert', { id: 'g-1', match_length: 7 });
            expect(id1).toBeTruthy();
            expect(await getPendingSyncCount()).toBe(1);

            const id2 = await enqueueSync('moves', 'insert', { id: 'm-1', move_number: 1 });
            expect(id2).toBeTruthy();
            expect(await getPendingSyncCount()).toBe(2);
        });

        it('traite et purge les succès ainsi que les conflits de clé dupliquée (23505) de la file vers Supabase', async () => {
            const upsertSpy = vi
                .fn()
                .mockResolvedValueOnce({ error: null })
                .mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
            vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({
                upsert: upsertSpy,
                update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            } as unknown as ReturnType<typeof supabaseModule.supabase.from>);

            await enqueueSync('games', 'insert', { id: 'g-sync-1', score_x: 2 });
            await enqueueSync('moves', 'insert', { id: 'm-sync-1', notation: '13/9' });

            const result = await processSyncQueue();

            expect(result.synced).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.remaining).toBe(0);
            expect(await getPendingSyncCount()).toBe(0);
        });

        it('gère les erreurs avec backoff exponentiel et permet le forçage avec le bouton Réessayer', async () => {
            const errorUpsert = vi.fn().mockResolvedValue({ error: new Error('Connexion perdue') });
            vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({
                upsert: errorUpsert,
            } as unknown as ReturnType<typeof supabaseModule.supabase.from>);

            await enqueueSync('games', 'insert', { id: 'g-fail-1' });

            const result1 = await processSyncQueue();
            expect(result1.synced).toBe(0);
            expect(result1.failed).toBe(1);
            expect(result1.remaining).toBe(1);

            const itemsAfterFail = await getAllRecords<SyncQueueItem>('sync_queue');
            expect(itemsAfterFail[0].attempts).toBe(1);
            expect(itemsAfterFail[0].nextRetryAt).toBeGreaterThan(Date.now() - 100);

            const result2 = await processSyncQueue(false);
            expect(result2.failed).toBe(1);
            expect(errorUpsert).toHaveBeenCalledTimes(1);

            const resultForced = await processSyncQueue(true);
            expect(resultForced.failed).toBe(1);
            expect(errorUpsert).toHaveBeenCalledTimes(2);
        });

        it('borne la file à max 200 éléments et émet un toast d’erreur explicite', async () => {
            const toastSpy = vi.spyOn(toast, 'error');

            for (let i = 0; i < MAX_SYNC_QUEUE_SIZE; i++) {
                await enqueueSync('moves', 'insert', { id: `m-${i}` });
            }

            expect(await getPendingSyncCount()).toBe(200);

            const overflowResult = await enqueueSync('moves', 'insert', { id: 'm-overflow' });

            expect(overflowResult).toBeNull();
            expect(await getPendingSyncCount()).toBe(200);
            expect(toastSpy).toHaveBeenCalledWith(
                'File de synchronisation saturée (200 max)',
                expect.stringContaining('200 mutations'),
            );
        });
    });
});
