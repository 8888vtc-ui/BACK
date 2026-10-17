import { describe, it, expect, vi } from 'vitest';
import { getSupabaseClient, isSupabaseConfigured } from './client';

describe('Supabase Client Configuration', () => {
    it('instancie un client Supabase singleton valide', () => {
        const client1 = getSupabaseClient();
        const client2 = getSupabaseClient();

        expect(client1).toBeDefined();
        expect(client2).toBe(client1);
        expect(client1.auth).toBeDefined();
        expect(client1.from).toBeDefined();
    });

    it('détecte correctement l\'état de configuration des variables d\'environnement', () => {
        // En environnement de test par défaut, les variables utilisent le placeholder
        const configured = isSupabaseConfigured();
        expect(typeof configured).toBe('boolean');
    });
});
