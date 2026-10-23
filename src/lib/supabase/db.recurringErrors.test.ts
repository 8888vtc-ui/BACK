// @vitest-environment jsdom
/**
 * Tests des fonctions CRUD des erreurs récurrentes (recurring_errors)
 * et du cache global partagé L2 (getSharedCoachExplanation).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock('./client', () => ({
    supabase: {
        rpc: (...args: unknown[]) => mockRpc(...args),
        from: (...args: unknown[]) => mockFrom(...args),
    },
}));

import {
    upsertRecurringError,
    getRecurringErrors,
    getSharedCoachExplanation,
    computeFsrsSchedule,
    scheduleRecurringErrorFsrs,
    updateProfilePuzzleStats,
    FSRS_INTERVALS_DAYS,
} from './db';

describe('upsertRecurringError', () => {
    beforeEach(() => {
        mockRpc.mockReset();
        mockFrom.mockReset();
    });

    it('appelle la RPC upsert_recurring_error avec les bons paramètres', async () => {
        const record = {
            id: 'err-1',
            user_id: 'user-1',
            concept_id: 'golden-point',
            concept_label: 'Golden Point',
            occurrence_count: 3,
            total_equity_loss: 0.12,
            last_seen_at: '2026-10-20T00:00:00.000Z',
            created_at: '2026-10-20T00:00:00.000Z',
            updated_at: '2026-10-20T00:00:00.000Z',
        };

        mockRpc.mockResolvedValue({ data: record, error: null });

        const result = await upsertRecurringError('user-1', 'golden-point', 'Golden Point', 0.04);

        expect(mockRpc).toHaveBeenCalledWith('upsert_recurring_error', {
            p_user_id: 'user-1',
            p_concept_id: 'golden-point',
            p_concept_label: 'Golden Point',
            p_equity_loss: 0.04,
        });
        expect(result).toEqual(record);
    });

    it("retourne null en cas d'erreur RPC", async () => {
        mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

        const result = await upsertRecurringError('user-1', 'x', 'X', 0.01);

        expect(result).toBeNull();
    });
});

describe('getRecurringErrors', () => {
    beforeEach(() => {
        mockRpc.mockReset();
        mockFrom.mockReset();
    });

    it('récupère les erreurs triées par occurrence décroissante', async () => {
        const records = [
            { id: 'e1', concept_id: 'golden-point', occurrence_count: 5 },
            { id: 'e2', concept_id: 'bar-point', occurrence_count: 2 },
        ];

        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: records, error: null }),
        };
        mockFrom.mockReturnValue(chain);

        const result = await getRecurringErrors('user-1');

        expect(mockFrom).toHaveBeenCalledWith('recurring_errors');
        expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(chain.order).toHaveBeenCalledWith('occurrence_count', { ascending: false });
        expect(result).toEqual(records);
    });

    it("retourne un tableau vide en cas d'erreur", async () => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
        };
        mockFrom.mockReturnValue(chain);

        const result = await getRecurringErrors('user-1');

        expect(result).toEqual([]);
    });
});

describe('getSharedCoachExplanation (Cache Global Partagé L2)', () => {
    beforeEach(() => {
        mockFrom.mockReset();
    });

    it('privilégie une explication issue du LLM sur un repli rule-based pour la même position_key', async () => {
        const rows = [
            {
                id: 'exp-rb',
                position_key: 'coach::pos[xgid1]',
                explanation: 'Explication heuristique',
                source: 'rule-based',
                created_at: '2026-10-23T12:00:00Z',
            },
            {
                id: 'exp-llm',
                position_key: 'coach::pos[xgid1]',
                explanation: 'Explication Grand-Maître LLM',
                source: 'llm',
                created_at: '2026-10-23T11:00:00Z',
            },
        ];

        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
        };
        mockFrom.mockReturnValue(chain);

        const res = await getSharedCoachExplanation('coach::pos[xgid1]');
        expect(mockFrom).toHaveBeenCalledWith('coach_explanations');
        expect(chain.eq).toHaveBeenCalledWith('position_key', 'coach::pos[xgid1]');
        expect(res?.id).toBe('exp-llm');
    });
});

describe('Ordonnanceur FSRS & Persistance Streak / Puzzle Rating', () => {
    beforeEach(() => {
        mockRpc.mockReset();
        mockFrom.mockReset();
    });

    it('calcule les intervalles FSRS canoniques J+1, J+3, J+7, J+14, J+30', () => {
        expect(FSRS_INTERVALS_DAYS).toEqual([1, 3, 7, 14, 30]);
        const baseNow = new Date('2026-10-23T00:00:00.000Z');

        // Échec initial : J+1, repetition_count = 0, ease_factor = 2.3
        const fail0 = computeFsrsSchedule({ repetitionCount: 0, easeFactor: 2.5, isSuccess: false, now: baseNow });
        expect(fail0.interval_days).toBe(1);
        expect(fail0.repetition_count).toBe(0);
        expect(fail0.ease_factor).toBe(2.3);
        expect(fail0.next_review_date).toBe('2026-10-24T00:00:00.000Z');

        // Progression J+1 -> J+3 -> J+7 -> J+14 -> J+30
        const rep0 = computeFsrsSchedule({ repetitionCount: 0, easeFactor: 2.5, isSuccess: true, now: baseNow });
        expect(rep0.interval_days).toBe(1);
        expect(rep0.repetition_count).toBe(1);

        const rep1 = computeFsrsSchedule({ repetitionCount: 1, easeFactor: rep0.ease_factor, isSuccess: true, now: baseNow });
        expect(rep1.interval_days).toBe(3);
        expect(rep1.repetition_count).toBe(2);

        const rep2 = computeFsrsSchedule({ repetitionCount: 2, easeFactor: rep1.ease_factor, isSuccess: true, now: baseNow });
        expect(rep2.interval_days).toBe(7);
        expect(rep2.repetition_count).toBe(3);

        const rep3 = computeFsrsSchedule({ repetitionCount: 3, easeFactor: rep2.ease_factor, isSuccess: true, now: baseNow });
        expect(rep3.interval_days).toBe(14);
        expect(rep3.repetition_count).toBe(4);

        const rep4 = computeFsrsSchedule({ repetitionCount: 4, easeFactor: rep3.ease_factor, isSuccess: true, now: baseNow });
        expect(rep4.interval_days).toBe(30);
        expect(rep4.repetition_count).toBe(5);
    });

    it('planifie une erreur dans recurring_errors avec next_review_date, repetition_count et ease_factor', async () => {
        const baseRecord = {
            id: 'err-fsrs-1',
            user_id: 'user-1',
            concept_id: 'prime_construction',
            concept_label: 'Construction de Prime',
            occurrence_count: 1,
            total_equity_loss: 0.095,
            last_seen_at: '2026-10-23T00:00:00.000Z',
            created_at: '2026-10-23T00:00:00.000Z',
            updated_at: '2026-10-23T00:00:00.000Z',
        };
        mockRpc.mockResolvedValue({ data: baseRecord, error: null });

        const updatedRecord = {
            ...baseRecord,
            next_review_date: '2026-10-24T00:00:00.000Z',
            repetition_count: 0,
            ease_factor: 2.3,
            position_xgid: 'XGID=test',
        };
        const updateChain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedRecord, error: null }),
        };
        mockFrom.mockReturnValue(updateChain);

        const res = await scheduleRecurringErrorFsrs({
            userId: 'user-1',
            conceptId: 'prime_construction',
            conceptLabel: 'Construction de Prime',
            equityLoss: 0.095,
            positionXgid: 'XGID=test',
            isSuccess: false,
            now: new Date('2026-10-23T00:00:00.000Z'),
        });

        expect(res?.next_review_date).toBe('2026-10-24T00:00:00.000Z');
        expect(res?.repetition_count).toBe(0);
        expect(res?.ease_factor).toBe(2.3);
    });

    it('met à jour le profil utilisateur avec current_streak, max_streak et puzzle_rating', async () => {
        const updatedProfile = {
            id: 'user-1',
            current_streak: 5,
            max_streak: 9,
            puzzle_rating: 1584,
            last_puzzle_date: '2026-10-23',
        };
        const chain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null }),
        };
        mockFrom.mockReturnValue(chain);

        const res = await updateProfilePuzzleStats('user-1', {
            current_streak: 5,
            max_streak: 9,
            puzzle_rating: 1584.3,
            last_puzzle_date: '2026-10-23',
        });

        expect(mockFrom).toHaveBeenCalledWith('profiles');
        expect(res?.current_streak).toBe(5);
        expect(res?.max_streak).toBe(9);
        expect(res?.puzzle_rating).toBe(1584);
    });
});
