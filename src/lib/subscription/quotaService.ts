/**
 * Service de gestion du quota Freemium (3 analyses complètes / 24h) & Statut VIP Coach IA.
 *
 * Philosophie éthique ("Zero Ads, Zero Coins, Pure Skill") :
 * - Les métriques de base (Score, Performance Rating PR exact par Open Sage, Statistiques de chance aux dés)
 *   sont 100 % gratuites et illimitées pour tous les joueurs.
 * - Un joueur non-abonné (`tier === 'free'`) bénéficie de 3 revues de match complètes par tranche glissante de 24h.
 * - Les abonnés actifs (`tier === 'coach_monthly' | 'coach_yearly'`) disposent d'analyses illimitées.
 * - Architecture Local-First & Cloud :
 *     * Utilisateur connecté : stockage et incrémentation atomique dans Supabase (`daily_analyses_count`, `last_analysis_reset_at`).
 *     * Joueur invité (offline / non connecté) : persistance dans `localStorage` (`backgammon.dailyQuota`).
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { Profile, SubscriptionStatus, SubscriptionTier } from '../supabase/types';
import type { CompleteGameAnalysis } from '../../features/rating/types';

/** Quota quotidien offert aux joueurs gratuits (3 revues complètes par 24h). */
export const FREE_DAILY_ANALYSES_LIMIT = 3;

/** Durée de la fenêtre glissante de réinitialisation du quota (24 heures en millisecondes). */
export const QUOTA_RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Clé de persistance LocalStorage pour les joueurs invités / hors-ligne. */
export const LOCAL_STORAGE_QUOTA_KEY = 'backgammon.dailyQuota';

/** Événement DOM personnalisé émis lors de toute mise à jour du quota. */
export const QUOTA_UPDATED_EVENT = 'backgammon:quota-updated';

/** Interface minimale de stockage compatible `localStorage` et mocks de test. */
export interface QuotaStorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem?(key: string): void;
}

/** Structure persistée dans `localStorage` sous la clé `backgammon.dailyQuota`. */
export interface LocalQuotaRecord {
    readonly dailyAnalysesCount: number;
    readonly lastAnalysisResetAt: string;
    readonly consumedGameIds?: ReadonlyArray<string>;
}

/** État calculé complet du quota d'analyses Coach IA. */
export interface CoachQuotaState {
    readonly tier: SubscriptionTier;
    readonly subscriptionStatus: SubscriptionStatus;
    readonly isVip: boolean;
    readonly isUnlimited: boolean;
    readonly usedToday: number;
    readonly maxDaily: number;
    readonly remainingToday: number;
    readonly canAnalyze: boolean;
    readonly isQuotaReached: boolean;
    readonly lastResetAt: string;
    readonly nextResetAt: string;
    readonly badgeLabelFr: string;
    readonly badgeLabelEn: string;
}

/** Résultat d'une tentative de consommation d'une analyse complète. */
export interface ConsumeQuotaResult {
    readonly allowed: boolean;
    readonly state: CoachQuotaState;
    readonly alreadyConsumedForGame: boolean;
    readonly source: 'vip' | 'supabase' | 'local';
}

/** Teaser dopaminergique généré par Open Sage pour le Soft Paywall de fin de match. */
export interface OpenSageTeaser {
    readonly prDisplayFr: string;
    readonly prDisplayEn: string;
    readonly brilliantMovesCount: number;
    readonly missedCubeOpportunitiesCount: number;
    readonly teaserTextFr: string;
    readonly teaserTextEn: string;
    readonly ctaLabelFr: string;
    readonly ctaLabelEn: string;
}

function getDefaultStorage(): QuotaStorageLike | null {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
        return globalThis.localStorage;
    }
    return null;
}

function notifyQuotaUpdated(state: CoachQuotaState): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        try {
            window.dispatchEvent(new CustomEvent(QUOTA_UPDATED_EVENT, { detail: state }));
        } catch {
            // Ignoré en environnement restreint
        }
    }
}

/**
 * Normalise la valeur du tier d'abonnement.
 */
