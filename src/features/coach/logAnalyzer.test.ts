/**
 * Tests unitaires du pipeline d'analyse log-driven (Règle d'or n°1, n°2, n°3)
 * et de la couche moteur Open Sage (Audit 3 : cache LRU & offListEquity).
 */

import { describe, it, expect, vi } from 'vitest';
import { createInitialState, applyMove, generateLegalMoves, type BoardState } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import {
    classifyVerdict,
    verdictLabel,
    analyzeHumanMoveFromLog,
    reconstructBoardFromLog,
    VERDICT_THRESHOLDS,
} from './logAnalyzer';
import { estimateOffListEquityLoss, CATASTROPHIC_LOSS_FLOOR } from './offListEquity';
import {
    ensureBgsageSafeXgid,
    evaluateWithBgsage,
    clearBgsageEvaluationCache,
    bgsageEvaluationCacheSize,
} from '../../lib/engine/bgsageClient';

describe('classifyVerdict — 4 paliers (Règle d\'or n°3)', () => {
    it('classe Optimal ✅ pour une perte ≤ 0.010', () => {
        expect(classifyVerdict(0)).toBe('optimal');
        expect(classifyVerdict(0.005)).toBe('optimal');
        expect(classifyVerdict(0.01)).toBe('optimal');
    });

    it('classe Bon 👍 pour une perte ≤ 0.020', () => {
        expect(classifyVerdict(0.011)).toBe('good');
        expect(classifyVerdict(0.02)).toBe('good');
    });

    it('classe Imprécision ⚠️ pour une perte entre 0.020 et 0.080', () => {
        expect(classifyVerdict(0.021)).toBe('inaccuracy');
        expect(classifyVerdict(0.05)).toBe('inaccuracy');
        expect(classifyVerdict(0.08)).toBe('inaccuracy');
    });

    it('classe Blunder ❌ pour une perte > 0.080', () => {
        expect(classifyVerdict(0.081)).toBe('blunder');
        expect(classifyVerdict(0.15)).toBe('blunder');
    });

    it('gère les pertes négatives (bornées en valeur absolue)', () => {
        expect(classifyVerdict(-0.005)).toBe('optimal');
        expect(classifyVerdict(-0.1)).toBe('blunder');
    });

    it('fournit des libellés lisibles', () => {
        expect(verdictLabel('optimal')).toBe('Optimal ✅');
        expect(verdictLabel('good')).toBe('Bon 👍');
        expect(verdictLabel('inaccuracy')).toBe('Imprécision ⚠️');
        expect(verdictLabel('blunder')).toBe('Blunder ❌');
    });

    it('expose des seuils cohérents', () => {
        expect(VERDICT_THRESHOLDS.OPTIMAL).toBe(0.01);
        expect(VERDICT_THRESHOLDS.GOOD).toBe(0.02);
        expect(VERDICT_THRESHOLDS.BLUNDER).toBe(0.08);
    });
});

