import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CoachMoveComparisonCard } from './CoachMoveComparisonCard';

describe('CoachMoveComparisonCard', () => {
    it('ne rend rien si verdict est null', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict={null}
                equityLoss={null}
                playedMove={null}
                optimalMove={null}
            />
        );
        expect(html).toBe('');
    });

    it('affiche un libellé clair et vulgarisé pour un coup douteux', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="doubtful"
                equityLoss={-0.08}
                playedMove="5/2 9/8"
                optimalMove="5/2 6/5"
            />
        );
        expect(html).toContain('Coup Imprécis (Douteux)');
        expect(html).toContain('5/2 9/8');
        expect(html).toContain('5/2 6/5');
        expect(html).toContain('0.080');
    });

    it('affiche le diagnostic Blunder avec mise en valeur', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.21}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
            />
        );
        expect(html).toContain('Gaffe Majeure');
        expect(html).toContain('24/20 13/11');
        expect(html).toContain('8/4 6/4');
        expect(html).toContain('0.210');
    });

    it('affiche les explications de causes et de bénéfices (whyFailed & whyOptimal)', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="doubtful"
                equityLoss={-0.08}
                playedMove="5/2 9/8"
                optimalMove="5/2 6/5"
                whyFailed="Laisse 17 chances de frappe"
                whyOptimal="Protège les pions et consolide l'ancre"
            />
        );
        expect(html).toContain('Laisse 17 chances de frappe');
        expect(html).toContain('Protège les pions et consolide');
    });

    it('affiche le bouton rejouer quand callback fourni', () => {
        const onReplay = vi.fn();
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.15}
                playedMove="13/8"
                optimalMove="6/1"
                onReplayMove={onReplay}
            />
        );
        expect(html).toContain('Rejouer le bon coup');
    });

    it('affiche l attribution explicite au Joueur Blanc (X)', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.12}
                playedMove="13/8 13/9"
                optimalMove="24/20 13/9"
            />
        );
        expect(html).toContain('Analyse de votre décision — Joueur Blanc (X)');
    });
});