export function normalizeSubscriptionTier(
    tier?: SubscriptionTier | string | null,
): SubscriptionTier {
    if (tier === 'coach_monthly' || tier === 'coach_yearly') {
        return tier;
    }
    return 'free';
}

/**
 * Normalise le statut d'abonnement Stripe.
 */
export function normalizeSubscriptionStatus(
    status?: SubscriptionStatus | string | null,
    tier?: SubscriptionTier | string | null,
): SubscriptionStatus {
    if (
        status === 'active' ||
        status === 'trialing' ||
        status === 'past_due' ||
        status === 'canceled' ||
        status === 'incomplete' ||
        status === 'none'
    ) {
        return status;
    }
    const normalizedTier = normalizeSubscriptionTier(tier);
    return normalizedTier === 'free' ? 'none' : 'active';
}

/**
 * Détermine si un utilisateur dispose d'un abonnement Coach Illimité actif (`coach_monthly` ou `coach_yearly`).
 */
export function isVipTier(
    tier?: SubscriptionTier | string | null,
    status?: SubscriptionStatus | string | null,
): boolean {
    const normalizedTier = normalizeSubscriptionTier(tier);
    if (normalizedTier !== 'coach_monthly' && normalizedTier !== 'coach_yearly') {
        return false;
    }
    const normalizedStatus = normalizeSubscriptionStatus(status, normalizedTier);
    return normalizedStatus === 'active' || normalizedStatus === 'trialing';
}

/**
 * Vérifie si la fenêtre glissante de 24h est écoulée depuis `lastResetAt`.
 */
export function shouldResetQuotaWindow(
    lastResetAt: string | Date | null | undefined,
    now: Date = new Date(),
): boolean {
    if (!lastResetAt) {
        return true;
    }
    const resetTimeMs =
        typeof lastResetAt === 'string' ? Date.parse(lastResetAt) : lastResetAt.getTime();
    if (Number.isNaN(resetTimeMs)) {
        return true;
    }
    return now.getTime() - resetTimeMs >= QUOTA_RESET_WINDOW_MS;
}

/**
 * Formate le badge discret de quota en français (ex: "Analyse 2/3 offerte aujourd'hui").
 */
export function formatQuotaBadgeFr(
    usedToday: number,
    maxDaily: number = FREE_DAILY_ANALYSES_LIMIT,
    isVip: boolean = false,
): string {
    if (isVip) {
        return 'Coach Illimité ⚜';
    }
    const displayUsed = Math.min(maxDaily, Math.max(1, Math.floor(usedToday)));
    return `Analyse ${displayUsed}/${maxDaily} offerte aujourd'hui`;
}

/**
 * Formate le badge discret de quota en anglais.
 */
export function formatQuotaBadgeEn(
    usedToday: number,
    maxDaily: number = FREE_DAILY_ANALYSES_LIMIT,
    isVip: boolean = false,
): string {
    if (isVip) {
        return 'Unlimited Coach ⚜';
    }
    const displayUsed = Math.min(maxDaily, Math.max(1, Math.floor(usedToday)));
    return `Free Analysis ${displayUsed}/${maxDaily} today`;
}

/**
 * Calcule de manière pure l'état du quota à partir des données de profil ou de stockage local.
 */
