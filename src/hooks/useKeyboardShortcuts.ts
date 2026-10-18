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
    turn: 'X' | 'O';
    dice: [number, number] | null;
    canDouble: boolean;
    onRollDice: () => void;
    onSwapDice: () => void;
    onOfferDouble: () => void;
}

export function useKeyboardShortcuts({
    phase,
    turn,
    dice,
    canDouble,
    onRollDice,
    onSwapDice,
    onOfferDouble,
}: UseKeyboardShortcutsOptions) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
                return;
            }

            if (e.key === ' ' && phase === 'WAITING_FOR_ROLL' && turn === 'X') {
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
    }, [phase, turn, dice, canDouble, onRollDice, onSwapDice, onOfferDouble]);
}
