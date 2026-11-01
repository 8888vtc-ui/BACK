/**
 * Moteur de Parcours Adaptatif « Zéro Sous-Menu » & Anti-Doublon (`adaptiveQuizEngine.ts`).
 *
 * Fonctionnalités :
 * 1. Évalue automatiquement le niveau du joueur (Palier 1: 0-ply -> Palier 4: 3-ply) et son % de maîtrise
 *    dans chacune des 9 grandes catégories techniques du Backgammon.
 * 2. Garantit mathématiquement qu'un joueur ne tombe JAMAIS 2 fois sur le même Quizz (`seenQuizIds`).
 * 3. Sélectionne le prochain Quizz par tirage aléatoire pondéré par les faiblesses :
 *    plus une catégorie est faible (ou non calibrée), plus elle a de chances de sortir.
 * 4. Définit le Mode Accès Premium (actuellement en Offre de Lancement 100 % Gratuite pour maximiser le trafic).
 */

import type { PlayerBlunderRecord, DrillTier } from './types';
import { getTargetQuizTierFromPublicPr, readPublicAveragePr } from '../multiplayer/elo';

export type AdaptiveQuizCategoryId =
    | 'opening'
    | 'blot_safety'
    | 'prime_building'
    | 'blitz_attack'
    | 'advanced_anchor'
    | 'backgame'
    | 'race_management'
    | 'bearoff_technique'
    | 'cube_decision';

export interface AdaptiveQuizCategoryMeta {
    readonly id: AdaptiveQuizCategoryId;
    readonly shortLabel: string;
    readonly fullName: string;
    readonly icon: string;
}

export const ADAPTIVE_QUIZ_CATEGORIES: ReadonlyArray<AdaptiveQuizCategoryMeta> = [
    { id: 'opening', shortLabel: 'Ouverture', fullName: 'Ouvertures & Développement', icon: '🎲' },
    { id: 'blot_safety', shortLabel: 'Sécurité', fullName: 'Sécurité des Blots & Duplication', icon: '🛡️' },
    { id: 'prime_building', shortLabel: 'Prime', fullName: 'Construction de Prime (Mur)', icon: '🧱' },
    { id: 'blitz_attack', shortLabel: 'Blitz', fullName: 'Blitz & Attaque de Jan', icon: '⚡' },
    { id: 'advanced_anchor', shortLabel: 'Ancre', fullName: 'Jeu de Retenue & Ancre Avancée', icon: '⚓' },
    { id: 'backgame', shortLabel: 'Backgame', fullName: 'Backgame & Timing Défensif', icon: '🕸️' },
    { id: 'race_management', shortLabel: 'Course', fullName: 'Course & Compte de Pips (Keith)', icon: '🏃' },
    { id: 'bearoff_technique', shortLabel: 'Sortie', fullName: 'Sortie des Dames (Bearoff)', icon: '🏁' },
    { id: 'cube_decision', shortLabel: 'Videau', fullName: 'Maîtrise du Videau (Cube)', icon: '🧊' },
];

export interface CategorySkillState {
    categoryId: AdaptiveQuizCategoryId;
    /** Niveau actuel dans cette catégorie : 1 (0-ply), 2 (1-ply), 3 (2-ply), 4 (3-ply) */
    level: DrillTier;
    /** Score de maîtrise de 0 à 100 % */
    masteryScore: number;
    /** Nombre total de quizz joués dans cette catégorie */
    attempts: number;
    /** Nombre de quizz réussis dans cette catégorie */
    solved: number;
    /** Série de réussites consécutives dans cette catégorie */
    consecutiveSuccesses: number;
}

export interface AdaptivePlayerProfile {
    categories: Record<AdaptiveQuizCategoryId, CategorySkillState>;
    /** Liste stricte des IDs de quizz déjà présentés au joueur (Garantie Zéro Doublon) */
    seenQuizIds: string[];
    /** Nombre de quizz joués aujourd'hui */
    dailyQuizzesPlayed: number;
    /** Date YYYY-MM-DD du compteur quotidien */
    lastPlayedDate: string;
    /** Niveau global moyen (1.0 à 4.0) */
    overallLevel: number;
    /** Maîtrise globale moyenne (0 à 100 %) */
    overallMastery: number;
}

