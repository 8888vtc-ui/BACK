/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiplayerGame } from './useMultiplayerGame';

vi.mock('../lib/supabase/client', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [] }),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
        }),
    },
    isSupabaseConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock('../lib/supabase/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../lib/supabase/auth')>();
    return {
        ...actual,
        getCurrentUser: vi.fn().mockResolvedValue(null),
        getUserProfile: vi.fn().mockResolvedValue(null),
        readPlayerPassport: vi.fn().mockReturnValue(null),
    };
});

describe('useMultiplayerGame', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initialise correctement l\'état par défaut', () => {
        const { result } = renderHook(() => useMultiplayerGame());

        expect(result.current.status).toBe('idle');
        expect(result.current.matchInfo).toBeNull();
        expect(result.current.opponentProfile).toBeNull();
        expect(result.current.turnTimeRemaining).toBe(45);
        expect(result.current.disconnectCountdown).toBeNull();
        expect(result.current.eloResult).toBeNull();
        expect(result.current.isMyTurn).toBe(false);
        expect(result.current.localProfile).toBeDefined();
        expect(result.current.localProfile.isGuest).toBe(true);
        expect(typeof result.current.startMatchmaking).toBe('function');
        expect(typeof result.current.createPrivateRoom).toBe('function');
        expect(typeof result.current.joinPrivateRoom).toBe('function');
        expect(typeof result.current.cancelMatchmaking).toBe('function');
    });

    it('permet de réinitialiser le matchmaking via cancelMatchmaking', () => {
        const { result } = renderHook(() => useMultiplayerGame());

        act(() => {
            result.current.cancelMatchmaking();
        });

        expect(result.current.status).toBe('idle');
        expect(result.current.matchInfo).toBeNull();
    });
});
