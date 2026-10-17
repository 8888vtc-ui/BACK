// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BackgammonBoard, { CoachHighlight } from './BackgammonBoard';
import { BoardState, X_BAR, O_BAR } from '../../engine/backgammonEngine';

afterEach(() => {
    cleanup();
});

function createBoardState(overrides: Partial<BoardState> = {}): BoardState {
    const board = new Array<number>(26).fill(0);
    // Position standard initiale
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

describe('BackgammonBoard Component - Interactions (Clic, Clic droit, Tap)', () => {
    it('déclenche onCheckerClick lors d un clic gauche sur un pion allié actif', () => {
        const state = createBoardState({ turn: 'X' });
        const onCheckerClick = vi.fn();
        const onDeselect = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={onDeselect}
            />,
        );

        // Pion X sur le point 24
        const checker24 = screen.getByTestId('checker-p24-0');
        fireEvent.click(checker24);
        expect(onCheckerClick).toHaveBeenCalledTimes(1);
        expect(onCheckerClick).toHaveBeenCalledWith(24);
    });

    it('déclenche onCheckerClick lors d un clic sur le triangle d une flèche avec pions alliés', () => {
        const state = createBoardState({ turn: 'X' });
        const onCheckerClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        const triangle24 = screen.getByTestId('point-triangle-24');
        fireEvent.click(triangle24);
        expect(onCheckerClick).toHaveBeenCalledWith(24);
    });

    it('ne déclenche pas onCheckerClick lors d un clic sur un pion adverse', () => {
        const state = createBoardState({ turn: 'X' });
        const onCheckerClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        // Pion O sur le point 1 (adverse quand turn === 'X')
        const checker1 = screen.getByTestId('checker-p1-0');
        fireEvent.click(checker1);
        expect(onCheckerClick).not.toHaveBeenCalled();
    });

    it('déclenche onCheckerRightClick et prévient l événement par défaut lors d un clic droit sur un pion', () => {
        const state = createBoardState({ turn: 'X' });
        const onCheckerRightClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={onCheckerRightClick}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        const checker24 = screen.getByTestId('checker-p24-0');
        fireEvent.contextMenu(checker24);

        expect(onCheckerRightClick).toHaveBeenCalledTimes(1);
        expect(onCheckerRightClick).toHaveBeenCalledWith(24);
    });

    it('gère les clics et clics droits sur la barre pour les pions frappés', () => {
        // Position avec 1 pion X frappé sur la barre
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        board[24] = 2;
        const state = createBoardState({ board, turn: 'X' });

        const onCheckerClick = vi.fn();
        const onCheckerRightClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={onCheckerRightClick}
                onDestinationClick={vi.fn()}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        const barCheckerX = screen.getByTestId('bar-checker-x-0');
        fireEvent.click(barCheckerX);
        expect(onCheckerClick).toHaveBeenCalledWith(X_BAR);

        fireEvent.contextMenu(barCheckerX);
        expect(onCheckerRightClick).toHaveBeenCalledWith(X_BAR);
    });

    it('déclenche onDeselect lors d un clic sur une flèche vide ou sur le fond du plateau', () => {
        const state = createBoardState({ turn: 'X' });
        const onDeselect = vi.fn();

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
                onDeselect={onDeselect}
            />,
        );

        // Flèche 4 vide
        const emptyTriangle4 = screen.getByTestId('point-triangle-4');
        fireEvent.click(emptyTriangle4);
        expect(onDeselect).toHaveBeenCalledTimes(1);

        // Surface de jeu
        const surfaceBg = screen.getByTestId('board-surface-background');
        fireEvent.click(surfaceBg);
        expect(onDeselect).toHaveBeenCalledTimes(2);

        // Rivière centrale
        const riverBg = screen.getByTestId('board-river-background');
        fireEvent.click(riverBg);
        expect(onDeselect).toHaveBeenCalledTimes(3);
    });

    it('déclenche onDestinationClick lors d un clic/tap sur une cible de destination légale', () => {
        const state = createBoardState({ turn: 'X' });
        const leftDieTargets = new Map([[24, [19]]]);
        const onDestinationClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={onDestinationClick}
                onSelectDie={vi.fn()}
                onDeselect={vi.fn()}
            />,
        );

        const target19 = screen.getByTestId('destination-target-19');
        fireEvent.click(target19);
        expect(onDestinationClick).toHaveBeenCalledTimes(1);
        expect(onDestinationClick).toHaveBeenCalledWith(19);
    });

    it('gère l interaction de sortie (Bear-off) via le bouton tactile SORTIE (TAP)', () => {
        // Position prête à sortir le pion du point 1 avec le dé 1 (0/X_OFF)
        const board = new Array<number>(26).fill(0);
        board[1] = 2; // dans le jan intérieur
        const state = createBoardState({ board, turn: 'X' });
        const leftDieTargets = new Map([[1, [0]]]);
        const onDestinationClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
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

        const bearoffTarget = screen.getByTestId('destination-target-bearoff');
        expect(bearoffTarget).toBeDefined();
        expect(screen.getByText('SORTIE (TAP)')).toBeDefined();

        fireEvent.click(bearoffTarget);
        expect(onDestinationClick).toHaveBeenCalledWith(0);
    });

    it('permet de basculer de dé actif via le sélecteur tactile mobile ou les dés du plateau', () => {
        const state = createBoardState({ dice: [6, 4] });
        const onSelectDie = vi.fn();

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
                onSelectDie={onSelectDie}
                onDeselect={vi.fn()}
            />,
        );

        // Clic sur bouton tactile Dé 2
        const btnDie1 = screen.getByTestId('die-select-1');
        fireEvent.click(btnDie1);
        expect(onSelectDie).toHaveBeenCalledWith(1);

        // Clic sur dé SVG sur le plateau
        const boardDie0 = screen.getByTestId('board-die-0');
        fireEvent.click(boardDie0);
        expect(onSelectDie).toHaveBeenCalledWith(0);
    });
});