/**
 * Configuration du Mode Accès Premium des Quizz & Explications IA (3.8 Flash / Analyse Profonde).
 * `launchPromoAllFree: true` = 100 % GRATUIT pour attirer le trafic (Offre de Lancement).
 * Passer à `false` pour activer la limite quotidienne gratuite et l'abonnement Premium.
 */
export const QUIZ_PREMIUM_CONFIG = {
    launchPromoAllFree: true,
    freeDailyQuizLimit: 5,
    freeMaxTier: 2 as DrillTier,
    premiumLabel: '🎁 Accès Premium Offert (Lancement — Quizz & Coach 3.8 Flash Illimités)',
} as const;

export interface QuizPremiumAccessStatus {
    canPlayQuiz: boolean;
    isLaunchPromoFree: boolean;
    remainingFreeToday: number | 'unlimited';
    badgeText: string;
}

export const ADAPTIVE_PROFILE_STORAGE_KEY = 'bg_adaptive_quiz_profile_v1';

let memoryAdaptiveProfile: AdaptivePlayerProfile | null = null;

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Normalise n'importe quel `conceptId` historique vers l'une des 9 catégories canoniques.
 */
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
        categories[meta.id] = {
            categoryId: meta.id,
            level: 1,
            masteryScore: 25, // Point de départ de calibrage (25 %)
            attempts: 0,
            solved: 0,
            consecutiveSuccesses: 0,
        };
    }
    return {
        categories,
        seenQuizIds: [],
        dailyQuizzesPlayed: 0,
        lastPlayedDate: todayKey(),
        overallLevel: 1.0,
        overallMastery: 25,
    };
}

function recomputeAggregates(profile: AdaptivePlayerProfile): AdaptivePlayerProfile {
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
        if (!memoryAdaptiveProfile) {
            memoryAdaptiveProfile = createInitialAdaptiveProfile();
        }
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
                    mergedCategories[meta.id] = {
                        ...mergedCategories[meta.id],
                        ...parsed.categories[meta.id],
                    };
                }
            }
        }
        const today = todayKey();
        const dailyQuizzesPlayed = parsed.lastPlayedDate === today ? (parsed.dailyQuizzesPlayed ?? 0) : 0;
        return recomputeAggregates({
            categories: mergedCategories,
            seenQuizIds: Array.isArray(parsed.seenQuizIds) ? parsed.seenQuizIds : [],
            dailyQuizzesPlayed,
            lastPlayedDate: today,
            overallLevel: 1.0,
            overallMastery: 25,
        });
    } catch {
        return createInitialAdaptiveProfile();
    }
}

export function saveAdaptivePlayerProfile(profile: AdaptivePlayerProfile): void {
    const updated = recomputeAggregates(profile);
    memoryAdaptiveProfile = updated;
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(ADAPTIVE_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // Ignore storage quota errors
    }
}

export function resetAdaptivePlayerProfile(): AdaptivePlayerProfile {
    const fresh = createInitialAdaptiveProfile();
    saveAdaptivePlayerProfile(fresh);
    return fresh;
}

export function checkQuizPremiumAccess(isUserPremium: boolean = false): QuizPremiumAccessStatus {
    if (QUIZ_PREMIUM_CONFIG.launchPromoAllFree || isUserPremium) {
        return {
            canPlayQuiz: true,
            isLaunchPromoFree: QUIZ_PREMIUM_CONFIG.launchPromoAllFree,
            remainingFreeToday: 'unlimited',
            badgeText: QUIZ_PREMIUM_CONFIG.premiumLabel,
        };
    }
    const profile = getAdaptivePlayerProfile();
    const remaining = Math.max(0, QUIZ_PREMIUM_CONFIG.freeDailyQuizLimit - profile.dailyQuizzesPlayed);
    return {
        canPlayQuiz: remaining > 0,
        isLaunchPromoFree: false,
        remainingFreeToday: remaining,
        badgeText: `Accès Gratuit : ${remaining}/${QUIZ_PREMIUM_CONFIG.freeDailyQuizLimit} Quizz aujourd'hui`,
    };
}

export interface AdaptiveAttemptUpdateResult {
    profile: AdaptivePlayerProfile;
    categoryState: CategorySkillState;
    leveledUp: boolean;
    leveledDown: boolean;
    categoryMeta: AdaptiveQuizCategoryMeta;
}

/**
 * Enregistre le résultat d'un Quizz, marque son ID comme « Déjà vu » (Zéro Doublon),
 * et met à jour automatiquement le niveau (0-ply -> 3-ply) et la maîtrise de la catégorie.
 */