export function computeQuotaState(params?: {
    tier?: SubscriptionTier | string | null;
    subscriptionStatus?: SubscriptionStatus | string | null;
    dailyAnalysesCount?: number | null;
    lastAnalysisResetAt?: string | null;
    maxDaily?: number;
    now?: Date;
}): CoachQuotaState {
    const now = params?.now ?? new Date();
    const maxDaily = params?.maxDaily ?? FREE_DAILY_ANALYSES_LIMIT;
    const tier = normalizeSubscriptionTier(params?.tier);
    const subscriptionStatus = normalizeSubscriptionStatus(params?.subscriptionStatus, tier);
    const vip = isVipTier(tier, subscriptionStatus);

    const windowExpired = shouldResetQuotaWindow(params?.lastAnalysisResetAt, now);
    const effectiveLastResetAt =
        windowExpired || !params?.lastAnalysisResetAt
            ? now.toISOString()
            : new Date(params.lastAnalysisResetAt).toISOString();
    const nextResetAt = new Date(
        Date.parse(effectiveLastResetAt) + QUOTA_RESET_WINDOW_MS,
    ).toISOString();

    const rawCount = windowExpired ? 0 : Math.max(0, Math.floor(params?.dailyAnalysesCount ?? 0));

    if (vip) {
        return {
            tier,
            subscriptionStatus,
            isVip: true,
            isUnlimited: true,
            usedToday: rawCount,
            maxDaily,
            remainingToday: Number.POSITIVE_INFINITY,
            canAnalyze: true,
            isQuotaReached: false,
            lastResetAt: effectiveLastResetAt,
            nextResetAt,
            badgeLabelFr: formatQuotaBadgeFr(rawCount, maxDaily, true),
            badgeLabelEn: formatQuotaBadgeEn(rawCount, maxDaily, true),
        };
    }

    const remainingToday = Math.max(0, maxDaily - rawCount);
    const canAnalyze = rawCount < maxDaily;
    const isQuotaReached = rawCount >= maxDaily;

    return {
        tier: 'free',
        subscriptionStatus,
        isVip: false,
        isUnlimited: false,
        usedToday: rawCount,
        maxDaily,
        remainingToday,
        canAnalyze,
        isQuotaReached,
        lastResetAt: effectiveLastResetAt,
        nextResetAt,
        badgeLabelFr: formatQuotaBadgeFr(rawCount === 0 ? 1 : rawCount, maxDaily, false),
        badgeLabelEn: formatQuotaBadgeEn(rawCount === 0 ? 1 : rawCount, maxDaily, false),
    };
}

/**
 * Charge l'enregistrement de quota invité depuis `localStorage` (`backgammon.dailyQuota`).
 * Réinitialise automatiquement le compteur si la tranche glissante de 24h est dépassée.
 */
export function loadGuestQuota(
    now: Date = new Date(),
    storage: QuotaStorageLike | null = getDefaultStorage(),
): LocalQuotaRecord {
    const freshRecord: LocalQuotaRecord = {
        dailyAnalysesCount: 0,
        lastAnalysisResetAt: now.toISOString(),
        consumedGameIds: [],
    };

    if (!storage) {
        return freshRecord;
    }

    try {
        const raw = storage.getItem(LOCAL_STORAGE_QUOTA_KEY);
        if (!raw) {
            return freshRecord;
        }
        const parsed = JSON.parse(raw) as Partial<LocalQuotaRecord> | null;
        if (!parsed || typeof parsed !== 'object') {
            storage.setItem(LOCAL_STORAGE_QUOTA_KEY, JSON.stringify(freshRecord));
            return freshRecord;
        }

        const lastReset =
            typeof parsed.lastAnalysisResetAt === 'string'
                ? parsed.lastAnalysisResetAt
                : now.toISOString();

        if (shouldResetQuotaWindow(lastReset, now)) {
            storage.setItem(LOCAL_STORAGE_QUOTA_KEY, JSON.stringify(freshRecord));
            return freshRecord;
        }

        const count =
            typeof parsed.dailyAnalysesCount === 'number' &&
            Number.isFinite(parsed.dailyAnalysesCount) &&
            parsed.dailyAnalysesCount >= 0
                ? Math.floor(parsed.dailyAnalysesCount)
                : 0;

        const consumedGameIds = Array.isArray(parsed.consumedGameIds)
            ? parsed.consumedGameIds.filter((id): id is string => typeof id === 'string')
            : [];

        return {
            dailyAnalysesCount: count,
            lastAnalysisResetAt: lastReset,
            consumedGameIds,
        };
    } catch {
        return freshRecord;
    }
}

/**
 * Sauvegarde l'enregistrement de quota invité dans `localStorage` (`backgammon.dailyQuota`).
 */
