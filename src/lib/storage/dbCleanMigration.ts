/**
 * @file src/lib/storage/dbCleanMigration.ts
 * @description Purge navigateur `quiz_and_accounts_v3_clean` / `db_clean_v3` (2026-11-02).
 *
 * Supprime du localStorage toutes les données construites sur les anciens quiz / puzzles non vérifiés
 * et les anciens comptes/bots locaux (banque de blunders, profils adaptatifs, ER/PR_ONLY de quiz,
 * statistiques, file FSRS des puzzles, anciens profils de bots locaux).
 * S'exécute automatiquement dès que la clé de version diffère de `quiz_and_accounts_v3_clean`.
 */

export const APP_VERSION_STAMP = 'v3.0-3PLY-CLEAN' as const;
export const DB_CLEAN_VERSION_KEY = 'bg_db_clean_version';
export const DB_CLEAN_VERSION = APP_VERSION_STAMP;

/** Clés construites sur les anciens quiz/puzzles non vérifiés et anciens comptes/bots locaux. */
export const LEGACY_QUIZ_STORAGE_KEYS: readonly string[] = [
    'bg_blunder_bank',
    'bg_adaptive_quiz_profile_v1',
    'bg_nplus1_regulation_v1',
    'bg_quiz_er_rating_v1',
    'bg_quiz_erh_rating_v1',
    'bg_daily_puzzle_stats',
    'backgammon.puzzleStreak',
    'backgammon.lastPuzzleDate',
    'backgammon.maxPuzzleStreak',
    'backgammon.puzzleRating',
    'backgammon.puzzleRd',
    'backgammon.puzzleVolatility',
    'backgammon.fsrsQueue',
    'bg_bot_cohort_profiles',
    'bg_simulated_matches',
    'bg_opponent_erh_tracker',
];

export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

/** Applique la purge si nécessaire. Retourne le nombre de clés supprimées (0 si déjà à jour). */
export function runDbCleanMigration(storage: StorageLike | null | undefined): number {
    if (!storage) return 0;
    try {
        if (storage.getItem(DB_CLEAN_VERSION_KEY) === DB_CLEAN_VERSION) return 0;
        let removed = 0;
        for (const key of LEGACY_QUIZ_STORAGE_KEYS) {
            if (storage.getItem(key) !== null) {
                storage.removeItem(key);
                removed++;
            }
        }
        storage.setItem(DB_CLEAN_VERSION_KEY, DB_CLEAN_VERSION);
        return removed;
    } catch {
        // Stockage indisponible (mode privé, quota) : rien à purger.
        return 0;
    }
}

/**
 * Purge le cache navigateur mobile et désinscrit les Service Workers obsolètes
 * lorsque l'estampille de version diffère de `APP_VERSION_STAMP`.
 */
export function runMobileCacheAndSwPurge(): void {
    if (typeof window === 'undefined') return;
    try {
        if (window.localStorage.getItem('bg_app_version_stamp') !== APP_VERSION_STAMP) {
            try {
                window.sessionStorage?.clear();
            } catch {
                // Ignore restricted storage contexts
            }
            runDbCleanMigration(window.localStorage);
            window.localStorage.setItem('bg_app_version_stamp', APP_VERSION_STAMP);
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker?.getRegistrations) {
                navigator.serviceWorker.getRegistrations().then((regs) => {
                    regs.forEach((r) => {
                        void r.unregister();
                    });
                }).catch(() => {
                    // Ignore service worker unregister errors
                });
            }
            if ('caches' in window && window.caches?.keys) {
                window.caches.keys().then((keys) => {
                    keys.forEach((k) => {
                        void window.caches.delete(k);
                    });
                }).catch(() => {
                    // Ignore cache deletion errors
                });
            }
        }
    } catch {
        // LocalStorage inaccessible (mode privé, quota)
    }
}
