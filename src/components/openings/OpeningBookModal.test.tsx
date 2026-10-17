import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OpeningBookModal } from './OpeningBookModal';

describe('OpeningBookModal', () => {
    it('ne produit aucun balisage lorsque isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <OpeningBookModal
                isOpen={false}
                onClose={vi.fn()}
            />,
        );
        expect(html).toBe('');
    });

    it('affiche le catalogue complet des 15 ouvertures, les catégories et la fiche détaillée', () => {
        const html = renderToStaticMarkup(
            <OpeningBookModal
                isOpen={true}
                onClose={vi.fn()}
                initialOpeningId="opening_3_1"
            />,
        );

        expect(html).toContain('Bibliothèque d’Ouvertures');
        expect(html).toContain('15 Jets Officiels');
        expect(html).toContain('Faire une porte');
        expect(html).toContain('Échappée &amp; Course');
        expect(html).toContain('Split &amp; Slot');
        expect(html).toContain('Développement');

        // Cartes d'ouverture dans la liste
        expect(html).toContain('data-testid="opening-card-3-1"');
        expect(html).toContain('data-testid="opening-card-6-5"');
        expect(html).toContain('data-testid="opening-card-4-2"');

        // Détails de l'ouverture 3-1 sélectionnée
        expect(html).toContain('Le Point d’Or (Golden Point)');
        expect(html).toContain('8/5 6/5');
        expect(html).toContain('Flèche 8 ➔ Flèche 5');
        expect(html).toContain('+0.165');
        expect(html).toContain('58.2%');
        expect(html).toContain('Principe Fondamental');
        expect(html).toContain('Alternatives &amp; Pertes d’Équité');
        expect(html).toContain('Blunder majeur');

        // Bouton de fermeture
        expect(html).toContain('data-testid="close-opening-book-btn"');
    });

    it('affiche le bouton d’application en partie si un coup d’ouverture est actif', () => {
        const html = renderToStaticMarkup(
            <OpeningBookModal
                isOpen={true}
                onClose={vi.fn()}
                initialOpeningId="opening_4_2"
                onApplyMove={vi.fn()}
                isOpeningTurnActive={true}
            />,
        );

        expect(html).toContain('La Porte 4 (Inner Home Door)');
        expect(html).toContain('8/4 6/4');
        expect(html).toContain('Appliquer en partie');
    });
});
