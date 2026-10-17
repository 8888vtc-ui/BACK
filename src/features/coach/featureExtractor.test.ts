import { describe, it, expect } from 'vitest';
import { BoardState, Player, createInitialState, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { extractStrategicFeatures } from './featureExtractor';

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

describe('extractStrategicFeatures — pipCountDiff', () => {
    it("calcule les pip counts et identifie le meneur de la course", () => {
        const initialState = createInitialState(); // X à jouer
        // X joue 24/20 13/11 : pip count X = 167 - 6 = 161, O = 167
        const userEndState = makeState(
            makeBoard({ 24: 1, 20: 1, 13: 4, 11: 1, 8: 3, 6: 5 }, { 1: 2, 12: 5, 17: 3, 19: 5 }),
            'O',
        );
        const features = extractStrategicFeatures(initialState, userEndState, userEndState);
        expect(features.player).toBe('X');
        expect(features.pipCountDiff).toEqual({
            player: 161,
            opponent: 167,
            leader: 'X',
            diff: -6,
        });
    });
});

describe('extractStrategicFeatures — blotsAndShots', () => {
    it('compte les tirs directs et indirects sur un blot', () => {
        const initialState = makeState(makeBoard({ 5: 1, 13: 14 }, { 2: 1, 19: 14 }), 'X');
        // Après le coup : X laisse un blot sur 5, O a un pion à distance 3 (flèche 2)
        const userEndState = makeState(makeBoard({ 5: 1, 13: 14 }, { 2: 1, 19: 14 }), 'O');
        // Meilleur coup : X laisse un blot sur 6, O à distance 4
        const bestEndState = makeState(makeBoard({ 6: 1, 13: 14 }, { 2: 1, 19: 14 }), 'O');

        const features = extractStrategicFeatures(initialState, userEndState, bestEndState);

        // Blot sur 5 : 11 lancers directs (contenant un 3) + 2 indirects (1-2, 2-1)
        expect(features.blotsAndShots.user).toEqual([
            { point: 5, directShots: 11, indirectShots: 2, totalShots: 13 },
        ]);
        // Blot sur 6 : 11 directs (contenant un 4) + 3 indirects (1-3, 2-2, 3-1)
        expect(features.blotsAndShots.best).toEqual([
            { point: 6, directShots: 11, indirectShots: 3, totalShots: 14 },
        ]);
    });

    it('tient compte des portes qui bloquent les rebonds intermédiaires', () => {
        const initialState = makeState(makeBoard({ 5: 1, 3: 2, 4: 2, 13: 10 }, { 2: 1, 19: 14 }), 'X');
        // Les flèches 3 et 4 sont des portes de X : le tir indirect (1-2) est bloqué
        const userEndState = makeState(makeBoard({ 5: 1, 3: 2, 4: 2, 13: 10 }, { 2: 1, 19: 14 }), 'O');
        const features = extractStrategicFeatures(initialState, userEndState, userEndState);
        expect(features.blotsAndShots.user).toEqual([
            { point: 5, directShots: 11, indirectShots: 0, totalShots: 11 },
        ]);
    });
});

describe('extractStrategicFeatures — boardStructure', () => {
    it('analyse la structure du plateau pour X', () => {
        const initialState = makeState(makeBoard({ 5: 2, 6: 2, 7: 2, 20: 2, 13: 7 }, { 1: 2, 12: 5, 17: 3, 19: 5 }), 'X');
        const userEndState = makeState(makeBoard({ 5: 2, 6: 2, 7: 2, 20: 2, 13: 7 }, { 1: 2, 12: 5, 17: 3, 19: 5 }), 'O');
        const features = extractStrategicFeatures(initialState, userEndState, userEndState);
        expect(features.boardStructure).toEqual({
            innerBoardPoints: 2, // portes sur 5 et 6
            advancedAnchor: true, // ancre sur 20
            goldenPoint: true, // Point 5
            barPoint: true, // Point 7
            longestPrime: 3, // 5-6-7
        });
    });

    it('miroir les flèches pour O (perspective relative)', () => {
        const initialState = makeState(makeBoard({ 24: 2, 13: 5, 8: 3, 6: 5 }, { 20: 2, 19: 2, 18: 2, 3: 2, 12: 7 }), 'O');
        const userEndState = makeState(makeBoard({ 24: 2, 13: 5, 8: 3, 6: 5 }, { 20: 2, 19: 2, 18: 2, 3: 2, 12: 7 }), 'X');
        const features = extractStrategicFeatures(initialState, userEndState, userEndState);
        expect(features.player).toBe('O');
        expect(features.boardStructure).toEqual({
            innerBoardPoints: 2, // portes O sur 19 et 20
            advancedAnchor: true, // ancre O sur 3
            goldenPoint: true, // Point 5 de O = flèche 20
            barPoint: true, // Bar Point de O = flèche 18
            longestPrime: 3, // 18-19-20
        });
    });
});

describe('extractStrategicFeatures — contactStatus', () => {
    it('détecte une pure course', () => {
        const initialState = makeState(makeBoard({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 5 }, { 19: 5, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2 }), 'X');
        const userEndState = makeState(makeBoard({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 5 }, { 19: 5, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2 }), 'O');
        const features = extractStrategicFeatures(initialState, userEndState, userEndState);
        expect(features.contactStatus).toBe('pureRace');
    });

    it("détecte une position de contact à l'ouverture", () => {
        const initialState = createInitialState();
        const features = extractStrategicFeatures(initialState, initialState, initialState);
        expect(features.contactStatus).toBe('contact');
    });
});