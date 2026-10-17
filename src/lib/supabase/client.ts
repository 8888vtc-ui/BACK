/**
 * Client Supabase Browser & Isomorphe.
 *
 * Utilise @supabase/supabase-js avec typage strict Database.
 * Fournit une instanciation singleton avec fallback sécurisé en environnement de test / build.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Variables d'environnement standard Supabase Next.js
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-backgammon.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Indique si Supabase est correctement configuré avec de vraies variables d'environnement.
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
    );
}

/**
 * Retourne l'instance singleton du client Supabase.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
    if (cachedClient) {
        return cachedClient;
    }

    cachedClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: typeof window !== 'undefined',
            autoRefreshToken: typeof window !== 'undefined',
            detectSessionInUrl: typeof window !== 'undefined',
            storageKey: 'bg_supabase_auth_token',
        },
    });

    return cachedClient;
}

/**
 * Instance Supabase par défaut pour imports directs.
 */
export const supabase = getSupabaseClient();
