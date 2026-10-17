// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackgammonBoard, { getPointAtCoordinates } from './BackgammonBoard';
import { BoardState, X_BAR, O_BAR } from '../../engine/backgammonEngine';

afterEach(() => {
    cleanup();
});

function createBoardState(overrides: Partial<BoardState> = {}): BoardState {
    const board = new Array<number>(26).fill(0);
    // Position initiale
    board[1] = -2;
    board[6] = 5;
    board[8] = 3;
    board[12] = -5;
    board[13] = 5;
    board[17] = -3;
    board[19] = -5;
    board[24] = 2;

    return {
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: [5, 2],
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
        ...overrides,
    };
}

describe('Modèle d’interaction Snowie / TrueMoneyGames (TMG)', () => {
    describe('Acceptance : Clic unique auto-move', () => {
        it('un clic sur un pion à destination unique le déplace sans second clic', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            // Point 24 a une seule destination possible (19 via dé 5, le dé 2 vers 22 est bloqué)
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>(); // aucun coup avec le dé 2

            const onPlayMove = vi.fn();
            const onCheckerClick = vi.fn((point: number) => {
                // Simulation du handler auto-move
                const leftDests = leftDieTargets.get(point) ?? [];
                const rightDests = rightDieTargets.get(point) ?? [];
                const allDests = Array.from(new Set([...leftDests, ...rightDests]));
                if (allDests.length === 1) {
                    onPlayMove(point, allDests[0], leftDests.includes(allDests[0]) ? 0 : 1);
                }
            });

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={onCheckerClick}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                    onPlayMove={onPlayMove}
                />,
            );

            const checker24 = screen.getByTestId('checker-p24-0');
            // Un seul clic
            fireEvent.click(checker24);

            expect(onCheckerClick).toHaveBeenCalledWith(24);
            expect(onPlayMove).toHaveBeenCalledTimes(1);
            expect(onPlayMove).toHaveBeenCalledWith(24, 19, 0);
        });

        it('clic droit sur un pion joue immédiatement le dé droit (dé 2)', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>([[24, [22]]]);

            const onPlayMove = vi.fn();
            const onCheckerRightClick = vi.fn((point: number) => {
                const rightDests = rightDieTargets.get(point) ?? [];
                if (rightDests.length === 1) {
                    onPlayMove(point, rightDests[0], 1);
                }
            });

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={onCheckerRightClick}
                    onDestinationClick={vi.fn()}
                    onPlayMove={onPlayMove}
                />,
            );

            const checker24 = screen.getByTestId('checker-p24-0');
            // Clic droit (contextmenu)
            fireEvent.contextMenu(checker24);

            expect(onCheckerRightClick).toHaveBeenCalledWith(24);
            expect(onPlayMove).toHaveBeenCalledWith(24, 22, 1);
        });

        it('garde clic-puis-destination comme fallback quand plusieurs destinations existent', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            // Deux destinations distinctes pour le pion 24
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>([[24, [22]]]);

            let selected: number | null = null;
            const onPlayMove = vi.fn();
            const onDestinationClick = vi.fn((to: number) => {
                if (selected !== null) {
                    onPlayMove(selected, to);
                }
            });
            const onCheckerClick = vi.fn((point: number) => {
                const leftDests = leftDieTargets.get(point) ?? [];
                const rightDests = rightDieTargets.get(point) ?? [];
                const allDests = Array.from(new Set([...leftDests, ...rightDests]));
                if (allDests.length > 1) {
                    // Fallback sélection
                    selected = point;
                }
            });

            const { rerender } = render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={selected}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={onCheckerClick}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={onDestinationClick}
                    onPlayMove={onPlayMove}
                />,
            );

            // Premier clic : sélectionne le pion (ne déplace pas immédiatement car 2 choix possibles)
            const checker24 = screen.getByTestId('checker-p24-0');
            fireEvent.click(checker24);
            expect(selected).toBe(24);
            expect(onPlayMove).not.toHaveBeenCalled();

            // Rerender avec le pion sélectionné (affichage des fantômes)
            rerender(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={24}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={onCheckerClick}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={onDestinationClick}
                    onPlayMove={onPlayMove}
                />,
            );

            // Second clic sur le point lumineux de destination choisi (19)
            const target19 = screen.getByTestId('destination-target-19');
            fireEvent.click(target19);
            expect(onDestinationClick).toHaveBeenCalledWith(19);
            expect(onPlayMove).toHaveBeenCalledWith(24, 19);
        });
    });

    describe('Drag-and-Drop primaire (Pointer Events)', () => {
        it('détecte correctement les flèches et sabots avec getPointAtCoordinates', () => {
            // Flèche 24 (haut droite)
            expect(getPointAtCoordinates(900, 100)).toBe(24);
            // Flèche 19 (haut droite proche barre)
            expect(getPointAtCoordinates(560, 100)).toBe(19);
            // Flèche 13 (haut gauche)
            expect(getPointAtCoordinates(50, 100)).toBe(13);
            // Flèche 1 (bas droite)
            expect(getPointAtCoordinates(900, 600)).toBe(1);
            // Flèche 12 (bas gauche)
            expect(getPointAtCoordinates(50, 600)).toBe(12);
            // Sabot X (bas droite tray)
            expect(getPointAtCoordinates(1000, 500)).toBe(0);
            // Sabot O (haut droite tray)
            expect(getPointAtCoordinates(1000, 150)).toBe(25);
            // Barre X (bas centre)
            expect(getPointAtCoordinates(500, 500)).toBe(X_BAR);
            // Barre O (haut centre)
            expect(getPointAtCoordinates(500, 150)).toBe(O_BAR);
        });

        it('active les cibles de drag et le pion flottant lors d’un pointermove significatif', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>([[24, [22]]]);
            const onPlayMove = vi.fn();

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                    onPlayMove={onPlayMove}
                />,
            );

            const checker24 = screen.getByTestId('checker-p24-0');
            const svgBoard = screen.getByTestId('backgammon-board');

            // 1. PointerDown sur le pion 24
            fireEvent.pointerDown(checker24, {
                button: 0,
                clientX: 900,
                clientY: 600,
                pointerId: 1,
            });

            // 2. Drag significatif vers le haut (mouvement > 6px)
            fireEvent.pointerMove(svgBoard, {
                clientX: 900,
                clientY: 550,
                pointerId: 1,
            });

            // Présence des cibles de drop et du calque de pion flottant
            expect(screen.queryByTestId('dragged-checker-layer')).not.toBeNull();
            expect(screen.queryByTestId('drag-target-19')).not.toBeNull();
            expect(screen.queryByTestId('drag-target-22')).not.toBeNull();
        });

        it('exécute le coup légal correspondant au drop sur une flèche cible (onPlayMove)', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>([[24, [22]]]);
            const onPlayMove = vi.fn();

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                    onPlayMove={onPlayMove}
                />,
            );

            const checker24 = screen.getByTestId('checker-p24-0');
            const svgBoard = screen.getByTestId('backgammon-board');

            // 1. PointerDown sur point 24
            fireEvent.pointerDown(checker24, {
                button: 0,
                clientX: 900,
                clientY: 600,
                pointerId: 1,
            });

            // 2. Drag vers la flèche 19
            fireEvent.pointerMove(svgBoard, {
                clientX: 560,
                clientY: 100,
                pointerId: 1,
            });

            // 3. PointerUp sur la flèche 19
            fireEvent.pointerUp(svgBoard, {
                clientX: 560,
                clientY: 100,
                pointerId: 1,
            });

            expect(onPlayMove).toHaveBeenCalledTimes(1);
            expect(onPlayMove).toHaveBeenCalledWith(24, 19);
        });
    });

    describe('Auto-move intelligent & Double-clic (destination par défaut / plus sûre)', () => {
        it('double-clic sur un pion à plusieurs destinations joue vers la destination la plus sûre (default)', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            // Point 24 peut jouer 19 (dé 5, sécurisé/porte) ou 22 (dé 2, blot)
            const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
            const rightDieTargets = new Map<number, number[]>([[24, [22]]]);

            const onCheckerDoubleClick = vi.fn();
            const onCheckerClick = vi.fn();

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={onCheckerClick}
                    onCheckerDoubleClick={onCheckerDoubleClick}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );

            const checker24 = screen.getByTestId('checker-p24-0');

            // Déclenche le double-clic natif
            fireEvent.doubleClick(checker24);

            expect(onCheckerDoubleClick).toHaveBeenCalledWith(24);
        });

        it('si un pion à choix multiple est sélectionné avec die=null, n affiche QUE ses destinations', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            // Deux pions peuvent bouger : 24 (vers 19 et 22) et 13 (vers 8 et 11)
            const leftDieTargets = new Map<number, number[]>([
                [24, [19]],
                [13, [8]],
            ]);
            const rightDieTargets = new Map<number, number[]>([
                [24, [22]],
                [13, [11]],
            ]);

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={24}
                    selectedDie={null} // Pion sélectionné sans forcer de dé : affiche toutes ses cibles
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                />,
            );

            // N'affiche QUE les destinations de 24 (19 et 22)
            expect(screen.queryByTestId('destination-target-19')).not.toBeNull();
            expect(screen.queryByTestId('destination-target-22')).not.toBeNull();

            // N'affiche AUCUNE destination de 13 (8 et 11)
            expect(screen.queryByTestId('destination-target-8')).toBeNull();
            expect(screen.queryByTestId('destination-target-11')).toBeNull();
        });

        it('clic et double-clic sur un dé du plateau déclenchent onSelectDie et onDieDoubleClick', () => {
            const state = createBoardState({ turn: 'X', dice: [5, 2] });
            const onSelectDie = vi.fn();
            const onDieDoubleClick = vi.fn();

            render(
                <BackgammonBoard
                    state={state}
                    leftDieTargets={new Map([[24, [19]]])}
                    rightDieTargets={new Map([[24, [22]]])}
                    selectedPoint={null}
                    selectedDie={0}
                    usedDice={[false, false]}
                    onCheckerClick={vi.fn()}
                    onCheckerRightClick={vi.fn()}
                    onDestinationClick={vi.fn()}
                    onSelectDie={onSelectDie}
                    onDieDoubleClick={onDieDoubleClick}
                />,
            );

            // Clic sur le dé 1 (SVG ou sélecteur)
            const boardDie1 = screen.getByTestId('board-die-1');
            fireEvent.click(boardDie1);
            expect(onSelectDie).toHaveBeenCalledWith(1);

            // Double-clic sur le dé 1
            fireEvent.doubleClick(boardDie1);
            expect(onDieDoubleClick).toHaveBeenCalledWith(1);
        });
    });
});

