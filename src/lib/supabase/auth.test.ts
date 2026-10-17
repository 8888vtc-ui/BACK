import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
} from './auth';
import { supabase } from './client';

describe('Supabase Authentication Service', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('appelle supabase.auth.signUp avec les paramètres email et mot de passe', async () => {
        const signUpSpy = vi.spyOn(supabase.auth, 'signUp').mockResolvedValue({
            data: { user: { id: 'u123', email: 'test@example.com' } as any, session: null },
            error: null,
        });

        const res = await signUpWithEmail({
            email: 'test@example.com',
            password: 'password123',
            displayName: 'Joueur1',
        });

        expect(signUpSpy).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: {
                data: {
                    full_name: 'Joueur1',
                    username: 'test',
                },
            },
        });
        expect(res.data.user?.email).toBe('test@example.com');
    });

    it('appelle supabase.auth.signInWithPassword pour la connexion email', async () => {
        const signInSpy = vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
            data: { user: { id: 'u123', email: 'test@example.com' } as any, session: {} as any },
            error: null,
        });

        const res = await signInWithEmail({
            email: 'test@example.com',
            password: 'password123',
        });

        expect(signInSpy).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.error).toBeNull();
    });

    it('appelle supabase.auth.signInWithOAuth avec le provider Google', async () => {
        const oAuthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
            data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2' },
            error: null,
        });

        const res = await signInWithGoogle('http://localhost:3000/auth/callback');

        expect(oAuthSpy).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: 'http://localhost:3000/auth/callback',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        expect(res.data.provider).toBe('google');
    });

    it('appelle supabase.auth.signInWithOAuth avec le provider Apple', async () => {
        const oAuthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
            data: { provider: 'apple', url: 'https://appleid.apple.com/auth/authorize' },
            error: null,
        });

        const res = await signInWithApple('http://localhost:3000/auth/callback');

        expect(oAuthSpy).toHaveBeenCalledWith({
            provider: 'apple',
            options: {
                redirectTo: 'http://localhost:3000/auth/callback',
            },
        });
        expect(res.data.provider).toBe('apple');
    });

    it('appelle supabase.auth.signOut lors de la déconnexion', async () => {
        const signOutSpy = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({
            error: null,
        });

        const res = await signOut();

        expect(signOutSpy).toHaveBeenCalled();
        expect(res.error).toBeNull();
    });
});
