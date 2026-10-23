import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoardCenterControls } from './BoardCenterControls';

const noop = () => { };

const render = (extra: Partial<React.ComponentProps<typeof BoardCenterControls>> = {}) =>
    renderToStaticMarkup(
        <BoardCenterControls
            gamePhase="HUMAN_WAITING_ROLL"
            onRoll={noop}
            onConfirm={noop}
            onUndo={noop}
            canUndo={false}
            canConfirm={false}
            hasDice={false}
            {...extra}
        />,
    );

describe('BoardCenterControls — sélecteur de cadence', () => {
    it('n’affiche pas le sélecteur sans callback', () => {
        expect(render()).not.toContain('cycle-game-speed-btn');
    });

    it('affiche la cadence courante (Blitz)', () => {
        const html = render({ gameSpeed: 'blitz', onCycleGameSpeed: noop });
        expect(html).toContain('data-testid="cycle-game-speed-btn"');
        expect(html).toContain('data-speed="blitz"');
        expect(html).toContain('Blitz');
    });

    it('utilise Tournoi par défaut', () => {
        const html = render({ onCycleGameSpeed: noop });
        expect(html).toContain('data-speed="tournament"');
    });

    it('expose le badge du mode autoConfirmTurn étendu et le bouton du menu rapide', () => {
        const html = render({
            autoConfirmMode: 'forced_only',
            onSelectAutoConfirmMode: noop,
            onToggleAutoConfirm: noop,
        });
        expect(html).toContain('data-auto-confirm-mode="forced_only"');
        expect(html).toContain('FORCÉ');
        expect(html).toContain('data-testid="auto-confirm-mode-menu-btn"');
    });
});
