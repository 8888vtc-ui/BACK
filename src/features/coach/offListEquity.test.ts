import { describe, it, expect } from 'vitest';
import { createInitialState, generateLegalMoves, type BoardState } from '../../engine/backgammonEngine';
import type { BgsageMove } from '../../lib/engine/bgsageClient';
import { estimateOffListEquityLoss, CATASTROPHIC_LOSS_FLOOR } from './offListEquity';

function cand(equity: number, rank: number): BgsageMove {
    return { rank, notation: `c${rank}`, equity, equityLoss: 0, probabilities: null };
}

describe('estimateOffListEquityLoss — coups hors top-liste Open Sage', () => {
    const state: BoardState = { ...createInitialState(7), turn: 'X', dice: [6, 5] };
    const legal = generateLegalMoves(state, [6, 5]);

    it('applique le plancher neuronal (pire candidat listé) lorsque la liste est tronquée', () => {
        const res = estimateOffListEquityLoss({
            evalState: state,
            playedBoard: legal[0].board,
            legalSeqs: legal,
            candidates: [cand(0.1, 1), cand(-0.02, 2)],
            bestEquity: 0.1,
        });
        expect(res.neuralFloor).toBeCloseTo(0.12, 4);
        expect(res.equityLoss).toBeGreaterThanOrEqual(0.12);
    });

    it('n’applique aucun plancher neuronal si la liste couvre tous les plateaux légaux', () => {
        const distinct = new Set(legal.map((s) => s.board.join(','))).size;
        const all = Array.from({ length: distinct }, (_, i) => cand(0.1 - i * 0.05, i + 1));
        const res = estimateOffListEquityLoss({
            evalState: state,
            playedBoard: legal[0].board,
            legalSeqs: legal,
            candidates: all,
            bestEquity: 0.1,
        });
        expect(res.neuralFloor).toBe(0);
    });

    it('attribue au moins 0.15 à un coup catastrophique (blunder local), jamais un forfait de 0.04', () => {
        // Cherche le coup légal le plus mauvais selon le différentiel local.
        let worst = { loss: -1, board: legal[0].board };
        for (const seq of legal) {
            const r = estimateOffListEquityLoss({
                evalState: state,
                playedBoard: seq.board,
                legalSeqs: legal,
                candidates: [],
                bestEquity: 0,
            });
            if (r.localLoss > worst.loss) worst = { loss: r.localLoss, board: seq.board };
        }
        const res = estimateOffListEquityLoss({
            evalState: state,
            playedBoard: worst.board,
            legalSeqs: legal,
            candidates: [],
            bestEquity: 0,
        });
        expect(res.equityLoss).not.toBe(0.04);
        expect(res.catastrophic).toBe(true);
        expect(res.equityLoss).toBeGreaterThanOrEqual(CATASTROPHIC_LOSS_FLOOR);
        expect(res.equityLoss).toBeGreaterThanOrEqual(res.localLoss);
    });

    it('renvoie 0 pour le meilleur coup local sans liste tronquée', () => {
        let best = { eq: Infinity, board: legal[0].board };
        for (const seq of legal) {
            const r = estimateOffListEquityLoss({
                evalState: state,
                playedBoard: seq.board,
                legalSeqs: legal,
                candidates: [],
                bestEquity: 0,
            });
            if (r.localLoss < best.eq) best = { eq: r.localLoss, board: seq.board };
        }
        expect(best.eq).toBe(0);
    });

    it('renvoie 0 pour un coup qui gagne la partie', () => {
        const board = new Array<number>(26).fill(0);
        board[1] = 1; // dernier pion de X
        board[24] = -15; // O loin derrière
        const endState: BoardState = { ...createInitialState(7), board, turn: 'X', dice: [6, 5] };
        const endLegal = generateLegalMoves(endState, [6, 5]);
        const res = estimateOffListEquityLoss({
            evalState: endState,
            playedBoard: endLegal[0].board,
            legalSeqs: endLegal,
            candidates: [cand(1, 1)],
            bestEquity: 1,
        });
        expect(res.equityLoss).toBe(0);
    });
});
