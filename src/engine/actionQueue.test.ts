import { describe, it, expect } from 'vitest';
import {
    ACTION_QUEUE_INTERVAL_MS,
    MAX_PREMOVE_AHEAD,
    MoveActionQueue,
} from './actionQueue';

describe('MoveActionQueue (Audit 6/20 — Pre-Move & Buffer FIFO)', () => {
    it('expose ACTION_QUEUE_INTERVAL_MS = 120ms et MAX_PREMOVE_AHEAD = 2', () => {
        expect(ACTION_QUEUE_INTERVAL_MS).toBe(120);
        expect(MAX_PREMOVE_AHEAD).toBe(2);
    });

    it('exécute immédiatement le 1er coup et met en file FIFO jusqu’à 2 coups d’avance pendant l’animation', () => {
        const queue = new MoveActionQueue(2);

        // 1er coup : exécuté immédiatement (0ms)
        const r1 = queue.enqueue({ from: 24, to: 20, die: 0, player: 'X' });
        expect(r1.accepted).toBe(true);
        expect(r1.executeImmediately).toBe(true);
        expect(queue.isProcessing()).toBe(true);
        expect(queue.size()).toBe(0);

        // 2e et 3e coups pendant l'animation du 1er : bufferisés en FIFO (max 2 d'avance)
        const r2 = queue.enqueue({ from: 20, to: 16, die: 0, player: 'X' });
        const r3 = queue.enqueue({ from: 13, to: 9, die: 0, player: 'X' });
        expect(r2.accepted).toBe(true);
        expect(r2.executeImmediately).toBe(false);
        expect(r3.accepted).toBe(true);
        expect(r3.executeImmediately).toBe(false);
        expect(queue.size()).toBe(2);

        // 4e coup alors que 2 sont déjà en attente : rejeté proprement (capacité max 2 d'avance)
        const r4 = queue.enqueue({ from: 9, to: 5, die: 0, player: 'X' });
        expect(r4.accepted).toBe(false);

        // Dépilement FIFO dans l'ordre exact
        const d1 = queue.dequeueNext('X');
        expect(d1.action?.from).toBe(20);
        expect(d1.action?.to).toBe(16);

        const d2 = queue.dequeueNext('X');
        expect(d2.action?.from).toBe(13);
        expect(d2.action?.to).toBe(9);
        expect(queue.size()).toBe(0);
    });

    it('purge immédiatement le buffer si le coup suivant devient illégal ou si l’adversaire joue', () => {
        const queue = new MoveActionQueue(2);
        queue.enqueue({ from: 24, to: 21, player: 'X' });
        queue.enqueue({ from: 21, to: 16, player: 'X' });
        queue.enqueue({ from: 13, to: 8, player: 'X' });
        expect(queue.size()).toBe(2);

        // Cas 1 : l'état du plateau rend (21 -> 16) illégal -> purge totale immédiate
        const illegalRes = queue.dequeueNext('X', () => false);
        expect(illegalRes.action).toBeNull();
        expect(illegalRes.purged).toBe(true);
        expect(illegalRes.purgeReason).toBe('ILLEGAL_MOVE');
        expect(queue.size()).toBe(0);

        // Cas 2 : l'adversaire ('O') a pris le trait -> purge totale immédiate
        queue.enqueue({ from: 13, to: 10, player: 'X' });
        queue.enqueue({ from: 10, to: 7, player: 'X' });
        const oppRes = queue.dequeueNext('O');
        expect(oppRes.action).toBeNull();
        expect(oppRes.purged).toBe(true);
        expect(oppRes.purgeReason).toBe('OPPONENT_TURN');
        expect(queue.size()).toBe(0);
    });
});