describe('analyzeHumanMoveFromLog — Log-Driven (Règle d\'or n°1 & n°2)', () => {
    const board = createInitialState().board;

    function makeLogEntry(player: 'X' | 'O', movePlayed: { from: number; to: number }[]): MatchLogEntry {
        return Object.freeze({
            turnIndex: 1,
            player,
            dice: Object.freeze([3, 1]) as readonly [number, number],
            boardBefore: Object.freeze([...board]),
            movePlayed: Object.freeze(movePlayed.map((m) => ({ ...m }))),
            boardAfter: Object.freeze([...board]),
            notation: movePlayed.map((m) => `${m.from}/${m.to}`).join(' '),
        });
    }

    it('ignore STRICTEMENT les coups de l\'IA (O) — retourne null', () => {
        const aiEntry = makeLogEntry('O', [{ from: 1, to: 4 }]);
        const result = analyzeHumanMoveFromLog({ logEntry: aiEntry, localPlayer: 'X' });
        expect(result).toBeNull();
    });

    it('évalue le coup du joueur X depuis boardBefore et retourne une analyse complète', () => {
        const humanEntry = makeLogEntry('X', [
            { from: 8, to: 5 },
            { from: 6, to: 5 },
        ]);
        const result = analyzeHumanMoveFromLog({ logEntry: humanEntry, localPlayer: 'X' });

        expect(result).not.toBeNull();
        expect(result?.player).toBe('X');
        expect(result?.playedNotation).toContain('8/5');
        expect(result?.optimalNotation).toBeDefined();
        expect(result?.verdict).toBe('optimal');
        expect(result?.equityLoss).toBeCloseTo(0, 2);
        expect(result?.bestEquity).toBeDefined();
        expect(result?.playedEquity).toBeDefined();
    });

    it('calcule une perte d\'équité non négative (equityLoss >= 0)', () => {
        const humanEntry = makeLogEntry('X', [{ from: 8, to: 5 }]);
        const result = analyzeHumanMoveFromLog({ logEntry: humanEntry, localPlayer: 'X' });
        if (result) {
            expect(result.equityLoss).toBeGreaterThanOrEqual(0);
        }
    });

    it('respecte la condition stricte localPlayer (X par défaut)', () => {
        const aiEntry = makeLogEntry('O', [{ from: 1, to: 4 }]);
        const result = analyzeHumanMoveFromLog({ logEntry: aiEntry });
        expect(result).toBeNull();
    });
});

