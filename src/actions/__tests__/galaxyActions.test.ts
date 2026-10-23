/**
 * Tests unitaires des micro-programmes "Galaxy / XG" (LOI 1).
 *
 * Couvre : smartClickCheckerAction, swapDiceOrderAction, retryLastHumanTurnAction.
 */

import { describe, it, expect } from 'vitest';
import { smartClickCheckerAction } from '../smartClickCheckerAction';
import { swapDiceOrderAction } from '../swapDiceOrderAction';
import { retryLastHumanTurnAction } from '../retryLastHumanTurnAction';
import type { MatchLogEntry } from '../types';

describe('smartClickCheckerAction — Smart Click (Galaxy/XG)', () => {
    it('joue immédiatement quand une seule destination existe', () => {
        const left = new Map<number, number[]>([[13, [10]]]);
        const right = new Map<number, number[]>();
        const res = smartClickCheckerAction({
            point: 13,
            leftDieTargets: left,
            rightDieTargets: right,
            preferredDie: 0,
            player: 'X',
        });
        expect(res.move).toEqual({ from: 13, to: 10, die: 0 });
        expect(res.shouldSelect).toBe(false);
    });

    it('sélectionne le pion quand plusieurs destinations sont ambiguës', () => {
        const left = new Map<number, number[]>([[13, [10, 11]]]);
        const right = new Map<number, number[]>([[13, [9]]]);
        const res = smartClickCheckerAction({
            point: 13,
            leftDieTargets: left,
            rightDieTargets: right,
            preferredDie: 0,
            player: 'X',
        });
        expect(res.move).toBeNull();
        expect(res.shouldSelect).toBe(true);
    });

    it('utilise le dé préféré en priorité', () => {
        const left = new Map<number, number[]>([[13, [10]]]);
        const right = new Map<number, number[]>([[13, [9]]]);
        const res = smartClickCheckerAction({
            point: 13,
            leftDieTargets: left,
            rightDieTargets: right,
            preferredDie: 1,
            player: 'X',
        });
        expect(res.move).toEqual({ from: 13, to: 9, die: 1 });
    });

    it('ne fait rien si aucune destination', () => {
        const res = smartClickCheckerAction({
            point: 13,
            leftDieTargets: new Map(),
            rightDieTargets: new Map(),
            preferredDie: 0,
            player: 'X',
        });
        expect(res.move).toBeNull();
        expect(res.shouldSelect).toBe(false);
    });
});

describe('swapDiceOrderAction — Inversion des dés', () => {
    it('inverse l’ordre des dés et bascule le dé préféré', () => {
        const res = swapDiceOrderAction({ dice: [6, 3], preferredDie: 0 });
        expect(res.dice).toEqual([3, 6]);
        expect(res.preferredDie).toBe(1);
        expect(Object.isFrozen(res.dice)).toBe(true);
    });

    it('laisse un double inchangé', () => {
        const res = swapDiceOrderAction({ dice: [4, 4], preferredDie: 0 });
        expect(res.dice).toEqual([4, 4]);
        expect(res.preferredDie).toBe(0);
    });

    it('gère l’absence de dés', () => {
        const res = swapDiceOrderAction({ dice: null, preferredDie: 1 });
        expect(res.dice).toBeNull();
        expect(res.preferredDie).toBe(1);
    });
});

describe('retryLastHumanTurnAction — Rejouer mon coup', () => {
    const board = new Array<number>(26).fill(0);
    board[13] = 5;

    const makeEntry = (turnIndex: number, player: 'X' | 'O'): MatchLogEntry =>
        Object.freeze({
            turnIndex,
            player,
            dice: Object.freeze([3, 1]) as readonly [number, number],
            boardBefore: Object.freeze([...board]),
            movePlayed: Object.freeze([{ from: 13, to: 10 }]),
            boardAfter: Object.freeze([...board]),
        });

    it('retourne le dernier tour humain (X) et ignore l’IA (O)', () => {
        const log = [makeEntry(1, 'X'), makeEntry(2, 'O'), makeEntry(3, 'X'), makeEntry(4, 'O')];
        const res = retryLastHumanTurnAction({ matchLog: log, localPlayer: 'X' });
        expect(res.turnIndex).toBe(3);
        expect(res.dice).toEqual([3, 1]);
        expect(res.truncateTo).toBe(2);
        expect(Object.isFrozen(res.boardBefore)).toBe(true);
    });

    it('retourne null si aucun tour humain', () => {
        const log = [makeEntry(1, 'O')];
        const res = retryLastHumanTurnAction({ matchLog: log, localPlayer: 'X' });
        expect(res.boardBefore).toBeNull();
        expect(res.turnIndex).toBeNull();
    });
});
