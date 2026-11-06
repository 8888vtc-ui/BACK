/**
 * Moteur de Parcours Adaptatif « Zéro Sous-Menu » & Anti-Doublon (`adaptiveQuizEngine.ts`).
 * Unifié avec `src/lib/blunders/personalBlunderStore.ts` pour les Blunders Personnels.
 * Strictement <= 260 lignes, 0 any, 0 PR_ONLY.
 */

import type { PlayerBlunderRecord, DrillTier } from './types';
import { getTargetQuizTierFromPublicPr, readPublicAveragePr } from '../multiplayer/elo';
import {
    getActiveNPlus1State, isNonTrivialContact3PlyQuiz,
    recordNPlus1AttemptRegulation, selectDeterministicNPlus1Candidate,
} from './adaptiveNPlus1Selector';
import { getPersonalBlunders } from '../../lib/blunders/personalBlunderStore';
import type {
    AdaptiveQuizCategoryId,
    AdaptiveQuizCategoryMeta,
    CategorySkillState,
    AdaptivePlayerProfile,
    QuizPremiumAccessStatus,
} from './adaptiveQuizProfile';
import {
    ADAPTIVE_QUIZ_CATEGORIES,
    normalizeToQuizCategory,
    getAdaptivePlayerProfile,
    saveAdaptivePlayerProfile,
    todayKey,
    recomputeAggregates,
} from './adaptiveQuizProfile';

export type {
    AdaptiveQuizCategoryId,
    AdaptiveQuizCategoryMeta,
    CategorySkillState,
    AdaptivePlayerProfile,
    QuizPremiumAccessStatus,
};

export {
    ADAPTIVE_QUIZ_CATEGORIES,
    QUIZ_PREMIUM_CONFIG,
    ADAPTIVE_PROFILE_STORAGE_KEY,
    normalizeToQuizCategory,
    createInitialAdaptiveProfile,
    getAdaptivePlayerProfile,
    saveAdaptivePlayerProfile,
    resetAdaptivePlayerProfile,
    checkQuizPremiumAccess,
} from './adaptiveQuizProfile';

export interface AdaptiveAttemptUpdateResult {
    profile: AdaptivePlayerProfile;
    categoryState: CategorySkillState;
    leveledUp: boolean;
    leveledDown: boolean;
    categoryMeta: AdaptiveQuizCategoryMeta;
}

export function recordAdaptiveQuizOutcome(blunder: PlayerBlunderRecord, isCorrect: boolean): AdaptiveAttemptUpdateResult {
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
    if (isCorrect && consecutiveSuccesses >= 2 && level < 4) { level = (level + 1) as DrillTier; leveledUp = true; }
    else if (!isCorrect && level > 1) { level = (level - 1) as DrillTier; leveledDown = true; }

    const deltaMastery = isCorrect ? 14 + level * 2 : -12;
    const masteryScore = Math.max(5, Math.min(100, currentCat.masteryScore + deltaMastery));
    const nextCatState: CategorySkillState = {
        categoryId: catId, level, masteryScore, attempts, solved, consecutiveSuccesses: leveledUp ? 0 : consecutiveSuccesses,
    };

    const seenSet = new Set(profile.seenQuizIds);
    seenSet.add(blunder.id);
    const nextProfile = recomputeAggregates({
        ...profile, categories: { ...profile.categories, [catId]: nextCatState },
        seenQuizIds: Array.from(seenSet), dailyQuizzesPlayed: profile.dailyQuizzesPlayed + 1, lastPlayedDate: todayKey(),
    });

    saveAdaptivePlayerProfile(nextProfile);
    recordNPlus1AttemptRegulation(isCorrect, !isCorrect);
    return { profile: nextProfile, categoryState: nextCatState, leveledUp, leveledDown, categoryMeta };
}

