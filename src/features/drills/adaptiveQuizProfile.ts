/**
 * Profil Adaptatif du Joueur & Stockage des Compétences (`adaptiveQuizProfile.ts`).
 * Strictement <= 200 lignes, 0 any.
 */

import type { DrillTier } from './types';

export type AdaptiveQuizCategoryId =
    | 'opening' | 'blot_safety' | 'prime_building' | 'blitz_attack' | 'advanced_anchor'
    | 'backgame' | 'race_management' | 'bearoff_technique' | 'cube_decision';

export interface AdaptiveQuizCategoryMeta {
    readonly id: AdaptiveQuizCategoryId;
    readonly shortLabel: string;
    readonly fullName: string;
    readonly icon: string;
}

export const ADAPTIVE_QUIZ_CATEGORIES: ReadonlyArray<AdaptiveQuizCategoryMeta> = [
    { id: 'opening', shortLabel: 'Ouverture', fullName: 'Ouvertures & Développement', icon: '' },
    { id: 'blot_safety', shortLabel: 'Sécurité', fullName: 'Sécurité des Blots & Duplication', icon: '' },
    { id: 'prime_building', shortLabel: 'Prime', fullName: 'Construction de Prime (Mur)', icon: '' },
    { id: 'blitz_attack', shortLabel: 'Blitz', fullName: 'Blitz & Attaque de Jan', icon: '' },
    { id: 'advanced_anchor', shortLabel: 'Ancre', fullName: 'Jeu de Retenue & Ancre Avancée', icon: '' },
    { id: 'backgame', shortLabel: 'Backgame', fullName: 'Backgame & Timing Défensif', icon: '' },
    { id: 'race_management', shortLabel: 'Course', fullName: 'Course & Compte de Pips (Keith)', icon: '' },
    { id: 'bearoff_technique', shortLabel: 'Sortie', fullName: 'Sortie des Dames (Bearoff)', icon: '' },
    { id: 'cube_decision', shortLabel: 'Videau', fullName: 'Maîtrise du Videau (Cube)', icon: '' },
];

export interface CategorySkillState {
    categoryId: AdaptiveQuizCategoryId;
    level: DrillTier;
    masteryScore: number;
    attempts: number;
    solved: number;
    consecutiveSuccesses: number;
}

export interface AdaptivePlayerProfile {
    categories: Record<AdaptiveQuizCategoryId, CategorySkillState>;
    seenQuizIds: string[];
    dailyQuizzesPlayed: number;
    lastPlayedDate: string;
    overallLevel: number;
    overallMastery: number;
}

export const QUIZ_PREMIUM_CONFIG = {
    launchPromoAllFree: true,
    freeDailyQuizLimit: 5,
    freeMaxTier: 2 as DrillTier,
    premiumLabel: 'Accès Premium Offert (Lancement — Quizz & Coach 3-Ply Illimités)',
} as const;

export interface QuizPremiumAccessStatus {
    canPlayQuiz: boolean;
    isLaunchPromoFree: boolean;
    remainingFreeToday: number | 'unlimited';
    badgeText: string;
}

export const ADAPTIVE_PROFILE_STORAGE_KEY = 'bg_adaptive_quiz_profile_v1';
let memoryAdaptiveProfile: AdaptivePlayerProfile | null = null;

export function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

export function normalizeToQuizCategory(conceptId: string): AdaptiveQuizCategoryId {
    const clean = (conceptId || '').toLowerCase().replace(/-/g, '_');
    if (clean.includes('open') || clean === 'golden_point') return 'opening';
    if (clean.includes('cube') || clean.includes('market') || clean.includes('take_point')) return 'cube_decision';
    if (clean.includes('bearoff') || clean.includes('sortie')) return 'bearoff_technique';
    if (clean.includes('backgame') || clean.includes('back_game') || clean.includes('escape')) return 'backgame';
    if (clean.includes('blitz') || clean.includes('tempo_hit')) return 'blitz_attack';
    if (clean.includes('anchor') || clean.includes('holding')) return 'advanced_anchor';
    if (clean.includes('prime') || clean.includes('bar_point')) return 'prime_building';
    if (clean.includes('race') || clean.includes('keith') || clean.includes('epc')) return 'race_management';
    return 'blot_safety';
}

