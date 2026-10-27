/**
 * Service de Progression Réelle & Gamification de l'Académie (Audits 3 & 4 / 5).
 *
 * Rôle :
 *   Agrège sans aucun placeholder bidon les statistiques réelles du joueur depuis :
 *   - `puzzleStorage` & `puzzleDatabase` (streak quotidien, puzzles résolus)
 *   - `blunderBank` (erreurs à réviser, taux de maîtrise)
 *   - `OPENING_BOOK` & `localStorage` (ouvertures consultées / maîtrisées)
 *   - `persistenceService` (IndexedDB) & `Supabase` (derniers matchs, PR moyen, ELO)
 *   - Strictement 0 `any`, < 300 lignes.
 */

import { getPuzzleStats } from '../puzzles/puzzleStorage';
import { PUZZLE_DATABASE } from '../puzzles/puzzleDatabase';
import { DAILY_PUZZLES_CATALOG, loadLocalPuzzleProfile } from '../../lib/puzzle/puzzleService';
import { getBlunderBankStats } from '../drills/blunderBank';
import { OPENING_BOOK } from '../openings/openingDatabase';
import { loadRecentGames } from '../../lib/offline/persistenceService';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { getUserGames } from '../../lib/supabase/db';
import { getUserStats } from '../../lib/supabase/auth';

export const MASTERED_OPENINGS_STORAGE_KEY = 'bg_mastered_openings';

export interface RecentMatchEntry {
    id: string;
    dateIso: string;
    relativeDate: string;
    opponentLabel: string;
    scoreX: number;
    scoreO: number;
    matchLength: number;
    isVictory: boolean | null;
    pr: number | null;
}

export interface AcademyProgressSnapshot {
    puzzlesSolved: number;
    puzzlesTotal: number;
    puzzleStreak: number;
    openingsMastered: number;
    openingsTotal: number;
    blundersToReview: number;
    blundersMastered: number;
    blundersTotal: number;
    blunderMasteryPct: number;
    gamesPlayed: number;
    winsCount: number;
    averagePR: number | null;
    eloRating: number;
    unlockedBadges: ReadonlyArray<{ id: string; icon: string; label: string }>;
}

/**
 * Formate une date ISO en libellé relatif lisible en français.
 */
export function formatRelativeMatchDate(dateIso: string, nowMs: number = Date.now()): string {
    const time = Date.parse(dateIso);
    if (Number.isNaN(time)) return 'Récent';
    const diffSec = Math.max(0, Math.floor((nowMs - time) / 1000));
    if (diffSec < 60) return 'À l’instant';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 30) return `Il y a ${diffDays} j`;
    return new Date(time).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/**
 * Lit la liste des identifiants d'ouvertures maîtrisées par l'utilisateur.
 */
export function getMasteredOpeningIds(): string[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
        const raw = window.localStorage.getItem(MASTERED_OPENINGS_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

/**
 * Marque une ouverture comme étudiée / maîtrisée.
 */
export function markOpeningMastered(openingId: string): string[] {
    const current = getMasteredOpeningIds();
    if (!current.includes(openingId)) {
        const updated = [...current, openingId];
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(MASTERED_OPENINGS_STORAGE_KEY, JSON.stringify(updated));
            } catch {
                // Ignore quota
            }
        }
        return updated;
    }
    return current;
}

/**
 * Calcule un snapshot synchrone immédiat de la progression locale (Puzzles, Ouvertures, Drills).
 */
export function getSyncAcademySnapshot(eloOverride?: number, avgPrOverride?: number | null): AcademyProgressSnapshot {
    const puzzleStats = getPuzzleStats();
    const localPuzzleProfile = loadLocalPuzzleProfile();
    const blunderStats = getBlunderBankStats();
    const masteredOpenings = getMasteredOpeningIds();

    const puzzlesTotal = Math.max(1, DAILY_PUZZLES_CATALOG.length, PUZZLE_DATABASE.length);
    const puzzlesSolved = Math.min(puzzlesTotal, puzzleStats.solvedPuzzleIds.length);
    const effectivePuzzleStreak = Math.max(puzzleStats.currentStreak, localPuzzleProfile.currentStreak);
    const openingsTotal = Math.max(1, OPENING_BOOK.length);
    const openingsMastered = Math.min(openingsTotal, masteredOpenings.length);

    const badges: Array<{ id: string; icon: string; label: string }> = [];
    if (effectivePuzzleStreak >= 1) {
        badges.push({ id: 'streak', icon: '🔥', label: `Série ${effectivePuzzleStreak}j` });
    }
    if (puzzlesSolved >= 3) {
        badges.push({ id: 'tactician', icon: '🧩', label: 'Tacticien' });
    }
    if (blunderStats.masteredCount >= 1) {
        badges.push({ id: 'corrector', icon: '🎯', label: `${blunderStats.masteredCount} Blunder(s) corrigé(s)` });
    }
    if (openingsMastered >= 5) {
        badges.push({ id: 'theorist', icon: '📖', label: 'Maître des Ouvertures' });
    }

    return {
        puzzlesSolved,
        puzzlesTotal,
        puzzleStreak: effectivePuzzleStreak,
        openingsMastered,
        openingsTotal,
        blundersToReview: blunderStats.remainingToReview,
        blundersMastered: blunderStats.masteredCount,
        blundersTotal: blunderStats.totalBlunders,
        blunderMasteryPct: blunderStats.masteryRate,
        gamesPlayed: 0,
        winsCount: 0,
        averagePR: avgPrOverride ?? null,
        eloRating: eloOverride ?? 1500,
        unlockedBadges: badges,
    };
}