export function saveGuestQuota(
    record: LocalQuotaRecord,
    storage: QuotaStorageLike | null = getDefaultStorage(),
): void {
    if (!storage) return;
    try {
        storage.setItem(
            LOCAL_STORAGE_QUOTA_KEY,
            JSON.stringify({
                dailyAnalysesCount: Math.max(0, Math.floor(record.dailyAnalysesCount)),
                lastAnalysisResetAt: record.lastAnalysisResetAt,
                consumedGameIds: record.consumedGameIds ?? [],
            }),
        );
    } catch {
        // Quota localStorage plein ou mode navigation privée restreint
    }
}

/**
 * Réinitialise manuellement le quota invité dans `localStorage`.
 */
export function resetGuestQuota(
    now: Date = new Date(),
    storage: QuotaStorageLike | null = getDefaultStorage(),
): LocalQuotaRecord {
    const freshRecord: LocalQuotaRecord = {
        dailyAnalysesCount: 0,
        lastAnalysisResetAt: now.toISOString(),
        consumedGameIds: [],
    };
    saveGuestQuota(freshRecord, storage);
    return freshRecord;
}

/**
 * Consomme 1 crédit d'analyse pour un joueur invité dans `localStorage` (`backgammon.dailyQuota`).
 * Ne consomme pas de crédit supplémentaire si `gameId` a déjà été analysé dans la fenêtre de 24h.
 */
export function consumeGuestAnalysisQuota(params?: {
    gameId?: string;
    now?: Date;
    storage?: QuotaStorageLike | null;
}): ConsumeQuotaResult {
    const now = params?.now ?? new Date();
    const storage = params?.storage !== undefined ? params.storage : getDefaultStorage();
    const current = loadGuestQuota(now, storage);
    const existingIds = current.consumedGameIds ?? [];

    // Idempotence par gameId : ré-ouvrir la revue du même match ne décrémente pas une 2e fois
    if (params?.gameId && existingIds.includes(params.gameId)) {
        const state = computeQuotaState({
            tier: 'free',
            dailyAnalysesCount: current.dailyAnalysesCount,
            lastAnalysisResetAt: current.lastAnalysisResetAt,
            now,
        });
        return {
            allowed: true,
            state,
            alreadyConsumedForGame: true,
            source: 'local',
        };
    }

    if (current.dailyAnalysesCount >= FREE_DAILY_ANALYSES_LIMIT) {
        const blockedState = computeQuotaState({
            tier: 'free',
            dailyAnalysesCount: current.dailyAnalysesCount,
            lastAnalysisResetAt: current.lastAnalysisResetAt,
            now,
        });
        return {
            allowed: false,
            state: blockedState,
            alreadyConsumedForGame: false,
            source: 'local',
        };
    }

    const nextCount = current.dailyAnalysesCount + 1;
    const nextRecord: LocalQuotaRecord = {
        dailyAnalysesCount: nextCount,
        lastAnalysisResetAt: current.lastAnalysisResetAt,
        consumedGameIds: params?.gameId ? [...existingIds, params.gameId] : existingIds,
    };

    saveGuestQuota(nextRecord, storage);

    const nextState = computeQuotaState({
        tier: 'free',
        dailyAnalysesCount: nextCount,
        lastAnalysisResetAt: nextRecord.lastAnalysisResetAt,
        now,
    });

    notifyQuotaUpdated(nextState);

    return {
        allowed: true,
        state: nextState,
        alreadyConsumedForGame: false,
        source: 'local',
    };
}

/**
 * Récupère l'état du quota d'analyses pour un utilisateur connecté (Supabase) ou invité (`localStorage`).
 */
