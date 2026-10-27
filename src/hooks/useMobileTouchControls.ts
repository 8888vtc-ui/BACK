'use client';

/**
 * Hook de contrôles Mobile (100 % tactile) — Tap-to-Move, Target Preview, Swap Dice
 * & Ergonomie Mode 1 Main / Thumb Zone (Audit 2 & Audit 16 / 20).
 *
 * Exigences Audit 16 / 20 :
 *   1. Contrôles vitaux regroupés dans le quart inférieur de l'écran (Thumb Zone).
 *   2. Commutation ergonomique Droitier (`'right'`) / Gaucher (`'left'`) persistée.
 *   3. Prévention des gestes système parasites (swipe retour iOS/Android sur les bords,
 *      pull-to-refresh `overscroll-behavior: none`, `touch-action: none`).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useState } from 'react';
import { X_BAR, O_BAR, type BoardState } from '../engine/backgammonEngine';
import { predictBestTapMove } from '../engine/tapToMovePredictor';
import { impactMedium, selectionChangedHaptic } from '../lib/capacitor/haptics';

export type MobileHandedness = 'right' | 'left';
export const MOBILE_HANDEDNESS_STORAGE_KEY = 'bg_mobile_handedness';
export const SYSTEM_EDGE_SWIPE_GUARD_PX = 24;

export interface SystemGestureProtectionStyle {
    readonly touchAction: 'none' | 'manipulation';
    readonly overscrollBehavior: 'none';
    readonly WebkitUserSelect: 'none';
    readonly userSelect: 'none';
}

/** Lit la préférence latérale mobile (Droitier par défaut). */
export function getSavedMobileHandedness(
    defaultHandedness: MobileHandedness = 'right',
): MobileHandedness {
    if (typeof window === 'undefined') return defaultHandedness;
    try {
        const raw = window.localStorage.getItem(MOBILE_HANDEDNESS_STORAGE_KEY);
        if (raw === 'left' || raw === 'right') return raw;
    } catch {
        // Ignore SecurityError
    }
    return defaultHandedness;
}

/** Sauvegarde la préférence Droitier / Gaucher dans localStorage. */
export function saveMobileHandedness(handedness: MobileHandedness): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(MOBILE_HANDEDNESS_STORAGE_KEY, handedness);
    } catch {
        // Ignore QuotaExceededError / SecurityError
    }
}

/** Bascule entre le mode Droitier ('right') et Gaucher ('left'). */
export function toggleMobileHandedness(current: MobileHandedness): MobileHandedness {
    return current === 'right' ? 'left' : 'right';
}

/**
 * Détermine si un contact tactile démarre dans la zone critique des bords système
 * (≤ 24px du bord gauche ou droit de l'écran) où iOS/Android déclenchent le geste « Retour ».
 */
export function shouldPreventSystemEdgeSwipe(
    clientX: number,
    viewportWidth: number,
    edgeGuardPx: number = SYSTEM_EDGE_SWIPE_GUARD_PX,
): boolean {
    if (!Number.isFinite(clientX) || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
        return false;
    }
    return clientX <= edgeGuardPx || clientX >= viewportWidth - edgeGuardPx;
}

/** Retourne les propriétés CSS verrouillant les gestes système parasites (pull-to-refresh, zoom, sélection). */
export function getThumbZoneGestureProtectionStyle(
    lockPanning: boolean = true,
): SystemGestureProtectionStyle {
    return {
        touchAction: lockPanning ? 'none' : 'manipulation',
        overscrollBehavior: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
    };
}

/** Sous-ensemble minimal des propriétés du jeu nécessaires au tap-to-move. */
export interface MobileGameView {
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    state: BoardState;
    selected?: { point: number; die: 0 | 1 | null } | null;
}

export interface UseMobileTouchControlsOptions {
    game: MobileGameView;
    /** Joue un coup (from, to, die). */
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    /** Sélectionne un pion pour afficher ses destinations fantômes. */
    onSelectChecker?: (point: number) => void;
    /** Dé actif (0 ou 1). */
    activeDie: 0 | 1;
    /** Inverse l'ordre des dés. */
    onSwapDice: () => void;
    /** Préférence latérale initiale optionnelle ('right' | 'left'). */
    initialHandedness?: MobileHandedness;
}

export interface UseMobileTouchControlsResult {
    handleTapPoint: (point: number) => void;
    handleTapDice: () => void;
    handedness: MobileHandedness;
    setHandedness: (next: MobileHandedness) => void;
    toggleHandedness: () => void;
}

