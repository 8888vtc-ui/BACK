import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    CoachMoveComparisonCard,
    classifyDecisionTier,
    getTierStyle,
} from './CoachMoveComparisonCard';

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

    it('affiche le bandeau IMPRÉCISION avec la perte d’équité pour un coup douteux', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="doubtful"
                equityLoss={-0.045}
                playedMove="5/2 9/8"
                optimalMove="5/2 6/5"
            />
        );
        expect(html).toContain('IMPRÉCISION (-0.045)');
        expect(html).toContain('data-tier="inaccuracy"');
        expect(html).toContain('5/2 9/8');
        expect(html).toContain('5/2 6/5');
    });

    it('affiche le bandeau BLUNDER MAJEUR avec mise en valeur', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.142}
                playedMove="24/20 13/11"
                optimalMove="8/4 6/4"
            />
        );
        expect(html).toContain('BLUNDER MAJEUR (-0.142)');
        expect(html).toContain('data-tier="blunder"');
        expect(html).toContain('24/20 13/11');
        expect(html).toContain('8/4 6/4');
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

    it('affiche le bouton « Rejouer ce tour sur le plateau » quand callback fourni', () => {
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
        expect(html).toContain('Rejouer ce tour sur le plateau');
        expect(html).toContain('data-testid="coach-replay-move-btn"');
    });

    it('attribue explicitement l’analyse au Joueur Blanc (X)', () => {
        const html = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.12}
                playedMove="13/8 13/9"
                optimalMove="24/20 13/9"
            />
        );
        expect(html).toContain('Blanc (X)');
        expect(html).toContain('Votre coup joué');
        expect(html).toContain('Meilleur coup Open Sage');
    });
});

describe('classifyDecisionTier & getTierStyle', () => {
    it('classe la perte d’équité selon les 4 paliers officiels', () => {
        expect(classifyDecisionTier(0)).toBe('optimal');
        expect(classifyDecisionTier(-0.01)).toBe('optimal');
        expect(classifyDecisionTier(-0.015)).toBe('good');
        expect(classifyDecisionTier(-0.02)).toBe('good');
        expect(classifyDecisionTier(-0.045)).toBe('inaccuracy');
        expect(classifyDecisionTier(-0.08)).toBe('inaccuracy');
        expect(classifyDecisionTier(-0.142)).toBe('blunder');
        expect(classifyDecisionTier(null)).toBe('optimal');
    });

    it('retourne les libellés français des 4 paliers', () => {
        expect(getTierStyle('optimal', false).label).toBe('COUP OPTIMAL');
        expect(getTierStyle('good', false).label).toBe('BON COUP');
        expect(getTierStyle('inaccuracy', false).label).toBe('IMPRÉCISION');
        expect(getTierStyle('blunder', false).label).toBe('BLUNDER MAJEUR');
    });
});
