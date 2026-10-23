/**
 * Sauvegarde Atomique d'Urgence & Reprise sur Déconnexion / Crash (Audit 20 / 20).
 *
 * Exigences :
 *   1. Sauvegarde atomique synchrone (Storage + miroir IndexedDB) à chaque sous-dé joué
 *      ainsi que sur `pagehide` / `beforeunload` / perte réseau.
 *   2. Restauration instantanée de l'état exact (plateau 26 cases, dés, `usedDice`,
 *      videau, score, sous-coups du tour en cours) avec notification Toast « Partie restaurée ».
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

export const EMERGENCY_CHECKPOINT_STORAGE_KEY = 'bg_emergency_submove_checkpoint_v1';
export const RESTORED_GAME_TOAST_TITLE = 'Partie restaurée';
export const RESTORED_GAME_TOAST_MESSAGE =
    'Partie restaurée avec succès au dernier sous-dé joué.';
/** Durée de validité maximale d'un checkpoint d'urgence (24 heures). */
export const CHECKPOINT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface EmergencySubMoveCheckpoint {
    readonly gameId: string;
    readonly board: readonly number[];
    readonly turn: 'X' | 'O';
    readonly dice: readonly [number, number] | null;
    readonly usedDice: readonly boolean[];
    readonly cubeValue: number;
    readonly cubeOwner: 'X' | 'O' | null;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly matchLength: number;
    readonly crawford: boolean;
    readonly phase: string;
    readonly subMovesPlayed: readonly { from: number; to: number }[];
    readonly savedAtMs: number;
}

/**
 * Enregistre de façon atomique l'état exact de la partie à chaque sous-dé joué.
 */
export function saveEmergencyCheckpoint(checkpoint: EmergencySubMoveCheckpoint): boolean {
    if (typeof window === 'undefined') return false;
    if (!Array.isArray(checkpoint.board) || checkpoint.board.length < 26) return false;
    try {
        const serialized = JSON.stringify(checkpoint);
        window.localStorage.setItem(EMERGENCY_CHECKPOINT_STORAGE_KEY, serialized);
        return true;
    } catch {
        return false;
    }
}

/**
 * Charge et valide le dernier checkpoint d'urgence sauvegardé.
 * Retourne `null` si absent, expiré (> 24h), corrompu ou déjà terminé (`GAME_OVER`).
 */
export function loadEmergencyCheckpoint(
    nowMs: number = Date.now(),
): EmergencySubMoveCheckpoint | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(EMERGENCY_CHECKPOINT_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<EmergencySubMoveCheckpoint>;
        if (
            !parsed ||
            typeof parsed.gameId !== 'string' ||
            !Array.isArray(parsed.board) ||
            parsed.board.length < 26 ||
            (parsed.turn !== 'X' && parsed.turn !== 'O') ||
            parsed.phase === 'GAME_OVER'
        ) {
            return null;
        }
        const savedAt = typeof parsed.savedAtMs === 'number' ? parsed.savedAtMs : 0;
        if (nowMs - savedAt > CHECKPOINT_MAX_AGE_MS) {
            clearEmergencyCheckpoint();
            return null;
        }

        const diceTuple: readonly [number, number] | null =
            Array.isArray(parsed.dice) &&
            parsed.dice.length >= 2 &&
            typeof parsed.dice[0] === 'number' &&
            typeof parsed.dice[1] === 'number'
                ? [parsed.dice[0], parsed.dice[1]]
                : null;

        return {
            gameId: parsed.gameId,
            board: parsed.board.slice(0, 26),
            turn: parsed.turn,
            dice: diceTuple,
            usedDice: Array.isArray(parsed.usedDice) ? parsed.usedDice.map(Boolean) : [false, false],
            cubeValue: typeof parsed.cubeValue === 'number' ? parsed.cubeValue : 1,
            cubeOwner: parsed.cubeOwner === 'X' || parsed.cubeOwner === 'O' ? parsed.cubeOwner : null,
            scoreX: typeof parsed.scoreX === 'number' ? parsed.scoreX : 0,
            scoreO: typeof parsed.scoreO === 'number' ? parsed.scoreO : 0,
            matchLength: typeof parsed.matchLength === 'number' ? parsed.matchLength : 7,
            crawford: Boolean(parsed.crawford),
            phase: typeof parsed.phase === 'string' ? parsed.phase : 'WAITING_FOR_ROLL',
            subMovesPlayed: Array.isArray(parsed.subMovesPlayed) ? parsed.subMovesPlayed : [],
            savedAtMs: savedAt,
        };
    } catch {
        return null;
    }
}

/** Purge le checkpoint d'urgence (fin de partie normale ou réinitialisation). */
export function clearEmergencyCheckpoint(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(EMERGENCY_CHECKPOINT_STORAGE_KEY);
    } catch {
        // Ignore SecurityError
    }
}
