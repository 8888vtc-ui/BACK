/**
 * Gestionnaire de Persistance & Séries (Streaks) pour les Puzzles Quotidiens.
 */

import type { DailyPuzzleStats } from './types';

const PUZZLE_STATS_KEY = 'bg_daily_puzzle_stats';

export function getTodayDateString(d: Date = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function createDefaultStats(): DailyPuzzleStats {
    return {
        currentStreak: 0,
        maxStreak: 0,
        lastCompletedDate: null,
        solvedPuzzleIds: [],
        totalSolved: 0,
        totalAttempted: 0,
    };
}

/**
 * Charge les statistiques actuelles du joueur.
 */
export function getPuzzleStats(): DailyPuzzleStats {
    if (typeof window === 'undefined' || !window.localStorage) {
        return createDefaultStats();
    }

    try {
        const raw = window.localStorage.getItem(PUZZLE_STATS_KEY);
        if (!raw) return createDefaultStats();
        const parsed = JSON.parse(raw);
        return {
            currentStreak: parsed.currentStreak ?? 0,
            maxStreak: parsed.maxStreak ?? 0,
            lastCompletedDate: parsed.lastCompletedDate ?? null,
            solvedPuzzleIds: Array.isArray(parsed.solvedPuzzleIds) ? [...parsed.solvedPuzzleIds] : [],
            totalSolved: parsed.totalSolved ?? 0,
            totalAttempted: parsed.totalAttempted ?? 0,
        };
    } catch {
        return createDefaultStats();
    }
}

/**
 * Enregistre une tentative de puzzle et met à jour la série de victoires quotidiennes.
 */
export function recordPuzzleAttempt(
    puzzleId: string,
    isSuccess: boolean,
    dateStr: string = getTodayDateString(),
): DailyPuzzleStats {
    const current = getPuzzleStats();
    current.totalAttempted += 1;

    if (isSuccess) {
        if (!current.solvedPuzzleIds.includes(puzzleId)) {
            current.solvedPuzzleIds.push(puzzleId);
            current.totalSolved += 1;
        }

        // Calcul de la série quotidienne (Streak)
        if (current.lastCompletedDate === dateStr) {
            // Déjà résolu aujourd'hui, ne pas ré-incrémenter le streak
        } else if (current.lastCompletedDate) {
            const lastDate = new Date(current.lastCompletedDate);
            const today = new Date(dateStr);
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Résolu le jour consécutif
                current.currentStreak += 1;
            } else if (diffDays > 1) {
                // Série interrompue
                current.currentStreak = 1;
            }
        } else {
            // Première victoire
            current.currentStreak = 1;
        }

        current.lastCompletedDate = dateStr;
        current.maxStreak = Math.max(current.maxStreak, current.currentStreak);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(PUZZLE_STATS_KEY, JSON.stringify(current));
        } catch {
            // Storage quota fallback
        }
    }

    return current;
}

/**
 * Réinitialise les statistiques (pour les tests).
 */
export function resetPuzzleStats(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(PUZZLE_STATS_KEY);
    }
}

/**
 * Vérifie si le puzzle donné a déjà été résolu avec succès.
 */
export function isPuzzleSolved(puzzleId: string): boolean {
    const stats = getPuzzleStats();
    return stats.solvedPuzzleIds.includes(puzzleId);
}
