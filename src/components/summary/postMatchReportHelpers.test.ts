import { describe, it, expect } from 'vitest';
import {
    buildMatchSummaryPayload,
    buildRuleBasedSynthesis,
    countBlundersByPhase,
    detectGamePhase,
    extractMajorBlunders,
    summarizeDecisionCounters,
    MAJOR_BLUNDER_THRESHOLD,
} from './postMatchReportHelpers';
import type { CompleteGameAnalysis, EvaluatedTurn } from '../../features/rating/types';

/** Plateau vide (28 entiers). */
function emptyBoard(): number[] {
    return new Array(28).fill(0);
}

/** Construit un coup évalué minimal. */
function makeMove(overrides: Partial<EvaluatedTurn>): EvaluatedTurn {
    return {
        moveNumber: 1,
        player: 'X',
        dice: [3, 1],
        boardBefore: emptyBoard(),
        boardAfter: emptyBoard(),
        playedNotation: '13/10 13/12',
        optimalNotation: '8/5 6/5',
        equityLoss: 0,
        verdict: 'optimal',
        isUnforced: true,
        candidateCount: 5,
        ...overrides,
    };
}

/** Analyse complète minimale. */
function makeAnalysis(overrides: Partial<CompleteGameAnalysis> = {}): CompleteGameAnalysis {
    return {
        id: 'a1',
        gameId: 'g1',
        date: new Date().toISOString(),
        player: 'X',
        opponentType: 'ai',
        scoreX: 3,
        scoreO: 2,
        matchLength: 7,
        totalMovesCount: 20,
        decisionsCount: 10,
        unforcedDecisionsCount: 10,
        totalEquityLoss: 0.34,
        errorRate: 0.034,
        performanceRating: 5.42,
        estimatedRating: 1868,
        prCategory: 'Expert',
        breakdown: { optimal: 5, acceptable: 2, doubtful: 1, blunder: 2, howler: 0 },
        evaluatedMoves: [],
        ...overrides,
    };
}

describe('detectGamePhase', () => {
    it('détecte le bear-off quand tous les pions sont dans le jan intérieur', () => {
        const board = emptyBoard();
        board[1] = 5;
        board[3] = 5;
        board[6] = 5;
        expect(detectGamePhase(board, 'X')).toBe('bearoff');
    });

    it('détecte la course quand les camps sont séparés', () => {
        const board = emptyBoard();
        // X en 7-8 (hors jan intérieur), O en 20-22 : aucun contact possible.
        board[7] = 5;
        board[8] = 5;
        board[20] = -5;
        board[22] = -5;
        expect(detectGamePhase(board, 'X')).toBe('race');
    });

    it('détecte l’ouverture quand la majorité des pions est au départ', () => {
        const board = emptyBoard();
        board[24] = 8;
        board[13] = 5;
        board[8] = 2;
        expect(detectGamePhase(board, 'X')).toBe('opening');
    });

    it('retourne unknown pour un plateau invalide', () => {
        expect(detectGamePhase([], 'X')).toBe('unknown');
    });
});