export function selectNextAdaptiveQuiz(
    allBlunders: PlayerBlunderRecord[],
    excludeSessionIds: string[] = [],
): { quiz: PlayerBlunderRecord | null; targetCategory: AdaptiveQuizCategoryMeta; reasonLabel: string } {
    const profile = getAdaptivePlayerProfile();
    const seenSet = new Set([...profile.seenQuizIds, ...excludeSessionIds]);

    const isRealisticQuizPosition = (b: PlayerBlunderRecord): boolean => {
        if (b.id.startsWith('quiz_')) return false;
        if (!isNonTrivialContact3PlyQuiz(b)) return false;
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
        return xTotal <= 15 && oTotal <= 15 && maxStack < 8;
    };

    let unseenPool = allBlunders.filter((b) => !seenSet.has(b.id) && isRealisticQuizPosition(b));
    if (unseenPool.length === 0) unseenPool = allBlunders.filter((b) => !seenSet.has(b.id) && isNonTrivialContact3PlyQuiz(b));
    if (unseenPool.length === 0) unseenPool = allBlunders.filter((b) => !seenSet.has(b.id));
    if (unseenPool.length === 0) {
        const sessionSet = new Set(excludeSessionIds);
        unseenPool = allBlunders.filter((b) => !sessionSet.has(b.id) && isNonTrivialContact3PlyQuiz(b));
        if (unseenPool.length === 0) unseenPool = allBlunders.filter((b) => !sessionSet.has(b.id));
        if (unseenPool.length === 0 && allBlunders.length > 0) unseenPool = [...allBlunders];
    }
    if (unseenPool.length === 0) return { quiz: null, targetCategory: ADAPTIVE_QUIZ_CATEGORIES[0]!, reasonLabel: 'Banque vide' };

    const byCat = new Map<AdaptiveQuizCategoryId, PlayerBlunderRecord[]>();
    for (const item of unseenPool) {
        const catId = normalizeToQuizCategory(item.conceptId);
        const list = byCat.get(catId) ?? [];
        list.push(item);
        byCat.set(catId, list);
    }

    const availableCats = ADAPTIVE_QUIZ_CATEGORIES.filter((c) => (byCat.get(c.id)?.length ?? 0) > 0);
    const weightedCats = availableCats.map((meta) => {
        const st = profile.categories[meta.id];
        const uncalibratedBonus = st.attempts === 0 ? 1.45 : 1.0;
        const weaknessWeight = Math.pow(110 - st.masteryScore, 2) * uncalibratedBonus;
        return { meta, state: st, weight: weaknessWeight };
    });

    const totalWeight = weightedCats.reduce((acc, w) => acc + w.weight, 0);
    const seedVal = (profile.seenQuizIds.length * 9301 + 49297) % 233280;
    let pick = (seedVal / 233280) * totalWeight;
    let chosen = weightedCats[0]!;
    for (const item of weightedCats) {
        pick -= item.weight;
        if (pick <= 0) { chosen = item; break; }
    }

    const candidates = byCat.get(chosen.meta.id) ?? unseenPool;
    const publicPrTierFloor = getTargetQuizTierFromPublicPr(readPublicAveragePr());
    const targetLevel = Math.max(chosen.state.level, publicPrTierFloor) as DrillTier;
    const nPlus1 = getActiveNPlus1State();
    const selectedQuiz = selectDeterministicNPlus1Candidate(candidates, nPlus1.targetQuizEr, profile.seenQuizIds.length) ?? unseenPool[0]!;
    const reasonLabel = `Cible N+1 : ER ${nPlus1.targetQuizEr.toFixed(1)} · ${chosen.meta.shortLabel} (Niv. ${targetLevel})`;
    return { quiz: selectedQuiz, targetCategory: chosen.meta, reasonLabel };
}

export function classifyLivePositionCategory(board: readonly number[], turnIndex: number, isCube: boolean = false): AdaptiveQuizCategoryMeta {
    const findMeta = (id: AdaptiveQuizCategoryId) => ADAPTIVE_QUIZ_CATEGORIES.find((c) => c.id === id) ?? ADAPTIVE_QUIZ_CATEGORIES[0]!;
    if (isCube) return findMeta('cube_decision');
    if (turnIndex <= 4) return findMeta('opening');

    let furthestX = 0; let furthestO = 25; let xOutsideHome = 0; let xBackCheckers = 0;
    let xAnchorsInOppHome = 0; let xHomeClosedPoints = 0; let xConsecutivePoints = 0; let maxPrime = 0; let xBlots = 0;

    for (let pt = 1; pt <= 24; pt++) {
        const v = board[pt] ?? 0;
        if (v > 0) {
            if (pt > furthestX) furthestX = pt;
            if (pt > 6) xOutsideHome += v;
            if (pt >= 19) { xBackCheckers += v; if (v >= 2) xAnchorsInOppHome++; }
            if (pt <= 6 && v >= 2) xHomeClosedPoints++;
            if (v === 1) xBlots++;
        } else if (v < 0 && pt < furthestO) furthestO = pt;
        if (v >= 2) {
            xConsecutivePoints++;
            if (xConsecutivePoints > maxPrime) maxPrime = xConsecutivePoints;
        } else xConsecutivePoints = 0;
    }

    const xBar = board[25] ?? 0;
    const oBar = Math.abs(board[0] ?? 0);
    if (xOutsideHome === 0 && xBar === 0) return findMeta('bearoff_technique');
    if (xBar === 0 && oBar === 0 && furthestX < furthestO) return findMeta('race_management');
    if (xAnchorsInOppHome >= 2 && xBackCheckers >= 4) return findMeta('backgame');
    if (oBar >= 1 && xHomeClosedPoints >= 3) return findMeta('blitz_attack');
    if (maxPrime >= 4) return findMeta('prime_building');
    if (xAnchorsInOppHome === 1 && xBackCheckers >= 2) return findMeta('advanced_anchor');
    if (xBlots >= 2) return findMeta('blot_safety');
    return findMeta('prime_building');
}

