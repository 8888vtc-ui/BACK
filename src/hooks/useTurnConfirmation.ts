'use client';

/**
 * Hook de Confirmation de Tour & Auto-Fin de Tour étendu (Audit 8 / 20 & Game Feel Spec §5).
 *
 * Exigences :
 *   1. Afficher le bouton « Valider / Done » uniquement lorsque tous les dés légaux ont été joués
 *      (`areAllLegalDicePlayed`).
 *   2. Supporter les 4 modes d'auto-confirmation de `gameplaySettings.ts` (`AutoConfirmMode`) :
 *      - `'never'` : nécessite toujours un clic sur « Valider » ou sur les dés.
 *      - `'forced_only'` (défaut tournoi) : valide automatiquement uniquement quand le joueur
 *        n'avait aucun choix tactique (coups forcés), sinon attend confirmation.
 *      - `'always_except_cube'` : valide automatiquement dès que les 2 ou 4 dés sont joués,
 *        sauf si le tour suivant implique une décision critique de videau adverse.
 *      - `'always'` : valide immédiatement dès l'épuisement des dés jouables.
 *   3. Donner un feedback visuel (`turnTransitionPulse`), sonore et haptique net au changement
 *      de joueur actif.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { impactMedium } from '../lib/capacitor/haptics';
import { soundEngine } from '../lib/sound/soundEngine';
import {
    AUTO_CONFIRM_MODES,
    getNextAutoConfirmMode,
    getSavedAutoConfirmMode,
    isAutoConfirmMode,
    saveAutoConfirmMode,
    type AutoConfirmMode,
} from '../lib/settings/gameplaySettings';

export {
    AUTO_CONFIRM_MODES,
    getNextAutoConfirmMode,
    getSavedAutoConfirmMode,
    isAutoConfirmMode,
    saveAutoConfirmMode,
    type AutoConfirmMode,
};

export const AUTO_CONFIRM_TURN_STORAGE_KEY = 'bg_auto_confirm_turn';
export const AUTO_CONFIRM_FORCED_DELAY_MS = 400;
export const TURN_TRANSITION_PULSE_DURATION_MS = 220;

export function getSavedAutoConfirmPreference(defaultValue: boolean = false): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
    try {
        const raw = window.localStorage.getItem(AUTO_CONFIRM_TURN_STORAGE_KEY);
        if (raw === 'true' || raw === 'always' || raw === 'always_except_cube') return true;
        if (raw === 'false' || raw === 'never' || raw === 'forced_only') return false;
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

export interface ShouldAutoConfirmParams {
    readonly mode: AutoConfirmMode;
    readonly isForcedSingleChoice: boolean;
    readonly opponentCanDoubleNextTurn?: boolean;
}

/**
 * Règle pure de décision d'auto-confirmation selon `AutoConfirmMode` (Game Feel Spec §5) :
 * - `'never'` : jamais d'auto-confirmation (même sur coup forcé).
 * - `'forced_only'` : auto-confirmation uniquement si `isForcedSingleChoice === true`.
 * - `'always_except_cube'` : auto-confirmation sauf si l'adversaire peut doubler au tour suivant
 *   (les coups forcés restent auto-confirmés).
 * - `'always'` : auto-confirmation systématique dès que tous les dés légaux sont joués.
 */
