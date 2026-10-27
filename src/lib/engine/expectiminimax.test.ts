import { describe, it, expect } from 'vitest';
import {
    DISTINCT_DICE_ROLLS_21,
    evaluatePositionExpectiminimax2Ply,
    refineTopCandidatesExpectiminimax2Ply,
    type ScoredCandidate,
} from './expectiminimax';
import {
    createInitialState,
    type BoardState,
    type MoveSequence,
} from '../../engine/backgammonEngine';
import { evaluateBoard } from './evaluator';

describe('DISTINCT_DICE_ROLLS_21', () => {
    it('comporte exactement 21 lancers distincts', () => {
        expect(DISTINCT_DICE_ROLLS_21).toHaveLength(21);
    });

    it('la somme des poids vaut exactement 36 (6 doubles de poids 1 et 15 non-doubles de poids 2)', () => {
        const totalWeight = DISTINCT_DICE_ROLLS_21.reduce((sum, item) => sum + item.weight, 0);
        expect(totalWeight).toBe(36);

        const doubles = DISTINCT_DICE_ROLLS_21.filter((r) => r.dice[0] === r.dice[1]);
        const nonDoubles = DISTINCT_DICE_ROLLS_21.filter((r) => r.dice[0] !== r.dice[1]);

        expect(doubles).toHaveLength(6);
        expect(nonDoubles).toHaveLength(15);
        expect(doubles.every((d) => d.weight === 1)).toBe(true);
        expect(nonDoubles.every((nd) => nd.weight === 2)).toBe(true);
    });
});

describe('evaluatePositionExpectiminimax2Ply', () => {
    it('calcule une équité et des probabilités valides sur une position standard', () => {
        const state: BoardState = {
            ...createInitialState(),
            turn: 'O', // tour adverse
            dice: null,
        };

        const result = evaluatePositionExpectiminimax2Ply(state, (s) => evaluateBoard(s, 0));
        expect(result.equity).toBeGreaterThanOrEqual(-1.5);
        expect(result.equity).toBeLessThanOrEqual(1.5);
        expect(result.probabilities.win).toBeGreaterThan(0);
        expect(result.probabilities.win).toBeLessThan(1);
    });
});

describe('refineTopCandidatesExpectiminimax2Ply', () => {
    it('respecte le budget temps sans crash quand timeBudgetMs est minimal', () => {
        const state = createInitialState();
        const dummyCandidates: ScoredCandidate[] = [
            {
                seq: { moves: [{ from: 24, to: 20 }], board: state.board.slice() },
                equity: 0.1,
                probabilities: { win: 0.55, winGammon: 0.1, winBackgammon: 0.01, loseWin: 0.45, loseGammon: 0.1, loseBackgammon: 0.01 },
                notation: '24/20',
            },
            {
                seq: { moves: [{ from: 13, to: 9 }], board: state.board.slice() },
                equity: 0.05,
                probabilities: { win: 0.52, winGammon: 0.1, winBackgammon: 0.01, loseWin: 0.48, loseGammon: 0.1, loseBackgammon: 0.01 },
                notation: '13/9',
            },
        ];

        // Avec 0ms de budget, il doit interrompre proprement
        const refined = refineTopCandidatesExpectiminimax2Ply(
            state,
            dummyCandidates,
            (s) => evaluateBoard(s, 0),
            { maxCandidates: 6, timeBudgetMs: 0 },
        );

        expect(refined).toHaveLength(2);
        expect(refined[0].equity).toBeGreaterThanOrEqual(refined[1].equity);
    });

    it('affine le classement des Top candidats avec le vrai évaluateur', () => {
        const state = createInitialState();
        // Deux coups plausibles pour X sur 3-1 : 8/5 6/5 (porte du 5, très fort) vs 24/23 13/10 (laisse un blot)
        const boardGolden = state.board.slice();
        boardGolden[8] -= 1;
        boardGolden[6] -= 1;
        boardGolden[5] += 2;

        const boardBlot = state.board.slice();
        boardBlot[24] -= 1;
        boardBlot[23] += 1;
        boardBlot[13] -= 1;
        boardBlot[10] += 1;

        const candidates: ScoredCandidate[] = [
            {
                seq: { moves: [{ from: 8, to: 5 }, { from: 6, to: 5 }], board: boardGolden },
                equity: 0.2,
                probabilities: { win: 0.6, winGammon: 0.15, winBackgammon: 0.01, loseWin: 0.4, loseGammon: 0.1, loseBackgammon: 0.01 },
                notation: '8/5 6/5',
            },
            {
                seq: { moves: [{ from: 24, to: 23 }, { from: 13, to: 10 }], board: boardBlot },
                equity: 0.1,
                probabilities: { win: 0.53, winGammon: 0.1, winBackgammon: 0.01, loseWin: 0.47, loseGammon: 0.1, loseBackgammon: 0.01 },
                notation: '24/23 13/10',
            },
        ];

        const refined = refineTopCandidatesExpectiminimax2Ply(
            state,
            candidates,
            (s) => evaluateBoard(s, 0),
            { maxCandidates: 2, timeBudgetMs: 200 },
        );

        expect(refined[0].notation).toBe('8/5 6/5');
        expect(refined[0].equity).toBeGreaterThan(refined[1].equity);
    });
});
