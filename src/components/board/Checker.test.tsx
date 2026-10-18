import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Checker, BADGE_MIN_COUNT } from './Checker';

describe('Checker', () => {
    it('affiche le badge numérique quand countBadge >= 2', () => {
        const html = renderToStaticMarkup(
            <Checker color="white" countBadge={2} />,
        );
        expect(html).toContain('2');
    });

    it('affiche le badge numérique pour une grande pile', () => {
        const html = renderToStaticMarkup(
            <Checker color="black" countBadge={7} />,
        );
        expect(html).toContain('7');
    });

    it('n\'affiche pas de badge quand countBadge est absent', () => {
        const html = renderToStaticMarkup(<Checker color="white" />);
        expect(html).not.toContain('font-extrabold');
    });

    it('n\'affiche pas de badge quand countBadge < 2', () => {
        const html = renderToStaticMarkup(
            <Checker color="white" countBadge={1} />,
        );
        expect(html).not.toContain('font-extrabold');
    });

    it('expose un seuil BADGE_MIN_COUNT égal à 2', () => {
        expect(BADGE_MIN_COUNT).toBe(2);
    });
});
