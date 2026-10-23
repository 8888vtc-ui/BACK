// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    BLITZ_CADENCE_THRESHOLD_MS,
    BLITZ_DECAY_REDUCTION_FACTOR,
    BLITZ_LOWPASS_DUCKING_FACTOR,
    EXCITATION_NOISE_DURATION_SEC,
    FELT_MODES_HZ,
    HEAVY_CASINO_CHIP_SPEC,
    IVORY_DICE_SPEC,
    LuxuryBoardAudioEngine,
    NOBLE_WOOD_SPEC,
    STOCHASTIC_JITTER_AMPLITUDE,
    computeStochasticJitter,
    synthesizeHybridPinkNoiseBuffer,
} from './LuxuryBoardAudioEngine';
import {
    BLOT_HIT_BRAKED_HAPTIC_MS,
    GRANULAR_DICE_FELT_BED_MS,
    GRANULAR_DICE_ROLL_DURATION_MS,
    GRANULAR_DICE_ROLL_SEQUENCE,
    MAX_AUDIO_HAPTIC_SYNC_MS,
    SensoryFeedbackController,
} from './SensoryFeedbackController';
import * as haptics from '../capacitor/haptics';

interface MockAudioParam {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
}

function createMockAudioParam(initial = 0): MockAudioParam {
    return {
        value: initial,
        setValueAtTime: vi.fn((val: number) => {
            initial = val;
        }),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
    };
}

function createMockAudioContext() {
    const createdFilters: Array<{
        type: BiquadFilterType;
        frequency: MockAudioParam;
        Q: MockAudioParam;
        connect: ReturnType<typeof vi.fn>;
    }> = [];
    const createdOscillators: Array<{
        type: OscillatorType;
        frequency: MockAudioParam;
        connect: ReturnType<typeof vi.fn>;
        start: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
    }> = [];
    const createdBufferSources: Array<{
        buffer: AudioBuffer | null;
        connect: ReturnType<typeof vi.fn>;
        start: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
    }> = [];
    const createdGains: Array<{
        gain: MockAudioParam;
        connect: ReturnType<typeof vi.fn>;
    }> = [];

    const ctx = {
        sampleRate: 44100,
        currentTime: 0,
        state: 'running' as AudioContextState,
        destination: {} as AudioDestinationNode,
        resume: vi.fn().mockResolvedValue(undefined),
        createBuffer: vi.fn((channels: number, length: number, sampleRate: number): AudioBuffer => {
            const channelArrays = Array.from({ length: channels }, () => new Float32Array(length));
            return {
                sampleRate,
                length,
                duration: length / sampleRate,
                numberOfChannels: channels,
                getChannelData: (ch: number) => channelArrays[ch] ?? new Float32Array(length),
                copyFromChannel: vi.fn(),
                copyToChannel: vi.fn(),
            } as unknown as AudioBuffer;
        }),
        createBufferSource: vi.fn(() => {
            const node = {
                buffer: null as AudioBuffer | null,
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
            };
            createdBufferSources.push(node);
            return node as unknown as AudioBufferSourceNode;
        }),
        createBiquadFilter: vi.fn(() => {
            const filter = {
                type: 'lowpass' as BiquadFilterType,
                frequency: createMockAudioParam(350),
                Q: createMockAudioParam(1),
                connect: vi.fn(),
            };
            createdFilters.push(filter);
            return filter as unknown as BiquadFilterNode;
        }),
        createOscillator: vi.fn(() => {
            const osc = {
                type: 'sine' as OscillatorType,
                frequency: createMockAudioParam(440),
                connect: vi.fn(),
                start: vi.fn(),
                stop: vi.fn(),
            };
            createdOscillators.push(osc);
            return osc as unknown as OscillatorNode;
        }),
        createGain: vi.fn(() => {
            const gainNode = {
                gain: createMockAudioParam(1),
                connect: vi.fn(),
            };
            createdGains.push(gainNode);
            return gainNode as unknown as GainNode;
        }),
        _inspect: {
            createdFilters,
            createdOscillators,
            createdBufferSources,
            createdGains,
        },
    };

    return ctx;
}

