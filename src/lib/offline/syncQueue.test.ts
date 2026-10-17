import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    enqueueSync,
    getPendingSyncCount,
    processSyncQueue,
    clearSyncQueue,
    subscribeSyncStatus,
    MAX_SYNC_QUEUE_SIZE,
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

            const result = await processSyncQueue();
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

        it('enfile une mutation et incrémente le compte des éléments en attente', async () => {
            expect(await getPendingSyncCount()).toBe(0);

            const id1 = await enqueueSync('games', 'insert', { id: 'g-1', match_length: 7 });
            expect(id1).toBeTruthy();
            expect(await getPendingSyncCount()).toBe(1);

            const id2 = await enqueueSync('moves', 'insert', { id: 'm-1', move_number: 1 });
            expect(id2).toBeTruthy();
            expect(await getPendingSyncCount()).toBe(2);
        });

        it('traite et purge les succès de la file vers Supabase', async () => {
            const upsertSpy = vi.fn().mockResolvedValue({ error: null });
            vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({
                upsert: upsertSpy,
                update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
            } as any);

            await enqueueSync('games', 'insert', { id: 'g-sync-1', score_x: 2 });
            await enqueueSync('moves', 'insert', { id: 'm-sync-1', notation: '13/9' });

            const result = await processSyncQueue();

            expect(result.synced).toBe(2);
            expect(result.failed).toBe(0);
            expect(result.remaining).toBe(0);
            expect(await getPendingSyncCount()).toBe(0);

            // Vérifie la purge complète dans la base IndexedDB
            const records = await getAllRecords('sync_queue');
            expect(records.length).toBe(0);
        });

        it('gère les erreurs avec backoff exponentiel et permet le forçage avec le bouton Réessayer', async () => {
            const errorUpsert = vi.fn().mockResolvedValue({ error: new Error('Connexion perdue') });
            vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue({
                upsert: errorUpsert,
            } as any);

            await enqueueSync('games', 'insert', { id: 'g-fail-1' });

            // 1er échec : calcule nextRetryAt avec backoff
            const result1 = await processSyncQueue();
            expect(result1.synced).toBe(0);
            expect(result1.failed).toBe(1);
            expect(result1.remaining).toBe(1);

            const itemsAfterFail = await getAllRecords<any>('sync_queue');
            expect(itemsAfterFail[0].attempts).toBe(1);
            expect(itemsAfterFail[0].nextRetryAt).toBeGreaterThan(Date.now() - 100);

            // Appel immédiat normal (sans force) : saute l'élément car dans la fenêtre de backoff
            const result2 = await processSyncQueue(false);
            expect(result2.failed).toBe(1);
            expect(errorUpsert).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire vers Supabase

            // Clic sur 'Réessayer' (force = true) : bypass le délai de backoff
            const resultForced = await processSyncQueue(true);
            expect(resultForced.failed).toBe(1);
            expect(errorUpsert).toHaveBeenCalledTimes(2); // Le serveur a bien été resollicité
        });

        it('borne la file à max 200 éléments et émet un toast d’erreur explicite', async () => {
            const toastSpy = vi.spyOn(toast, 'error');

            // Remplir la file jusqu'au seuil maximal de 200
            for (let i = 0; i < MAX_SYNC_QUEUE_SIZE; i++) {
                await enqueueSync('moves', 'insert', { id: `m-${i}` });
            }

            expect(await getPendingSyncCount()).toBe(200);

            // Tenter d'insérer le 201ème élément
            const overflowResult = await enqueueSync('moves', 'insert', { id: 'm-overflow' });

            expect(overflowResult).toBeNull();
            expect(await getPendingSyncCount()).toBe(200); // Ne grandit pas au-delà de 200
            expect(toastSpy).toHaveBeenCalledWith(
                'File de synchronisation saturée (200 max)',
                expect.stringContaining('200 mutations'),
            );
        });
    });
});
