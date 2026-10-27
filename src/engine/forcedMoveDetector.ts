/**
 * Détection Mathématique & Ergonomie des Coups Forcés (Audit 13 / 20).
 *
 * Exigences :
 *   1. Détecter mathématiquement lorsqu'un seul sous-coup légal `(from -> to)` existe
 *      sur l'ensemble du plateau (y compris lors d'un double où `leftDieTargets` et
 *      `rightDieTargets` contiennent la même paire `from -> to`).
 *   2. Auto-play optionnel après 300ms (`FORCED_MOVE_AUTO_PLAY_DELAY_MS = 300`) ou
 *      pulsation simultanée du pion de départ (`highlightOrigin`) et de la flèche
 *      d'arrivée (`highlightDestination`).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

export const FORCED_MOVE_AUTO_PLAY_DELAY_MS = 250;
export const FORCED_MOVE_STORAGE_KEY = 'bg_auto_play_forced_moves';

export interface ForcedMoveDescriptor {
    readonly from: number;
    readonly to: number;
    readonly die: 0 | 1;
    readonly dieValue: number | null;
}

export interface ForcedMoveDetectionParams {
    readonly leftDieTargets: Map<number, number[]>;
    readonly rightDieTargets: Map<number, number[]>;
    readonly dice: [number, number] | null;
    readonly usedDice?: readonly boolean[];
}

export interface ForcedMoveDetectionResult {
    readonly isForced: boolean;
    readonly forcedMove: ForcedMoveDescriptor | null;
    readonly uniqueLegalMoves: readonly ForcedMoveDescriptor[];
    readonly highlightOrigin: number | null;
    readonly highlightDestination: number | null;
}

/**
 * Analyse `leftDieTargets` et `rightDieTargets` en dédupliquant les paires `(from, to)`
 * afin d'identifier de manière exacte si le joueur dispose d'un unique coup forcé.
 */
export function detectForcedMove({
    leftDieTargets,
    rightDieTargets,
    dice,
}: ForcedMoveDetectionParams): ForcedMoveDetectionResult {
    if (!dice) {
        return {
            isForced: false,
            forcedMove: null,
            uniqueLegalMoves: [],
            highlightOrigin: null,
            highlightDestination: null,
        };
    }

    const moveMap = new Map<string, ForcedMoveDescriptor>();

    for (const [from, dests] of leftDieTargets) {
        for (const to of dests) {
            const key = `${from}->${to}`;
            if (!moveMap.has(key)) {
                moveMap.set(key, {
                    from,
                    to,
                    die: 0,
                    dieValue: dice[0],
                });
            }
        }
    }

    for (const [from, dests] of rightDieTargets) {
        for (const to of dests) {
            const key = `${from}->${to}`;
            if (!moveMap.has(key)) {
                moveMap.set(key, {
                    from,
                    to,
                    die: 1,
                    dieValue: dice[1],
                });
            }
        }
    }

    const uniqueLegalMoves = Array.from(moveMap.values());
    if (uniqueLegalMoves.length === 1) {
        const single = uniqueLegalMoves[0];
        return {
            isForced: true,
            forcedMove: single,
            uniqueLegalMoves,
            highlightOrigin: single.from,
            highlightDestination: single.to,
        };
    }

    return {
        isForced: false,
        forcedMove: null,
        uniqueLegalMoves,
        highlightOrigin: null,
        highlightDestination: null,
    };
}

/** Lit la préférence utilisateur d'auto-play des coups forcés (activée par défaut). */
export function getSavedForcedMoveAutoPlay(defaultValue: boolean = true): boolean {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const raw = window.localStorage.getItem(FORCED_MOVE_STORAGE_KEY);
        if (raw === 'true') return true;
        if (raw === 'false') return false;
    } catch {
        // Ignore SecurityError
    }
    return defaultValue;
}

/** Sauvegarde la préférence utilisateur d'auto-play des coups forcés. */
export function saveForcedMoveAutoPlay(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(FORCED_MOVE_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
        // Ignore QuotaExceededError / SecurityError
    }
}
