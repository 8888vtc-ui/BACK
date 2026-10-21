'use client';

/**
 * Hook d'interactions clavier/souris des flèches du plateau.
 *
 * Rôle :
 *   Isole hors de `Board.tsx` (LOI 5) la logique de clic/clic-droit sur les
 *   flèches, la barre et les sabots de sortie, ainsi que la navigation
 *   clavier directionnelle (roving tabindex).
 *
 * Dépendances :
 *   `boardAria` (`TOP_ROW_NAV`, `BOT_ROW_NAV`).
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer la logique dans `Board.tsx`.
 */

import { useCallback, useState } from 'react';
import { TOP_ROW_NAV, BOT_ROW_NAV } from '../components/board/boardAria';

export interface UseBoardPointInteractionsParams {
    board: number[];
    isX: boolean;
    bar: { X: number; O: number };
    xBarPoint: number;
    oBarPoint: number;
    ghostDestinations: Set<number>;
    onCheckerClick: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onDeselect?: () => void;
}

export interface UseBoardPointInteractionsResult {
    focusedPoint: number | null;
    handlePointClick: (pointNumber: number, e: React.MouseEvent) => void;
    handlePointRightClick: (pointNumber: number, e: React.MouseEvent) => void;
    handleBarClick: (barPoint: number) => void;
    handleOffClick: (offPoint: number) => void;
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
    onCheckerClick,
    onCheckerRightClick,
    onDestinationClick,
    onDeselect,
}: UseBoardPointInteractionsParams): UseBoardPointInteractionsResult {
    // Point actuellement focalisé au clavier (roving tabindex).
    const [focusedPoint, setFocusedPoint] = useState<number | null>(null);

    const handlePointClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            const count = board[pointNumber];
            const hasPlayerChecker = isX ? count > 0 : count < 0;

            // Si cette case est une destination légale du pion sélectionné (point fantôme),
            // on déplace le pion ici — y compris pour construire ou renforcer une porte existante !
            if (ghostDestinations.has(pointNumber)) {
                onDestinationClick(pointNumber);
                return;
            }
            if (hasPlayerChecker) {
                onCheckerClick(pointNumber);
                return;
            }
            onDeselect?.();
        },
        [board, isX, ghostDestinations, onDestinationClick, onCheckerClick, onDeselect],
    );

    const handlePointRightClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            onCheckerRightClick(pointNumber);
        },
        [onCheckerRightClick],
    );

    const handleBarClick = useCallback(
        (barPoint: number) => {
            const hasBarChecker = barPoint === xBarPoint ? bar.X > 0 : bar.O > 0;
            if (hasBarChecker) onCheckerClick(barPoint);
            else onDeselect?.();
        },
        [bar, xBarPoint, onCheckerClick, onDeselect],
    );

    const handleOffClick = useCallback(
        (offPoint: number) => {
            if (ghostDestinations.has(offPoint)) {
                onDestinationClick(offPoint);
            } else {
                onDeselect?.();
            }
        },
        [ghostDestinations, onDestinationClick, onDeselect],
    );

    // Navigation clavier directionnelle (roving tabindex) sur les flèches.
    const handlePointFocus = useCallback((pointNumber: number) => {
        setFocusedPoint(pointNumber);
    }, []);

    const handlePointKeyDown = useCallback(
        (pointNumber: number, e: React.KeyboardEvent) => {
            // Détermine la rangée de navigation selon la position du point.
            const navRow = pointNumber >= 13 ? TOP_ROW_NAV : BOT_ROW_NAV;
            const idx = navRow.indexOf(pointNumber);
            if (idx === -1) return;

            let next: number | null = null;
            if (e.key === 'ArrowLeft') {
                next = navRow[Math.max(0, idx - 1)];
            } else if (e.key === 'ArrowRight') {
                next = navRow[Math.min(navRow.length - 1, idx + 1)];
            } else if (e.key === 'Home') {
                next = navRow[0];
            } else if (e.key === 'End') {
                next = navRow[navRow.length - 1];
            } else if (e.key === 'Enter' || e.key === ' ') {
                // Entrée / Espace : sélectionne le point (comme un clic).
                e.preventDefault();
                onCheckerClick(pointNumber);
                return;
            }

            if (next !== null && next !== pointNumber) {
                e.preventDefault();
                setFocusedPoint(next);
                // Déplace le focus DOM vers le point cible.
                const target = document.querySelector(
                    `[data-testid="point-triangle-${next}"]`,
                ) as HTMLElement | null;
                target?.focus();
            }
        },
        [onCheckerClick],
    );

    return {
        focusedPoint,
        handlePointClick,
        handlePointRightClick,
        handleBarClick,
        handleOffClick,
        handlePointFocus,
        handlePointKeyDown,
    };
}

export default useBoardPointInteractions;
