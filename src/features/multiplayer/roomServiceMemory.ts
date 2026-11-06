/**
 * Registre mémoire et canal inter-onglets pour roomService (`roomServiceMemory.ts`).
 * Utilisé pour les tests, le mode hors-ligne et les sessions locales.
 * Strictement <= 120 lignes, 0 any.
 */

import type { GameRoomRecord, RoomActionRecord } from '../../lib/supabase/types';

export interface RoomSubscriptionCallbacks {
    onRoomStateChange: (room: GameRoomRecord) => void;
    onActionReceived: (action: RoomActionRecord) => void;
    onPresenceChange: (isOpponentOnline: boolean) => void;
}

export interface MockSubscriber {
    roomId: string;
    localUserId: string;
    callbacks: RoomSubscriptionCallbacks;
}

export const mockRoomsRegistry = new Map<string, GameRoomRecord>();
export const mockSubscribers = new Set<MockSubscriber>();

function getBroadcastChannel(name: string): BroadcastChannel | null {
    if (typeof globalThis !== 'undefined' && typeof globalThis.BroadcastChannel !== 'undefined') {
        try {
            return new globalThis.BroadcastChannel(name);
        } catch {
            return null;
        }
    }
    return null;
}

export const crossTabChannel = getBroadcastChannel('bg_rooms_sync');

if (crossTabChannel) {
    crossTabChannel.onmessage = (event: MessageEvent<GameRoomRecord>) => {
        const room = event.data;
        if (!room || !room.id) return;
        mockRoomsRegistry.set(room.id, room);
        if (room.code) mockRoomsRegistry.set(room.code.toUpperCase(), room);
        notifyMockSubscribers(room);
    };
}

export function notifyMockSubscribers(room: GameRoomRecord): void {
    for (const sub of mockSubscribers) {
        if (sub.roomId === room.id) {
            sub.callbacks.onRoomStateChange(room);
            if (room.status === 'in_progress') sub.callbacks.onPresenceChange(true);
        }
    }
}

export function normalizeRoomCode(code: string): string {
    let cleanCode = code.trim().toUpperCase().replace(/^BG_/, 'BG-');
    if (!cleanCode.startsWith('BG-') && /^[2-9A-HJ-NP-Z]{4}$/i.test(cleanCode)) {
        cleanCode = `BG-${cleanCode}`;
    }
    return cleanCode;
}
