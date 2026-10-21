import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MatchHeader from './MatchHeader';
import { createInitialState } from '../../engine/backgammonEngine';

describe('MatchHeader Component', () => {
    const dummyGame: any = {
        state: createInitialState(7),
        phase: 'WAITING_FOR_ROLL',
        dice: null,
        usedDice: [false, false],
        isHumanTurn: true,
        canDouble: true,
        canUndo: false,
        difficulty: 'expert',
        opponentStatusMessage: null,
        lastOpponentDice: null,
        lastOpponentMoves: null,
        doublingOfferedBy: null,
        rollDice: vi.fn(),
        offerDouble: vi.fn(),
        takeDouble: vi.fn(),
        passDouble: vi.fn(),
        undoMove: vi.fn(),
        resetMatch: vi.fn(),
    };

    const dummyMultiplayer: any = {
        status: 'idle',
        matchInfo: null,
        opponentProfile: null,
        localProfile: null,
        recoverableSession: null,
        isMyTurn: false,
    };

    it('renders skip links, scoreboard and the lobby button', () => {
        const html = renderToStaticMarkup(
            <MatchHeader
                t={(k) => k}
                theme="midnight"
                onToggleTheme={vi.fn()}
                game={dummyGame}
                isMultiplayerActive={false}
                multiplayer={dummyMultiplayer}
                onOpenExportImport={vi.fn()}
                onTriggerCoach={vi.fn()}
            />
        );

        expect(html).toContain('id="match-hud"');
        expect(html).toContain('data-testid="hud-back-to-lobby-btn"');
        expect(html).toContain('data-testid="hud-settings-toggle-btn"');
    });

    it('ne contient plus les badges de dopamine ni le bouton de debug', () => {
        const html = renderToStaticMarkup(
            <MatchHeader
                t={(k) => k}
                theme="midnight"
                onToggleTheme={vi.fn()}
                game={dummyGame}
                isMultiplayerActive={false}
                multiplayer={dummyMultiplayer}
                onOpenExportImport={vi.fn()}
                onTriggerCoach={vi.fn()}
            />
        );

        expect(html).not.toContain('optimal-streak-badge');
        expect(html).not.toContain('brilliant-move-badge');
        expect(html).not.toContain('copy-debug-btn');
    });
});
