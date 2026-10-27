import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getAllGameAnalyses,
    saveGameAnalysis,
    getGameAnalysisById,
    getRatingHistory,
    clearGameAnalyses,
    createBenchmarkGameAnalyses,
} from './gameAnalysisStorage';
import type { CompleteGameAnalysis } from './types';

describe('gameAnalysisStorage Module', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStore[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                mockStore[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStore[key];
            }),
            clear: vi.fn(() => {
                mockStore = {};
            }),
        };

        vi.stubGlobal('window', {
            localStorage: mockLocalStorage,
        });

        clearGameAnalyses();
    });

    it('retourne un tableau vide si le stockage est vide', () => {
        const list = getAllGameAnalyses();
        expect(list.length).toBe(0);
    });

    it('enregistre une nouvelle analyse de partie sans écraser les autres', () => {
        const dummy: CompleteGameAnalysis = {
            id: 'analysis_new_01',
            gameId: 'game_new_01',
            date: new Date().toISOString(),
            player: 'X',
            opponentType: 'ai',
            scoreX: 7,
            scoreO: 5,
            matchLength: 7,
            totalMovesCount: 20,
            decisionsCount: 20,
            unforcedDecisionsCount: 18,
            totalEquityLoss: 0.15,
            errorRate: 0.0083,
            performanceRating: 4.15,
            estimatedRating: 1934,
            prCategory: 'Maître',
            breakdown: { optimal: 15, acceptable: 4, doubtful: 1, blunder: 0, howler: 0 },
            evaluatedMoves: [],
        };

        saveGameAnalysis(dummy);

        const all = getAllGameAnalyses();
        expect(all.length).toBe(1);
        expect(all[0].id).toBe('analysis_new_01');

        const fetched = getGameAnalysisById('analysis_new_01');
        expect(fetched?.performanceRating).toBe(4.15);
    });

    it('évite les doublons pour un même gameId et met à jour l’analyse', () => {
        const dummy: CompleteGameAnalysis = {
            id: 'analysis_dup_1',
            gameId: 'game_same_id',
            date: new Date().toISOString(),
            player: 'X',
            opponentType: 'ai',
            scoreX: 1,
            scoreO: 0,
            matchLength: 5,
            totalMovesCount: 10,
            decisionsCount: 10,
            unforcedDecisionsCount: 10,
            totalEquityLoss: 0.2,
            errorRate: 0.02,
            performanceRating: 10.0,
            estimatedRating: 1630,
            prCategory: 'Intermédiaire',
            breakdown: { optimal: 7, acceptable: 2, doubtful: 1, blunder: 0, howler: 0 },
            evaluatedMoves: [],
        };

        saveGameAnalysis(dummy);
        expect(getAllGameAnalyses().length).toBe(1);

        // Mise à jour avec nouveau PR
        saveGameAnalysis({
            ...dummy,
            performanceRating: 8.5,
        });

        const all = getAllGameAnalyses();
        expect(all.length).toBe(1);
        expect(getGameAnalysisById('game_same_id')?.performanceRating).toBe(8.5);
    });

    it('fournit les points d’historique chronologiques via getRatingHistory', () => {
        const dummy: CompleteGameAnalysis = {
            id: 'analysis_dup_1',
            gameId: 'game_same_id',
            date: new Date().toISOString(),
            player: 'X',
            opponentType: 'ai',
            scoreX: 1,
            scoreO: 0,
            matchLength: 5,
            totalMovesCount: 10,
            decisionsCount: 10,
            unforcedDecisionsCount: 10,
            totalEquityLoss: 0.2,
            errorRate: 0.02,
            performanceRating: 10.0,
            estimatedRating: 1630,
            prCategory: 'Intermédiaire',
            breakdown: { optimal: 7, acceptable: 2, doubtful: 1, blunder: 0, howler: 0 },
            evaluatedMoves: [],
        };
        saveGameAnalysis(dummy);
        const history = getRatingHistory();
        expect(history.length).toBe(1);
        // Doit être ordonné par date croissante
        for (let i = 0; i < history.length - 1; i++) {
            const t1 = new Date(history[i].date).getTime();
            const t2 = new Date(history[i + 1].date).getTime();
            expect(t1).toBeLessThanOrEqual(t2);
        }
    });
});
