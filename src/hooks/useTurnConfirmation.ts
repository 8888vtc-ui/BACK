'use client';

/**
 * Hook de Confirmation de Tour & Auto-Fin de Tour (Audit 8 / 20 — useTurnConfirmation).
 *
 * Exigences :
 *   1. Afficher le bouton « Valider / Done » uniquement lorsque tous les dés légaux ont été joués
 *      (`areAllLegalDicePlayed`).
 *   2. Proposer l'option « Auto-fin de tour » (`autoConfirmEnabled`) et valider automatiquement
 *      après `AUTO_CONFIRM_FORCED_DELAY_MS = 400 ms` si activée ou si aucun autre choix n'était possible.
 *   3. Donner un feedback visuel (`turnTransitionPulse`), sonore et haptique net au changement
 *      de joueur actif.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { impactMedium } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';

export const AUTO_CONFIRM_TURN_STORAGE_KEY = 'bg_auto_confirm_turn';
export const AUTO_CONFIRM_FORCED_DELAY_MS = 400;
export const TURN_TRANSITION_PULSE_DURATION_MS = 220;

export function getSavedAutoConfirmPreference(defaultValue: boolean = false): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    try {
        const raw = window.localStorage.getItem(AUTO_CONFIRM_TURN_STORAGE_KEY);
        if (raw === 'true') return true;
        if (raw === 'false') return false;
    } catch {
        // Ignorer les erreurs de stockage
    }
    return defaultValue;
}

export function saveAutoConfirmPreference(enabled: boolean): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(AUTO_CONFIRM_TURN_STORAGE_KEY, String(enabled));
    } catch {
        // Ignorer
    }
}

/**
 * Vérifie mathématiquement si tous les dés légaux du tour courant ont été joués :
 * - Vrai si `gamePhase === 'HUMAN_READY_TO_COMMIT'`.
 * - Ou si `usedDice` est non-vide et tous les dés sont marqués `true`.
 * - Ou si au moins un dé a été joué et qu'il ne reste plus aucune destination légale
 *   dans `leftDieTargets` ni `rightDieTargets` (coup partiel forcé).
 */
export function areAllLegalDicePlayed(
    usedDice: ReadonlyArray<boolean>,
    leftDieTargets?: ReadonlyMap<number, readonly number[]>,
    rightDieTargets?: ReadonlyMap<number, readonly number[]>,
    gamePhase?: string,
): boolean {
    if (gamePhase === 'HUMAN_READY_TO_COMMIT') return true;
    if (gamePhase === 'HUMAN_WAITING_ROLL' || gamePhase === 'WAITING_FOR_ROLL') return false;
    if (usedDice.length === 0) return false;
    if (usedDice.every(Boolean)) return true;

    const anyPlayed = usedDice.some(Boolean);
    if (anyPlayed && leftDieTargets !== undefined && rightDieTargets !== undefined) {
        let remainingTargets = 0;
        for (const dests of leftDieTargets.values()) remainingTargets += dests.length;
        for (const dests of rightDieTargets.values()) remainingTargets += dests.length;
        if (remainingTargets === 0) return true;
    }

    return false;
}

export interface UseTurnConfirmationParams {
    usedDice: ReadonlyArray<boolean>;
    leftDieTargets?: ReadonlyMap<number, readonly number[]>;
    rightDieTargets?: ReadonlyMap<number, readonly number[]>;
    gamePhase?: string;
    canConfirm?: boolean;
    /** Vrai si aucun autre choix n'était possible (coup forcé unique). */
    isForcedSingleChoice?: boolean;
    /** Préférence initiale d'auto-validation (si non fournie, lue depuis localStorage). */
    initialAutoConfirm?: boolean;
    /** Délai d'auto-validation (défaut : `400 ms`). */
    autoConfirmDelayMs?: number;
    /** Callback déclenchant la validation effective du tour. */
    onConfirm: () => void;
    /** Callback optionnel déclenché lors du feedback haptique/visuel. */
    onTurnFeedback?: () => void;
}

