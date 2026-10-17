/**
 * Gestionnaire d'Horloges de Match (Tournament Clocks) pour le Backgammon.
 *
 * Implémente les règles officielles de cadences WBF / WBIF :
 * 1. Mode Delay (Bronstein / Simple Delay) :
 *    - Chaque joueur dispose d'une réserve de temps principale (Time Bank), ex: 2 min par point.
 *    - Chaque coup bénéficie d'un délai de réflexion gratuit (Turn Delay), ex: 12 secondes.
 *    - La réserve principale ne commence à s'écouler que si le coup dépasse le délai.
 * 2. Mode Fischer (Incrément) :
 *    - Réserve principale + incrément fixe ajouté au début/fin de chaque coup.
 * 3. Mode Per-Turn :
 *    - Temps fixe strict par coup (ex: 45s).
 *
 * Détection de chute de drapeau (Flag Fall / Timeout) avec précision à la milliseconde.
 */

import type { Player } from '../../engine/backgammonEngine';

export type TimeControlType = 'delay' | 'fischer' | 'per_turn' | 'unlimited';

export interface ClockConfig {
    type: TimeControlType;
    bankMs: number;
    delaySeconds: number;
}

export interface MatchClockState {
    timeControlType: TimeControlType;
    bankXMs: number;
    bankOMs: number;
    delayRemainingMs: number;
    activePlayer: Player;
    turnStartedAt: number; // timestamp ms
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
 * Configure la pendule selon la longueur du match.
 * WBF Standard : 2 minutes par point de match + 12 secondes de délai par coup.
 */
export function getRecommendedClockConfig(matchLength: number, type: TimeControlType = 'delay'): ClockConfig {
    if (type === 'unlimited') {
        return { type: 'unlimited', bankMs: 999999999, delaySeconds: 0 };
    }
    if (type === 'per_turn') {
        return { type: 'per_turn', bankMs: 45000, delaySeconds: 0 };
    }

    // 2 minutes (120 000 ms) par point de match (ex: 7 pts = 14 min = 840 000 ms)
    const points = Math.max(1, matchLength);
    const bankMs = points * 120 * 1000;
    const delaySeconds = 12;

    return {
        type,
        bankMs,
        delaySeconds,
    };
}

/**
 * Initialise l'état de la pendule au démarrage d'une partie.
 */
export function createMatchClock(
    config: ClockConfig,
    activePlayer: Player = 'X',
    nowMs: number = Date.now(),
): MatchClockState {
    return {
        timeControlType: config.type,
        bankXMs: config.bankMs,
        bankOMs: config.bankMs,
        delayRemainingMs: config.delaySeconds * 1000,
        activePlayer,
        turnStartedAt: nowMs,
        isFlagFallen: false,
        flagFallenPlayer: null,
        isPaused: false,
    };
}

/**
 * Calcule l'état dynamique de la pendule à un instant t.
 */
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
        const timeLimitMs = state.bankXMs; // bankMs = temps par coup (ex: 45000 ms)
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

    // Mode Delay (Bronstein / WBF)
    const delayTotalMs = state.delayRemainingMs;
    const consumedDelay = Math.min(elapsedMs, delayTotalMs);
    const delayRemaining = Math.max(0, delayTotalMs - consumedDelay);

    // Temps puisé dans la réserve principale
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

/**
 * Change de tour (passe la pendule au joueur suivant et applique les déductions).
 */
export function switchClockTurn(
    state: MatchClockState,
    nextPlayer: Player,
    config: ClockConfig,
    nowMs: number = Date.now(),
): MatchClockState {
    if (state.isFlagFallen) return state;

    // Calculer le reliquat exact avant le switch
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

    // Fischer : ajouter incrément au joueur qui vient de terminer son tour
    let newBankX = tick.bankXMs;
    let newBankO = tick.bankOMs;
    if (state.timeControlType === 'fischer') {
        const incrementMs = config.delaySeconds * 1000;
        if (state.activePlayer === 'X') newBankX += incrementMs;
        else newBankO += incrementMs;
    }

    return {
        ...state,
        bankXMs: newBankX,
        bankOMs: newBankO,
        delayRemainingMs: config.delaySeconds * 1000,
        activePlayer: nextPlayer,
        turnStartedAt: nowMs,
        isFlagFallen: false,
        flagFallenPlayer: null,
    };
}

/**
 * Met en pause la pendule (ex: lors d'une déconnexion d'un joueur).
 */
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

/**
 * Reprend la pendule après une pause.
 */
export function resumeClock(state: MatchClockState, nowMs: number = Date.now()): MatchClockState {
    if (!state.isPaused || state.isFlagFallen) return state;
    return {
        ...state,
        isPaused: false,
        turnStartedAt: nowMs,
    };
}

/**
 * Synchronise l'état de la pendule reçu du serveur ou de l'adversaire.
 */
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

/**
 * Formate un temps en millisecondes en affichage numérique Backgammon (ex: "04:32" ou "08.4s").
 */
export function formatClockTime(ms: number, showTenthsWhenCritical = true): string {
    const totalSeconds = Math.max(0, ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (totalSeconds < 10 && showTenthsWhenCritical) {
        const tenths = Math.floor((ms % 1000) / 100);
        return `${seconds}.${tenths}s`;
    }

    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
}
