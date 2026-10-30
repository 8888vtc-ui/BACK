'use client';

/**
 * Hook d'interactions clavier/souris/tactile des flèches du plateau (0 any, <= 200 lignes).
 */
import { useCallback, useState } from 'react';
import { resolveDeterministicBearOffMove, selectBestBearOffSourceForTargets } from '../engine/bearOffRules';
import type { SubMove } from '../engine/smartClickResolver';
import {
    computeKeyboardNavTarget,
    executeBarRightClick,
    executeBoardPointClick,
    keyboardNavSelector,
} from './boardPointClickHelpers';

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
    /**
     * Séquences légales restantes du tour (cf. `computeRemainingSequences`). Active le coup combiné
     * Destination-First (d1+d2, 2d/3d/4d en double) en un seul clic, en remplacement du double-clic.
     */
    legalSequences?: ReadonlyArray<ReadonlyArray<SubMove>>;
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
    legalSequences,
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
            executeBoardPointClick({
                pointNumber, board, isX, player, bar, xBarPoint, oBarPoint,
                ghostDestinations, selectedPoint, leftDieTargets, rightDieTargets,
                dice, preferredDie, ctrlKey: Boolean(e.ctrlKey || e.metaKey), legalSequences,
                onCheckerClick, onDestinationClick, onPlayMove, onDeselect,
            });
        },
        [board, isX, bar, xBarPoint, oBarPoint, ghostDestinations, selectedPoint, leftDieTargets, rightDieTargets, dice, player, preferredDie, legalSequences, onDestinationClick, onCheckerClick, onPlayMove, onDeselect],
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
            executeBarRightClick({
                barPoint, xBarPoint, bar, preferredDie, leftDieTargets, rightDieTargets,
                board, player, onPlayMove, onCheckerRightClick, onDeselect,
            });
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
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const ownBarCount = isX ? bar.X : bar.O;
                const ownBarPoint = isX ? xBarPoint : oBarPoint;
                if (ghostDestinations.has(pointNumber)) onDestinationClick(pointNumber);
                else if (ownBarCount > 0) onCheckerClick(ownBarPoint);
                else onCheckerClick(pointNumber);
                return;
            }

            const next = computeKeyboardNavTarget(pointNumber, e.key);
            if (next !== null && next !== pointNumber) {
                e.preventDefault();
                setFocusedPoint(next);
                const target = document.querySelector(keyboardNavSelector(next)) as HTMLElement | null;
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
