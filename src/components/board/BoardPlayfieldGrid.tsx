'use client';

/**
 * Grille de jeu du plateau — Quadrants de flèches, barre centrale et bacs de sortie.
 *
 * Rôle :
 *   Isole la grille 2x3 du plateau hors de `Board.tsx` (LOI 5 — composants ≤ 300 lignes).
 *   Délègue le rendu des 4 demi-quadrants et de leurs bacs de sortie à `BoardQuadrantRow`.
 */

import React from 'react';
import { BoardCentralBar, type BoardCentralBarProps } from './BoardCentralBar';
import { BoardQuadrantRow } from './BoardQuadrantRow';
import { X_OFF, O_OFF, type Player } from '../../engine/backgammonEngine';
import type { StratifiedHoverTargets } from './boardHighlights';

export interface BoardPlayfieldGridProps {
    topRow: readonly number[];
    bottomRow: readonly number[];
    board: number[];
    player: Player;
    off: { X: number; O: number };
    ghostDestinations: Set<number>;
    hoverTargets: StratifiedHoverTargets | { primary: Map<number, number>; secondary: Map<number, number>; combined?: Map<number, number> };
    movableSources: Set<number>;
    selectedPoint: number | null;
    opponentHighlight: { from: number; to: number; isHit?: boolean }[] | null;
    focusedPoint: number | null;
    /** Pions temporairement masqués à l'arrivée pendant une animation de vol FLIP (`useCheckerFlights`). */
    hiddenAt?: ReadonlyMap<number, number>;
    theme?: string;
    swapColors?: boolean;
    onBackgroundClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onOffClick: (offPoint: number) => void;
    onOffRightClick?: (offPoint: number) => void;
    onPointClick: (point: number, e: React.MouseEvent) => void;
    onPointRightClick: (point: number, e: React.MouseEvent) => void;
    onPointKeyDown: (point: number, e: React.KeyboardEvent) => void;
    onPointFocus: (point: number) => void;
    onMouseEnterPoint: (point: number) => void;
    onMouseLeavePoint: () => void;
    onCheckerPointerDown?: (pointNumber: number, color: import('./Checker').CheckerColor, e: React.PointerEvent) => void;
    centralBarProps: BoardCentralBarProps;
}

const BoardPlayfieldGridComponent: React.FC<BoardPlayfieldGridProps> = ({
    topRow,
    bottomRow,
    board,
    player,
    off,
    ghostDestinations,
    hoverTargets,
    movableSources,
    selectedPoint,
    opponentHighlight,
    focusedPoint,
    hiddenAt,
    theme,
    swapColors = false,
    onBackgroundClick,
    onOffClick,
    onOffRightClick,
    onPointClick,
    onPointRightClick,
    onPointKeyDown,
    onPointFocus,
    onMouseEnterPoint,
    onMouseLeavePoint,
    onCheckerPointerDown,
    centralBarProps,
}) => {
    const isOpponentToOff = opponentHighlight?.some((h) => h.to === X_OFF || h.to === O_OFF) ?? false;

    const sharedQuadrantProps = {
        board,
        player,
        ghostDestinations,
        hoverTargets,
        movableSources,
        selectedPoint,
        opponentHighlight,
        focusedPoint,
        hiddenAt,
        theme,
        swapColors,
        onPointClick,
        onPointRightClick,
        onPointKeyDown,
        onPointFocus,
        onMouseEnterPoint,
        onMouseLeavePoint,
        onCheckerPointerDown,
    };

    return (
        <div
            className="flex-1 min-h-0 grid grid-cols-[1fr_auto_1fr_auto] grid-rows-2"
            onClick={onBackgroundClick}
        >
            {/* Quadrant Haut Gauche */}
            <BoardQuadrantRow {...sharedQuadrantProps} points={topRow.slice(0, 6)} isTopRow={true} />

            {/* Barre Centrale & Videau */}
            <BoardCentralBar {...centralBarProps} onCheckerPointerDown={onCheckerPointerDown} />

            {/* Quadrant Haut Droit + Sortie O */}
            <BoardQuadrantRow
                {...sharedQuadrantProps}
                points={topRow.slice(6)}
                isTopRow={true}
                offTray={{
                    offPoint: O_OFF,
                    count: off.O,
                    isTarget: ghostDestinations.has(O_OFF) || hoverTargets.primary.has(O_OFF),
                    isOpponentToOff,
                    trayZoneId: 'tray-zone-o',
                    onOffClick,
                    onOffRightClick,
                }}
            />

            {/* Quadrant Bas Gauche */}
            <BoardQuadrantRow {...sharedQuadrantProps} points={bottomRow.slice(0, 6)} isTopRow={false} />

            {/* Quadrant Bas Droit + Sortie X */}
            <BoardQuadrantRow
                {...sharedQuadrantProps}
                points={bottomRow.slice(6)}
                isTopRow={false}
                offTray={{
                    offPoint: X_OFF,
                    count: off.X,
                    isTarget: ghostDestinations.has(X_OFF) || hoverTargets.primary.has(X_OFF),
                    isOpponentToOff,
                    trayZoneId: 'tray-zone-x',
                    onOffClick,
                    onOffRightClick,
                }}
            />
        </div>
    );
};

export const BoardPlayfieldGrid = React.memo(BoardPlayfieldGridComponent);
export default BoardPlayfieldGrid;
