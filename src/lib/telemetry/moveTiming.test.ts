// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import {
    computeDecisionReactionTime,
    createMoveTimingTracker,
} from './moveTiming';

describe('moveTiming — Télémétrie Anti-Triche IA (Temps de Décision & Perte de Focus)', () => {
    it('calcule exactement RT = t_validation - t_lancer_dés', () => {
        expect(computeDecisionReactionTime(1000, 3450)).toBe(2450);
        expect(computeDecisionReactionTime(5000, 4800)).toBe(0);
    });

    it('enregistre le temps de réflexion par coup et détecte les pertes de focus (blur + visibilitychange)', () => {
        let currentNow = 10_000;
        const onFocusLoss = vi.fn();
        const tracker = createMoveTimingTracker({
            now: () => currentNow,
            onFocusLoss,
        });

        const detach = tracker.attachBrowserListeners(window, document);

        try {
            // Tour 1 : lancer à t = 10 000ms
            tracker.markDiceRolled(1);
            expect(tracker.isDecisionInProgress()).toBe(true);

            // Changement de fenêtre (blur) à t = 11 200ms
            currentNow = 11_200;
            window.dispatchEvent(new Event('blur'));
            expect(onFocusLoss).toHaveBeenCalledTimes(1);
            expect(tracker.getCurrentTurnFocusLossCount()).toBe(1);

            // Changement d'onglet (visibilitychange -> hidden) à t = 12 000ms
            currentNow = 12_000;
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'hidden',
            });
            document.dispatchEvent(new Event('visibilitychange'));
            expect(onFocusLoss).toHaveBeenCalledTimes(2);
            expect(tracker.getCurrentTurnFocusLossCount()).toBe(2);

            // Validation du coup à t = 14 500ms -> RT = 4 500ms
            currentNow = 14_500;
            const entry = tracker.recordMoveValidated({
                turnIndex: 1,
                player: 'X',
                dice: [6, 5],
            });

            expect(entry.reactionTimeMs).toBe(4500);
            expect(entry.focusLossCount).toBe(2);
            expect(entry.flaggedExternalConsultSuspect).toBe(true);

            // Tour 2 : sans perte de focus (RT = 1 800ms)
            currentNow = 20_000;
            tracker.markDiceRolled(2);
            currentNow = 21_800;
            const entry2 = tracker.recordMoveValidated({
                turnIndex: 2,
                player: 'X',
                dice: [3, 1],
            });
            expect(entry2.reactionTimeMs).toBe(1800);
            expect(entry2.focusLossCount).toBe(0);
            expect(entry2.flaggedExternalConsultSuspect).toBe(false);

            const meta = tracker.getMatchMetadata();
            expect(meta.totalDecisions).toBe(2);
            expect(meta.totalFocusLosses).toBe(2);
            expect(meta.focusLossesDuringDecisions).toBe(2);
            expect(meta.suspiciousTurnsCount).toBe(1);
            expect(meta.minReactionTimeMs).toBe(1800);
            expect(meta.maxReactionTimeMs).toBe(4500);
            expect(meta.meanReactionTimeMs).toBe(3150);
        } finally {
            detach();
        }
    });
});
