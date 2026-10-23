/**
 * Gestionnaire d'Horloges de Match (Tournament Clocks) pour le Backgammon (Audit 15 / 20).
 *
 * Implémente les règles officielles de cadences WBF / WBIF :
 * 1. Mode Delay (Bronstein / Simple Delay) : réserve principale + délai gratuit par coup.
 * 2. Mode Fischer (Incrément) : réserve principale + incrément fixe ajouté en fin de tour.
 * 3. Mode Per-Turn : temps fixe strict par coup.
 *
 * Détection de chute de drapeau (Flag Fall / Timeout) et précision 100ms sous 10s.
 */

import type { Player } from '../../engine/backgammonEngine';

export type TimeControlType = 'delay' | 'bronstein' | 'fischer' | 'per_turn' | 'unlimited';
export type ClockSpeedPreset = 'normal' | 'speed' | 'blitz';

/** Seuil critique (< 10s) déclenchant l'affichage au dixième (100ms), le flash rouge et le tic-tac. */
export const CLOCK_CRITICAL_THRESHOLD_MS = 10_000;
/** Intervalle de rafraîchissement haute précision sous 10 secondes (100ms). */
export const CLOCK_CRITICAL_TICK_INTERVAL_MS = 100;
/** Intervalle de rafraîchissement standard hors zone critique (250ms). */
export const CLOCK_NORMAL_TICK_INTERVAL_MS = 250;

export interface ClockConfig {
    type: TimeControlType;
    bankMs: number;
    delaySeconds: number;
    speed?: ClockSpeedPreset;
}

export interface MatchClockState {
    timeControlType: TimeControlType;
    bankXMs: number;
    bankOMs: number;
    delayRemainingMs: number;
    activePlayer: Player;
    turnStartedAt: number;
    isFlagFallen: boolean;
    flagFallenPlayer: Player | null;
    isPaused: boolean;
}

export interface ClockTickResult {
    bankXMs: number;
    bankOMs: number;
    delayRemainingMs: number;
    activePlayerTimeRemainingMs: number;
    isFlagFallen: boolean;
    flagFallenPlayer: Player | null;
}

/**
 * Configure la pendule selon la longueur du match et la cadence choisie (WBF / Backgammon Galaxy).
 */
export function getRecommendedClockConfig(
    matchLength: number,
    type: TimeControlType = 'delay',
    speed: ClockSpeedPreset = 'normal',
): ClockConfig {
    if (type === 'unlimited') {
        return { type: 'unlimited', bankMs: 999999999, delaySeconds: 0, speed };
    }
    if (type === 'per_turn') {
        const perTurnMs = speed === 'blitz' ? 20000 : speed === 'speed' ? 30000 : 45000;
        return { type: 'per_turn', bankMs: perTurnMs, delaySeconds: 0, speed };
    }

    const points = Math.max(1, matchLength);
    const bankPerPointSec = speed === 'blitz' ? 30 : speed === 'speed' ? 60 : 120;
    const delaySeconds = speed === 'blitz' ? 5 : speed === 'speed' ? 8 : 12;
    const bankMs = points * bankPerPointSec * 1000;

    return { type, bankMs, delaySeconds, speed };
}

/** Initialise l'état de la pendule au démarrage d'une partie. */
export function createMatchClock(
    config: ClockConfig,
    activePlayer: Player = 'X',
    nowMs: number = Date.now(),
): MatchClockState {
    const initialDelayMs =
        config.type === 'delay' || config.type === 'bronstein' ? config.delaySeconds * 1000 : 0;

    return {
        timeControlType: config.type,
        bankXMs: config.bankMs,
        bankOMs: config.bankMs,
        delayRemainingMs: initialDelayMs,
        activePlayer,
        turnStartedAt: nowMs,
        isFlagFallen: false,
        flagFallenPlayer: null,
        isPaused: false,
    };
}

