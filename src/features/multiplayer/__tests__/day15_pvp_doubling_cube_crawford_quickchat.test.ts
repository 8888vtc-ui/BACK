/**
 * @file src/features/multiplayer/__tests__/day15_pvp_doubling_cube_crawford_quickchat.test.ts
 * @description Certification Vitest de la Mission 15/25 :
 * - Cycle complet du Videau PvP : Double -> Take (transfert de cubeOwner) & Double -> Pass (gain immédiat et manche suivante)
 * - Règle de Crawford automatique (verrouillage strict à matchLength - 1, puis réactivation post-Crawford)
 * - Quick-Chat bilingue FR / EN (validation temps réel des 5 messages et absence d'erreur)
 */

import { describe, it, expect } from 'vitest';
import {
    canPlayerOfferDouble,
    computeNextCubeValue,
    formatCubeTransition,
    getCubePositionZone,
} from '../../../engine/cubeRules';
import { handleCubeAction } from '../../../hooks/reducers/cubeActions';
import { handleMatchAction } from '../../../hooks/reducers/matchActions';
import { validateGameAction, type ActionValidationContext } from '../actionValidator';
import type { BackgammonGameState } from '../../../hooks/gameStateReducer';
import type { Player } from '../../../engine/backgammonEngine';
import { createInitialState } from '../../../engine/backgammonEngine';
import { QUICK_MESSAGES_FR, QUICK_MESSAGES_EN } from '../../../components/multiplayer/MultiplayerBanner';

type MockGameStateOverrides = Partial<Omit<BackgammonGameState, 'boardState'>> & {
    boardState?: Partial<BackgammonGameState['boardState']>;
};

function createMockGameState(overrides?: MockGameStateOverrides): BackgammonGameState {
    const postOpeningBoard = [...createInitialState(5).board];
    postOpeningBoard[8] = 2;
    postOpeningBoard[5] = 1;

    const boardState: BackgammonGameState['boardState'] = {
        board: overrides?.boardState?.board ?? postOpeningBoard,
        turn: overrides?.boardState?.turn ?? 'X',
        dice: overrides?.boardState?.dice !== undefined ? overrides.boardState.dice : null,
        cubeValue: overrides?.boardState?.cubeValue ?? 1,
        cubeOwner: overrides?.boardState?.cubeOwner !== undefined ? overrides.boardState.cubeOwner : null,
        scoreX: overrides?.boardState?.scoreX ?? 0,
        scoreO: overrides?.boardState?.scoreO ?? 0,
        crawford: overrides?.boardState?.crawford ?? false,
        matchLength: overrides?.boardState?.matchLength ?? 5,
        doubled: overrides?.boardState?.doubled ?? false,
        resigned: overrides?.boardState?.resigned ?? 0,
    };

    const { boardState: _ignoredBoardState, ...restOverrides } = overrides ?? {};

    return {
        boardState,
        phase: 'WAITING_FOR_ROLL',
        usedDice: [false, false],
        selected: null,
        doublingOfferedBy: null,
        gameResult: null,
        crawfordAlreadyPlayed: false,
        matchLength: 5,
        difficulty: 'intermediate',
        lastOpponentDice: null,
        lastOpponentMoves: null,
        opponentHighlight: null,
        opponentStatusMessage: null,
        moveHistory: [],
        matchLog: [],
        autoOpponent: false,
        ...restOverrides,
    };
}

function createValidationRoom(overrides?: Partial<ActionValidationContext['room']>): ActionValidationContext['room'] {
    const modifiedBoard = [...createInitialState(5).board];
    modifiedBoard[8] = 2;
    modifiedBoard[5] = 1;

    return {
        id: 'room-day15-test', status: 'in_progress', turn: 'X', board: modifiedBoard,
        dice: null, usedDice: [false, false], cubeValue: 1, cubeOwner: null,
        doublingOfferedBy: null, isCrawford: false, matchLength: 5, scoreX: 0, scoreO: 0,
        ...overrides,
    };
}

