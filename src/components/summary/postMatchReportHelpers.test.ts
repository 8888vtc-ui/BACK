import { describe, it, expect } from 'vitest';
import {
    buildBlunderPedagogicalNote,
    buildMatchSummaryPayload,
    buildRuleBasedSynthesis,
    buildTurnXGID,
    classifyAllMatchMoves,
    classifyMoveByEquityLoss,
    computeMatchAccuracy,
    countBlundersByPhase,
    detectGamePhase,
    extractMajorBlunders,
    identifyRecurringThemes,
    summarizeDecisionCounters,
    MAJOR_BLUNDER_THRESHOLD,
    type MajorBlunder,
} from './postMatchReportHelpers';
import type { CompleteGameAnalysis, EvaluatedTurn } from '../../features/rating/types';

/** Plateau vide (28 entiers). */
const emptyBoard = (): number[] => new Array(28).fill(0);

/** Construit un coup évalué minimal. */
const makeMove = (overrides: Partial<EvaluatedTurn>): EvaluatedTurn => ({
    moveNumber: 1, player: 'X', dice: [3, 1], boardBefore: emptyBoard(), boardAfter: emptyBoard(),
    playedNotation: '13/10 13/12', optimalNotation: '8/5 6/5', equityLoss: 0,
    verdict: 'optimal', isUnforced: true, candidateCount: 5, ...overrides,
});

/** Analyse complète minimale. */
const makeAnalysis = (overrides: Partial<CompleteGameAnalysis> = {}): CompleteGameAnalysis => ({
    id: 'a1', gameId: 'g1', date: new Date().toISOString(), player: 'X', opponentType: 'ai',
    scoreX: 3, scoreO: 2, matchLength: 7, totalMovesCount: 20, decisionsCount: 10,
    unforcedDecisionsCount: 10, totalEquityLoss: 0.34, errorRate: 0.034, performanceRating: 5.42,
    estimatedRating: 1868, prCategory: 'Expert',
    breakdown: { optimal: 5, acceptable: 2, doubtful: 1, blunder: 2, howler: 0 },
    evaluatedMoves: [], ...overrides,
});

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

describe('classifyMoveByEquityLoss & classifyAllMatchMoves (Open Sage / bgsage thresholds)', () => {
    it('classifie correctement Best Move, Inaccuracy, Mistake, Blunder et Cube Blunder', () => {
        expect(classifyMoveByEquityLoss(-0.005)).toBe('best');
        expect(classifyMoveByEquityLoss(-0.019)).toBe('best');
        expect(classifyMoveByEquityLoss(-0.025)).toBe('inaccuracy');
        expect(classifyMoveByEquityLoss(-0.049)).toBe('inaccuracy');
        expect(classifyMoveByEquityLoss(-0.055)).toBe('mistake');
        expect(classifyMoveByEquityLoss(-0.080)).toBe('mistake');
        expect(classifyMoveByEquityLoss(-0.085)).toBe('blunder');
        expect(classifyMoveByEquityLoss(-0.210)).toBe('blunder');
        expect(classifyMoveByEquityLoss(-0.010, -0.095)).toBe('cube_blunder');
    });

    it('agrège tous les coups du joueur dans les 5 catégories du rapport', () => {
        const moves = [
            makeMove({ moveNumber: 1, equityLoss: 0 }),
            makeMove({ moveNumber: 2, equityLoss: -0.032 }),
            makeMove({ moveNumber: 3, equityLoss: -0.064 }),
            makeMove({ moveNumber: 4, equityLoss: -0.142 }),
            makeMove({ moveNumber: 5, equityLoss: -0.010, cubeEquityLoss: -0.110 }),
            makeMove({ moveNumber: 6, player: 'O', equityLoss: -0.300 }),
        ];

        const summary = classifyAllMatchMoves(moves, 'X');
        expect(summary).toEqual({
            best: 2,
            inaccuracy: 1,
            mistake: 1,
            blunder: 1,
            cubeBlunder: 1,
        });
    });
});

