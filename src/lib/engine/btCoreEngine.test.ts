import { describe, it, expect } from 'vitest';
import { createInitialState, applyMove } from '../../engine/backgammonEngine';
import {
    analyzeBtCoreCube,
    analyzeBtCoreMoves,
    computeBtCoreResidualCorrection,
    evaluateBtCoreBoard,
    isPlayerOInitialSetup,
} from './btCoreEngine';

/**
 * BT-Core n'est PLUS un bot (audit GNUBG 3-ply du 2026-11-01 : ~47 % de coups identiques, non exploitable).
 * Il reste uniquement comme évaluateur d'appoint. Les anciens tests « 4. surpasse le Baseline » et
 * « 5. remporte le duel Duplicate » ont été supprimés : ils comparaient BT-Core à lui-même / à sa propre
 * baseline, et ont fait croire à tort que le moteur était fort. Seule référence valable : GNU Backgammon
 * (`scripts/audit_bots_vs_gnubg.ts`).
 */
describe('BT-Core — évaluateur d’appoint (non utilisé comme bot)', () => {
    it('1. Évalue la position initiale à ~50 % et valorise le Golden Point', () => {
        const initial = createInitialState(7);
        const evalInit = evaluateBtCoreBoard(initial);
        expect(evalInit.probabilities.win).toBeGreaterThan(0.45);
        expect(evalInit.probabilities.win).toBeLessThan(0.55);

        let afterGolden = initial.board.slice();
        afterGolden = applyMove(afterGolden, { from: 8, to: 5 }, 'X');
        afterGolden = applyMove(afterGolden, { from: 6, to: 5 }, 'X');
        const residualGolden = computeBtCoreResidualCorrection(initial.board, afterGolden, 'X');
        expect(residualGolden).toBeGreaterThan(0.10);
    });

    it('2. Reconnaît la configuration intacte de O au Tour 2', () => {
        const initial = createInitialState(7);
        let boardAfterX = initial.board.slice();
        boardAfterX = applyMove(boardAfterX, { from: 24, to: 20 }, 'X');
        boardAfterX = applyMove(boardAfterX, { from: 13, to: 10 }, 'X');

        expect(isPlayerOInitialSetup(boardAfterX)).toBe(true);

        const stateTurn2 = {
            ...initial,
            board: boardAfterX,
            turn: 'O' as const,
            dice: [3, 1] as [number, number],
        };
        const res = analyzeBtCoreMoves(stateTurn2, [3, 1], { ply: 2 });
        expect(res.bestMove?.notation).toBe('8/5 6/5');
    });

    it('3. Respecte la règle de Crawford pour le videau', () => {
        const crawfordState = {
            ...createInitialState(7),
            scoreX: 6,
            scoreO: 4,
            crawford: true,
        };
        const crawfordCube = analyzeBtCoreCube(crawfordState);
        expect(crawfordCube.optimalAction).toContain('Crawford');
    });
});
