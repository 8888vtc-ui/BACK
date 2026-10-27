// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Board from './Board';
import { createInitialState, X_BAR } from '../../engine/backgammonEngine';

describe('Board & BoardDiceRiver Components', () => {
    afterEach(() => {
        cleanup();
    });
    it('rend les 4 quadrants (via BoardQuadrantRow), la barre centrale et le badge de pips quand showPipCount est activé', () => {
        const state = createInitialState(7);
        const { getByTestId } = render(
            <Board
                state={state}
                showPipCount={true}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        expect(getByTestId('backgammon-board')).toBeTruthy();
        expect(getByTestId('central-bar-container')).toBeTruthy();
        expect(getByTestId('tray-zone-x')).toBeTruthy();
        expect(getByTestId('tray-zone-o')).toBeTruthy();
        expect(getByTestId('pip-count-bar')).toBeTruthy();
    });

    it('masque le badge de pips par défaut pour éviter tout doublon avec MatchHud et préserver la hauteur du feutre', () => {
        const state = createInitialState(7);
        const { queryByTestId } = render(
            <Board
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        expect(queryByTestId('pip-count-bar')).toBeNull();
    });

    it('affiche 4 dés lors d’un double et route le clic vers le slot 0 sans indicateur de swap', () => {
        const state = {
            ...createInitialState(7),
            dice: [5, 5] as [number, number],
        };
        const onSelectDie = vi.fn();
        const onDiceClick = vi.fn();

        const { getByTestId, queryByTestId } = render(
            <Board
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[true, false, false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onSelectDie={onSelectDie}
                onDiceClick={onDiceClick}
                gamePhase="HUMAN_MOVING"
            />,
        );

        expect(getByTestId('board-die-0')).toBeTruthy();
        expect(getByTestId('board-die-1')).toBeTruthy();
        expect(getByTestId('board-die-2')).toBeTruthy();
        expect(getByTestId('board-die-3')).toBeTruthy();
        expect(queryByTestId('dice-order-indicator')).toBeNull();

        // Clic sur le 3e dé (non consommé) -> sélectionne le slot canonique 0 sans swapper
        fireEvent.click(getByTestId('board-die-2'));
        expect(onSelectDie).toHaveBeenCalledWith(0);
        expect(onDiceClick).not.toHaveBeenCalled();
    });

    it('permet de swapper l’ordre des dés sur un lancer non-double (1→2 ⇄ 2→1)', () => {
        const state = {
            ...createInitialState(7),
            dice: [4, 2] as [number, number],
        };
        const onSelectDie = vi.fn();
        const onDiceClick = vi.fn();

        const { getByTestId } = render(
            <Board
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
                onDiceClick={onDiceClick}
                gamePhase="HUMAN_MOVING"
            />,
        );

        expect(getByTestId('dice-order-indicator').textContent).toContain('1→2');

        // Clic sur le dé déjà actif (0) -> inverse l'ordre (onDiceClick)
        fireEvent.click(getByTestId('board-die-0'));
        expect(onDiceClick).toHaveBeenCalledTimes(1);

        // Clic sur le second dé (1) -> le sélectionne (onSelectDie(1))
        fireEvent.click(getByTestId('board-die-1'));
        expect(onSelectDie).toHaveBeenCalledWith(1);
    });

    it('affiche les dés de l’adversaire avec de vrais composants Die graphiques (variante ébène)', () => {
        const state = createInitialState(7);
        const { getByTestId } = render(
            <Board
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                opponentDice={[6, 3]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                gamePhase="AI_TURN_SHOWING_ARROWS"
            />,
        );

        expect(getByTestId('opponent-dice')).toBeTruthy();
        expect(getByTestId('opponent-die-0')).toBeTruthy();
        expect(getByTestId('opponent-die-1')).toBeTruthy();
    });

    it('garantit une hitbox invisible d’au moins 44×44 px sur chacune des 24 flèches', () => {
        const state = createInitialState(7);
        const { getByTestId } = render(
            <Board
                state={state}
                leftDieTargets={new Map()}
                rightDieTargets={new Map()}
                selectedPoint={null}
                selectedDie={0}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
            />,
        );

        for (let pt = 1; pt <= 24; pt++) {
            const touchZone = getByTestId(`point-touch-zone-${pt}`) as HTMLElement;
            expect(touchZone.style.minWidth).toBe('44px');
            expect(touchZone.style.minHeight).toBe('44px');
        }
    });

    it('Audit 3/20 : verrouille les autres pions, pulse le pion sur la barre et illumine uniquement les points d’entrée légaux', () => {
        const base = createInitialState(7);
        const board = [...base.board];
        board[X_BAR] = 1;
        board[24] = -2; // Porte 24 fermée

        const state = {
            ...base,
            board,
            dice: [1, 4] as [number, number],
            turn: 'X' as const,
        };

        const leftDieTargets = new Map<number, number[]>();
        const rightDieTargets = new Map<number, number[]>([[X_BAR, [21]]]);
        const onCheckerClick = vi.fn();
        const onPlayMove = vi.fn();

        const { getByTestId, queryByTestId } = render(
            <Board
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={rightDieTargets}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={onCheckerClick}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                onPlayMove={onPlayMove}
                gamePhase="HUMAN_MOVING"
            />,
        );

        // Le pion sur la barre pulse
        expect(getByTestId('bar-checker-pulse')).toBeTruthy();

        // Le point 13 (contenant des pions de X) est verrouillé visuellement et fonctionnellement
        expect(getByTestId('point-triangle-13').getAttribute('data-locked-by-bar')).toBe('true');

        // Seule la flèche d'entrée légale 21 dans le jan intérieur adverse (19..24) est illuminée
        expect(getByTestId('ghost-checker-21')).toBeTruthy();
        expect(queryByTestId('ghost-checker-24')).toBeNull();

        // Cliquer sur le point 13 ne sélectionne jamais le point 13 mais redirige vers la barre (0)
        fireEvent.click(getByTestId('point-triangle-13'));
        expect(onCheckerClick).toHaveBeenCalledWith(X_BAR);
    });

    it('Chantier 3 : affiche les Ghost Checkers stratifiés à 3 niveaux (Dé haut, Dé bas, Somme d1+d2) et l’anneau d’alerte Blot adverse (#EF4444)', () => {
        const base = createInitialState(7);
        const board = [...base.board];
        board[18] = -1; // Blot adverse unique sur la flèche 18 (cible du dé 6 depuis 24)
        board[17] = 0;  // Libère la flèche 17 pour la somme combinée 6 + 1 = 7
        const state = {
            ...base,
            board,
            dice: [6, 1] as [number, number],
            turn: 'X' as const,
        };

        const leftDieTargets = new Map<number, number[]>([[24, [18]]]);
        const rightDieTargets = new Map<number, number[]>([[24, [23]]]);

        const { getByTestId } = render(
            <Board
                state={state}
                leftDieTargets={leftDieTargets}
                rightDieTargets={rightDieTargets}
                selectedPoint={24}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={vi.fn()}
                onCheckerRightClick={vi.fn()}
                onDestinationClick={vi.fn()}
                gamePhase="HUMAN_MOVING"
            />,
        );

        // Niveau 1 (Dé haut = 6 sur la flèche 18)
        const level1 = getByTestId('ghost-checker-18');
        expect(level1.getAttribute('data-ghost-level')).toBe('1');
        expect(level1.textContent).toBe('6');
        expect(level1.style.opacity).toBe('0.38');

        // Anneau d'alerte Blot adverse sur la flèche 18 (#EF4444, 2.5px, opacity 0.7)
        const blotRing = getByTestId('blot-alert-ring-18');
        expect(blotRing.style.opacity).toBe('0.7');
        expect(blotRing.style.border).toContain('2.5px solid');

        // Niveau 2 (Dé bas = 1 sur la flèche 23)
        const level2 = getByTestId('ghost-checker-23');
        expect(level2.getAttribute('data-ghost-level')).toBe('2');
        expect(level2.textContent).toBe('1');
        expect(level2.style.opacity).toBe('0.22');

        // Niveau 3 (Somme d1+d2 = 7 sur la flèche 17)
        const level3 = getByTestId('hover-target-combined-17');
        expect(level3.getAttribute('data-ghost-level')).toBe('3');
        expect(level3.textContent).toBe('7');
        expect(level3.style.opacity).toBe('0.45');
    });
});
