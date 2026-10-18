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

    it('positionne le videau au centre quand cubeOwner est null', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: null, cubeValue: 1 },
        };
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={game}
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
        expect(html).toContain('data-testid="bar-zone-middle"');
        // The middle zone must contain the doubling cube
        const middleZoneHtml = html.split('data-testid="bar-zone-middle"')[1].split('data-testid="bar-zone-bottom"')[0];
        expect(middleZoneHtml).toContain('data-testid="doubling-cube"');
    });

    it('positionne le videau en haut côté Joueur O quand O possède le videau', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: 'O' as const, cubeValue: 2 },
        };
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={game}
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
        const topZoneHtml = html.split('data-testid="bar-zone-top"')[1].split('data-testid="bar-zone-middle"')[0];
        expect(topZoneHtml).toContain('data-testid="doubling-cube"');
    });

    it('positionne le videau en bas côté Joueur X quand X possède le videau', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: 'X' as const, cubeValue: 2 },
        };
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={game}
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
        const bottomZoneHtml = html.split('data-testid="bar-zone-bottom"')[1].split('</div>')[0];
        expect(bottomZoneHtml).toContain('data-testid="doubling-cube"');
    });
});