export function shouldAutoConfirmTurn({
    mode,
    isForcedSingleChoice,
    opponentCanDoubleNextTurn = false,
}: ShouldAutoConfirmParams): boolean {
    switch (mode) {
        case 'never':
            return false;
        case 'forced_only':
            return Boolean(isForcedSingleChoice);
        case 'always_except_cube':
            return Boolean(isForcedSingleChoice) || !opponentCanDoubleNextTurn;
        case 'always':
            return true;
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
    /** Vrai si le tour suivant implique une décision critique de videau adverse (`always_except_cube`). */
    opponentCanDoubleNextTurn?: boolean;
    /** Mode contrôlé d'auto-confirmation (`'never' | 'forced_only' | 'always_except_cube' | 'always'`). */
    autoConfirmMode?: AutoConfirmMode;
    /** Mode initial d'auto-confirmation (si non contrôlé). */
    initialAutoConfirmMode?: AutoConfirmMode;
    /** Préférence initiale booléenne rétrocompatible (si fournie : `true -> 'always'`, `false -> 'forced_only'`). */
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
    /** État booléen actif (`true` si mode `'always'` ou `'always_except_cube'`). */
    autoConfirmEnabled: boolean;
    /** Mode granulaire actif (`'never' | 'forced_only' | 'always_except_cube' | 'always'`). */
    autoConfirmMode: AutoConfirmMode;
    /** Vrai si le tour courant remplit les conditions d'auto-confirmation du mode actif. */
    shouldAutoConfirmCurrentTurn: boolean;
    /** Vrai pendant les 220 ms suivant la confirmation (feedback visuel de changement de joueur). */
    turnTransitionPulse: boolean;
    /** Définit et persiste le mode d'auto-confirmation. */
    setAutoConfirmMode: (mode: AutoConfirmMode) => void;
    /** Passe au mode suivant (`never → forced_only → always_except_cube → always`). */
    cycleAutoConfirmMode: () => AutoConfirmMode;
    /** Bascule et persiste l'option booléenne « Auto-fin de tour ». */
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
    opponentCanDoubleNextTurn = false,
    autoConfirmMode: controlledMode,
    initialAutoConfirmMode,
    initialAutoConfirm,
    autoConfirmDelayMs = AUTO_CONFIRM_FORCED_DELAY_MS,
    onConfirm,
    onTurnFeedback,
}: UseTurnConfirmationParams): UseTurnConfirmationResult {
    const [internalMode, setInternalMode] = useState<AutoConfirmMode>(() => {
        if (controlledMode !== undefined) return controlledMode;
        if (initialAutoConfirmMode !== undefined) return initialAutoConfirmMode;
        if (initialAutoConfirm !== undefined) return initialAutoConfirm ? 'always' : 'forced_only';
        return getSavedAutoConfirmMode('forced_only');
    });
    const [turnTransitionPulse, setTurnTransitionPulse] = useState<boolean>(false);

    const effectiveMode: AutoConfirmMode = controlledMode ?? internalMode;
    const autoConfirmEnabled = effectiveMode === 'always' || effectiveMode === 'always_except_cube';

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

    const shouldAutoConfirmCurrentTurn = useMemo(
        () =>
            shouldAutoConfirmTurn({
                mode: effectiveMode,
                isForcedSingleChoice,
                opponentCanDoubleNextTurn,
            }),
        [effectiveMode, isForcedSingleChoice, opponentCanDoubleNextTurn],
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

    const setAutoConfirmMode = useCallback((mode: AutoConfirmMode) => {
        setInternalMode(mode);
        saveAutoConfirmMode(mode);
        saveAutoConfirmPreference(mode === 'always' || mode === 'always_except_cube');
    }, []);

    const cycleAutoConfirmMode = useCallback((): AutoConfirmMode => {
        let next: AutoConfirmMode = 'forced_only';
        setInternalMode((prev) => {
            const base = controlledMode ?? prev;
            next = getNextAutoConfirmMode(base);
            saveAutoConfirmMode(next);
            saveAutoConfirmPreference(next === 'always' || next === 'always_except_cube');
            return next;
        });
        return next;
    }, [controlledMode]);

    const toggleAutoConfirm = useCallback((nextValue?: boolean): boolean => {
        let updated = false;
        setInternalMode((prev) => {
            const wasEnabled = prev === 'always' || prev === 'always_except_cube';
            updated = nextValue !== undefined ? nextValue : !wasEnabled;
            const nextMode: AutoConfirmMode = updated ? 'always' : 'forced_only';
            saveAutoConfirmMode(nextMode);
            saveAutoConfirmPreference(updated);
            return nextMode;
        });
        return updated;
    }, []);

    useEffect(() => {
        cancelPendingAutoConfirm();
        if (!isDoneButtonVisible) return;
        if (!shouldAutoConfirmCurrentTurn) return;

        autoTimerRef.current = setTimeout(() => {
            autoTimerRef.current = null;
            confirmTurnNow();
        }, Math.max(0, autoConfirmDelayMs));

        return () => cancelPendingAutoConfirm();
    }, [isDoneButtonVisible, shouldAutoConfirmCurrentTurn, autoConfirmDelayMs, confirmTurnNow, cancelPendingAutoConfirm]);

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
        autoConfirmMode: effectiveMode,
        shouldAutoConfirmCurrentTurn,
        turnTransitionPulse,
        setAutoConfirmMode,
        cycleAutoConfirmMode,
        toggleAutoConfirm,
        confirmTurnNow,
        cancelPendingAutoConfirm,
    };
}

export default useTurnConfirmation;
