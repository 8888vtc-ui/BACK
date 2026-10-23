import { describe, it, expect } from 'vitest';
import { buildCubeNotification } from './cubeNotification';
import type { CubeCoachResult } from './cubeCoach';

function mockResult(verdict: CubeCoachResult['verdict']): CubeCoachResult {
    return {
        verdict,
        optimalAction: 'Double, take',
        playedAction: 'double',
        explanation: 'Explication test.',
        advice: 'Conseil test.',
    };
}

describe('buildCubeNotification', () => {
    it('renvoie null en mode silent pour tous les verdicts', () => {
        expect(buildCubeNotification(mockResult('blunder'), 'silent')).toBeNull();
        expect(buildCubeNotification(mockResult('inaccuracy'), 'silent')).toBeNull();
        expect(buildCubeNotification(mockResult('optimal'), 'silent')).toBeNull();
    });

    it('en mode blunder, alerte uniquement sur blunder', () => {
        const blunderNotif = buildCubeNotification(mockResult('blunder'), 'blunder');
        expect(blunderNotif).not.toBeNull();
        expect(blunderNotif?.type).toBe('warning');
        expect(blunderNotif?.title).toBe('Videau : Blunder');
        expect(blunderNotif?.message).toContain('Explication test.');

        expect(buildCubeNotification(mockResult('inaccuracy'), 'blunder')).toBeNull();
        expect(buildCubeNotification(mockResult('optimal'), 'blunder')).toBeNull();
    });

    it('en mode error, alerte sur blunder et inaccuracy', () => {
        const blunderNotif = buildCubeNotification(mockResult('blunder'), 'error');
        expect(blunderNotif?.type).toBe('warning');

        const inaccNotif = buildCubeNotification(mockResult('inaccuracy'), 'error');
        expect(inaccNotif?.type).toBe('info');
        expect(inaccNotif?.title).toBe('Videau : Imprécision');

        expect(buildCubeNotification(mockResult('optimal'), 'error')).toBeNull();
    });
});
