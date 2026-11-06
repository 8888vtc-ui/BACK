import { describe, it, expect } from 'vitest';
import {
    canPlayerBearOff,
    isLegalOverRollBearOff,
    isLegalBearOffMove,
    getHighestOccupiedInnerPoint,
} from '../bearOffRules';
import {
    generateSingleMoves,
    generateLegalMoves,
    computeLegalTargets,
    isAllInHome,
    isHighestOccupied,
    isLowestOccupied,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    type BoardState,
    type Player,
} from '../backgammonEngine';

function createBoard(): number[] {
    return new Array<number>(26).fill(0);
}

function createState(board: number[], turn: Player = 'X', dice: [number, number] = [6, 2]): BoardState {
    return {
        board: [...board],
        turn,
        dice,
        cubeValue: 1,
        cubeOwner: null,
        scoreX: 0,
        scoreO: 0,
        matchLength: 5,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

describe('WBGF Bear-Off Official Rules Certification (30 Configurations)', () => {
    // -------------------------------------------------------------------------
    // CATÉGORIE A : Règle du Sur-Dé (Over-Die) & Cases Vides Intermédiaires (X)
    // -------------------------------------------------------------------------
    describe('Catégorie A : Sur-Dé & Trous Intermédiaires pour Joueur X', () => {
        it('Config 1 : X avec pions sur 4 et 2 (5 et 6 vides) -> dé 6 permet 4/off (sur-dé légal)', () => {
            const b = createBoard();
            b[4] = 2;
            b[2] = 2;
            expect(canPlayerBearOff(b, 'X')).toBe(true);
            expect(isLegalOverRollBearOff(b, 'X', 4, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 4, 6)).toBe(true);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.from === 4 && m.to === X_OFF)).toBe(true);
        });

        it('Config 2 : X avec pions sur 4 et 2 (5 et 6 vides) -> dé 6 interdit 2/off (4 est occupée)', () => {
            const b = createBoard();
            b[4] = 2;
            b[2] = 2;
            expect(isLegalOverRollBearOff(b, 'X', 2, 6)).toBe(false);
            expect(isLegalBearOffMove(b, 'X', 2, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.from === 2 && m.to === X_OFF)).toBe(false);
        });

        it('Config 3 : X avec pions sur 5, 4 et 2 (6 vide) -> dé 6 permet 5/off (case la plus haute)', () => {
            const b = createBoard();
            b[5] = 1;
            b[4] = 1;
            b[2] = 2;
            expect(isLegalOverRollBearOff(b, 'X', 5, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 5, 6)).toBe(true);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.from === 5 && m.to === X_OFF)).toBe(true);
        });

        it('Config 4 : X avec pions sur 5, 4 et 2 (6 vide) -> dé 6 interdit 4/off (5 est occupée)', () => {
            const b = createBoard();
            b[5] = 1;
            b[4] = 1;
            b[2] = 2;
            expect(isLegalOverRollBearOff(b, 'X', 4, 6)).toBe(false);
            expect(isLegalBearOffMove(b, 'X', 4, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.from === 4 && m.to === X_OFF)).toBe(false);
        });

        it('Config 5 : X avec pions sur 6, 5 et 4 -> dé 6 permet 6/off (exact), interdit 5/off et 4/off avec ce 6', () => {
            const b = createBoard();
            b[6] = 2;
            b[5] = 2;
            b[4] = 2;
            expect(isLegalBearOffMove(b, 'X', 6, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 5, 6)).toBe(false);
            expect(isLegalBearOffMove(b, 'X', 4, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.from === 6 && m.to === X_OFF)).toBe(true);
            expect(moves.some((m) => m.from === 5 && m.to === X_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 4 && m.to === X_OFF)).toBe(false);
        });

        it('Config 6 : X avec pions sur 6 et 4 (trou en 5) -> dé 5 permet 6/1 (avance), interdit 4/off (6 occupée)', () => {
            const b = createBoard();
            b[6] = 1;
            b[4] = 2;
            expect(isLegalBearOffMove(b, 'X', 4, 5)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 5);
            expect(moves.some((m) => m.from === 6 && m.to === 1)).toBe(true);
            expect(moves.some((m) => m.from === 4 && m.to === X_OFF)).toBe(false);
        });

        it('Config 7 : X avec pions sur 3 et 1 (4, 5, 6 vides) -> dé 5 permet 3/off (sur-dé légal)', () => {
            const b = createBoard();
            b[3] = 2;
            b[1] = 2;
            expect(isLegalOverRollBearOff(b, 'X', 3, 5)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 3, 5)).toBe(true);

            const moves = generateSingleMoves(b, 'X', 5);
            expect(moves.some((m) => m.from === 3 && m.to === X_OFF)).toBe(true);
        });

        it('Config 8 : X avec pions sur 3 et 1 (4, 5, 6 vides) -> dé 5 interdit 1/off avec le 5 (3 est occupée)', () => {
            const b = createBoard();
            b[3] = 2;
            b[1] = 2;
            expect(isLegalOverRollBearOff(b, 'X', 1, 5)).toBe(false);
            expect(isLegalBearOffMove(b, 'X', 1, 5)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 5);
            expect(moves.some((m) => m.from === 1 && m.to === X_OFF)).toBe(false);
        });

        it('Config 9 : X avec tous les pions restants sur l’As (point 1) -> dé 6 permet 1/off', () => {
            const b = createBoard();
            b[1] = 3;
            expect(isLegalOverRollBearOff(b, 'X', 1, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 1, 6)).toBe(true);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.length).toBe(1);
            expect(moves[0]).toEqual({ from: 1, to: X_OFF });
        });

        it('Config 10 : X avec pions sur 2 et 1 (3..6 vides) -> dé 3 permet 2/off, interdit 1/off avec le 3', () => {
            const b = createBoard();
            b[2] = 2;
            b[1] = 2;
            expect(isLegalBearOffMove(b, 'X', 2, 3)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 1, 3)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 3);
            expect(moves.some((m) => m.from === 2 && m.to === X_OFF)).toBe(true);
            expect(moves.some((m) => m.from === 1 && m.to === X_OFF)).toBe(false);
        });

        it('Config 11 : X avec pions sur 5 et 3 (4 et 6 vides) -> dé 4 permet 5/1 (avance), interdit 3/off', () => {
            const b = createBoard();
            b[5] = 1;
            b[3] = 1;
            expect(isLegalBearOffMove(b, 'X', 3, 4)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 4);
            expect(moves.some((m) => m.from === 5 && m.to === 1)).toBe(true);
            expect(moves.some((m) => m.from === 3 && m.to === X_OFF)).toBe(false);
        });

        it('Config 12 : X avec pions sur 4 et 1 (2, 3, 5, 6 vides) -> dé 5 permet 4/off, interdit 1/off avec le 5', () => {
            const b = createBoard();
            b[4] = 2;
            b[1] = 1;
            expect(isLegalBearOffMove(b, 'X', 4, 5)).toBe(true);
            expect(isLegalBearOffMove(b, 'X', 1, 5)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 5);
            expect(moves.some((m) => m.from === 4 && m.to === X_OFF)).toBe(true);
            expect(moves.some((m) => m.from === 1 && m.to === X_OFF)).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // CATÉGORIE B : Symétrie pour le Joueur O (Maison 19..24, Off = 25)
    // -------------------------------------------------------------------------
    describe('Catégorie B : Symétrie WBGF pour Joueur O (Maison 19..24)', () => {
        it('Config 13 : O avec pions sur 21 (dist 4) et 23 (dist 2), 19 et 20 vides -> dé 6 permet 21/off', () => {
            const b = createBoard();
            b[21] = -2;
            b[23] = -2;
            expect(canPlayerBearOff(b, 'O')).toBe(true);
            expect(isLegalOverRollBearOff(b, 'O', 21, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'O', 21, 6)).toBe(true);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.some((m) => m.from === 21 && m.to === O_OFF)).toBe(true);
        });

        it('Config 14 : O avec pions sur 21 et 23, 19 et 20 vides -> dé 6 interdit 23/off (21 est occupée)', () => {
            const b = createBoard();
            b[21] = -2;
            b[23] = -2;
            expect(isLegalOverRollBearOff(b, 'O', 23, 6)).toBe(false);
            expect(isLegalBearOffMove(b, 'O', 23, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.some((m) => m.from === 23 && m.to === O_OFF)).toBe(false);
        });

        it('Config 15 : O avec pions sur 20 (dist 5) et 22 (dist 3), 19 vide -> dé 6 permet 20/off, interdit 22/off', () => {
            const b = createBoard();
            b[20] = -1;
            b[22] = -2;
            expect(isLegalBearOffMove(b, 'O', 20, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'O', 22, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.some((m) => m.from === 20 && m.to === O_OFF)).toBe(true);
            expect(moves.some((m) => m.from === 22 && m.to === O_OFF)).toBe(false);
        });

        it('Config 16 : O avec pions sur 19 (dist 6) et 21 (dist 4) -> dé 5 permet 19/24 (avance), interdit 21/off', () => {
            const b = createBoard();
            b[19] = -1;
            b[21] = -2;
            expect(isLegalBearOffMove(b, 'O', 21, 5)).toBe(false);

            const moves = generateSingleMoves(b, 'O', 5);
            expect(moves.some((m) => m.from === 19 && m.to === 24)).toBe(true);
            expect(moves.some((m) => m.from === 21 && m.to === O_OFF)).toBe(false);
        });

        it('Config 17 : O avec pions sur 22 (dist 3) et 24 (dist 1), 19..21 vides -> dé 4 permet 22/off, interdit 24/off', () => {
            const b = createBoard();
            b[22] = -2;
            b[24] = -1;
            expect(isLegalBearOffMove(b, 'O', 22, 4)).toBe(true);
            expect(isLegalBearOffMove(b, 'O', 24, 4)).toBe(false);

            const moves = generateSingleMoves(b, 'O', 4);
            expect(moves.some((m) => m.from === 22 && m.to === O_OFF)).toBe(true);
            expect(moves.some((m) => m.from === 24 && m.to === O_OFF)).toBe(false);
        });

        it('Config 18 : O avec tous les pions sur 24 (dist 1) -> dé 6 permet 24/off (sur-dé)', () => {
            const b = createBoard();
            b[24] = -4;
            expect(isLegalOverRollBearOff(b, 'O', 24, 6)).toBe(true);
            expect(isLegalBearOffMove(b, 'O', 24, 6)).toBe(true);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.length).toBe(1);
            expect(moves[0]).toEqual({ from: 24, to: O_OFF });
        });
    });

    // -------------------------------------------------------------------------
    // CATÉGORIE C : Interdiction de Sortir si 1 Pion est Hors de la Maison
    // -------------------------------------------------------------------------
    describe('Catégorie C : Verrouillage Total si 1 Pion est Hors-Maison (cases 7..24 pour X, 1..18 pour O)', () => {
        it('Config 19 : X a 14 pions en maison (1..6) et 1 pion sur le point 7 -> dé 6 interdit toute sortie vers X_OFF', () => {
            const b = createBoard();
            b[6] = 5;
            b[5] = 5;
            b[4] = 4;
            b[7] = 1; // 1 seul pion en dehors !
            expect(canPlayerBearOff(b, 'X')).toBe(false);
            expect(isAllInHome(b, 'X')).toBe(false);
            expect(isLegalBearOffMove(b, 'X', 6, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.to === X_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 7 && m.to === 1)).toBe(true);
        });

        it('Config 20 : X a des pions en maison et 1 pion sur le point 13 -> dés [6, 5] n’autorisent aucun coup vers X_OFF', () => {
            const b = createBoard();
            b[3] = 4;
            b[2] = 4;
            b[13] = 1;
            expect(canPlayerBearOff(b, 'X')).toBe(false);

            const legalSeqs = generateLegalMoves(createState(b, 'X', [6, 5]), [6, 5]);
            for (const seq of legalSeqs) {
                for (const m of seq.moves) {
                    expect(m.to).not.toBe(X_OFF);
                }
            }
        });

        it('Config 21 : X a des pions en maison et 1 pion sur le point 24 (jan adverse) -> dé 6 n’autorise aucune sortie', () => {
            const b = createBoard();
            b[5] = 3;
            b[2] = 3;
            b[24] = 1;
            expect(canPlayerBearOff(b, 'X')).toBe(false);

            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.some((m) => m.to === X_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 24 && m.to === 18)).toBe(true);
        });

        it('Config 22 : O a des pions en maison (19..24) et 1 pion sur le point 18 -> dé 6 interdit toute sortie vers O_OFF', () => {
            const b = createBoard();
            b[24] = -5;
            b[23] = -5;
            b[18] = -1; // Juste à l’extérieur de la maison
            expect(canPlayerBearOff(b, 'O')).toBe(false);
            expect(isAllInHome(b, 'O')).toBe(false);
            expect(isLegalBearOffMove(b, 'O', 24, 6)).toBe(false);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.some((m) => m.to === O_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 18 && m.to === 24)).toBe(true);
        });

        it('Config 23 : O a des pions en maison et 1 pion sur le point 12 -> dé 4 n’autorise aucune sortie vers O_OFF', () => {
            const b = createBoard();
            b[21] = -3;
            b[22] = -3;
            b[12] = -1;
            expect(canPlayerBearOff(b, 'O')).toBe(false);

            const moves = generateSingleMoves(b, 'O', 4);
            expect(moves.some((m) => m.to === O_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 12 && m.to === 16)).toBe(true);
        });

        it('Config 24 : O a des pions en maison et 1 pion sur le point 1 (fond adverse) -> dé 6 n’autorise aucune sortie', () => {
            const b = createBoard();
            b[23] = -4;
            b[24] = -4;
            b[1] = -1;
            expect(canPlayerBearOff(b, 'O')).toBe(false);

            const moves = generateSingleMoves(b, 'O', 6);
            expect(moves.some((m) => m.to === O_OFF)).toBe(false);
            expect(moves.some((m) => m.from === 1 && m.to === 7)).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // CATÉGORIE D : Pion Frappé sur la Barre en Plein Bear-Off (X_BAR & O_BAR)
    // -------------------------------------------------------------------------
    describe('Catégorie D : Pion Frappé sur la Barre en Plein Bear-Off (Obligation de Tour Complet)', () => {
        it('Config 25 : X est frappé pendant le bear-off (1 pion sur X_BAR) -> dé 6 interdit toute sortie vers X_OFF', () => {
            const b = createBoard();
            b[X_BAR] = 1;
            b[3] = 3;
            b[2] = 3;
            expect(canPlayerBearOff(b, 'X')).toBe(false);
            expect(isAllInHome(b, 'X')).toBe(false);

            // Seule l’entrée depuis la barre est proposée
            const moves = generateSingleMoves(b, 'X', 6);
            expect(moves.length).toBe(1);
            expect(moves[0]).toEqual({ from: X_BAR, to: 19 });
            expect(moves.some((m) => m.to === X_OFF)).toBe(false);
        });

        it('Config 26 : X entre depuis la barre sur 22 avec le 3 -> avec le 6, il est sur 22 (hors-maison), sortie interdite !', () => {
            const b = createBoard();
            b[X_BAR] = 1;
            b[2] = 2;

            // Coup 1 : entrer depuis la barre
            const state = createState(b, 'X', [6, 3]);
            const legalSeqs = generateLegalMoves(state, [6, 3]);

            // Toutes les séquences doivent commencer par l’entrée depuis la barre et finir par une avance sans sortie
            expect(legalSeqs.length).toBeGreaterThan(0);
            for (const seq of legalSeqs) {
                expect(seq.moves[0].from).toBe(X_BAR);
                for (const m of seq.moves) {
                    expect(m.to).not.toBe(X_OFF);
                }
            }
        });

        it('Config 27 : X a 14 pions déjà sortis et son DERNIER pion est frappé sur X_BAR -> dés [4, 1] n’autorisent aucun X_OFF', () => {
            const b = createBoard();
            b[X_BAR] = 1; // 1 seul pion restant en jeu !
            expect(canPlayerBearOff(b, 'X')).toBe(false);

            const state = createState(b, 'X', [4, 1]);
            const targets = computeLegalTargets(state, [4, 1], [false, false]);

            // Seule la barre est une source légale
            expect(targets.leftDieTargets.has(X_BAR)).toBe(true);
            expect(targets.rightDieTargets.has(X_BAR)).toBe(true);
            expect(targets.leftDieTargets.get(X_BAR)?.includes(X_OFF)).toBe(false);
            expect(targets.rightDieTargets.get(X_BAR)?.includes(X_OFF)).toBe(false);
        });

        it('Config 28 : O est frappé pendant le bear-off (1 pion sur O_BAR) -> dés [5, 1] obligent à entrer sur 1 ou 5', () => {
            const b = createBoard();
            b[O_BAR] = -1;
            b[24] = -4;
            b[23] = -4;
            expect(canPlayerBearOff(b, 'O')).toBe(false);
            expect(isAllInHome(b, 'O')).toBe(false);

            const moves = generateSingleMoves(b, 'O', 5);
            expect(moves.length).toBe(1);
            expect(moves[0]).toEqual({ from: O_BAR, to: 5 });
            expect(moves.some((m) => m.to === O_OFF)).toBe(false);
        });

        it('Config 29 : O entre depuis la barre sur 2 avec le 2 -> avec le 6, il est sur 2, interdiction de sortir le pion en 24 !', () => {
            const b = createBoard();
            b[O_BAR] = -1;
            b[24] = -2;

            const state = createState(b, 'O', [6, 2]);
            const legalSeqs = generateLegalMoves(state, [6, 2]);

            expect(legalSeqs.length).toBeGreaterThan(0);
            for (const seq of legalSeqs) {
                expect(seq.moves[0].from).toBe(O_BAR);
                for (const m of seq.moves) {
                    expect(m.to).not.toBe(O_OFF);
                }
            }
        });

        it('Config 30 : O a 14 pions sortis et son DERNIER pion est sur O_BAR -> dés [6, 5] exigent le tour complet jusqu’à 19..24', () => {
            const b = createBoard();
            b[O_BAR] = -1;
            expect(canPlayerBearOff(b, 'O')).toBe(false);

            const state = createState(b, 'O', [6, 5]);
            const legalSeqs = generateLegalMoves(state, [6, 5]);

            expect(legalSeqs.length).toBeGreaterThan(0);
            for (const seq of legalSeqs) {
                expect(seq.moves[0].from).toBe(O_BAR);
                for (const m of seq.moves) {
                    expect(m.to).not.toBe(O_OFF);
                }
            }
        });
    });
});
