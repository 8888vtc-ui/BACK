import { describe, it, expect } from 'vitest';
import {
    computeMarketWindowMetrics,
    countExactMarketLosers,
} from './marketWindow';
import {
    createInitialState,
    type BoardState,
    type Player,
    X_BAR,
    O_BAR,
} from '../../engine/backgammonEngine';

function makeBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

function makeState(board: number[], turn: Player): BoardState {
    return {
        board,
        turn,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

describe('countExactMarketLosers', () => {
    it('calcule un nombre élevé de market losers (sur 36) quand l’adversaire est bloqué sur la barre face à un board fermé', () => {
        // X a fermé son board (portes 1, 2, 3, 4, 5, 6) et O a 2 pions sur la barre (O_BAR = 25)
        const board = makeBoard(
            { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 13: 3 },
            { 20: 3, 21: 5, 22: 5 },
            0,
            2, // 2 pions O sur la barre
        );
        // C'est au tour de O (bestEndState après le coup de X)
        const bestEndState = makeState(board, 'O');

        const losers = countExactMarketLosers(bestEndState, 'X', 0.75, 0.5);
        // Face à un board complètement fermé, O ne peut rentrer sur aucun lancer (0/36) :
        // tous les 36 lancers laissent O bloqué et X ultra-dominant, dépassant le Cash Point (36/36)
        expect(losers).toBe(36);
    });

    it('calcule 0 ou peu de market losers dans une position d’ouverture équilibrée', () => {
        const init = createInitialState();
        // Coup optimal sur 3-1 : 8/5 6/5, tour passe à O
        const board = init.board.slice();
        board[8] -= 1;
        board[6] -= 1;
        board[5] += 2;
        const bestEndState = makeState(board, 'O');

        const losers = countExactMarketLosers(bestEndState, 'X', 0.75, 0.5);
        // Après un simple 3-1 d'ouverture, l'équité de X est modérée (~0.60..0.65) :
        // O ne passe pas le videau, le nombre de lancers faisant dépasser 75% est très faible
        expect(losers).toBeLessThanOrEqual(5);
    });
});

describe('computeMarketWindowMetrics', () => {
    it('utilise le calcul exact quand bestEndState et player sont fournis', () => {
        const board = makeBoard(
            { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 13: 3 },
            { 20: 3, 21: 5, 22: 5 },
            0,
            2,
        );
        const bestEndState = makeState(board, 'O');

        const metrics = computeMarketWindowMetrics({
            contactStatus: 'contact',
            boardStructure: {
                innerBoardPoints: 6,
                advancedAnchor: false,
                goldenPoint: true,
                barPoint: false,
                longestPrime: 6,
            },
            blotsAndShots: { user: [], best: [] },
            pipCountDiff: { player: 85, opponent: 160, leader: 'X', diff: -75 },
            opponentTakePoint: 0.25,
            bestEndState,
            player: 'X',
        });

        expect(metrics.cashPoint).toBe(0.75);
        expect(metrics.estimatedMarketLosers).toBe(36);
        expect(metrics.equityVolatilitySigma).toBeDefined();
        expect(metrics.expectedOvershootLoss).toBeGreaterThan(0);
    });

    it('calcule sigma_Eq et L_overshoot sur une position volatile avec répliques adverses variées', () => {
        const init = createInitialState();
        const bestEndState = makeState(init.board.slice(), 'O');
        const metrics = computeMarketWindowMetrics({
            contactStatus: 'contact',
            boardStructure: {
                innerBoardPoints: 1,
                advancedAnchor: false,
                goldenPoint: false,
                barPoint: false,
                longestPrime: 1,
            },
            blotsAndShots: { user: [], best: [] },
            pipCountDiff: { player: 167, opponent: 167, leader: 'tie', diff: 0 },
            bestEndState,
            player: 'X',
        });

        expect(metrics.equityVolatilitySigma).toBeGreaterThanOrEqual(0);
        expect(metrics.expectedOvershootLoss).toBeGreaterThanOrEqual(0);
    });

    it('utilise le repli heuristique propre quand bestEndState est absent', () => {
        const metrics = computeMarketWindowMetrics({
            contactStatus: 'contact',
            boardStructure: {
                innerBoardPoints: 3,
                advancedAnchor: true,
                goldenPoint: true,
                barPoint: false,
                longestPrime: 3,
            },
            blotsAndShots: {
                user: [{ point: 5, directShots: 11, indirectShots: 2, totalShots: 13 }],
                best: [{ point: 7, directShots: 6, indirectShots: 1, totalShots: 7 }],
            },
            pipCountDiff: { player: 140, opponent: 145, leader: 'X', diff: -5 },
            opponentTakePoint: 0.25,
        });

        expect(metrics.doublePoint).toBeGreaterThanOrEqual(0.5);
        expect(metrics.cashPoint).toBe(0.75);
        expect(metrics.estimatedMarketLosers).toBeGreaterThan(0);
        expect(metrics.estimatedMarketLosers).toBeLessThanOrEqual(36);
    });
});