describe('LuxuryBoardAudioEngine — Synthèse Modale Procédurale & Psychoacoustique', () => {
    let mockCtx: ReturnType<typeof createMockAudioContext>;

    beforeEach(() => {
        mockCtx = createMockAudioContext();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('synthétise un AudioBuffer de bruit rose/blanc hybride de 1.0s en RAM sans appel réseau', () => {
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5, // Jitter neutre (1.0)
        });

        expect(engine.prewarm()).toBe(true);
        const buffer = engine.getExcitationBuffer();
        expect(buffer).not.toBeNull();
        expect(buffer!.duration).toBe(EXCITATION_NOISE_DURATION_SEC);
        expect(buffer!.length).toBe(44100);

        const directBuf = synthesizeHybridPinkNoiseBuffer(
            mockCtx as unknown as AudioContext,
            1.0,
            Math.random,
        );
        const samples = directBuf.getChannelData(0);
        let nonZeroCount = 0;
        let minSample = Infinity;
        let maxSample = -Infinity;
        for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            if (s < minSample) minSample = s;
            if (s > maxSample) maxSample = s;
            if (Math.abs(s) > 1e-5) nonZeroCount++;
        }
        expect(minSample).toBeGreaterThanOrEqual(-1);
        expect(maxSample).toBeLessThanOrEqual(1);
        expect(nonZeroCount).toBeGreaterThan(40000);
    });

    it('Preset 1 (Feutre Épais) : modes 95 Hz, 240 Hz, balayage fibres 620->1450 Hz (Q=1.4), LPF 1800 Hz, attaque 6ms, decay 42ms', () => {
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5, // Jitter = 1.0
            nowMs: () => 1000,
        });

        const report = engine.playFeltBrush(0.8);
        expect(report.preset).toBe('FELT_BRUSH');
        expect(report.modalFrequenciesHz).toEqual([95, 240, 620, 1450]);
        expect(report.lowpassCutoffHz).toBe(1800);
        expect(report.attackDurationSec).toBe(0.006);
        expect(report.decayDurationSec).toBe(0.042);
        expect(report.qualityFactors).toContain(1.4);

        const bandpassFilter = mockCtx._inspect.createdFilters.find((f) => f.type === 'bandpass');
        expect(bandpassFilter).toBeDefined();
        expect(bandpassFilter!.Q.setValueAtTime).toHaveBeenCalledWith(1.4, 0);
        expect(bandpassFilter!.frequency.setValueAtTime).toHaveBeenCalledWith(620, 0);
        expect(bandpassFilter!.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
            1450,
            0.006 + 0.042,
        );
    });

    it('Preset 2 (Bois Noble Ébène/Palissandre) : modes 142, 315, 718, 1580 Hz (<15ms), LPF 2600 Hz, et pitch shift -12% (0.88) sur capture', () => {
        let clock = 1000;
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5, // Jitter = 1.0
            nowMs: () => {
                clock += 500; // Pas de ducking Blitz
                return clock;
            },
        });

        // 1. Déplacement standard (isCapture = false)
        const stdReport = engine.playNobleWoodImpact(0.7, false);
        expect(stdReport.preset).toBe('NOBLE_WOOD');
        expect(stdReport.pitchMultiplier).toBe(1.0);
        expect(stdReport.modalFrequenciesHz).toEqual([142, 315, 718, 1580]);
        expect(stdReport.lowpassCutoffHz).toBe(2600);
        expect(NOBLE_WOOD_SPEC.attackTransientDecaySec).toBeLessThan(0.015);

        // 2. Capture / Frappe de blot (isCapture = true) -> Pitch shift de -12% (×0.88)
        const capReport = engine.playNobleWoodImpact(0.95, true);
        expect(capReport.pitchMultiplier).toBe(0.88);
        expect(capReport.modalFrequenciesHz).toEqual([
            Number((142 * 0.88).toFixed(2)),
            Number((315 * 0.88).toFixed(2)),
            Number((718 * 0.88).toFixed(2)),
            Number((1580 * 0.88).toFixed(2)),
        ]);
    });

    it('Preset 3 (Collision d’Ivoire) : modes inharmoniques 1120, 2480, 4150, 6800 Hz (ratios 1:2.21:3.71:6.07), Q ∈ [15, 35], decay 15-35ms', () => {
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5,
            nowMs: () => 1000,
        });

        const report = engine.playIvoryDiceCollision(0.82);
        expect(report.preset).toBe('IVORY_DICE');
        expect(report.modalFrequenciesHz).toEqual([1120, 2480, 4150, 6800]);
        expect(IVORY_DICE_SPEC.ratios).toEqual([1, 2.21, 3.71, 6.07]);
        expect(report.decayDurationSec).toBeGreaterThanOrEqual(0.015);
        expect(report.decayDurationSec).toBeLessThanOrEqual(0.035);

        for (const q of report.qualityFactors ?? []) {
            expect(q).toBeGreaterThanOrEqual(15);
            expect(q).toBeLessThanOrEqual(35);
        }
    });

    it('Preset 4 (Jeton de Casino Lourd 14g) : pression d’air 185 Hz + modes cristallins 2670 & 3890 Hz (Q=40), micro-rebond +6ms, notch à 3200 Hz', () => {
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5,
            nowMs: () => 1000,
        });

        const report = engine.playHeavyCasinoChip(0.85);
        expect(report.preset).toBe('HEAVY_CASINO_CHIP');
        expect(report.modalFrequenciesHz).toEqual([185, 2670, 3890]);
        expect(report.notchFrequencyHz).toBe(3200);
        expect(report.microBounceDelaySec).toBe(0.006);
        expect(report.qualityFactors).toContain(40);
        expect(HEAVY_CASINO_CHIP_SPEC.earCanalNotchHz).toBe(3200);

        const notchFilter = mockCtx._inspect.createdFilters.find((f) => f.type === 'notch');
        expect(notchFilter).toBeDefined();
        expect(notchFilter!.frequency.setValueAtTime).toHaveBeenCalledWith(3200, 0);
    });

    it('applique un Jitter stochastique borné à ±4 % ([0.96, 1.04]) et le ducking anti-fatigue en cadence rapide (< 220 ms)', () => {
        // Test des bornes exactes du Jitter (±4 %)
        expect(STOCHASTIC_JITTER_AMPLITUDE).toBe(0.04);
        expect(computeStochasticJitter(() => 0)).toBeCloseTo(0.96, 5);
        expect(computeStochasticJitter(() => 0.5)).toBeCloseTo(1.0, 5);
        expect(computeStochasticJitter(() => 1)).toBeCloseTo(1.04, 5);

        // Test du ducking de cadence rapide (Δt < 220 ms -> decay -30% et filtre passe-bas abaissé)
        const timestamps = [1000, 1140, 1500]; // Δt1 = 140 ms (< 220 ms : Blitz), Δt2 = 360 ms (>= 220 ms : Normal)
        let idx = 0;
        const engine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5, // Jitter = 1.0 pour isoler l'effet du ducking
            nowMs: () => timestamps[idx++] ?? 2000,
        });

        const first = engine.playFeltBrush(0.8);
        expect(first.isRapidCadenceDucking).toBe(false);
        expect(first.decayDurationSec).toBeCloseTo(FELT_MODES_HZ.decaySec, 5);
        expect(first.lowpassCutoffHz).toBeCloseTo(FELT_MODES_HZ.lowpassCutoffHz, 2);

        // Deuxième coup à +140 ms (< 220 ms) : ducking actif !
        const blitzSecond = engine.playFeltBrush(0.8);
        expect(blitzSecond.isRapidCadenceDucking).toBe(true);
        expect(blitzSecond.interStrokeDeltaMs).toBe(140);
        expect(blitzSecond.interStrokeDeltaMs).toBeLessThan(BLITZ_CADENCE_THRESHOLD_MS);
        expect(blitzSecond.decayDurationSec).toBeCloseTo(
            FELT_MODES_HZ.decaySec * BLITZ_DECAY_REDUCTION_FACTOR,
            5,
        );
        expect(blitzSecond.lowpassCutoffHz).toBeCloseTo(
            FELT_MODES_HZ.lowpassCutoffHz * BLITZ_LOWPASS_DUCKING_FACTOR,
            2,
        );

        // Troisième coup à +360 ms (>= 220 ms) : retour à la normale
        const normalThird = engine.playFeltBrush(0.8);
        expect(normalThird.isRapidCadenceDucking).toBe(false);
        expect(normalThird.decayDurationSec).toBeCloseTo(FELT_MODES_HZ.decaySec, 5);
        expect(normalThird.lowpassCutoffHz).toBeCloseTo(FELT_MODES_HZ.lowpassCutoffHz, 2);
    });
});