export function useMobileTouchControls({
    game,
    onPlayMove,
    onSelectChecker,
    activeDie,
    onSwapDice,
    initialHandedness,
}: UseMobileTouchControlsOptions): UseMobileTouchControlsResult {
    const [handedness, setHandednessState] = useState<MobileHandedness>(() =>
        initialHandedness ?? getSavedMobileHandedness('right'),
    );

    const setHandedness = useCallback((next: MobileHandedness) => {
        setHandednessState(next);
        saveMobileHandedness(next);
    }, []);

    const toggleHandedness = useCallback(() => {
        setHandednessState((prev) => {
            const next = toggleMobileHandedness(prev);
            saveMobileHandedness(next);
            return next;
        });
    }, []);

    const handleTapPoint = useCallback(
        (point: number) => {
            const selectedFrom = game.selected?.point ?? null;

            // 1. Si un pion est déjà sélectionné et que l'utilisateur tape directement sur l'une des
            //    destinations surbrillées, jouer immédiatement le dé correspondant (<16ms).
            if (selectedFrom !== null && selectedFrom !== point) {
                const selectedLeftDests = game.leftDieTargets.get(selectedFrom) ?? [];
                const selectedRightDests = game.rightDieTargets.get(selectedFrom) ?? [];
                const canUseLeft = selectedLeftDests.includes(point);
                const canUseRight = selectedRightDests.includes(point);

                if (canUseLeft || canUseRight) {
                    const chosenDie: 0 | 1 =
                        activeDie === 0 && canUseLeft
                            ? 0
                            : activeDie === 1 && canUseRight
                              ? 1
                              : canUseLeft
                                ? 0
                                : 1;
                    onPlayMove(selectedFrom, point, chosenDie);
                    return;
                }
            }

            // 2. Priorité absolue à la sortie de la barre si un pion est sur la barre
            const isX = game.state.turn === 'X';
            const ownBarPoint = isX ? X_BAR : O_BAR;
            const hasCheckerOnBar = isX
                ? (game.state.board[X_BAR] ?? 0) > 0
                : (game.state.board[O_BAR] ?? 0) < 0;
            const effectiveSource =
                hasCheckerOnBar &&
                point !== ownBarPoint &&
                !game.leftDieTargets.has(point) &&
                !game.rightDieTargets.has(point)
                    ? ownBarPoint
                    : point;

            if (hasCheckerOnBar && point !== ownBarPoint) {
                const barLeftDests = game.leftDieTargets.get(ownBarPoint) ?? [];
                const barRightDests = game.rightDieTargets.get(ownBarPoint) ?? [];
                if (barLeftDests.includes(point) || barRightDests.includes(point)) {
                    const die: 0 | 1 =
                        activeDie === 0 && barLeftDests.includes(point)
                            ? 0
                            : activeDie === 1 && barRightDests.includes(point)
                              ? 1
                              : barLeftDests.includes(point)
                                ? 0
                                : 1;
                    onPlayMove(ownBarPoint, point, die);
                    return;
                }
            }

            const leftTargets = game.leftDieTargets.get(effectiveSource) ?? [];
            const rightTargets = game.rightDieTargets.get(effectiveSource) ?? [];
            const isSelected = selectedFrom === effectiveSource;

            const prediction = predictBestTapMove({
                fromPoint: effectiveSource,
                board: game.state.board,
                player: game.state.turn,
                leftTargets,
                rightTargets,
                dice: game.state.dice,
                activeDie,
                isSelected,
            });

            if (prediction.action === 'SELECT' && onSelectChecker) {
                void selectionChangedHaptic();
                onSelectChecker(effectiveSource);
                return;
            }

            if (prediction.selectedTarget) {
                void impactMedium();
                onPlayMove(effectiveSource, prediction.selectedTarget.to, prediction.selectedTarget.die);
            }
        },
        [
            activeDie,
            game.leftDieTargets,
            game.rightDieTargets,
            game.selected?.point,
            game.state.board,
            game.state.dice,
            game.state.turn,
            onPlayMove,
            onSelectChecker,
        ],
    );

    const handleTapDice = useCallback(() => {
        onSwapDice();
    }, [onSwapDice]);

    return {
        handleTapPoint,
        handleTapDice,
        handedness,
        setHandedness,
        toggleHandedness,
    };
}
