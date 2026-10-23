'use client';

/**
 * Hook React `useCoachQuota` — Gestion réactive du quota d'analyses Coach IA (3 analyses / 24h)
 * et synchronisation avec le statut d'abonnement VIP (`coach_monthly` / `coach_yearly`).
 *
 * Architecture Local-First & Cloud :
 * - Connecté : interroge et incrémente atomiquement le quota dans Supabase (`profiles`).
 * - Invité / Hors-ligne : persiste dans `localStorage` (`backgammon.dailyQuota`).
 */

import { useCallback, useEffect, useState } from 'react';
import { useUserSession } from './useUserSession';
import type { Profile } from '../lib/supabase/types';
import {
    computeQuotaState,
    consumeAnalysisQuota,
    getQuotaForUser,
    loadGuestQuota,
    QUOTA_UPDATED_EVENT,
    LOCAL_STORAGE_QUOTA_KEY,
    type CoachQuotaState,
    type ConsumeQuotaResult,
} from '../lib/subscription/quotaService';

export interface UseCoachQuotaOptions {
    /** Identifiant utilisateur optionnel (surcharge la session active). */
    readonly userId?: string | null;
    /** Profil utilisateur optionnel (surcharge la session active). */
    readonly profile?: Partial<Profile> | null;
    /** Langue d'affichage du badge ('fr' | 'en'). */
    readonly locale?: string;
    /** Consommer automatiquement 1 analyse au montage pour ce `gameId` (optionnel). */
    readonly autoConsumeGameId?: string;
}

export interface UseCoachQuotaReturn {
    readonly quota: CoachQuotaState;
    readonly isLoading: boolean;
    readonly canAnalyze: boolean;
    readonly isQuotaReached: boolean;
    readonly isVip: boolean;
    readonly isUnlimited: boolean;
    readonly usedToday: number;
    readonly remainingToday: number;
    readonly maxDaily: number;
    readonly badgeLabel: string;
    readonly consumeQuota: (gameId?: string) => Promise<ConsumeQuotaResult>;
    readonly refreshQuota: () => Promise<CoachQuotaState>;
}

function getInitialQuotaState(profile?: Partial<Profile> | null): CoachQuotaState {
    if (profile) {
        return computeQuotaState({
            tier: profile.subscription_tier,
            subscriptionStatus: profile.subscription_status,
            dailyAnalysesCount: profile.daily_analyses_count ?? 0,
            lastAnalysisResetAt: profile.last_analysis_reset_at ?? null,
        });
    }
    const guest = loadGuestQuota();
    return computeQuotaState({
        tier: 'free',
        dailyAnalysesCount: guest.dailyAnalysesCount,
        lastAnalysisResetAt: guest.lastAnalysisResetAt,
    });
}

export function useCoachQuota(options?: UseCoachQuotaOptions): UseCoachQuotaReturn {
    const session = useUserSession();
    const effectiveUserId =
        options?.userId !== undefined ? options.userId : (session.user?.id ?? null);
    const effectiveProfile =
        options?.profile !== undefined ? options.profile : session.profile;
    const isEn = options?.locale === 'en';

    const [quota, setQuota] = useState<CoachQuotaState>(() =>
        getInitialQuotaState(effectiveProfile),
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const refreshQuota = useCallback(async (): Promise<CoachQuotaState> => {
        setIsLoading(true);
        try {
            const nextState = await getQuotaForUser({
                userId: effectiveUserId,
                profile: effectiveProfile,
            });
            setQuota(nextState);
            return nextState;
        } finally {
            setIsLoading(false);
        }
    }, [effectiveUserId, effectiveProfile]);

    const consumeQuota = useCallback(
        async (gameId?: string): Promise<ConsumeQuotaResult> => {
            setIsLoading(true);
            try {
                const res = await consumeAnalysisQuota({
                    userId: effectiveUserId,
                    profile: effectiveProfile,
                    gameId,
                });
                setQuota(res.state);
                return res;
            } finally {
                setIsLoading(false);
            }
        },
        [effectiveUserId, effectiveProfile],
    );

    useEffect(() => {
        void refreshQuota();
    }, [refreshQuota]);

    useEffect(() => {
        if (!options?.autoConsumeGameId) return;
        void consumeQuota(options.autoConsumeGameId);
    }, [options?.autoConsumeGameId, consumeQuota]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleQuotaUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<CoachQuotaState>;
            if (customEvent.detail) {
                setQuota(customEvent.detail);
            } else {
                void refreshQuota();
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === LOCAL_STORAGE_QUOTA_KEY) {
                void refreshQuota();
            }
        };

        window.addEventListener(QUOTA_UPDATED_EVENT, handleQuotaUpdated);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(QUOTA_UPDATED_EVENT, handleQuotaUpdated);
            window.removeEventListener('storage', handleStorage);
        };
    }, [refreshQuota]);

    const badgeLabel = isEn ? quota.badgeLabelEn : quota.badgeLabelFr;

    return {
        quota,
        isLoading,
        canAnalyze: quota.canAnalyze,
        isQuotaReached: quota.isQuotaReached,
        isVip: quota.isVip,
        isUnlimited: quota.isUnlimited,
        usedToday: quota.usedToday,
        remainingToday: quota.remainingToday,
        maxDaily: quota.maxDaily,
        badgeLabel,
        consumeQuota,
        refreshQuota,
    };
}

export default useCoachQuota;