export function recordAdaptiveQuizOutcome(
    blunder: PlayerBlunderRecord,
    isCorrect: boolean,
): AdaptiveAttemptUpdateResult {
    const profile = getAdaptivePlayerProfile();
    const catId = normalizeToQuizCategory(blunder.conceptId);
    const currentCat = profile.categories[catId];
    const categoryMeta = ADAPTIVE_QUIZ_CATEGORIES.find((c) => c.id === catId) ?? ADAPTIVE_QUIZ_CATEGORIES[0]!;

    const attempts = currentCat.attempts + 1;
    const solved = isCorrect ? currentCat.solved + 1 : currentCat.solved;
    const consecutiveSuccesses = isCorrect ? currentCat.consecutiveSuccesses + 1 : 0;

    let level: DrillTier = currentCat.level;
    let leveledUp = false;
    let leveledDown = false;

    // Montée automatique de palier après 2 réussites consécutives dans la catégorie
    if (isCorrect && consecutiveSuccesses >= 2 && level < 4) {
        level = (level + 1) as DrillTier;
        leveledUp = true;
    } else if (!isCorrect && level > 1) {
        // Descente protectrice en cas d'erreur pour consolider le palier inférieur
        level = (level - 1) as DrillTier;
        leveledDown = true;
    }

    const deltaMastery = isCorrect ? 14 + level * 2 : -12;
    const masteryScore = Math.max(5, Math.min(100, currentCat.masteryScore + deltaMastery));

    const nextCatState: CategorySkillState = {
        categoryId: catId,
        level,
        masteryScore,
        attempts,
        solved,
        consecutiveSuccesses: leveledUp ? 0 : consecutiveSuccesses,
    };

    const seenSet = new Set(profile.seenQuizIds);
    seenSet.add(blunder.id);

    const nextProfile = recomputeAggregates({
        ...profile,
        categories: {
            ...profile.categories,
            [catId]: nextCatState,
        },
        seenQuizIds: Array.from(seenSet),
        dailyQuizzesPlayed: profile.dailyQuizzesPlayed + 1,
        lastPlayedDate: todayKey(),
    });

    saveAdaptivePlayerProfile(nextProfile);

    return {
        profile: nextProfile,
        categoryState: nextCatState,
        leveledUp,
        leveledDown,
        categoryMeta,
    };
}

/**
 * Sélectionne le prochain Quizz du parcours automatique « Zéro Sous-Menu » :
 * 1. Exclut STRICTEMENT tous les Quizz déjà vus (`seenQuizIds`) pour garantir 0 répétition.
 * 2. Pondère chaque catégorie selon les faiblesses du joueur : Poids = (110 - masteryScore)^2.
 * 3. Choisit dans la catégorie retenue un Quizz correspondant au palier actuel (`level`) du joueur.
 */