describe('computeMatchAccuracy & buildTurnXGID', () => {
    it('calcule un taux de précision cohérent entre 0 et 100 %', () => {
        const analysis = makeAnalysis({
            evaluatedMoves: [
                makeMove({ moveNumber: 1, equityLoss: 0 }),
                makeMove({ moveNumber: 2, equityLoss: -0.010 }),
                makeMove({ moveNumber: 3, equityLoss: -0.030 }),
                makeMove({ moveNumber: 4, equityLoss: -0.120 }),
            ],
        });
        const accuracy = computeMatchAccuracy(analysis, 'X');
        expect(accuracy).toBeGreaterThan(60);
        expect(accuracy).toBeLessThan(95);
    });

    it('génère un identifiant XGID valide à partir d’un tour évalué', () => {
        const move = makeMove({ moveNumber: 1, dice: [6, 1] });
        const xgid = buildTurnXGID(move);
        expect(xgid.startsWith('XGID=')).toBe(true);
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
        expect(result[0].category).toBe('blunder');
        expect(result[2].category).toBe('mistake');
        expect(result[0].xgid?.startsWith('XGID=')).toBe(true);
        expect(result[0].diagnostic).toBeTruthy();
        expect(result[0].keyConcept).toBeTruthy();
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

const makeBlunder = (overrides: Partial<MajorBlunder>): MajorBlunder => ({
    turnNumber: 1, dice: [3, 1], playedNotation: '13/10 13/12', optimalNotation: '8/5 6/5',
    equityLoss: 0.1, boardBefore: emptyBoard(), phase: 'contact', ...overrides,
});

describe('countBlundersByPhase & identifyRecurringThemes', () => {
    it('compte les erreurs par phase', () => {
        const counts = countBlundersByPhase([
            makeBlunder({ phase: 'contact' }),
            makeBlunder({ phase: 'contact' }),
            makeBlunder({ phase: 'bearoff' }),
        ]);
        expect(counts.contact).toBe(2);
        expect(counts.bearoff).toBe(1);
        expect(counts.opening).toBe(0);
    });

    it('identifie les thèmes récurrents selon les phases et erreurs de videau', () => {
        const themes = identifyRecurringThemes([
            makeBlunder({ phase: 'race', category: 'mistake' }),
            makeBlunder({ phase: 'opening', category: 'cube_blunder' }),
        ]);
        expect(themes).toContain('Sécurité excessive en course');
        expect(themes).toContain('Ouverture trop agressive');
        expect(themes).toContain('Gestion du videau tardive');
    });
});

describe('buildMatchSummaryPayload', () => {
    it('construit un résumé structuré complet incluant XGID, thèmes et Accuracy %', () => {
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
        expect(payload.blunders[0].xgid?.startsWith('XGID=')).toBe(true);
        expect(payload.accuracyPercent).toBeGreaterThan(0);
        expect(Array.isArray(payload.recurringThemes)).toBe(true);
        expect(payload.winner).toBeNull();
    });
});

describe('buildRuleBasedSynthesis & buildBlunderPedagogicalNote', () => {
    it('produit les 3 volets Grandmaster (Diagnostic, Concept Clé, Plan) et les 3 blocs classiques', () => {
        const analysis = makeAnalysis();
        const blunders = extractMajorBlunders(
            [makeMove({ moveNumber: 2, equityLoss: -0.15 })],
            'X',
        );
        const payload = buildMatchSummaryPayload({ analysis, blunders });
        const synthesis = buildRuleBasedSynthesis(payload);

        expect(synthesis.diagnostic).toBeTruthy();
        expect(synthesis.keyConcept?.title).toBeTruthy();
        expect(synthesis.keyConcept?.explanation).toBeTruthy();
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

    it('adapte la note pédagogique au bear-off (Règle du 6 en sortie)', () => {
        const note = buildBlunderPedagogicalNote({
            phase: 'bearoff',
            category: 'blunder',
            playedNotation: '6/4 5/4',
            optimalNotation: '6/off 5/4',
            equityLoss: 0.112,
        });
        expect(note.keyConcept).toContain('Règle du 6');
    });
});
