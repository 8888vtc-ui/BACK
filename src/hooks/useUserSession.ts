import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import {
    getCurrentUser,
    getUserProfile,
    signOut as supabaseSignOut,
    onAuthStateChange,
} from '../lib/supabase/auth';
import { isSupabaseConfigured } from '../lib/supabase/client';
import type { Profile } from '../lib/supabase/types';

export interface UserSessionState {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isOfflineMode: boolean;
    signOutUser: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

/**
 * Hook centralisant l'état d'authentification et le profil joueur en temps réel.
 * Conforme Loi 5 (< 150 lignes, 0 any).
 */
export function useUserSession(): UserSessionState {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

    const refreshSession = useCallback(async () => {
        if (!isSupabaseConfigured()) {
            setIsOfflineMode(true);
            setIsLoading(false);
            setUser(null);
            setProfile(null);
            return;
        }

        try {
            setIsLoading(true);
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (currentUser) {
                const userProfile = await getUserProfile(currentUser.id);
                setProfile(userProfile);
            } else {
                setProfile(null);
            }
        } catch {
            setUser(null);
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshSession();

        if (!isSupabaseConfigured()) return;

        const { unsubscribe } = onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                void getUserProfile(session.user.id).then((p) => setProfile(p));
            } else {
                setUser(null);
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [refreshSession]);

    const signOutUser = useCallback(async () => {
        try {
            await supabaseSignOut();
        } finally {
            setUser(null);
            setProfile(null);
        }
    }, []);

    return {
        user,
        profile,
        isLoading,
        isAuthenticated: user !== null,
        isOfflineMode,
        signOutUser,
        refreshSession,
    };
}
