import { describe, it, expect, vi } from 'vitest';
import {
    RoomSequenceManager,
    generateRoomCode,
    isValidRoomCode,
    getRoomChannelTopic,
    type RealtimeBroadcastMessage,
} from './realtimeSchema';

describe('Realtime WebSocket & Synchronization Schema', () => {
    it('génère un topic correct pour la room', () => {
        expect(getRoomChannelTopic('abc-123')).toBe('room:abc-123');
    });

    it('génère et valide des codes de salon d\'invitation valides', () => {
        const code = generateRoomCode();
        expect(code).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
        expect(isValidRoomCode(code)).toBe(true);
        expect(isValidRoomCode('invalid-code')).toBe(false);
    });

    it('applique les actions séquentielles dans l\'ordre strict', () => {
        const applied: number[] = [];
        const resyncRequests: number[] = [];

        const manager = new RoomSequenceManager(
            0,
            (msg) => applied.push(msg.sequenceNumber),
            (missingSeq) => resyncRequests.push(missingSeq),
        );

        const createMsg = (seq: number): RealtimeBroadcastMessage => ({
            roomId: 'room_1',
            sequenceNumber: seq,
            senderRole: 'X',
            timestamp: Date.now(),
            action: { type: 'ROLL_DICE', dice: [3, 1], board: [] },
        });

        manager.processMessage(createMsg(1));
        manager.processMessage(createMsg(2));
        manager.processMessage(createMsg(3));

        expect(applied).toEqual([1, 2, 3]);
        expect(resyncRequests).toHaveLength(0);
        expect(manager.getCurrentSequence()).toBe(3);
    });

    it('ignore les doublons et les anciens paquets (idempotence)', () => {
        const applied: number[] = [];
        const manager = new RoomSequenceManager(
            2,
            (msg) => applied.push(msg.sequenceNumber),
            vi.fn(),
        );

        const createMsg = (seq: number): RealtimeBroadcastMessage => ({
            roomId: 'room_1',
            sequenceNumber: seq,
            senderRole: 'X',
            timestamp: Date.now(),
            action: { type: 'ROLL_DICE', dice: [6, 4], board: [] },
        });

        // Paquet 1 ou 2 reçu alors qu'on est déjà à seq 2
        manager.processMessage(createMsg(1));
        manager.processMessage(createMsg(2));

        expect(applied).toHaveLength(0);
        expect(manager.getCurrentSequence()).toBe(2);
    });

    it('met en mémoire tampon les paquets dans le désordre et les applique après réconciliation', () => {
        const applied: number[] = [];
        const resyncRequests: number[] = [];

        const manager = new RoomSequenceManager(
            0,
            (msg) => applied.push(msg.sequenceNumber),
            (missing) => resyncRequests.push(missing),
        );

        const createMsg = (seq: number): RealtimeBroadcastMessage => ({
            roomId: 'room_1',
            sequenceNumber: seq,
            senderRole: 'X',
            timestamp: Date.now(),
            action: { type: 'ROLL_DICE', dice: [5, 2], board: [] },
        });

        // 1. Reçoit le paquet 1 : appliqué
        manager.processMessage(createMsg(1));
        expect(applied).toEqual([1]);

        // 2. Reçoit le paquet 3 (trou : manque le 2)
        manager.processMessage(createMsg(3));
        expect(applied).toEqual([1]); // 3 est en attente
        expect(resyncRequests).toEqual([2]); // Demande le paquet 2

        // 3. Reçoit le paquet 4 : mis en attente également
        manager.processMessage(createMsg(4));
        expect(applied).toEqual([1]);

        // 4. Arrivée du paquet manquant 2 : déclenche l'application en cascade de 2, puis 3, puis 4 !
        manager.processMessage(createMsg(2));
        expect(applied).toEqual([1, 2, 3, 4]);
        expect(manager.getCurrentSequence()).toBe(4);
    });
});
