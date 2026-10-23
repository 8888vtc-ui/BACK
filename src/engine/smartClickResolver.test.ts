import { describe, expect, it } from 'vitest';
import { createInitialState } from './backgammonEngine';
import {
    computeRemainingSequences,
    resolveCombinedFromSource,
    resolveDestinationClick,
    resolveDiceClick,
    sourceScore,
    subMoveDistance,
    type SmartClickContext,
} from './smartClickResolver';

function ctxFor(dice: [number, number], opts: Partial<SmartClickContext> = {}, usedDice: boolean[] = [false, false]): SmartClickContext {
    const { board } = createInitialState();
    return {
        legalSequences: computeRemainingSequences(board, 'X', dice, usedDice),
        board,
        player: 'X',
        selectedSource: null,
        higherDieFirst: true,
        ...opts,
    };
}

describe('smartClickResolver — Destination-First', () => {
    it('3-1 sur la case 5 vide : fait la case (port 8/5 6/5) en un clic', () => {
        const res = resolveDestinationClick(ctxFor([3, 1]), 5);
        expect(res.kind).toBe('port');
        if (res.kind !== 'port') return;
        const froms = res.moves.map((m) => m.from).sort((a, b) => a - b);
        expect(froms).toEqual([6, 8]);
        expect(res.moves.every((m) => m.to === 5)).toBe(true);
    });

    it('6-1 sur la case 7 : fait le bar-point (13/7 8/7)', () => {
        const res = resolveDestinationClick(ctxFor([6, 1]), 7);
        expect(res.kind).toBe('port');
        if (res.kind !== 'port') return;
        expect(res.moves.map((m) => m.from).sort((a, b) => a - b)).toEqual([8, 13]);
    });

    it('pion sélectionné : coup simple depuis ce pion, jamais de port', () => {
        const res = resolveDestinationClick(ctxFor([3, 1], { selectedSource: 8 }), 5);
        expect(res).toEqual({ kind: 'single', moves: [{ from: 8, to: 5 }] });
    });

    it('6-5 sur la case 13 : coup combiné 24/18/13 (remplace le double-clic)', () => {
        const res = resolveDestinationClick(ctxFor([6, 5]), 13);
        expect(res).toEqual({ kind: 'combined', moves: [{ from: 24, to: 18 }, { from: 18, to: 13 }] });
    });

    it('6-4 sur la case 14 : ordre « dé haut d\'abord » configurable', () => {
        const high = resolveDestinationClick(ctxFor([6, 4]), 14);
        expect(high.kind).toBe('combined');
        if (high.kind === 'combined') expect(high.moves[0]).toEqual({ from: 24, to: 18 });

        const low = resolveDestinationClick(ctxFor([6, 4], { higherDieFirst: false }), 14);
        expect(low.kind).toBe('combined');
        if (low.kind === 'combined') expect(low.moves[0]).toEqual({ from: 24, to: 20 });
    });

    it('double 2-2 : combiné 24/22/20 en un clic', () => {
        const res = resolveDestinationClick(ctxFor([2, 2]), 20);
        expect(res).toEqual({ kind: 'combined', moves: [{ from: 24, to: 22 }, { from: 22, to: 20 }] });
    });

    it('destination inatteignable : aucune résolution', () => {
        expect(resolveDestinationClick(ctxFor([3, 1]), 22).kind).toBe('none');
    });
});

describe('smartClickResolver — combiné depuis la source', () => {
    it('6-5 depuis 24 : 24/18/13', () => {
        expect(resolveCombinedFromSource(ctxFor([6, 5]), 24)).toEqual({
            kind: 'combined',
            moves: [{ from: 24, to: 18 }, { from: 18, to: 13 }],
        });
    });

    it('aucun combiné possible pour un pion sans continuation : none', () => {
        expect(resolveCombinedFromSource(ctxFor([3, 1], {}, [true, false]), 8).kind).toBe('none');
    });
});

describe('smartClickResolver — séquences restantes', () => {
    it('un dé déjà joué : seuls les coups du dé restant', () => {
        const { board } = createInitialState();
        const seqs = computeRemainingSequences(board, 'X', [3, 1], [true, false]);
        expect(seqs.length).toBeGreaterThan(0);
        expect(seqs.every((s) => s.length === 1 && subMoveDistance(s[0], 'X') === 1)).toBe(true);
    });

    it('double partiellement joué : longueur = dés restants', () => {
        const { board } = createInitialState();
        const seqs = computeRemainingSequences(board, 'X', [2, 2], [true, true, false, false]);
        expect(seqs.every((s) => s.length === 2)).toBe(true);
    });

    it('sans dés : aucune séquence', () => {
        const { board } = createInitialState();
        expect(computeRemainingSequences(board, 'X', null, [])).toEqual([]);
    });
});

describe('smartClickResolver — heuristique de source & clic sur les dés', () => {
    it('préfère un pion surnuméraire à la casse d\'une case faite', () => {
        const { board } = createInitialState();
        expect(sourceScore(board, 13, 'X')).toBeGreaterThan(sourceScore(board, 24, 'X'));
    });

    it('clic dés : inverser avant le 1er coup, valider en fin de tour, rien sinon', () => {
        expect(resolveDiceClick({ subMovesPlayed: 0, hasRemainingLegalMove: true, isDouble: false, autoConfirm: false })).toBe('swap');
        expect(resolveDiceClick({ subMovesPlayed: 0, hasRemainingLegalMove: true, isDouble: true, autoConfirm: false })).toBe('noop');
        expect(resolveDiceClick({ subMovesPlayed: 2, hasRemainingLegalMove: false, isDouble: false, autoConfirm: false })).toBe('confirm');
        expect(resolveDiceClick({ subMovesPlayed: 1, hasRemainingLegalMove: true, isDouble: false, autoConfirm: false })).toBe('noop');
        expect(resolveDiceClick({ subMovesPlayed: 2, hasRemainingLegalMove: false, isDouble: false, autoConfirm: true })).toBe('noop');
    });
});
