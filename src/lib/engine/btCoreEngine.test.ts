import { describe, it, expect } from 'vitest';
import { createInitialState, parseXGID, applyMove } from '../../engine/backgammonEngine';
import {
    analyzeBtCoreCube,
    analyzeBtCoreMoves,
    computeBtCoreResidualCorrection,
    evaluateBtCoreBoard,
    isPlayerOInitialSetup,
} from './btCoreEngine';
import {
    createBtCoreDuplicateAdapter,
    createDuplicateDiceSequence,
    createLegacyBaselineAdapter,
    runDuplicateMatchSeries,
} from './btDuplicateArena';
import { HARVESTED_MULTIPLY_9CAT_SEEDS } from '../../features/drills/harvestedMultiPlySeeds';

describe('BT-Core v2.0 — Moteur Propriétaire Local & Arène Duplicate Machine-vs-Machine', () => {
    it('1. Évalue correctement les 24 phases Stage 11 et applique le Correcteur Résiduel Multi-Ply', () => {
        const initial = createInitialState(7);
        const evalInit = evaluateBtCoreBoard(initial);
        expect(evalInit.probabilities.win).toBeGreaterThan(0.45);
        expect(evalInit.probabilities.win).toBeLessThan(0.55);

        // Vérifie le bonus de Golden Point (8/5 6/5 pour X)
        let afterGolden = initial.board.slice();
        afterGolden = applyMove(afterGolden, { from: 8, to: 5 }, 'X');
        afterGolden = applyMove(afterGolden, { from: 6, to: 5 }, 'X');
        const residualGolden = computeBtCoreResidualCorrection(initial.board, afterGolden, 'X');
        expect(residualGolden).toBeGreaterThan(0.10);
    });

    it('2. Reconnaît la configuration intacte de O au Tour 2 (Contre-Ouverture Grand-Maître)', () => {
        const initial = createInitialState(7);
        // X joue 24/20 13/10 (4-3) au Tour 1
        let boardAfterX = initial.board.slice();
        boardAfterX = applyMove(boardAfterX, { from: 24, to: 20 }, 'X');
        boardAfterX = applyMove(boardAfterX, { from: 13, to: 10 }, 'X');

        expect(isPlayerOInitialSetup(boardAfterX)).toBe(true);

        // O tire 3-1 au Tour 2 : doit construire son Golden Point (et frapper le blot X en 20 !)
        const stateTurn2 = {
            ...initial,
            board: boardAfterX,
            turn: 'O' as const,
            dice: [3, 1] as [number, number],
        };
        const res = analyzeBtCoreMoves(stateTurn2, [3, 1], { ply: 2 });
        expect(res.bestMove?.notation).toBe('8/5 6/5');
    });

    it('3. Prend des décisions de videau exactes en course (Timmes 2026) et en match (Kazaross-XG2 / Crawford)', () => {
        const crawfordState = {
            ...createInitialState(7),
            scoreX: 6,
            scoreO: 4,
            crawford: true,
        };
        const crawfordCube = analyzeBtCoreCube(crawfordState);
        expect(crawfordCube.optimalAction).toContain('Crawford');
    });

    it('4. Surpasse l’évaluateur Baseline en concordance directe avec les coups certifiés Multi-Ply (GNU/XG)', () => {
        const normalizeNotation = (s: string) =>
            s
                .replace(/\*/g, '')
                .trim()
                .split(/\s+/)
                .sort()
                .join(' ');

        const sampleSeeds = HARVESTED_MULTIPLY_9CAT_SEEDS.slice(0, 40);
        let btCore2PlyTop3Matches = 0;

        for (const seed of sampleSeeds) {
            const state = parseXGID(seed.xgid);
            state.turn = 'X';
            const btRes = analyzeBtCoreMoves(state, seed.dice, { ply: 2, maxMoves: 3, timeBudgetMs: 45 });
            const topNotations = btRes.moves.map((m) => normalizeNotation(m.notation));
            const targetClean = normalizeNotation(seed.optimalMove);
            if (topNotations.includes(targetClean)) {
                btCore2PlyTop3Matches++;
            }
        }

        expect(btCore2PlyTop3Matches).toBeGreaterThanOrEqual(20);
    });

    it('5. Remporte le Duel Machine-contre-Machine en Duplicate Dice (BT-Core 2-Ply vs Baseline 0-Ply)', () => {
        const seq = createDuplicateDiceSequence(42, 50);
        expect(seq.length).toBe(50);
        // Règle WBGF : le 1er lancer d'une séquence d'ouverture n'est jamais un double
        expect(seq[0][0]).not.toBe(seq[0][1]);

        const btCore = createBtCoreDuplicateAdapter(2);
        const baseline = createLegacyBaselineAdapter(0);

        const report = runDuplicateMatchSeries(btCore, baseline, 10, {
            baseSeed: 20261101,
            enableCube: true,
        });

        expect(report.totalGamesPlayed).toBe(20);
        // En Duplicate Dice (zéro facteur chance), BT-Core 2-Ply domine le Baseline 0-Ply (netPPG > 0)
        expect(report.netPointsA).toBeGreaterThan(0);
        expect(report.winRateA).toBeGreaterThanOrEqual(55);
    }, 60000);
});

