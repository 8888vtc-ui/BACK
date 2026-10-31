/**
 * Banque Locale de Blunders (Blunder Bank).
 *
 * Enregistre, persiste et ordonne les erreurs commises par le joueur lors de ses
 * parties pour les rejouer automatiquement sous forme de drills tactiques ciblés.
 */

import type { PlayerBlunderRecord, BlunderBankStats, DrillTier } from './types';
import { BENCHMARK_BLUNDERS } from './benchmarkBlunders';

export const BLUNDER_BANK_STORAGE_KEY = 'bg_blunder_bank';

let memoryBankStore: PlayerBlunderRecord[] | null = null;

/**
 * Crée une copie propre et indépendante des blunders de référence par défaut.
 */
export function createDefaultBenchmarkBlunders(): PlayerBlunderRecord[] {
    return BENCHMARK_BLUNDERS.map((b) => ({
        ...b,
        board: [...b.board],
        dice: [b.dice[0], b.dice[1]] as [number, number],
        acceptableMoves: b.acceptableMoves ? [...b.acceptableMoves] : [],
        commentaryVariants: b.commentaryVariants ? [...b.commentaryVariants] : undefined,
        quizChoices: b.quizChoices ? [...b.quizChoices] : undefined,
    }));
}

/**
 * Charge l'ensemble des erreurs de la banque depuis le stockage local (ou mémoire).
 * Si le stockage est vide, initialise automatiquement avec les blunders de référence.
 */
export function getAllBlunders(): PlayerBlunderRecord[] {
    if (typeof window === 'undefined' || !window.localStorage) {
        if (!memoryBankStore) {
            memoryBankStore = createDefaultBenchmarkBlunders();
        }
        return memoryBankStore;
    }

    try {
        const raw = window.localStorage.getItem(BLUNDER_BANK_STORAGE_KEY);
        if (!raw) {
            const defaults = createDefaultBenchmarkBlunders();
            window.localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Fusionne automatiquement les nouveaux Quizz par Paliers de BENCHMARK_BLUNDERS
            // si l'utilisateur avait une ancienne banque locale
            const defaults = createDefaultBenchmarkBlunders();
            const byId = new Map<string, PlayerBlunderRecord>();
            for (const item of parsed as PlayerBlunderRecord[]) {
                const benchMatch = defaults.find((d) => d.id === item.id);
                byId.set(item.id, benchMatch ? { ...benchMatch, ...item, tier: item.tier ?? benchMatch.tier, whyFailed: item.whyFailed ?? benchMatch.whyFailed, proverb: item.proverb ?? benchMatch.proverb, commentaryVariants: item.commentaryVariants ?? benchMatch.commentaryVariants, quizChoices: item.quizChoices ?? benchMatch.quizChoices } : item);
            }
            let added = false;
            for (const def of defaults) {
                if (!byId.has(def.id)) {
                    byId.set(def.id, def);
                    added = true;
                }
            }
            const merged = Array.from(byId.values());
            if (added) {
                window.localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(merged));
            }
            return merged;
        }

        const defaults = createDefaultBenchmarkBlunders();
        window.localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    } catch {
        return createDefaultBenchmarkBlunders();
    }
}

/**
 * Sauvegarde la liste complète des blunders dans le stockage local (et mémoire).
 */
export function saveAllBlunders(blunders: PlayerBlunderRecord[]): void {
    memoryBankStore = blunders;
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(blunders));
    } catch (e) {
        console.warn('[BlunderBank] Échec de sauvegarde locale :', e);
    }
}

/**
 * Génère une signature unique pour détecter les doublons de positions identiques.
 */
function getPositionSignature(board: number[], dice: [number, number], player: string): string {
    const sortedDice = [...dice].sort((a, b) => a - b).join('-');
    return `${player}_${board.join(',')}_${sortedDice}`;
}

/**
 * Enregistre un blunder commis par le joueur dans la banque.
 * Si la même position avec les mêmes dés a déjà été enregistrée, met à jour la perte d'équité.
 */
