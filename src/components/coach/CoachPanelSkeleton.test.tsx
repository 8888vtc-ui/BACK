import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CoachPanelSkeleton from './CoachPanelSkeleton';
import CoachPanel from './CoachPanel';

describe('CoachPanelSkeleton', () => {
    it('rend le skeleton de l’analyse avec rôle accessible et animation', () => {
        const html = renderToStaticMarkup(<CoachPanelSkeleton />);
        expect(html).toContain('role="status"');
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('animate-pulse');
        expect(html).toContain('Coach en Temps Réel');
        expect(html.replace(/&#x27;/g, "'")).toContain("Évaluation du coup par l'IA...");
    });

    it('supporte un message personnalisé pour le statut d’analyse', () => {
        const html = renderToStaticMarkup(<CoachPanelSkeleton message="Calcul de rollout 2-ply en cours..." />);
        expect(html).toContain('Calcul de rollout 2-ply en cours...');
        expect(html).toContain('aria-label="Calcul de rollout 2-ply en cours..."');
    });

    it('CoachPanel bascule sur CoachPanelSkeleton quand isLoading=true', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                explanation={null}
                onExplain={() => {}}
                onDismiss={() => {}}
                isLoading={true}
            />,
        );

        // Doit afficher le skeleton plutôt que le verdict final
        expect(html.replace(/&#x27;/g, "'")).toContain("Évaluation du coup par l'IA...");
        expect(html).toContain('animate-pulse');
        expect(html).not.toContain('24/20 13/11');
    });

    it('CoachPanel affiche le verdict normal quand isLoading=false', () => {
        const html = renderToStaticMarkup(
            <CoachPanel
                verdict="blunder"
                equityLoss={-0.125}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
                explanation={null}
                onExplain={() => {}}
                onDismiss={() => {}}
                isLoading={false}
            />,
        );

        expect(html).toContain('Blunder');
        expect(html).toContain('24/20 13/11');
        expect(html).toContain('8/4 6/4');
        expect(html).not.toContain("Évaluation du coup par l'IA...");
    });
});
