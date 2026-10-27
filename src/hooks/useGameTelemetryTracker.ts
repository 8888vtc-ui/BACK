'use client';

/**
 * Hook de suivi télémétrique anti-triche IA (Move Timing + Détection perte de focus blur / visibilitychange).
 * Conforme à SCALABILITY.md (< 70 lignes).
 */

import { useEffect, useRef } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { GamePhase } from './gameStateReducer';
import {
    createMoveTimingTracker,
    type MoveTimingTracker,
} from '../lib/telemetry/moveTiming';

export interface UseGameTelemetryTrackerOptions {
    phase: GamePhase;
    turn: Player;
    humanPlayer: Player;
    dice: readonly [number, number] | null;
    matchLogLength: number;
}

export function useGameTelemetryTracker({
    phase,
    turn,
    humanPlayer,
    dice,
    matchLogLength,
}: UseGameTelemetryTrackerOptions) {
    const moveTimingTrackerRef = useRef<MoveTimingTracker | null>(null);
    if (!moveTimingTrackerRef.current) {
        moveTimingTrackerRef.current = createMoveTimingTracker();
    }
    const lastTrackedHumanDiceRef = useRef<readonly [number, number] | null>(null);

    useEffect(() => {
        return moveTimingTrackerRef.current?.attachBrowserListeners();
    }, []);

    useEffect(() => {
        const tracker = moveTimingTrackerRef.current;
        if (!tracker) return;

        if (phase === 'PLAYING_MOVES' && turn === humanPlayer && dice) {
            if (!tracker.isDecisionInProgress()) {
                tracker.markDiceRolled(matchLogLength + 1);
            }
            lastTrackedHumanDiceRef.current = [dice[0], dice[1]];
        } else if (tracker.isDecisionInProgress()) {
            const committedDice = lastTrackedHumanDiceRef.current ?? [1, 1];
            tracker.recordMoveValidated({
                turnIndex: matchLogLength || 1,
                player: humanPlayer,
                dice: committedDice,
            });
            lastTrackedHumanDiceRef.current = null;
        }
    }, [phase, turn, dice, humanPlayer, matchLogLength]);

    const resetTelemetry = () => {
        moveTimingTrackerRef.current?.reset();
        lastTrackedHumanDiceRef.current = null;
    };

    return {
        moveTimingTracker: moveTimingTrackerRef.current,
        resetTelemetry,
    };
}
