import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    saveActiveSession,
    loadActiveSession,
    clearActiveSession,
    isSessionRecoverable,
    touchActiveSession,
    ActiveGameSession,
} from './sessionRecovery';

describe('sessionRecovery (Reconnexion après coupure)', () => {
    let storageMap: Record<string, string> = {};

    const mockSession: ActiveGameSession = {
        roomId: 'room_rec_123',
        code: 'BG-8492',
        localRole: 'X',
        matchLength: 7,
        localProfile: {
            id: 'usr_local',
            username: 'alice',
            displayName: 'Alice',
            rating: 1650,
        },
        opponentProfile: {
            id: 'usr_opp',
            username: 'bob',
            displayName: 'Bob',
            rating: 1680,
        },
        startedAt: 100000,
        lastHeartbeat: 100000,
    };

    beforeEach(() => {
        storageMap = {};
        const mockStorage = {
            getItem: vi.fn((key: string) => storageMap[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                storageMap[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete storageMap[key];
            }),
            clear: vi.fn(() => {
                storageMap = {};
            }),
        };

        vi.stubGlobal('window', {
            localStorage: mockStorage,
            sessionStorage: mockStorage,
        });
    });

    it('sauvegarde et recharge la session active sans altération', () => {
        saveActiveSession(mockSession);
        const loaded = loadActiveSession();

        expect(loaded).not.toBeNull();
        expect(loaded?.roomId).toBe('room_rec_123');
        expect(loaded?.code).toBe('BG-8492');
        expect(loaded?.localRole).toBe('X');
        expect(loaded?.opponentProfile.displayName).toBe('Bob');
    });

    it('efface la session après la fin du match', () => {
        saveActiveSession(mockSession);
        expect(loadActiveSession()).not.toBeNull();

        clearActiveSession();
        expect(loadActiveSession()).toBeNull();
    });

    it('met à jour le timestamp de dernier contact (touchActiveSession)', () => {
        saveActiveSession(mockSession);
        const originalTime = mockSession.lastHeartbeat;

        const fakeNow = 150000;
        vi.spyOn(Date, 'now').mockReturnValue(fakeNow);

        touchActiveSession();
        const loaded = loadActiveSession();

        expect(loaded?.lastHeartbeat).toBe(fakeNow);
        expect(loaded?.lastHeartbeat).toBeGreaterThan(originalTime);

        vi.restoreAllMocks();
    });

    it('déclare une session récupérable si dans la fenêtre de grâce (ex: 5 minutes)', () => {
        const now = 200000;
        const validSession = { ...mockSession, lastHeartbeat: now - 60000 }; // Il y a 1 min
        expect(isSessionRecoverable(validSession, 20 * 60 * 1000, now)).toBe(true);
    });

    it('déclare une session expirée si elle dépasse le délai de grâce (ex: > 20 minutes)', () => {
        const now = 2000000;
        const expiredSession = { ...mockSession, lastHeartbeat: now - 25 * 60 * 1000 }; // Il y a 25 min
        expect(isSessionRecoverable(expiredSession, 20 * 60 * 1000, now)).toBe(false);
    });
});