export function recordBlunder(
    data: Omit<PlayerBlunderRecord, 'id' | 'createdAt' | 'timesReviewed' | 'timesSolved' | 'isMastered'> &
        Partial<Pick<PlayerBlunderRecord, 'id' | 'createdAt' | 'timesReviewed' | 'timesSolved' | 'isMastered'>>,
): PlayerBlunderRecord {
    const blunders = getAllBlunders();
    const signature = getPositionSignature(data.board, data.dice, data.player);

    const existingIndex = blunders.findIndex(
        (b) => getPositionSignature(b.board, b.dice, b.player) === signature,
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
        const existing = blunders[existingIndex];
        const updated: PlayerBlunderRecord = {
            ...existing,
            ...data,
            playedMove: data.playedMove,
            equityLoss: Math.max(existing.equityLoss, data.equityLoss),
            createdAt: now,
            isMastered: false, // Réinitialise la maîtrise si l'erreur est commise à nouveau
        };
        blunders[existingIndex] = updated;
        saveAllBlunders(blunders);
        return updated;
    }

    const newRecord: PlayerBlunderRecord = {
        id: data.id || `blunder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: data.createdAt || now,
        board: [...data.board],
        dice: [data.dice[0], data.dice[1]],
        player: data.player,
        playedMove: data.playedMove,
        optimalMove: data.optimalMove,
        acceptableMoves: data.acceptableMoves ? [...data.acceptableMoves] : [],
        equityLoss: data.equityLoss,
        verdict: data.verdict,
        conceptId: data.conceptId,
        conceptName: data.conceptName,
        explanation: data.explanation,
        whyFailed: data.whyFailed,
        proverb: data.proverb,
        commentaryVariants: data.commentaryVariants ? [...data.commentaryVariants] : undefined,
        quizChoices: data.quizChoices ? [...data.quizChoices] : undefined,
        hint: data.hint,
        tier: data.tier,
        timesReviewed: data.timesReviewed || 0,
        timesSolved: data.timesSolved || 0,
        isMastered: data.isMastered ?? false,
        gameId: data.gameId,
        matchContext: data.matchContext,
    };

    blunders.unshift(newRecord);
    saveAllBlunders(blunders);
    return newRecord;
}

/**
 * Récupère une erreur par son identifiant unique.
 */
export function getBlunderById(id: string): PlayerBlunderRecord | null {
    const blunders = getAllBlunders();
    return blunders.find((b) => b.id === id) || null;
}

/**
 * Récupère la liste des erreurs à réviser en priorité.
 *
 * Filtre :
 * - Si `conceptId` est spécifié, limite aux erreurs de ce concept
 * - Priorise les erreurs non maîtrisées (`isMastered === false`)
 * - Trie par perte d'équité décroissante (les plus grosses erreurs en premier)
 * - Si toutes les erreurs sont maîtrisées, retourne la liste complète pour révision
 */
export function getBlundersToReview(conceptId?: string, tier?: DrillTier): PlayerBlunderRecord[] {
    const all = getAllBlunders();
    let filtered = conceptId && conceptId !== 'all' ? all.filter((b) => b.conceptId === conceptId) : all;
    if (tier) {
        filtered = filtered.filter((b) => (b.tier ?? 1) === tier);
    }

    const unmastered = filtered.filter((b) => !b.isMastered);

    if (unmastered.length > 0) {
        return unmastered.sort((a, b) => b.equityLoss - a.equityLoss);
    }

    // Si tout est maîtrisé, retourne la liste complète pour réentraînement
    return [...filtered].sort((a, b) => b.equityLoss - a.equityLoss);
}

/**
 * Enregistre le résultat d'une tentative sur une erreur en drill.
 */
export function markBlunderAttempt(id: string, isCorrect: boolean): PlayerBlunderRecord | null {
    const blunders = getAllBlunders();
    const index = blunders.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const target = blunders[index];
    const timesReviewed = (target.timesReviewed || 0) + 1;
    const timesSolved = isCorrect ? (target.timesSolved || 0) + 1 : (target.timesSolved || 0);
    const isMastered = isCorrect || target.isMastered;

    const updated: PlayerBlunderRecord = {
        ...target,
        timesReviewed,
        timesSolved,
        isMastered,
        lastAttemptDate: new Date().toISOString(),
    };

    blunders[index] = updated;
    saveAllBlunders(blunders);
    return updated;
}

/**
 * Réinitialise la maîtrise d'une erreur pour permettre de la rejouer.
 */
export function resetBlunderMastery(id: string): void {
    const blunders = getAllBlunders();
    const index = blunders.findIndex((b) => b.id === id);
    if (index !== -1) {
        blunders[index].isMastered = false;
        saveAllBlunders(blunders);
    }
}

/**
 * Réinitialise la maîtrise de l'ensemble des erreurs de la banque.
 */
export function resetAllBlunderMastery(): void {
    const blunders = getAllBlunders().map((b) => ({
        ...b,
        isMastered: false,
    }));
    saveAllBlunders(blunders);
}

/**
 * Calcule les métriques globales de la banque d'erreurs.
 */
export function getBlunderBankStats(): BlunderBankStats {
    const blunders = getAllBlunders();
    const totalBlunders = blunders.length;
    const masteredCount = blunders.filter((b) => b.isMastered).length;
    const remainingToReview = totalBlunders - masteredCount;
    const masteryRate = totalBlunders > 0 ? Math.round((masteredCount / totalBlunders) * 100) : 0;

    let totalAttempts = 0;
    let totalSolved = 0;
    for (const b of blunders) {
        totalAttempts += b.timesReviewed || 0;
        totalSolved += b.timesSolved || 0;
    }

    const accuracyRate =
        totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

    return {
        totalBlunders,
        masteredCount,
        remainingToReview,
        masteryRate,
        accuracyRate,
        totalAttempts,
    };
}

/**
 * Vide la banque et réinitialise les blunders de référence (utile pour réinitialisation et tests).
 */
export function clearBlunderBank(): void {
    const defaults = createDefaultBenchmarkBlunders();
    memoryBankStore = defaults;
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(BLUNDER_BANK_STORAGE_KEY, JSON.stringify(defaults));
    }
}
