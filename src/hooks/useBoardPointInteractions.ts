'use client';

/**
 * Hook d'interactions clavier/souris/tactile des flèches du plateau (0 any, < 300 lignes).
 */
import { useCallback, useState } from 'react';
import { getSafestDestination } from '../engine/backgammonEngine';
import { TOP_ROW_NAV, BOT_ROW_NAV } from '../components/board/boardAria';
import { findPortMove, findDirectMoveToDestination } from '../engine/checkerMoveHelpers';
import { resolveDeterministicBearOffMove, selectBestBearOffSourceForTargets } from '../engine/bearOffRules';

export interface UseBoardPointInteractionsParams {
    board: number[];
    isX: boolean;
    bar: { X: number; O: number };
    xBarPoint: number;
    oBarPoint: number;
    ghostDestinations: Set<number>;
    selectedPoint?: number | null;
    leftDieTargets?: Map<number, number[]>;
    rightDieTargets?: Map<number, number[]>;
    dice?: [number, number] | null;
    selectedDie?: 0 | 1 | null;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onDeselect?: () => void;
}

/**
 * Sélectionne de manière 100 % déterministe le meilleur pion à sortir (règle XG / Galaxy).
 */
export function findBestBearOffSource(
    targets: Map<number, number[]>,
    offPoint: number,
    dieValue?: number,
    isX: boolean = true,
): number | null {
    const pick = selectBestBearOffSourceForTargets(targets, offPoint, isX ? 'X' : 'O', dieValue);
    return pick ? pick.from : null;
}

export interface UseBoardPointInteractionsResult {
    focusedPoint: number | null;
    handlePointClick: (pointNumber: number, e: React.MouseEvent) => void;
    handlePointRightClick: (pointNumber: number, e: React.MouseEvent) => void;
    handleBarClick: (barPoint: number) => void;
    handleBarRightClick: (barPoint: number) => void;
    handleOffClick: (offPoint: number) => void;
    handleOffRightClick: (offPoint: number) => void;
    handlePointFocus: (pointNumber: number) => void;
    handlePointKeyDown: (pointNumber: number, e: React.KeyboardEvent) => void;
}

