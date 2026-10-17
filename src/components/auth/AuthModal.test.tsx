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

    it('affiche le modal avec les boutons OAuth Google et Apple quand isOpen est vrai', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={true} onClose={() => {}} />,
        );

        expect(html).toContain('Connexion au Tournoi');
        expect(html).toContain('Continuer avec Google');
        expect(html).toContain('Continuer avec Apple');
        expect(html).toContain('ou avec votre email');
        expect(html).toContain('Adresse email');
        expect(html).toContain('Mot de passe');
        expect(html).toContain('Se connecter');
    });

    it('affiche les onglets de bascule Connexion et Créer un compte', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={true} onClose={() => {}} />,
        );

        expect(html).toContain('Connexion');
        expect(html).toContain('Créer un compte');
    });
});
