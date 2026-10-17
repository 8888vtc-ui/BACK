/**
 * Stockage et Historique des Analyses de Parties & Évolution du PR.
 *
 * Persiste les bilans de parties complètes dans le stockage local
 * et fournit des benchmarks d'historique représentatifs pour visualiser
 * l'évolution du Performance Rating (PR) et du rating Elo dans le temps.
 */

import type { CompleteGameAnalysis, RatingHistoryPoint } from './types';

export const GAME_ANALYSES_STORAGE_KEY = 'bg_game_analyses';

let memoryAnalysesStore: CompleteGameAnalysis[] | null = null;

/**
 * 3 parties de référence représentatives d'une progression réaliste.
 */
export function createBenchmarkGameAnalyses(): CompleteGameAnalysis[] {
    return [
        {
            id: 'analysis_bench_01',
            gameId: 'game_bench_01',
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
            player: 'X',
            opponentType: 'ai',
            opponentDifficulty: 'intermediate',
            winner: 'O',
            winType: 'single',
            pointsWon: 1,
            scoreX: 2,
            scoreO: 3,
            matchLength: 5,
            totalMovesCount: 14,
            decisionsCount: 14,
            unforcedDecisionsCount: 12,
            totalEquityLoss: 0.221,
            errorRate: 0.0184,
            performanceRating: 9.2,
            estimatedRating: 1672,
            prCategory: 'Avancé',
            breakdown: {
                optimal: 8,
                acceptable: 3,
                doubtful: 2,
                blunder: 1,
                howler: 0,
            },
            evaluatedMoves: [
                {
                    moveNumber: 1,
                    player: 'X',
                    dice: [3, 1],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '8/5 6/5',
                    optimalNotation: '8/5 6/5',
                    equityLoss: 0,
                    verdict: 'optimal',
                    isUnforced: true,
                    candidateCount: 6,
                },
                {
                    moveNumber: 2,
                    player: 'X',
                    dice: [5, 2],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '13/8 13/11',
                    optimalNotation: '13/8 13/11',
                    equityLoss: 0,
                    verdict: 'optimal',
                    isUnforced: true,
                    candidateCount: 8,
                },
                {
                    moveNumber: 3,
                    player: 'X',
                    dice: [4, 3],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '24/20 13/10',
                    optimalNotation: '24/20 13/10',
                    equityLoss: -0.012,
                    verdict: 'acceptable',
                    isUnforced: true,
                    candidateCount: 9,
                },
                {
                    moveNumber: 4,
                    player: 'X',
                    dice: [6, 2],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '24/18 13/11',
                    optimalNotation: '13/7 13/11',
                    equityLoss: -0.092,
                    verdict: 'blunder',
                    isUnforced: true,
                    candidateCount: 11,
                    conceptId: 'blot_safety',
                    explanation: 'Exposition non nécessaire sous le feu de 2 pions adverses.',
                },
            ],
        },
        {
            id: 'analysis_bench_02',
            gameId: 'game_bench_02',
            date: new Date(Date.now() - 2 * 86400000).toISOString(),
            player: 'X',
            opponentType: 'ai',
            opponentDifficulty: 'expert',
            winner: 'X',
            winType: 'single',
            pointsWon: 1,
            scoreX: 4,
            scoreO: 3,
            matchLength: 7,
            totalMovesCount: 16,
            decisionsCount: 16,
            unforcedDecisionsCount: 14,
            totalEquityLoss: 0.179,
            errorRate: 0.0128,
            performanceRating: 6.4,
            estimatedRating: 1817,
            prCategory: 'Expert',
            breakdown: {
                optimal: 11,
                acceptable: 3,
                doubtful: 2,
                blunder: 0,
                howler: 0,
            },
            evaluatedMoves: [
                {
                    moveNumber: 1,
                    player: 'X',
                    dice: [4, 2],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '8/4 6/4',
                    optimalNotation: '8/4 6/4',
                    equityLoss: 0,
                    verdict: 'optimal',
                    isUnforced: true,
                    candidateCount: 7,
                },
                {
                    moveNumber: 2,
                    player: 'X',
                    dice: [6, 1],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '13/7 8/7',
                    optimalNotation: '13/7 8/7',
                    equityLoss: 0,
                    verdict: 'optimal',
                    isUnforced: true,
                    candidateCount: 8,
                },
            ],
        },
        {
            id: 'analysis_bench_03',
            gameId: 'game_bench_03',
            date: new Date(Date.now() - 1 * 86400000).toISOString(),
            player: 'X',
            opponentType: 'ai',
            opponentDifficulty: 'expert',
            winner: 'X',
            winType: 'gammon',
            pointsWon: 2,
            scoreX: 6,
            scoreO: 3,
            matchLength: 7,
            totalMovesCount: 18,
            decisionsCount: 18,
            unforcedDecisionsCount: 15,
            totalEquityLoss: 0.126,
            errorRate: 0.0084,
            performanceRating: 4.2,
            estimatedRating: 1932,
            prCategory: 'Maître',
            breakdown: {
                optimal: 14,
                acceptable: 3,
                doubtful: 1,
                blunder: 0,
                howler: 0,
            },
            evaluatedMoves: [
                {
                    moveNumber: 1,
                    player: 'X',
                    dice: [3, 1],
                    boardBefore: new Array(28).fill(0),
                    boardAfter: new Array(28).fill(0),
                    playedNotation: '8/5 6/5',
                    optimalNotation: '8/5 6/5',
                    equityLoss: 0,
                    verdict: 'optimal',
                    isUnforced: true,
                    candidateCount: 6,
                },
            ],
        },
    ];
}