export function recordLiveMatchDecisionOnAdaptiveProfile(params: {
    board: readonly number[]; turnIndex: number; equityLoss: number; isCube?: boolean;
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
    const consecutiveSuccesses = isGoodPlay ? currentCat.consecutiveSuccesses + 1 : isBlunder ? 0 : currentCat.consecutiveSuccesses;

    let level: DrillTier = currentCat.level;
    let leveledUp = false;
    let leveledDown = false;
    if (isGoodPlay && consecutiveSuccesses >= 3 && level < 4) { level = (level + 1) as DrillTier; leveledUp = true; }
    else if (isBlunder && level > 1 && currentCat.masteryScore < 40) { level = (level - 1) as DrillTier; leveledDown = true; }

    const deltaMastery = isGoodPlay ? 6 : isBlunder ? -10 : -2;
    const masteryScore = Math.max(5, Math.min(100, currentCat.masteryScore + deltaMastery));
    const nextCatState: CategorySkillState = { categoryId: catId, level, masteryScore, attempts, solved, consecutiveSuccesses: leveledUp ? 0 : consecutiveSuccesses };
    const nextProfile = recomputeAggregates({ ...profile, categories: { ...profile.categories, [catId]: nextCatState } });
    saveAdaptivePlayerProfile(nextProfile);
    return { profile: nextProfile, categoryState: nextCatState, leveledUp, leveledDown, categoryMeta };
}

export function isPersonalMatchBlunder(blunder: PlayerBlunderRecord): boolean {
    return blunder.id.startsWith('blunder_') || blunder.id.startsWith('user_blunder_') || Boolean(blunder.gameId);
}

export function selectNextPersonalBlunderQuiz(allBlunders: PlayerBlunderRecord[], excludeSessionIds: string[] = []): {
    quiz: PlayerBlunderRecord | null; personalCount: number; unmasteredPersonalCount: number; reasonLabel: string;
} {
    const storeRecords = getPersonalBlunders();
    const mappedFromStore: PlayerBlunderRecord[] = storeRecords.map((rec) => ({
        id: rec.id, board: [...rec.board], dice: [rec.dice[0], rec.dice[1]], player: rec.player,
        playedMove: rec.playerPlayedMove, optimalMove: rec.optimalMove,
        acceptableMoves: rec.candidatesTop4.filter((c) => Math.abs(c.lossEmg) <= 0.02).map((c) => c.notation),
        equityLoss: Math.abs(rec.deltaEmg), verdict: Math.abs(rec.deltaEmg) >= 0.15 ? 'howler' : 'blunder',
        tier: 3, conceptId: rec.conceptId, conceptName: rec.conceptNameFr,
        whyFailed: rec.mistakeExplanationFr, explanation: rec.solutionExplanationFr,
        hint: `Contre ${rec.opponentName} (Tour #${rec.turnNumber}) : cherchez la solution 3-ply.`,
        quizChoices: rec.candidatesTop4.map((c) => c.notation), createdAt: rec.createdAtIso,
        attempts: rec.status === 'RESOLVED' ? 1 : 0, successCount: rec.status === 'RESOLVED' ? 1 : 0,
        timesReviewed: rec.status === 'RESOLVED' ? 1 : 0, timesSolved: rec.status === 'RESOLVED' ? 1 : 0,
        lastReviewedAt: rec.resolvedAtIso, isMastered: rec.status === 'RESOLVED',
        gameId: `match_vs_${rec.opponentName}`,
        matchContext: {
            matchLength: rec.matchLength, scoreX: rec.scoreBeforeMove.player, scoreO: rec.scoreBeforeMove.opponent,
            cubeValue: rec.cubeValue, cubeOwner: rec.cubeOwner, crawford: rec.isCrawford,
        },
    }));

    const legacyPersonal = allBlunders.filter(isPersonalMatchBlunder);
    const personalList = mappedFromStore.length > 0 ? mappedFromStore : legacyPersonal;
    const unmasteredPersonal = personalList.filter((b) => !b.isMastered);
    const sessionSet = new Set(excludeSessionIds);
    const pool = unmasteredPersonal.length > 0 ? unmasteredPersonal : personalList;
    const filteredPool = pool.filter((b) => !sessionSet.has(b.id));
    const effectivePool = filteredPool.length > 0 ? filteredPool : pool;
    const selected = [...effectivePool].sort((a, b) => b.equityLoss - a.equityLoss)[0] ?? null;
    const reasonLabel = personalList.length > 0
        ? `Vos Blunders de Match (${unmasteredPersonal.length} à corriger sur ${personalList.length} détectés)`
        : 'Aucun blunder personnel enregistré en match';
    return { quiz: selected, personalCount: personalList.length, unmasteredPersonalCount: unmasteredPersonal.length, reasonLabel };
}
