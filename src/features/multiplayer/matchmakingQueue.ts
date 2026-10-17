/**
 * Algorithme de File d'Attente & Appariement Matchmaking Elo.
 *
 * Principes :
 * - Fenêtre de recherche dynamique qui s'élargit progressivement avec le temps d'attente
 * - Minimisation du delta d'Elo entre les deux joueurs
 * - Attribution équitable des couleurs (X / O)
 */

import type { PlayerEloProfile, MatchmakingQueueTicket, MultiplayerMatchInfo } from './types';

/**
 * Calcule la tolérance de delta Elo selon la durée passée dans la file (en secondes).
 * - 0 à 5 sec : ±100 Elo (match serré idéal)
 * - 5 à 10 sec : ±250 Elo
 * - 10 à 20 sec : ±450 Elo
 * - > 20 sec : Pas de limite (match immédiat avec n'importe quel joueur disponible)
 */
export function getExpandingTolerance(elapsedSeconds: number): number {
    if (elapsedSeconds < 5) return 100;
    if (elapsedSeconds < 10) return 250;
    if (elapsedSeconds < 20) return 450;
    return Infinity;
}

/**
 * Crée un ticket de matchmaking pour un joueur.
 */
export function createMatchmakingTicket(
    player: PlayerEloProfile,
    matchLength = 7,
    currentTime = Date.now(),
): MatchmakingQueueTicket {
    return {
        id: `ticket_${player.id}_${currentTime}`,
        userId: player.id,
        username: player.username,
        displayName: player.displayName,
        rating: player.rating,
        matchLength,
        joinedAt: currentTime,
        searchTolerance: 100,
    };
}

/**
 * Vérifie si deux tickets sont compatibles pour un match.
 */
export function canMatchTickets(
    ticketA: MatchmakingQueueTicket,
    ticketB: MatchmakingQueueTicket,
    currentTime = Date.now(),
): boolean {
    if (ticketA.userId === ticketB.userId) return false;
    if (ticketA.matchLength !== ticketB.matchLength) return false;

    const elapsedA = Math.max(0, (currentTime - ticketA.joinedAt) / 1000);
    const elapsedB = Math.max(0, (currentTime - ticketB.joinedAt) / 1000);

    const toleranceA = getExpandingTolerance(elapsedA);
    const toleranceB = getExpandingTolerance(elapsedB);
    const maxAllowedTolerance = Math.max(toleranceA, toleranceB);

    const ratingDelta = Math.abs(ticketA.rating - ticketB.rating);
    return ratingDelta <= maxAllowedTolerance;
}

/**
 * Cherche le meilleur adversaire pour un ticket donné dans une liste de tickets en attente.
 * Sélectionne le joueur avec le delta d'Elo le plus faible parmi ceux compatibles.
 */
export function findMatchInQueue(
    myTicket: MatchmakingQueueTicket,
    waitingTickets: MatchmakingQueueTicket[],
    currentTime = Date.now(),
): MatchmakingQueueTicket | null {
    let bestOpponent: MatchmakingQueueTicket | null = null;
    let minDelta = Infinity;

    for (const opponentTicket of waitingTickets) {
        if (!canMatchTickets(myTicket, opponentTicket, currentTime)) continue;

        const delta = Math.abs(myTicket.rating - opponentTicket.rating);
        if (delta < minDelta) {
            minDelta = delta;
            bestOpponent = opponentTicket;
        }
    }

    return bestOpponent;
}

/**
 * Génère un identifiant unique et déterministe pour la salle de match.
 */
export function generateRoomId(userAId: string, userBId: string, timestamp = Date.now()): string {
    const sorted = [userAId, userBId].sort();
    const cleanA = sorted[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const cleanB = sorted[1].replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    return `match_${cleanA}_${cleanB}_${timestamp}`;
}

/**
 * Assigne les rôles 'X' (blancs) et 'O' (noirs) de façon équitable ou aléatoire.
 */
export function assignPlayerRoles(
    playerA: PlayerEloProfile,
    playerB: PlayerEloProfile,
    randomSeed = Math.random(),
): { playerX: PlayerEloProfile; playerO: PlayerEloProfile } {
    if (randomSeed < 0.5) {
        return { playerX: playerA, playerO: playerB };
    }
    return { playerX: playerB, playerO: playerA };
}

/**
 * Construit l'objet d'informations de match multijoueur.
 */
export function createMultiplayerMatchInfo(
    roomId: string,
    playerX: PlayerEloProfile,
    playerO: PlayerEloProfile,
    matchLength: number,
    localUserId: string,
): MultiplayerMatchInfo {
    const localRole = localUserId === playerX.id ? 'X' : 'O';
    return {
        roomId,
        playerX,
        playerO,
        matchLength,
        startedAt: new Date().toISOString(),
        localRole,
    };
}
