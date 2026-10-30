import { describe, it, expect } from 'vitest';
import {
    computeSimpleBearoffEpc,
    evaluateTimmesRace,
    evaluateTriceBenjaminLongRace,
    evaluateBenjamin3v3Bearoff,
} from './raceCubeFormulas';

function createCustomBoard(xPoints: Record<number, number>, oPoints: Record<number, number>): number[] {
    const b = new Array<number>(26).fill(0);
    for (const [pt, count] of Object.entries(xPoints)) {
        b[Number(pt)] = count;
    }
    for (const [pt, count] of Object.entries(oPoints)) {
        // Pour O, point relatif r correspond à l'index 25 - r
        b[25 - Number(pt)] = -count;
    }
    return b;
}

describe('raceCubeFormulas — Algorithmes de Videau en Course (Octobre 2026)', () => {
    it('calcule correctement EPC = 7n + 1', () => {
        expect(computeSimpleBearoffEpc(0)).toBe(0);
        expect(computeSimpleBearoffEpc(3)).toBe(22);
        expect(computeSimpleBearoffEpc(5)).toBe(36);
    });

    it('applique la règle des 10 % et la Règle des 9 (Trice / Art Benjamin 60 < X < 130)', () => {
        // Sans règle des 9 : X = 70 => PLT = 70 + 7 + 2 = 79, DP = 76, RDP = 77
        const r70 = evaluateTriceBenjaminLongRace(70, 77, false);
        expect(r70.nineRuleApplied).toBe(false);
        expect(r70.pointOfLastTake).toBe(79);
        expect(r70.doublePoint).toBe(76);
        expect(r70.redoublePoint).toBe(77);
        expect(r70.decision).toBe('DOUBLE_TAKE');

        // Exception Règle des 9 : X in {69, 79, 89, 99} => PLT = 78, 89, 100, 111
        expect(evaluateTriceBenjaminLongRace(69, 78).pointOfLastTake).toBe(78);
        expect(evaluateTriceBenjaminLongRace(79, 89).pointOfLastTake).toBe(89);
        expect(evaluateTriceBenjaminLongRace(89, 100).pointOfLastTake).toBe(100);
        const r99 = evaluateTriceBenjaminLongRace(99, 112);
        expect(r99.nineRuleApplied).toBe(true);
        expect(r99.pointOfLastTake).toBe(111);
        expect(r99.decision).toBe('DOUBLE_PASS');
    });

    it('évalue la Formule de Course de Timmes (Octobre 2026) sur course moyenne (31..60 pips, Boost +1/8)', () => {
        // X a 48 pips (8 pions sur point 6 -> 3 au-delà de 5 => +3 stack penalty -> L_adj = 51)
        // O a 58 pips
        const board = createCustomBoard({ 6: 5, 5: 3, 1: 1 }, { 6: 5, 5: 5, 3: 1 });
        // X raw = 30 + 15 + 1 = 46 pips ; O raw = 30 + 25 + 3 = 58 pips
        const res = evaluateTimmesRace(board, 'X', false);
        expect(res.isShortBearoffFormula).toBe(false);
        expect(res.rollerRawPips).toBe(46);
        expect(res.opponentRawPips).toBe(58);
        expect(res.boostFactor).toBe(0.125); // 1/8
        expect(res.decision).toBe('DOUBLE_PASS');
    });

    it('évalue la Formule de Bear-off court de Timmes (<= 12 pips dans le jan intérieur)', () => {
        // X a 2 pions sur point 4 (8 pips), O a 2 pions sur point 5 (10 pips)
        const board = createCustomBoard({ 4: 2 }, { 5: 2 });
        const res = evaluateTimmesRace(board, 'X', false);
        expect(res.isShortBearoffFormula).toBe(true);
        // C_X = 8 + 3 + 0.5*2 = 12 ; C_O = 10 + 3 = 13 ; D = 12 - 13 = -1
        expect(res.rollerAdjustedPips).toBe(12);
        expect(res.opponentAdjustedPips).toBe(13);
        expect(res.delta).toBe(-1);
        expect(res.decision).toBe('DOUBLE_PASS');
    });

    it('évalue la Formule de Benjamin 3v3 avec pénalités de spares', () => {
        // X a 3 pions : un sur 6, un sur 4, un sur 2 => 12 pips, 0 spare => APC X = 12
        // O a 3 pions : un sur 5, deux sur 3 => 11 pips + 0.5 spare sur pt 3 => APC Y = 11.5
        const board = createCustomBoard({ 6: 1, 4: 1, 2: 1 }, { 5: 1, 3: 2 });
        const res = evaluateBenjamin3v3Bearoff(board, 'X', false);
        expect(res.rollerApc).toBe(12);
        expect(res.opponentApc).toBe(11.5);
        expect(res.rollerEpc).toBe(22);
        // X in [12..12.5] : toujours doubler, prendre si Y <= X - 2 (10) -> Y=11.5 > 10 => Pass
        expect(res.decision).toBe('DOUBLE_PASS');
    });
});

