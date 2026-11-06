/**
 * @file src/features/multiplayer/__tests__/pvp_room_sync_symmetry.test.ts
 * @description Suite de tests unitaires & intégration pour le Salon Privé (BG-XXXX) & la Symétrie 25 - i.
 * Vérifie :
 * 1. Création de salon et génération conforme BG-XXXX
 * 2. Jonction par Joueur B (même Invité) et notification en temps réel
 * 3. Symétrie 25 - i, miroir de coups et intégrité absolue des 15 pions par joueur
 * 4. Alternance stricte des tours (Joueur A -> Joueur B)
 * 5. Sérialisation et transmission des événements de dés et de coups
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateRoomCode,
    isValidRoomCode,
    RoomSequenceManager,
    type RealtimeBroadcastMessage,
} from '../realtimeSchema';
import {
    createGameRoom,
    joinGameRoomByCode,
    subscribeToGameRoom,
    pushRoomAction,
    getGameRoom,
} from '../roomService';
import {
    mirrorPoint,
    mirrorMove,
    mirrorBoard,
    assertCheckerIntegrity,
    assertPipCountConsistency,
    RoomScopedSyncManager,
} from '../multiplayerPairSyncEngine';
import {
    createInitialState,
    applyMove,
    pipCount,
    X_BAR,
    O_BAR,
    type Move,
} from '../../../engine/backgammonEngine';
import type { PlayerEloProfile } from '../types';

describe('PVP Salon Privé & Synchronisation Temps Réel (BG-XXXX & 25-i)', () => {
    const hostProfile: PlayerEloProfile = {
        id: 'host_player_1',
        username: 'Alice_Host',
        displayName: 'Alice Host',
        rating: 1540,
        isGuest: false,
    };

    const guestProfile: PlayerEloProfile = {
        id: 'guest_player_2',
        username: 'Bob_Guest',
        displayName: 'Bob Guest',
        rating: 1500,
        isGuest: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Génération & Validation du Code Salon BG-XXXX', () => {
        it('génère un code commençant par BG- suivi de 4 caractères valides', () => {
            for (let i = 0; i < 20; i++) {
                const code = generateRoomCode();
                expect(code).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
                expect(isValidRoomCode(code)).toBe(true);
            }
        });

        it('valide les codes conformes et rejette les codes corrompus', () => {
            expect(isValidRoomCode('BG-8492')).toBe(true);
            expect(isValidRoomCode('bg-8492')).toBe(true);
            expect(isValidRoomCode('BG-ABCD')).toBe(true);

            // Rejets stricts
            expect(isValidRoomCode('INVALID')).toBe(false);
            expect(isValidRoomCode('BG-123')).toBe(false); // Trop court
            expect(isValidRoomCode('BG-12345')).toBe(false); // Trop long
            expect(isValidRoomCode('ROOM-8492')).toBe(false); // Mauvais préfixe
            expect(isValidRoomCode('BG-01IL')).toBe(false); // Caractères ambigus exclus
        });
    });

    describe('2. Création et Jonction d’un Salon Privé (Hôte & Invité)', () => {
        it('permet à l’Hôte de créer un salon et à un Invité de le rejoindre avec le code', async () => {
            // Joueur A (Hôte) crée le salon
            const room = await createGameRoom({
                host: hostProfile,
                matchLength: 5,
                roomType: 'private_code',
            });

            expect(room.code).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
            expect(room.status).toBe('waiting');
            expect(room.match_length).toBe(5);
            expect(room.player_x_name).toBe('Alice Host');

            // Écoute de l'Hôte
            const hostCallback = vi.fn();
            const sub = subscribeToGameRoom(room.id, hostProfile.id, {
                onRoomStateChange: hostCallback,
                onActionReceived: vi.fn(),
                onPresenceChange: vi.fn(),
            });

            // Joueur B (Invité) rejoint par le code
            const joinedRoom = await joinGameRoomByCode({
                code: room.code,
                guest: guestProfile,
            });

            expect(joinedRoom.status).toBe('in_progress');
            expect(joinedRoom.player_o_name).toBe('Bob Guest');
            expect(joinedRoom.guest_guest_token).toBe(guestProfile.id);

            // Vérification de la notification temps réel reçue par l'Hôte
            expect(hostCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: room.id,
                    status: 'in_progress',
                    player_o_name: 'Bob Guest',
                }),
            );

            sub.unsubscribe();
        });
    });

    describe('3. Symétrie 25 - i & Intégrité Absolue des 15 Pions', () => {
        it('projette correctement les points individuels et les barres (25 - p)', () => {
            expect(mirrorPoint(24)).toBe(1);
            expect(mirrorPoint(18)).toBe(7);
            expect(mirrorPoint(13)).toBe(12);
            expect(mirrorPoint(8)).toBe(17);
            expect(mirrorPoint(6)).toBe(19);
            expect(mirrorPoint(1)).toBe(24);

            // Inversion de la barre
            expect(mirrorPoint(X_BAR)).toBe(O_BAR); // 0 -> 25
            expect(mirrorPoint(O_BAR)).toBe(X_BAR); // 25 -> 0
        });

        it('projette un coup de Blanc en coup symétrique pour Noir', () => {
            const moveWhite: Move = { from: 24, to: 18 };
            const mirroredForBlack = mirrorMove(moveWhite);

            expect(mirroredForBlack).toEqual({ from: 1, to: 7 });
        });

        it('préserve strictement l’invariant des 15 pions par camp sur plateau miroir', () => {
            const initialBoard = createInitialState(5).board;

            // Intégrité du plateau initial
            const initialIntegrity = assertCheckerIntegrity(initialBoard);
            expect(initialIntegrity.valid).toBe(true);
            expect(initialIntegrity.xTotal).toBe(15);
            expect(initialIntegrity.oTotal).toBe(15);

            // Miroir du plateau initial
            const mirrored = mirrorBoard(initialBoard);
            const mirroredIntegrity = assertCheckerIntegrity(mirrored);
            expect(mirroredIntegrity.valid).toBe(true);
            expect(mirroredIntegrity.xTotal).toBe(15);
            expect(mirroredIntegrity.oTotal).toBe(15);

            // Cohérence des pip counts
            const pipConsistency = assertPipCountConsistency(initialBoard, mirrored, true);
            expect(pipConsistency.consistent).toBe(true);
        });

        it('maintient les 15 pions et la cohérence de pip count après un coup réel 24/18', () => {
            const initialBoard = createInitialState(5).board;
            const boardAfterMove = applyMove(initialBoard, { from: 24, to: 18 }, 'X');

            // Intégrité
            const integrity = assertCheckerIntegrity(boardAfterMove);
            expect(integrity.valid).toBe(true);
            expect(integrity.xTotal).toBe(15);
            expect(integrity.oTotal).toBe(15);

            // Miroir après coup
            const mirroredAfterMove = mirrorBoard(boardAfterMove);
            const mirroredIntegrity = assertCheckerIntegrity(mirroredAfterMove);
            expect(mirroredIntegrity.valid).toBe(true);
            expect(mirroredIntegrity.xTotal).toBe(15);
            expect(mirroredIntegrity.oTotal).toBe(15);

            // Le pip count de X a baissé de 6 pips (167 - 6 = 161)
            const pipLocal = pipCount(boardAfterMove);
            expect(pipLocal.X).toBe(161);
            expect(pipLocal.O).toBe(167);

            // Chez l'adversaire miroir, pipLocal.X correspond exactement à pipRemote.O
            const pipRemote = pipCount(mirroredAfterMove);
            expect(pipRemote.O).toBe(161);
            expect(pipRemote.X).toBe(167);

            const consistency = assertPipCountConsistency(boardAfterMove, mirroredAfterMove, true);
            expect(consistency.consistent).toBe(true);
        });
    });

    describe('4. Alternance des Tours & Transmission Séquentielle', () => {
        it('gère l’ordre strict des séquences et l’idempotence des paquets WebSocket', () => {
            const actionsApplied: RealtimeBroadcastMessage[] = [];
            const resyncRequests: number[] = [];

            const manager = new RoomSequenceManager(
                0,
                (action) => actionsApplied.push(action),
                (missingSeq) => resyncRequests.push(missingSeq),
            );

            // Message 1 : ROLL_DICE par X
            const msg1: RealtimeBroadcastMessage = {
                roomId: 'test_room',
                sequenceNumber: 1,
                senderRole: 'X',
                timestamp: Date.now(),
                action: {
                    type: 'ROLL_DICE',
                    dice: [6, 5],
                    board: createInitialState(5).board,
                },
            };

            manager.processMessage(msg1);
            expect(actionsApplied.length).toBe(1);
            expect(manager.getCurrentSequence()).toBe(1);

            // Doublon (Idempotence) : Rejeté sans réappliquer
            manager.processMessage(msg1);
            expect(actionsApplied.length).toBe(1);

            // Message 3 arrive avant Message 2 (trou dans la séquence)
            const msg3: RealtimeBroadcastMessage = {
                roomId: 'test_room',
                sequenceNumber: 3,
                senderRole: 'X',
                timestamp: Date.now(),
                action: {
                    type: 'END_TURN',
                    nextTurn: 'O',
                    board: createInitialState(5).board,
                },
            };

            manager.processMessage(msg3);
            expect(actionsApplied.length).toBe(1); // Pas encore appliqué
            expect(resyncRequests).toContain(2); // Demande de resynchronisation du paquet 2

            // Message 2 arrive : débloque automatiquement le message 2 et draine le message 3
            const msg2: RealtimeBroadcastMessage = {
                roomId: 'test_room',
                sequenceNumber: 2,
                senderRole: 'X',
                timestamp: Date.now(),
                action: {
                    type: 'MOVE_CHECKER',
                    move: { from: 24, to: 18 },
                    board: applyMove(createInitialState(5).board, { from: 24, to: 18 }, 'X'),
                    usedDice: [true, false],
                },
            };

            manager.processMessage(msg2);
            expect(actionsApplied.length).toBe(3); // msg2 puis msg3 appliqués dans l'ordre strict
            expect(manager.getCurrentSequence()).toBe(3);
        });

        it('enregistre atomiquement une action de jeu avec pushRoomAction', async () => {
            const room = await createGameRoom({ host: hostProfile, matchLength: 5 });
            const boardAfter = applyMove(room.board, { from: 24, to: 18 }, 'X');

            const action = await pushRoomAction({
                roomId: room.id,
                player: 'X',
                actionType: 'MOVE_CHECKER',
                boardAfter,
                dice: [6, 5],
                moveFrom: 24,
                moveTo: 18,
                moveNotation: '24/18',
            });

            expect(action.sequence_number).toBe(1);
            expect(action.move_notation).toBe('24/18');
            expect(action.player).toBe('X');

            // Vérifie que le plateau de la salle a été mis à jour
            const updatedRoom = await getGameRoom(room.id);
            expect(updatedRoom?.board).toEqual(boardAfter);
            expect(updatedRoom?.sequence_number).toBe(1);
        });
    });

    describe('5. Moteur RoomScopedSyncManager (Tables Isolées & Intégrité)', () => {
        it('exécute un coup synchronisé sur une table isolée avec double validation', () => {
            const syncManager = new RoomScopedSyncManager();
            const session = syncManager.createRoom({
                roomId: 'table_pvp_101',
                hostUserId: hostProfile.id,
                guestUserId: guestProfile.id,
                matchLength: 5,
            });

            expect(session.board).toBeDefined();
            expect(session.turn).toBe('X');

            // Joueur X joue 24/18 avec le dé 6
            const result = syncManager.applySynchronizedMove({
                roomId: 'table_pvp_101',
                player: 'X',
                move: { from: 24, to: 18 },
                dice: [6, 5],
            });

            expect(result.success).toBe(true);
            expect(result.integrity.valid).toBe(true);
            expect(result.integrity.xTotal).toBe(15);
            expect(result.integrity.oTotal).toBe(15);
            expect(result.pipConsistency.consistent).toBe(true);
        });
    });
});
