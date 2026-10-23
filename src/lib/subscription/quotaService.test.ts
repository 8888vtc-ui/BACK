/**
 * Tests unitaires complets pour `quotaService.ts` :
 * - Règle des 3 analyses offertes par tranche glissante de 24h
 * - Réinitialisation automatique après 24h
 * - Statuts VIP (`coach_monthly`, `coach_yearly`) et gestion des abonnements expirés / annulés
 * - Utilisateurs invités (`localStorage` : `backgammon.dailyQuota`) et idempotence par `gameId`
 * - Teaser dopaminergique Open Sage (modèle Chess.com)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    FREE_DAILY_ANALYSES_LIMIT,
    QUOTA_RESET_WINDOW_MS,
    LOCAL_STORAGE_QUOTA_KEY,
    isVipTier,
    shouldResetQuotaWindow,
    formatQuotaBadgeFr,
    computeQuotaState,
    loadGuestQuota,
    consumeGuestAnalysisQuota,
    resetGuestQuota,
    getQuotaForUser,
    consumeAnalysisQuota,
    buildOpenSageTeaser,
    type QuotaStorageLike,
} from './quotaService';

function createMemoryStorage(): QuotaStorageLike & { store: Map<string, string> } {
    const store = new Map<string, string>();
    return {
        store,
        getItem(key: string): string | null {
            return store.get(key) ?? null;
        },
        setItem(key: string, value: string): void {
            store.set(key, value);
        },
        removeItem(key: string): void {
            store.delete(key);
        },
    };
}

describe('quotaService — Règle des 3 analyses / 24h, Statuts VIP & Invités', () => {
    let storage: ReturnType<typeof createMemoryStorage>;
    const baseNow = new Date('2026-10-23T12:00:00.000Z');

    beforeEach(() => {
        storage = createMemoryStorage();
    });

    describe('1. Statuts VIP (coach_monthly & coach_yearly)', () => {
        it('reconnaît les abonnés actifs coach_monthly et coach_yearly comme VIP illimités', () => {
            expect(isVipTier('coach_monthly', 'active')).toBe(true);
            expect(isVipTier('coach_yearly', 'active')).toBe(true);
            expect(isVipTier('coach_yearly', 'trialing')).toBe(true);
            expect(isVipTier('coach_monthly')).toBe(true);
        });

        it('refuse le statut VIP aux comptes free ou dont l’abonnement est canceled / past_due', () => {
            expect(isVipTier('free', 'none')).toBe(false);
            expect(isVipTier('free', 'active')).toBe(false);
            expect(isVipTier('coach_monthly', 'canceled')).toBe(false);
            expect(isVipTier('coach_yearly', 'past_due')).toBe(false);
            expect(isVipTier(null, null)).toBe(false);
        });

        it('accorde des analyses illimitées aux membres VIP même au-delà de 3 matchs par jour', async () => {
            const vipState = computeQuotaState({
                tier: 'coach_yearly',
                subscriptionStatus: 'active',
                dailyAnalysesCount: 15,
                lastAnalysisResetAt: baseNow.toISOString(),
                now: baseNow,
            });

            expect(vipState.isVip).toBe(true);
            expect(vipState.isUnlimited).toBe(true);
            expect(vipState.canAnalyze).toBe(true);
            expect(vipState.isQuotaReached).toBe(false);
            expect(vipState.badgeLabelFr).toBe('Coach Illimité ⚜');

            const consumeRes = await consumeAnalysisQuota({
                profile: {
                    id: 'vip-user-1',
                    subscription_tier: 'coach_monthly',
                    subscription_status: 'active',
                    daily_analyses_count: 10,
                    last_analysis_reset_at: baseNow.toISOString(),
                },
                now: baseNow,
                storage,
            });

            expect(consumeRes.allowed).toBe(true);
            expect(consumeRes.source).toBe('vip');
            expect(consumeRes.state.canAnalyze).toBe(true);
        });
    });

    describe('2. Fenêtre glissante de 24h & Reset automatique', () => {
        it('détecte correctement l’expiration de la tranche de 24 heures', () => {
            const justBefore24h = new Date(baseNow.getTime() - QUOTA_RESET_WINDOW_MS + 1000);
            const exact24h = new Date(baseNow.getTime() - QUOTA_RESET_WINDOW_MS);
            const after25h = new Date(baseNow.getTime() - QUOTA_RESET_WINDOW_MS - 3600_000);

            expect(shouldResetQuotaWindow(justBefore24h, baseNow)).toBe(false);
            expect(shouldResetQuotaWindow(exact24h, baseNow)).toBe(true);
            expect(shouldResetQuotaWindow(after25h, baseNow)).toBe(true);
            expect(shouldResetQuotaWindow(null, baseNow)).toBe(true);
        });

        it('réinitialise automatiquement un quota saturé (3/3) lorsque 24h se sont écoulées', async () => {
            const yesterday = new Date(baseNow.getTime() - QUOTA_RESET_WINDOW_MS - 5000);

            // Avant 24h : quota atteint (3/3)
            const saturatedState = computeQuotaState({
                tier: 'free',
                dailyAnalysesCount: 3,
                lastAnalysisResetAt: baseNow.toISOString(),
                now: baseNow,
            });
            expect(saturatedState.usedToday).toBe(3);
            expect(saturatedState.remainingToday).toBe(0);
            expect(saturatedState.canAnalyze).toBe(false);
            expect(saturatedState.isQuotaReached).toBe(true);

            // Après 24h : remis à 0/3 et débloqué
            const resetState = computeQuotaState({
                tier: 'free',
                dailyAnalysesCount: 3,
                lastAnalysisResetAt: yesterday.toISOString(),
                now: baseNow,
            });
            expect(resetState.usedToday).toBe(0);
            expect(resetState.remainingToday).toBe(FREE_DAILY_ANALYSES_LIMIT);
            expect(resetState.canAnalyze).toBe(true);
            expect(resetState.isQuotaReached).toBe(false);

            // Consommation d'une nouvelle analyse après 24h pour un profil connecté
            const consumeAfter24h = await consumeAnalysisQuota({
                profile: {
                    id: 'user-free-reset',
                    subscription_tier: 'free',
                    daily_analyses_count: 3,
                    last_analysis_reset_at: yesterday.toISOString(),
                },
                now: baseNow,
                storage,
            });
            expect(consumeAfter24h.allowed).toBe(true);
            expect(consumeAfter24h.state.usedToday).toBe(1);
            expect(consumeAfter24h.state.remainingToday).toBe(2);
        });
    });

    describe('3. Utilisateurs invités (LocalStorage : backgammon.dailyQuota)', () => {
        it('autorise les matchs 1, 2 et 3 puis déclenche le Soft Paywall au 4e match', () => {
            // Match 1
            const m1 = consumeGuestAnalysisQuota({ gameId: 'game-1', now: baseNow, storage });
            expect(m1.allowed).toBe(true);
            expect(m1.state.usedToday).toBe(1);
            expect(m1.state.remainingToday).toBe(2);
            expect(m1.state.badgeLabelFr).toBe("Analyse 1/3 offerte aujourd'hui");

            // Match 2
            const m2 = consumeGuestAnalysisQuota({ gameId: 'game-2', now: baseNow, storage });
            expect(m2.allowed).toBe(true);
            expect(m2.state.usedToday).toBe(2);
            expect(m2.state.remainingToday).toBe(1);
            expect(m2.state.badgeLabelFr).toBe("Analyse 2/3 offerte aujourd'hui");

            // Match 3
            const m3 = consumeGuestAnalysisQuota({ gameId: 'game-3', now: baseNow, storage });
            expect(m3.allowed).toBe(true);
            expect(m3.state.usedToday).toBe(3);
            expect(m3.state.remainingToday).toBe(0);
            expect(m3.state.isQuotaReached).toBe(true);
            expect(m3.state.badgeLabelFr).toBe("Analyse 3/3 offerte aujourd'hui");

            // Vérification de la persistance dans backgammon.dailyQuota
            const rawSaved = storage.getItem(LOCAL_STORAGE_QUOTA_KEY);
            expect(rawSaved).toBeTruthy();
            const parsed = JSON.parse(rawSaved!);
            expect(parsed.dailyAnalysesCount).toBe(3);

            // Match 4 : bloqué par le quota (Soft Paywall)
            const m4 = consumeGuestAnalysisQuota({ gameId: 'game-4', now: baseNow, storage });
            expect(m4.allowed).toBe(false);
            expect(m4.state.usedToday).toBe(3);
            expect(m4.state.canAnalyze).toBe(false);
            expect(m4.state.isQuotaReached).toBe(true);
        });

        it('ne décrémente pas deux fois le quota si le joueur consulte à nouveau la même partie (gameId)', () => {
            const first = consumeGuestAnalysisQuota({ gameId: 'same-game', now: baseNow, storage });
            expect(first.allowed).toBe(true);
            expect(first.alreadyConsumedForGame).toBe(false);
            expect(first.state.usedToday).toBe(1);

            const second = consumeGuestAnalysisQuota({ gameId: 'same-game', now: baseNow, storage });
            expect(second.allowed).toBe(true);
            expect(second.alreadyConsumedForGame).toBe(true);
            expect(second.state.usedToday).toBe(1);
        });

        it('réinitialise automatiquement localStorage (backgammon.dailyQuota) après 24h', () => {
            consumeGuestAnalysisQuota({ gameId: 'g1', now: baseNow, storage });
            consumeGuestAnalysisQuota({ gameId: 'g2', now: baseNow, storage });
            consumeGuestAnalysisQuota({ gameId: 'g3', now: baseNow, storage });

            const blocked = consumeGuestAnalysisQuota({ gameId: 'g4', now: baseNow, storage });
            expect(blocked.allowed).toBe(false);

            // 24h + 1 minute plus tard
            const nextDay = new Date(baseNow.getTime() + QUOTA_RESET_WINDOW_MS + 60_000);
            const loadedNextDay = loadGuestQuota(nextDay, storage);
            expect(loadedNextDay.dailyAnalysesCount).toBe(0);

            const m1NextDay = consumeGuestAnalysisQuota({ gameId: 'g5', now: nextDay, storage });
            expect(m1NextDay.allowed).toBe(true);
            expect(m1NextDay.state.usedToday).toBe(1);
            expect(m1NextDay.state.remainingToday).toBe(2);
        });

        it('permet de réinitialiser le quota invité via resetGuestQuota et getQuotaForUser', async () => {
            consumeGuestAnalysisQuota({ gameId: 'g1', now: baseNow, storage });
            resetGuestQuota(baseNow, storage);

            const state = await getQuotaForUser({ now: baseNow, storage });
            expect(state.usedToday).toBe(0);
            expect(state.remainingToday).toBe(3);
            expect(state.canAnalyze).toBe(true);
        });
    });

    describe('4. Formatage des badges & Teaser dopaminergique Open Sage', () => {
        it('formate le badge discret "Analyse 2/3 offerte aujourd’hui"', () => {
            expect(formatQuotaBadgeFr(2, 3, false)).toBe("Analyse 2/3 offerte aujourd'hui");
            expect(formatQuotaBadgeFr(0, 3, true)).toBe('Coach Illimité ⚜');
        });

        it('génère le teaser valorisant Chess.com avec le PR exact et les Coups Brillants (!!)', () => {
            const teaser = buildOpenSageTeaser(null, 'fr');
            expect(teaser.prDisplayFr).toBe('Performance Rating : 4.85 — Niveau Maître');
            expect(teaser.teaserTextFr).toBe(
                'Vous avez joué 2 Coups Brillants (!!) et manqué 1 opportunité décisive de videau. Passez au Coach Illimité pour comprendre pourquoi.',
            );
            expect(teaser.ctaLabelFr).toBe(
                "Débloquer l'Analyse avec le Coach Illimité (Essai 7 jours)",
            );
        });
    });
});
