/**
 * @file src/features/multiplayer/__tests__/day14_pvp_dice_turn_symmetry_10_turns.test.ts
 * @description Certification Vitest de la Mission 14/25 :
 * - Synchronisation des dés [d1, d2] et gestion des doublés
 * - Verrouillage strict du lancer de dés pour le joueur passif
 * - Conservation absolue des 15 pions Blancs et 15 pions Noirs après chaque coup
 * - Symétrie canonique 25 - i, de la barre (0 <-> 25) et des sorties sur 10 tours complets
 */

import { describe, it, expect, vi } from 'vitest';
import {
    createInitialState,
    applyMove,
    pipCount,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    type Move,
    type Player,
    type BoardState,
} from '../../../engine/backgammonEngine';
import {
    mirrorPoint,
    mirrorMove,
    mirrorBoard,
    assertCheckerIntegrity,
    assertPipCountConsistency,
    validateMoveLegality,
} from '../multiplayerPairSyncEngine';
import { validateGameAction, type ActionValidationContext } from '../actionValidator';

describe('Day 14: Synchronisation des Dés, Symétrie 25 - i & 10 Tours Complets PvP', () => {

    it('1. Invariance & Involutivité de la Symétrie 25 - i, de la Barre et des Sorties', () => {
        // Points réguliers 1..24
        for (let p = 1; p <= 24; p++) {
            expect(mirrorPoint(p)).toBe(25 - p);
            expect(mirrorPoint(mirrorPoint(p))).toBe(p);
        }

        // Barres (0 <-> 25)
        expect(mirrorPoint(X_BAR)).toBe(O_BAR);
        expect(mirrorPoint(O_BAR)).toBe(X_BAR);
        expect(mirrorPoint(mirrorPoint(X_BAR))).toBe(X_BAR);

        // Sorties (bear-off)
        // Coup de sortie X : 3 -> 0 (X_OFF = 0)
        const xBearOff: Move = { from: 3, to: X_OFF };
        const oMirroredBearOff = mirrorMove(xBearOff);
        expect(oMirroredBearOff).toEqual({ from: 22, to: O_OFF }); // 22 -> 25

        // Involutivité du miroir de plateau
        const initial = createInitialState(5).board;
        const mirrored = mirrorBoard(initial);
        const doubleMirrored = mirrorBoard(mirrored);
        expect(doubleMirrored).toEqual(initial);

        // Vérification de la cohérence de Pip Count
        const pipCheck = assertPipCountConsistency(initial, mirrored, true);
        expect(pipCheck.consistent).toBe(true);
    });

    it('2. Verrouillage du bouton Lancer les dés pour le joueur passif', () => {
        const validationRoom: ActionValidationContext['room'] = {
            id: 'room_turn_lock_test',
            status: 'in_progress',
            matchLength: 5,
            board: [...createInitialState(5).board],
            scoreX: 0,
            scoreO: 0,
            turn: 'X', // C'est le tour de X
            dice: null,
            usedDice: [false, false],
            cubeValue: 1,
            cubeOwner: null,
            doublingOfferedBy: null,
            isCrawford: false,
        };

        // Joueur actif (X) lance les dés -> OK
        const validRoll = validateGameAction({
            action: { type: 'DICE_ROLLED', player: 'X', dice: [4, 2], timestamp: Date.now() },
            room: validationRoom,
        });
        expect(validRoll.valid).toBe(true);

        // Joueur passif (O) essaie de lancer les dés pendant le tour de X -> REJETÉ
        const passiveRoll = validateGameAction({
            action: { type: 'DICE_ROLLED', player: 'O', dice: [4, 2], timestamp: Date.now() },
            room: validationRoom,
        });
        expect(passiveRoll.valid).toBe(false);
        expect(passiveRoll.code).toBe('NOT_YOUR_TURN');
    });

    it('3. Simulation complète de 10 tours PvP avec frappes, rentrées et doublés', () => {
        let currentBoard = [...createInitialState(5).board];
        let currentTurn: Player = 'X';

        // Séquence scénarisée de 10 tours réalistes alternés
        const scriptedTurns: Array<{
            turnNum: number;
            player: Player;
            dice: [number, number];
            moves: Move[];
            expectedHits?: number;
        }> = [
            // Tour 1: X joue 3-1 (Porte du 5)
            {
                turnNum: 1, player: 'X', dice: [3, 1],
                moves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            },
            // Tour 2: O joue 6-4 (Avance de l'arrière)
            {
                turnNum: 2, player: 'O', dice: [6, 4],
                moves: [{ from: 1, to: 7 }, { from: 12, to: 16 }],
            },
            // Tour 3: X joue 5-5 (Doublé ! 4 coups de 5)
            // Case 1 a un blot O (board[1] === -1). X frappe avec 6 -> 1 !
            {
                turnNum: 3, player: 'X', dice: [5, 5],
                moves: [
                    { from: 13, to: 8 }, { from: 13, to: 8 },
                    { from: 8, to: 3 }, { from: 6, to: 1 }, // Frappe sur la case 1 ! O envoyé sur O_BAR
                ],
            },
            // Tour 4: O a un pion sur la barre (O_BAR = 25) et joue 4-4 (Doublé ! 4 coups de 4)
            // Coup 1 : O rentre obligatoirement depuis la barre sur la case 4
            // Coups 2, 3, 4 : avance depuis la case 12 vers 16
            {
                turnNum: 4, player: 'O', dice: [4, 4],
                moves: [
                    { from: O_BAR, to: 4 }, // Rentrée obligatoire !
                    { from: 12, to: 16 },
                    { from: 12, to: 16 },
                    { from: 12, to: 16 },
                ],
            },
            // Tour 5: X joue 6-2 et frappe le blot adverse sur la case 7 !
            // Case 7 a un blot O (board[7] < 0). X frappe depuis 13 vers 7.
            {
                turnNum: 5, player: 'X', dice: [6, 2],
                moves: [
                    { from: 13, to: 7 }, // Frappe sur la case 7 ! O envoyé sur O_BAR
                    { from: 8, to: 6 },
                ],
            },
            // Tour 6: O a un pion sur la barre (O_BAR = 25) et joue 3-1
            // Coup 1 : O rentre sur case 3 (où X a un blot à la case 3 !) et frappe X !
            // Coup 2 : O avance de 16 vers 17
            {
                turnNum: 6, player: 'O', dice: [3, 1],
                moves: [
                    { from: O_BAR, to: 3 }, // Rentrée et contre-frappe ! X envoyé sur X_BAR
                    { from: 16, to: 17 },
                ],
            },
            // Tour 7: X a un pion sur X_BAR (0) et joue 4-3
            // Coup 1 : X rentre sur la case 21 (25 - 4 = 21)
            // Coup 2 : X avance sur la case 18
            {
                turnNum: 7, player: 'X', dice: [4, 3],
                moves: [
                    { from: X_BAR, to: 21 }, // Rentrée obligatoire de X !
                    { from: 21, to: 18 },
                ],
            },
            // Tour 8: O joue 5-1 et avance vers la zone adverse
            {
                turnNum: 8, player: 'O', dice: [5, 1],
                moves: [
                    { from: 16, to: 21 },
                    { from: 16, to: 17 },
                ],
            },
            // Tour 9: X joue 2-1 et fait avancer ses pions du milieu
            {
                turnNum: 9, player: 'X', dice: [2, 1],
                moves: [
                    { from: 13, to: 11 },
                    { from: 11, to: 10 },
                ],
            },
            // Tour 10: O joue 3-2 et avance ses arrières
            {
                turnNum: 10, player: 'O', dice: [3, 2],
                moves: [
                    { from: 17, to: 20 },
                    { from: 17, to: 19 },
                ],
            },
        ];

        for (const step of scriptedTurns) {
            expect(step.player).toBe(currentTurn);

            // Vérification des dés valides
            expect(step.dice[0]).toBeGreaterThanOrEqual(1);
            expect(step.dice[0]).toBeLessThanOrEqual(6);
            expect(step.dice[1]).toBeGreaterThanOrEqual(1);
            expect(step.dice[1]).toBeLessThanOrEqual(6);

            // Application successive de chaque coup du tour
            for (const move of step.moves) {
                // Validation de légalité locale
                const leg = validateMoveLegality(currentBoard, move, step.player);
                if (!leg.legal) {
                    console.error('FAILED AT TURN:', step.turnNum, 'MOVE:', move, 'ERROR:', leg.error);
                }
                expect(leg.legal).toBe(true);

                // Application
                currentBoard = applyMove(currentBoard, move, step.player);

                // Miroir calculé
                const mirroredBoard = mirrorBoard(currentBoard);

                // 1. Conservation stricte des 15 pions X et 15 pions O
                const integrityLocal = assertCheckerIntegrity(currentBoard);
                expect(integrityLocal.valid).toBe(true);
                expect(integrityLocal.xTotal).toBe(15);
                expect(integrityLocal.oTotal).toBe(15);

                const integrityMirrored = assertCheckerIntegrity(mirroredBoard);
                expect(integrityMirrored.valid).toBe(true);
                expect(integrityMirrored.xTotal).toBe(15);
                expect(integrityMirrored.oTotal).toBe(15);

                // 2. Cohérence du Pip Count miroir (25 - i)
                const pipConsistency = assertPipCountConsistency(currentBoard, mirroredBoard, true);
                expect(pipConsistency.consistent).toBe(true);

                // 3. Symétrie exacte point par point
                for (let p = 1; p <= 24; p++) {
                    expect(mirroredBoard[25 - p]).toBe(-currentBoard[p]);
                }
                expect(mirroredBoard[O_BAR]).toBe(-currentBoard[X_BAR]);
                expect(mirroredBoard[X_BAR]).toBe(-currentBoard[O_BAR]);
            }

            // Alternance du tour
            currentTurn = currentTurn === 'X' ? 'O' : 'X';
        }

        // Fin de la simulation : 10 tours complétés avec intégrité absolue
        expect(scriptedTurns).toHaveLength(10);
    });

    it('4. Conservation exacte des 15 pions lors des sorties complètes (Bear-off)', () => {
        // Configuration de fin de partie avec pions prêts à sortir
        const bearOffBoard = new Array<number>(26).fill(0);
        bearOffBoard[1] = 5; // 5 pions X sur case 1
        bearOffBoard[2] = 5; // 5 pions X sur case 2
        bearOffBoard[3] = 5; // 5 pions X sur case 3
        bearOffBoard[24] = -5; // 5 pions O sur case 24 (case 1 pour O)
        bearOffBoard[23] = -5; // 5 pions O sur case 23 (case 2 pour O)
        bearOffBoard[22] = -5; // 5 pions O sur case 22 (case 3 pour O)

        // Intégrité initiale
        let rep = assertCheckerIntegrity(bearOffBoard);
        expect(rep.valid).toBe(true);
        expect(rep.xTotal).toBe(15);
        expect(rep.oTotal).toBe(15);
        expect(rep.xBorneOff).toBe(0);
        expect(rep.oBorneOff).toBe(0);

        // X sort 2 pions depuis la case 1 et la case 2 (vers 0)
        let b = applyMove(bearOffBoard, { from: 1, to: 0 }, 'X');
        b = applyMove(b, { from: 2, to: 0 }, 'X');

        rep = assertCheckerIntegrity(b);
        expect(rep.valid).toBe(true);
        expect(rep.xTotal).toBe(15);
        expect(rep.xBorneOff).toBe(2);

        // O sort 2 pions depuis la case 24 et 23 (vers 25)
        b = applyMove(b, { from: 24, to: 25 }, 'O');
        b = applyMove(b, { from: 23, to: 25 }, 'O');

        rep = assertCheckerIntegrity(b);
        expect(rep.valid).toBe(true);
        expect(rep.oTotal).toBe(15);
        expect(rep.oBorneOff).toBe(2);

        // Symétrie du plateau en cours de bear-off
        const m = mirrorBoard(b);
        expect(assertPipCountConsistency(b, m, true).consistent).toBe(true);
    });
});
