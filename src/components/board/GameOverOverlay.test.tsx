import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameOverOverlay from './GameOverOverlay';

describe('GameOverOverlay', () => {
    const defaultProps = {
        result: {
            winner: 'X' as const,
            loser: 'O' as const,
            winType: 'gammon' as const,
            multiplier: 2,
            pointsWon: 4,
        },
        scoreX: 4,
        scoreO: 2,
        matchLength: 7,
        isMatchOver: false,
        matchWinner: null,
        isCrawfordNext: false,
        onNextGame: vi.fn(),
        onResetMatch: vi.fn(),
    };

    it('affiche le vainqueur, le type de victoire et les points remportés', () => {
        const html = renderToStaticMarkup(<GameOverOverlay {...defaultProps} />);

        expect(html).toContain('Manche remportée par le Joueur X !');
        expect(html).toContain('GAMMON (2x)');
        expect(html).toContain('+4 points');
    });

    it('affiche la progression des scores du match', () => {
        const html = renderToStaticMarkup(<GameOverOverlay {...defaultProps} />);

        expect(html).toContain('Vous · Joueur X (Blanc)');
        expect(html).toContain('4 / 7');
        expect(html).toContain('IA · Joueur O (Noir)');
        expect(html).toContain('2 / 7');
    });

    it('affiche l’avertissement Crawford quand la prochaine manche est Crawford', () => {
        const html = renderToStaticMarkup(
            <GameOverOverlay {...defaultProps} isCrawfordNext={true} />,
        );

        expect(html).toContain('Règle de Crawford :');
        expect(html).toContain('Le videau sera suspendu pour la prochaine manche.');
    });

    it('affiche le bouton Manche Suivante si le match est toujours en cours', () => {
        const html = renderToStaticMarkup(<GameOverOverlay {...defaultProps} />);

        expect(html).toContain('Manche Suivante');
    });

    it('affiche la bannière de fin de match et le bouton Nouveau Match quand le match est terminé', () => {
        const html = renderToStaticMarkup(
            <GameOverOverlay
                {...defaultProps}
                scoreX={7}
                isMatchOver={true}
                matchWinner="X"
            />,
        );

        expect(html).toContain('Victoire du Match : Joueur X !');
        expect(html).toContain('Nouveau Match');
    });

    it('gère correctement les victoires par abandon de videau (pass)', () => {
        const html = renderToStaticMarkup(
            <GameOverOverlay
                {...defaultProps}
                result={{
                    winner: 'O',
                    loser: 'X',
                    winType: 'pass',
                    multiplier: 1,
                    pointsWon: 2,
                }}
            />,
        );

        expect(html).toContain('ABANDON DU VIDEAU');
        expect(html).toContain('+2 points');
    });
});
