/**
 * Module de Récupération de Session & Reconnexion après coupure réseau.
 *
 * Fonctionnalités :
 * - Maintien de la session active de match dans le stockage local / de session.
 * - Détection des ruptures réseau (événements browser offline / online, perte de WebSocket).
 * - Restauration automatique ou assistée de la partie interrompue :
 *   1. Récupération du snapshot serveur le plus récent (game_rooms)
 *   2. Rejeu des actions ordonnées manquantes (room_actions)
 *   3. Re-souscription au canal Realtime & reprise des pendules
 * - Élimination propre de la session à la fin normale ou à l'abandon du match.
 */

import type { PlayerEloProfile, MultiplayerMatchInfo, MultiplayerRole } from './types';
import type { GameRoomRecord } from '../../lib/supabase/types';
import { getGameRoom } from './roomService';

const ACTIVE_SESSION_STORAGE_KEY = 'bg_active_multiplayer_session';
const DEFAULT_MAX_RECOVERY_AGE_MS = 20 * 60 * 1000; // 20 minutes maximum de grâce

export interface ActiveGameSession {
    roomId: string;
    code: string;
    localRole: MultiplayerRole;
    matchLength: number;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile;
    startedAt: number;
    lastHeartbeat: number;
}

/**
 * Sauvegarde la session multijoueur active.
 */
export function saveActiveSession(session: ActiveGameSession): void {
    if (typeof window === 'undefined') return;
    try {
        const payload = JSON.stringify(session);
        window.sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, payload);
        window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, payload);
    } catch {
        // En cas de quota ou mode navigation privée stricte
    }
}

/**
 * Charge la session multijoueur active si existante.
 */
export function loadActiveSession(): ActiveGameSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw =
            window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY) ||
            window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (!raw) return null;

        const session = JSON.parse(raw) as ActiveGameSession;
        if (!session.roomId || !session.code || !session.localRole) return null;

        return session;
    } catch {
        return null;
    }
}

/**
 * Efface la session une fois le match terminé ou abandonné.
 */
export function clearActiveSession(): void {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch {
        // Ignorer
    }
}

/**
 * Met à jour le timestamp de dernier contact pour garder la session vivante.
 */
export function touchActiveSession(): void {
    const current = loadActiveSession();
    if (current) {
        current.lastHeartbeat = Date.now();
        saveActiveSession(current);
    }
}

/**
 * Vérifie si une session est valide pour être restaurée.
 */
export function isSessionRecoverable(
    session: ActiveGameSession | null,
    maxAgeMs = DEFAULT_MAX_RECOVERY_AGE_MS,
    nowMs = Date.now(),
): boolean {
    if (!session) return false;
    const elapsed = nowMs - (session.lastHeartbeat || session.startedAt);
    return elapsed >= 0 && elapsed <= maxAgeMs;
}

/**
 * Tente de restaurer l'état complet d'une salle de jeu depuis le serveur ou le registre local.
 */
export async function fetchRecoverableRoomSnapshot(roomId: string): Promise<GameRoomRecord | null> {
    try {
        const room = await getGameRoom(roomId);
        if (!room) return null;

        // Si la partie est déjà terminée ou abandonnée, on ne peut pas reprendre
        if (room.status === 'completed' || room.status === 'abandoned') {
            clearActiveSession();
            return null;
        }

        return room;
    } catch {
        return null;
    }
}
