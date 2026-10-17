import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    persistNewGame,
    persistGameUpdate,
    persistMove,
    persistCoachExplanation,
} from './persistenceService';
import { getRecord, clearStore } from './idb';
import { clearSyncQueue, getPendingSyncCount } from './syncQueue';
import { supabase } from '../supabase/client';

describe('PersistenceService (Offline-First)', () => {
    beforeEach(async () => {
        await clearStore('games');
        await clearStore('moves');
        await clearStore('coach_explanations');
        await clearSyncQueue();

        vi.spyOn(supabase, 'from').mockReturnValue({
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        } as any);
    });

    it('persiste une nouvelle partie en local et enfile la synchronisation', async () => {
        await persistNewGame({
            id: 'g-pers-1',
            opponent_type: 'ai',
            match_length: 7,
            score_x: 0,
            score_o: 0,
            cube_value: 1,
            is_crawford: false,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        const stored = await getRecord<any>('games', 'g-pers-1');
        expect(stored).not.toBeNull();
        expect(stored?.id).toBe('g-pers-1');
    });

    it('persiste la mise à jour d\'une partie', async () => {
        await persistNewGame({
            id: 'g-update-1',
            opponent_type: 'ai',
            match_length: 7,
            score_x: 0,
            score_o: 0,
            cube_value: 1,
            is_crawford: false,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        await persistGameUpdate('g-update-1', {
            status: 'completed',
            score_x: 7,
            winner: 'X',
            win_type: 'single',
        });

        const updated = await getRecord<any>('games', 'g-update-1');
        expect(updated?.status).toBe('completed');
        expect(updated?.score_x).toBe(7);
        expect(updated?.winner).toBe('X');
    });

    it('persiste un coup joué', async () => {
        await persistMove({
            id: 'mv-pers-1',
            game_id: 'g-1',
            move_number: 1,
            player: 'X',
            dice: [3, 1],
            move_notation: '8/5 6/5',
            board_before: [],
            board_after: [],
            played_at: new Date().toISOString(),
        });

        const move = await getRecord<any>('moves', 'mv-pers-1');
        expect(move?.move_notation).toBe('8/5 6/5');
        expect(move?.player).toBe('X');
    });

    it('persiste une analyse de coach', async () => {
        await persistCoachExplanation({
            id: 'exp-pers-1',
            position_key: 'pos_123',
            played_move: '13/9',
            optimal_move: '8/4',
            verdict: 'blunder',
            equity_loss: -0.12,
            summary: 'Blunder grave',
            explanation: 'Trop de tirs concédés',
            source: 'llm',
            created_at: new Date().toISOString(),
        });

        const exp = await getRecord<any>('coach_explanations', 'exp-pers-1');
        expect(exp?.summary).toBe('Blunder grave');
        expect(exp?.verdict).toBe('blunder');
    });
});