export async function getQuotaForUser(params?: {
    userId?: string | null;
    profile?: Partial<Profile> | null;
    now?: Date;
    storage?: QuotaStorageLike | null;
}): Promise<CoachQuotaState> {
    const now = params?.now ?? new Date();
    const storage = params?.storage !== undefined ? params.storage : getDefaultStorage();

    // 1. Si un profil explicite est fourni avec statut VIP, priorité immédiate
    if (
        params?.profile &&
        isVipTier(params.profile.subscription_tier, params.profile.subscription_status)
    ) {
        return computeQuotaState({
            tier: params.profile.subscription_tier,
            subscriptionStatus: params.profile.subscription_status,
            dailyAnalysesCount: params.profile.daily_analyses_count ?? 0,
            lastAnalysisResetAt: params.profile.last_analysis_reset_at ?? now.toISOString(),
            now,
        });
    }

    // 2. Utilisateur connecté avec Supabase configuré
    const userId = params?.userId ?? params?.profile?.id ?? null;
    if (userId && isSupabaseConfigured()) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(
                    'id, subscription_tier, subscription_status, daily_analyses_count, last_analysis_reset_at',
                )
                .eq('id', userId)
                .single();

            if (!error && data) {
                const row = data as Partial<Profile>;
                const windowExpired = shouldResetQuotaWindow(row.last_analysis_reset_at, now);

                if (windowExpired) {
                    const resetIso = now.toISOString();
                    await supabase
                        .from('profiles')
                        .update({
                            daily_analyses_count: 0,
                            last_analysis_reset_at: resetIso,
                            updated_at: resetIso,
                        })
                        .eq('id', userId);

                    return computeQuotaState({
                        tier: row.subscription_tier,
                        subscriptionStatus: row.subscription_status,
                        dailyAnalysesCount: 0,
                        lastAnalysisResetAt: resetIso,
                        now,
                    });
                }

                return computeQuotaState({
                    tier: row.subscription_tier,
                    subscriptionStatus: row.subscription_status,
                    dailyAnalysesCount: row.daily_analyses_count ?? 0,
                    lastAnalysisResetAt: row.last_analysis_reset_at ?? now.toISOString(),
                    now,
                });
            }
        } catch {
            // Repli gracieux sur le profil fourni ou localStorage
        }
    }

    // 3. Si un profil en mémoire a été passé (même en mode hors-ligne / test)
    if (params?.profile) {
        return computeQuotaState({
            tier: params.profile.subscription_tier,
            subscriptionStatus: params.profile.subscription_status,
            dailyAnalysesCount: params.profile.daily_analyses_count ?? 0,
            lastAnalysisResetAt: params.profile.last_analysis_reset_at ?? now.toISOString(),
            now,
        });
    }

    // 4. Joueur invité (offline / non connecté) : lecture depuis localStorage
    const guestRecord = loadGuestQuota(now, storage);
    return computeQuotaState({
        tier: 'free',
        dailyAnalysesCount: guestRecord.dailyAnalysesCount,
        lastAnalysisResetAt: guestRecord.lastAnalysisResetAt,
        now,
    });
}

/**
 * Vérifie et consomme atomiquement 1 analyse complète du quota journalier (Cloud Supabase ou LocalStorage invité).
 */
