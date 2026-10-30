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

export interface ExtractedGoogleUserMetadata {
    readonly username: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
    readonly email: string | null;
}

/**
 * Extrait de manière pure et déterministe les métadonnées Gmail / Google OAuth
 * (`full_name`, `name`, `avatar_url`, `picture`, `email`) d'un utilisateur Supabase.
 */
export function extractGoogleUserMetadata(user: Pick<User, 'id' | 'email' | 'user_metadata'>): ExtractedGoogleUserMetadata {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const emailPrefix = user.email ? user.email.split('@')[0] ?? 'joueur' : 'joueur';
    const cleanPrefix = emailPrefix.replace(/[^a-zA-Z0-9_.-]/g, '') || 'joueur';
    const idSuffix = user.id.slice(0, 4);

    const rawUsername = typeof meta.username === 'string' ? meta.username.trim() : '';
    const username = rawUsername || `${cleanPrefix}_${idSuffix}`;

    const rawFullName = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
    const rawName = typeof meta.name === 'string' ? meta.name.trim() : '';
    const displayName = rawFullName || rawName || emailPrefix;

    const rawAvatar = typeof meta.avatar_url === 'string' ? meta.avatar_url.trim() : '';
    const rawPicture = typeof meta.picture === 'string' ? meta.picture.trim() : '';
    const avatarUrl = rawAvatar || rawPicture || null;

    return {
        username,
        displayName,
        avatarUrl,
        email: user.email ?? null,
    };
}

/**
 * Sécurise la cible de redirection post-OAuth contre les Open Redirects.
 */
export function sanitizeAuthRedirectPath(nextPath: string | null | undefined): string {
    if (!nextPath) return '/';
    const trimmed = nextPath.trim();
    if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
        return '/';
    }
    return trimmed;
}

/**
 * Connexion OAuth avec Google (Gmail).
 */
export async function signInWithGoogle(redirectTo?: string): Promise<OAuthResponse> {
    const currentPath =
        typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/';
    const safeNext = sanitizeAuthRedirectPath(currentPath);
    const defaultCallback =
        typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
            : undefined;
    const redirectUrl = redirectTo || defaultCallback;

    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl,
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
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

/**
 * Garantit que le profil `public.profiles` et `public.user_stats` d'un utilisateur
 * connecté (notamment via Google / Gmail OAuth) existent et sont synchronisés.
 */
export async function ensureUserProfileSynced(user: User): Promise<Profile | null> {
    if (!isSupabaseConfigured()) return null;

    const existing = await getUserProfile(user.id);
    const meta = extractGoogleUserMetadata(user);

    if (existing) {
        const needsUpdate =
            (!existing.display_name && Boolean(meta.displayName)) ||
            (!existing.avatar_url && Boolean(meta.avatarUrl));

        if (!needsUpdate) return existing;

        const { data: updated, error: updateErr } = await supabase
            .from('profiles')
            .update({
                display_name: existing.display_name || meta.displayName,
                avatar_url: existing.avatar_url || meta.avatarUrl,
                last_active_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('*')
            .single();

        if (updateErr) {
            return existing;
        }
        return updated;
    }

    const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(
            {
                id: user.id,
                username: meta.username,
                display_name: meta.displayName,
                avatar_url: meta.avatarUrl,
                rating: 1500,
                experience_level: 'intermediate',
                last_active_at: new Date().toISOString(),
            },
            { onConflict: 'id' },
        )
        .select('*')
        .single();

    if (insertErr) {
        return null;
    }

    await supabase
        .from('user_stats')
        .upsert({ user_id: user.id }, { onConflict: 'user_id' });

    return inserted;
}

/**
 * Échange le code PKCE OAuth Google (`?code=...`) contre une session Supabase active
 * et synchronise immédiatement le profil joueur Gmail.
 */
export async function exchangeOAuthCodeForSession(code: string): Promise<{
    session: Session | null;
    profile: Profile | null;
    error: Error | null;
}> {
    const cleanCode = code.trim();
    if (!cleanCode) {
        return {
            session: null,
            profile: null,
            error: new Error('Code OAuth manquant dans la redirection.'),
        };
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(cleanCode);
    if (error) {
        return { session: null, profile: null, error };
    }

    const profile = data.user ? await ensureUserProfileSynced(data.user) : null;
    return {
        session: data.session,
        profile,
        error: null,
    };
}
