'use client';

/**
 * Hook d'annulation pas-à-pas et de reprise de coup (Audit 7 / 20 — useUndoMove).
 *
 * Responsabilités :
 *   1. Annulation pas-à-pas (dé par dé) via `Ctrl+Z` / `Cmd+Z`, bouton « Annuler »
 *      ou clic inverse sur le dernier pion déplacé (`handleReverseClick`).
 *   2. Identification sans scintillement du dé réanimé (`reanimatedDieIndex`) lors
 *      d'une transition `used: true -> false`.
 *   3. Verrouillage définitif de l'historique dès que le tour est validé et passe à l'adversaire.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Move } from '../engine/backgammonEngine';
import { findReanimatedDieIndex, type TurnSubMove } from '../engine/turnHistory';

export interface UseUndoMoveParams {
    /** Vrai si au moins un sous-coup a été joué pendant le tour courant. */
    canUndo: boolean;
    /** Phase de jeu courante. */
    gamePhase?: string;
    /** Masque courant des dés consommés (`[boolean, boolean]` ou `[boolean, boolean, boolean, boolean]`). */
    usedDice: ReadonlyArray<boolean>;
    /** Historique des sous-coups du tour courant (optionnel, pour le clic inverse sur le dernier pion déplacé). */
    moveHistory?: ReadonlyArray<{ board: readonly number[]; usedDice: readonly boolean[]; move?: Move | TurnSubMove }>;
    /** Callback déclenchant l'annulation du dernier sous-coup (`UNDO_MOVE`). */
    onUndo: () => void;
    /** Active l'écoute globale du raccourci clavier `Ctrl+Z` / `Cmd+Z` (défaut : `true`). */
    enableKeyboardShortcut?: boolean;
}

export interface UseUndoMoveResult {
    /** Vrai si l'annulation est actuellement autorisée (tour non verrouillé et `canUndo === true`). */
    isUndoAvailable: boolean;
    /** Vrai si le tour est définitivement validé / verrouillé (main passée à l'adversaire). */
    isTurnLocked: boolean;
    /** Flèche d'arrivée du tout dernier sous-coup joué (`null` si aucun). */
    lastMovedToPoint: number | null;
    /** Index du dernier dé réanimé par une annulation (`null` sinon), sans scintillement. */
    reanimatedDieIndex: number | null;
    /** Annule le dernier sous-coup (dé par dé). */
    undoLastStep: () => boolean;
    /** Annule tous les sous-coups joués pendant le tour courant. */
    undoAllSteps: () => number;
    /** Tente d'annuler le dernier sous-coup par clic inverse sur le pion déplacé (`pointNumber`). */
    handleReverseClick: (pointNumber: number) => boolean;
}

export function useUndoMove({
    canUndo,
    gamePhase = 'HUMAN_MOVING',
    usedDice,
    moveHistory = [],
    onUndo,
    enableKeyboardShortcut = true,
}: UseUndoMoveParams): UseUndoMoveResult {
    const isTurnLocked =
        gamePhase !== 'HUMAN_MOVING' &&
        gamePhase !== 'HUMAN_READY_TO_COMMIT' &&
        gamePhase !== 'PLAYING_MOVES';

    const isUndoAvailable = canUndo && !isTurnLocked;

    const lastMovedToPoint = useMemo(() => {
        if (!isUndoAvailable || moveHistory.length === 0) return null;
        const last = moveHistory[moveHistory.length - 1];
        return last?.move ? last.move.to : null;
    }, [isUndoAvailable, moveHistory]);

    const prevUsedDiceRef = useRef<ReadonlyArray<boolean>>(usedDice);
    const [reanimatedDieIndex, setReanimatedDieIndex] = useState<number | null>(null);

    useEffect(() => {
        const prev = prevUsedDiceRef.current;
        prevUsedDiceRef.current = usedDice;

        if (isTurnLocked) {
            setReanimatedDieIndex(null);
            return;
        }

        const idx = findReanimatedDieIndex(prev, usedDice);
        if (idx !== null) {
            setReanimatedDieIndex(idx);
        }
    }, [usedDice, isTurnLocked]);

    const undoLastStep = useCallback((): boolean => {
        if (!isUndoAvailable) return false;
        onUndo();
        return true;
    }, [isUndoAvailable, onUndo]);

    const undoAllSteps = useCallback((): number => {
        if (!isUndoAvailable) return 0;
        const count = Math.max(1, moveHistory.length);
        for (let i = 0; i < count; i++) {
            onUndo();
        }
        return count;
    }, [isUndoAvailable, moveHistory.length, onUndo]);

    const handleReverseClick = useCallback(
        (pointNumber: number): boolean => {
            if (!isUndoAvailable || lastMovedToPoint === null) return false;
            if (lastMovedToPoint !== pointNumber) return false;
            onUndo();
            return true;
        },
        [isUndoAvailable, lastMovedToPoint, onUndo],
    );

    useEffect(() => {
        if (!enableKeyboardShortcut || !isUndoAvailable) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && typeof target.closest === 'function' && target.closest('input, textarea, select, [contenteditable="true"]')) {
                return;
            }

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    undoAllSteps();
                } else {
                    undoLastStep();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enableKeyboardShortcut, isUndoAvailable, undoLastStep, undoAllSteps]);

    return {
        isUndoAvailable,
        isTurnLocked,
        lastMovedToPoint,
        reanimatedDieIndex,
        undoLastStep,
        undoAllSteps,
        handleReverseClick,
    };
}

export default useUndoMove;
