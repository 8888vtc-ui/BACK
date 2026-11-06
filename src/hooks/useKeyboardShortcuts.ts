/**
 * Hook de raccourcis clavier de compétition (Speed-Play : Espace, Tab, S, D, Undo Z/U/Backspace).
 * Strictement 0 `any`, ≤ 100 lignes.
 */

import { useEffect } from 'react';
import { impactLight, impactMedium, impactHeavy } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';

export interface UseKeyboardShortcutsOptions {
    phase: string;
    gamePhase?: string;
    turn: 'X' | 'O';
    dice: [number, number] | null;
    canDouble: boolean;
    canConfirm?: boolean;
    canUndo?: boolean;
    onRollDice: () => void;
    onSwapDice: () => void;
    onOfferDouble: () => void;
    onConfirmTurn?: () => void;
    onUndo?: () => void;
}

export function useKeyboardShortcuts({
    phase,
    gamePhase,
    turn,
    dice,
    canDouble,
    canConfirm = false,
    canUndo = false,
    onRollDice,
    onSwapDice,
    onOfferDouble,
    onConfirmTurn,
    onUndo,
}: UseKeyboardShortcutsOptions) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable ||
                    (typeof target.closest === 'function' && target.closest('input, textarea, select, [contenteditable="true"]')))
            ) {
                return;
            }

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            const isReadyToCommit = gamePhase === 'HUMAN_READY_TO_COMMIT' || canConfirm;

            if ((e.key === ' ' || e.key === 'Enter') && isReadyToCommit && canConfirm && turn === 'X' && onConfirmTurn) {
                e.preventDefault();
                impactMedium();
                soundEngine.playCheckerClack();
                onConfirmTurn();
            } else if (e.key === ' ' && phase === 'WAITING_FOR_ROLL' && turn === 'X') {
                e.preventDefault();
                impactMedium();
                soundEngine.playDiceRoll();
                onRollDice();
            } else if ((e.key === 'Tab' || ((e.key === 's' || e.key === 'S') && !isCtrlOrCmd)) && dice && turn === 'X') {
                e.preventDefault();
                impactLight();
                onSwapDice();
            } else if (
                ((isCtrlOrCmd && (e.key === 'z' || e.key === 'Z')) || (!isCtrlOrCmd && (e.key === 'u' || e.key === 'U' || e.key === 'Backspace'))) &&
                canUndo &&
                onUndo &&
                turn === 'X'
            ) {
                e.preventDefault();
                impactLight();
                onUndo();
            } else if ((e.key === 'd' || e.key === 'D') && !isCtrlOrCmd && canDouble) {
                e.preventDefault();
                impactHeavy();
                soundEngine.playCubeOffer();
                onOfferDouble();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, gamePhase, turn, dice, canDouble, canConfirm, canUndo, onRollDice, onSwapDice, onOfferDouble, onConfirmTurn, onUndo]);
}
