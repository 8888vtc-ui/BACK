// @vitest-environment jsdom
/**
 * Tests unitaires du composant MiniBoardDiagram et de ses helpers de tracé vectoriel.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
    MiniBoardDiagram,
    parseDiagramMoveNotation,
    computeMiniPointCoords,
    buildMiniCurvedPath,
} from './MiniBoardDiagram';
import { createInitialState } from '../../engine/backgammonEngine';

afterEach(() => {
    cleanup();
});

describe('parseDiagramMoveNotation', () => {
    it('parse une séquence simple de deux sous-coups', () => {
        const res = parseDiagramMoveNotation('24/20 13/11', 'X');
        expect(res).toEqual([
            { from: 24, to: 20, isHit: false },
            { from: 13, to: 11, isHit: false },
        ]);
    });

    it('déploie les multiplicateurs (2) et détecte les frappes (*)', () => {
        const res = parseDiagramMoveNotation('8/5*(2)', 'X');
        expect(res).toHaveLength(2);
        expect(res[0]).toEqual({ from: 8, to: 5, isHit: true });
        expect(res[1]).toEqual({ from: 8, to: 5, isHit: true });
    });

    it('gère les entrées depuis la barre (bar) et sorties (off) selon le joueur', () => {
        const resX = parseDiagramMoveNotation('bar/22 6/off', 'X');
        expect(resX).toEqual([
            { from: 0, to: 22, isHit: false },
            { from: 6, to: 0, isHit: false },
        ]);

        const resO = parseDiagramMoveNotation('bar/3 19/off', 'O');
        expect(resO).toEqual([
            { from: 25, to: 3, isHit: false },
            { from: 19, to: 25, isHit: false },
        ]);
    });

    it('décompose les mouvements combinés en chaîne (ex: 24/20/14)', () => {
        const res = parseDiagramMoveNotation('24/20/14', 'X');
        expect(res).toEqual([
            { from: 24, to: 20, isHit: false },
            { from: 20, to: 14, isHit: false },
        ]);
    });

    it('retourne un tableau vide pour une action de videau ou chaîne vide', () => {
        expect(parseDiagramMoveNotation('', 'X')).toEqual([]);
        expect(parseDiagramMoveNotation('Double', 'X')).toEqual([]);
        expect(parseDiagramMoveNotation('Pass', 'X')).toEqual([]);
    });
});

describe('computeMiniPointCoords & buildMiniCurvedPath', () => {
    it('positionne les flèches 13..24 en haut et 12..1 en bas en orientation normale', () => {
        const pt24 = computeMiniPointCoords(24, 'X', false, 'normal');
        const pt1 = computeMiniPointCoords(1, 'X', false, 'normal');
        expect(pt24.isTop).toBe(true);
        expect(pt1.isTop).toBe(false);
        expect(pt24.y).toBeLessThan(pt1.y);
    });

    it('génère un tracé de Bézier quadratique SVG valide', () => {
        const path = buildMiniCurvedPath(480, 100, 320, 100);
        expect(path).toContain('M 480.0 100.0 Q');
    });
});

describe('MiniBoardDiagram Component', () => {
    it('rend la position initiale, les dés, le sens de jeu et les flèches comparatives', () => {
        const initial = createInitialState(7);

        render(
            <MiniBoardDiagram
                board={initial.board}
                dice={[6, 1]}
                turn="X"
                playedMove="24/18 13/12"
                optimalMove="13/7 8/7"
            />,
        );

        expect(screen.getByTestId('mini-board-diagram')).toBeTruthy();
        expect(screen.getByTestId('mini-board-svg')).toBeTruthy();
        expect(screen.getByTestId('mini-board-dice')).toBeTruthy();
        expect(screen.getByTestId('mini-board-direction').textContent).toContain('24↓1');

        // 2 sous-coups joués (rouge pointillé) + 2 sous-coups optimaux (vert/or plein)
        const playedArrows = screen.getAllByTestId('mini-board-arrow-played');
        const optimalArrows = screen.getAllByTestId('mini-board-arrow-optimal');
        expect(playedArrows).toHaveLength(2);
        expect(optimalArrows).toHaveLength(2);
    });

    it('masque la flèche optimale lorsque hideOptimalArrow est activé (mode Rejouer ce coup)', () => {
        const initial = createInitialState(7);

        render(
            <MiniBoardDiagram
                board={initial.board}
                dice={[3, 1]}
                turn="X"
                playedMove="24/21 13/12"
                optimalMove="8/5 6/5"
                hideOptimalArrow={true}
            />,
        );

        expect(screen.getAllByTestId('mini-board-arrow-played')).toHaveLength(2);
        expect(screen.queryAllByTestId('mini-board-arrow-optimal')).toHaveLength(0);
    });

    it('déclenche onPointClick lors du clic sur une flèche en mode interactif', () => {
        const initial = createInitialState(7);
        const onPointClick = vi.fn();

        render(
            <MiniBoardDiagram
                board={initial.board}
                dice={[3, 1]}
                turn="X"
                onPointClick={onPointClick}
                highlightedPoints={[8, 6]}
            />,
        );

        fireEvent.click(screen.getByTestId('mini-board-point-8'));
        expect(onPointClick).toHaveBeenCalledWith(8);
    });
});