/**
 * Récupère l'ensemble des analyses de parties ordonnées par date décroissante.
 */
export function getAllGameAnalyses(): CompleteGameAnalysis[] {
    if (typeof window === 'undefined' || !window.localStorage) {
        if (!memoryAnalysesStore) {
            memoryAnalysesStore = createBenchmarkGameAnalyses();
        }
        return memoryAnalysesStore;
    }

    try {
        const raw = window.localStorage.getItem(GAME_ANALYSES_STORAGE_KEY);
        if (!raw) {
            const defaults = createBenchmarkGameAnalyses();
            window.localStorage.setItem(GAME_ANALYSES_STORAGE_KEY, JSON.stringify(defaults));
            return defaults;
        }

        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }

        const defaults = createBenchmarkGameAnalyses();
        window.localStorage.setItem(GAME_ANALYSES_STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    } catch {
        return createBenchmarkGameAnalyses();
    }
}

/**
 * Enregistre une nouvelle analyse de partie complète.
 */
export function saveGameAnalysis(analysis: CompleteGameAnalysis): void {
    const list = getAllGameAnalyses();
    // Évite les doublons sur le même gameId
    const existingIndex = list.findIndex((a) => a.gameId === analysis.gameId);

    if (existingIndex >= 0) {
        list[existingIndex] = analysis;
    } else {
        list.unshift(analysis);
    }

    memoryAnalysesStore = list;

    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(GAME_ANALYSES_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('[GameAnalysisStorage] Échec écriture locale :', e);
        }
    }
}

/**
 * Récupère une analyse par son identifiant unique.
 */
export function getGameAnalysisById(id: string): CompleteGameAnalysis | null {
    const list = getAllGameAnalyses();
    return list.find((a) => a.id === id || a.gameId === id) || null;
}

/**
 * Extrait les points d'historique chronologiques pour la courbe d'évolution du PR.
 */
export function getRatingHistory(): RatingHistoryPoint[] {
    const list = getAllGameAnalyses();
    // Trie par date croissante (du plus ancien au plus récent)
    const sorted = [...list].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sorted.map((item) => ({
        id: item.id,
        gameId: item.gameId,
        date: item.date,
        performanceRating: item.performanceRating,
        estimatedRating: item.estimatedRating,
        prCategory: item.prCategory,
        winner: item.winner || 'X',
        isPlayerWinner: item.winner === item.player,
        movesCount: item.totalMovesCount,
        errorRate: item.errorRate,
    }));
}

/**
 * Vide le stockage et restaure les parties de référence.
 */
export function clearGameAnalyses(): void {
    const defaults = createBenchmarkGameAnalyses();
    memoryAnalysesStore = defaults;
    if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(GAME_ANALYSES_STORAGE_KEY, JSON.stringify(defaults));
    }
}
