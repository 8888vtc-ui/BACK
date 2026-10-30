import { describe, it, expect } from 'vitest';
import {
    extractGoogleUserMetadata,
    sanitizeAuthRedirectPath,
    exchangeOAuthCodeForSession,
} from './auth';

describe('Supabase Google / Gmail OAuth Helpers (auth.ts)', () => {
    it('extrait correctement le nom complet, le pseudo et la photo Gmail (picture ou avatar_url)', () => {
        const meta = extractGoogleUserMetadata({
            id: 'a1b2c3d4-9999-4000-8000-000000000000',
            email: 'champion.monaco@gmail.com',
            user_metadata: {
                full_name: 'Laurent Monte-Carlo',
                picture: 'https://lh3.googleusercontent.com/a/avatar-gmail',
            },
        });

        expect(meta).toEqual({
            username: 'champion.monaco_a1b2',
            displayName: 'Laurent Monte-Carlo',
            avatarUrl: 'https://lh3.googleusercontent.com/a/avatar-gmail',
            email: 'champion.monaco@gmail.com',
        });
    });

    it('utilise des valeurs de repli propres si Google ne fournit que le champ name', () => {
        const meta = extractGoogleUserMetadata({
            id: 'f9e8d7c6-1111-4000-8000-000000000000',
            email: 'club.player@gmail.com',
            user_metadata: {
                name: 'Club Player',
            },
        });

        expect(meta.displayName).toBe('Club Player');
        expect(meta.username).toBe('club.player_f9e8');
        expect(meta.avatarUrl).toBeNull();
    });

    it('bloque toute tentative d’Open Redirect dans sanitizeAuthRedirectPath', () => {
        expect(sanitizeAuthRedirectPath('/tournaments')).toBe('/tournaments');
        expect(sanitizeAuthRedirectPath('/tournaments?lang=fr')).toBe('/tournaments?lang=fr');
        expect(sanitizeAuthRedirectPath('https://evil.example.com')).toBe('/');
        expect(sanitizeAuthRedirectPath('//evil.example.com')).toBe('/');
        expect(sanitizeAuthRedirectPath(null)).toBe('/');
        expect(sanitizeAuthRedirectPath('')).toBe('/');
    });

    it('retourne une erreur explicite si le code OAuth est vide', async () => {
        const res = await exchangeOAuthCodeForSession('   ');
        expect(res.session).toBeNull();
        expect(res.error?.message).toContain('Code OAuth manquant');
    });
});
