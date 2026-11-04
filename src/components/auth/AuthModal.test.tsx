import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AuthModal from './AuthModal';

describe('AuthModal Component (Bi-Pane Grand Cercle)', () => {
    it('ne rend rien si isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={false} onClose={() => {}} />,
        );
        expect(html).toBe('');
    });

    it('affiche la modale Bi-Volet Grand Cercle sans mention Officiel ni Monte-Carlo et avec Quiz ER / PR', () => {
        const html = renderToStaticMarkup(
            <AuthModal isOpen={true} onClose={() => {}} />,
        );

        expect(html).toContain('Votre Carte de Joueur — Grand Cercle');
        expect(html).toContain('CARTE DE JOUEUR &amp; ANALYSE IA');
        expect(html).toContain('Continuer en 1 clic avec Google');
        expect(html).toContain('Accès Rapide');
        expect(html).toContain('Connexion');
        expect(html).toContain('Créer un compte');
        expect(html).toContain('passport-country-select');
        expect(html).toContain('passport-card-live-preview');
        expect(html).toContain('GRAND CERCLE BACKGAMMON');
        expect(html).toContain('CARTE MEMBRE');
        expect(html).toContain('Division Club · Compétition Amicale');
        expect(html).toContain('Quiz ER / PR');
        expect(html).not.toContain('Officiel');
        expect(html).not.toContain('Monte-Carlo');
        expect(html).not.toContain('Quizz');
    });
});