describe('Day 15: Contrôle du Videau PvP, Règle de Crawford & Quick-Chat Bilingue', () => {

    describe('1. Cycle Double -> Take (Acceptation & Transfert de Propriété)', () => {
        it('calcule la valeur suivante et le formatage de transition (1 -> 2, 2 -> 4)', () => {
            expect(computeNextCubeValue(1)).toBe(2);
            expect(computeNextCubeValue(2)).toBe(4);
            expect(computeNextCubeValue(4)).toBe(8);
            expect(formatCubeTransition(1)).toBe('1 → 2');
            expect(formatCubeTransition(2)).toBe('2 → 4');
        });

        it('autorise Joueur X à proposer le videau avant de lancer ses dés (hors position initiale)', () => {
            const room = createValidationRoom({ turn: 'X', dice: null });
            const result = validateGameAction({
                action: { type: 'DOUBLE_OFFERED', player: 'X', cubeValue: 2, timestamp: Date.now() },
                room,
            });
            expect(result.valid).toBe(true);
            expect(result.code).toBe('OK');
        });

        it('interdit la proposition de videau si les dés ont déjà été lancés', () => {
            const roomWithDice = createValidationRoom({ turn: 'X', dice: [3, 1] });
            const result = validateGameAction({
                action: { type: 'DOUBLE_OFFERED', player: 'X', cubeValue: 2, timestamp: Date.now() },
                room: roomWithDice,
            });
            expect(result.valid).toBe(false);
            expect(result.code).toBe('CANNOT_DOUBLE_AFTER_ROLL');
        });

        it('refuse une offre de double au démarrage strict avant le 1er coup (WBF 5.1)', () => {
            const openingRoom = createValidationRoom({
                board: [...createInitialState(5).board], // position d'ouverture exacte
            });
            const result = validateGameAction({
                action: { type: 'DOUBLE_OFFERED', player: 'X', cubeValue: 2, timestamp: Date.now() },
                room: openingRoom,
            });
            expect(result.valid).toBe(false);
            expect(result.code).toBe('OPENING_POSITION_NO_DOUBLE');
        });

        it('exécute OFFER_DOUBLE puis TAKE_DOUBLE : cube passe à 2, cubeOwner devient O, X conserve son tour', () => {
            // Étape 1 : X propose le double
            const s0 = createMockGameState();
            const s1 = handleCubeAction(s0, { type: 'OFFER_DOUBLE' });

            expect(s1.phase).toBe('DOUBLING_OFFERED');
            expect(s1.doublingOfferedBy).toBe('X');
            expect(s1.boardState.cubeValue).toBe(1); // valeur courante avant prise

            // Validation serveur de la réponse TAKE par O (l'adversaire)
            const roomOffered = createValidationRoom({
                turn: 'X',
                doublingOfferedBy: 'X',
            });
            const takeValidation = validateGameAction({
                action: { type: 'DOUBLE_ACCEPTED', player: 'O', cubeValue: 2, timestamp: Date.now() },
                room: roomOffered,
            });
            expect(takeValidation.valid).toBe(true);

            // Rejet si X tente de répondre à sa propre offre !
            const invalidSelfTake = validateGameAction({
                action: { type: 'DOUBLE_ACCEPTED', player: 'X', cubeValue: 2, timestamp: Date.now() },
                room: roomOffered,
            });
            expect(invalidSelfTake.valid).toBe(false);
            expect(invalidSelfTake.code).toBe('NOT_YOUR_TURN');

            // Étape 2 : O accepte le double (Take)
            const s2 = handleCubeAction(s1, { type: 'TAKE_DOUBLE' });

            expect(s2.phase).toBe('WAITING_FOR_ROLL');
            expect(s2.doublingOfferedBy).toBeNull();
            expect(s2.boardState.cubeValue).toBe(2);
            expect(s2.boardState.cubeOwner).toBe('O'); // Transféré au preneur (O)
            expect(s2.boardState.turn).toBe('X'); // X est toujours au trait pour lancer les dés
            expect(getCubePositionZone(s2.boardState.cubeOwner)).toBe('top'); // Logement réservé à O

            // Désormais, X NE PEUT PLUS doubler car le videau appartient à O
            expect(canPlayerOfferDouble({
                turn: 'X',
                cubeValue: s2.boardState.cubeValue,
                cubeOwner: s2.boardState.cubeOwner,
                hasRolledDice: false,
                isCrawford: false,
                scoreX: s2.boardState.scoreX,
                scoreO: s2.boardState.scoreO,
                matchLength: 5,
            })).toBe(false);

            // En revanche, O pourra redoubler (×4) lors de son propre tour
            expect(canPlayerOfferDouble({
                turn: 'O',
                cubeValue: s2.boardState.cubeValue,
                cubeOwner: s2.boardState.cubeOwner,
                hasRolledDice: false,
                isCrawford: false,
                scoreX: s2.boardState.scoreX,
                scoreO: s2.boardState.scoreO,
                matchLength: 5,
            })).toBe(true);
        });
    });

    describe('2. Cycle Double -> Pass (Abandon immédiat de la manche)', () => {
        it('exécute OFFER_DOUBLE puis PASS_DOUBLE : termine la manche, attribue le videau courant à X', () => {
            const s0 = createMockGameState({
                boardState: {
                    turn: 'X',
                    dice: null,
                    cubeValue: 1,
                    cubeOwner: null,
                    scoreX: 1,
                    scoreO: 1,
                    crawford: false,
                    matchLength: 5,
                    doubled: false,
                    resigned: 0,
                },
            });

            // X propose
            const s1 = handleCubeAction(s0, { type: 'OFFER_DOUBLE' });
            expect(s1.phase).toBe('DOUBLING_OFFERED');

            // Validation serveur du Pass par O
            const roomOffered = createValidationRoom({
                turn: 'X',
                doublingOfferedBy: 'X',
                scoreX: 1,
                scoreO: 1,
            });
            const passValidation = validateGameAction({
                action: { type: 'DOUBLE_PASSED', player: 'O', winner: 'X', timestamp: Date.now() },
                room: roomOffered,
            });
            expect(passValidation.valid).toBe(true);

            // O refuse (Pass)
            const s2 = handleCubeAction(s1, { type: 'PASS_DOUBLE' });

            // La manche s'achève sur le coup
            expect(s2.phase).toBe('GAME_OVER');
            expect(s2.gameResult).not.toBeNull();
            expect(s2.gameResult?.winner).toBe('X');
            expect(s2.gameResult?.loser).toBe('O');
            expect(s2.gameResult?.winType).toBe('pass');
            expect(s2.gameResult?.pointsWon).toBe(1); // 1 point (valeur avant le double)
            expect(s2.boardState.scoreX).toBe(2); // 1 + 1 = 2
            expect(s2.boardState.scoreO).toBe(1);

            // Démarrage de la manche suivante : le videau est réinitialisé et recentré
            const nextGame = handleMatchAction(s2, { type: 'START_NEW_GAME' });
            expect(nextGame.boardState.cubeValue).toBe(1);
            expect(nextGame.boardState.cubeOwner).toBeNull();
            expect(getCubePositionZone(nextGame.boardState.cubeOwner)).toBe('middle');
        });
    });

    describe('3. Règle de Crawford Automatique en Match Play', () => {
        it('active Crawford dès qu’un joueur atteint matchLength - 1', () => {
            const sPreCrawford = createMockGameState({
                boardState: {
                    board: [...createInitialState(5).board],
                    turn: 'X',
                    dice: null,
                    cubeValue: 1,
                    cubeOwner: null,
                    scoreX: 4, // 5 - 1 = 4 points !
                    scoreO: 2,
                    crawford: false,
                    matchLength: 5,
                    doubled: false,
                    resigned: 0,
                },
                phase: 'GAME_OVER',
                crawfordAlreadyPlayed: false,
            });

            // Déclenchement de la nouvelle manche
            const crawfordGame = handleMatchAction(sPreCrawford, { type: 'START_NEW_GAME' });

            expect(crawfordGame.boardState.crawford).toBe(true);
            expect(crawfordGame.crawfordAlreadyPlayed).toBe(true);

            // Vérification métier : le double est strictement impossible
            expect(canPlayerOfferDouble({
                turn: 'X',
                cubeValue: 1,
                cubeOwner: null,
                hasRolledDice: false,
                isCrawford: crawfordGame.boardState.crawford,
                scoreX: 4,
                scoreO: 2,
                matchLength: 5,
            })).toBe(false);

            expect(canPlayerOfferDouble({
                turn: 'O',
                cubeValue: 1,
                cubeOwner: null,
                hasRolledDice: false,
                isCrawford: crawfordGame.boardState.crawford,
                scoreX: 4,
                scoreO: 2,
                matchLength: 5,
            })).toBe(false);

            // Validation serveur : tentative d'offre de videau en manche Crawford
            const crawfordRoom = createValidationRoom({
                isCrawford: true,
                scoreX: 4,
                scoreO: 2,
                matchLength: 5,
            });
            const invalidDoubleAttempt = validateGameAction({
                action: { type: 'DOUBLE_OFFERED', player: 'X', cubeValue: 2, timestamp: Date.now() },
                room: crawfordRoom,
            });
            expect(invalidDoubleAttempt.valid).toBe(false);
            expect(invalidDoubleAttempt.code).toBe('CRAWFORD_RESTRICTION');
            expect(invalidDoubleAttempt.reason).toContain('Crawford');
        });

        it('désactive la règle de Crawford pour les manches suivantes (post-Crawford)', () => {
            const sPostCrawford = createMockGameState({
                boardState: {
                    board: [...createInitialState(5).board],
                    turn: 'X',
                    dice: null,
                    cubeValue: 1,
                    cubeOwner: null,
                    scoreX: 4,
                    scoreO: 3, // O a marqué un point pendant Crawford
                    crawford: false,
                    matchLength: 5,
                    doubled: false,
                    resigned: 0,
                },
                phase: 'GAME_OVER',
                crawfordAlreadyPlayed: true, // Crawford déjà jouée
            });

            const nextGame = handleMatchAction(sPostCrawford, { type: 'START_NEW_GAME' });

            expect(nextGame.boardState.crawford).toBe(false);
            expect(nextGame.crawfordAlreadyPlayed).toBe(true);

            // Le joueur en retard (O) a désormais le droit de doubler en post-Crawford (s'il ne dépasse pas le match)
            // Pour O (score 3, besoin de 2 pts pour 5), le videau à 2 lui permet d'égaliser ou gagner
            expect(canPlayerOfferDouble({
                turn: 'O',
                cubeValue: 1,
                cubeOwner: null,
                hasRolledDice: false,
                isCrawford: nextGame.boardState.crawford,
                scoreX: 4,
                scoreO: 3,
                matchLength: 5,
            })).toBe(true);
        });
    });

    describe('4. Quick-Chat Bilingue FR / EN & Validation Temps Réel', () => {
        const expectedKeys: Array<'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks'> = ['gg', 'nice_move', 'unlucky', 'thinking', 'thanks'];

        it('fournit les 5 messages officiels en version française', () => {
            for (const key of expectedKeys) {
                expect(QUICK_MESSAGES_FR[key]).toBeDefined();
                expect(typeof QUICK_MESSAGES_FR[key]).toBe('string');
                expect(QUICK_MESSAGES_FR[key].length).toBeGreaterThan(2);
            }
            expect(QUICK_MESSAGES_FR.gg).toBe('Bonne partie !');
            expect(QUICK_MESSAGES_FR.thinking).toBe('Je réfléchis...');
        });

        it('fournit les 5 messages officiels en version anglaise', () => {
            for (const key of expectedKeys) {
                expect(QUICK_MESSAGES_EN[key]).toBeDefined();
                expect(typeof QUICK_MESSAGES_EN[key]).toBe('string');
                expect(QUICK_MESSAGES_EN[key].length).toBeGreaterThan(2);
            }
            expect(QUICK_MESSAGES_EN.gg).toBe('Good game!');
            expect(QUICK_MESSAGES_EN.thinking).toBe('Thinking...');
        });

        it('valide sans restriction les paquets QUICK_CHAT pour les deux joueurs', () => {
            const room = createValidationRoom();
            for (const key of expectedKeys) {
                const actionX = validateGameAction({
                    action: { type: 'QUICK_CHAT', player: 'X', messageId: key, timestamp: Date.now() },
                    room,
                });
                expect(actionX.valid).toBe(true);
                expect(actionX.code).toBe('OK');

                const actionO = validateGameAction({
                    action: { type: 'QUICK_CHAT', player: 'O', messageId: key, timestamp: Date.now() },
                    room,
                });
                expect(actionO.valid).toBe(true);
                expect(actionO.code).toBe('OK');
            }
        });
    });
});
