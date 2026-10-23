import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoardDiceRiver } from './BoardDiceRiver';
import { BoardFrame } from './BoardFrame';
import { BOARD_THEME_TOKENS, getBoardThemeTokens } from './boardThemes';

describe('BoardDiceRiver — doubles', () => {
    it('affiche 2 dés pour un lancer normal', () => {
        const html = renderToStaticMarkup(
            <BoardDiceRiver dice={[3, 5]} usedDice={[false, false]} selectedDie={null} />,
        );
        expect((html.match(/data-testid="board-die-\d"/g) ?? []).length).toBe(2);
    });

    it('affiche 4 dés pour un double, avec leur état used propre', () => {
        const html = renderToStaticMarkup(
            <BoardDiceRiver
                dice={[4, 4]}
                usedDice={[true, true, false, false]}
                selectedDie={null}
            />,
        );
        expect((html.match(/data-testid="board-die-\d"/g) ?? []).length).toBe(4);
        expect((html.match(/opacity-40/g) ?? []).length).toBe(2);
    });
});

describe('Thèmes du plateau', () => {
    it('chaque thème fournit des tokens distincts', () => {
        const felts = new Set(Object.values(BOARD_THEME_TOKENS).map((t) => t.felt.backgroundColor));
        expect(felts.size).toBe(4);
    });

    it('retombe sur snowie_classic pour un thème inconnu', () => {
        expect(getBoardThemeTokens('inconnu')).toBe(BOARD_THEME_TOKENS.snowie_classic);
        expect(getBoardThemeTokens(undefined)).toBe(BOARD_THEME_TOKENS.snowie_classic);
    });

    it('BoardFrame applique le thème demandé', () => {
        const html = renderToStaticMarkup(<BoardFrame theme="galaxy_void">x</BoardFrame>);
        expect(html).toContain('#14101f');
        const def = renderToStaticMarkup(<BoardFrame>x</BoardFrame>);
        expect(def).toContain('#3d2110');
    });
});