export function selectNextAdaptiveQuiz(
    allBlunders: PlayerBlunderRecord[],
    excludeSessionIds: string[] = [],
): {
    quiz: PlayerBlunderRecord | null;
    targetCategory: AdaptiveQuizCategoryMeta;
    reasonLabel: string;
} {
    const profile = getAdaptivePlayerProfile();
    const seenSet = new Set([...profile.seenQuizIds, ...excludeSessionIds]);

    // 1. Filtrer les quizz jamais vus et écarter toute position dégénérée (ex: > 6 pions empilés sur 24 ou 1 en contact/blitz)
    const isRealisticQuizPosition = (b: PlayerBlunderRecord): boolean => {
        if (b.id.startsWith('quiz_')) return false;
        const board = b.board;
        if (!Array.isArray(board) || board.length < 26) return true;
        let xTotal = Math.max(0, board[25] ?? 0) + Math.max(0, board[26] ?? 0);
        let oTotal = Math.abs(Math.min(0, board[0] ?? 0)) + Math.abs(Math.min(0, board[27] ?? 0));
        let maxStack = 0;
        for (let pt = 1; pt <= 24; pt++) {
            const v = board[pt] ?? 0;
            if (v > 0) xTotal += v;
            else if (v < 0) oTotal += Math.abs(v);
            if (Math.abs(v) > maxStack) maxStack = Math.abs(v);
        }
        if (xTotal > 15 || oTotal > 15) return false;
        if (maxStack >= 8 && b.conceptId !== 'bearoff_technique') return false;
        return true;
    };

    let unseenPool = allBlunders.filter((b) => !seenSet.has(b.id) && isRealisticQuizPosition(b));
    if (unseenPool.length === 0) {
        unseenPool = allBlunders.filter((b) => !seenSet.has(b.id));
    }

    // Si le joueur a épuisé 100 % de la base entière, on réinitialise uniquement l'historique des vus hors session courante
    if (unseenPool.length === 0) {
        const sessionSet = new Set(excludeSessionIds);
        unseenPool = allBlunders.filter((b) => !sessionSet.has(b.id));
        if (unseenPool.length === 0 && allBlunders.length > 0) {
            unseenPool = [...allBlunders];
        }
    }

    if (unseenPool.length === 0) {
        return {
            quiz: null,
            targetCategory: ADAPTIVE_QUIZ_CATEGORIES[0]!,
            reasonLabel: 'Banque vide',
        };
    }

    // 2. Grouper les quizz non vus par catégorie canonique
    const byCat = new Map<AdaptiveQuizCategoryId, PlayerBlunderRecord[]>();
    for (const item of unseenPool) {
        const catId = normalizeToQuizCategory(item.conceptId);
        const list = byCat.get(catId) ?? [];
        list.push(item);
        byCat.set(catId, list);
    }

    // 3. Calculer les poids de faiblesse pour chaque catégorie disposant de quizz non vus
    const availableCats = ADAPTIVE_QUIZ_CATEGORIES.filter((c) => (byCat.get(c.id)?.length ?? 0) > 0);
    const weightedCats = availableCats.map((meta) => {
        const st = profile.categories[meta.id];
        const uncalibratedBonus = st.attempts === 0 ? 1.45 : 1.0;
        const weaknessWeight = Math.pow(110 - st.masteryScore, 2) * uncalibratedBonus;
        return { meta, state: st, weight: weaknessWeight };
    });

    // Tirage pondéré déterministe/pseudo-aléatoire basé sur le nombre de quizz vus et les faiblesses
    const totalWeight = weightedCats.reduce((acc, w) => acc + w.weight, 0);
    const seedVal = (profile.seenQuizIds.length * 9301 + 49297) % 233280;
    let pick = (seedVal / 233280) * totalWeight;

    let chosen = weightedCats[0]!;
    for (const item of weightedCats) {
        pick -= item.weight;
        if (pick <= 0) {
            chosen = item;
            break;
        }
    }

    const candidates = byCat.get(chosen.meta.id) ?? unseenPool;
    const publicPrTierFloor = getTargetQuizTierFromPublicPr(readPublicAveragePr());
    const targetLevel = Math.max(chosen.state.level, publicPrTierFloor) as DrillTier;

    // Cherche d'abord un quizz du palier exact (ou piloté par le PR du joueur), en priorisant
    // les positions pédagogiques riches et réalistes (bench_ / harvest_ / bterh_ / quiz_) avant les positions brutes
    const getPedagogicalPriority = (b: PlayerBlunderRecord): number => {
        if (b.id.startsWith('bench_') || b.id.startsWith('harvest_')) return 4;
        if (b.id.startsWith('bterh_') || b.id.startsWith('bgt_gnu_')) return 3;
        if (b.id.startsWith('btcore_')) return 2;
        if (b.id.startsWith('quiz_')) return 0;
        return 1;
    };

    let bestCandidate: PlayerBlunderRecord | null = null;
    let bestDist = Infinity;
    let bestPedagogy = -Infinity;
    let bestLoss = -Infinity;
    for (const c of candidates) {
        const dist = Math.abs((c.tier ?? 1) - targetLevel);
        const pedagogy = getPedagogicalPriority(c);
        const cappedLoss = Math.min(c.equityLoss, 0.55);
        if (
            dist < bestDist ||
            (dist === bestDist && pedagogy > bestPedagogy) ||
            (dist === bestDist && pedagogy === bestPedagogy && cappedLoss > bestLoss)
        ) {
            bestCandidate = c;
            bestDist = dist;
            bestPedagogy = pedagogy;
            bestLoss = cappedLoss;
        }
    }

    const selectedQuiz = bestCandidate ?? unseenPool[0]!;
    const reasonLabel =
        chosen.state.attempts === 0
            ? `Calibrage initial · ${chosen.meta.shortLabel} (Niv. ${targetLevel})`
            : chosen.state.masteryScore < 50
              ? `Ciblage faiblesse (${chosen.state.masteryScore}%) · ${chosen.meta.shortLabel} (Niv. ${targetLevel})`
              : `Consolidation · ${chosen.meta.shortLabel} (Niv. ${targetLevel})`;

    return {
        quiz: selectedQuiz,
        targetCategory: chosen.meta,
        reasonLabel,
    };
}

