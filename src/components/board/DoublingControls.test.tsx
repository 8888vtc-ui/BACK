import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DoublingControls from './DoublingControls';

describe('DoublingControls', () => {
    const defaultProps = {
        phase: 'WAITING_FOR_ROLL' as const,
        cubeValue: 1,
        cubeOwner: null,
        canDouble: true,
        crawford: false,
        doublingOfferedBy: null,
        currentTurn: 'X' as const,
        onOfferDouble: vi.fn(),
        onTakeDouble: vi.fn(),
        onPassDouble: vi.fn(),
    };

    it('affiche le bouton Doubler avec la valeur cible lorsque le joueur peut doubler', () => {
        const html = renderToStaticMarkup(<DoublingControls {...defaultProps} />);

        expect(html).toContain('Doubler (2)');
        expect(html).toContain('Videau actuel :');
        expect(html).toContain('64 (neutre)');
    });

    it('affiche le bouton Doubler désactivé sous la règle de Crawford', () => {
        const html = renderToStaticMarkup(
            <DoublingControls {...defaultProps} canDouble={false} crawford={true} />,
        );

        expect(html).toContain('Règle de Crawford : le videau est suspendu pour cette manche');
        expect(html).toContain('cursor-not-allowed');
    });

    it('affiche la boîte de dialogue avec Prendre et Passer lors d’une proposition de videau', () => {
        const html = renderToStaticMarkup(
            <DoublingControls
                {...defaultProps}
                phase="DOUBLING_OFFERED"
                cubeValue={2}
                doublingOfferedBy="X"
            />,
        );

        expect(html).toContain('Proposition de videau : doubler à 4 !');
        expect(html).toContain('Joueur X');
        expect(html).toContain('Prendre (Take)');
        expect(html).toContain('Passer (Drop)');
    });

    it('affiche le bouton Doubler désactivé à Double Match Point (DMP)', () => {
        const html = renderToStaticMarkup(
            <DoublingControls {...defaultProps} canDouble={false} isDMP={true} />,
        );

        expect(html).toContain('Double Match Point (DMP) : le videau est désactivé');
        expect(html).toContain('cursor-not-allowed');
    });
});