/** Calcule l'état dynamique de la pendule à un instant t sans saut de transition. */
export function computeClockTick(state: MatchClockState, nowMs: number = Date.now()): ClockTickResult {
    if (state.isFlagFallen) {
        return {
            bankXMs: state.bankXMs,
            bankOMs: state.bankOMs,
            delayRemainingMs: 0,
            activePlayerTimeRemainingMs: 0,
            isFlagFallen: true,
            flagFallenPlayer: state.flagFallenPlayer,
        };
    }

    if (state.isPaused || state.timeControlType === 'unlimited') {
        const activeBank = state.activePlayer === 'X' ? state.bankXMs : state.bankOMs;
        return {
            bankXMs: state.bankXMs,
            bankOMs: state.bankOMs,
            delayRemainingMs: state.delayRemainingMs,
            activePlayerTimeRemainingMs: activeBank,
            isFlagFallen: false,
            flagFallenPlayer: null,
        };
    }

    const elapsedMs = Math.max(0, nowMs - state.turnStartedAt);

    if (state.timeControlType === 'per_turn') {
        const timeLimitMs = state.bankXMs;
        const remaining = Math.max(0, timeLimitMs - elapsedMs);
        const isFallen = remaining === 0;
        return {
            bankXMs: state.activePlayer === 'X' ? remaining : timeLimitMs,
            bankOMs: state.activePlayer === 'O' ? remaining : timeLimitMs,
            delayRemainingMs: 0,
            activePlayerTimeRemainingMs: remaining,
            isFlagFallen: isFallen,
            flagFallenPlayer: isFallen ? state.activePlayer : null,
        };
    }

    if (state.timeControlType === 'fischer') {
        const currentBankX = state.activePlayer === 'X' ? Math.max(0, state.bankXMs - elapsedMs) : state.bankXMs;
        const currentBankO = state.activePlayer === 'O' ? Math.max(0, state.bankOMs - elapsedMs) : state.bankOMs;
        const activeBank = state.activePlayer === 'X' ? currentBankX : currentBankO;
        const isFallen = activeBank <= 0;
        return {
            bankXMs: currentBankX,
            bankOMs: currentBankO,
            delayRemainingMs: 0,
            activePlayerTimeRemainingMs: activeBank,
            isFlagFallen: isFallen,
            flagFallenPlayer: isFallen ? state.activePlayer : null,
        };
    }

    const delayTotalMs = state.delayRemainingMs;
    const consumedDelay = Math.min(elapsedMs, delayTotalMs);
    const delayRemaining = Math.max(0, delayTotalMs - consumedDelay);
    const bankDeduction = Math.max(0, elapsedMs - delayTotalMs);
    const currentBankX = state.activePlayer === 'X' ? Math.max(0, state.bankXMs - bankDeduction) : state.bankXMs;
    const currentBankO = state.activePlayer === 'O' ? Math.max(0, state.bankOMs - bankDeduction) : state.bankOMs;
    const activeBank = state.activePlayer === 'X' ? currentBankX : currentBankO;
    const isFallen = activeBank <= 0;

    return {
        bankXMs: currentBankX,
        bankOMs: currentBankO,
        delayRemainingMs: delayRemaining,
        activePlayerTimeRemainingMs: activeBank + delayRemaining,
        isFlagFallen: isFallen,
        flagFallenPlayer: isFallen ? state.activePlayer : null,
    };
}

/** Change de tour et applique les déductions / incréments Fischer sans saut. */
export function switchClockTurn(
    state: MatchClockState,
    nextPlayer: Player,
    config: ClockConfig,
    nowMs: number = Date.now(),
): MatchClockState {
    if (state.isFlagFallen) return state;

    const tick = computeClockTick(state, nowMs);
    if (tick.isFlagFallen) {
        return {
            ...state,
            bankXMs: tick.bankXMs,
            bankOMs: tick.bankOMs,
            isFlagFallen: true,
            flagFallenPlayer: tick.flagFallenPlayer,
        };
    }

    let newBankX = tick.bankXMs;
    let newBankO = tick.bankOMs;
    if (state.timeControlType === 'fischer') {
        const incrementMs = config.delaySeconds * 1000;
        if (state.activePlayer === 'X') newBankX += incrementMs;
        else newBankO += incrementMs;
    }

    const nextDelayMs =
        state.timeControlType === 'delay' || state.timeControlType === 'bronstein'
            ? config.delaySeconds * 1000
            : 0;

    return {
        ...state,
        bankXMs: newBankX,
        bankOMs: newBankO,
        delayRemainingMs: nextDelayMs,
        activePlayer: nextPlayer,
        turnStartedAt: nowMs,
        isFlagFallen: false,
        flagFallenPlayer: null,
    };
}

/** Met en pause la pendule. */
export function pauseClock(state: MatchClockState, nowMs: number = Date.now()): MatchClockState {
    if (state.isPaused || state.isFlagFallen) return state;
    const tick = computeClockTick(state, nowMs);
    return {
        ...state,
        bankXMs: tick.bankXMs,
        bankOMs: tick.bankOMs,
        delayRemainingMs: tick.delayRemainingMs,
        isPaused: true,
        isFlagFallen: tick.isFlagFallen,
        flagFallenPlayer: tick.flagFallenPlayer,
    };
}

/** Reprend la pendule après une pause. */
export function resumeClock(state: MatchClockState, nowMs: number = Date.now()): MatchClockState {
    if (!state.isPaused || state.isFlagFallen) return state;
    return { ...state, isPaused: false, turnStartedAt: nowMs };
}

/** Synchronise l'état de la pendule reçu du serveur ou de l'adversaire. */
export function syncClockState(
    state: MatchClockState,
    sync: {
        bankXMs: number;
        bankOMs: number;
        activePlayer: Player;
        turnStartedAt: number;
        delayRemainingMs?: number;
        isFlagFallen?: boolean;
        flagFallenPlayer?: Player | null;
        isPaused?: boolean;
    },
): MatchClockState {
    return {
        ...state,
        bankXMs: sync.bankXMs,
        bankOMs: sync.bankOMs,
        activePlayer: sync.activePlayer,
        turnStartedAt: sync.turnStartedAt,
        delayRemainingMs: sync.delayRemainingMs ?? state.delayRemainingMs,
        isFlagFallen: sync.isFlagFallen ?? state.isFlagFallen,
        flagFallenPlayer: sync.flagFallenPlayer ?? state.flagFallenPlayer,
        isPaused: sync.isPaused ?? state.isPaused,
    };
}

/** Formate un temps en millisecondes en affichage numérique ("04:32" ou "8.4s" sous 10s). */
export function formatClockTime(ms: number, showTenthsWhenCritical = true): string {
    const safeMs = Math.max(0, ms);
    const totalSeconds = safeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (safeMs < CLOCK_CRITICAL_THRESHOLD_MS && showTenthsWhenCritical) {
        const tenths = Math.floor((safeMs % 1000) / 100);
        return `${seconds}.${tenths}s`;
    }

    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
}
