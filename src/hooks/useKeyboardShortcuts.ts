/**
 * Hook de raccourcis clavier de compétition (Speed-Play : Espace, Tab, D).
 *
 * Rôle :
 *   Écoute les raccourcis clavier globaux pour lancer les dés (Espace),
 *   inverser l'ordre des dés (Tab) ou proposer le videau (D).
 *
 * Dépendances :
 *   `react`, `haptics`, `soundEngine`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `useCheckerInteractions`.
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
    onRollDice: () => void;
    onSwapDice: () => void;
    onOfferDouble: () => void;
    onConfirmTurn?: () => void;
}

export function useKeyboardShortcuts({
    phase,
    gamePhase,
    turn,
    dice,
    canDouble,
    canConfirm = false,
    onRollDice,
    onSwapDice,
    onOfferDouble,
    onConfirmTurn,
}: UseKeyboardShortcutsOptions) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

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
            } else if (e.key === 'Tab' && dice && turn === 'X') {
                e.preventDefault();
                impactLight();
                onSwapDice();
            } else if ((e.key === 'd' || e.key === 'D') && canDouble) {
                e.preventDefault();
                impactHeavy();
                soundEngine.playCubeOffer();
                onOfferDouble();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, gamePhase, turn, dice, canDouble, canConfirm, onRollDice, onSwapDice, onOfferDouble, onConfirmTurn]);
}
