import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthModal from './AuthModal';

describe('AuthModal Component', () => {
    it('ne rend rien si isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={false} onClose={() => {}} />,
        );
        expect(html).toBe('');
    });

    it('affiche le modal avec le passeport joueur par défaut et OAuth Google quand isOpen est vrai', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={true} onClose={() => {}} />,
        );

        expect(html).toContain('Inscription rapide requise');
        expect(html).toContain('Continuer en 1 clic avec Google');
        expect(html).toContain('Accès Rapide');
        expect(html).toContain('Connexion');
        expect(html).toContain('Créer un compte');
    });
});
