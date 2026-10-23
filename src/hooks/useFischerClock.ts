'use client';

/**
 * Hook d'Horloge Compétitive Fischer / Bronstein (Audit 15 / 20).
 *
 * Exigences :
 *   1. Précision 100ms sous 10s (`CLOCK_CRITICAL_TICK_INTERVAL_MS = 100`, affichage `8.4s`).
 *   2. Transition délai / incrément Fischer fluide sans saut (`switchClockTurn` + `computeClockTick`).
 *   3. Alerte sonore tic-tac (1 bip par seconde sous 10s) + indicateur de flash rouge non-bloquant.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Player } from '../engine/backgammonEngine';
import {
    CLOCK_CRITICAL_THRESHOLD_MS,
    CLOCK_CRITICAL_TICK_INTERVAL_MS,
    CLOCK_NORMAL_TICK_INTERVAL_MS,
    computeClockTick,
    createMatchClock,
    formatClockTime,
    pauseClock,
    resumeClock,
    switchClockTurn,
    type ClockConfig,
    type MatchClockState,
} from '../features/multiplayer/clockManager';

export interface UseFischerClockOptions {
    config: ClockConfig;
    activePlayer: Player;
    isPaused?: boolean;
    onFlagFall?: (loser: Player) => void;
    /** Callback déclenché une fois par seconde lorsque la réserve tombe sous 10s (tic-tac sonore). */
    onCriticalTick?: (secondsLeft: number) => void;
    /** Permet d'injecter une horloge monotone personnalisée pour les tests déterministes. */
    nowProvider?: () => number;
}

export interface UseFischerClockReturn {
    readonly clockState: MatchClockState;
    readonly bankXMs: number;
    readonly bankOMs: number;
    readonly delayRemainingMs: number;
    readonly formattedX: string;
    readonly formattedO: string;
    readonly formattedDelay: string | null;
    readonly isCriticalX: boolean;
    readonly isCriticalO: boolean;
    readonly isFlagFallen: boolean;
    readonly flagFallenPlayer: Player | null;
    readonly tickIntervalMs: number;
}

export function useFischerClock({
    config,
    activePlayer,
    isPaused = false,
    onFlagFall,
    onCriticalTick,
    nowProvider = () => Date.now(),
}: UseFischerClockOptions): UseFischerClockReturn {
    const [clockState, setClockState] = useState<MatchClockState>(() =>
        createMatchClock(config, activePlayer, nowProvider()),
    );
    const [nowMs, setNowMs] = useState<number>(() => nowProvider());
    const prevPlayerRef = useRef<Player>(activePlayer);
    const prevPausedRef = useRef<boolean>(isPaused);
    const lastAlertedSecondRef = useRef<number | null>(null);
    const flagFallNotifiedRef = useRef<boolean>(false);

    // Changement de tour sans saut (application de l'incrément Fischer ou réinitialisation du délai)
    useEffect(() => {
        if (prevPlayerRef.current !== activePlayer) {
            const currentNow = nowProvider();
            prevPlayerRef.current = activePlayer;
            lastAlertedSecondRef.current = null;
            setClockState((prev) => switchClockTurn(prev, activePlayer, config, currentNow));
            setNowMs(currentNow);
        }
    }, [activePlayer, config, nowProvider]);

    // Gestion Pause / Reprise
    useEffect(() => {
        if (prevPausedRef.current !== isPaused) {
            const currentNow = nowProvider();
            prevPausedRef.current = isPaused;
            setClockState((prev) =>
                isPaused ? pauseClock(prev, currentNow) : resumeClock(prev, currentNow),
            );
            setNowMs(currentNow);
        }
    }, [isPaused, nowProvider]);

    const tick = useMemo(() => computeClockTick(clockState, nowMs), [clockState, nowMs]);

    const activeBankMs = clockState.activePlayer === 'X' ? tick.bankXMs : tick.bankOMs;
    const isCriticalActive =
        !clockState.isPaused &&
        !tick.isFlagFallen &&
        clockState.timeControlType !== 'unlimited' &&
        tick.delayRemainingMs === 0 &&
        activeBankMs > 0 &&
        activeBankMs < CLOCK_CRITICAL_THRESHOLD_MS;

    const tickIntervalMs = isCriticalActive
        ? CLOCK_CRITICAL_TICK_INTERVAL_MS
        : CLOCK_NORMAL_TICK_INTERVAL_MS;

    // Boucle de rafraîchissement adaptative (100ms sous 10s, 250ms sinon)
    useEffect(() => {
        if (clockState.isPaused || tick.isFlagFallen || clockState.timeControlType === 'unlimited') {
            return;
        }
        const id = window.setInterval(() => {
            setNowMs(nowProvider());
        }, tickIntervalMs);

        return () => window.clearInterval(id);
    }, [clockState.isPaused, tick.isFlagFallen, clockState.timeControlType, tickIntervalMs, nowProvider]);

    // Alerte sonore tic-tac (1 fois par seconde entière sous 10s)
    useEffect(() => {
        if (!isCriticalActive) {
            lastAlertedSecondRef.current = null;
            return;
        }
        const currentWholeSecond = Math.ceil(activeBankMs / 1000);
        if (
            currentWholeSecond >= 1 &&
            currentWholeSecond <= 10 &&
            lastAlertedSecondRef.current !== currentWholeSecond
        ) {
            lastAlertedSecondRef.current = currentWholeSecond;
            onCriticalTick?.(currentWholeSecond);
        }
    }, [isCriticalActive, activeBankMs, onCriticalTick]);

    // Notification unique de chute de drapeau
    useEffect(() => {
        if (tick.isFlagFallen && tick.flagFallenPlayer && !flagFallNotifiedRef.current) {
            flagFallNotifiedRef.current = true;
            onFlagFall?.(tick.flagFallenPlayer);
        }
    }, [tick.isFlagFallen, tick.flagFallenPlayer, onFlagFall]);

    const isCriticalX = isCriticalActive && clockState.activePlayer === 'X';
    const isCriticalO = isCriticalActive && clockState.activePlayer === 'O';

    const formattedDelay =
        tick.delayRemainingMs > 0
            ? `+${Math.ceil(tick.delayRemainingMs / 1000)}s`
            : null;

    return {
        clockState,
        bankXMs: tick.bankXMs,
        bankOMs: tick.bankOMs,
        delayRemainingMs: tick.delayRemainingMs,
        formattedX: formatClockTime(tick.bankXMs, true),
        formattedO: formatClockTime(tick.bankOMs, true),
        formattedDelay,
        isCriticalX,
        isCriticalO,
        isFlagFallen: tick.isFlagFallen,
        flagFallenPlayer: tick.flagFallenPlayer,
        tickIntervalMs,
    };
}