export function createInitialAdaptiveProfile(): AdaptivePlayerProfile {
    const categories = {} as Record<AdaptiveQuizCategoryId, CategorySkillState>;
    for (const meta of ADAPTIVE_QUIZ_CATEGORIES) {
        categories[meta.id] = { categoryId: meta.id, level: 1, masteryScore: 25, attempts: 0, solved: 0, consecutiveSuccesses: 0 };
    }
    return { categories, seenQuizIds: [], dailyQuizzesPlayed: 0, lastPlayedDate: todayKey(), overallLevel: 1.0, overallMastery: 25 };
}

export function recomputeAggregates(profile: AdaptivePlayerProfile): AdaptivePlayerProfile {
    const list = Object.values(profile.categories);
    const totalLevel = list.reduce((acc, c) => acc + c.level, 0);
    const totalMastery = list.reduce((acc, c) => acc + c.masteryScore, 0);
    return {
        ...profile,
        overallLevel: Number((totalLevel / list.length).toFixed(1)),
        overallMastery: Math.round(totalMastery / list.length),
    };
}

export function getAdaptivePlayerProfile(): AdaptivePlayerProfile {
    if (typeof window === 'undefined' || !window.localStorage) {
        if (!memoryAdaptiveProfile) memoryAdaptiveProfile = createInitialAdaptiveProfile();
        return memoryAdaptiveProfile;
    }
    try {
        const raw = window.localStorage.getItem(ADAPTIVE_PROFILE_STORAGE_KEY);
        if (!raw) {
            const initial = createInitialAdaptiveProfile();
            window.localStorage.setItem(ADAPTIVE_PROFILE_STORAGE_KEY, JSON.stringify(initial));
            return initial;
        }
        const parsed = JSON.parse(raw) as Partial<AdaptivePlayerProfile>;
        const base = createInitialAdaptiveProfile();
        const mergedCategories = { ...base.categories };
        if (parsed.categories) {
            for (const meta of ADAPTIVE_QUIZ_CATEGORIES) {
                if (parsed.categories[meta.id]) {
                    mergedCategories[meta.id] = { ...mergedCategories[meta.id], ...parsed.categories[meta.id] };
                }
            }
        }
        const today = todayKey();
        const dailyQuizzesPlayed = parsed.lastPlayedDate === today ? (parsed.dailyQuizzesPlayed ?? 0) : 0;
        return recomputeAggregates({
            categories: mergedCategories,
            seenQuizIds: Array.isArray(parsed.seenQuizIds) ? parsed.seenQuizIds : [],
            dailyQuizzesPlayed, lastPlayedDate: today, overallLevel: 1.0, overallMastery: 25,
        });
    } catch { return createInitialAdaptiveProfile(); }
}

export function saveAdaptivePlayerProfile(profile: AdaptivePlayerProfile): void {
    const updated = recomputeAggregates(profile);
    memoryAdaptiveProfile = updated;
    if (typeof window === 'undefined' || !window.localStorage) return;
    try { window.localStorage.setItem(ADAPTIVE_PROFILE_STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
}

export function resetAdaptivePlayerProfile(): AdaptivePlayerProfile {
    const fresh = createInitialAdaptiveProfile();
    saveAdaptivePlayerProfile(fresh);
    return fresh;
}

export function checkQuizPremiumAccess(isUserPremium: boolean = false): QuizPremiumAccessStatus {
    if (QUIZ_PREMIUM_CONFIG.launchPromoAllFree || isUserPremium) {
        return {
            canPlayQuiz: true, isLaunchPromoFree: QUIZ_PREMIUM_CONFIG.launchPromoAllFree,
            remainingFreeToday: 'unlimited', badgeText: QUIZ_PREMIUM_CONFIG.premiumLabel,
        };
    }
    const profile = getAdaptivePlayerProfile();
    const remaining = Math.max(0, QUIZ_PREMIUM_CONFIG.freeDailyQuizLimit - profile.dailyQuizzesPlayed);
    return {
        canPlayQuiz: remaining > 0, isLaunchPromoFree: false, remainingFreeToday: remaining,
        badgeText: `Accès Gratuit : ${remaining}/${QUIZ_PREMIUM_CONFIG.freeDailyQuizLimit} Quizz aujourd'hui`,
    };
}

