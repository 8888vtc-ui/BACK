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

    it('renders skip links, scoreboard, and doubling controls', () => {
        const html = renderToStaticMarkup(
            <MatchHeader
                t={(k) => k}
                theme="midnight"
                onToggleTheme={vi.fn()}
                optimalStreak={3}
                brilliantMove={false}
                game={dummyGame}
                isBoardLoading={false}
                isMultiplayerActive={false}
                multiplayer={dummyMultiplayer}
                onOpenMultiplayer={vi.fn()}
                onOpenOpeningBook={vi.fn()}
                onOpenExportImport={vi.fn()}
                onOpenKnowledgeBase={vi.fn()}
                onTriggerCoach={vi.fn()}
                rollOffDone={true}
                rollOff={{ xDie: null, oDie: null, winner: null }}
                onRollOff={vi.fn()}
                openingEntry={null}
                onApplyOpeningMove={vi.fn()}
                onDismissOpening={vi.fn()}
                isOpeningHighlightActive={true}
                onToggleOpeningHighlight={vi.fn()}
                onChangeDifficulty={vi.fn()}
            />
        );

        expect(html).toContain('id="match-hud"');
        expect(html).toContain('optimal-streak-badge');
    });
});