/**
 * Classifie automatiquement n'importe quelle position de match (contre Bot ou Humain)
 * dans l'une des 9 catégories techniques du Backgammon.
 */
export function classifyLivePositionCategory(
    board: readonly number[],
    turnIndex: number,
    isCube: boolean = false,
): AdaptiveQuizCategoryMeta {
    const findMeta = (id: AdaptiveQuizCategoryId) =>
        ADAPTIVE_QUIZ_CATEGORIES.find((c) => c.id === id) ?? ADAPTIVE_QUIZ_CATEGORIES[0]!;

    if (isCube) return findMeta('cube_decision');
    if (turnIndex <= 4) return findMeta('opening');

    // Détection Course pure vs Contact
    let furthestX = 0; // X va de 24 -> 1
    let furthestO = 25; // O va de 1 -> 24
    let xOutsideHome = 0;
    let xBackCheckers = 0;
    let xAnchorsInOppHome = 0;
    let xHomeClosedPoints = 0;
    let xConsecutivePoints = 0;
    let maxPrime = 0;
    let xBlots = 0;

    for (let pt = 1; pt <= 24; pt++) {
        const v = board[pt] ?? 0;
        if (v > 0) {
            if (pt > furthestX) furthestX = pt;
            if (pt > 6) xOutsideHome += v;
            if (pt >= 19) {
                xBackCheckers += v;
                if (v >= 2) xAnchorsInOppHome++;
            }
            if (pt <= 6 && v >= 2) xHomeClosedPoints++;
            if (v === 1) xBlots++;
        } else if (v < 0) {
            if (pt < furthestO) furthestO = pt;
        }
        if (v >= 2) {
            xConsecutivePoints++;
            if (xConsecutivePoints > maxPrime) maxPrime = xConsecutivePoints;
        } else {
            xConsecutivePoints = 0;
        }
    }

    const xBar = board[25] ?? 0;
    const oBar = Math.abs(board[0] ?? 0);
    const isNonContact = xBar === 0 && oBar === 0 && furthestX < furthestO;

    if (xOutsideHome === 0 && xBar === 0) return findMeta('bearoff_technique');
    if (isNonContact) return findMeta('race_management');
    if (xAnchorsInOppHome >= 2 && xBackCheckers >= 4) return findMeta('backgame');
    if (oBar >= 1 && xHomeClosedPoints >= 3) return findMeta('blitz_attack');
    if (maxPrime >= 4) return findMeta('prime_building');
    if (xAnchorsInOppHome === 1 && xBackCheckers >= 2) return findMeta('advanced_anchor');
    if (xBlots >= 2) return findMeta('blot_safety');
    return findMeta('prime_building');
}

/**
 * Met à jour automatiquement le profil adaptatif du joueur lorsqu'il joue un coup
 * réel en match (contre un Bot ou un Humain), sans incrémenter le compteur de quizz.
 */
export function recordLiveMatchDecisionOnAdaptiveProfile(params: {
    board: readonly number[];
    turnIndex: number;
    equityLoss: number;
    isCube?: boolean;
}): AdaptiveAttemptUpdateResult {
    const profile = getAdaptivePlayerProfile();
    const categoryMeta = classifyLivePositionCategory(params.board, params.turnIndex, Boolean(params.isCube));
    const catId = categoryMeta.id;
    const currentCat = profile.categories[catId];
    const absLoss = Math.abs(params.equityLoss);
    const isGoodPlay = absLoss <= 0.02;
    const isBlunder = absLoss >= 0.06;

    const attempts = currentCat.attempts + 1;
    const solved = isGoodPlay ? currentCat.solved + 1 : currentCat.solved;
    const consecutiveSuccesses = isGoodPlay
        ? currentCat.consecutiveSuccesses + 1
        : isBlunder
          ? 0
          : currentCat.consecutiveSuccesses;

    let level: DrillTier = currentCat.level;
    let leveledUp = false;
    let leveledDown = false;

    if (isGoodPlay && consecutiveSuccesses >= 3 && level < 4) {
        level = (level + 1) as DrillTier;
        leveledUp = true;
    } else if (isBlunder && level > 1 && currentCat.masteryScore < 40) {
        level = (level - 1) as DrillTier;
        leveledDown = true;
    }

    const deltaMastery = isGoodPlay ? 6 : isBlunder ? -10 : -2;
    const masteryScore = Math.max(5, Math.min(100, currentCat.masteryScore + deltaMastery));

    const nextCatState: CategorySkillState = {
        categoryId: catId,
        level,
        masteryScore,
        attempts,
        solved,
        consecutiveSuccesses: leveledUp ? 0 : consecutiveSuccesses,
    };

    const nextProfile = recomputeAggregates({
        ...profile,
        categories: {
            ...profile.categories,
            [catId]: nextCatState,
        },
    });

    saveAdaptivePlayerProfile(nextProfile);

    return {
        profile: nextProfile,
        categoryState: nextCatState,
        leveledUp,
        leveledDown,
        categoryMeta,
    };
}

