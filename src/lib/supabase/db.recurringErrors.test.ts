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
