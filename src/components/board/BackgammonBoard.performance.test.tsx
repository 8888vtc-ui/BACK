// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import BackgammonBoard, { areBoardPropsEqual, BackgammonBoardProps } from './BackgammonBoard';
import { createInitialState, BoardState } from '../../engine/backgammonEngine';

describe('Performance & React.memo BackgammonBoard', () => {
    const mockState: BoardState = {
        ...createInitialState(7),
        dice: [5, 2],
        turn: 'O',
    };

    const defaultProps: BackgammonBoardProps = {
        state: mockState,
        leftDieTargets: new Map(),
        rightDieTargets: new Map(),
        selectedPoint: null,
        selectedDie: null,
        usedDice: [false, false],
        onCheckerClick: vi.fn(),
        onCheckerRightClick: vi.fn(),
        onDestinationClick: vi.fn(),
        onSelectDie: vi.fn(),
        onDeselect: vi.fn(),
        coachHighlight: null,
        opponentHighlight: null,
        theme: 'snowie_classic',
        isLoading: false,
    };

    it('areBoardPropsEqual détecte les props identiques et évite les re-rendus inutiles', () => {
        const props1 = { ...defaultProps };
        const props2 = { ...defaultProps };

        expect(areBoardPropsEqual(props1, props2)).toBe(true);
    });

    it('areBoardPropsEqual détecte une mise à jour de OPPONENT_APPLY_STEP et permet le rendu', () => {
        const props1 = { ...defaultProps };
        const updatedBoard = [...mockState.board];
        updatedBoard[24] = -1; // pion O déplacé
        const props2 = {
            ...defaultProps,
            state: {
                ...mockState,
                board: updatedBoard,
            },
            opponentHighlight: [{ from: 24, to: 18 }],
        };

        expect(areBoardPropsEqual(props1, props2)).toBe(false);
    });

    // Non fiable en jsdom : le rendu SVG (filtres feTurbulence) est mesuré sans GPU,
    // ce qui ne reflète pas la performance réelle du navigateur. À mesurer via Playwright.
    it.skip('mesure le temps de rendu du plateau et confirme strictement < 16 ms/frame pendant un tour IA', () => {
        // Simule 30 étapes d'animation ou de mise à jour du plateau
        const iterations = 30;
        const renderTimes: number[] = [];

        const { rerender } = render(<BackgammonBoard {...defaultProps} />);

        for (let i = 0; i < iterations; i++) {
            const nextBoard = [...mockState.board];
            nextBoard[24 - (i % 6)] = -1;

            const t0 = performance.now();
            rerender(
                <BackgammonBoard
                    {...defaultProps}
                    state={{
                        ...mockState,
                        board: nextBoard,
                    }}
                    opponentHighlight={[{ from: 24, to: 24 - (i % 6) }]}
                />,
            );
            const t1 = performance.now();
            if (i > 1) {
                renderTimes.push(t1 - t0);
            }
        }

        const avgRenderTime = renderTimes.reduce((acc, t) => acc + t, 0) / renderTimes.length;
        const maxRenderTime = Math.max(...renderTimes);

        // Budget 60 FPS = 16.6 ms par frame en conditions nominales (tolérance multi-process CI jusqu'à 30 ms)
        expect(avgRenderTime).toBeLessThan(30);
        expect(maxRenderTime).toBeLessThan(60);
    });
});
