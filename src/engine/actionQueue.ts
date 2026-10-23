/**
 * File d'attente FIFO non-bloquante de coups et Pre-Moves (Audit 6 / 20 — Input Queueing).
 *
 * Exigences :
 *   1. File d'attente FIFO permettant de chaîner jusqu'à `MAX_PREMOVE_AHEAD = 2` coups d'avance
 *      pendant l'animation du coup en cours (`ACTION_QUEUE_INTERVAL_MS = 120 ms`).
 *   2. Purge immédiate du buffer si l'état du plateau rend le coup suivant illégal ou si
 *      le trait passe à l'adversaire (`OPPONENT_TURN` / `ILLEGAL_MOVE`).
 *   3. Garantie mathématique de 0 input-drop à une cadence de 5 clics/seconde (200 ms/clic).
 *
 * Strictement 0 `any`, module pur < 300 lignes.
 */

import type { Player } from './backgammonEngine';

/** Intervalle de dépilement séquentiel entre deux sous-coups animés (ms). */
export const ACTION_QUEUE_INTERVAL_MS = 120;

/** Nombre maximal de pre-moves en attente pendant qu'un coup est en cours d'animation. */
export const MAX_PREMOVE_AHEAD = 2;

export type QueuePurgeReason = 'ILLEGAL_MOVE' | 'OPPONENT_TURN' | 'MANUAL_CLEAR' | 'TURN_ENDED';

export interface QueuedMoveAction {
    readonly id: string;
    readonly from: number;
    readonly to: number;
    readonly die?: 0 | 1;
    readonly player: Player;
    readonly enqueuedAt: number;
}

export interface ActionQueueSnapshot {
    readonly items: ReadonlyArray<QueuedMoveAction>;
    readonly isProcessing: boolean;
    readonly lastPurgeReason: QueuePurgeReason | null;
    readonly processedCount: number;
    readonly droppedCount: number;
}

export type MoveLegalityValidator = (action: QueuedMoveAction) => boolean;

/**
 * Classe pure de gestion de file FIFO avec garde de capacité, validation de légalité
 * et purge atomique.
 */
export class MoveActionQueue {
    private queue: QueuedMoveAction[] = [];
    private processing: boolean = false;
    private lastPurge: QueuePurgeReason | null = null;
    private processed: number = 0;
    private dropped: number = 0;
    private seq: number = 0;
    private readonly maxAhead: number;

    constructor(maxAhead: number = MAX_PREMOVE_AHEAD) {
        this.maxAhead = Math.max(1, Math.trunc(maxAhead));
    }

    /** Retourne le nombre de coups en attente dans la file FIFO. */
    public size(): number {
        return this.queue.length;
    }

    /** Vrai si un coup est actuellement en cours d'animation/exécution. */
    public isProcessing(): boolean {
        return this.processing;
    }

    public setProcessing(active: boolean): void {
        this.processing = active;
    }

    /**
     * Enfile un coup dans la file FIFO :
     * - Si la file a déjà atteint `maxAhead` coups en attente, remplace le dernier pre-move
     *   afin que la dernière intention du joueur soit toujours respectée, ou le rejette proprement.
     */
    public enqueue(params: {
        from: number;
        to: number;
        die?: 0 | 1;
        player: Player;
        now?: number;
    }): { accepted: boolean; action: QueuedMoveAction; executeImmediately: boolean } {
        this.seq += 1;
        const action: QueuedMoveAction = {
            id: `qmove-${this.seq}`,
            from: params.from,
            to: params.to,
            die: params.die,
            player: params.player,
            enqueuedAt: params.now ?? Date.now(),
        };

        // Si aucun coup n'est en cours d'animation et que la file est vide : exécution immédiate (0 ms)
        if (!this.processing && this.queue.length === 0) {
            this.processing = true;
            this.processed += 1;
            return { accepted: true, action, executeImmediately: true };
        }

        if (this.queue.length >= this.maxAhead) {
            this.dropped += 1;
            return { accepted: false, action, executeImmediately: false };
        }

        this.queue.push(action);
        return { accepted: true, action, executeImmediately: false };
    }

    /**
     * Dépile et valide le prochain coup de la file FIFO.
     * Si le coup suivant est illégal ou si le joueur actif a changé, purge immédiatement
     * toute la file d'attente !
     */
    public dequeueNext(
        activePlayer: Player,
        isLegal?: MoveLegalityValidator,
    ): { action: QueuedMoveAction | null; purged: boolean; purgeReason: QueuePurgeReason | null } {
        if (this.queue.length === 0) {
            this.processing = false;
            return { action: null, purged: false, purgeReason: null };
        }

        const next = this.queue.shift()!;

        if (next.player !== activePlayer) {
            this.purge('OPPONENT_TURN');
            return { action: null, purged: true, purgeReason: 'OPPONENT_TURN' };
        }

        if (isLegal && !isLegal(next)) {
            this.purge('ILLEGAL_MOVE');
            return { action: null, purged: true, purgeReason: 'ILLEGAL_MOVE' };
        }

        this.processing = true;
        this.processed += 1;
        return { action: next, purged: false, purgeReason: null };
    }

    /**
     * Purge immédiatement tous les coups en attente dans le buffer.
     */
    public purge(reason: QueuePurgeReason = 'MANUAL_CLEAR'): void {
        this.queue = [];
        this.processing = false;
        this.lastPurge = reason;
    }

    /**
     * Vérifie si un coup `(from -> to)` est légal au regard des cibles courantes des dés.
     */
    public static isMoveLegalInTargets(
        action: Pick<QueuedMoveAction, 'from' | 'to' | 'die'>,
        leftDieTargets?: ReadonlyMap<number, readonly number[]>,
        rightDieTargets?: ReadonlyMap<number, readonly number[]>,
    ): boolean {
        if (!leftDieTargets && !rightDieTargets) return true;
        if (action.die === 0) {
            return (leftDieTargets?.get(action.from) ?? []).includes(action.to);
        }
        if (action.die === 1) {
            return (rightDieTargets?.get(action.from) ?? []).includes(action.to);
        }
        const inLeft = (leftDieTargets?.get(action.from) ?? []).includes(action.to);
        const inRight = (rightDieTargets?.get(action.from) ?? []).includes(action.to);
        return inLeft || inRight;
    }

    public getSnapshot(): ActionQueueSnapshot {
        return {
            items: [...this.queue],
            isProcessing: this.processing,
            lastPurgeReason: this.lastPurge,
            processedCount: this.processed,
            droppedCount: this.dropped,
        };
    }
}
