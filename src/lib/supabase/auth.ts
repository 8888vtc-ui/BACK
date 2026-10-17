/**
 * Service d'authentification Supabase pour le Backgammon.
 *
 * Gère :
 * - Inscription / Connexion par Email & Mot de passe
 * - Authentification OAuth Google
 * - Authentification OAuth Apple
 * - Déconnexion, profil joueur et suivi de session
 */

import { User, Session, AuthResponse, OAuthResponse } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './client';
import type { Profile, UserStats } from './types';

export interface SignUpParams {
    email: string;
    password: string;
    displayName?: string;
    username?: string;
}

export interface SignInParams {
    email: string;
    password: string;
}

/**
 * Inscription par Email et mot de passe.
 */
export async function signUpWithEmail(params: SignUpParams): Promise<AuthResponse> {
    const { email, password, displayName, username } = params;

    const res = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: displayName || email.split('@')[0],
                username: username || email.split('@')[0],
            },
        },
    });

    return res;
}

/**
 * Connexion par Email et mot de passe.
 */
export async function signInWithEmail(params: SignInParams): Promise<AuthResponse> {
    const { email, password } = params;
    return await supabase.auth.signInWithPassword({
        email,
        password,
    });
}

/**
 * Connexion OAuth avec Google.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<OAuthResponse> {
    const redirectUrl =
        redirectTo ||
        (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });
}

/**
 * Connexion OAuth avec Apple.
 */
export async function signInWithApple(redirectTo?: string): Promise<OAuthResponse> {
    const redirectUrl =
        redirectTo ||
        (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined);

    return await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: redirectUrl,
        },
    });
}

/**
 * Déconnexion de la session courante.
 */
export async function signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Récupère l'utilisateur connecté actuellement.
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Récupère la session active.
 */
export async function getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Écouteur d'événements de changement d'état d'authentification.
 */
export function onAuthStateChange(
    callback: (event: string, session: Session | null) => void,
): { unsubscribe: () => void } {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return {
        unsubscribe: () => subscription.unsubscribe(),
    };
}

/**
 * Récupère le profil joueur associé depuis la table profiles.
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.warn('[Supabase Auth] Impossible de charger le profil :', error.message);
        return null;
    }

    return data;
}

/**
 * Récupère les statistiques de jeu du joueur.
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.warn('[Supabase Auth] Impossible de charger les stats :', error.message);
        return null;
    }

    return data;
}
