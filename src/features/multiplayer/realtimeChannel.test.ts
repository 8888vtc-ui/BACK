import { describe, it, expect, vi } from 'vitest';
import { MultiplayerRealtimeManager } from './realtimeChannel';
import type { PresenceUserInfo, RealtimeBroadcastAction } from './types';

describe('MultiplayerRealtimeManager', () => {
    const userX: PresenceUserInfo = {
        userId: 'user_x_123',
        username: 'alice',
        role: 'X',
        lastPing: Date.now(),
    };

    const userO: PresenceUserInfo = {
        userId: 'user_o_456',
        username: 'bob',
        role: 'O',
        lastPing: Date.now(),
    };

    it('connecte deux joueurs dans un mock channel et signale la présence réciproque', async () => {
        const roomId = 'test_room_1';
        let xSeesO = false;
        let oSeesX = false;

        const managerX = new MultiplayerRealtimeManager(roomId, userX, {
            onActionReceived: vi.fn(),
            onOpponentPresenceChange: (isOnline) => {
                xSeesO = isOnline;
            },
            onChannelStatusChange: vi.fn(),
        });

        const managerO = new MultiplayerRealtimeManager(roomId, userO, {
            onActionReceived: vi.fn(),
            onOpponentPresenceChange: (isOnline) => {
                oSeesX = isOnline;
            },
            onChannelStatusChange: vi.fn(),
        });

        await managerX.connect();
        await managerO.connect();

        expect(xSeesO).toBe(true);
        expect(oSeesX).toBe(true);

        managerX.disconnect();
        managerO.disconnect();
    });

    it('transmet les actions de jeu par broadcast entre les deux pairs', async () => {
        const roomId = 'test_room_actions';
        const receivedActions: RealtimeBroadcastAction[] = [];

        const managerX = new MultiplayerRealtimeManager(roomId, userX, {
            onActionReceived: vi.fn(),
            onOpponentPresenceChange: vi.fn(),
            onChannelStatusChange: vi.fn(),
        });

        const managerO = new MultiplayerRealtimeManager(roomId, userO, {
            onActionReceived: (action) => {
                receivedActions.push(action);
            },
            onOpponentPresenceChange: vi.fn(),
            onChannelStatusChange: vi.fn(),
        });

        await managerX.connect();
        await managerO.connect();

        const testRollAction: RealtimeBroadcastAction = {
            type: 'DICE_ROLLED',
            player: 'X',
            dice: [5, 3],
            timestamp: Date.now(),
        };

        await managerX.sendAction(testRollAction);

        expect(receivedActions).toHaveLength(1);
        expect(receivedActions[0].type).toBe('DICE_ROLLED');
        if (receivedActions[0].type === 'DICE_ROLLED') {
            expect(receivedActions[0].dice).toEqual([5, 3]);
        }

        managerX.disconnect();
        managerO.disconnect();
    });

    it('met en file d’attente les actions pendant une reconnexion et les vide au retour en ligne', async () => {
        const roomId = 'test_room_reconnect';
        const receivedByO: RealtimeBroadcastAction[] = [];
        const statusHistoryX: string[] = [];

        const managerX = new MultiplayerRealtimeManager(roomId, userX, {
            onActionReceived: vi.fn(),
            onOpponentPresenceChange: vi.fn(),
            onChannelStatusChange: (status) => {
                statusHistoryX.push(status);
            },
        });

        const managerO = new MultiplayerRealtimeManager(roomId, userO, {
            onActionReceived: (action) => {
                receivedByO.push(action);
            },
            onOpponentPresenceChange: vi.fn(),
            onChannelStatusChange: vi.fn(),
        });

        await managerX.connect();
        await managerO.connect();

        // Déclencher une reconnexion immédiate (simule une micro-coupure réseau)
        managerX.attemptReconnect(false);
        expect(managerX.getConnectionState().isReconnecting).toBe(true);
        expect(statusHistoryX).toContain('RECONNECTING');

        // Envoyer une action pendant l'état RECONNECTING : elle doit être mise en file d'attente
        const queuedAction: RealtimeBroadcastAction = {
            type: 'DICE_ROLLED',
            player: 'X',
            dice: [6, 6],
            timestamp: Date.now(),
        };
        await managerX.sendAction(queuedAction);
        expect(managerX.getConnectionState().pendingActionsCount).toBe(1);
        expect(receivedByO).toHaveLength(0);

        // Reconnexion immédiate -> doit vider la file d'attente vers O
        await managerX.connect();
        expect(managerX.getConnectionState().isConnected).toBe(true);
        expect(managerX.getConnectionState().pendingActionsCount).toBe(0);
        expect(receivedByO).toHaveLength(1);
        expect(receivedByO[0].type).toBe('DICE_ROLLED');

        managerX.disconnect();
        managerO.disconnect();
    });
});
