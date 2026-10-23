import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MatchTurnBar from './MatchTurnBar';
import type { GamePhase } from '../../hooks/useBackgammonGame';

describe('MatchTurnBar Component', () => {
    const defaultProps = {
        phase: 'WAITING_FOR_ROLL' as GamePhase,
        cubeValue: 1,
        cubeOwner: null,
        crawford: false,
        doublingOfferedBy: null,
        currentTurn: 'X' as const,
        canDouble: true,
        onTakeDouble: vi.fn(),
        onPassDouble: vi.fn(),
        onOfferDouble: vi.fn(),
    };

    it('ne rend rien quand aucune proposition de videau n’est en cours', () => {
        const html = renderToStaticMarkup(<MatchTurnBar {...defaultProps} />);
        expect(html).toBe('');
    });

    it('ne rend plus le bandeau « Tirage au sort » ni le bouton « Lancer les dés »', () => {
        const html = renderToStaticMarkup(<MatchTurnBar {...defaultProps} />);
        expect(html).not.toContain('Tirage au sort');
        expect(html).not.toContain('Lancer les dés');
        expect(html).not.toContain('roll-dice-btn');
        expect(html).not.toContain('Dernier coup');
    });

    it('affiche les contrôles Prendre / Passer quand un double est proposé', () => {
        const html = renderToStaticMarkup(
            <MatchTurnBar
                {...defaultProps}
                phase={'DOUBLING_OFFERED' as GamePhase}
                doublingOfferedBy="O"
            />,
        );
        expect(html).toContain('Proposition de videau');
        expect(html).toContain('Prendre');
        expect(html).toContain('Passer');
    });
});
