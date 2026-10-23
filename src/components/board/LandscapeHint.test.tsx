import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandscapeHint, LANDSCAPE_HINT_QUERY, LANDSCAPE_HINT_DISMISS_KEY } from './LandscapeHint';

describe('LandscapeHint', () => {
    it('ne rend rien au premier rendu (anti-hydratation SSR/CSR)', () => {
        const html = renderToStaticMarkup(<LandscapeHint />);
        expect(html).toBe('');
    });

    it('expose la media query mobile portrait et la clé de session', () => {
        expect(LANDSCAPE_HINT_QUERY).toBe('(orientation: portrait) and (max-width: 767px)');
        expect(LANDSCAPE_HINT_DISMISS_KEY).toBe('backgammon_landscape_hint_dismissed');
    });
});
