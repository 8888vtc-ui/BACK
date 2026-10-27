import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationWarning,
    notificationError,
    vibrate,
    selectionChangedHaptic,
} from './haptics';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/haptics', () => ({
    Haptics: {
        impact: vi.fn(),
        notification: vi.fn(),
        vibrate: vi.fn(),
    },
    ImpactStyle: {
        Light: 'LIGHT',
        Medium: 'MEDIUM',
        Heavy: 'HEAVY',
    },
    NotificationType: {
        Success: 'SUCCESS',
        Warning: 'WARNING',
        Error: 'ERROR',
    },
}));

describe('Capacitor Haptics Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('déclenche Haptics.impact avec le style Light', async () => {
        const spyPlugin = vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyImpact = vi.spyOn(Haptics, 'impact').mockResolvedValue();

        await impactLight();

        expect(spyPlugin).toHaveBeenCalledWith('Haptics');
        expect(spyImpact).toHaveBeenCalledWith({ style: 'LIGHT' });
    });

    it('déclenche Haptics.impact avec le style Medium', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyImpact = vi.spyOn(Haptics, 'impact').mockResolvedValue();

        await impactMedium();

        expect(spyImpact).toHaveBeenCalledWith({ style: 'MEDIUM' });
    });

    it('déclenche Haptics.impact avec le style Heavy', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyImpact = vi.spyOn(Haptics, 'impact').mockResolvedValue();

        await impactHeavy();

        expect(spyImpact).toHaveBeenCalledWith({ style: 'HEAVY' });
    });

    it('déclenche Haptics.notification avec Success, Warning et Error', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyNotif = vi.spyOn(Haptics, 'notification').mockResolvedValue();

        await notificationSuccess();
        expect(spyNotif).toHaveBeenCalledWith({ type: 'SUCCESS' });

        await notificationWarning();
        expect(spyNotif).toHaveBeenCalledWith({ type: 'WARNING' });

        await notificationError();
        expect(spyNotif).toHaveBeenCalledWith({ type: 'ERROR' });
    });

    it('déclenche Haptics.vibrate avec la durée par défaut et personnalisée', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyVibrate = vi.spyOn(Haptics, 'vibrate').mockResolvedValue();

        await vibrate();
        expect(spyVibrate).toHaveBeenCalledWith({ duration: 200 });

        await vibrate(500);
        expect(spyVibrate).toHaveBeenCalledWith({ duration: 500 });
    });

    it('bascule sur navigator.vibrate si le plugin Capacitor n’est pas disponible', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);
        const mockVibrate = vi.fn();
        vi.stubGlobal('navigator', { vibrate: mockVibrate });

        await impactLight();
        expect(mockVibrate).toHaveBeenCalledWith(10);

        await impactMedium();
        expect(mockVibrate).toHaveBeenCalledWith(25);

        await selectionChangedHaptic();
        expect(mockVibrate).toHaveBeenCalledWith(6);

        vi.unstubAllGlobals();
    });
});