export async function consumeAnalysisQuota(params?: {
    userId?: string | null;
    profile?: Partial<Profile> | null;
    gameId?: string;
    now?: Date;
    storage?: QuotaStorageLike | null;
}): Promise<ConsumeQuotaResult> {
    const now = params?.now ?? new Date();
    const storage = params?.storage !== undefined ? params.storage : getDefaultStorage();

    // 1. Abonné VIP (mensuel ou annuel actif) : analyses illimitées
    if (
        params?.profile &&
        isVipTier(params.profile.subscription_tier, params.profile.subscription_status)
    ) {
        const vipState = computeQuotaState({
            tier: params.profile.subscription_tier,
            subscriptionStatus: params.profile.subscription_status,
            dailyAnalysesCount: (params.profile.daily_analyses_count ?? 0) + 1,
            lastAnalysisResetAt: params.profile.last_analysis_reset_at ?? now.toISOString(),
            now,
        });
        notifyQuotaUpdated(vipState);
        return {
            allowed: true,
            state: vipState,
            alreadyConsumedForGame: false,
            source: 'vip',
        };
    }

    const userId = params?.userId ?? params?.profile?.id ?? null;

    // 2. Utilisateur connecté & Supabase configuré : incrémentation atomique en base
    if (userId && isSupabaseConfigured()) {
        try {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
                'consume_daily_coach_analysis',
                {
                    p_user_id: userId,
                    p_max_daily: FREE_DAILY_ANALYSES_LIMIT,
                },
            );

            if (!rpcError && rpcData) {
                const state = computeQuotaState({
                    tier: rpcData.subscription_tier,
                    subscriptionStatus: rpcData.subscription_status,
                    dailyAnalysesCount: rpcData.daily_analyses_count,
                    lastAnalysisResetAt: rpcData.last_analysis_reset_at,
                    now,
                });
                notifyQuotaUpdated(state);
                return {
                    allowed: Boolean(rpcData.allowed),
                    state,
                    alreadyConsumedForGame: false,
                    source: state.isVip ? 'vip' : 'supabase',
                };
            }

            // Repli SELECT + UPDATE si la RPC n'est pas encore déployée
            const { data: profileRow, error: selectErr } = await supabase
                .from('profiles')
                .select(
                    'id, subscription_tier, subscription_status, daily_analyses_count, last_analysis_reset_at',
                )
                .eq('id', userId)
                .single();

            if (!selectErr && profileRow) {
                const row = profileRow as Partial<Profile>;
                const vip = isVipTier(row.subscription_tier, row.subscription_status);
                const expired = shouldResetQuotaWindow(row.last_analysis_reset_at, now);
                const baseCount = expired ? 0 : Math.max(0, row.daily_analyses_count ?? 0);
                const resetIso =
                    expired || !row.last_analysis_reset_at
                        ? now.toISOString()
                        : row.last_analysis_reset_at;

                if (!vip && baseCount >= FREE_DAILY_ANALYSES_LIMIT) {
                    if (expired) {
                        await supabase
                            .from('profiles')
                            .update({
                                daily_analyses_count: 0,
                                last_analysis_reset_at: resetIso,
                                updated_at: now.toISOString(),
                            })
                            .eq('id', userId);
                    }
                    const blockedState = computeQuotaState({
                        tier: row.subscription_tier,
                        subscriptionStatus: row.subscription_status,
                        dailyAnalysesCount: baseCount,
                        lastAnalysisResetAt: resetIso,
                        now,
                    });
                    return {
                        allowed: false,
                        state: blockedState,
                        alreadyConsumedForGame: false,
                        source: 'supabase',
                    };
                }

                const nextCount = baseCount + 1;
                await supabase
                    .from('profiles')
                    .update({
                        daily_analyses_count: nextCount,
                        last_analysis_reset_at: resetIso,
                        updated_at: now.toISOString(),
                    })
                    .eq('id', userId);

                const updatedState = computeQuotaState({
                    tier: row.subscription_tier,
                    subscriptionStatus: row.subscription_status,
                    dailyAnalysesCount: nextCount,
                    lastAnalysisResetAt: resetIso,
                    now,
                });
                notifyQuotaUpdated(updatedState);
                return {
                    allowed: true,
                    state: updatedState,
                    alreadyConsumedForGame: false,
                    source: vip ? 'vip' : 'supabase',
                };
            }
        } catch {
            // Repli gracieux ci-dessous
        }
    }

    // 3. Si un profil en mémoire a été passé (ex: tests unitaires ou mode déconnecté avec profil)
    if (params?.profile) {
        const expired = shouldResetQuotaWindow(params.profile.last_analysis_reset_at, now);
        const currentCount = expired ? 0 : Math.max(0, params.profile.daily_analyses_count ?? 0);
        const resetIso =
            expired || !params.profile.last_analysis_reset_at
                ? now.toISOString()
                : params.profile.last_analysis_reset_at;

        if (currentCount >= FREE_DAILY_ANALYSES_LIMIT) {
            const blockedState = computeQuotaState({
                tier: params.profile.subscription_tier,
                subscriptionStatus: params.profile.subscription_status,
                dailyAnalysesCount: currentCount,
                lastAnalysisResetAt: resetIso,
                now,
            });
            return {
                allowed: false,
                state: blockedState,
                alreadyConsumedForGame: false,
                source: 'supabase',
            };
        }

        const nextCount = currentCount + 1;
        const allowedState = computeQuotaState({
            tier: params.profile.subscription_tier,
            subscriptionStatus: params.profile.subscription_status,
            dailyAnalysesCount: nextCount,
            lastAnalysisResetAt: resetIso,
            now,
        });
        notifyQuotaUpdated(allowedState);
        return {
            allowed: true,
            state: allowedState,
            alreadyConsumedForGame: false,
            source: 'supabase',
        };
    }

    // 4. Joueur invité : consommation dans localStorage (`backgammon.dailyQuota`)
    return consumeGuestAnalysisQuota({
        gameId: params?.gameId,
        now,
        storage,
    });
}

