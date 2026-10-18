import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import HudScoreboard from './HudScoreboard';

describe('HudScoreboard Component', () => {
    it('affiche les scores de X et O et met en évidence le joueur au tour', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={3}
                scoreO={2}
                turn="X"
                dice={null}
                usedDice={[false, false]}
            />,
        );
        expect(html).toContain('Match en 7 pts');
        expect(html).toContain('X (Blanc)');
        expect(html).toContain('O (Noir)');
        expect(html).toContain('3');
        expect(html).toContain('2');
        expect(html).toContain('Au tour');
        expect(html).toContain('En attente du lancer');
    });

    it('affiche le badge Crawford si actif', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={7}
                scoreX={6}
                scoreO={2}
                turn="O"
                crawford={true}
                dice={[3, 1]}
                usedDice={[false, false]}
            />,
        );
        expect(html).toContain('Crawford');
    });

    it('affiche les doubles (4 dés) quand dice[0] === dice[1]', () => {
        const html = renderToStaticMarkup(
            <HudScoreboard
                matchLength={5}
                scoreX={1}
                scoreO={0}
                turn="X"
                dice={[6, 6]}
                usedDice={[true, false, false, false]}
                onRollDice={vi.fn()}
                onUndo={vi.fn()}
                canUndo={true}
            />,
        );
        expect(html).toContain('Coup 1');
        expect(html).toContain('Coup 4');
        expect(html).toContain('3/4');
        expect(html).toContain('Annuler');
    });
});