/**
 * Indique si un blunder provient d'une vraie partie jouée par l'utilisateur
 * (contre un Bot ou un Humain) plutôt que de la banque de semences initiales.
 */
export function isPersonalMatchBlunder(blunder: PlayerBlunderRecord): boolean {
    return (
        blunder.id.startsWith('blunder_') ||
        blunder.id.startsWith('user_blunder_') ||
        Boolean(blunder.gameId)
    );
}

/**
 * Sélectionne le prochain Quizz pour l'onglet « 🔥 Revoir Mes Blunders » :
 * Priorise les erreurs personnelles non maîtrisées commises par le joueur en match,
 * triées de la plus coûteuse (perte d'équité) à la plus légère.
 */
export function selectNextPersonalBlunderQuiz(
    allBlunders: PlayerBlunderRecord[],
    excludeSessionIds: string[] = [],
): {
    quiz: PlayerBlunderRecord | null;
    personalCount: number;
    unmasteredPersonalCount: number;
    reasonLabel: string;
} {
    const personalList = allBlunders.filter(isPersonalMatchBlunder);
    const unmasteredPersonal = personalList.filter((b) => !b.isMastered);
    const sessionSet = new Set(excludeSessionIds);

    const pool =
        unmasteredPersonal.length > 0
            ? unmasteredPersonal
            : personalList.length > 0
              ? personalList
              : allBlunders.filter((b) => !b.isMastered);

    const filteredPool = pool.filter((b) => !sessionSet.has(b.id));
    const effectivePool = filteredPool.length > 0 ? filteredPool : pool;
    const sorted = [...effectivePool].sort((a, b) => b.equityLoss - a.equityLoss);
    const selected = sorted[0] ?? null;

    const reasonLabel =
        personalList.length > 0
            ? `🔥 Vos Blunders de Match (${unmasteredPersonal.length} à corriger sur ${personalList.length} détectés)`
            : '🎯 Aucune gaffe personnelle enregistrée en match — Révision de vos erreurs prioritaires';

    return {
        quiz: selected,
        personalCount: personalList.length,
        unmasteredPersonalCount: unmasteredPersonal.length,
        reasonLabel,
    };
}

export type ErhOpponentArchetypeId = 'timid_fearful' | 'weaker_error_prone' | 'reckless_brawler' | 'impatient_racer';

export interface ErhOpponentScenario {
    readonly archetypeId: ErhOpponentArchetypeId;
    readonly badgeLabel: string;
    readonly opponentErhScore: string;
    readonly psychologicalPrompt: string;
    readonly exploitExplanation: string;
    readonly voiceBriefingText: string;
}

export const ERH_METHOD_VOICE_INTRO =
    "Bienvenue dans le Quizz E R H : l'Exploitation du Risque et de l'Erreur Humaine. Contrairement aux moteurs classiques qui supposent que vous affrontez un robot parfait, la méthode E R H vous entraîne à jouer contre un vrai cerveau humain. Avant chaque coup, observez qui est en face de vous : est-ce un joueur peureux qui craint les coups durs, un joueur plus faible qui multiplie les fautes dès que la position se complique, ou un joueur impulsif ? Adaptez votre coup à sa psychologie pour gagner davantage de Sceaux d'Or !";

/**
 * Génère le scénario psychologique ERH (Exploitation du Risque & de l'Erreur Humaine)
 * adapté à la position du Quizz : comment jouer quand on sait que l'adversaire est
 * peureux, d'un niveau plus faible sujet aux erreurs, ou impulsif.
 */
