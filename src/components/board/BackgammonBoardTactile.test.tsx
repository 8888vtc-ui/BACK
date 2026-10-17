import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BackgammonBoard from './BackgammonBoard';
import { BoardState } from '../../engine/backgammonEngine';

function createBoardState(overrides: Partial<BoardState> = {}): BoardState {
    const board = new Array<number>(26).fill(0);
    // Initial standard position
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

describe('BackgammonBoard - Ergonomie Tactile & Layout Responsive', () => {
    it('affiche le sélecteur de dé tactile à deux boutons quand les dés sont actifs', () => {
        const state = createBoardState({ dice: [5, 2] });
        const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
        const rightDieTargets = new Map<number, number[]>([[24, [22]]]);

        const html = renderToStaticMarkup(
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
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Présence du sélecteur tactile mobile
        expect(html).toContain('data-testid="mobile-dice-selector"');
        expect(html).toContain('data-testid="die-select-0"');
        expect(html).toContain('data-testid="die-select-1"');

        // Valeurs des deux boutons
        expect(html).toContain('Dé 1 : 5');
        expect(html).toContain('Dé 2 : 2');

        // Dé 1 est actif
        expect(html).toContain('Actif');

        // Présence des dés interactifs dans la rivière centrale
        expect(html).toContain('data-testid="board-die-0"');
        expect(html).toContain('data-testid="board-die-1"');
    });

    it('affiche le statut Joué et désactive le bouton du dé consommé', () => {
        const state = createBoardState({ dice: [6, 3] });
        const html = renderToStaticMarkup(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map([[24, [21]]])}
                selectedPoint={null}
                selectedDie={1}
                usedDice={[true, false]} // Dé 0 consommé
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        expect(html).toContain('data-testid="die-select-0"');
        expect(html).toContain('disabled=""');
        expect(html).toContain('Joué');
        expect(html).toContain('line-through');

        // Dé 2 doit être actif
        expect(html).toContain('Dé 2 : 3');
        expect(html).toContain('Actif');
    });

    it('affiche les cibles tactiles de destination sur les flèches légales lors de la sélection', () => {
        const state = createBoardState({ dice: [5, 2] });
        const leftDieTargets = new Map<number, number[]>([[24, [19]]]);
        const rightDieTargets = new Map<number, number[]>([[24, [22]]]);

        const html = renderToStaticMarkup(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={rightDieTargets}
                selectedPoint={24}
                selectedDie={0} // Dé 1 actif (5) -> cible en 19
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // La cible tactile pleine colonne pour la destination 19 doit être rendue
        expect(html).toContain('data-testid="destination-target-19"');
        expect(html).toContain('points="');
        expect(html).toContain('fill="#22c55e"');
    });

    it('affiche la zone tactile de sortie (bear-off tray) quand la destination est la sortie', () => {
        const board = new Array<number>(26).fill(0);
        board[6] = 2; // X dans son jan intérieur
        const state = createBoardState({ board, dice: [6, 2] });

        // Destination 0 = sortie du plateau pour X
        const leftDieTargets = new Map<number, number[]>([[6, [0]]]);
        const rightDieTargets = new Map<number, number[]>([[6, [4]]]);

        const html = renderToStaticMarkup(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={rightDieTargets}
                selectedPoint={6}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Présence du bouton tactile de sortie dans le sabot
        expect(html).toContain('data-testid="destination-target-bearoff"');
        expect(html).toContain('SORTIE (TAP)');
    });

    it('intègre les styles responsives, touch-manipulation et le ratio SVG optimal', () => {
        const state = createBoardState();
        const html = renderToStaticMarkup(
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

        // Container responsive avec désactivation du zoom accidentel
        expect(html).toContain('touch-manipulation');
        expect(html).toContain('select-none');
        expect(html).toContain('max-w-6xl');

        // SVG responsive avec ratio 1120x700
        expect(html).toContain('viewBox="0 0 1120 700"');
        expect(html).toContain('touch-action:manipulation');
    });
});
