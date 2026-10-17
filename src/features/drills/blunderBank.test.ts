import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getAllBlunders,
    recordBlunder,
    getBlundersToReview,
    getBlunderById,
    markBlunderAttempt,
    resetBlunderMastery,
    resetAllBlunderMastery,
    getBlunderBankStats,
    clearBlunderBank,
} from './blunderBank';
import { BENCHMARK_BLUNDERS } from './benchmarkBlunders';

describe('BlunderBank Module', () => {
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

        clearBlunderBank();
    });

    it('initialise automatiquement la banque avec les 5 blunders de référence si le stockage est vide', () => {
        const blunders = getAllBlunders();
        expect(blunders.length).toBe(BENCHMARK_BLUNDERS.length);
        expect(blunders[0].id).toBe(BENCHMARK_BLUNDERS[0].id);
        expect(blunders[0].optimalMove).toBe(BENCHMARK_BLUNDERS[0].optimalMove);
    });

    it('enregistre une nouvelle erreur de joueur dans la banque', () => {
        const dummyBoard = new Array(28).fill(0);
        dummyBoard[1] = 2;
        dummyBoard[24] = -2;

        const record = recordBlunder({
            board: dummyBoard,
            dice: [6, 4],
            player: 'X',
            playedMove: '24/18 24/20',
            optimalMove: '24/14',
            equityLoss: 0.135,
            verdict: 'blunder',
            conceptId: 'race_management',
            conceptName: 'Règle de course en avance',
            explanation: 'Il fallait fuir sans disperser les pions.',
        });

        expect(record.id).toBeDefined();
        expect(record.equityLoss).toBe(0.135);
        expect(record.isMastered).toBe(false);

        const all = getAllBlunders();
        expect(all.length).toBe(BENCHMARK_BLUNDERS.length + 1);
        expect(all[0].id).toBe(record.id);
    });

    it('évite les doublons de positions identiques et met à jour l’erreur existante', () => {
        const dummyBoard = new Array(28).fill(0);
        dummyBoard[6] = 5;

        recordBlunder({
            board: dummyBoard,
            dice: [5, 2],
            player: 'X',
            playedMove: '6/1 6/4',
            optimalMove: '13/8 13/11',
            equityLoss: 0.11,
            verdict: 'blunder',
            conceptId: 'blot_safety',
            conceptName: 'Sécurité des blots',
            explanation: 'Explication 1',
        });

        // Même position avec mêmes dés
        const updated = recordBlunder({
            board: dummyBoard,
            dice: [2, 5], // Ordre inverse des dés
            player: 'X',
            playedMove: '6/1 6/4',
            optimalMove: '13/8 13/11',
            equityLoss: 0.18, // Perte encore plus grande
            verdict: 'blunder',
            conceptId: 'blot_safety',
            conceptName: 'Sécurité des blots',
            explanation: 'Explication 2',
        });

        const all = getAllBlunders();
        expect(all.length).toBe(BENCHMARK_BLUNDERS.length + 1);
        expect(updated.equityLoss).toBe(0.18);
    });

    it('trie les blunders à réviser en priorité par perte d’équité décroissante', () => {
        const toReview = getBlundersToReview();
        expect(toReview.length).toBeGreaterThan(0);
        for (let i = 0; i < toReview.length - 1; i++) {
            expect(toReview[i].equityLoss).toBeGreaterThanOrEqual(toReview[i + 1].equityLoss);
        }
    });

    it('filtre les erreurs à réviser par conceptId', () => {
        const goldenPointBlunders = getBlundersToReview('golden_point');
        expect(goldenPointBlunders.length).toBeGreaterThan(0);
        expect(goldenPointBlunders.every((b) => b.conceptId === 'golden_point')).toBe(true);
    });

    it('met à jour la maîtrise et les compteurs lors de markBlunderAttempt', () => {
        const blunders = getAllBlunders();
        const target = blunders[0];

        // 1. Échec
        const afterFail = markBlunderAttempt(target.id, false);
        expect(afterFail?.timesReviewed).toBe(1);
        expect(afterFail?.timesSolved).toBe(0);
        expect(afterFail?.isMastered).toBe(false);

        // 2. Réussite
        const afterSuccess = markBlunderAttempt(target.id, true);
        expect(afterSuccess?.timesReviewed).toBe(2);
        expect(afterSuccess?.timesSolved).toBe(1);
        expect(afterSuccess?.isMastered).toBe(true);

        // 3. Récupération par ID
        const fetched = getBlunderById(target.id);
        expect(fetched?.isMastered).toBe(true);
    });

    it('réinitialise la maîtrise d’une erreur et de toutes les erreurs', () => {
        const blunders = getAllBlunders();
        markBlunderAttempt(blunders[0].id, true);
        markBlunderAttempt(blunders[1].id, true);

        resetBlunderMastery(blunders[0].id);
        expect(getBlunderById(blunders[0].id)?.isMastered).toBe(false);
        expect(getBlunderById(blunders[1].id)?.isMastered).toBe(true);

        resetAllBlunderMastery();
        const allAfterReset = getAllBlunders();
        expect(allAfterReset.every((b) => !b.isMastered)).toBe(true);
    });

    it('calcule correctement les statistiques de la banque getBlunderBankStats', () => {
        const blunders = getAllBlunders();
        markBlunderAttempt(blunders[0].id, true); // 1 vue, 1 résolue
        markBlunderAttempt(blunders[1].id, false); // 1 vue, 0 résolue

        const stats = getBlunderBankStats();
        expect(stats.totalBlunders).toBe(blunders.length);
        expect(stats.masteredCount).toBe(1);
        expect(stats.remainingToReview).toBe(blunders.length - 1);
        expect(stats.totalAttempts).toBe(2);
        expect(stats.accuracyRate).toBe(50); // 1 sur 2 = 50%
    });

    it('permet de vider et restaurer la banque avec clearBlunderBank', () => {
        const dummyBoard = new Array(28).fill(0);
        recordBlunder({
            board: dummyBoard,
            dice: [1, 2],
            player: 'X',
            playedMove: '24/23 23/21',
            optimalMove: '24/21',
            equityLoss: 0.1,
            verdict: 'blunder',
            conceptId: 'golden_point',
            conceptName: 'Golden Point',
            explanation: 'Test',
        });

        expect(getAllBlunders().length).toBe(BENCHMARK_BLUNDERS.length + 1);
        clearBlunderBank();
        expect(getAllBlunders().length).toBe(BENCHMARK_BLUNDERS.length);
    });
});
