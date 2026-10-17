import { describe, it, expect, beforeEach } from 'vitest';
import { analytics } from './productAnalytics';

describe('ProductAnalytics', () => {
    beforeEach(() => {
        analytics.clear();
        analytics.setConsent(true);
        analytics.identify(null);
    });

    it('enregistre les événements de cycle de jeu', () => {
        analytics.trackGameStarted({ difficulty: 'master', matchLength: 5, isCrawford: false });
        analytics.trackGameCompleted({
            winner: 'X',
            durationSeconds: 320,
            scoreX: 5,
            scoreO: 3,
            finalPR: 4.2,
            blundersCount: 1,
        });

        const events = analytics.getRecentEvents();
        expect(events).toHaveLength(2);
        expect(events[0].eventName).toBe('game_completed');
        expect(events[0].properties?.winner).toBe('X');
        expect(events[1].eventName).toBe('game_started');
        expect(events[1].properties?.difficulty).toBe('master');
    });

    it('trace les interactions du coach grand-maître et les rollouts', () => {
        analytics.trackCoachRequested({ trigger: 'blunder_alert', ply: 2, provider: 'backend' });
        analytics.trackCoachExplanationViewed({
            moveType: 'prime_building',
            blunderSeverity: 'blunder',
            provider: 'llm',
            cached: false,
            durationMs: 420,
        });
        analytics.trackDeepRolloutSubmitted({ ply: 3, trials: 1296, elapsedSeconds: 12.4 });

        const events = analytics.getRecentEvents();
        expect(events).toHaveLength(3);
        expect(events[0].eventName).toBe('deep_rollout_submitted');
        expect(events[1].eventName).toBe('coach_explanation_viewed');
        expect(events[2].eventName).toBe('coach_requested');
    });

    it('respecte le refus de consentement RGPD en ne traquant aucun événement', () => {
        analytics.setConsent(false);
        const ev = analytics.track('test_event', { key: 'val' });

        expect(ev).toBeNull();
        expect(analytics.getRecentEvents()).toHaveLength(0);
    });

    it('associe l’identifiant utilisateur aux événements émis', () => {
        analytics.identify('supabase-user-uuid-999');
        analytics.track('custom_action');

        const events = analytics.getRecentEvents();
        expect(events[0].userId).toBe('supabase-user-uuid-999');
    });
});
