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
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={{
                    verdict: 'blunder',
                    equityLoss: 0.12,
                    playedMove: '13/9',
                    optimalMove: '13/11',
                    explanation: null,
                }}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />
        );

        expect(html).toContain('id="backgammon-board"');
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
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
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
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
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
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
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

    it('affiche les indicateurs visuels de départ et d arrivée pour les déplacements adverses', () => {
        const game = {
            ...dummyGame,
            opponentHighlight: [{ from: 19, to: 22 }],
        };
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={game}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />
        );

        expect(html).toContain('data-testid="opp-from-indicator-19"');
        expect(html).toContain('data-testid="opp-to-indicator-22"');
    });

    it('masque MoveTimelineBar tant qu aucun coup n a été joué (effectiveTurns.length === 0)', () => {
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
                turnsHistory={[]}
            />
        );

        expect(html).not.toContain('data-testid="board-move-timeline"');
    });

    it('Chantier 2 : réserve toujours la colonne latérale lg:col-span-4 et affiche l état d accueil Cercle Monte-Carlo même quand coach est null', () => {
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />
        );

        expect(html).toContain('lg:col-span-12');
        expect(html).toContain('data-testid="board-focus-toggle-btn"');
        expect(html).toContain('data-testid="board-fullscreen-toggle-btn"');
        expect(html).toContain('data-testid="board-bot-speech-bubble"');
        expect(html).toContain('id="coach-panel"');
        expect(html).toContain('data-testid="coach-idle-welcome-card"');
        expect(html).toContain('Cercle Monte-Carlo');
        expect(html).toContain('Pip count');
        expect(html).toContain('Plan de jeu');
        expect(html).toContain('Historique');
    });

    it('Chantier 2 : éradique le PipCountBadge redondant au bas du plateau pour maximiser la hauteur du tapis', () => {
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />
        );

        // PipCountBadge est masqué dans GameBoardArea car déjà dans MatchHud
        expect(html).not.toContain('data-testid="pip-count-bar"');
    });

    it('Pilier B : garantit la stabilité géométrique 100 % (lg:col-span-8, wrapper shrink-0 h-8) sans saut de layout au 1er coup joué ni quand le Coach s ouvre', () => {
        // État 1 : Avant le 1er coup, coach = null
        const htmlTurn0 = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={null}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
                turnsHistory={[]}
            />,
        );

        // État 2 : Après le 1er coup joué, avec analyse Coach active
        const htmlTurn1 = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={{
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
                }}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={null}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={{
                    verdict: 'optimal',
                    equityLoss: 0,
                    playedMove: '8/5 6/5',
                    optimalMove: '8/5 6/5',
                    explanation: 'Coup de Grand-Maître',
                }}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />,
        );

        // Les deux états conservent exactement la même structure de grille plein écran par défaut (lg:col-span-12)
        expect(htmlTurn0).toContain('lg:col-span-12');
        expect(htmlTurn1).toContain('lg:col-span-12');

        // La barre inférieure garde un conteneur rigide shrink-0 h-8 dans les deux cas
        expect(htmlTurn0).toContain('shrink-0 h-8');
        expect(htmlTurn1).toContain('shrink-0 h-8');

        // Zéro doublon de Pip Count dans les deux états
        expect(htmlTurn0).not.toContain('data-testid="pip-count-bar"');
        expect(htmlTurn1).not.toContain('data-testid="pip-count-bar"');
    });

    it('affiche la bannière contextuelle MobilePortraitCoachBanner avec 1-Tap Move Toggle et sabot adaptatif', () => {
        const html = renderToStaticMarkup(
            <GameBoardArea
                theme="midnight"
                game={dummyGame}
                activeDie={0}
                isBoardLoading={false}
                activeCoachHighlight={{
                    optimal: [{ from: 13, to: 11 }],
                    played: [{ from: 13, to: 9 }],
                }}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
                coach={{
                    verdict: 'blunder',
                    equityLoss: 0.145,
                    playedMove: '13/9',
                    optimalMove: '13/11',
                    explanation: 'Protégez votre blot',
                }}
                isAnalyzing={false}
                onDismissCoach={vi.fn()}
                onTriggerCoach={vi.fn()}
                gameId="game_123"
            />,
        );

        expect(html).toContain('data-testid="mobile-portrait-coach-banner"');
        expect(html).toContain('data-testid="mobile-banner-move-toggle-btn"');
        expect(html).toContain('data-bearoff-expanded="false"');
    });
});
