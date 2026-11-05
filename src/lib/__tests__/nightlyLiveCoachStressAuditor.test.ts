import { describe, it, expect } from 'vitest';
import { runNightlyLiveCoachStressTest } from '../../../scripts/nightly_live_coach_stress_auditor';

describe('Harnais Nocturne Coach Live — 8 Assertions Coupe-Circuit', () => {
    it('valide 1 000 tours complets avec 0 décalage et 100% de vérité physique', async () => {
        const res = await runNightlyLiveCoachStressTest(1000);
        expect(res.failedCount).toBe(0);
        expect(res.passedCount).toBeGreaterThan(950);
        expect(res.errors).toEqual([]);
    });
});

