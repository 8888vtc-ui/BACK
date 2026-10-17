/**
 * Système d'alerte opérationnel pour le suivi des anomalies en temps réel
 * (Latence anormale, échecs réseau répétés, rate-limiting et erreurs critiques).
 */

import { captureMessage } from './sentry';
import { logger } from './logger';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertEvent {
    id: string;
    type: 'HIGH_LATENCY' | 'CONSECUTIVE_FAILURES' | 'RATE_LIMIT_TRIGGERED' | 'CRITICAL_ERROR' | 'ANOMALY_DETECTED';
    severity: AlertSeverity;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
}

export type AlertListener = (alert: AlertEvent) => void;

class AlertManager {
    private listeners: Set<AlertListener> = new Set();
    private recentAlerts: Map<string, number> = new Map();
    private deduplicationWindowMs = 60000; // 60 secondes de déduplication par type/clef
    private history: AlertEvent[] = [];
    private maxHistory = 100;

    constructor() {
        // Enregistre un listener par défaut pour le logging structuré
        this.subscribe((alert) => {
            if (alert.severity === 'critical') {
                logger.error(`[ALERTE CRITIQUE] ${alert.message}`, undefined, alert.details);
            } else if (alert.severity === 'warning') {
                logger.warn(`[ALERTE WARNING] ${alert.message}`, alert.details);
            } else {
                logger.info(`[ALERTE INFO] ${alert.message}`, alert.details);
            }
        });
    }

    /**
     * S'abonne aux alertes levées par le système
     */
    subscribe(listener: AlertListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Déclenche une alerte opérationnelle
     */
    triggerAlert(
        type: AlertEvent['type'],
        severity: AlertSeverity,
        message: string,
        details?: Record<string, unknown>
    ): AlertEvent | null {
        const dedupeKey = `${type}:${message}`;
        const now = Date.now();
        const lastSent = this.recentAlerts.get(dedupeKey);

        if (lastSent && now - lastSent < this.deduplicationWindowMs) {
            // Ignoré car déjà émis récemment (anti-tempête d'alertes)
            return null;
        }

        this.recentAlerts.set(dedupeKey, now);

        const alert: AlertEvent = {
            id: `alert-${now}-${Math.random().toString(36).substring(2, 7)}`,
            type,
            severity,
            message,
            details,
            timestamp: new Date().toISOString(),
        };

        this.history.unshift(alert);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        // Notification des écouteurs enregistrés
        for (const listener of this.listeners) {
            try {
                listener(alert);
            } catch (err) {
                console.error('[AlertManager] Erreur lors de l’exécution du listener:', err);
            }
        }

        // Si critique, transfert à Sentry avec tag alerte
        if (severity === 'critical' || severity === 'warning') {
            captureMessage(`[Alerte ${severity.toUpperCase()}] ${message}`, {
                level: severity === 'critical' ? 'error' : 'warning',
                tags: { alertType: type, severity },
                extra: details,
            });
        }

        // Envoi vers un webhook externe (Slack/Discord/PagerDuty) si configuré côté serveur
        this.forwardToWebhook(alert).catch(() => {});

        return alert;
    }

    private async forwardToWebhook(alert: AlertEvent): Promise<void> {
        const webhookUrl = typeof process !== 'undefined' ? process.env.ALERT_WEBHOOK_URL : undefined;
        if (!webhookUrl || typeof fetch === 'undefined') return;

        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `🚨 *[Backgammon Alert - ${alert.severity.toUpperCase()}]* ${alert.message}`,
                    attachments: [
                        {
                            color: alert.severity === 'critical' ? '#dc2626' : '#f59e0b',
                            fields: [
                                { title: 'Type', value: alert.type, short: true },
                                { title: 'Horodatage', value: alert.timestamp, short: true },
                                ...(alert.details ? [{ title: 'Détails', value: JSON.stringify(alert.details), short: false }] : []),
                            ],
                        },
                    ],
                }),
            });
        } catch (error) {
            console.error('[AlertManager] Échec envoi webhook:', error);
        }
    }

    getHistory(): AlertEvent[] {
        return [...this.history];
    }

    clearHistory(): void {
        this.history = [];
        this.recentAlerts.clear();
    }
}

export const alertManager = new AlertManager();
export default alertManager;
