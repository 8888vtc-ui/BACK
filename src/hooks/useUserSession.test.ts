// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useUserSession } from './useUserSession';
import * as authLib from '../lib/supabase/auth';
import * as clientLib from '../lib/supabase/client';
import type { Profile } from '../lib/supabase/types';

describe('useUserSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('bascule en mode hors-ligne lorsque Supabase n\'est pas configuré', async () => {
        vi.spyOn(clientLib, 'isSupabaseConfigured').mockReturnValue(false);

        const { result } = renderHook(() => useUserSession());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isOfflineMode).toBe(true);
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('charge l\'utilisateur et son profil lorsque Supabase est configuré', async () => {
        vi.spyOn(clientLib, 'isSupabaseConfigured').mockReturnValue(true);
        const mockUser = { id: 'user-123', email: 'grandmaster@backgammon.com' } as unknown as User;
        const mockProfile = { id: 'user-123', display_name: 'Alexis GM', rating: 1850 } as unknown as Profile;

        vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(mockUser);
        vi.spyOn(authLib, 'getUserProfile').mockResolvedValue(mockProfile);
        vi.spyOn(authLib, 'onAuthStateChange').mockReturnValue({ unsubscribe: vi.fn() });

        const { result } = renderHook(() => useUserSession());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.user).toEqual(mockUser);
            expect(result.current.profile).toEqual(mockProfile);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isOfflineMode).toBe(false);
    });

    it('permet la déconnexion et réinitialise l\'état utilisateur', async () => {
        vi.spyOn(clientLib, 'isSupabaseConfigured').mockReturnValue(true);
        const mockUser = { id: 'user-456', email: 'player@backgammon.com' } as unknown as User;

        vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(mockUser);
        vi.spyOn(authLib, 'getUserProfile').mockResolvedValue(null);
        vi.spyOn(authLib, 'signOut').mockResolvedValue({ error: null });
        vi.spyOn(authLib, 'onAuthStateChange').mockReturnValue({ unsubscribe: vi.fn() });

        const { result } = renderHook(() => useUserSession());

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
        });

        await act(async () => {
            await result.current.signOutUser();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.profile).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });
});
