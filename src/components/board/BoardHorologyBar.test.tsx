import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BoardHorologyBar from './BoardHorologyBar';

describe('BoardHorologyBar Component', () => {
    it('affiche le mode Consultation Replay complet (flèches, notation, toggle phase, rewind)', () => {
        const html = renderToStaticMarkup(
            <BoardHorologyBar
                totalTurns={12}
                replayIndex={3}
                isLive={false}
                selectedTurn={{
                    turnNumber: 4,
                    player: 'X',
                    dice: [5, 3],
                    boardBefore: new Array(26).fill(0),
                    boardAfter: new Array(26).fill(0),
                    moves: [{ from: 8, to: 3 }, { from: 6, to: 3 }],
                }}
                officialNotation="8/3 6/3"
                viewPhase="before"
                canStepPrev={true}
                canStepNext={true}
                onStepFirst={vi.fn()}
                onStepPrev={vi.fn()}
                onStepNext={vi.fn()}
                onReturnToLive={vi.fn()}
                onToggleViewPhase={vi.fn()}
                onRewindHere={vi.fn()}
            />
        );

        expect(html).toContain('data-testid="board-move-timeline"');
        expect(html).toContain('data-mode="replay"');
        expect(html).toContain('4 / 12');
        expect(html).toContain('8/3 6/3');
        expect(html).toContain('Consultation · Vous (Blanc) [5-3]');
        expect(html).toContain('data-testid="timeline-toggle-phase-btn"');
        expect(html).toContain('data-testid="timeline-rewind-here-btn"');
    });

    it('affiche la barre horlogère ultra-fine en mode Direct avec rival IA, PR et badges dopamine', () => {
        const html = renderToStaticMarkup(
            <BoardHorologyBar
                totalTurns={8}
                replayIndex={null}
                isLive={true}
                selectedTurn={null}
                officialNotation={null}
                viewPhase="before"
                canStepPrev={true}
                canStepNext={false}
                onStepFirst={vi.fn()}
                onStepPrev={vi.fn()}
                onStepNext={vi.fn()}
                onReturnToLive={vi.fn()}
                onToggleViewPhase={vi.fn()}
                difficulty="expert"
                cubeValue={2}
                coachHistory={[
                    {
                        turnIndex: 1,
                        coachState: {
                            verdict: 'optimal',
                            equityLoss: 0,
                            playedMove: '13/9',
                            optimalMove: '13/9',
                            explanation: null,
                            candidateMoves: [
                                { rank: 1, notation: '13/9', equity: 0.12, equityLoss: 0, winProbability: 0.52 },
                                { rank: 2, notation: '24/20', equity: 0.04, equityLoss: 0.08, winProbability: 0.44 },
                            ],
                        },
                        highlight: null,
                        boardBefore: new Array(26).fill(0),
                        boardAfter: new Array(26).fill(0),
                        dice: [4, 1],
                        timestamp: 1000,
                    },
                    {
                        turnIndex: 2,
                        coachState: {
                            verdict: 'optimal',
                            equityLoss: 0,
                            playedMove: '8/4',
                            optimalMove: '8/4',
                            explanation: null,
                        },
                        highlight: null,
                        boardBefore: new Array(26).fill(0),
                        boardAfter: new Array(26).fill(0),
                        dice: [3, 1],
                        timestamp: 2000,
                    },
                ]}
            />
        );

        expect(html).toContain('data-testid="board-move-timeline"');
        expect(html).toContain('data-mode="live"');
        expect(html).toContain('data-testid="dopamine-ai-rival-card"');
        expect(html).toContain('Victor « L’Homme d’Affaires »');
        expect(html).toContain('PR ~2.6');
        expect(html).toContain('data-testid="dopamine-combo-badge"');
        expect(html).toContain('x2');
        expect(html).toContain('data-testid="dopamine-cube-stakes"');
        expect(html).toContain('2×');
    });

    it('affiche le bouton Défi Ghost quand un blunder majeur existe dans l historique', () => {
        const onTriggerGhost = vi.fn();
        const html = renderToStaticMarkup(
            <BoardHorologyBar
                totalTurns={5}
                replayIndex={null}
                isLive={true}
                selectedTurn={null}
                officialNotation={null}
                viewPhase="before"
                canStepPrev={true}
                canStepNext={false}
                onStepFirst={vi.fn()}
                onStepPrev={vi.fn()}
                onStepNext={vi.fn()}
                onReturnToLive={vi.fn()}
                onToggleViewPhase={vi.fn()}
                onTriggerGhostChallenge={onTriggerGhost}
                coachHistory={[
                    {
                        turnIndex: 3,
                        coachState: {
                            verdict: 'blunder',
                            equityLoss: -0.145,
                            playedMove: '13/9',
                            optimalMove: '24/20',
                            explanation: null,
                        },
                        highlight: null,
                        boardBefore: new Array(26).fill(0),
                        boardAfter: new Array(26).fill(0),
                        dice: [4, 1],
                        timestamp: 3000,
                    },
                ]}
            />
        );

        expect(html).toContain('data-testid="dopamine-ghost-challenge-btn"');
        expect(html).toContain('Ghost #3');
    });
});
