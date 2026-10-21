import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LobbyView, SummaryView } from '../components/lobby/AppScreenViews';

/**
 * Test de non-régression — Hydratation SSR/CSR.
 *
 * Le rendu complet de `Home` est trop coûteux en environnement de test (moteur,
 * workers, Supabase). On vérifie donc les garanties structurelles qui préviennent
 * le `Hydration failed` :
 *
 *   1. `LobbyView` produit un HTML déterministe (aucune lecture localStorage).
 *   2. `SummaryView` produit un HTML déterministe.
 *   3. Aucune des deux vues ne contient la classe racine de la vue GAME.
 *   4. Aucune trace du bandeau « Tirage au sort » ni du bouton « Lancer les dés ».
 */

const noop = () => { };

describe('AppScreenViews — rendu SSR déterministe (anti-hydratation)', () => {
    it('LobbyView rend le lobby et jamais la vue GAME', () => {
        const html = renderToStaticMarkup(
            <LobbyView
                onStart={noop}
                onOpenModule={noop}
                initialMatchLength={7}
                initialCoachEnabled={true}
            />,
        );

        expect(html).toContain('BACKGAMMON');
        expect(html).toContain('lobby-card-ai');
        expect(html).toContain('lobby-card-multiplayer');
        expect(html).toContain('lobby-card-training');
        expect(html).toContain('lobby-start-btn');
        expect(html).not.toContain('h-dvh max-h-dvh w-full grid');
        expect(html).not.toContain('data-testid="app-game-view"');
    });

    it('LobbyView ne contient ni « Tirage au sort » ni « Lancer les dés »', () => {
        const html = renderToStaticMarkup(
            <LobbyView
                onStart={noop}
                onOpenModule={noop}
                initialMatchLength={7}
                initialCoachEnabled={true}
            />,
        );

        expect(html).not.toContain('Nouvelle Partie');
        expect(html).not.toContain('Tirage au sort');
        expect(html).not.toContain('Lancer les dés');
    });

    it('LobbyView produit un HTML identique sur deux rendus successifs', () => {
        const render = () =>
            renderToStaticMarkup(
                <LobbyView
                    onStart={noop}
                    onOpenModule={noop}
                    initialMatchLength={7}
                    initialCoachEnabled={true}
                />,
            );

        expect(render()).toBe(render());
    });

    it('SummaryView rend le résumé et jamais la vue GAME', () => {
        const html = renderToStaticMarkup(
            <SummaryView
                scoreX={7}
                scoreO={3}
                ambianceClass="bg-slate-950"
                onReviewBoard={noop}
                onBackToLobby={noop}
            />,
        );

        expect(html).toContain('data-testid="app-summary-view"');
        expect(html).toContain('Match terminé');
        expect(html).not.toContain('data-testid="app-game-view"');
    });

    it('SummaryView produit un HTML identique sur deux rendus successifs', () => {
        const render = () =>
            renderToStaticMarkup(
                <SummaryView
                    scoreX={7}
                    scoreO={3}
                    ambianceClass="bg-slate-950"
                    onReviewBoard={noop}
                    onBackToLobby={noop}
                />,
            );

        expect(render()).toBe(render());
    });
});
