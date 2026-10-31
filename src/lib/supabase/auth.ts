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

export type PlayerExperienceTier = 'beginner' | 'intermediate' | 'expert';

export interface PlayerPassport {
    readonly pseudo: string;
    readonly email: string;
    readonly experienceLevel: PlayerExperienceTier;
    readonly registeredAt: string;
    readonly supabaseSynced?: boolean;
}

export const PLAYER_PASSPORT_STORAGE_KEY = 'bg_player_passport_v1';

export function readPlayerPassport(): PlayerPassport | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        const raw = window.localStorage.getItem(PLAYER_PASSPORT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<PlayerPassport>;
        if (
            typeof parsed.pseudo === 'string' &&
            parsed.pseudo.trim().length >= 2 &&
            typeof parsed.email === 'string' &&
            parsed.email.includes('@')
        ) {
            const level: PlayerExperienceTier =
                parsed.experienceLevel === 'beginner' ||
                parsed.experienceLevel === 'intermediate' ||
                parsed.experienceLevel === 'expert'
                    ? parsed.experienceLevel
                    : 'intermediate';
            return {
                pseudo: parsed.pseudo.trim(),
                email: parsed.email.trim().toLowerCase(),
                experienceLevel: level,
                registeredAt: parsed.registeredAt ?? new Date().toISOString(),
                supabaseSynced: Boolean(parsed.supabaseSynced),
            };
        }
        return null;
    } catch {
        return null;
    }
}

export function savePlayerPassport(passport: PlayerPassport): PlayerPassport {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(PLAYER_PASSPORT_STORAGE_KEY, JSON.stringify(passport));
            const chameleonLayer =
                passport.experienceLevel === 'beginner'
                    ? 'L0'
                    : passport.experienceLevel === 'expert'
                      ? 'L2'
                      : 'L1';
            window.localStorage.setItem('backgammon.chameleonUxLayer', chameleonLayer);
        } catch {
            // ignore storage errors
        }
    }
    return passport;
}

export function clearPlayerPassport(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.removeItem(PLAYER_PASSPORT_STORAGE_KEY);
        } catch {
            // ignore
        }
    }
}

const GDPR_LOCAL_STORAGE_KEYS: readonly string[] = [
    PLAYER_PASSPORT_STORAGE_KEY,
    'bg_adaptive_quiz_profile_v1',
    'bg_blunder_bank_v2',
    'backgammon_game_analyses_v1',
    'backgammon.chameleonUxLayer',
    'backgammon.swapDiceDate',
    'bg_supabase_auth_token',
];

/**
 * Exercice immédiat du Droit à l'Effacement / Droit à l'Oubli (Article 17 RGPD).
 * Supprime les données du profil Supabase (si connecté) et purge intégralement
 * les données personnelles et historiques de parties stockées localement.
 */
export async function eraseAllPlayerGdprData(): Promise<{ clearedKeys: number }> {
    let clearedKeys = 0;

    if (isSupabaseConfigured()) {
        try {
            const { data } = await supabase.auth.getUser();
            const userId = data?.user?.id;
            if (userId) {
                await supabase.from('user_stats').delete().eq('user_id', userId);
                await supabase.from('profiles').delete().eq('id', userId);
            }
            await supabase.auth.signOut();
        } catch {
            // Purge locale exécutée dans tous les cas
        }
    }

    if (typeof window !== 'undefined' && window.localStorage) {
        for (const key of GDPR_LOCAL_STORAGE_KEYS) {
            try {
                window.localStorage.removeItem(key);
                clearedKeys += 1;
            } catch {
                // ignore
            }
        }
    }

    return { clearedKeys };
}

function generateCryptoPassportPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const buf = new Uint32Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        crypto.getRandomValues(buf);
    }
    let out = 'Mc!';
    for (let i = 0; i < buf.length; i++) {
        out += chars[(buf[i] ?? i) % chars.length];
    }
    return out;
}

/**
 * Enregistre le Passeport Joueur obligatoire (Pseudo + Email + Niveau) en local
 * ET synchronise immédiatement le contact dans Supabase Auth (`auth.users`).
 */
export async function registerPlayerPassportLead(params: {
    pseudo: string;
    email: string;
    experienceLevel: PlayerExperienceTier;
    password?: string;
}): Promise<{ passport: PlayerPassport; error: Error | null }> {
    const cleanPseudo = params.pseudo.trim();
    const cleanEmail = params.email.trim().toLowerCase();
    if (cleanPseudo.length < 2) {
        return {
            passport: { pseudo: cleanPseudo, email: cleanEmail, experienceLevel: params.experienceLevel, registeredAt: new Date().toISOString() },
            error: new Error('Veuillez indiquer un pseudo (2 caractères minimum).'),
        };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return {
            passport: { pseudo: cleanPseudo, email: cleanEmail, experienceLevel: params.experienceLevel, registeredAt: new Date().toISOString() },
            error: new Error('Veuillez indiquer une adresse email valide.'),
        };
    }

    let supabaseSynced = false;
    if (isSupabaseConfigured()) {
        try {
            const effectivePassword =
                params.password && params.password.length >= 6
                    ? params.password
                    : generateCryptoPassportPassword();
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password: effectivePassword,
                options: {
                    data: {
                        full_name: cleanPseudo,
                        username: cleanPseudo,
                        experience_level: params.experienceLevel,
                    },
                },
            });
            if (!error || (error.message && error.message.toLowerCase().includes('already registered'))) {
                supabaseSynced = true;
            }
            if (data?.user && data?.session) {
                await ensureUserProfileSynced(data.user);
            }
        } catch {
            // La sauvegarde locale garantit que le joueur n'est pas bloqué en cas de micro-coupure
        }
    }

    const saved = savePlayerPassport({
        pseudo: cleanPseudo,
        email: cleanEmail,
        experienceLevel: params.experienceLevel,
        registeredAt: new Date().toISOString(),
        supabaseSynced,
    });

    return { passport: saved, error: null };
}

/**
 * Envoie un email de réinitialisation de mot de passe via Supabase Auth.
 */
export async function resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { error: new Error('Veuillez saisir une adresse email valide.') };
    }
    const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
    return { error };
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