describe('extractMajorBlunders', () => {
    it('filtre les erreurs au-dessus du seuil et trie par gravité', () => {
        const moves = [
            makeMove({ moveNumber: 1, equityLoss: -0.01 }),
            makeMove({ moveNumber: 2, equityLoss: -0.15 }),
            makeMove({ moveNumber: 3, equityLoss: -0.05 }),
            makeMove({ moveNumber: 4, equityLoss: -0.30 }),
        ];
        const result = extractMajorBlunders(moves, 'X');
        expect(result).toHaveLength(3);
        expect(result[0].turnNumber).toBe(4);
        expect(result[1].turnNumber).toBe(2);
        expect(result[2].turnNumber).toBe(3);
        expect(result[0].equityLoss).toBeCloseTo(0.30, 3);
    });

    it('ignore les coups de l’adversaire', () => {
        const moves = [
            makeMove({ moveNumber: 1, player: 'O', equityLoss: -0.40 }),
            makeMove({ moveNumber: 2, player: 'X', equityLoss: -0.10 }),
        ];
        const result = extractMajorBlunders(moves, 'X');
        expect(result).toHaveLength(1);
        expect(result[0].turnNumber).toBe(2);
    });

    it('respecte le seuil officiel de 0.020', () => {
        expect(MAJOR_BLUNDER_THRESHOLD).toBe(0.02);
        const moves = [makeMove({ equityLoss: -0.02 })];
        expect(extractMajorBlunders(moves, 'X')).toHaveLength(0);
    });

    it('limite le nombre de résultats', () => {
        const moves = Array.from({ length: 10 }, (_, i) =>
            makeMove({ moveNumber: i + 1, equityLoss: -0.1 - i * 0.01 }),
        );
        expect(extractMajorBlunders(moves, 'X', 3)).toHaveLength(3);
    });

    it('retourne un tableau vide sans analyse', () => {
        expect(extractMajorBlunders(undefined, 'X')).toEqual([]);
    });
});

describe('summarizeDecisionCounters', () => {
    it('agrège acceptable → good et howler → blunder', () => {
        const counters = summarizeDecisionCounters(makeAnalysis());
        expect(counters).toEqual({ optimal: 5, good: 2, inaccuracy: 1, blunder: 2 });
    });

    it('retourne des zéros sans analyse', () => {
        expect(summarizeDecisionCounters(null)).toEqual({
            optimal: 0,
            good: 0,
            inaccuracy: 0,
            blunder: 0,
        });
    });
});

describe('countBlundersByPhase', () => {
    it('compte les erreurs par phase', () => {
        const counts = countBlundersByPhase([
            { phase: 'contact' } as any,
            { phase: 'contact' } as any,
            { phase: 'bearoff' } as any,
        ]);
        expect(counts.contact).toBe(2);
        expect(counts.bearoff).toBe(1);
        expect(counts.opening).toBe(0);
    });
});

describe('buildMatchSummaryPayload', () => {
    it('construit un résumé structuré complet', () => {
        const analysis = makeAnalysis();
        const blunders = extractMajorBlunders(
            [makeMove({ moveNumber: 2, equityLoss: -0.15, conceptId: 'blot_safety' })],
            'X',
        );
        const payload = buildMatchSummaryPayload({
            analysis,
            blunders,
            opponentPerformanceRating: 4.1,
        });

        expect(payload.performanceRating).toBeCloseTo(5.42, 2);
        expect(payload.prCategory).toBe('Expert');
        expect(payload.opponentPerformanceRating).toBe(4.1);
        expect(payload.counters.blunder).toBe(2);
        expect(payload.blunders).toHaveLength(1);
        expect(payload.blunders[0].conceptId).toBe('blot_safety');
        expect(payload.winner).toBeNull();
    });
});

describe('buildRuleBasedSynthesis', () => {
    it('produit les 3 blocs du diagnostic', () => {
        const analysis = makeAnalysis();
        const blunders = extractMajorBlunders(
            [makeMove({ moveNumber: 2, equityLoss: -0.15 })],
            'X',
        );
        const payload = buildMatchSummaryPayload({ analysis, blunders });
        const synthesis = buildRuleBasedSynthesis(payload);

        expect(synthesis.strengths.length).toBeGreaterThan(0);
        expect(synthesis.weaknesses.length).toBeGreaterThan(0);
        expect(synthesis.trainingPlan.length).toBeGreaterThan(0);
        expect(synthesis.summary).toContain('5.42');
    });

    it('signale l’absence de blunder comme point fort', () => {
        const analysis = makeAnalysis({
            breakdown: { optimal: 10, acceptable: 0, doubtful: 0, blunder: 0, howler: 0 },
        });
        const payload = buildMatchSummaryPayload({ analysis, blunders: [] });
        const synthesis = buildRuleBasedSynthesis(payload);

        expect(synthesis.strengths.some((s) => s.includes('Aucune erreur majeure'))).toBe(true);
    });
});