describe('reconstructBoardFromLog & Audit 3 (Cache LRU + Off-List Blunders)', () => {
    it('rejoue séquentiellement les coups pour reconstruire la position exacte', () => {
        const initial = createInitialState().board;

        const entry1: MatchLogEntry = Object.freeze({
            turnIndex: 1,
            player: 'X',
            dice: Object.freeze([3, 1]) as readonly [number, number],
            boardBefore: Object.freeze([...initial]),
            movePlayed: Object.freeze([
                { from: 8, to: 5 },
                { from: 6, to: 5 },
            ]),
            boardAfter: Object.freeze([...initial]),
        });

        const entry2: MatchLogEntry = Object.freeze({
            turnIndex: 2,
            player: 'O',
            dice: Object.freeze([4, 2]) as readonly [number, number],
            boardBefore: Object.freeze([...initial]),
            movePlayed: Object.freeze([{ from: 1, to: 5 }]),
            boardAfter: Object.freeze([...initial]),
        });

        const log = [entry1, entry2];
        expect(reconstructBoardFromLog(log, 1)).toEqual(initial);

        const before2 = reconstructBoardFromLog(log, 2);
        expect(before2).not.toBeNull();
        expect(before2![5]).toBe(initial[5] + 2);
        expect(before2![8]).toBe(initial[8] - 1);
        expect(before2![6]).toBe(initial[6] - 1);
    });

    it('retourne la position initiale pour un turnIndex hors log', () => {
        const initial = createInitialState().board;
        expect(reconstructBoardFromLog([], 1)).toEqual(initial);
    });

    it('identifie un coup intermédiaire (24/18 18/13) comme équivalent à 24/13 sans faux blunder', () => {
        const initial = createInitialState().board;
        let boardAfter = applyMove(initial, { from: 24, to: 18 }, 'X');
        boardAfter = applyMove(boardAfter, { from: 18, to: 13 }, 'X');

        const loversLeapEntry: MatchLogEntry = Object.freeze({
            turnIndex: 1,
            player: 'X',
            dice: Object.freeze([6, 5]) as readonly [number, number],
            boardBefore: Object.freeze([...initial]),
            movePlayed: Object.freeze([
                { from: 24, to: 18 },
                { from: 18, to: 13 },
            ]),
            boardAfter: Object.freeze([...boardAfter]),
        });

        const analysis = analyzeHumanMoveFromLog({ logEntry: loversLeapEntry });
        expect(analysis).not.toBeNull();
        expect(analysis!.verdict).toBe('optimal');
        expect(analysis!.equityLoss).toBe(0);
        expect(analysis!.optimalNotation).toBe('24/13');
        expect(analysis!.isBlunder).toBe(false);
    });

    it('reconnaît un coup joué dans l\'ordre inverse des dés (8/7 13/7 sur 6-1) comme optimal (0 perte)', () => {
        const initial = createInitialState().board;
        let boardAfter = applyMove(initial, { from: 8, to: 7 }, 'X');
        boardAfter = applyMove(boardAfter, { from: 13, to: 7 }, 'X');

        const reverseOrderEntry: MatchLogEntry = Object.freeze({
            turnIndex: 1,
            player: 'X',
            dice: Object.freeze([6, 1]) as readonly [number, number],
            boardBefore: Object.freeze([...initial]),
            movePlayed: Object.freeze([
                { from: 8, to: 7 },
                { from: 13, to: 7 },
            ]),
            boardAfter: Object.freeze([...boardAfter]),
        });

        const analysis = analyzeHumanMoveFromLog({ logEntry: reverseOrderEntry });
        expect(analysis).not.toBeNull();
        expect(analysis!.verdict).toBe('optimal');
        expect(analysis!.equityLoss).toBe(0);
        expect(analysis!.isBlunder).toBe(false);
    });

    it('protège un XGID frontend dont la flèche 24 est vide (ensureBgsageSafeXgid)', () => {
        const vacated24Xgid = 'XGID=-B---e-c---Ee---C-E----b--:1:0:0:42:0:1:0:0:0:7';
        const safe = ensureBgsageSafeXgid(vacated24Xgid);
        expect(safe).toBe('XGID=-B---e-c---Ee---C-E----b-0:1:0:0:42:0:1:0:0:0:7');
    });

    it('met en cache LRU les réponses evaluateWithBgsage par clé `${safeXgid}|${ply}` et renvoie une copie sans appel réseau', async () => {
        clearBgsageEvaluationCache();
        const mockPayload = {
            chequerPlay: [{ rank: 1, notation: '8/5 6/5', equity: 0.18, equityLoss: 0, probabilities: null }],
            cubeDecision: { optimalAction: 'No Double' },
        };
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockPayload), { status: 200 }),
        );

        try {
            const xgid = 'XGID=-b----E-C---eE---c-e----B-:1:0:0:31:0:0:0:0:0:7';
            const res1 = await evaluateWithBgsage(xgid, 2);
            expect(res1).not.toBeNull();
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(bgsageEvaluationCacheSize()).toBe(1);

            // Mutation locale : ne doit pas altérer l'entrée en cache
            res1!.chequerPlay[0].equity = 999;

            const res2 = await evaluateWithBgsage(xgid, 2);
            expect(fetchSpy).toHaveBeenCalledTimes(1); // 0 appel réseau supplémentaire
            expect(res2!.chequerPlay[0].equity).toBe(0.18);
        } finally {
            fetchSpy.mockRestore();
            clearBgsageEvaluationCache();
        }
    });

    it('attribue un equityLoss >= 0.15 (blunder) à un coup hors-liste catastrophique au lieu de plafonner à 0.04', () => {
        const state: BoardState = {
            ...createInitialState(7),
            turn: 'X',
            dice: [3, 1],
        };
        const legalSeqs = generateLegalMoves(state, [3, 1]);
        // Coup catastrophique sur 3-1 : casser le point 6 en laissant des blots exposés (6/3 6/5)
        let catastrophicBoard = applyMove(state.board, { from: 24, to: 21 }, 'X');
        catastrophicBoard = applyMove(catastrophicBoard, { from: 6, to: 5 }, 'X');

        const res = estimateOffListEquityLoss({
            evalState: state,
            playedBoard: catastrophicBoard,
            legalSeqs,
            candidates: [{ rank: 1, notation: '8/5 6/5', equity: 0.18, equityLoss: 0, probabilities: null }],
            bestEquity: 0.18,
            ply: 2,
        });

        expect(res.catastrophic).toBe(true);
        expect(res.equityLoss).toBeGreaterThanOrEqual(CATASTROPHIC_LOSS_FLOOR);
        expect(classifyVerdict(res.equityLoss)).toBe('blunder');
    });
});