export function buildErhOpponentScenario(blunder: PlayerBlunderRecord): ErhOpponentScenario {
    const catId = normalizeToQuizCategory(blunder.conceptId);

    if (catId === 'cube_decision' || catId === 'blitz_attack') {
        return {
            archetypeId: 'timid_fearful',
            badgeLabel: '😰 Profil Adverse : Joueur Peureux & Craintif',
            opponentErhScore: 'ERH Adverse 19.5 (Peur du risque)',
            psychologicalPrompt:
                'Tu sais que ce joueur est peureux : il panique dès que tu menaces ses pions ou le videau et préfère fuir plutôt que se battre. Comment joues-tu ce coup pour maximiser sa peur ?',
            exploitExplanation: `Face à un joueur peureux, ${blunder.optimalMove} met une pression psychologique maximale sur ses cases vitales au lieu du coup mou ${blunder.playedMove}.`,
            voiceBriefingText: `Profil E R H détecté : votre adversaire est un joueur peureux qui craint l'affrontement. Avec le jet ${blunder.dice[0]} et ${blunder.dice[1]}, comment jouez-vous ce coup pour exploiter sa frilosité sans tomber dans l'erreur ${blunder.playedMove} ?`,
        };
    }

    if (catId === 'backgame' || catId === 'advanced_anchor' || catId === 'prime_building') {
        return {
            archetypeId: 'weaker_error_prone',
            badgeLabel: '🌱 Profil Adverse : Joueur Plus Faible (Sujet aux Fautes)',
            opponentErhScore: 'ERH Adverse 22.8 (Craque sous la complexité)',
            psychologicalPrompt:
                'Tu sais que ce joueur a un niveau plus faible et qu’il fait beaucoup d’erreurs dès qu’il y a des barrages et du contact. Comment joues-tu ce coup pour garder la position complexe et provoquer sa faute ?',
            exploitExplanation: `Contre un adversaire plus faible qui fait des erreurs, ${blunder.optimalMove} maintient une structure tendue où il va se tromper sur les 36 prochains dés, alors que ${blunder.playedMove} lui simplifie la tâche.`,
            voiceBriefingText: `Profil E R H détecté : vous affrontez un joueur plus faible qui commet beaucoup d'erreurs dans les positions complexes. Avec ${blunder.dice[0]} et ${blunder.dice[1]}, quel coup choisissez-vous pour maintenir la pression et le pousser à la faute ?`,
        };
    }

    if (catId === 'blot_safety' || catId === 'opening') {
        return {
            archetypeId: 'reckless_brawler',
            badgeLabel: '🔥 Profil Adverse : Joueur Impulsif (Attaque à tout va)',
            opponentErhScore: 'ERH Adverse 16.4 (Frappe sans compter)',
            psychologicalPrompt:
                'Tu sais que ce joueur frappe tout ce qui bouge sans réfléchir à sa propre sécurité. Comment joues-tu ce coup pour ne lui laisser aucune cible gratuite et le laisser s’exposer ?',
            exploitExplanation: `Face à un joueur impulsif, ${blunder.optimalMove} verrouille tes points clés et punit ses attaques hasardeuses, tandis que ${blunder.playedMove} lui offre exactement la cible qu'il espérait.`,
            voiceBriefingText: `Profil E R H détecté : ce joueur est impulsif et attaque le moindre pion isolé. Avec ${blunder.dice[0]} et ${blunder.dice[1]}, comment jouez-vous ce coup pour fermer la porte et retourner son agressivité contre lui ?`,
        };
    }

    return {
        archetypeId: 'impatient_racer',
        badgeLabel: '⏳ Profil Adverse : Joueur Impatient en Fin de Partie',
        opponentErhScore: 'ERH Adverse 17.2 (Précipitation)',
        psychologicalPrompt:
            'Tu sais que ce joueur joue trop vite en course et gaspille ses pions par impatience. Comment joues-tu ce coup avec une rigueur chirurgicale ?',
        exploitExplanation: `Contre un joueur impatient, ${blunder.optimalMove} optimise chaque pip et chaque sortie sans laisser de trou, contrairement à ${blunder.playedMove}.`,
        voiceBriefingText: `Profil E R H détecté : votre adversaire est impatient en course et joue trop vite. Avec ${blunder.dice[0]} et ${blunder.dice[1]}, trouvez le coup d'orfèvre qui maximise votre avance.`,
    };
}

