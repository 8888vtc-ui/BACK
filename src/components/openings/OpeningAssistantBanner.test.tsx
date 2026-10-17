import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OpeningAssistantBanner } from './OpeningAssistantBanner';
import { getOpening } from '../../features/openings/openingDatabase';

describe('OpeningAssistantBanner', () => {
    const opening31 = getOpening(3, 1)!;
    const opening65 = getOpening(6, 5)!;

    it('affiche le coup recommandé 3-1, le nom emblématique et la catégorie', () => {
        const html = renderToStaticMarkup(
            <OpeningAssistantBanner
                opening={opening31}
                onApplyMove={vi.fn()}
                onExploreBook={vi.fn()}
                onDismiss={vi.fn()}
                isHighlighted={true}
            />,
        );

        expect(html).toContain('Opening Book Certifié');
        expect(html).toContain('Le Point d’Or (Golden Point)');
        expect(html).toContain('Faire une porte');
        expect(html).toContain('8/5 6/5');
        expect(html).toContain('+0.165');
        expect(html).toContain('58.2%');
        expect(html).toContain('data-testid="apply-opening-btn"');
        expect(html).toContain('data-testid="explore-book-btn"');
        expect(html).toContain('data-testid="dismiss-opening-btn"');
    });

    it('affiche correctement le coup d’échappée 6-5 Lover’s Leap', () => {
        const html = renderToStaticMarkup(
            <OpeningAssistantBanner
                opening={opening65}
                onApplyMove={vi.fn()}
                onExploreBook={vi.fn()}
                onDismiss={vi.fn()}
                isHighlighted={false}
            />,
        );

        expect(html).toContain('Le Grand Saut de l’Amant (Lover’s Leap)');
        expect(html).toContain('Échappée &amp; Course');
        expect(html).toContain('24/13');
        expect(html).toContain('+0.112');
        expect(html).toContain('56.1%');
        expect(html).toContain('Jouer 24/13');
    });

    it('inclut le bouton d’activation de la surbrillance si un gestionnaire est fourni', () => {
        const html = renderToStaticMarkup(
            <OpeningAssistantBanner
                opening={opening31}
                onApplyMove={vi.fn()}
                onExploreBook={vi.fn()}
                onDismiss={vi.fn()}
                isHighlighted={true}
                onToggleHighlight={vi.fn()}
            />,
        );

        expect(html).toContain('👁️');
    });
});
