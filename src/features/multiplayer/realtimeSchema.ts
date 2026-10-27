/**
 * Spécification & Contrats du Schéma Supabase Realtime & WebSocket.
 *
 * Architecture à 4 composantes :
 * 1. Rooms : Salons publics ou privés par code d'invitation (game_rooms)
 * 2. Game State : État projeté (board, turn, dice, clocks, sequence_number)
 * 3. Actions / Coups : Journal ordonné sérialisé (room_actions)
 * 4. Synchronisation : Canaux Broadcast, Presence, CDC postgres_changes et réconciliation par séquence
 */

import type { Player, Move } from '../../engine/backgammonEngine';
import type { GameRoomRecord, RoomActionRecord } from '../../lib/supabase/types';

// ==============================================================================
// 1. TOPICS & CANAUX WEBSOCKET SUPABASE
// ==============================================================================

export const REALTIME_ROOM_TOPIC_PREFIX = 'room:';
export const REALTIME_MATCHMAKING_TOPIC = 'lobby:matchmaking';

export function getRoomChannelTopic(roomId: string): string {
    return `${REALTIME_ROOM_TOPIC_PREFIX}${roomId}`;
}

// ==============================================================================
// 2. ÉVÉNEMENTS BROADCAST WEBSOCKET (Faible Latence < 30ms)
// ==============================================================================

export type RealtimeEventName =
    | 'game_action'
    | 'resync_request'
    | 'resync_snapshot'
    | 'quick_emote'
    | 'clock_tick';

export interface BaseRealtimePayload {
    roomId: string;
    sequenceNumber: number;
    senderRole: Player;
    timestamp: number;
}

export type SequencedActionPayload =
    | {
        type: 'ROLL_DICE';
        dice: [number, number];
        board: number[];
    }
    | {
        type: 'MOVE_CHECKER';
        move: Move;
        board: number[];
        usedDice: [boolean, boolean] | boolean[];
    }
    | {
        type: 'END_TURN';
        nextTurn: Player;
        board: number[];
    }
    | {
        type: 'OFFER_DOUBLE';
        cubeValue: number;
    }
    | {
        type: 'ACCEPT_DOUBLE';
        cubeValue: number;
    }
    | {
        type: 'PASS_DOUBLE';
        winner: Player;
    }
    | {
        type: 'RESIGN';
        reason: 'surrender' | 'timeout' | 'disconnect';
        winner: Player;
    };

export interface RealtimeBroadcastMessage extends BaseRealtimePayload {
    action: SequencedActionPayload;
    clockRemainingMs?: number;
}

export interface ResyncRequestPayload {
    roomId: string;
    fromSequenceNumber: number;
    requestedBy: Player;
    timestamp: number;
}

export interface ResyncSnapshotPayload {
    roomId: string;
    lastSequenceNumber: number;
    state: GameRoomRecord;
    recentActions: RoomActionRecord[];
    timestamp: number;
}

// ==============================================================================
// 3. ÉVÉNEMENTS DE PRÉSENCE & RECONNEXION
// ==============================================================================

export interface RealtimePresenceState {
    userId: string;
    role: Player | 'spectator';
    displayName: string;
    rating: number;
    isOnline: boolean;
    lastSeen: number;
    clientVersion: string;
}

// ==============================================================================
// 4. GESTIONNAIRE DE RÉCONCILIATION SÉQUENTIELLE (ANTI-DÉSYNCHRONISATION)
// ==============================================================================

/**
 * Assure l'ordre strict des événements et résout les pertes de paquets WebSocket.
 * Si un paquet d'ordre supérieur arrive (ex: reçu seq=5 alors que current=3),
 * il est mis en mémoire tampon et un signal de resynchronisation est déclenché.
 */
export class RoomSequenceManager {
    private currentSeq: number;
    private buffer: Map<number, RealtimeBroadcastMessage> = new Map();
    private onActionToApply: (action: RealtimeBroadcastMessage) => void;
    private onRequestResync: (missingFromSeq: number) => void;

    constructor(
        initialSequenceNumber: number,
        onActionToApply: (action: RealtimeBroadcastMessage) => void,
        onRequestResync: (missingFromSeq: number) => void,
    ) {
        this.currentSeq = initialSequenceNumber;
        this.onActionToApply = onActionToApply;
        this.onRequestResync = onRequestResync;
    }

    public getCurrentSequence(): number {
        return this.currentSeq;
    }

    public setSequence(seq: number): void {
        this.currentSeq = seq;
        this.buffer.clear();
    }

    /**
     * Traite un message reçu. Garantit la livraison ordonnée et sans doublons.
     */
    public processMessage(message: RealtimeBroadcastMessage): void {
        const seq = message.sequenceNumber;

        // 1. Doublon ou ancien paquet déjà appliqué : Ignoré (Idempotence)
        if (seq <= this.currentSeq) {
            return;
        }

        // 2. Coup suivant attendu dans l'ordre strict
        if (seq === this.currentSeq + 1) {
            this.currentSeq = seq;
            this.onActionToApply(message);
            this.drainBufferedActions();
            return;
        }

        // 3. Trou dans la séquence (paquet manqué) : mise en buffer + demande de rattrapage
        this.buffer.set(seq, message);
        this.onRequestResync(this.currentSeq + 1);
    }

    private drainBufferedActions(): void {
        while (this.buffer.has(this.currentSeq + 1)) {
            const nextSeq = this.currentSeq + 1;
            const nextMsg = this.buffer.get(nextSeq)!;
            this.buffer.delete(nextSeq);
            this.currentSeq = nextSeq;
            this.onActionToApply(nextMsg);
        }
    }
}

// ==============================================================================
// 5. UTILITAIRES DE SALONS & CODES D'INVITATION
// ==============================================================================

/**
 * Génère un code de salon d'invitation court et facile à dicter (ex: 'BG-8492').
 *
 * Utilise un CSPRNG (`crypto.getRandomValues`) avec rejet du biais de modulo :
 * les valeurs aléatoires >= `limit` sont rejetées pour garantir une distribution
 * uniforme sur l'alphabet (aucun caractère n'est sur-représenté).
 */
export function generateRoomCode(prefix = 'BG'): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const cryptoObj =
        typeof globalThis !== 'undefined' && globalThis.crypto
            ? globalThis.crypto
            : undefined;

    if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
        throw new Error(
            'CSPRNG indisponible : impossible de générer un code de salon sécurisé.',
        );
    }

    const limit = 256 - (256 % chars.length);
    const buffer = new Uint8Array(1);
    let code = '';

    while (code.length < 4) {
        cryptoObj.getRandomValues(buffer);
        const value = buffer[0];
        // Rejet du biais de modulo : on ignore les valeurs >= limit.
        if (value >= limit) continue;
        code += chars[value % chars.length];
    }

    return `${prefix}-${code}`;
}

/**
 * Valide le format d'un code de salon.
 */
export function isValidRoomCode(code: string): boolean {
    return /^BG-[2-9A-HJ-NP-Z]{4}$/i.test(code.trim());
}
