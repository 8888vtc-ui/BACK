// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import MoveTimelineBar from './MoveTimelineBar';

afterEach(() => {
    cleanup();
});

describe('MoveTimelineBar', () => {
    it('affiche le mode Direct quand isLive vaut true', () => {
        const { getByTestId } = render(
            <MoveTimelineBar
                totalTurns={3}
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
            />,
        );
        expect(getByTestId('board-move-timeline').getAttribute('data-mode')).toBe('live');
        expect(getByTestId('timeline-step-counter').textContent).toContain('Coup 3 / 3');
    });

    it('affiche les 5 contrôles de navigation temporelle et permet de naviguer en mode Replay', () => {
        const onStepFirst = vi.fn();
        const onStepPrev = vi.fn();
        const onStepNext = vi.fn();
        const onReturnToLive = vi.fn();
        const onToggleViewPhase = vi.fn();

        const { getByTestId } = render(
            <MoveTimelineBar
                totalTurns={4}
                replayIndex={1}
                isLive={false}
                selectedTurn={{
                    turnNumber: 1,
                    player: 'X',
                    dice: [6, 1],
                    boardBefore: new Array(26).fill(0),
                    boardAfter: new Array(26).fill(0),
                    moves: [{ from: 13, to: 7 }, { from: 8, to: 7 }],
                }}
                officialNotation="13/7 8/7"
                viewPhase="before"
                canStepPrev={true}
                canStepNext={true}
                onStepFirst={onStepFirst}
                onStepPrev={onStepPrev}
                onStepNext={onStepNext}
                onReturnToLive={onReturnToLive}
                onToggleViewPhase={onToggleViewPhase}
            />,
        );

        expect(getByTestId('board-move-timeline').getAttribute('data-mode')).toBe('replay');
        expect(getByTestId('timeline-step-counter').textContent).toContain('Coup 2 / 4');
        expect(getByTestId('timeline-move-notation').textContent).toBe('13/7 8/7');

        fireEvent.click(getByTestId('timeline-btn-first'));
        expect(onStepFirst).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('timeline-btn-prev'));
        expect(onStepPrev).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('timeline-btn-next'));
        expect(onStepNext).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('timeline-btn-live'));
        expect(onReturnToLive).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('timeline-toggle-phase-btn'));
        expect(onToggleViewPhase).toHaveBeenCalledTimes(1);
    });
});
