
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    createGameRoom,
    joinGameRoomByCode,
    pushRoomAction,
    concludeGameRoom,
} from './roomService';
import type { PlayerEloProfile } from './types';
import { supabase } from '../../lib/supabase/client';

// Mock du module client Supabase : `isSupabaseConfigured` est contrôlable par test.
vi.mock('../../lib/supabase/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../lib/supabase/client')>();
    return {
        ...actual,
        isSupabaseConfigured: vi.fn(() => false),
    };
});

import { isSupabaseConfigured } from '../../lib/supabase/client';

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

    it('clôture un match multijoueur avec calcul Glicko-2 Composite pondéré w(L)=L/(L+4) et PR Open Sage', async () => {
        const room = await createGameRoom({
            host: hostUser,
            matchLength: 7,
        });

        await joinGameRoomByCode({
            code: room.code,
            guest: guestUser,
        });

        // X gagne le match en 7 points avec un excellent PR 2.5 vs PR 7.8
        const conclusion = await concludeGameRoom({
            roomId: room.id,
            winner: 'X',
            playerXPR: 2.5,
            playerOPR: 7.8,
        });

        expect(conclusion.room.status).toBe('completed');
        expect(conclusion.room.winner).toBe('X');
        expect(conclusion.deltaRatingX).toBeGreaterThan(0);
        expect(conclusion.deltaRatingO).toBeLessThan(0);
        expect(conclusion.glicko2Result.compositeScoreX.matchWeight).toBeCloseTo(7 / 11, 4);
        expect(conclusion.glicko2Result.compositeScoreX.prWeight).toBeCloseTo(4 / 11, 4);
    });

    describe('Échec Supabase (aucun repli silencieux)', () => {
        beforeEach(() => {
            vi.mocked(isSupabaseConfigured).mockReturnValue(true);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('lève une erreur explicite quand l\'insertion Supabase échoue (pas de mock silencieux)', async () => {
            // Simule un échec d'insertion : la chaîne .from().insert().select().single() renvoie une erreur.
            const insertChain = {
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'connexion refusée' },
                    }),
                }),
            };
            vi.spyOn(supabase, 'from').mockReturnValue(insertChain as never);

            await expect(
                createGameRoom({ host: hostUser, matchLength: 5 }),
            ).rejects.toThrow('Impossible de créer la salle');
        });
    });
});
