import { describe, it, expect } from 'vitest';
import {
    computeInitialStability,
    computeInitialDifficulty,
    computeRetrievability,
    computeOptimalIntervalDays,
    scheduleFsrsV5Card,
    applyBronsteinClockTurn,
} from './fsrsV5Engine';

describe('fsrsV5Engine — Équations FSRS v5 (19 paramètres) & Horloge Bronstein', () => {
    it('initialise S_0(G) et D_0(G) selon w_0..w_5 pour une nouvelle carte', () => {
        expect(computeInitialStability(1)).toBeCloseTo(0.40255, 4);
        expect(computeInitialStability(3)).toBeCloseTo(3.173, 4);
        expect(computeInitialDifficulty(1)).toBeCloseTo(7.1949, 4);
        expect(computeInitialDifficulty(4)).toBeGreaterThanOrEqual(1);
        expect(computeInitialDifficulty(4)).toBeLessThan(computeInitialDifficulty(1));
    });

    it('vérifie que R(t=S, S) vaut exactement 0.90 avec DECAY=-0.5 et FACTOR=19/81', () => {
        const s = 10;
        const rAtS = computeRetrievability(s, s);
        expect(rAtS).toBeCloseTo(0.9, 5);
        expect(computeOptimalIntervalDays(10, 0.9)).toBe(10);
    });

    it('planifie une carte indexée par XGID (première révision, rappel réussi et oubli)', () => {
        const xgid = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:7:10';
        const t0 = new Date('2026-10-01T12:00:00.000Z');
        const first = scheduleFsrsV5Card({ xgidKey: xgid, rating: 3, now: t0 });
        expect(first.xgidKey).toBe(xgid);
        expect(first.reps).toBe(1);
        expect(first.intervalDays).toBe(3);

        // Révision à J+3 avec Good (rating = 3)
        const t1 = new Date('2026-10-04T12:00:00.000Z');
        const second = scheduleFsrsV5Card({
            xgidKey: xgid,
            rating: 3,
            previousState: first,
            now: t1,
        });
        expect(second.stability).toBeGreaterThan(first.stability);
        expect(second.intervalDays).toBeGreaterThan(first.intervalDays);

        // Oubli à J+15 avec Again (rating = 1)
        const t2 = new Date('2026-10-19T12:00:00.000Z');
        const lapsed = scheduleFsrsV5Card({
            xgidKey: xgid,
            rating: 1,
            previousState: second,
            now: t2,
        });
        expect(lapsed.lapses).toBe(1);
        expect(lapsed.stability).toBeLessThan(second.stability);
    });

    it('applique le Délai Simple (Bronstein) sans incrémenter la réserve principale', () => {
        // Coup joué en 8s avec délai de 12s : réserve intacte
        const fast = applyBronsteinClockTurn({
            reserveMs: 120_000,
            delayPerTurnMs: 12_000,
            turnElapsedMs: 8_000,
        });
        expect(fast.remainingReserveMs).toBe(120_000);
        expect(fast.delayConsumedMs).toBe(8_000);
        expect(fast.isFlagged).toBe(false);

        // Coup joué en 20s avec délai de 12s : 8s déduits de la réserve
        const slow = applyBronsteinClockTurn({
            reserveMs: 120_000,
            delayPerTurnMs: 12_000,
            turnElapsedMs: 20_000,
        });
        expect(slow.remainingReserveMs).toBe(112_000);
        expect(slow.isFlagged).toBe(false);
    });
});

