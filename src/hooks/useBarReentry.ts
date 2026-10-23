'use client';

/**
 * Hook d'ergonomie de rentrée depuis la barre centrale (Audit 3 / 20 — useBarReentry).
 *
 * Responsabilités :
 *   1. Détecte si le joueur actif a au moins un pion frappé sur la barre (`bar[player] > 0`).
 *   2. Verrouille visuellement et fonctionnellement tous les pions hors-barre (flèches 1..24).
 *   3. Illumine uniquement les points d'entrée légaux dans le jan intérieur adverse (1..6 ou 19..24).
 *   4. Affiche un message explicite (« Aucun coup possible — Portes fermées (Danse) ») et
 *      passe automatiquement le tour après 800 ms (`BAR_FANNED_AUTO_PASS_MS`) si aucun dé
 *      ne permet de rentrer ("Danced / Fanned").
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Player } from '../engine/backgammonEngine';
import {
    BAR_DANCED_MESSAGE,
    BAR_FANNED_AUTO_PASS_MS,
    getLegalBarEntryPoints,
    getPlayerBarCount,
    getPlayerBarPoint,
    isDancedOnBar,
    isPointLockedByBar,
} from '../engine/barRules';

export interface UseBarReentryParams {
    board: readonly number[];
    player: Player;
    dice: readonly [number, number] | null | undefined;
    usedDice?: readonly boolean[];
    leftDieTargets?: ReadonlyMap<number, readonly number[]>;
    rightDieTargets?: ReadonlyMap<number, readonly number[]>;
    gamePhase?: string;
    /** Callback déclenché automatiquement après 800 ms lorsque le joueur danse sur la barre. */
    onAutoPassTurn?: () => void;
    /** Permet de personnaliser le délai d'auto-passage (défaut : 800 ms). */
    autoPassDelayMs?: number;
}

export interface UseBarReentryResult {
    /** Vrai si le joueur au trait a au moins un pion sur la barre (`bar[player] > 0`). */
    isOnBar: boolean;
    /** Nombre de pions du joueur au trait sur la barre. */
    barCount: number;
    /** Index moteur de la barre du joueur au trait (`0` pour X, `25` pour O). */
    barPoint: number;
    /** Ensemble des flèches d'entrée légales dans le jan intérieur adverse (19..24 ou 1..6). */
    legalEntryPoints: Set<number>;
    /** Vrai si tous les autres pions du plateau (1..24) doivent être verrouillés. */
    areOtherCheckersLocked: boolean;
    /** Vrai si le joueur a lancé les dés mais qu'aucune porte d'entrée n'est ouverte (Danse). */
    isDanced: boolean;
    /** Message explicite à afficher lorsque `isDanced` est vrai (`null` sinon). */
    dancedMessage: string | null;
    /** Indique si une flèche donnée (1..24) contient des pions du joueur verrouillés par la barre. */
    isPointLocked: (pointNumber: number) => boolean;
}

export function useBarReentry({
    board,
    player,
    dice,
    usedDice,
    leftDieTargets,
    rightDieTargets,
    gamePhase = 'HUMAN_MOVING',
    onAutoPassTurn,
    autoPassDelayMs = BAR_FANNED_AUTO_PASS_MS,
}: UseBarReentryParams): UseBarReentryResult {
    const barCount = useMemo(() => getPlayerBarCount(board, player), [board, player]);
    const isOnBar = barCount > 0;
    const barPoint = useMemo(() => getPlayerBarPoint(player), [player]);

    const isHumanTurnActive =
        gamePhase === 'HUMAN_MOVING' ||
        gamePhase === 'HUMAN_READY_TO_COMMIT' ||
        gamePhase === 'PLAYING_MOVES';

    const legalEntryPoints = useMemo(() => {
        if (!isOnBar || !dice || !isHumanTurnActive) return new Set<number>();
        return getLegalBarEntryPoints(
            board,
            player,
            leftDieTargets,
            rightDieTargets,
            dice,
            usedDice,
        );
    }, [isOnBar, dice, isHumanTurnActive, board, player, leftDieTargets, rightDieTargets, usedDice]);

    const isDanced = useMemo(() => {
        if (!isOnBar || !dice || !isHumanTurnActive) return false;
        return isDancedOnBar(board, player, dice, leftDieTargets, rightDieTargets, usedDice);
    }, [isOnBar, dice, isHumanTurnActive, board, player, leftDieTargets, rightDieTargets, usedDice]);

    const dancedMessage = isDanced ? BAR_DANCED_MESSAGE : null;
    const areOtherCheckersLocked = isOnBar;

    const isPointLocked = useCallback(
        (pointNumber: number): boolean => isPointLockedByBar(board, player, pointNumber),
        [board, player],
    );

    const onAutoPassRef = useRef(onAutoPassTurn);
    useEffect(() => {
        onAutoPassRef.current = onAutoPassTurn;
    }, [onAutoPassTurn]);

    useEffect(() => {
        if (!isDanced || !onAutoPassRef.current) return;

        const timer = setTimeout(() => {
            onAutoPassRef.current?.();
        }, autoPassDelayMs);

        return () => clearTimeout(timer);
    }, [isDanced, autoPassDelayMs]);

    return {
        isOnBar,
        barCount,
        barPoint,
        legalEntryPoints,
        areOtherCheckersLocked,
        isDanced,
        dancedMessage,
        isPointLocked,
    };
}

export default useBarReentry;
