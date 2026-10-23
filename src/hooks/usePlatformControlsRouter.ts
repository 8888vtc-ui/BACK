'use client';

import { useIsTouchDevice } from './useIsTouchDevice';
import { useDesktopControls } from './useDesktopControls';
import { useMobileTouchControls } from './useMobileTouchControls';
import type { UseBackgammonGameReturn } from './useBackgammonGame';

export interface UsePlatformControlsRouterParams {
    game: UseBackgammonGameReturn;
    onPlayMoveWithSound: (from: number, to: number, die?: 0 | 1) => void;
    handleSwapDice: () => void;
    preferredDie: 0 | 1 | null;
    activeDie: 0 | 1;
}

/**
 * Aiguillage unifié des interactions utilisateur (tactile mobile vs souris desktop).
 */
export function usePlatformControlsRouter({
    game,
    onPlayMoveWithSound,
    handleSwapDice,
    preferredDie,
    activeDie,
}: UsePlatformControlsRouterParams) {
    const isTouchDevice = useIsTouchDevice();

    const desktopControls = useDesktopControls({
        game,
        onPlayMove: onPlayMoveWithSound,
        onSelectChecker: (point, die) => game.selectChecker(point, die),
        onSwapDice: handleSwapDice,
        preferredDie: activeDie ?? preferredDie ?? undefined,
    });

    const mobileControls = useMobileTouchControls({
        game,
        onPlayMove: onPlayMoveWithSound,
        onSelectChecker: (point) => game.selectChecker(point),
        activeDie,
        onSwapDice: handleSwapDice,
    });

    return {
        isTouchDevice,
        routedCheckerClick: isTouchDevice ? mobileControls.handleTapPoint : desktopControls.handleOneClick,
        routedCheckerRightClick: isTouchDevice ? mobileControls.handleTapPoint : desktopControls.handleOneRightClick,
        routedDiceClick: isTouchDevice ? mobileControls.handleTapDice : desktopControls.handleDiceClick,
    };
}