/**
 * Charge l'historique réel des derniers matchs et les métriques joueur depuis
 * Supabase (si connecté) et IndexedDB (`loadRecentGames`).
 */
export async function loadPlayerHubData(userId?: string | null): Promise<{
    snapshot: AcademyProgressSnapshot;
    recentMatches: RecentMatchEntry[];
}> {
    const base = getSyncAcademySnapshot();
    const matches: RecentMatchEntry[] = [];
    let gamesPlayed = 0;
    let winsCount = 0;
    let averagePR: number | null = null;
    let eloRating = 1500;

    try {
        if (userId && isSupabaseConfigured()) {
            const [cloudStats, cloudGames] = await Promise.all([
                getUserStats(userId),
                getUserGames(userId, 5),
            ]);
            if (cloudStats) {
                gamesPlayed = cloudStats.games_played ?? 0;
                winsCount = cloudStats.games_won ?? 0;
            }
            for (const g of cloudGames) {
                const hasWinner = g.winner === 'X' || g.winner === 'O';
                const isFinished = g.status === 'completed' || hasWinner;
                const isVictory = isFinished && hasWinner ? g.winner === 'X' : null;
                matches.push({
                    id: g.id,
                    dateIso: g.created_at,
                    relativeDate: formatRelativeMatchDate(g.created_at),
                    opponentLabel: g.opponent_type === 'human' ? 'Adversaire En Ligne' : 'IA Monte-Carlo',
                    scoreX: g.score_x,
                    scoreO: g.score_o,
                    matchLength: g.match_length,
                    isVictory,
                    pr: null,
                });
            }
        }
    } catch {
        // Fallback transparent sur IndexedDB local
    }

    try {
        const localGames = await loadRecentGames(5);
        for (const lg of localGames) {
            if (matches.some((m) => m.id === lg.id)) continue;
            const hasWinner = lg.winner === 'X' || lg.winner === 'O';
            const isFinished = lg.status === 'completed' || hasWinner;
            if (
                !isFinished &&
                lg.score_x === 0 &&
                lg.score_o === 0 &&
                matches.some((m) => m.isVictory === null && m.scoreX === 0 && m.scoreO === 0)
            ) {
                continue;
            }
            const isVictory = isFinished && hasWinner ? lg.winner === 'X' : null;
            matches.push({
                id: lg.id,
                dateIso: lg.created_at,
                relativeDate: formatRelativeMatchDate(lg.created_at),
                opponentLabel: lg.opponent_type === 'human' ? 'Adversaire En Ligne' : 'IA Monte-Carlo',
                scoreX: lg.score_x,
                scoreO: lg.score_o,
                matchLength: lg.match_length,
                isVictory,
                pr: null,
            });
        }
        if (gamesPlayed === 0 && matches.length > 0) {
            const finishedMatches = matches.filter((m) => m.isVictory !== null);
            gamesPlayed = finishedMatches.length;
            winsCount = finishedMatches.filter((m) => m.isVictory === true).length;
        }
    } catch {
        // Environnement sans IndexedDB
    }

    // Lecture optionnelle du PR moyen stocké localement
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            const rawPr = window.localStorage.getItem('bg_last_player_pr');
            if (rawPr) {
                const parsedPr = Number(rawPr);
                if (Number.isFinite(parsedPr) && parsedPr >= 0) {
                    averagePR = parsedPr;
                }
            }
            const rawElo = window.localStorage.getItem('bg_player_elo');
            if (rawElo) {
                const parsedElo = Number(rawElo);
                if (Number.isFinite(parsedElo) && parsedElo > 0) {
                    eloRating = parsedElo;
                }
            }
        } catch {
            // Ignore
        }
    }

    return {
        snapshot: {
            ...base,
            gamesPlayed,
            winsCount,
            averagePR,
            eloRating,
        },
        recentMatches: matches.slice(0, 5),
    };
}