describe('SensoryFeedbackController — Séquençage Granulaire & Synchronisation Audio-Haptique', () => {
    let mockCtx: ReturnType<typeof createMockAudioContext>;
    let audioEngine: LuxuryBoardAudioEngine;

    beforeEach(() => {
        mockCtx = createMockAudioContext();
        audioEngine = new LuxuryBoardAudioEngine({
            audioContextFactory: () => mockCtx as unknown as AudioContext,
            rng: () => 0.5,
        });
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('déclenche le Blot Hit (bois noble capture 0.95 + jeton casino 0.85 + haptique freinée 15 ms) en < 15 ms et supporte l’alignement à 75 % du vol', () => {
        vi.useFakeTimers();
        const brakedSpy = vi.spyOn(haptics, 'triggerBrakedHapticPulse').mockResolvedValue();
        const woodSpy = vi.spyOn(audioEngine, 'playNobleWoodImpact');
        const chipSpy = vi.spyOn(audioEngine, 'playHeavyCasinoChip');

        const controller = new SensoryFeedbackController({
            audioEngine,
            initialSoundEnabled: true,
            initialHapticsEnabled: true,
        });

        const result = controller.triggerBlotHit();
        expect(result.syncLatencyMs).toBeLessThan(MAX_AUDIO_HAPTIC_SYNC_MS);
        expect(result.hapticDurationMs).toBe(BLOT_HIT_BRAKED_HAPTIC_MS);
        expect(woodSpy).toHaveBeenCalledWith(0.95, true);
        expect(chipSpy).toHaveBeenCalledWith(0.85);
        expect(brakedSpy).toHaveBeenCalledWith(15);

        // Test de l'alignement cinématique à 75 % du vol (ex: vol de 200 ms -> impact à 150 ms)
        woodSpy.mockClear();
        chipSpy.mockClear();
        brakedSpy.mockClear();

        const onApex = vi.fn();
        const delayMs = controller.scheduleBlotHitAtFlightApex(200, onApex);
        expect(delayMs).toBe(150);

        vi.advanceTimersByTime(149);
        expect(onApex).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onApex).toHaveBeenCalledTimes(1);
        expect(woodSpy).toHaveBeenCalledWith(0.95, true);
        expect(chipSpy).toHaveBeenCalledWith(0.85);
        expect(brakedSpy).toHaveBeenCalledWith(15);
    });

    it('exécute la séquence granulaire exacte de 610 ms (nappe feutre 500 ms + 10 impacts dégressifs)', () => {
        vi.useFakeTimers();
        const bedSpy = vi.spyOn(haptics, 'triggerContinuousHapticBed').mockResolvedValue();
        const vibrateSpy = vi.spyOn(haptics, 'vibrate').mockResolvedValue();
        const feltSpy = vi.spyOn(audioEngine, 'playFeltBrush');
        const ivorySpy = vi.spyOn(audioEngine, 'playIvoryDiceCollision');

        const controller = new SensoryFeedbackController({
            audioEngine,
            initialSoundEnabled: true,
            initialHapticsEnabled: true,
        });

        const recordedSteps: Array<{ timeMs: number; velocity: number; material: string }> = [];
        const seq = controller.triggerGranularDiceRoll((step) => {
            recordedSteps.push({
                timeMs: step.timeMs,
                velocity: step.velocity,
                material: step.material,
            });
        });

        expect(seq).toHaveLength(10);
        expect(GRANULAR_DICE_ROLL_DURATION_MS).toBe(610);
        expect(GRANULAR_DICE_FELT_BED_MS).toBe(500);
        expect(bedSpy).toHaveBeenCalledWith(500);

        // À t = 0 ms : 1er impact (0.95, feutre) déjà déclenché
        expect(recordedSteps).toHaveLength(1);
        expect(recordedSteps[0]).toEqual({ timeMs: 0, velocity: 0.95, material: 'felt' });

        // Avance jusqu'à 610 ms : les 10 impacts sont déclenchés dans l'ordre exact
        vi.advanceTimersByTime(610);
        expect(recordedSteps).toEqual([
            { timeMs: 0, velocity: 0.95, material: 'felt' },
            { timeMs: 18, velocity: 0.88, material: 'felt' },
            { timeMs: 45, velocity: 0.82, material: 'ivory' },
            { timeMs: 82, velocity: 0.74, material: 'ivory' },
            { timeMs: 130, velocity: 0.65, material: 'ivory' },
            { timeMs: 192, velocity: 0.56, material: 'ivory' },
            { timeMs: 270, velocity: 0.48, material: 'ivory' },
            { timeMs: 368, velocity: 0.40, material: 'ivory' },
            { timeMs: 485, velocity: 0.35, material: 'ivory' },
            { timeMs: 610, velocity: 0.32, material: 'ivory' },
        ]);
        expect(GRANULAR_DICE_ROLL_SEQUENCE).toHaveLength(10);
        expect(feltSpy).toHaveBeenCalledTimes(2);
        expect(ivorySpy).toHaveBeenCalledTimes(8);
        expect(vibrateSpy).toHaveBeenCalledTimes(9);
    });

    it('respecte scrupuleusement les paramètres isSoundEnabled et isHapticsEnabled', () => {
        const lightSpy = vi.spyOn(haptics, 'impactLight').mockResolvedValue();
        const feltSpy = vi.spyOn(audioEngine, 'playFeltBrush');
        const woodSpy = vi.spyOn(audioEngine, 'playNobleWoodImpact');

        const controller = new SensoryFeedbackController({
            audioEngine,
            initialSoundEnabled: false,
            initialHapticsEnabled: false,
        });

        controller.triggerStandardCheckerMove();
        controller.triggerMechanicalClick();
        expect(feltSpy).not.toHaveBeenCalled();
        expect(woodSpy).not.toHaveBeenCalled();
        expect(lightSpy).not.toHaveBeenCalled();

        controller.setSoundEnabled(true);
        controller.setHapticsEnabled(true);
        controller.triggerStandardCheckerMove();
        expect(feltSpy).toHaveBeenCalledWith(0.8);
        expect(woodSpy).toHaveBeenCalledWith(0.7, false);
        expect(lightSpy).toHaveBeenCalledTimes(1);
    });
});
