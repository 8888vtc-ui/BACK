import { describe, it, expect, beforeEach } from 'vitest';
import {
    putRecord,
    getRecord,
    getAllRecords,
    deleteRecord,
    clearStore,
} from './idb';

describe('IndexedDB Offline Store (with memory fallback)', () => {
    beforeEach(async () => {
        await clearStore('games');
        await clearStore('moves');
        await clearStore('coach_explanations');
        await clearStore('sync_queue');
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

    it('récupère l\'ensemble des enregistrements avec getAllRecords', async () => {
        await putRecord('moves', { id: 'm-1', move_number: 1, notation: '13/9' });
        await putRecord('moves', { id: 'm-2', move_number: 2, notation: '24/20' });

        const allMoves = await getAllRecords<any>('moves');
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
