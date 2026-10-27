/**
 * @file src/lib/stripe/webhookStore.ts
 * @description Registre mémoire d'idempotence des webhooks Stripe et utilitaires de test (< 100 lignes, 0 any).
 */

export const DUNNING_GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export const processedWebhookEventIds = new Set<string>();
export const finalizedCheckoutSessionIds = new Set<string>();

export function resetProcessedWebhookEventsForTests(): void {
    processedWebhookEventIds.clear();
    finalizedCheckoutSessionIds.clear();
}
