// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTiltDetector } from './useTiltDetector';
import { evaluateZareTiltScore } from '../lib/coach/zareTiltEngine';

describe('useTiltDetector & evaluateZareTiltScore (Formule de Zare)', () => {
    it('retourne un état calme par défaut sans décisions', () => {
        const evalEmpty = evaluateZareTiltScore([]);
        expect(evalEmpty.tiltScore).toBe(0);
        expect(evalEmpty.tiltLevel).toBe('calm');
        expect(evalEmpty.isTilted).toBe(false);
    });

    it('détecte un état de tilt avéré lors de gaffes rapides consécutives après un bad beat', () => {
        const result = evaluateZareTiltScore([
            { equityLoss: 0.11, reactionTimeMs: 1400, luckDelta: -0.18 },
            { equityLoss: 0.14, reactionTimeMs: 1200, luckDelta: -0.05 },
        ]);

        expect(result.consecutiveBlunders).toBe(2);
        expect(result.fastPlayBlunders).toBe(2);
        expect(result.postBadBeatBlunders).toBe(2);
        expect(result.tiltScore).toBeGreaterThanOrEqual(60);
        expect(result.tiltLevel).toBe('tilted');
        expect(result.isTilted).toBe(true);
        expect(result.recommendationFr).toContain('Alerte Tilt (Formule de Zare)');
    });

    it('gère le cycle de vie React (recordDecision, dismissTiltAlert, resetTilt)', () => {
        const { result } = renderHook(() => useTiltDetector({ windowSize: 5 }));

        expect(result.current.isTilted).toBe(false);
        expect(result.current.showTiltAlert).toBe(false);

        act(() => {
            result.current.markRollTimestamp(1000);
            result.current.recordDecision({
                equityLoss: 0.12,
                reactionTimeMs: 1500,
                luckDelta: -0.15,
            });
            result.current.recordDecision({
                equityLoss: 0.15,
                reactionTimeMs: 1100,
                luckDelta: -0.12,
            });
        });

        expect(result.current.isTilted).toBe(true);
        expect(result.current.showTiltAlert).toBe(true);
        expect(result.current.history).toHaveLength(2);

        act(() => {
            result.current.dismissTiltAlert();
        });

        expect(result.current.isAlertDismissed).toBe(true);
        expect(result.current.showTiltAlert).toBe(false);

        // Une nouvelle gaffe réactive l'alerte
        act(() => {
            result.current.recordDecision({
                equityLoss: 0.09,
                reactionTimeMs: 1800,
            });
        });
        expect(result.current.showTiltAlert).toBe(true);

        act(() => {
            result.current.resetTilt();
        });
        expect(result.current.isTilted).toBe(false);
        expect(result.current.history).toHaveLength(0);
    });
});
