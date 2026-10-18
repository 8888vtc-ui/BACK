import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Die, DIE_PIPS } from './Die';

describe('DIE_PIPS', () => {
    it('contient les 6 faces avec le bon nombre de pips', () => {
        expect(DIE_PIPS[1]).toHaveLength(1);
        expect(DIE_PIPS[2]).toHaveLength(2);
        expect(DIE_PIPS[3]).toHaveLength(3);
        expect(DIE_PIPS[4]).toHaveLength(4);
        expect(DIE_PIPS[5]).toHaveLength(5);
        expect(DIE_PIPS[6]).toHaveLength(6);
    });
});

describe('Die', () => {
    it('rend un dé avec le bon nombre de pips (cercles)', () => {
        const html = renderToStaticMarkup(<Die value={6} />);
        // 6 cercles de pips
        const circles = (html.match(/<circle/g) || []).length;
        expect(circles).toBe(6);
    });

    it('rend un dé avec 1 pip pour la valeur 1', () => {
        const html = renderToStaticMarkup(<Die value={1} />);
        const circles = (html.match(/<circle/g) || []).length;
        expect(circles).toBe(1);
    });

    it('applique l\'état used (opacité réduite)', () => {
        const html = renderToStaticMarkup(<Die value={3} used />);
        expect(html).toContain('opacity-60');
    });

    it('applique l\'état active (ring sky)', () => {
        const html = renderToStaticMarkup(<Die value={3} active />);
        expect(html).toContain('ring-sky-400');
    });
});
