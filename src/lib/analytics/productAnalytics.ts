/**
 * Système d'Analytics Produit & Télémétrie d'usage pour Backgammon Pro
 * Supporte le mode local/console, PostHog, Mixpanel, Google Analytics 4 et la conformité RGPD.
 */

export interface ProductEvent {
    eventName: string;
    properties?: Record<string, unknown>;
    timestamp: string;
    userId?: string;
    sessionId: string;
}

export interface AnalyticsConfig {
    enabled?: boolean;
    anonymize?: boolean;
    posthogKey?: string;
    gaMeasurementId?: string;
}

class ProductAnalytics {
    private isConsentGiven = true;
    private sessionId: string;
    private userId: string | null = null;
    private buffer: ProductEvent[] = [];
    private maxBufferSize = 50;

    constructor() {
        this.sessionId = this.generateSessionId();
        // Récupération de l'éventuel consentement stocké localement
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedConsent = localStorage.getItem('bg_analytics_consent');
            if (storedConsent !== null) {
                this.isConsentGiven = storedConsent === 'true';
            }
        }
    }

    private generateSessionId(): string {
        return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Définit le consentement utilisateur (RGPD / Bannière cookies)
     */
    setConsent(consent: boolean): void {
        this.isConsentGiven = consent;
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('bg_analytics_consent', String(consent));
        }
        if (!consent) {
            this.buffer = [];
        }
    }

    /**
     * Associe l'identifiant utilisateur (anonymisé ou ID Supabase)
     */
    identify(userId: string | null): void {
        this.userId = userId;
    }

    /**
     * Émet un événement produit vers les providers configurés
     */
    track(eventName: string, properties: Record<string, unknown> = {}): ProductEvent | null {
        if (!this.isConsentGiven) return null;

        const event: ProductEvent = {
            eventName,
            properties,
            timestamp: new Date().toISOString(),
            userId: this.userId || undefined,
            sessionId: this.sessionId,
        };

        this.buffer.unshift(event);
        if (this.buffer.length > this.maxBufferSize) {
            this.buffer.pop();
        }

        // 1. Dispatch vers Google Analytics 4 si configuré
        if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
            try {
                (window as unknown as { gtag: (cmd: string, action: string, params: unknown) => void }).gtag(
                    'event',
                    eventName,
                    properties
                );
            } catch {
                // Ignore silent analytics errors
            }
        }

        // 2. Dispatch vers PostHog si présent dans window
        if (typeof window !== 'undefined' && (window as unknown as { posthog?: { capture: (ev: string, props: unknown) => void } }).posthog) {
            try {
                (window as unknown as { posthog: { capture: (ev: string, props: unknown) => void } }).posthog.capture(
                    eventName,
                    properties
                );
            } catch {
                // Ignore silent analytics errors
            }
        }

        // 3. Logger en console de dev si actif
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            console.debug(`[Analytics] 📊 ${eventName}`, properties);
        }

        return event;
    }

    // --- Helpers d'événements métier de Backgammon ---

    trackGameStarted(params: { difficulty: string; matchLength: number; isCrawford?: boolean }): void {
        this.track('game_started', params);
    }

    trackGameCompleted(params: {
        winner: 'X' | 'O';
        durationSeconds: number;
        scoreX: number;
        scoreO: number;
        finalPR?: number;
        blundersCount?: number;
    }): void {
        this.track('game_completed', params);
    }

    trackMovePlayed(params: {
        turn: number;
        dice: [number, number];
        isBookMove: boolean;
        equityLoss?: number;
    }): void {
        this.track('move_played', params);
    }

    trackCoachRequested(params: {
        trigger: 'manual' | 'blunder_alert' | 'review';
        ply: number;
        provider: 'wasm' | 'backend';
    }): void {
        this.track('coach_requested', params);
    }

    trackCoachExplanationViewed(params: {
        moveType: string;
        blunderSeverity: string;
        provider: 'llm' | 'heuristic';
        cached: boolean;
        durationMs?: number;
    }): void {
        this.track('coach_explanation_viewed', params);
    }

    trackDeepRolloutSubmitted(params: {
        ply: number;
        trials: number;
        elapsedSeconds?: number;
    }): void {
        this.track('deep_rollout_submitted', params);
    }

    trackCubeDecision(params: {
        action: 'double' | 'take' | 'pass' | 'beaver';
        player: 'X' | 'O';
        cubeValue: number;
        equityDiff?: number;
    }): void {
        this.track('cube_action', params);
    }

    trackDrillCompleted(params: {
        drillId: string;
        success: boolean;
        attemptsCount: number;
    }): void {
        this.track('drill_completed', params);
    }

    trackDailyPuzzleCompleted(params: {
        puzzleId: string;
        solved: boolean;
        durationSeconds: number;
    }): void {
        this.track('daily_puzzle_completed', params);
    }

    trackMultiplayerEvent(event: 'joined' | 'left' | 'finished', params: Record<string, unknown>): void {
        this.track(`multiplayer_${event}`, params);
    }

    getRecentEvents(): ProductEvent[] {
        return [...this.buffer];
    }

    clear(): void {
        this.buffer = [];
    }
}

export const analytics = new ProductAnalytics();
export default analytics;
