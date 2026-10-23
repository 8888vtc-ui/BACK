import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    putRecord,
    getRecord,
    getAllRecords,
    deleteRecord,
    clearStore,
    writeBatch,
    upgradeDatabaseSchema,
    DB_VERSION,
    ALL_STORE_NAMES,
} from './idb';

describe('IndexedDB Offline Store (with memory fallback)', () => {
    beforeEach(async () => {
        for (const store of ALL_STORE_NAMES) {
            await clearStore(store);
        }
    });

    it('confirme que la version de schéma est bien la v2 et migre tous les stores idempotentement', () => {
        expect(DB_VERSION).toBe(2);

        const createdStores: string[] = [];
        const createdIndexes: Array<{ store: string; index: string }> = [];
        const mockDb = {
            objectStoreNames: {
                contains: (name: string) => createdStores.includes(name),
            },
            createObjectStore: vi.fn((name: string) => {
                createdStores.push(name);
                return {
                    createIndex: vi.fn((idxName: string) => {
                        createdIndexes.push({ store: name, index: idxName });
                    }),
                };
            }),
        } as unknown as IDBDatabase;

        upgradeDatabaseSchema(mockDb);
        expect(createdStores).toEqual([
            'games',
            'moves',
            'coach_explanations',
            'sync_queue',
            'game_analyses',
            'recurrent_mistakes',
        ]);
        expect(createdIndexes).toContainEqual({ store: 'game_analyses', index: 'game_id' });
        expect(createdIndexes).toContainEqual({ store: 'recurrent_mistakes', index: 'category' });

        // Deuxième appel idempotent : aucun nouveau store recréé
        upgradeDatabaseSchema(mockDb);
        expect(mockDb.createObjectStore).toHaveBeenCalledTimes(6);
    });

    it('enregistre et récupère une partie dans le store games', async () => {
        const game = {
            id: 'g-101',
            match_length: 7,
            score_x: 2,
            score_o: 1,
            status: 'in_progress',
        };

        await putRecord('games', game);
        const retrieved = await getRecord<typeof game>('games', 'g-101');

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe('g-101');
        expect(retrieved?.match_length).toBe(7);
    });

    it('écrit un lot d’enregistrements avec writeBatch et conserve les données en mémoire', async () => {
        const batchMoves = [
            { id: 'bm-1', game_id: 'g-batch', move_number: 1 },
            { id: 'bm-2', game_id: 'g-batch', move_number: 2 },
            { id: 'bm-3', game_id: 'g-batch', move_number: 3 },
        ];

        await writeBatch('moves', batchMoves);
        const stored = await getAllRecords<{ id: string; move_number: number }>('moves');

        expect(stored.length).toBe(3);
        expect(stored.map((m) => m.id)).toEqual(['bm-1', 'bm-2', 'bm-3']);
    });

    it('supporte les nouveaux stores v2 game_analyses et recurrent_mistakes', async () => {
        const analysis = {
            id: 'ana-1',
            game_id: 'g-1',
            error_rate: 4.25,
            bmab_rating: 'Master 1',
        };
        const mistake = {
            id: 'mis-1',
            category: 'bearing_off',
            equity_loss: 0.125,
        };

        await putRecord('game_analyses', analysis);
        await putRecord('recurrent_mistakes', mistake);

        const retrievedAna = await getRecord<typeof analysis>('game_analyses', 'ana-1');
        const retrievedMis = await getRecord<typeof mistake>('recurrent_mistakes', 'mis-1');

        expect(retrievedAna?.bmab_rating).toBe('Master 1');
        expect(retrievedMis?.category).toBe('bearing_off');
    });

    it('récupère l\'ensemble des enregistrements avec getAllRecords sans any', async () => {
        await putRecord('moves', { id: 'm-1', move_number: 1, notation: '13/9' });
        await putRecord('moves', { id: 'm-2', move_number: 2, notation: '24/20' });

        const allMoves = await getAllRecords<{ id: string; notation: string }>('moves');
        expect(allMoves.length).toBe(2);
        expect(allMoves.map((m) => m.id)).toEqual(['m-1', 'm-2']);
    });

    it('supprime un enregistrement avec deleteRecord', async () => {
        await putRecord('coach_explanations', { id: 'exp-1', summary: 'Blunder critique' });
        expect(await getRecord('coach_explanations', 'exp-1')).not.toBeNull();

        await deleteRecord('coach_explanations', 'exp-1');
        expect(await getRecord('coach_explanations', 'exp-1')).toBeNull();
    });

    it('vide complètement un store avec clearStore', async () => {
        await putRecord('sync_queue', { id: 'sq-1', table: 'games' });
        await putRecord('sync_queue', { id: 'sq-2', table: 'moves' });
        expect((await getAllRecords('sync_queue')).length).toBe(2);

        await clearStore('sync_queue');
        expect((await getAllRecords('sync_queue')).length).toBe(0);
    });
});
