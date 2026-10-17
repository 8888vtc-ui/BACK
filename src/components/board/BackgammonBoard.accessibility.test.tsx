// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackgammonBoard, {
    TOP_ROW_NAV,
    BOT_ROW_NAV,
    getPointAriaLabel,
    getBarAriaLabel,
    getTrayAriaLabel,
} from './BackgammonBoard';
import { BoardState, X_BAR, O_BAR } from '../../engine/backgammonEngine';

afterEach(() => {
    cleanup();
});

function createBoardState(overrides: Partial<BoardState> = {}): BoardState {
    const board = new Array<number>(26).fill(0);
    // Position initiale standard
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
        dice: [3, 1],
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
        ...overrides,
    };
}

describe('BackgammonBoard - Accessibilité ARIA & Navigation Clavier (WCAG 2.1 AA)', () => {
    it('génère des labels ARIA descriptifs pour flèches vides, avec pions, et cibles légales', () => {
        const board = new Array<number>(26).fill(0);
        board[6] = 5; // 5 pions X
        board[1] = -2; // 2 pions O

        // Flèche avec pions alliés
        const label6 = getPointAriaLabel(6, board, 'X', null, [3]);
        expect(label6).toContain('Flèche 6 :');
        expect(label6).toContain('5 pions X (Blanc)');
        expect(label6).toContain('Porte fermée');
        expect(label6).toContain('Appuyez sur Entrée pour sélectionner ce pion');

        // Flèche vide
        const label2 = getPointAriaLabel(2, board, 'X', null, [2]);
        expect(label2).toContain('Flèche 2 :');
        expect(label2).toContain('Destination légale');

        // Flèche adverse
        const label1 = getPointAriaLabel(1, board, 'X', null, []);
        expect(label1).toContain('Flèche 1 :');
        expect(label1).toContain('2 pions O (Noir)');
        expect(label1).toContain('Porte fermée');
    });

    it('génère des labels ARIA clairs pour la barre et les sabots de sortie', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        const barLabel = getBarAriaLabel(X_BAR, board, 'X', null, []);
        expect(barLabel).toContain('Barre centrale Joueur X (Blanc) : 1 pion frappé');
        expect(barLabel).toContain('Prioritaire : vous devez réentrer ce pion');

        const trayLabel = getTrayAriaLabel(board, 'X', true);
        expect(trayLabel).toContain('Sabots de sortie :');
        expect(trayLabel).toContain('Destination légale de sortie (Bear-off)');
    });

    it('attribue role="region" au plateau SVG et role="button" aux flèches avec roving tabindex', () => {
        const state = createBoardState({ turn: 'X' });
        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[24, [21]]])}
                rightDieTargets={new Map([[24, [23]]])}
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

        const svgBoard = screen.getByTestId('backgammon-board');
        expect(svgBoard.getAttribute('role')).toBe('region');
        expect(svgBoard.getAttribute('aria-label')).toBe('Plateau de jeu de Backgammon');

        // Flèche 24 (avec pions X, par défaut le roving focus est sur 24 pour X)
        const point24 = screen.getByTestId('point-triangle-24');
        expect(point24.getAttribute('role')).toBe('button');
        expect(point24.getAttribute('tabindex')).toBe('0'); // Roving focus actif
        expect(point24.getAttribute('aria-label')).toContain('Flèche 24');

        // Flèche 13 a tabindex -1
        const point13 = screen.getByTestId('point-triangle-13');
        expect(point13.getAttribute('tabindex')).toBe('-1');

        // Vérification de la présence de la barre de raccourcis clavier
        expect(screen.getByLabelText('Raccourcis clavier du plateau')).toBeTruthy();
        expect(screen.getByTestId('keyboard-focus-indicator-24')).toBeTruthy();
    });

    it('permet la navigation au clavier avec les flèches directionnelles (ArrowRight, ArrowLeft, ArrowUp, ArrowDown)', () => {
        const state = createBoardState({ turn: 'X' });
        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
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

        const point24 = screen.getByTestId('point-triangle-24');

        // Focus initial sur point 24 (index 12 de TOP_ROW_NAV)
        // Flèche vers la gauche : passe à 23 (index 11)
        fireEvent.keyDown(point24, { key: 'ArrowLeft' });
        const point23 = screen.getByTestId('point-triangle-23');
        expect(point23.getAttribute('tabindex')).toBe('0');
        expect(screen.getByTestId('keyboard-focus-indicator-23')).toBeTruthy();

        // Flèche vers le bas : passe à la flèche opposée dans BOT_ROW_NAV (index 11 de BOT_ROW_NAV = point 2)
        fireEvent.keyDown(point23, { key: 'ArrowDown' });
        const point2 = screen.getByTestId('point-triangle-2');
        expect(point2.getAttribute('tabindex')).toBe('0');
        expect(screen.getByTestId('keyboard-focus-indicator-2')).toBeTruthy();

        // Flèche vers le haut : remonte à 23
        fireEvent.keyDown(point2, { key: 'ArrowUp' });
        expect(point23.getAttribute('tabindex')).toBe('0');
    });

    it('permet de naviguer au début et à la fin de la rangée avec Home et End', () => {
        const state = createBoardState({ turn: 'X' });
        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
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

        const point24 = screen.getByTestId('point-triangle-24');

        // Home : premier élément de la rangée du haut = 13
        fireEvent.keyDown(point24, { key: 'Home' });
        const point13 = screen.getByTestId('point-triangle-13');
        expect(point13.getAttribute('tabindex')).toBe('0');
        expect(screen.getByTestId('keyboard-focus-indicator-13')).toBeTruthy();

        // End : dernier élément de la rangée du haut = Sabot O (101)
        fireEvent.keyDown(point13, { key: 'End' });
        const trayO = screen.getByTestId('tray-zone-o');
        expect(trayO.getAttribute('tabindex')).toBe('0');
        expect(screen.getByTestId('keyboard-focus-indicator-tray-o')).toBeTruthy();
    });

    it('sélectionne un pion avec Entrée ou Espace et déclenche le coup vers une destination légale', () => {
        const state = createBoardState({ turn: 'X' });
        const onCheckerClick = vi.fn();
        const onDestinationClick = vi.fn();

        const { rerender } = render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[24, [21]]])}
                rightDieTargets={new Map([[24, [23]]])}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={onDestinationClick}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Appuyer sur Entrée sur la flèche 24 (alliée)
        const point24 = screen.getByTestId('point-triangle-24');
        fireEvent.keyDown(point24, { key: 'Enter' });
        expect(onCheckerClick).toHaveBeenCalledTimes(1);
        expect(onCheckerClick).toHaveBeenCalledWith(24);

        // Maintenant avec selectedPoint = 24 et destination légale sur 21
        rerender(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[24, [21]]])}
                rightDieTargets={new Map([[24, [23]]])}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={onDestinationClick}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Se déplacer vers la flèche 21 (dest légale) avec Espace
        fireEvent.keyDown(point24, { key: 'ArrowLeft' }); // 23
        const point23 = screen.getByTestId('point-triangle-23');
        fireEvent.keyDown(point23, { key: 'ArrowLeft' }); // 22
        const point22 = screen.getByTestId('point-triangle-22');
        fireEvent.keyDown(point22, { key: 'ArrowLeft' }); // 21
        const point21 = screen.getByTestId('point-triangle-21');

        fireEvent.keyDown(point21, { key: ' ' }); // Espace
        expect(onDestinationClick).toHaveBeenCalledTimes(1);
        expect(onDestinationClick).toHaveBeenCalledWith(21);
    });

    it('permet de désélectionner avec Escape et de choisir le dé avec 1 ou 2', () => {
        const state = createBoardState({ turn: 'X' });
        const onDeselect = vi.fn();
        const onSelectDie = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={onSelectDie}
                onDeselect={onDeselect}
            />,
        );

        const point24 = screen.getByTestId('point-triangle-24');

        // Escape désélectionne
        fireEvent.keyDown(point24, { key: 'Escape' });
        expect(onDeselect).toHaveBeenCalledTimes(1);

        // Touche 2 pour activer le dé 2
        fireEvent.keyDown(point24, { key: '2' });
        expect(onSelectDie).toHaveBeenCalledWith(1);

        // Touche 1 pour réactiver le dé 1
        fireEvent.keyDown(point24, { key: '1' });
        expect(onSelectDie).toHaveBeenCalledWith(0);
    });

    it('active la sortie (bear-off) sur le sabot avec Entrée', () => {
        const board = new Array<number>(26).fill(0);
        board[1] = 2; // Pions X dans le jan intérieur
        const state = createBoardState({ board, turn: 'X', dice: [1, 2] });
        const onDestinationClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map([[1, [0]]])} // 0 = Bear-off pour X
                rightDieTargets={new Map()}
                selectedPoint={1}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={onDestinationClick}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Le focus est initialement sur le selectedPoint (1, dans BOT_ROW_NAV index 12)
        // Sabot X est l'index 13 de BOT_ROW_NAV (ArrowRight depuis 1)
        const point1 = screen.getByTestId('point-triangle-1');
        fireEvent.keyDown(point1, { key: 'ArrowRight' });

        const trayX = screen.getByTestId('tray-zone-x');
        expect(trayX.getAttribute('tabindex')).toBe('0');
        expect(screen.getByTestId('keyboard-focus-indicator-tray-x')).toBeTruthy();

        // Valider avec Entrée
        fireEvent.keyDown(trayX, { key: 'Enter' });
        expect(onDestinationClick).toHaveBeenCalledWith(0);
    });
});
