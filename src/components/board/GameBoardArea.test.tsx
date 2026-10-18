import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameBoardArea from './GameBoardArea';
import { createInitialState } from '../../engine/backgammonEngine';

describe('GameBoardArea Component', () => {
    const dummyGame: any = {
        state: createInitialState(7),
        leftDieTargets: new Map(),
        rightDieTargets: new Map(),
        selected: null,
        usedDice: [false, false],
        lastOpponentDice: null,
        opponentHighlight: null,
        canDouble: true,
        undoMove: vi.fn(),
    };

    it('renders board boundary and coach sidebar', () => {
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerDoubleClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDieDoubleClick={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />
        );

        expect(html).toContain('id="coach-panel"');
    });
});
