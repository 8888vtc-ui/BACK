import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationWarning,
    notificationError,
    vibrate,
    selectionChangedHaptic,
    triggerSensoryEventHaptics,
    cancelHaptics,
} from './haptics';
import {
    BackgammonSoundEngine,
    createPinkNoiseBuffer,
    createWhiteNoiseBuffer,
} from '../sound/soundEngine';
import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/haptics', () => ({
    Haptics: {
        impact: vi.fn(),
        notification: vi.fn(),
        vibrate: vi.fn(),
        selectionChanged: vi.fn(),
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

describe('Capacitor Haptics Service & Chorégraphie Sensorielle Dossier #4', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('déclenche Haptics.impact avec le style Light, Medium et Heavy', async () => {
        const spyPlugin = vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(true);
        const spyImpact = vi.spyOn(Haptics, 'impact').mockResolvedValue();

        await impactLight();
        expect(spyPlugin).toHaveBeenCalledWith('Haptics');
        expect(spyImpact).toHaveBeenCalledWith({ style: 'LIGHT' });

        await impactMedium();
        expect(spyImpact).toHaveBeenCalledWith({ style: 'MEDIUM' });

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

    it('bascule sur navigator.vibrate avec les séquences exactes du Dossier #4 et supporte cancelHaptics()', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);
        const mockVibrate = vi.fn();
        vi.stubGlobal('navigator', { vibrate: mockVibrate });

        await impactLight();
        expect(mockVibrate).toHaveBeenLastCalledWith(10);

        await impactMedium();
        expect(mockVibrate).toHaveBeenLastCalledWith(25);

        await selectionChangedHaptic();
        expect(mockVibrate).toHaveBeenLastCalledWith(6);

        await triggerSensoryEventHaptics('blotHit');
        expect(mockVibrate).toHaveBeenLastCalledWith([22, 45, 35]);

        await triggerSensoryEventHaptics('diceRollAndBounce');
        expect(mockVibrate).toHaveBeenLastCalledWith([12, 46, 14, 65, 18, 22, 14, 48, 10, 38, 8]);

        await triggerSensoryEventHaptics('doublingCubeDrop');
        expect(mockVibrate).toHaveBeenLastCalledWith([38, 18, 12]);

        await triggerSensoryEventHaptics('bearOff');
        expect(mockVibrate).toHaveBeenLastCalledWith([12, 20, 8]);

        await triggerSensoryEventHaptics('swapDice');
        expect(mockVibrate).toHaveBeenLastCalledWith([8, 25, 8]);

        await triggerSensoryEventHaptics('reviewBrilliantMove');
        expect(mockVibrate).toHaveBeenLastCalledWith([10, 30, 16]);

        await triggerSensoryEventHaptics('reviewBlunderMove');
        expect(mockVibrate).toHaveBeenLastCalledWith([30, 40, 25]);

        cancelHaptics();
        expect(mockVibrate).toHaveBeenLastCalledWith(0);
    });

    it('synthétise les 7 presets Web Audio procéduraux (0 Ko d’assets, bruit blanc & rose Paul Kellet, StereoPanner)', () => {
        const createdOscillators: Array<{ type: OscillatorType }> = [];
        const createdPanners: Array<{ pan: { value: number; setValueAtTime: ReturnType<typeof vi.fn> } }> = [];

        const makeParam = () => ({
            value: 0,
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
        });

        const mockCtx = {
            sampleRate: 44100,
            currentTime: 0,
            state: 'running',
            destination: {},
            resume: vi.fn().mockResolvedValue(undefined),
            createBuffer: vi.fn((ch: number, len: number, sr: number) => ({
                sampleRate: sr,
                length: len,
                duration: len / sr,
                numberOfChannels: ch,
                getChannelData: () => new Float32Array(len),
            })),
            createBufferSource: vi.fn(() => ({
                buffer: null,
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
            })),
            createBiquadFilter: vi.fn(() => ({
                type: 'lowpass',
                frequency: makeParam(),
                Q: makeParam(),
                connect: vi.fn(),
            })),
            createOscillator: vi.fn(() => {
                const osc = {
                    type: 'sine' as OscillatorType,
                    frequency: makeParam(),
                    connect: vi.fn(),
                    start: vi.fn(),
                    stop: vi.fn(),
                };
                createdOscillators.push(osc);
                return osc;
            }),
            createGain: vi.fn(() => ({
                gain: makeParam(),
                connect: vi.fn(),
            })),
            createStereoPanner: vi.fn(() => {
                const panner = {
                    pan: makeParam(),
                    connect: vi.fn(),
                };
                createdPanners.push(panner);
                return panner;
            }),
        } as unknown as AudioContext;

        const whiteBuf = createWhiteNoiseBuffer(mockCtx, 1.0, () => 0.25);
        const pinkBuf = createPinkNoiseBuffer(mockCtx, 1.0, () => 0.75);
        expect(whiteBuf.length).toBe(44100);
        expect(pinkBuf.length).toBe(44100);

        const engine = new BackgammonSoundEngine({
            audioContextFactory: () => mockCtx,
            rng: () => 0.5,
        });

        engine.checkerSlideAndPlace();
        engine.blotHit(24); // extrême droite -> pan = +0.45
        engine.diceRollAndBounce();
        engine.doublingCubeDrop();
        engine.bearOff(5);
        engine.reviewBrilliantMove();
        engine.reviewBlunderMove();

        // Vérifie qu'aucun oscillateur n'utilise 'sawtooth' ou 'square'
        for (const osc of createdOscillators) {
            expect(['sine', 'triangle']).toContain(osc.type);
        }

        // Vérifie que le StereoPanner de blotHit(24) est positionné à +0.45
        expect(createdPanners).toHaveLength(1);
        expect(createdPanners[0].pan.setValueAtTime).toHaveBeenCalledWith(0.45, 0);
    });
});
