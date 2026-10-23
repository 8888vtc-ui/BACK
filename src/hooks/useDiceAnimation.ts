'use client';

/**
 * Hook et Physique de Lancer des Dés (Audit 5 / 20 — Dice Roll Pacing).
 *
 * Exigences :
 *   1. Calibrer l'animation de roulement strictement entre 350 ms et 420 ms
 *      avec décélération exponentielle (`computeExponentialDiceDeceleration`).
 *   2. Synchroniser l'impact sonore exactement à la pose des dés sur le tapis (`onSettleSound`).
 *   3. Verrouiller les clics sur les pions pendant les 350–420 ms du roulement (`areCheckerClicksLocked`)
 *      pour éviter les faux départs.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../lib/sound/soundEngine';

/** Borne inférieure de durée du lancer (ms). */
export const DICE_ROLL_MIN_DURATION_MS = 350;
/** Borne supérieure de durée du lancer (ms). */
export const DICE_ROLL_MAX_DURATION_MS = 420;
/** Durée nominale calibrée d'un lancer de dés (ms). */
export const DICE_ROLL_DEFAULT_DURATION_MS = 385;
/** Courbe CSS équivalente à une décélération exponentielle franche. */
export const DICE_ROLL_DECELERATION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';
/** Facteur d'amortissement exponentiel sur la feutrine. */
export const DICE_ROLL_EXPONENTIAL_K = 5;

/**
 * Borne strictement toute durée d'animation de lancer de dés dans l'intervalle `[350, 420] ms`.
 */
export function clampDiceRollDuration(durationMs: number = DICE_ROLL_DEFAULT_DURATION_MS): number {
    if (!Number.isFinite(durationMs)) return DICE_ROLL_DEFAULT_DURATION_MS;
    return Math.max(DICE_ROLL_MIN_DURATION_MS, Math.min(DICE_ROLL_MAX_DURATION_MS, Math.round(durationMs)));
}

/**
 * Calcule la durée exacte de roulement d'un dé selon son index (`0..3`)
 * tout en restant strictement dans la fenêtre `[350, 420] ms`.
 */
export function computeDieRollDurationForIndex(
    rollIndex: number = 0,
    baseDurationMs: number = 370,
): number {
    const safeIdx = Math.max(0, Math.min(3, Math.trunc(rollIndex)));
    const staggered = baseDurationMs + (safeIdx % 2 === 1 ? 30 : safeIdx * 10);
    return clampDiceRollDuration(staggered);
}

/**
 * Courbe mathématique pure de décélération exponentielle normalisée sur `[0, 1]` :
 * `f(t) = (1 - exp(-k * t)) / (1 - exp(-k))`
 * - `f(0) = 0`
 * - `f(1) = 1`
 * - La vitesse décroît exponentiellement (`f'(t) = k * exp(-k * t) / (1 - exp(-k))`).
 */
export function computeExponentialDiceDeceleration(
    progress: number,
    k: number = DICE_ROLL_EXPONENTIAL_K,
): number {
    if (!Number.isFinite(progress) || progress <= 0) return 0;
    if (progress >= 1) return 1;
    const safeK = k > 0 ? k : DICE_ROLL_EXPONENTIAL_K;
    const denom = 1 - Math.exp(-safeK);
    if (denom <= 0) return progress;
    return (1 - Math.exp(-safeK * progress)) / denom;
}

export interface UseDiceAnimationParams {
    /** Paire de dés courante (`null` avant le lancer). */
    dice: readonly [number, number] | null | undefined;
    /** Durée cible du roulement en ms (bornée automatiquement dans `[350, 420]`). */
    durationMs?: number;
    /** Déclenche l'animation dès le montage initial si `dice` est déjà non-nul (défaut : `false`). */
    animateOnMount?: boolean;
    /** Callback déclenché au démarrage du roulement (`t = 0 ms`). */
    onRollStartSound?: () => void;
    /** Callback déclenché exactement à la pose des dés sur le tapis (`t = durationMs`). */
    onSettleSound?: () => void;
}

export interface UseDiceAnimationResult {
    /** Vrai pendant les 350–420 ms où les dés roulent sur le tapis. */
    isRolling: boolean;
    /** Vrai tant que les clics sur les pions doivent être verrouillés (évite les faux départs). */
    areCheckerClicksLocked: boolean;
    /** Durée calibrée effective (entre 350 ms et 420 ms). */
    rollDurationMs: number;
    /** Courbe de décélération exponentielle CSS. */
    easing: string;
    /** Déclenche manuellement un cycle de roulement calibré. */
    triggerRollAnimation: () => void;
}

export function useDiceAnimation({
    dice,
    durationMs = DICE_ROLL_DEFAULT_DURATION_MS,
    animateOnMount = false,
    onRollStartSound,
    onSettleSound,
}: UseDiceAnimationParams): UseDiceAnimationResult {
    const calibratedDurationMs = clampDiceRollDuration(durationMs);
    const [isRolling, setIsRolling] = useState<boolean>(() => Boolean(animateOnMount && dice));

    const prevDiceSigRef = useRef<string | null>(dice ? `${dice[0]}-${dice[1]}` : null);
    const isInitialMountRef = useRef<boolean>(true);
    const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onStartSoundRef = useRef(onRollStartSound);
    const onSettleSoundRef = useRef(onSettleSound);
    useEffect(() => {
        onStartSoundRef.current = onRollStartSound;
        onSettleSoundRef.current = onSettleSound;
    }, [onRollStartSound, onSettleSound]);

    const clearRollTimer = useCallback(() => {
        if (rollTimerRef.current !== null) {
            clearTimeout(rollTimerRef.current);
            rollTimerRef.current = null;
        }
    }, []);

    const startRollCycle = useCallback(() => {
        clearRollTimer();
        setIsRolling(true);
        if (onStartSoundRef.current) {
            onStartSoundRef.current();
        }

        rollTimerRef.current = setTimeout(() => {
            rollTimerRef.current = null;
            setIsRolling(false);
            if (onSettleSoundRef.current) {
                onSettleSoundRef.current();
            } else {
                soundEngine.playCheckerClack();
            }
        }, calibratedDurationMs);
    }, [calibratedDurationMs, clearRollTimer]);

    useEffect(() => {
        const currentSig = dice ? `${dice[0]}-${dice[1]}` : null;

        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            prevDiceSigRef.current = currentSig;
            if (animateOnMount && currentSig !== null) {
                startRollCycle();
            }
            return () => clearRollTimer();
        }

        const prevSig = prevDiceSigRef.current;
        prevDiceSigRef.current = currentSig;

        if (currentSig === null) {
            clearRollTimer();
            setIsRolling(false);
            return;
        }

        if (prevSig === null && currentSig !== null) {
            startRollCycle();
        }
    }, [dice, animateOnMount, startRollCycle, clearRollTimer]);

    useEffect(() => () => clearRollTimer(), [clearRollTimer]);

    return {
        isRolling,
        areCheckerClicksLocked: isRolling,
        rollDurationMs: calibratedDurationMs,
        easing: DICE_ROLL_DECELERATION_EASING,
        triggerRollAnimation: startRollCycle,
    };
}

export default useDiceAnimation;
