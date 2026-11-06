import { describe, it, expect } from 'vitest';
import {
    areMoveNotationsBoardEquivalent,
    boardSignatureAfterNotation,
    validateDrillMove,
    validateDrillNotationChoice,
} from '../blunderDrillEngine';
import { createInitialState, X_BAR, O_BAR, type Move } from '../../../engine/backgammonEngine';
import type { PlayerBlunderRecord } from '../types';

function makeBlunder(
    board: number[],
    optimalMove: string,
    player: 'X' | 'O' = 'X',
    dice: [number, number] = [3, 1],
): PlayerBlunderRecord {
    return {
        id: 'test_blunder_perm',
        createdAt: '2026-11-06T12:00:00Z',
        conceptId: 'test_concept',
        conceptName: 'Test Concept',
        explanation: 'Explication optimale',
        verdict: 'blunder',
        tier: 2,
        board: [...board],
        dice,
        player,
        playedMove: '24/23 24/23',
        optimalMove,
        equityLoss: 0.150,
        timesReviewed: 0,
        timesSolved: 0,
        isMastered: false,
        hint: 'Indice',
        whyFailed: 'Explication piège',
    };
}

describe('Mission 29 : Contrôle des Permutations de Dés Équivalentes (50 Configurations)', () => {
    const baseBoard = createInitialState(5).board;

    // -------------------------------------------------------------------------
    // SECTION 1 : Permutations de 2 sous-mouvements indépendants sans frappe (15 cas)
    // -------------------------------------------------------------------------
    describe('1. Deux sous-mouvements indépendants sans frappe (15 cas)', () => {
        const cases = [
            { a: '8/5 7/4', b: '7/4 8/5', desc: '8/5 7/4 === 7/4 8/5' },
            { a: '13/8 13/9', b: '13/9 13/8', desc: '13/8 13/9 === 13/9 13/8' },
            { a: '24/20 13/11', b: '13/11 24/20', desc: '24/20 13/11 === 13/11 24/20' },
            { a: '6/1 6/2', b: '6/2 6/1', desc: '6/1 6/2 === 6/2 6/1' },
            { a: '24/23 24/18', b: '24/18 24/23', desc: '24/23 24/18 === 24/18 24/23' },
            { a: '13/10 8/4', b: '8/4 13/10', desc: '13/10 8/4 === 8/4 13/10' },
            { a: '6/5 6/3', b: '6/3 6/5', desc: '6/5 6/3 === 6/3 6/5' },
            { a: '8/7 8/5', b: '8/5 8/7', desc: '8/7 8/5 === 8/5 8/7' },
            { a: '13/11 6/3', b: '6/3 13/11', desc: '13/11 6/3 === 6/3 13/11' },
            { a: '24/22 13/8', b: '13/8 24/22', desc: '24/22 13/8 === 13/8 24/22' },
            { a: '13/10 13/8', b: '13/8 13/10', desc: '13/10 13/8 === 13/8 13/10' },
            { a: '8/3 6/2', b: '6/2 8/3', desc: '8/3 6/2 === 6/2 8/3' },
            { a: '7/2 6/4', b: '6/4 7/2', desc: '7/2 6/4 === 6/4 7/2' },
            { a: '24/21 13/9', b: '13/9 24/21', desc: '24/21 13/9 === 13/9 24/21' },
            { a: '13/7 8/6', b: '8/6 13/7', desc: '13/7 8/6 === 8/6 13/7' },
        ];

        cases.forEach(({ a, b, desc }, idx) => {
            it(`Cas ${idx + 1} : ${desc}`, () => {
                expect(areMoveNotationsBoardEquivalent(baseBoard, a, b, 'X')).toBe(true);

                const blunder = makeBlunder(baseBoard, a, 'X');
                const res = validateDrillNotationChoice(blunder, b);
                expect(res.isCorrect).toBe(true);
                expect(res.verdict).toBe('optimal');
                expect(res.equityLoss).toBe(0);

                if (idx === 0) {
                    const resAttempt = validateDrillMove(blunder, [{ from: 7, to: 4 }, { from: 8, to: 5 }]);
                    expect(resAttempt.isCorrect).toBe(true);
                    expect(resAttempt.verdict).toBe('optimal');
                    expect(resAttempt.equityLoss).toBe(0);
                }
            });
        });
    });

    // -------------------------------------------------------------------------
    // SECTION 2 : Permutations depuis la même flèche d’origine (5 cas)
    // -------------------------------------------------------------------------
    describe('2. Deux pions distincts déplacés depuis la même flèche (5 cas)', () => {
        const samePointCases = [
            { a: '13/10 13/8', b: '13/8 13/10', desc: 'Deux pions de 13 vers 10 et 8' },
            { a: '24/22 24/20', b: '24/20 24/22', desc: 'Deux pions de 24 vers 22 et 20' },
            { a: '8/5 8/4', b: '8/4 8/5', desc: 'Deux pions de 8 vers 5 et 4' },
            { a: '6/3 6/2', b: '6/2 6/3', desc: 'Deux pions de 6 vers 3 et 2' },
            { a: '13/9 13/11', b: '13/11 13/9', desc: 'Deux pions de 13 vers 9 et 11' },
        ];

        samePointCases.forEach(({ a, b, desc }, idx) => {
            it(`Cas ${idx + 16} : ${desc}`, () => {
                expect(areMoveNotationsBoardEquivalent(baseBoard, a, b, 'X')).toBe(true);

                const blunder = makeBlunder(baseBoard, a, 'X');
                const res = validateDrillNotationChoice(blunder, b);
                expect(res.isCorrect).toBe(true);
                expect(res.verdict).toBe('optimal');
                expect(res.equityLoss).toBe(0);
            });
        });
    });

    // -------------------------------------------------------------------------
    // SECTION 3 : Permutations de Doubles (3 ou 4 sous-mouvements) (10 cas)
    // -------------------------------------------------------------------------
    describe('3. Permutations de Doubles (3 ou 4 sous-mouvements) (10 cas)', () => {
        const doubleCases = [
            { a: '13/11 13/11 8/6 8/6', b: '8/6 8/6 13/11 13/11', desc: 'Double 2 : 13/11(2) 8/6(2) inversé' },
            { a: '13/11 8/6 13/11 8/6', b: '8/6 13/11 8/6 13/11', desc: 'Double 2 : Entrelacé 13/11 et 8/6' },
            { a: '24/22 24/22 13/11 13/11', b: '13/11 13/11 24/22 24/22', desc: 'Double 2 : 24/22(2) 13/11(2)' },
            { a: '8/5 8/5 6/3 6/3', b: '6/3 6/3 8/5 8/5', desc: 'Double 3 : 8/5(2) 6/3(2)' },
            { a: '24/23 24/23 13/12 13/12', b: '13/12 24/23 13/12 24/23', desc: 'Double 1 : 24/23(2) 13/12(2) entrelacé' },
            { a: '13/10 13/10 8/5 8/5', b: '8/5 8/5 13/10 13/10', desc: 'Double 3 : 13/10(2) 8/5(2)' },
            { a: '6/2 6/2 8/4 8/4', b: '8/4 6/2 8/4 6/2', desc: 'Double 4 : 6/2(2) 8/4(2)' },
            { a: '13/7 13/7 8/2 8/2', b: '8/2 13/7 8/2 13/7', desc: 'Double 6 : 13/7(2) 8/2(2)' },
            { a: '24/20 24/20 13/9 13/9', b: '13/9 24/20 13/9 24/20', desc: 'Double 4 : 24/20(2) 13/9(2)' },
            { a: '10/8 10/8 8/6 8/6', b: '8/6 10/8 8/6 10/8', desc: 'Double 2 : 10/8(2) 8/6(2)' },
        ];

        doubleCases.forEach(({ a, b, desc }, idx) => {
            it(`Cas ${idx + 21} : ${desc}`, () => {
                const bBoard = [...baseBoard];
                bBoard[10] = 2; // Support pour cas 10/8
                expect(areMoveNotationsBoardEquivalent(bBoard, a, b, 'X')).toBe(true);

                const blunder = makeBlunder(bBoard, a, 'X', [2, 2]);
                const res = validateDrillNotationChoice(blunder, b);
                expect(res.isCorrect).toBe(true);
                expect(res.verdict).toBe('optimal');
                expect(res.equityLoss).toBe(0);
            });
        });
    });

    // -------------------------------------------------------------------------
    // SECTION 4 : Permutations avec Frappes Multiples Équivalentes (10 cas)
    // -------------------------------------------------------------------------
    describe('4. Permutations avec Frappes Multiples Équivalentes (10 cas)', () => {
        it('Cas 31 : Blots adverses en 5 et 4 -> 8/5* 7/4* === 7/4* 8/5* (2 pions sur O_BAR)', () => {
            const b = [...baseBoard];
            b[5] = -1;
            b[4] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '8/5* 7/4*', '7/4* 8/5*', 'X')).toBe(true);

            const blunder = makeBlunder(b, '8/5* 7/4*', 'X');
            const res = validateDrillNotationChoice(blunder, '7/4* 8/5*');
            expect(res.isCorrect).toBe(true);
            expect(res.verdict).toBe('optimal');
            expect(res.equityLoss).toBe(0);
        });

        it('Cas 32 : Blots adverses en 20 et 11 -> 24/20* 13/11* === 13/11* 24/20*', () => {
            const b = [...baseBoard];
            b[20] = -1;
            b[11] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '24/20* 13/11*', '13/11* 24/20*', 'X')).toBe(true);
        });

        it('Cas 33 : Blots adverses en 10 et 8 -> 13/10* 13/8* === 13/8* 13/10*', () => {
            const b = [...baseBoard];
            b[10] = -1;
            b[8] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '13/10* 13/8*', '13/8* 13/10*', 'X')).toBe(true);
        });

        it('Cas 34 : Blots adverses en 9 et 3 -> 13/9* 6/3* === 6/3* 13/9*', () => {
            const b = [...baseBoard];
            b[9] = -1;
            b[3] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '13/9* 6/3*', '6/3* 13/9*', 'X')).toBe(true);
        });

        it('Cas 35 : Blots adverses en 22 et 18 -> 24/22* 24/18* === 24/18* 24/22*', () => {
            const b = [...baseBoard];
            b[22] = -1;
            b[18] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '24/22* 24/18*', '24/18* 24/22*', 'X')).toBe(true);
        });

        it('Cas 36 : Blots adverses en 7 et 5 -> 8/7* 8/5* === 8/5* 8/7*', () => {
            const b = [...baseBoard];
            b[7] = -1;
            b[5] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '8/7* 8/5*', '8/5* 8/7*', 'X')).toBe(true);
        });

        it('Cas 37 : Blots adverses en 11 et 4 -> 13/11* 8/4* === 8/4* 13/11*', () => {
            const b = [...baseBoard];
            b[11] = -1;
            b[4] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '13/11* 8/4*', '8/4* 13/11*', 'X')).toBe(true);
        });

        it('Cas 38 : Blots adverses en 2 et 1 -> 6/2* 6/1* === 6/1* 6/2*', () => {
            const b = [...baseBoard];
            b[2] = -1;
            b[1] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '6/2* 6/1*', '6/1* 6/2*', 'X')).toBe(true);
        });

        it('Cas 39 : Blots adverses en 4 et 2 -> 8/4* 6/2* === 6/2* 8/4*', () => {
            const b = [...baseBoard];
            b[4] = -1;
            b[2] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '8/4* 6/2*', '6/2* 8/4*', 'X')).toBe(true);
        });

        it('Cas 40 : Joueur O avec blots X en 20 et 21 -> 25/20* 25/21* === 25/21* 25/20*', () => {
            const b = [...baseBoard];
            b[20] = 1;
            b[21] = 1;
            b[O_BAR] = -2;
            expect(areMoveNotationsBoardEquivalent(b, 'bar/20* bar/21*', 'bar/21* bar/20*', 'O')).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // SECTION 5 : Non-Équivalences Strictes (Frappe intermédiaire vs Passage direct) (10 cas)
    // -------------------------------------------------------------------------
    describe('5. Non-Équivalences Strictes (Frappe intermédiaire manquante ou état de barre différent) (10 cas)', () => {
        it('Cas 41 : Blot adverse en 8 -> 13/7 (sans frappe) !== 13/8* 8/7 (avec frappe en 8)', () => {
            const b = [...baseBoard];
            b[8] = -1; // Blot adverse O sur la flèche 8

            // 13/8* 8/7 frappe le blot et envoie O sur la barre (O_BAR = -1)
            const sigHit = boardSignatureAfterNotation(b, '13/8* 8/7', 'X');
            // 13/7 passe directement sans toucher 8
            const sigDirect = boardSignatureAfterNotation(b, '13/7', 'X');

            expect(sigHit).not.toBe(sigDirect);
            expect(areMoveNotationsBoardEquivalent(b, '13/7', '13/8* 8/7', 'X')).toBe(false);

            const blunder = makeBlunder(b, '13/8* 8/7', 'X');
            const res = validateDrillNotationChoice(blunder, '13/7');
            expect(res.isCorrect).toBe(false);
            expect(res.verdict).toBe('blunder');
        });

        it('Cas 42 : Blot adverse en 20 -> 24/18 !== 24/20* 20/18', () => {
            const b = [...baseBoard];
            b[20] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '24/18', '24/20* 20/18', 'X')).toBe(false);
        });

        it('Cas 43 : Blot adverse en 11 -> 13/9 !== 13/11* 11/9', () => {
            const b = [...baseBoard];
            b[11] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '13/9', '13/11* 11/9', 'X')).toBe(false);
        });

        it('Cas 44 : Blot adverse en 5 -> 8/2 !== 8/5* 5/2', () => {
            const b = [...baseBoard];
            b[5] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '8/2', '8/5* 5/2', 'X')).toBe(false);
        });

        it('Cas 45 : Blot adverse en 4 -> 7/1 !== 7/4* 4/1', () => {
            const b = [...baseBoard];
            b[4] = -1;
            b[7] = 2;
            expect(areMoveNotationsBoardEquivalent(b, '7/1', '7/4* 4/1', 'X')).toBe(false);
        });

        it('Cas 46 : Blot en 8 frappé (13/8* 8/3) vs chemin sans frappe (13/10 10/5)', () => {
            const b = [...baseBoard];
            b[8] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '13/8* 8/3', '13/10 10/5', 'X')).toBe(false);
        });

        it('Cas 47 : Blot en 20 frappé (24/20* 20/15) vs passage par 19 (24/19 19/15)', () => {
            const b = [...baseBoard];
            b[20] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '24/20* 20/15', '24/19 19/15', 'X')).toBe(false);
        });

        it('Cas 48 : Blot en 5 frappé (8/5* 5/3) vs passage par 6 (8/6 6/3)', () => {
            const b = [...baseBoard];
            b[5] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '8/5* 5/3', '8/6 6/3', 'X')).toBe(false);
        });

        it('Cas 49 : Joueur O avec blot X en 20 (point 5 relatif) -> bar/2 !== bar/5* 5/2', () => {
            const b = [...baseBoard];
            b[20] = 1; // Blot X sur la flèche 20 (qui correspond au dé 5 pour O)
            b[O_BAR] = -1;
            expect(areMoveNotationsBoardEquivalent(b, 'bar/2', 'bar/5* 5/2', 'O')).toBe(false);
        });

        it('Cas 50 : Blot en 4 frappé (6/4* 4/1) vs passage par 3 (6/3 3/1)', () => {
            const b = [...baseBoard];
            b[4] = -1;
            expect(areMoveNotationsBoardEquivalent(b, '6/4* 4/1', '6/3 3/1', 'X')).toBe(false);
        });
    });
});
