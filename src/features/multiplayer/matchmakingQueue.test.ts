import { describe, it, expect } from 'vitest';
import {
    getExpandingTolerance,
    createMatchmakingTicket,
    canMatchTickets,
    findMatchInQueue,
    generateRoomId,
    assignPlayerRoles,
} from './matchmakingQueue';
import type { PlayerEloProfile } from './types';

describe('Matchmaking Queue & Pairing', () => {
    const playerA: PlayerEloProfile = {
        id: 'user_1',
        username: 'alice',
        displayName: 'Alice',
        rating: 1500,
    };

    const playerB: PlayerEloProfile = {
        id: 'user_2',
        username: 'bob',
        displayName: 'Bob',
        rating: 1540,
    };

    const playerC: PlayerEloProfile = {
        id: 'user_3',
        username: 'charlie',
        displayName: 'Charlie',
        rating: 1800,
    };

    it('élargit la tolérance de recherche avec le temps', () => {
        expect(getExpandingTolerance(2)).toBe(100);
        expect(getExpandingTolerance(7)).toBe(250);
        expect(getExpandingTolerance(15)).toBe(450);
        expect(getExpandingTolerance(30)).toBe(Infinity);
    });

    it('apparie deux joueurs proches en Elo immédiatement', () => {
        const now = 1000000;
        const ticketA = createMatchmakingTicket(playerA, 7, now);
        const ticketB = createMatchmakingTicket(playerB, 7, now);

        expect(canMatchTickets(ticketA, ticketB, now)).toBe(true);
    });

    it('rejette un joueur trop éloigné en début de recherche mais l\'accepte après élargissement', () => {
        const start = 1000000;
        const ticketA = createMatchmakingTicket(playerA, 7, start);
        const ticketC = createMatchmakingTicket(playerC, 7, start);

        // Au début (0s) : delta 300 > tolérance 100
        expect(canMatchTickets(ticketA, ticketC, start)).toBe(false);

        // Après 12 secondes : tolérance 450 >= delta 300
        expect(canMatchTickets(ticketA, ticketC, start + 12000)).toBe(true);
    });

    it('refuse d\'apparier le même joueur avec lui-même', () => {
        const now = 1000000;
        const ticketA1 = createMatchmakingTicket(playerA, 7, now);
        const ticketA2 = createMatchmakingTicket(playerA, 7, now);

        expect(canMatchTickets(ticketA1, ticketA2, now)).toBe(false);
    });

    it('choisit l\'adversaire avec le delta d\'Elo le plus faible', () => {
        const now = 1000000 + 25000; // tolérance infinie
        const ticketA = createMatchmakingTicket(playerA, 7, now);
        const ticketB = createMatchmakingTicket(playerB, 7, now); // delta 40
        const ticketC = createMatchmakingTicket(playerC, 7, now); // delta 300

        const match = findMatchInQueue(ticketA, [ticketC, ticketB], now);
        expect(match?.userId).toBe(playerB.id);
    });

    it('génère un identifiant de salle déterministe et propre', () => {
        const roomId = generateRoomId('user_alpha', 'user_beta', 12345);
        expect(roomId).toContain('match_');
        expect(roomId).toContain('12345');
    });

    it('assigne les rôles X et O selon le seed', () => {
        const assign1 = assignPlayerRoles(playerA, playerB, 0.2);
        expect(assign1.playerX.id).toBe(playerA.id);
        expect(assign1.playerO.id).toBe(playerB.id);

        const assign2 = assignPlayerRoles(playerA, playerB, 0.8);
        expect(assign2.playerX.id).toBe(playerB.id);
        expect(assign2.playerO.id).toBe(playerA.id);
    });
});
