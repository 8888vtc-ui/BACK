import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PipCountBadge, computePipDiff, isLeading, getSavedPipCountVisibility } from './PipCountBadge';

describe('computePipDiff', () => {
    it('retourne un différentiel négatif quand X a moins de pips (avance)', () => {
        expect(computePipDiff(150, 160)).toBe(-10);
    });

    it('retourne un différentiel positif quand X a plus de pips (retard)', () => {
        expect(computePipDiff(160, 150)).toBe(10);
    });

    it('retourne zéro à égalité', () => {
        expect(computePipDiff(167, 167)).toBe(0);
    });
});

describe('isLeading', () => {
    it('X est en avance quand diff < 0 (pip plus bas)', () => {
        expect(isLeading(-10, 'X')).toBe(true);
    });

    it('X est en retard quand diff > 0', () => {
        expect(isLeading(10, 'X')).toBe(false);
    });

    it('O est en avance quand diff > 0 (pip X plus haut)', () => {
        expect(isLeading(10, 'O')).toBe(true);
    });

    it('O est en retard quand diff < 0', () => {
        expect(isLeading(-10, 'O')).toBe(false);
    });

    it('égalité → pas en avance', () => {
        expect(isLeading(0, 'X')).toBe(false);
        expect(isLeading(0, 'O')).toBe(false);
    });
});

describe('getSavedPipCountVisibility', () => {
    it('retourne defaultValue si localStorage est indisponible ou non défini', () => {
        expect(getSavedPipCountVisibility(true)).toBe(true);
        expect(getSavedPipCountVisibility(false)).toBe(false);
    });
});

describe('PipCountBadge (Rendu)', () => {
    it('affiche les comptes de pips pour O et X', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={150} pipO={160} turn="X" />);
        expect(html).toContain('O : 160');
        expect(html).toContain('X : 150');
        expect(html).toContain('data-testid="pip-diff-badge"');
        expect(html).toContain('data-testid="pip-count-toggle"');
    });

    it('affiche le différentiel vert quand le joueur au trait mène', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={140} pipO={160} turn="X" />);
        expect(html).toContain('bg-emerald-500/20');
        expect(html).toContain('20');
    });

    it('affiche le différentiel rouge quand le joueur au trait est en retard', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={160} pipO={140} turn="X" />);
        expect(html).toContain('bg-rose-500/20');
        expect(html).toContain('20');
    });
});
