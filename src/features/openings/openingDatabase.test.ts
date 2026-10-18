import { describe, it, expect } from 'vitest';
import {
    OPENING_BOOK,
    getAllOpenings,
    getOpening,
    isInitialBoardPosition,
    isOpeningSituation,
    findOpeningBookSequenceForOpponent,
} from './openingDatabase';
import { createInitialState, generateLegalMoves } from '../../engine/backgammonEngine';

const INITIAL_BOARD = createInitialState().board;

describe('Opening Database', () => {
    it('contient exactement les 15 jets d’ouverture classiques', () => {
        const openings = getAllOpenings();
        expect(openings).toHaveLength(15);
        expect(OPENING_BOOK).toHaveLength(15);

        // Vérification de l’unicité des jets de dés
        const diceKeys = new Set(openings.map((o) => `${o.dice[0]}-${o.dice[1]}`));
        expect(diceKeys.size).toBe(15);

        const expectedPairs = [
            '6-5', '6-4', '6-3', '6-2', '6-1',
            '5-4', '5-3', '5-2', '5-1',
            '4-3', '4-2', '4-1',
            '3-2', '3-1',
            '2-1',
        ];

        for (const pair of expectedPairs) {
            expect(diceKeys.has(pair)).toBe(true);
        }
    });

    it('chaque entrée possède les métriques rollouts et explications pédagogiques complètes', () => {
        for (const entry of OPENING_BOOK) {
            expect(entry.id).toMatch(/^opening_\d_\d$/);
            expect(entry.name.length).toBeGreaterThan(3);
            expect(entry.bestMoveNotation.length).toBeGreaterThan(3);
            expect(entry.bestMoves.length).toBeGreaterThanOrEqual(1);
            expect(entry.winPercentage).toBeGreaterThan(45);
            expect(entry.winPercentage).toBeLessThan(70);
            expect(entry.gammonPercentage).toBeGreaterThan(5);
            expect(entry.explanation.length).toBeGreaterThan(20);
            expect(entry.keyRule.length).toBeGreaterThan(10);
            expect(entry.alternatives.length).toBeGreaterThanOrEqual(1);

            for (const alt of entry.alternatives) {
                expect(alt.notation.length).toBeGreaterThan(2);
                expect(alt.equityLoss).toBeLessThanOrEqual(0);
                expect(alt.description.length).toBeGreaterThan(10);
            }
        }
    });

    describe('getOpening', () => {
        it('retrouve correctement une ouverture quel que soit l’ordre des dés', () => {
            const entry1 = getOpening(3, 1);
            const entry2 = getOpening(1, 3);
            expect(entry1).toBeDefined();
            expect(entry2).toBeDefined();
            expect(entry1?.id).toBe('opening_3_1');
            expect(entry2?.id).toBe('opening_3_1');
            expect(entry1?.bestMoveNotation).toBe('8/5 6/5');
        });

        it('retrouve les coups emblématiques avec exactitude', () => {
            expect(getOpening(6, 5)?.bestMoveNotation).toBe('24/13');
            expect(getOpening(4, 2)?.bestMoveNotation).toBe('8/4 6/4');
            expect(getOpening(6, 1)?.bestMoveNotation).toBe('13/7 8/7');
            expect(getOpening(6, 4)?.bestMoveNotation).toBe('24/14');
            expect(getOpening(5, 3)?.bestMoveNotation).toBe('8/3 6/3');
            expect(getOpening(5, 1)?.bestMoveNotation).toBe('24/23 13/8');
            expect(getOpening(2, 1)?.bestMoveNotation).toBe('24/23 13/11');
        });

        it('retourne null pour les doubles car ils ne peuvent pas ouvrir la partie', () => {
            expect(getOpening(1, 1)).toBeNull();
            expect(getOpening(3, 3)).toBeNull();
            expect(getOpening(6, 6)).toBeNull();
        });

        it('retourne null pour les valeurs non valides', () => {
            expect(getOpening(7, 2)).toBeNull();
            expect(getOpening(0, 1)).toBeNull();
        });
    });

    describe('isInitialBoardPosition', () => {
        it('reconnaît la position initiale standard du Backgammon', () => {
            expect(isInitialBoardPosition(INITIAL_BOARD)).toBe(true);
        });

        it('rejette une position modifiée ou invalide', () => {
            const modified = [...INITIAL_BOARD];
            modified[24] = 1;
            expect(isInitialBoardPosition(modified)).toBe(false);

            expect(isInitialBoardPosition([])).toBe(false);
            expect(isInitialBoardPosition(null as unknown as number[])).toBe(false);
        });
    });

    describe('isOpeningSituation', () => {
        it('identifie un coup d’ouverture au tour 0 ou 1 avec dés distincts', () => {
            expect(isOpeningSituation(INITIAL_BOARD, [3, 1], 0)).toBe(true);
            expect(isOpeningSituation(INITIAL_BOARD, [6, 2], 1)).toBe(true);
        });

        it('rejette les doubles et les dés nuls', () => {
            expect(isOpeningSituation(INITIAL_BOARD, [4, 4], 0)).toBe(false);
            expect(isOpeningSituation(INITIAL_BOARD, null, 0)).toBe(false);
        });

        it('détecte l’ouverture si le plateau est toujours en position initiale même au tour 2', () => {
            expect(isOpeningSituation(INITIAL_BOARD, [5, 3], 2)).toBe(true);
        });

        it('rejette après l’ouverture si le plateau a bougé', () => {
            const modified = [...INITIAL_BOARD];
            modified[6] = 4;
            expect(isOpeningSituation(modified, [4, 2], 3)).toBe(false);
        });
    });

    describe('findOpeningBookSequenceForOpponent', () => {
        it('trouve le coup d’ouverture certifié pour O sur 3-2 (1/4 12/14)', () => {
            const state = { ...createInitialState(), turn: 'O' as const };
            const dice: [number, number] = [3, 2];
            const legalSeqs = generateLegalMoves(state, dice);

            const bookSeq = findOpeningBookSequenceForOpponent(state.board, dice, legalSeqs);
            expect(bookSeq).not.toBeNull();
            // Le coup optimal 3-2 pour O splitte 1/4 (24/21) et descend 12/14 (13/11)
            expect(bookSeq!.board[1]).toBe(-1); // Un pion reste sur 1
            expect(bookSeq!.board[4]).toBe(-1); // Un pion sur 4
            expect(bookSeq!.board[12]).toBe(-4); // Quatre pions sur 12
            expect(bookSeq!.board[14]).toBe(-1); // Un pion constructeur sur 14
        });

        it('trouve le coup d’ouverture certifié pour O sur 3-1 (17/20 19/20 - Golden Point)', () => {
            const state = { ...createInitialState(), turn: 'O' as const };
            const dice: [number, number] = [3, 1];
            const legalSeqs = generateLegalMoves(state, dice);

            const bookSeq = findOpeningBookSequenceForOpponent(state.board, dice, legalSeqs);
            expect(bookSeq).not.toBeNull();
            // Porte 5 (point 20 pour O) verrouillée
            expect(bookSeq!.board[20]).toBe(-2);
        });

        it('trouve le coup d’ouverture certifié pour O sur 6-5 (1/12 - Lover’s Leap)', () => {
            const state = { ...createInitialState(), turn: 'O' as const };
            const dice: [number, number] = [6, 5];
            const legalSeqs = generateLegalMoves(state, dice);

            const bookSeq = findOpeningBookSequenceForOpponent(state.board, dice, legalSeqs);
            expect(bookSeq).not.toBeNull();
            // Échappée directe du fond vers le point médian
            expect(bookSeq!.board[1]).toBe(-1);
            expect(bookSeq!.board[12]).toBe(-6);
        });

        it('retourne null si le plateau n’est pas en position initiale', () => {
            const modified = [...INITIAL_BOARD];
            modified[6] = 4;
            const state = { ...createInitialState(), board: modified, turn: 'O' as const };
            const dice: [number, number] = [3, 2];
            const legalSeqs = generateLegalMoves(state, dice);

            expect(findOpeningBookSequenceForOpponent(modified, dice, legalSeqs)).toBeNull();
        });
    });
});