export function useBoardPointInteractions({
    board,
    isX,
    bar,
    xBarPoint,
    oBarPoint,
    ghostDestinations,
    selectedPoint = null,
    leftDieTargets,
    rightDieTargets,
    dice = null,
    selectedDie = 0,
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onPlayMove,
    onDeselect,
}: UseBoardPointInteractionsParams): UseBoardPointInteractionsResult {
    const [focusedPoint, setFocusedPoint] = useState<number | null>(null);
    const player = isX ? 'X' : 'O';
    const preferredDie: 0 | 1 = selectedDie ?? 0;

    const handlePointClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            setFocusedPoint(null);
            const count = board[pointNumber];
            const hasPlayerChecker = isX ? count > 0 : count < 0;
            const ownBarCount = isX ? bar.X : bar.O;
            const ownBarPoint = isX ? xBarPoint : oBarPoint;

            if (ownBarCount > 0) {
                if (leftDieTargets && rightDieTargets && onPlayMove) {
                    const barEntry = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
                    if (barEntry && barEntry.from === ownBarPoint) {
                        onPlayMove(ownBarPoint, pointNumber, barEntry.die);
                        return;
                    }
                }
                if (ghostDestinations.has(pointNumber)) {
                    onDestinationClick(pointNumber);
                    return;
                }
                if (hasPlayerChecker) {
                    onCheckerClick(ownBarPoint);
                    return;
                }
                return;
            }

            if (ghostDestinations.has(pointNumber)) {
                if (selectedPoint === null && leftDieTargets && rightDieTargets && onPlayMove) {
                    const direct = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
                    if (direct) {
                        onPlayMove(direct.from, pointNumber, direct.die);
                        return;
                    }
                }
                onDestinationClick(pointNumber);
                return;
            }

            const isMovableSource = (leftDieTargets?.has(pointNumber) ?? false) || (rightDieTargets?.has(pointNumber) ?? false);
            if (hasPlayerChecker && (isMovableSource || !onPlayMove || !leftDieTargets || !rightDieTargets)) {
                onCheckerClick(pointNumber);
                return;
            }

            if (!hasPlayerChecker && leftDieTargets && rightDieTargets && onPlayMove && dice) {
                const port = findPortMove(pointNumber, dice, board, player, leftDieTargets, rightDieTargets);
                if (port) {
                    onPlayMove(port.from1, pointNumber, port.die1);
                    onPlayMove(port.from2, pointNumber, port.die2);
                    return;
                }
            }

            if (leftDieTargets && rightDieTargets && onPlayMove) {
                const direct = findDirectMoveToDestination(pointNumber, player, leftDieTargets, rightDieTargets, preferredDie);
                if (direct) {
                    onPlayMove(direct.from, pointNumber, direct.die);
                    return;
                }
            }

            if (hasPlayerChecker) {
                onCheckerClick(pointNumber);
                return;
            }

            if (ghostDestinations.size > 0 && (ghostDestinations.has(pointNumber - 1) || ghostDestinations.has(pointNumber + 1))) {
                return;
            }
            onDeselect?.();
        },
        [board, isX, bar.X, bar.O, xBarPoint, oBarPoint, ghostDestinations, selectedPoint, leftDieTargets, rightDieTargets, dice, player, preferredDie, onDestinationClick, onCheckerClick, onPlayMove, onDeselect],
    );

    const handlePointRightClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            const ownBarCount = isX ? bar.X : bar.O;
            if (ownBarCount > 0) return;
            onCheckerRightClick(pointNumber);
        },
        [isX, bar.X, bar.O, onCheckerRightClick],
    );

    const handleBarClick = useCallback(
        (barPoint: number) => {
            const hasBarChecker = barPoint === xBarPoint ? bar.X > 0 : bar.O > 0;
            if (hasBarChecker) onCheckerClick(barPoint);
            else onDeselect?.();
        },
        [bar, xBarPoint, onCheckerClick, onDeselect],
    );

    const handleBarRightClick = useCallback(
        (barPoint: number) => {
            const hasBarChecker = barPoint === xBarPoint ? bar.X > 0 : bar.O > 0;
            if (!hasBarChecker) {
                onDeselect?.();
                return;
            }

            if (leftDieTargets && rightDieTargets && onPlayMove) {
                const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
                const secondaryTargets = secondaryDie === 0 ? leftDieTargets : rightDieTargets;
                const primaryTargets = preferredDie === 0 ? leftDieTargets : rightDieTargets;
                const secondaryDests = secondaryTargets.get(barPoint) ?? [];
                const primaryDests = primaryTargets.get(barPoint) ?? [];

                if (secondaryDests.length > 0) {
                    const dest = getSafestDestination(barPoint, secondaryDests, board, player);
                    onPlayMove(barPoint, dest, secondaryDie);
                    return;
                }
                if (primaryDests.length > 0) {
                    const dest = getSafestDestination(barPoint, primaryDests, board, player);
                    onPlayMove(barPoint, dest, preferredDie);
                    return;
                }
            }

            onCheckerRightClick(barPoint);
        },
        [bar, xBarPoint, preferredDie, leftDieTargets, rightDieTargets, onPlayMove, board, player, onCheckerRightClick, onDeselect],
    );

    const handleOffClick = useCallback(
        (offPoint: number) => {
            if ((isX ? bar.X : bar.O) > 0) return;
            if (ghostDestinations.has(offPoint)) {
                onDestinationClick(offPoint);
                return;
            }
            const resolved = resolveDeterministicBearOffMove({ player, offPoint, leftDieTargets, rightDieTargets, dice, preferredDie });
            if (resolved && onPlayMove) onPlayMove(resolved.from, resolved.to, resolved.die);
            else onDeselect?.();
        },
        [isX, bar.X, bar.O, ghostDestinations, player, leftDieTargets, rightDieTargets, dice, preferredDie, onDestinationClick, onPlayMove, onDeselect],
    );

    const handleOffRightClick = useCallback(
        (offPoint: number) => {
            if ((isX ? bar.X : bar.O) > 0) return;
            const secondaryDie: 0 | 1 = (1 - preferredDie) as 0 | 1;
            const resolved = resolveDeterministicBearOffMove({ player, offPoint, leftDieTargets, rightDieTargets, dice, preferredDie: secondaryDie });
            if (resolved && onPlayMove) onPlayMove(resolved.from, resolved.to, resolved.die);
            else if (ghostDestinations.has(offPoint)) onDestinationClick(offPoint);
            else onDeselect?.();
        },
        [isX, bar.X, bar.O, preferredDie, player, leftDieTargets, rightDieTargets, dice, onPlayMove, ghostDestinations, onDestinationClick, onDeselect],
    );

    const handlePointFocus = useCallback((pointNumber: number) => setFocusedPoint(pointNumber), []);

    const handlePointKeyDown = useCallback(
        (pointNumber: number, e: React.KeyboardEvent) => {
            const navRow = pointNumber >= 13 ? TOP_ROW_NAV : BOT_ROW_NAV;
            const idx = navRow.indexOf(pointNumber);
            if (idx === -1) return;

            let next: number | null = null;
            if (e.key === 'ArrowLeft') next = navRow[Math.max(0, idx - 1)];
            else if (e.key === 'ArrowRight') next = navRow[Math.min(navRow.length - 1, idx + 1)];
            else if (e.key === 'Home') next = navRow[0];
            else if (e.key === 'End') next = navRow[navRow.length - 1];
            else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const ownBarCount = isX ? bar.X : bar.O;
                const ownBarPoint = isX ? xBarPoint : oBarPoint;
                if (ghostDestinations.has(pointNumber)) onDestinationClick(pointNumber);
                else if (ownBarCount > 0) onCheckerClick(ownBarPoint);
                else onCheckerClick(pointNumber);
                return;
            }

            if (next !== null && next !== pointNumber) {
                e.preventDefault();
                setFocusedPoint(next);
                const target = document.querySelector(`[data-testid="point-triangle-${next}"]`) as HTMLElement | null;
                target?.focus();
            }
        },
        [isX, bar.X, bar.O, xBarPoint, oBarPoint, ghostDestinations, onDestinationClick, onCheckerClick],
    );

    return {
        focusedPoint,
        handlePointClick,
        handlePointRightClick,
        handleBarClick,
        handleBarRightClick,
        handleOffClick,
        handleOffRightClick,
        handlePointFocus,
        handlePointKeyDown,
    };
}

export default useBoardPointInteractions;
