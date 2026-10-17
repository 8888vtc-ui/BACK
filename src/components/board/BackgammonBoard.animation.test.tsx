// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import BackgammonBoard from './BackgammonBoard';
import { BoardState, createInitialState, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { soundEngine } from '../../utils/soundEngine';

vi.mock('../../utils/soundEngine', () => ({
    soundEngine: {
        playDiceRoll: vi.fn(),
        playCheckerMove: vi.fn(),
        playHit: vi.fn(),
        playBearOff: vi.fn(),
        playClick: vi.fn(),
    },
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('Animations Tournament Grade & Zéro Téléportation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('déclenche l animation SVG de translation lors d un coup sans téléportation', async () => {
        const initialState = createInitialState(7);
        initialState.turn = 'X';
        initialState.dice = [5, 2];

        const { rerender } = render(
            <BackgammonBoard
                state={initialState}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // Simulation d'un coup de X : 24 -> 19 (avance de 5)
        const nextBoard = [...initialState.board];
        nextBoard[24] = 1; // 1 pion parti de 24 (il y en avait 2)
        nextBoard[19] = -4; // case 19 contenait -5 O, mais supposons coup vers 19 libre pour simplifier :
        nextBoard[24] = initialState.board[24] - 1;
        nextBoard[22] = 1; // coup 24 -> 22

        act(() => {
            rerender(
                <BackgammonBoard
                    state={{
                        ...initialState,
                        board: nextBoard,
                    }}
                    leftDieTargets={new Map()}
                    rightDieTargets={new Map()}
                    selectedPoint={null}
                    selectedDie={null}
                    usedDice={[false, true]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );
        });

        // Le calque SVG d'animation doit être monté immédiatement
        expect(screen.getByTestId('animating-checker-layer')).toBeTruthy();
        expect(soundEngine.playCheckerMove).toHaveBeenCalled();

        // Avance de 20 ms -> phase moving
        act(() => {
            vi.advanceTimersByTime(25);
        });
        expect(screen.getByTestId('animating-checker-layer')).toBeTruthy();

        // Fin de l'animation à 350 ms -> le pion se pose et le calque animé disparaît
        act(() => {
            vi.advanceTimersByTime(350);
        });
        expect(screen.queryByTestId('animating-checker-layer')).not.toBeTruthy();
    });

    it('anime la frappe d un pion adverse qui vole vers la barre avec marqueur d impact', async () => {
        const board = new Array<number>(26).fill(0);
        board[24] = 2; // X
        board[20] = -1; // O (blot vulnérable)
        const state: BoardState = {
            ...createInitialState(7),
            board,
            turn: 'X',
            dice: [4, 1],
        };

        const { rerender } = render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[24, [20]]])}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // X frappe le blot O en 20 : 24 -> 20, O va sur la barre O (25)
        const hitBoard = [...board];
        hitBoard[24] = 1;
        hitBoard[20] = 1; // blot O remplacé par X
        hitBoard[O_BAR] = -1; // O envoyé sur la barre

        act(() => {
            rerender(
                <BackgammonBoard
                    state={{
                        ...state,
                        board: hitBoard,
                    }}
                    leftDieTargets={new Map()}
                    rightDieTargets={new Map()}
                    selectedPoint={null}
                    selectedDie={null}
                    usedDice={[true, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );
        });

        // Vérifie le pion en vol et le pion adverse volant vers la barre
        expect(screen.getByTestId('animating-checker-layer')).toBeTruthy();
        expect(screen.getByTestId('hit-flying-checker')).toBeTruthy();
        expect(soundEngine.playHit).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(350);
        });
        expect(screen.queryByTestId('hit-flying-checker')).not.toBeTruthy();
    });

    it('anime le bear-off (glissement vers le sabot de sortie)', async () => {
        const board = new Array<number>(26).fill(0);
        board[1] = 2; // X dans son jan intérieur
        const state: BoardState = {
            ...createInitialState(7),
            board,
            turn: 'X',
            dice: [1, 2],
        };

        const { rerender } = render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[1, [0]]])}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // X sort un pion : point 1 passe à 1 pion
        const bearOffBoard = [...board];
        bearOffBoard[1] = 1;

        act(() => {
            rerender(
                <BackgammonBoard
                    state={{
                        ...state,
                        board: bearOffBoard,
                    }}
                    leftDieTargets={new Map()}
                    rightDieTargets={new Map()}
                    selectedPoint={null}
                    selectedDie={null}
                    usedDice={[true, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );
        });

        expect(soundEngine.playBearOff).toHaveBeenCalled();
        expect(screen.getByTestId('animating-checker-layer')).toBeTruthy();
    });

    it('anime le lancer de dés (shake puis settle) et grise les dés consommés', async () => {
        const state = createInitialState(7);
        state.dice = [3, 4];
        state.turn = 'X';

        const { rerender } = render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // Nouveau lancer de dés
        act(() => {
            rerender(
                <BackgammonBoard
                    state={{
                        ...state,
                        dice: [6, 2],
                    }}
                    leftDieTargets={new Map()}
                    rightDieTargets={new Map()}
                    selectedPoint={null}
                    selectedDie={null}
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );
        });

        expect(soundEngine.playDiceRoll).toHaveBeenCalled();

        // Griser un dé consommé
        act(() => {
            rerender(
                <BackgammonBoard
                    state={{
                        ...state,
                        dice: [6, 2],
                    }}
                    leftDieTargets={new Map()}
                    rightDieTargets={new Map()}
                    selectedPoint={null}
                    selectedDie={null}
                    usedDice={[true, false]} // Dé 0 consommé
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );
        });

        const die0 = screen.getByTestId('board-die-0');
        expect(die0).toBeTruthy();
        // Le dé consommé a son bouton mobile désactivé et marqué Joué
        const btnDie0 = screen.getByTestId('die-select-0');
        expect(btnDie0).toHaveProperty('disabled', true);
        expect(btnDie0.textContent).toContain('Joué');
    });
});
