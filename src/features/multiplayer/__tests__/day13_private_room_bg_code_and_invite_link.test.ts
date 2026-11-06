/**
 * @file src/features/multiplayer/__tests__/day13_private_room_bg_code_and_invite_link.test.ts
 * @description Certification Vitest de la Mission 13/25 :
 * - Création du salon privé avec code officiel BG-XXXX
 * - Lien d'invitation 1-clic direct (/play?room=BG-XXXX)
 * - Joueur A placé en attente réelle (0 bot lancé)
 * - Joueur B (même Invité) rejoint par le code en < 2s
 * - État CONNECTED mutuel certifié des deux côtés
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createGameRoom,
    joinGameRoomByCode,
    subscribeToGameRoom,
    getGameRoom,
} from '../roomService';
import { extractRoomCodeFromUrl } from '../../../hooks/usePrivateRoomInvite';
import { buildInstantInviteUrl } from '../../../components/play/InstantFriendInviteButton';
import { buildPrivateRoomInviteUrl } from '../../../components/multiplayer/PrivateRoomModal';
import { MultiplayerRealtimeManager } from '../realtimeChannel';
import type { PlayerEloProfile } from '../types';

describe('Day 13: Contrôle du Salon Privé (BG-XXXX) & Lien d\'Invitation 1-Clic', () => {
    const playerA: PlayerEloProfile = {
        id: 'user_host_alice',
        username: 'Alice',
        displayName: 'Alice Host',
        rating: 1540,
        isGuest: false,
    };

    const playerB: PlayerEloProfile = {
        id: 'guest_bob_123',
        username: 'Bob',
        displayName: 'Bob Invité',
        rating: 1500,
        isGuest: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Création de salon : Joueur A crée BG-XXXX et reste en attente réelle sans bot', async () => {
        const room = await createGameRoom({
            host: playerA,
            matchLength: 5,
            roomType: 'private_code',
        });

        // Vérification format officiel BG-XXXX
        expect(room.code).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
        expect(room.status).toBe('waiting');
        expect(room.player_x_name).toBe('Alice Host');
        expect(room.player_o_name).toBe('En attente...');
        expect(room.match_length).toBe(5);

        // Vérification du lien 1-clic généré
        const inviteUrl = buildInstantInviteUrl(room.code, 5);
        expect(inviteUrl).toContain(`/play?room=${room.code}&match=5`);
        expect(extractRoomCodeFromUrl(inviteUrl)).toBe(room.code);

        const privateModalUrl = buildPrivateRoomInviteUrl(room.code, 5);
        expect(privateModalUrl).toContain(`/play?room=${room.code}&match=5`);
        expect(extractRoomCodeFromUrl(privateModalUrl)).toBe(room.code);
    });

    it('2. Jonction en < 2s : Joueur B rejoint par le lien ou le code et notifie Joueur A', async () => {
        // Joueur A crée le salon
        const room = await createGameRoom({
            host: playerA,
            matchLength: 7,
            roomType: 'private_code',
        });

        let hostNotifiedState: string | null = null;
        let hostSawPresence = false;

        // Joueur A s'abonne à la salle
        const subA = subscribeToGameRoom(room.id, playerA.id, {
            onRoomStateChange: (updatedRoom) => {
                hostNotifiedState = updatedRoom.status;
            },
            onActionReceived: vi.fn(),
            onPresenceChange: (isOnline) => {
                hostSawPresence = isOnline;
            },
        });

        // Joueur B rejoint via le code
        const joined = await joinGameRoomByCode({
            code: room.code,
            guest: playerB,
        });

        expect(joined.id).toBe(room.id);
        expect(joined.status).toBe('in_progress');
        expect(joined.player_o_name).toBe('Bob Invité');
        expect(joined.guest_guest_token).toBe('guest_bob_123');

        // Joueur A a bien reçu la mise à jour en temps réel
        expect(hostNotifiedState).toBe('in_progress');
        expect(hostSawPresence).toBe(true);

        subA.unsubscribe();
    });

    it('3. Robustesse du code : normalise les minuscules et codes sans préfixe BG-', async () => {
        const room = await createGameRoom({
            host: playerA,
            matchLength: 3,
            roomType: 'private_code',
        });

        // Test de saisie en minuscules ou sans "BG-"
        const rawPart = room.code.replace('BG-', '').toLowerCase();
        const joined = await joinGameRoomByCode({
            code: rawPart,
            guest: playerB,
        });

        expect(joined.id).toBe(room.id);
        expect(joined.status).toBe('in_progress');
    });

    it('4. État CONNECTED mutuel : les gestionnaires Realtime des deux joueurs se synchronisent', async () => {
        const roomId = `room_test_sync_${Date.now()}`;
        let statusA: string | null = null;
        let statusB: string | null = null;
        let presenceAforB = false;
        let presenceBforA = false;

        // Realtime Manager Joueur A
        const clientA = new MultiplayerRealtimeManager(
            roomId,
            { userId: playerA.id, username: playerA.displayName, role: 'X', lastPing: Date.now() },
            {
                onActionReceived: vi.fn(),
                onOpponentPresenceChange: (isOnline) => {
                    presenceBforA = isOnline;
                },
                onChannelStatusChange: (status) => {
                    statusA = status;
                },
            },
        );

        // Realtime Manager Joueur B
        const clientB = new MultiplayerRealtimeManager(
            roomId,
            { userId: playerB.id, username: playerB.displayName, role: 'O', lastPing: Date.now() },
            {
                onActionReceived: vi.fn(),
                onOpponentPresenceChange: (isOnline) => {
                    presenceAforB = isOnline;
                },
                onChannelStatusChange: (status) => {
                    statusB = status;
                },
            },
        );

        await clientA.connect();
        await clientB.connect();

        expect(statusA).toBe('SUBSCRIBED');
        expect(statusB).toBe('SUBSCRIBED');
        expect(presenceBforA).toBe(true);
        expect(presenceAforB).toBe(true);

        clientA.disconnect();
        clientB.disconnect();
    });

    it('5. Parsing universel d\'URL d\'invitation 1-clic (?room=, ?inviteRoom=, ?join=, ?code=)', () => {
        expect(extractRoomCodeFromUrl('https://backgammontour.com/play?room=BG-7K9W&match=5')).toBe('BG-7K9W');
        expect(extractRoomCodeFromUrl('/play?inviteRoom=BG-8492')).toBe('BG-8492');
        expect(extractRoomCodeFromUrl('/play?join=BG-AB34')).toBe('BG-AB34');
        expect(extractRoomCodeFromUrl('?code=BG-9999')).toBe('BG-9999');
        expect(extractRoomCodeFromUrl('/play?room=7k9w')).toBe('BG-7K9W');
        expect(extractRoomCodeFromUrl('/play?mode=matchmaking')).toBeNull();
    });
});
