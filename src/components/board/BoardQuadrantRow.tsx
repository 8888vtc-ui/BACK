'use client';

/**
 * Ligne de quadrant du plateau — 6 flèches (`BoardPoint`) + bac de sortie optionnel (`BoardOffTray`).
 *
 * Rôle :
 *   Extrait le rendu d'un demi-quadrant horizontal (6 flèches + colonne de sortie)
 *   hors de `Board.tsx` / `BoardPlayfieldGrid.tsx` (LOI 5 — composants ≤ 300 lignes, 0 any).
 */

import React from 'react';
import { BoardPoint } from './BoardPoint';
import { BoardOffTray } from './BoardOffTray';
import type { Player } from '../../engine/backgammonEngine';
import { getPointColor, getPointCount } from './boardGeometry';
import { getPointAriaLabel } from './boardAria';
import { isRealPoint, normalizeHighlightPoint, type StratifiedHoverTargets } from './boardHighlights';
import { isPointLockedByBar } from '../../engine/barRules';

export interface BoardQuadrantRowProps {
    points: readonly number[];
    isTopRow: boolean;
    board: number[];
    player: Player;
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
    onPointClick: (point: number, e: React.MouseEvent) => void;
    onPointRightClick: (point: number, e: React.MouseEvent) => void;
    onPointKeyDown: (point: number, e: React.KeyboardEvent) => void;
    onPointFocus: (point: number) => void;
    onMouseEnterPoint: (point: number) => void;
    onMouseLeavePoint: () => void;
    onCheckerPointerDown?: (pointNumber: number, color: import('./Checker').CheckerColor, e: React.PointerEvent) => void;
    /** Configuration optionnelle du bac de sortie (uniquement pour les quadrants de droite). */
    offTray?: {
        offPoint: number;
        count: number;
        isTarget: boolean;
        isOpponentToOff: boolean;
        trayZoneId: string;
        onOffClick: (offPoint: number) => void;
        onOffRightClick?: (offPoint: number) => void;
    };
}

const BoardQuadrantRowComponent: React.FC<BoardQuadrantRowProps> = ({
    points,
    isTopRow,
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
    swapColors = false,
    onPointClick,
    onPointRightClick,
    onPointKeyDown,
    onPointFocus,
    onMouseEnterPoint,
    onMouseLeavePoint,
    onCheckerPointerDown,
    offTray,
}) => {
    const isX = player === 'X';

    const flipColor = (c: ReturnType<typeof getPointColor>) =>
        swapColors && c ? (c === 'white' ? 'black' : 'white') : c;

    const renderPoint = (point: number) => {
        const rawCount = getPointCount(board, point);
        const hiddenCount = hiddenAt?.get(point) ?? 0;
        const count = Math.max(0, rawCount - hiddenCount);
        const color = count > 0 ? flipColor(getPointColor(board, point)) : null;
        const isTarget = ghostDestinations.has(point);
        const isForcedOrigin =
            selectedPoint === null &&
            movableSources.size === 1 &&
            movableSources.has(point) &&
            ghostDestinations.size === 1;
        const isHoverPrimary = hoverTargets.primary.has(point);
        const isHoverSecondary = hoverTargets.secondary.has(point);
        const isHoverCombined = hoverTargets.combined?.has(point) ?? false;
        const isBlotTarget =
            (isTarget || isHoverPrimary || isHoverSecondary || isHoverCombined) &&
            rawCount === 1 &&
            (isX ? board[point] < 0 : board[point] > 0);
        const isOpponentFrom =
            isRealPoint(point) &&
            (opponentHighlight?.some((h) => normalizeHighlightPoint(h.from, false) === point) ?? false);
        const isOpponentTo =
            isRealPoint(point) &&
            (opponentHighlight?.some((h) => normalizeHighlightPoint(h.to, true) === point) ?? false);
        const ariaLabel = getPointAriaLabel(point, board, player, selectedPoint, Array.from(ghostDestinations));

        return (
            <BoardPoint
                key={`point-${point}`}
                pointNumber={point}
                isTopRow={isTopRow}
                checkerColor={color}
                checkerCount={count}
                isTargetDestination={isTarget}
                isBlotTarget={isBlotTarget}
                isHoverPrimaryTarget={isHoverPrimary}
                isHoverSecondaryTarget={isHoverSecondary}
                isHoverCombinedTarget={isHoverCombined}
                targetDieValue={hoverTargets.primary.get(point) ?? hoverTargets.secondary.get(point) ?? null}
                secondaryTargetDieValue={hoverTargets.secondary.get(point) ?? null}
                combinedTargetDieValue={hoverTargets.combined?.get(point) ?? null}
                isMovable={movableSources.has(point)}
                isForcedOrigin={isForcedOrigin}
                isLockedByBar={isPointLockedByBar(board, player, point)}
                isSelected={selectedPoint === point}
                isOpponentFrom={isOpponentFrom}
                isOpponentTo={isOpponentTo}
                isFocused={focusedPoint === point}
                ariaLabel={ariaLabel}
                theme={theme}
                onClickPoint={onPointClick}
                onRightClickPoint={onPointRightClick}
                onKeyDownPoint={onPointKeyDown}
                onFocusPoint={onPointFocus}
                onMouseEnterPoint={onMouseEnterPoint}
                onMouseLeavePoint={onMouseLeavePoint}
                onCheckerPointerDown={onCheckerPointerDown}
            />
        );
    };

    if (!offTray) {
        return <div className="flex min-h-0">{points.map(renderPoint)}</div>;
    }

    return (
        <div className="contents">
            <div className="flex min-h-0">{points.map(renderPoint)}</div>
            <div
                className={`w-9 sm:w-14 md:w-20 pl-1 ml-0.5 sm:pl-1.5 sm:ml-1 border-l border-amber-500/25 flex flex-col ${
                    isTopRow ? 'justify-start pt-1 pb-1 sm:pb-2' : 'justify-end pt-1 sm:pt-2 pb-1'
                }`}
            >
                <BoardOffTray
                    offPoint={offTray.offPoint}
                    count={Math.max(0, offTray.count - (hiddenAt?.get(offTray.offPoint) ?? 0))}
                    board={board}
                    player={player}
                    isTarget={offTray.isTarget}
                    isOpponentToOff={offTray.isOpponentToOff}
                    trayZoneId={offTray.trayZoneId}
                    onClick={offTray.onOffClick}
                    onRightClick={offTray.onOffRightClick}
                    swapColors={swapColors}
                    isFocused={focusedPoint === (offTray.offPoint === 0 ? 100 : 101)}
                />
            </div>
        </div>
    );
};

export const BoardQuadrantRow = React.memo(BoardQuadrantRowComponent);
export default BoardQuadrantRow;
