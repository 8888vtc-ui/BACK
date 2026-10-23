/**
 * Tests unitaires du diagnostic stratégique automatique (PARTIE 3.2).
 */

import { describe, it, expect } from 'vitest';
import { explainTacticalDifference } from './tacticalExplainer';

function makeBoard(xPoints: Record<number, number> = {}, oPoints: Record<number, number> = {}): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    return board;
}

describe('explainTacticalDifference — Diagnostic stratégique FR', () => {
    it('détecte une différence de sécurité (blots exposés)', () => {
        const before = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const optimal = makeBoard({ 13: 5, 8: 2, 10: 2 }, { 12: 5, 19: 5 });
        const played = makeBoard({ 13: 5, 8: 2, 10: 1, 9: 1 }, { 12: 5, 19: 5 });

        const res = explainTacticalDifference({
            boardBefore: before,
            boardOptimal: optimal,
            boardPlayed: played,
            player: 'X',
        });

        expect(res.concepts).toContain('Sécurité');
        expect(res.summary).toContain('blot');
    });

    it('détecte la construction d’un point clé (Golden Point 5)', () => {
        const before = makeBoard({ 8: 3, 6: 5, 13: 5 }, { 12: 5, 19: 5 });
        const optimal = makeBoard({ 8: 2, 6: 4, 13: 5, 5: 2 }, { 12: 5, 19: 5 });
        const played = makeBoard({ 8: 2, 6: 4, 13: 5, 4: 2 }, { 12: 5, 19: 5 });

        const res = explainTacticalDifference({
            boardBefore: before,
            boardOptimal: optimal,
            boardPlayed: played,
            player: 'X',
        });

        expect(res.concepts).toContain('Point clé');
        expect(res.summary).toContain('Golden Point');
    });

    it('retourne un résumé neutre si aucune différence tactique majeure', () => {
        const board = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const res = explainTacticalDifference({
            boardBefore: board,
            boardOptimal: board,
            boardPlayed: board,
            player: 'X',
        });
        expect(res.summary).toContain('subtile');
        expect(res.concepts).toHaveLength(0);
    });

    it('garantit la valeur absolue mathématique de la perte d’équité (absEquityLoss)', () => {
        const board = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const res = explainTacticalDifference({
            boardBefore: board,
            boardOptimal: board,
            boardPlayed: board,
            player: 'X',
            equityLoss: -0.245,
        });
        expect(res.absEquityLoss).toBeCloseTo(0.245, 5);
    });
});