/**
 * Construit le teaser dopaminergique Open Sage (modèle Chess.com) pour le Soft Paywall :
 * - Révèle gratuitement le PR obtenu ("Performance Rating : 4.85 — Niveau Maître")
 * - Valorise les Coups Brillants (!!) et les opportunités de videau détectées par Open Sage.
 */
export function buildOpenSageTeaser(
    analysis?: CompleteGameAnalysis | null,
    locale: string = 'fr',
): OpenSageTeaser {
    const isEn = locale === 'en';
    const pr = analysis?.performanceRating ?? 4.85;
    const rawCategory = analysis?.prCategory ?? (isEn ? 'Master' : 'Maître');
    const normalizedCategoryFr = rawCategory.toLowerCase().startsWith('niveau')
        ? rawCategory
        : `Niveau ${rawCategory}`;
    const normalizedCategoryEn = rawCategory.toLowerCase().startsWith('level')
        ? rawCategory
        : `${rawCategory} Level`;

    const optimalCount = analysis?.breakdown?.optimal ?? 0;
    const brilliantMovesCount = optimalCount > 0 ? Math.min(optimalCount, 5) : 2;

    const cubeErrors = (analysis?.evaluatedMoves ?? []).filter(
        (m) => m.cubeEquityLoss !== undefined && Math.abs(m.cubeEquityLoss) >= 0.02,
    ).length;
    const missedCubeOpportunitiesCount = cubeErrors > 0 ? cubeErrors : 1;

    const prDisplayFr = `Performance Rating : ${pr.toFixed(2)} — ${normalizedCategoryFr}`;
    const prDisplayEn = `Performance Rating: ${pr.toFixed(2)} — ${normalizedCategoryEn}`;

    const brilliantLabelFr =
        brilliantMovesCount > 1
            ? `${brilliantMovesCount} Coups Brillants (!!)`
            : `${brilliantMovesCount} Coup Brillant (!!)`;
    const cubeLabelFr =
        missedCubeOpportunitiesCount > 1
            ? `${missedCubeOpportunitiesCount} opportunités décisives de videau`
            : `${missedCubeOpportunitiesCount} opportunité décisive de videau`;

    const teaserTextFr = `Vous avez joué ${brilliantLabelFr} et manqué ${cubeLabelFr}. Passez au Coach Illimité pour comprendre pourquoi.`;
    const teaserTextEn = `You played ${brilliantMovesCount} Brilliant Move${brilliantMovesCount > 1 ? 's' : ''} (!!) and missed ${missedCubeOpportunitiesCount} decisive doubling cube opportunit${missedCubeOpportunitiesCount > 1 ? 'ies' : 'y'}. Upgrade to Unlimited Coach to understand why.`;

    return {
        prDisplayFr,
        prDisplayEn,
        brilliantMovesCount,
        missedCubeOpportunitiesCount,
        teaserTextFr,
        teaserTextEn,
        ctaLabelFr: "Débloquer l'Analyse avec le Coach Illimité (Essai 7 jours)",
        ctaLabelEn: 'Unlock Analysis with Unlimited Coach (7-Day Free Trial)',
    };
}
