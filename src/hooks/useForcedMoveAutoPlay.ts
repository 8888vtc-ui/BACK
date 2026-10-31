/**
 * Hook d'auto-play et de surbrillance du coup forcé unique (Audit 13 / 20).
 *
 * Rôle :
 *   - Détecte mathématiquement si le joueur ne dispose que d'un seul sous-coup légal
 *     `(from -> to)` sur l'ensemble du plateau (via `detectForcedMove`).
 *   - Si l'option d'auto-play est activée (défaut : `true`), exécute automatiquement
 *     ce coup forcé après `FORCED_MOVE_AUTO_PLAY_DELAY_MS` (300 ms).
 *   - Expose `highlightOrigin` et `highlightDestination` pour faire pulser le pion
 *     de départ et la flèche d'arrivée si l'auto-play est désactivé ou pendant les 300 ms.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    detectForcedMove,
    FORCED_MOVE_AUTO_PLAY_DELAY_MS,
    getSavedForcedMoveAutoPlay,
    saveForcedMoveAutoPlay,
    type ForcedMoveDescriptor,
} from '../engine/forcedMoveDetector';
import { detectGreedyBearOffStep } from '../engine/bearOffRules';

export interface UseForcedMoveAutoPlayOptions {
    phase: string;
    turn: 'X' | 'O';
    isHumanTurn?: boolean;
    board?: readonly number[];
    dice: [number, number] | null;
    usedDice?: readonly boolean[];
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    onPlayMove: (from: number, to: number, die: 0 | 1) => void;
    /** Permet de forcer l'activation/désactivation de l'auto-play (sinon lu depuis localStorage). */
    autoPlayEnabled?: boolean;
    /** Active le Greedy Bearoff (sortie auto sans contact quand 1 seule façon de sortir le max de pions) et l'Auto-Bearoff sur l'As. */
    greedyBearOffEnabled?: boolean;
    /** Délai avant exécution automatique (défaut : 300 ms — Audit 13 / 20). */
    delayMs?: number;
}

export interface UseForcedMoveAutoPlayReturn {
    readonly isForcedMove: boolean;
    readonly forcedMove: ForcedMoveDescriptor | null;
    readonly highlightOrigin: number | null;
    readonly highlightDestination: number | null;
    readonly autoPlayEnabled: boolean;
    readonly setAutoPlayEnabled: (enabled: boolean) => void;
}

export function useForcedMoveAutoPlay({
    phase,
    turn,
    isHumanTurn,
    board,
    dice,
    usedDice,
    leftDieTargets,
    rightDieTargets,
    onPlayMove,
    autoPlayEnabled: externalAutoPlay,
    greedyBearOffEnabled = true,
    delayMs = FORCED_MOVE_AUTO_PLAY_DELAY_MS,
}: UseForcedMoveAutoPlayOptions): UseForcedMoveAutoPlayReturn {
    const [storedAutoPlay, setStoredAutoPlay] = useState<boolean>(() =>
        getSavedForcedMoveAutoPlay(true),
    );

    const effectiveAutoPlay =
        externalAutoPlay !== undefined ? externalAutoPlay : storedAutoPlay;

    const setAutoPlayEnabled = useCallback((enabled: boolean) => {
        setStoredAutoPlay(enabled);
        saveForcedMoveAutoPlay(enabled);
    }, []);

    const activeHumanTurn = isHumanTurn !== undefined ? isHumanTurn : turn === 'X';
    const isMovingPhase = phase === 'PLAYING_MOVES' || phase === 'HUMAN_MOVING';

    const detection = useMemo(() => {
        if (!isMovingPhase || !activeHumanTurn || !dice) {
            return {
                isForced: false,
                forcedMove: null,
                uniqueLegalMoves: [],
                highlightOrigin: null,
                highlightDestination: null,
            };
        }
        const forced = detectForcedMove({ leftDieTargets, rightDieTargets, dice, board, turn });
        if (forced.isForced || !greedyBearOffEnabled || !board) return forced;

        const greedy = detectGreedyBearOffStep({
            board,
            player: turn,
            dice,
            usedDice,
            leftDieTargets,
            rightDieTargets,
        });
        if (!greedy) return forced;
        const descriptor: ForcedMoveDescriptor = {
            from: greedy.from,
            to: greedy.to,
            die: greedy.die,
            dieValue: dice[greedy.die] ?? null,
        };
        return {
            isForced: true,
            forcedMove: descriptor,
            uniqueLegalMoves: [descriptor],
            highlightOrigin: descriptor.from,
            highlightDestination: descriptor.to,
        };
    }, [isMovingPhase, activeHumanTurn, dice, leftDieTargets, rightDieTargets, greedyBearOffEnabled, board, turn, usedDice]);

    useEffect(() => {
        if (!effectiveAutoPlay || !detection.isForced || !detection.forcedMove) {
            return;
        }
        const { from, to, die } = detection.forcedMove;
        const timer = window.setTimeout(() => {
            onPlayMove(from, to, die);
        }, delayMs);

        return () => window.clearTimeout(timer);
    }, [effectiveAutoPlay, detection.isForced, detection.forcedMove, delayMs, onPlayMove]);

    return {
        isForcedMove: detection.isForced,
        forcedMove: detection.forcedMove,
        highlightOrigin: detection.highlightOrigin,
        highlightDestination: detection.highlightDestination,
        autoPlayEnabled: effectiveAutoPlay,
        setAutoPlayEnabled,
    };
}