export interface UseTurnConfirmationResult {
    /** Vrai uniquement quand tous les dés légaux ont été joués (bouton « Valider / Done » visible). */
    isDoneButtonVisible: boolean;
    /** État courant de l'option « Auto-fin de tour ». */
    autoConfirmEnabled: boolean;
    /** Vrai pendant les 220 ms suivant la confirmation (feedback visuel de changement de joueur). */
    turnTransitionPulse: boolean;
    /** Bascule et persiste l'option « Auto-fin de tour ». */
    toggleAutoConfirm: (nextValue?: boolean) => boolean;
    /** Valide immédiatement le tour avec feedback visuel, sonore et haptique. */
    confirmTurnNow: () => void;
    /** Annule un timer d'auto-fin de tour en cours (ex: si le joueur clique sur Annuler). */
    cancelPendingAutoConfirm: () => void;
}

export function useTurnConfirmation({
    usedDice,
    leftDieTargets,
    rightDieTargets,
    gamePhase = 'HUMAN_MOVING',
    canConfirm = true,
    isForcedSingleChoice = false,
    initialAutoConfirm,
    autoConfirmDelayMs = AUTO_CONFIRM_FORCED_DELAY_MS,
    onConfirm,
    onTurnFeedback,
}: UseTurnConfirmationParams): UseTurnConfirmationResult {
    const [autoConfirmEnabled, setAutoConfirmEnabled] = useState<boolean>(() =>
        initialAutoConfirm !== undefined ? initialAutoConfirm : getSavedAutoConfirmPreference(false),
    );
    const [turnTransitionPulse, setTurnTransitionPulse] = useState<boolean>(false);

    const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onConfirmRef = useRef(onConfirm);
    const onFeedbackRef = useRef(onTurnFeedback);
    onConfirmRef.current = onConfirm;
    onFeedbackRef.current = onTurnFeedback;

    const isDoneButtonVisible = useMemo(
        () => canConfirm && areAllLegalDicePlayed(usedDice, leftDieTargets, rightDieTargets, gamePhase),
        [canConfirm, usedDice, leftDieTargets, rightDieTargets, gamePhase],
    );

    const cancelPendingAutoConfirm = useCallback(() => {
        if (autoTimerRef.current !== null) {
            clearTimeout(autoTimerRef.current);
            autoTimerRef.current = null;
        }
    }, []);

    const confirmTurnNow = useCallback(() => {
        cancelPendingAutoConfirm();
        setTurnTransitionPulse(true);
        if (pulseTimerRef.current !== null) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => {
            pulseTimerRef.current = null;
            setTurnTransitionPulse(false);
        }, TURN_TRANSITION_PULSE_DURATION_MS);

        void impactMedium();
        soundEngine.playCheckerClack();
        onFeedbackRef.current?.();
        onConfirmRef.current();
    }, [cancelPendingAutoConfirm]);

    const toggleAutoConfirm = useCallback((nextValue?: boolean): boolean => {
        let updated = false;
        setAutoConfirmEnabled((prev) => {
            updated = nextValue !== undefined ? nextValue : !prev;
            saveAutoConfirmPreference(updated);
            return updated;
        });
        return updated;
    }, []);

    useEffect(() => {
        cancelPendingAutoConfirm();
        if (!isDoneButtonVisible) return;
        if (!autoConfirmEnabled && !isForcedSingleChoice) return;

        autoTimerRef.current = setTimeout(() => {
            autoTimerRef.current = null;
            confirmTurnNow();
        }, Math.max(0, autoConfirmDelayMs));

        return () => cancelPendingAutoConfirm();
    }, [isDoneButtonVisible, autoConfirmEnabled, isForcedSingleChoice, autoConfirmDelayMs, confirmTurnNow, cancelPendingAutoConfirm]);

    useEffect(
        () => () => {
            cancelPendingAutoConfirm();
            if (pulseTimerRef.current !== null) clearTimeout(pulseTimerRef.current);
        },
        [cancelPendingAutoConfirm],
    );

    return {
        isDoneButtonVisible,
        autoConfirmEnabled,
        turnTransitionPulse,
        toggleAutoConfirm,
        confirmTurnNow,
        cancelPendingAutoConfirm,
    };
}

export default useTurnConfirmation;
