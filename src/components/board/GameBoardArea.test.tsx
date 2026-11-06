import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameBoardArea, { type GameBoardAreaProps } from './GameBoardArea';
import { createInitialState } from '../../engine/backgammonEngine';
import type { UseBackgammonGameReturn } from '../../hooks/useBackgammonGame';

describe('GameBoardArea Component', () => {
    const dummyGame = {
        state: createInitialState(7),
        leftDieTargets: new Map(),
        rightDieTargets: new Map(),
        selected: null,
        usedDice: [false, false] as [boolean, boolean],
        lastOpponentDice: null,
        opponentHighlight: null,
        canDouble: true,
        undoMove: vi.fn(),
        isRolling: false,
        rollDice: vi.fn(),
        playMove: vi.fn(),
        swapDice: vi.fn(),
        resetGame: vi.fn(),
        offerDouble: vi.fn(),
        acceptDouble: vi.fn(),
        passDouble: vi.fn(),
        togglePipCount: vi.fn(),
        showPipCount: true,
        matchLog: [],
        difficulty: 'expert' as const,
        setDifficulty: vi.fn(),
    } as unknown as UseBackgammonGameReturn;

    function renderArea(overrides: Partial<GameBoardAreaProps> = {}) {
        const defaultProps: GameBoardAreaProps = {
            theme: 'midnight',
            game: dummyGame,
            activeDie: 0,
            isBoardLoading: false,
            activeCoachHighlight: null,
            onCheckerClick: vi.fn(),
            onCheckerRightClick: vi.fn(),
            onDestinationClick: vi.fn(),
            onPlayMove: vi.fn(),
            onSelectDie: vi.fn(),
            onDeselect: vi.fn(),
            coach: null,
            isAnalyzing: false,
            onDismissCoach: vi.fn(),
            onTriggerCoach: vi.fn(),
            gameId: 'game_123',
        };
        return renderToStaticMarkup(<GameBoardArea {...defaultProps} {...overrides} />);
    }

    it('renders board boundary and frees right space (zero coach-panel on board)', () => {
        const html = renderArea({
            coach: {
                verdict: 'blunder',
                equityLoss: 0.12,
                playedMove: '13/9',
                optimalMove: '13/11',
                explanation: null,
            },
        });
        expect(html).toContain('id="backgammon-board"');
        expect(html).not.toContain('id="coach-panel"');
    });

    it('positionne le videau au centre quand cubeOwner est null', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: null, cubeValue: 1 },
        } as UseBackgammonGameReturn;
        const html = renderArea({ game });
        expect(html).toContain('data-testid="bar-zone-middle"');
        const middleZoneHtml = html.split('data-testid="bar-zone-middle"')[1].split('data-testid="bar-zone-bottom"')[0];
        expect(middleZoneHtml).toContain('data-testid="doubling-cube"');
    });

    it('positionne le videau en haut côté Joueur O quand O possède le videau', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: 'O' as const, cubeValue: 2 },
        } as UseBackgammonGameReturn;
        const html = renderArea({ game });
        const topZoneHtml = html.split('data-testid="bar-zone-top"')[1].split('data-testid="bar-zone-middle"')[0];
        expect(topZoneHtml).toContain('data-testid="doubling-cube"');
    });

    it('positionne le videau en bas côté Joueur X quand X possède le videau', () => {
        const game = {
            ...dummyGame,
            state: { ...dummyGame.state, cubeOwner: 'X' as const, cubeValue: 2 },
        } as UseBackgammonGameReturn;
        const html = renderArea({ game });
        const bottomZoneHtml = html.split('data-testid="bar-zone-bottom"')[1].split('</div>')[0];
        expect(bottomZoneHtml).toContain('data-testid="doubling-cube"');
    });

    it('affiche les indicateurs visuels de départ et d arrivée pour les déplacements adverses', () => {
        const game = {
            ...dummyGame,
            opponentHighlight: [{ from: 19, to: 22 }],
        } as UseBackgammonGameReturn;
        const html = renderArea({ game });
        expect(html).toContain('data-testid="opp-from-indicator-19"');
        expect(html).toContain('data-testid="opp-to-indicator-22"');
    });

    it('masque MoveTimelineBar tant qu aucun coup n a été joué (effectiveTurns.length === 0)', () => {
        const html = renderArea({ turnsHistory: [] });
        expect(html).not.toContain('data-testid="board-move-timeline"');
    });

    it('Prompt 21 : le plateau occupe 100% de la largeur sans colonne Coach latérale', () => {
        const html = renderArea();
        expect(html).toContain('data-testid="board-main-column"');
        expect(html).toContain('data-testid="board-focus-toggle-btn"');
        expect(html).toContain('data-testid="board-fullscreen-toggle-btn"');
        expect(html).toContain('data-testid="board-bot-speech-bubble"');
        expect(html).not.toContain('id="coach-panel"');
        expect(html).not.toContain('data-testid="board-coach-column"');
    });

    it('Chantier 2 : éradique le PipCountBadge redondant au bas du plateau pour maximiser la hauteur du tapis', () => {
        const html = renderArea();
        expect(html).not.toContain('data-testid="pip-count-bar"');
    });

    it('Pilier B : garantit la stabilité géométrique 100 % plein écran sans colonne parasite au 1er coup joué', () => {
        const htmlTurn0 = renderArea({ turnsHistory: [] });
        const htmlTurn1 = renderArea({
            game: {
                ...dummyGame,
                matchLog: [
                    {
                        turnIndex: 1,
                        player: 'X',
                        dice: [3, 1],
                        boardBefore: createInitialState(7).board,
                        boardAfter: createInitialState(7).board,
                        movePlayed: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
                    },
                ],
            } as UseBackgammonGameReturn,
            coach: {
                verdict: 'optimal',
                equityLoss: 0,
                playedMove: '8/5 6/5',
                optimalMove: '8/5 6/5',
                explanation: 'Coup de Grand-Maître',
            },
        });

        expect(htmlTurn0).toContain('data-testid="board-main-column"');
        expect(htmlTurn1).toContain('data-testid="board-main-column"');
        expect(htmlTurn0).not.toContain('data-testid="board-coach-column"');
        expect(htmlTurn1).not.toContain('data-testid="board-coach-column"');
        expect(htmlTurn0).not.toContain('data-testid="pip-count-bar"');
        expect(htmlTurn1).not.toContain('data-testid="pip-count-bar"');
    });

    it('affiche la bannière contextuelle MobilePortraitCoachBanner avec 1-Tap Move Toggle et sabot adaptatif', () => {
        const html = renderArea({
            activeCoachHighlight: {
                optimal: [{ from: 13, to: 11 }],
                played: [{ from: 13, to: 9 }],
            },
            coach: {
                verdict: 'blunder',
                equityLoss: 0.145,
                playedMove: '13/9',
                optimalMove: '13/11',
                explanation: 'Protégez votre blot',
            },
        });
        expect(html).toContain('data-testid="mobile-portrait-coach-banner"');
        expect(html).toContain('data-testid="mobile-banner-move-toggle-btn"');
        expect(html).toContain('data-bearoff-expanded="false"');
    });
});