describe('BackgammonBoard Component - Rendu Overstacking + Badge', () => {
    it('affiche tous les pions individuellement sans badge quand la flèche a 5 pions ou moins', () => {
        // Point 6 a exactement 5 pions
        const board = new Array<number>(26).fill(0);
        board[6] = 5;
        const state = createBoardState({ board });

        render(
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

        // Les 5 pions sont visibles
        expect(screen.getByTestId('checker-p6-0')).toBeDefined();
        expect(screen.getByTestId('checker-p6-1')).toBeDefined();
        expect(screen.getByTestId('checker-p6-2')).toBeDefined();
        expect(screen.getByTestId('checker-p6-3')).toBeDefined();
        expect(screen.getByTestId('checker-p6-4')).toBeDefined();

        // Aucun badge d'overstacking
        expect(screen.queryByTestId('overstack-badge-6')).toBeNull();
    });

    it('limite l affichage à 5 pions visibles et rend un badge numérique pour 7 pions', () => {
        // Point 6 a 7 pions (> 5 overstacking)
        const board = new Array<number>(26).fill(0);
        board[6] = 7;
        const state = createBoardState({ board });

        render(
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

        // Seuls 5 cercles sont rendus
        expect(screen.getByTestId('checker-p6-0')).toBeDefined();
        expect(screen.getByTestId('checker-p6-4')).toBeDefined();
        expect(screen.queryByTestId('checker-p6-5')).toBeNull();

        // Le badge d'overstacking est présent et contient la valeur 7
        const badge = screen.getByTestId('overstack-badge-6');
        expect(badge).toBeDefined();
        const badgeText = screen.getByTestId('overstack-badge-text-6');
        expect(badgeText.textContent).toBe('7');
    });

    it('gère l overstacking pour les pions adverses (ex: 8 pions O sur le point 12)', () => {
        const board = new Array<number>(26).fill(0);
        board[12] = -8;
        const state = createBoardState({ board });

        render(
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

        // 5 pions visibles
        expect(screen.getByTestId('checker-p12-0')).toBeDefined();
        expect(screen.getByTestId('checker-p12-4')).toBeDefined();
        expect(screen.queryByTestId('checker-p12-5')).toBeNull();

        // Badge affichant 8
        const badgeText = screen.getByTestId('overstack-badge-text-12');
        expect(badgeText.textContent).toBe('8');
    });

    it('rend un badge numérique sur la barre quand plusieurs pions sont frappés', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 4; // 4 pions X sur la barre
        const state = createBoardState({ board, turn: 'X' });
        const onCheckerClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        const barBadgeX = screen.getByTestId('bar-badge-x');
        expect(barBadgeX).toBeDefined();
        expect(barBadgeX.textContent).toContain('4');

        // Clic sur le badge de la barre déclenche la sélection de la barre
        fireEvent.click(barBadgeX);
        expect(onCheckerClick).toHaveBeenCalledWith(X_BAR);
    });
});

describe('BackgammonBoard Component - Points Lumineux de Destination (Aperçu & Coach)', () => {
    it('affiche le point lumineux de destination à la pointe de la flèche légale', () => {
        const state = createBoardState({ turn: 'X' });
        const leftDieTargets = new Map([[24, [19]]]);
        const onDestinationClick = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={onDestinationClick}
            />,
        );

        // Présence du point lumineux sur le point 19
        const target19 = screen.getByTestId('destination-target-19');
        expect(target19).toBeDefined();

        // Le point est cliquable pour exécuter le déplacement
        fireEvent.click(target19);
        expect(onDestinationClick).toHaveBeenCalledWith(19);
    });

    it('affiche le point lumineux de destination même quand la destination contient un blot adverse', () => {
        // Point 20 contient 1 seul pion O (-1), donc un blot vulnérable
        const board = new Array<number>(26).fill(0);
        board[24] = 2;
        board[20] = -1; // blot adverse
        const state = createBoardState({ board, turn: 'X' });
        const leftDieTargets = new Map([[24, [20]]]);

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // Le point lumineux est rendu sur la destination
        expect(screen.getByTestId('destination-target-20')).toBeDefined();
    });

    it('affiche le point lumineux de destination quand la destination est vide', () => {
        // Point 20 est vide
        const board = new Array<number>(26).fill(0);
        board[24] = 2;
        board[20] = 0;
        const state = createBoardState({ board, turn: 'X' });
        const leftDieTargets = new Map([[24, [20]]]);

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        expect(screen.getByTestId('destination-target-20')).toBeDefined();
    });

    it('affiche les fantômes du coach pour le coup joué et le coup optimal', () => {
        const state = createBoardState({ turn: 'X' });
        const coachHighlight: CoachHighlight = {
            played: [{ from: 8, to: 4 }],
            optimal: [{ from: 13, to: 9 }],
        };

        render(
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
                coachHighlight={coachHighlight}
            />,
        );

        // Fantôme coup joué
        const playedGhost = screen.getByTestId('cg-played-0');
        expect(playedGhost).toBeDefined();

        // Fantôme coup optimal
        const optimalGhost = screen.getByTestId('cg-optimal-0');
        expect(optimalGhost).toBeDefined();
    });

    it('affiche les points lumineux de destination lors du survol (hover) sans sélection préalable', () => {
        const state = createBoardState({ turn: 'X' });
        const leftDieTargets = new Map([[24, [19]]]);

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={null} // pas sélectionné
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        // Avant survol : pas de point lumineux
        expect(screen.queryByTestId('destination-target-19')).toBeNull();

        // Survol du pion sur le point 24
        const checker24 = screen.getByTestId('checker-p24-0');
        fireEvent.mouseEnter(checker24);

        // Le point lumineux apparaît à la destination
        expect(screen.getByTestId('destination-target-19')).toBeDefined();

        // Fin de survol
        fireEvent.mouseLeave(checker24);
        expect(screen.queryByTestId('destination-target-19')).toBeNull();
    });

    it('affiche plusieurs points lumineux quand une flèche offre plusieurs destinations légales', () => {
        const state = createBoardState({ turn: 'X' });
        // Deux destinations possibles avec le dé actif : 20 et 19
        const leftDieTargets = new Map([[24, [20, 19]]]);

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={new Map()}
                selectedPoint={24}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        expect(screen.getByTestId('destination-target-20')).toBeDefined();
        expect(screen.getByTestId('destination-target-19')).toBeDefined();
    });
});

describe('BackgammonBoard Component - États Complémentaires (Skeleton, Thème & Dés Consommés)', () => {
    it('affiche le skeleton de chargement quand isLoading est vrai', () => {
        const state = createBoardState();

        render(
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
                isLoading={true}
            />,
        );

        // En mode skeleton, le role status et le message de chargement sont présents
        expect(screen.getByRole('status')).toBeDefined();
        expect(screen.getByText('Chargement du plateau de jeu...')).toBeDefined();
        expect(screen.queryByTestId('mobile-dice-selector')).toBeNull();
    });

    it('ne déclenche pas onSelectDie lorsqu on clique sur un dé déjà consommé', () => {
        const state = createBoardState({ dice: [4, 2] });
        const onSelectDie = vi.fn();

        render(
            <BackgammonBoard
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={1}
                usedDice={[true, false]} // Dé 0 déjà consommé
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={onSelectDie}
            />,
        );

        // Clic sur le bouton mobile du dé 0 (désactivé)
        const btnDie0 = screen.getByTestId('die-select-0');
        expect(btnDie0).toHaveProperty('disabled', true);
        fireEvent.click(btnDie0);
        expect(onSelectDie).not.toHaveBeenCalled();

        // Clic sur le dé 0 sur le plateau
        const boardDie0 = screen.getByTestId('board-die-0');
        fireEvent.click(boardDie0);
        expect(onSelectDie).not.toHaveBeenCalled();

        // Mais dé 1 est cliquable
        const boardDie1 = screen.getByTestId('board-die-1');
        fireEvent.click(boardDie1);
        expect(onSelectDie).toHaveBeenCalledWith(1);
    });

    it('gère l overstacking extrême avec 15 pions empilés sur une même flèche', () => {
        const board = new Array<number>(26).fill(0);
        board[6] = 15; // Les 15 pions sur la flèche 6
        const state = createBoardState({ board });

        render(
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

        // Toujours exactement 5 pions visibles max
        expect(screen.getByTestId('checker-p6-0')).toBeDefined();
        expect(screen.getByTestId('checker-p6-4')).toBeDefined();
        expect(screen.queryByTestId('checker-p6-5')).toBeNull();

        // Le badge affiche bien 15
        const badgeText = screen.getByTestId('overstack-badge-text-6');
        expect(badgeText.textContent).toBe('15');
    });

    it('applique le thème tournament avec ses couleurs spécifiques', () => {
        const state = createBoardState();

        render(
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
                theme="tournament"
            />,
        );

        // Surface de jeu en vert tournoi (#14532d)
        const surface = screen.getByTestId('board-surface-background');
        expect(surface.getAttribute('fill')).toBe('#14532d');
    });
});
