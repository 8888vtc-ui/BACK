import { describe, it, expect } from 'vitest';
import {
    createGameRoom,
    joinGameRoomByCode,
    pushRoomAction,
} from './roomService';
import type { PlayerEloProfile } from './types';

describe('RoomService (Rooms, États & Synchronisation)', () => {
    const hostUser: PlayerEloProfile = {
        id: 'user_host_1',
        username: 'alice',
        displayName: 'Alice Host',
        rating: 1560,
    };

    const guestUser: PlayerEloProfile = {
        id: 'user_guest_2',
        username: 'bob',
        displayName: 'Bob Guest',
        rating: 1520,
    };

    it('crée une nouvelle salle privée avec un code valide et un état initial propre', async () => {
        const room = await createGameRoom({
            host: hostUser,
            matchLength: 5,
            roomType: 'private_code',
        });

        expect(room.id).toBeDefined();
        expect(room.code).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
        expect(room.match_length).toBe(5);
        expect(room.status).toBe('waiting');
        expect(room.player_x_name).toBe('Alice Host');
        expect(room.player_x_rating).toBe(1560);
        expect(room.board).toHaveLength(26);
        expect(room.sequence_number).toBe(0);
    });

    it('permet à un invité de rejoindre la salle avec le bon code', async () => {
        const created = await createGameRoom({
            host: hostUser,
            matchLength: 7,
        });

        const joined = await joinGameRoomByCode({
            code: created.code,
            guest: guestUser,
        });

        expect(joined.id).toBe(created.id);
        expect(joined.status).toBe('in_progress');
        expect(joined.player_o_name).toBe('Bob Guest');
        expect(joined.player_o_rating).toBe(1520);
    });

    it('rejette une tentative de rejoindre avec un code inexistant', async () => {
        await expect(
            joinGameRoomByCode({
                code: 'BG-9999',
                guest: guestUser,
            }),
        ).rejects.toThrow('Aucune salle trouvée');
    });

    it('enregistre des actions séquentielles avec incrément monotone du sequence_number', async () => {
        const room = await createGameRoom({ host: hostUser });

        const action1 = await pushRoomAction({
            roomId: room.id,
            player: 'X',
            actionType: 'ROLL_DICE',
            dice: [4, 2],
            boardAfter: room.board,
        });

        expect(action1.sequence_number).toBe(1);
        expect(action1.dice).toEqual([4, 2]);

        const action2 = await pushRoomAction({
            roomId: room.id,
            player: 'X',
            actionType: 'MOVE_CHECKER',
            moveFrom: 8,
            moveTo: 4,
            moveNotation: '8/4',
            boardAfter: room.board,
        });

        expect(action2.sequence_number).toBe(2);
        expect(action2.move_notation).toBe('8/4');
    });
});
