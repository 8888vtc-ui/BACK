import { describe, it, expect, beforeEach, vi } from 'vitest';
import { alertManager, AlertEvent } from './alerts';

describe('AlertManager', () => {
    beforeEach(() => {
        alertManager.clearHistory();
    });

    it('déclenche une alerte et la notifie aux abonnés', () => {
        const received: AlertEvent[] = [];
        const unsubscribe = alertManager.subscribe((alert) => {
            received.push(alert);
        });

        const alert = alertManager.triggerAlert('HIGH_LATENCY', 'warning', 'Latence anormale de 1500ms', {
            latencyMs: 1500,
        });

        expect(alert).not.toBeNull();
        expect(alert?.type).toBe('HIGH_LATENCY');
        expect(alert?.severity).toBe('warning');
        expect(received).toHaveLength(1);
        expect(received[0].message).toBe('Latence anormale de 1500ms');

        unsubscribe();
    });

    it('déduplique les alertes identiques émises dans la fenêtre de déduplication', () => {
        const first = alertManager.triggerAlert('RATE_LIMIT_TRIGGERED', 'critical', 'Limite 429 atteinte');
        expect(first).not.toBeNull();

        // Deuxième appel immédiat avec même type et message -> rejeté par la déduplication
        const second = alertManager.triggerAlert('RATE_LIMIT_TRIGGERED', 'critical', 'Limite 429 atteinte');
        expect(second).toBeNull();
    });

    it('conserve l’historique des alertes récentes', () => {
        alertManager.triggerAlert('HIGH_LATENCY', 'info', 'Latence 850ms');
        alertManager.triggerAlert('CONSECUTIVE_FAILURES', 'warning', '2 échecs réseau');

        const history = alertManager.getHistory();
        expect(history.length).toBeGreaterThanOrEqual(2);
        expect(history[0].type).toBe('CONSECUTIVE_FAILURES');
        expect(history[1].type).toBe('HIGH_LATENCY');
    });
});
