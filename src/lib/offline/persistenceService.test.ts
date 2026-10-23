import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    persistNewGame,
    persistGameUpdate,
    persistMove,
    persistMovesBatch,
    persistCoachExplanation,
    persistLocalGameAnalysis,
    persistRecurrentMistake,
    type LocalGameRecord,
    type LocalMoveRecord,
    type LocalCoachExplanationRecord,
    type LocalGameAnalysisRecord,
    type LocalRecurrentMistakeRecord,
} from './persistenceService';
import { getRecord, clearStore, getAllRecords } from './idb';
import { clearSyncQueue } from './syncQueue';
import { supabase } from '../supabase/client';

describe('PersistenceService (Offline-First)', () => {
    beforeEach(async () => {
        await clearStore('games');
        await clearStore('moves');
        await clearStore('coach_explanations');
        await clearStore('game_analyses');
        await clearStore('recurrent_mistakes');
        await clearSyncQueue();

        vi.spyOn(supabase, 'from').mockReturnValue({
            upsert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        } as unknown as ReturnType<typeof supabase.from>);
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

        const stored = await getRecord<LocalGameRecord>('games', 'g-pers-1');
        expect(stored).not.toBeNull();
        expect(stored?.id).toBe('g-pers-1');
    });

    it('persiste la mise à jour d’une partie sans écraser l’historique de videau', async () => {
        await persistNewGame({
            id: 'g-update-1',
            opponent_type: 'ai',
            match_length: 7,
            score_x: 2,
            score_o: 1,
            cube_value: 4,
            cube_owner: 'X',
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

        const updated = await getRecord<LocalGameRecord>('games', 'g-update-1');
        expect(updated?.status).toBe('completed');
        expect(updated?.score_x).toBe(7);
        expect(updated?.winner).toBe('X');
        expect(updated?.cube_value).toBe(4);
        expect(updated?.cube_owner).toBe('X');
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

        const move = await getRecord<LocalMoveRecord>('moves', 'mv-pers-1');
        expect(move?.move_notation).toBe('8/5 6/5');
        expect(move?.player).toBe('X');
    });

    it('persiste un lot de coups avec persistMovesBatch', async () => {
        const moves: LocalMoveRecord[] = [
            {
                id: 'batch-mv-1',
                game_id: 'g-batch-1',
                move_number: 1,
                player: 'X',
                dice: [5, 3],
                move_notation: '8/3 6/3',
                board_before: [],
                board_after: [],
                played_at: new Date().toISOString(),
            },
            {
                id: 'batch-mv-2',
                game_id: 'g-batch-1',
                move_number: 2,
                player: 'O',
                dice: [6, 1],
                move_notation: '13/7 8/7',
                board_before: [],
                board_after: [],
                played_at: new Date().toISOString(),
            },
        ];

        await persistMovesBatch(moves);
        const stored = await getAllRecords<LocalMoveRecord>('moves');
        expect(stored.length).toBe(2);
        expect(stored.map((m) => m.id)).toEqual(['batch-mv-1', 'batch-mv-2']);
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

        const exp = await getRecord<LocalCoachExplanationRecord>('coach_explanations', 'exp-pers-1');
        expect(exp?.summary).toBe('Blunder grave');
        expect(exp?.verdict).toBe('blunder');
    });

    it('persiste une analyse globale de partie et une erreur récurrente dans les stores IDB v2', async () => {
        const analysis: LocalGameAnalysisRecord = {
            id: 'analysis_match_42',
            game_id: 'g_42',
            error_rate: 3.8,
            bmab_rating: 'Grandmaster 2',
            performance_rating: 4.1,
            created_at: new Date().toISOString(),
            raw_data: { totalMoves: 28 },
        };

        const mistake: LocalRecurrentMistakeRecord = {
            id: 'mistake_42',
            game_id: 'g_42',
            category: 'cube_decision',
            position_xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:7:10',
            played_move: 'NO_DOUBLE',
            optimal_move: 'DOUBLE_TAKE',
            equity_loss: 0.165,
            created_at: new Date().toISOString(),
        };

        await persistLocalGameAnalysis(analysis);
        await persistRecurrentMistake(mistake);

        const storedAna = await getRecord<LocalGameAnalysisRecord>('game_analyses', 'analysis_match_42');
        const storedMis = await getRecord<LocalRecurrentMistakeRecord>('recurrent_mistakes', 'mistake_42');
        expect(storedAna?.bmab_rating).toBe('Grandmaster 2');
        expect(storedMis?.category).toBe('cube_decision');
        expect(storedMis?.equity_loss).toBe(0.165);
    });
});
