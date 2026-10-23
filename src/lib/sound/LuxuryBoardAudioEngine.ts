/**
 * Moteur de Synthèse Modale Procédurale Psychoacoustique Web Audio API (`LuxuryBoardAudioEngine`).
 *
 * Direction acoustique d'orfèvrerie (latence 0 ms, 0 fichier MP3 externe) :
 *   1. Excitation hybride Bruit Rose / Blanc de 1.0 s pré-synthétisée en RAM (filtre de Paul Kellet).
 *   2. Quatre Presets de Matériaux Physiques :
 *      - Preset 1 (`FELT_BRUSH`)        : Feutre épais (modes 95 Hz, 240 Hz, balayage fibres 620->1450 Hz Q=1.4, LPF 1800 Hz, attaque 6 ms, decay 42 ms).
 *      - Preset 2 (`NOBLE_WOOD`)        : Bois noble Ébène/Palissandre (modes 142 Hz, 315 Hz, 718 Hz, transitoire 1580 Hz < 15 ms, pitch shift -12% [0.88] sur capture, LPF 2600 Hz).
 *      - Preset 3 (`IVORY_DICE`)        : Collision d'Ivoire haute densité (modes inharmoniques 1120, 2480, 4150, 6800 Hz — ratios 1 : 2.21 : 3.71 : 6.07, Q ∈ [15, 35], decay 15–35 ms, zéro maintien).
 *      - Preset 4 (`HEAVY_CASINO_CHIP`) : Jeton de casino lourd 14g en argile composite (pression d'air 185 Hz + modes cristallins 2670 Hz & 3890 Hz Q=40, micro-rebond à +6 ms, encoche notch à 3200 Hz).
 *   3. Protection Psychoacoustique Anti-Fatigue & Jitter Stochastique :
 *      - Jitter aléatoire de ±4 % ([0.96, 1.04]) sur les fréquences modales et de coupure à chaque déclenchement.
 *      - Ducking dynamique en cadence rapide (Blitz, Δt < 220 ms) : réduction du decay de 30 % (×0.70) et abaissement dynamique du filtre passe-bas.
 *
 * Strictement 0 `any`.
 */

export type LuxuryMaterialPreset =
    | 'FELT_BRUSH'
    | 'NOBLE_WOOD'
    | 'IVORY_DICE'
    | 'HEAVY_CASINO_CHIP'
    | 'MECHANICAL_CLICK';

/** Durée du buffer d'excitation Bruit Rose / Blanc hybride en RAM (secondes). */
export const EXCITATION_NOISE_DURATION_SEC = 1.0;

/** Amplitude maximale du Jitter stochastique (±4 %). */
export const STOCHASTIC_JITTER_AMPLITUDE = 0.04;

/** Seuil de cadence inter-coups (ms) déclenchant la protection anti-fatigue Blitz. */
export const BLITZ_CADENCE_THRESHOLD_MS = 220;

/** Facteur multiplicatif de temps d'extinction en cadence Blitz (-30 % => ×0.70). */
export const BLITZ_DECAY_REDUCTION_FACTOR = 0.70;

/** Facteur multiplicatif d'abaissement dynamique du filtre passe-bas en cadence Blitz. */
export const BLITZ_LOWPASS_DUCKING_FACTOR = 0.72;

// ---------------------------------------------------------------------------
// Constantes spectrales des 4 Presets de Matériaux d'Orfèvrerie
// ---------------------------------------------------------------------------

/** Preset 1 : Feutre Épais */
export const FELT_MODES_HZ = Object.freeze({
    subTableHz: 95,
    bodyHz: 240,
    fiberSweepStartHz: 620,
    fiberSweepEndHz: 1450,
    fiberQ: 1.4,
    lowpassCutoffHz: 1800,
    attackSec: 0.006,
    decaySec: 0.042,
});

/** Preset 2 : Bois Noble (Ébène / Palissandre) */
export const NOBLE_WOOD_SPEC = Object.freeze({
    fundamentalHz: 142,
    mode1Hz: 315,
    mode2Hz: 718,
    attackTransientHz: 1580,
    attackTransientDecaySec: 0.012, // < 15 ms (b3 élevé)
    capturePitchFactor: 0.88, // -12 % sur capture
    lowpassCutoffHz: 2600,
    baseDecaySec: 0.065,
});

/** Preset 3 : Collision d'Ivoire / Résine Haute Densité (Dés) */
export const IVORY_DICE_SPEC = Object.freeze({
    modesHz: Object.freeze([1120, 2480, 4150, 6800] as const),
    ratios: Object.freeze([1, 2.21, 3.71, 6.07] as const),
    modalQ: Object.freeze([18, 24, 30, 35] as const), // Q entre 15 et 35
    minDecaySec: 0.015, // 15 ms
    maxDecaySec: 0.035, // 35 ms
    sustainGain: 0,
    lowpassCutoffHz: 7600,
});

/** Preset 4 : Jeton de Casino Lourd / Dame en Argile Composite 14g */
export const HEAVY_CASINO_CHIP_SPEC = Object.freeze({
    airPressureHz: 185,
    crystalModesHz: Object.freeze([2670, 3890] as const),
    crystalQ: 40,
    microBounceDelaySec: 0.006, // +6 ms
    earCanalNotchHz: 3200,
    earCanalNotchQ: 4.5,
    lowpassCutoffHz: 5200,
    baseDecaySec: 0.048,
});

/** Rapport télémétrique d'une émission modale (utilisé par les tests unitaires et le profilage). */
export interface ModalSynthesisDispatchReport {
    readonly preset: LuxuryMaterialPreset;
    readonly velocity: number;
    readonly jitterFactor: number;
    readonly modalFrequenciesHz: readonly number[];
    readonly lowpassCutoffHz: number;
    readonly decayDurationSec: number;
    readonly attackDurationSec: number;
    readonly isRapidCadenceDucking: boolean;
    readonly interStrokeDeltaMs: number | null;
    readonly pitchMultiplier: number;
    readonly notchFrequencyHz?: number;
    readonly microBounceDelaySec?: number;
    readonly qualityFactors?: readonly number[];
}

export interface LuxuryBoardAudioEngineOptions {
    /** Fabrique d'AudioContext injectable pour les tests unitaires. */
    readonly audioContextFactory?: () => AudioContext | null;
    /** Générateur aléatoire injectable (dans [0, 1[) pour tester le Jitter de ±4 %. */
    readonly rng?: () => number;
    /** Horloge monotone injectable (en ms) pour tester le ducking de cadence (< 220 ms). */
    readonly nowMs?: () => number;
}

/**
 * Calcule un facteur de Jitter stochastique borné dans `[1 - 0.04, 1 + 0.04]` = `[0.96, 1.04]`.
 */
export function computeStochasticJitter(rng: () => number = Math.random): number {
    const u = Math.max(0, Math.min(1, rng()));
    const delta = (u * 2 - 1) * STOCHASTIC_JITTER_AMPLITUDE;
    return Number((1 + delta).toFixed(6));
}

/**
 * Synthétise en RAM un `AudioBuffer` de 1.0 s de bruit rose / blanc hybride (algorithme de Paul Kellet)
 * sans aucun appel réseau ni fichier externe.
 */
export function synthesizeHybridPinkNoiseBuffer(
    ctx: AudioContext,
    durationSec: number = EXCITATION_NOISE_DURATION_SEC,
    rng: () => number = Math.random,
): AudioBuffer {
    const sampleRate = ctx.sampleRate || 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < frameCount; i++) {
        const white = rng() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;

        // Mélange hybride : 75 % bruit rose (chaleur organique) + 25 % bruit blanc (attaque granulaire)
        const sample = pink * 0.75 + white * 0.25;
        channelData[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
}

function clampVelocity(velocity: number): number {
    if (!Number.isFinite(velocity)) return 0.75;
    return Math.max(0.05, Math.min(1.0, velocity));
}

export class LuxuryBoardAudioEngine {
    private ctx: AudioContext | null = null;
    private excitationBuffer: AudioBuffer | null = null;
    private isMuted: boolean = false;
    private masterVolume: number = 0.65;
    private lastSoundTimestampMs: number | null = null;
    private lastDispatchReport: ModalSynthesisDispatchReport | null = null;

    private readonly audioContextFactory?: () => AudioContext | null;
    private readonly rng: () => number;
    private readonly nowMs: () => number;

    constructor(options: LuxuryBoardAudioEngineOptions = {}) {
        this.audioContextFactory = options.audioContextFactory;
        this.rng = options.rng ?? Math.random;
        this.nowMs =
            options.nowMs ??
            (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

        if (typeof window !== 'undefined' && !options.audioContextFactory) {
            try {
                const savedMute = window.localStorage?.getItem('bg_sound_muted');
                if (savedMute !== null) {
                    this.isMuted = savedMute === 'true';
                }
            } catch {
                // localStorage indisponible
            }
        }
    }

    /**
     * Préchauffe l'AudioContext et alloue le buffer de bruit rose de 1.0 s en RAM (latence 0 ms).
     */
    public prewarm(): boolean {
        const ctx = this.ensureContext();
        return ctx !== null && this.excitationBuffer !== null;
    }

    public getExcitationBuffer(): AudioBuffer | null {
        this.ensureContext();
        return this.excitationBuffer;
    }

    public getLastDispatchReport(): ModalSynthesisDispatchReport | null {
        return this.lastDispatchReport;
    }

    public isMute(): boolean {
        return this.isMuted;
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
        if (typeof window !== 'undefined' && !this.audioContextFactory) {
            try {
                window.localStorage?.setItem('bg_sound_muted', String(this.isMuted));
            } catch {
                // ignore
            }
        }
    }

    public toggleMute(): boolean {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    public setVolume(volume: number): void {
        if (!Number.isFinite(volume)) return;
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    public getVolume(): number {
        return this.masterVolume;
    }

    public resetCadenceTracker(): void {
        this.lastSoundTimestampMs = null;
    }

    private ensureContext(): AudioContext | null {
        if (!this.ctx) {
            if (this.audioContextFactory) {
                this.ctx = this.audioContextFactory();
            } else if (typeof window !== 'undefined') {
                const AudioCtx =
                    window.AudioContext ||
                    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    try {
                        this.ctx = new AudioCtx();
                    } catch {
                        this.ctx = null;
                    }
                }
            }
        }

        if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
            this.ctx.resume().catch(() => {});
        }

        if (this.ctx && !this.excitationBuffer) {
            try {
                this.excitationBuffer = synthesizeHybridPinkNoiseBuffer(
                    this.ctx,
                    EXCITATION_NOISE_DURATION_SEC,
                    this.rng,
                );
            } catch {
                this.excitationBuffer = null;
            }
        }

        return this.ctx;
    }

    /**
     * Évalue la cadence inter-coups et retourne les facteurs de protection anti-fatigue.
     */
    private evaluateCadenceProtection(): {
        isRapidCadenceDucking: boolean;
        interStrokeDeltaMs: number | null;
        decayMultiplier: number;
        cutoffMultiplier: number;
        jitterFactor: number;
    } {
        const currentMs = this.nowMs();
        const deltaMs =
            this.lastSoundTimestampMs !== null ? Math.max(0, currentMs - this.lastSoundTimestampMs) : null;
        this.lastSoundTimestampMs = currentMs;

        const isRapid = deltaMs !== null && deltaMs < BLITZ_CADENCE_THRESHOLD_MS;
        return {
            isRapidCadenceDucking: isRapid,
            interStrokeDeltaMs: deltaMs,
            decayMultiplier: isRapid ? BLITZ_DECAY_REDUCTION_FACTOR : 1.0,
            cutoffMultiplier: isRapid ? BLITZ_LOWPASS_DUCKING_FACTOR : 1.0,
            jitterFactor: computeStochasticJitter(this.rng),
        };
    }

    /**
     * Preset 1 : Feutre Épais (`playFeltBrush`)
     * - Modes : Sub-table 95 Hz (corps du plateau), corps 240 Hz, fibres textiles balayant de 620 Hz à 1450 Hz (Q = 1.4).
     * - Filtre passe-bas anti-fatigue à 1800 Hz.
     * - Attaque douce Tc ≈ 6 ms, extinction rapide en 42 ms.
     */
    public playFeltBrush(velocity: number = 0.8): ModalSynthesisDispatchReport {
        const vel = clampVelocity(velocity);
        const {
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            decayMultiplier,
            cutoffMultiplier,
            jitterFactor,
        } = this.evaluateCadenceProtection();

        const subTableHz = Number((FELT_MODES_HZ.subTableHz * jitterFactor).toFixed(2));
        const bodyHz = Number((FELT_MODES_HZ.bodyHz * jitterFactor).toFixed(2));
        const fiberStartHz = Number((FELT_MODES_HZ.fiberSweepStartHz * jitterFactor).toFixed(2));
        const fiberEndHz = Number((FELT_MODES_HZ.fiberSweepEndHz * jitterFactor).toFixed(2));
        const lowpassCutoffHz = Number(
            (FELT_MODES_HZ.lowpassCutoffHz * jitterFactor * cutoffMultiplier).toFixed(2),
        );
        const attackSec = FELT_MODES_HZ.attackSec;
        const decaySec = Number((FELT_MODES_HZ.decaySec * decayMultiplier).toFixed(5));

        const report: ModalSynthesisDispatchReport = {
            preset: 'FELT_BRUSH',
            velocity: vel,
            jitterFactor,
            modalFrequenciesHz: [subTableHz, bodyHz, fiberStartHz, fiberEndHz],
            lowpassCutoffHz,
            decayDurationSec: decaySec,
            attackDurationSec: attackSec,
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            pitchMultiplier: 1.0,
            qualityFactors: [FELT_MODES_HZ.fiberQ],
        };
        this.lastDispatchReport = report;

        if (this.isMuted) return report;
        const ctx = this.ensureContext();
        if (!ctx) return report;

        try {
            const now = ctx.currentTime;
            const totalDurationSec = attackSec + decaySec;
            const peakGain = vel * 0.28 * this.masterVolume;

            // Filtre passe-bas anti-fatigue à 1800 Hz (modulé par jitter & cadence)
            const antiFatigueLowpass = ctx.createBiquadFilter();
            antiFatigueLowpass.type = 'lowpass';
            antiFatigueLowpass.frequency.setValueAtTime(lowpassCutoffHz, now);

            const masterEnv = ctx.createGain();
            masterEnv.gain.setValueAtTime(0.0001, now);
            masterEnv.gain.linearRampToValueAtTime(Math.max(0.0002, peakGain), now + attackSec);
            masterEnv.gain.exponentialRampToValueAtTime(0.0001, now + totalDurationSec);

            antiFatigueLowpass.connect(masterEnv);
            masterEnv.connect(ctx.destination);

            // 1. Excitation Bruit Rose à travers le filtre balayant les fibres textiles (620 Hz -> 1450 Hz, Q = 1.4)
            if (this.excitationBuffer) {
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = this.excitationBuffer;

                const fiberBandpass = ctx.createBiquadFilter();
                fiberBandpass.type = 'bandpass';
                fiberBandpass.Q.setValueAtTime(FELT_MODES_HZ.fiberQ, now);
                fiberBandpass.frequency.setValueAtTime(fiberStartHz, now);
                fiberBandpass.frequency.exponentialRampToValueAtTime(
                    Math.max(20, fiberEndHz),
                    now + totalDurationSec,
                );

                noiseSource.connect(fiberBandpass);
                fiberBandpass.connect(antiFatigueLowpass);

                const offset = (this.rng() * 0.5) % Math.max(0.1, EXCITATION_NOISE_DURATION_SEC - 0.1);
                noiseSource.start(now, offset, totalDurationSec + 0.01);
                noiseSource.stop(now + totalDurationSec + 0.01);
            }

            // 2. Modes de plateau : Sub-table (95 Hz) et Corps (240 Hz)
            const modalPairs: readonly [number, number][] = [
                [subTableHz, 0.45],
                [bodyHz, 0.35],
            ];
            for (const [freqHz, weight] of modalPairs) {
                const osc = ctx.createOscillator();
                const modeGain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freqHz, now);

                modeGain.gain.setValueAtTime(weight, now);
                osc.connect(modeGain);
                modeGain.connect(antiFatigueLowpass);

                osc.start(now);
                osc.stop(now + totalDurationSec + 0.01);
            }
        } catch {
            // Repli silencieux si Web Audio est partiellement mocké
        }

        return report;
    }

    /**
     * Preset 2 : Bois Noble (Ébène / Palissandre - Déplacement standard & Capture)
     * - Modes de plaque et cavité : 142 Hz (fondamentale chaude), 315 Hz (Mode 1), 718 Hz (Mode 2),
     *   transitoire d'attaque à 1580 Hz avec b3 élevé (extinction en < 15 ms).
     * - Sur capture / frappe de blot (`isCapture = true`) : pitch shift de -12 % (0.88).
     * - Filtre passe-bas master à 2600 Hz.
     */
    public playNobleWoodImpact(
        velocity: number = 0.7,
        isCapture: boolean = false,
    ): ModalSynthesisDispatchReport {
        const vel = clampVelocity(velocity);
        const {
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            decayMultiplier,
            cutoffMultiplier,
            jitterFactor,
        } = this.evaluateCadenceProtection();

        const pitchMultiplier = isCapture ? NOBLE_WOOD_SPEC.capturePitchFactor : 1.0;
        const combinedScale = pitchMultiplier * jitterFactor;

        const f0 = Number((NOBLE_WOOD_SPEC.fundamentalHz * combinedScale).toFixed(2));
        const f1 = Number((NOBLE_WOOD_SPEC.mode1Hz * combinedScale).toFixed(2));
        const f2 = Number((NOBLE_WOOD_SPEC.mode2Hz * combinedScale).toFixed(2));
        const fTransient = Number((NOBLE_WOOD_SPEC.attackTransientHz * combinedScale).toFixed(2));

        const lowpassCutoffHz = Number(
            (NOBLE_WOOD_SPEC.lowpassCutoffHz * jitterFactor * cutoffMultiplier).toFixed(2),
        );
        const decaySec = Number((NOBLE_WOOD_SPEC.baseDecaySec * decayMultiplier).toFixed(5));
        const transientDecaySec = Number(
            Math.min(0.014, NOBLE_WOOD_SPEC.attackTransientDecaySec * decayMultiplier).toFixed(5),
        );

        const report: ModalSynthesisDispatchReport = {
            preset: 'NOBLE_WOOD',
            velocity: vel,
            jitterFactor,
            modalFrequenciesHz: [f0, f1, f2, fTransient],
            lowpassCutoffHz,
            decayDurationSec: decaySec,
            attackDurationSec: 0.001,
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            pitchMultiplier,
        };
        this.lastDispatchReport = report;

        if (this.isMuted) return report;
        const ctx = this.ensureContext();
        if (!ctx) return report;

        try {
            const now = ctx.currentTime;
            const masterLowpass = ctx.createBiquadFilter();
            masterLowpass.type = 'lowpass';
            masterLowpass.frequency.setValueAtTime(lowpassCutoffHz, now);
            masterLowpass.connect(ctx.destination);

            // Modes [fréquence, amplitude relative, durée d'extinction]
            const modes: readonly [number, number, number][] = [
                [f0, isCapture ? 0.58 : 0.44, decaySec],
                [f1, 0.34, decaySec * 0.72],
                [f2, 0.22, decaySec * 0.45],
                [fTransient, 0.28, transientDecaySec], // Extinction rapide < 15 ms (b3 élevé)
            ];

            for (const [freqHz, amp, modeDecay] of modes) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = freqHz === fTransient ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freqHz, now);

                const peak = Math.max(0.0002, vel * amp * this.masterVolume);
                gain.gain.setValueAtTime(peak, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + modeDecay);

                osc.connect(gain);
                gain.connect(masterLowpass);

                osc.start(now);
                osc.stop(now + modeDecay + 0.005);
            }

            // Impulsion d'excitation en bruit rose filtré sur le transitoire d'attaque (< 15 ms)
            if (this.excitationBuffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = this.excitationBuffer;

                const woodBandpass = ctx.createBiquadFilter();
                woodBandpass.type = 'bandpass';
                woodBandpass.frequency.setValueAtTime(fTransient, now);
                woodBandpass.Q.setValueAtTime(6.0, now);

                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(Math.max(0.0002, vel * 0.24 * this.masterVolume), now);
                noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + transientDecaySec);

                noise.connect(woodBandpass);
                woodBandpass.connect(noiseGain);
                noiseGain.connect(masterLowpass);

                noise.start(now, 0, transientDecaySec + 0.005);
                noise.stop(now + transientDecaySec + 0.005);
            }
        } catch {
            // Repli silencieux
        }

        return report;
    }

    /**
     * Preset 3 : Collision d'Ivoire / Résine Haute Densité (Dés)
     * - Modes inharmoniques : 1120 Hz, 2480 Hz, 4150 Hz, 6800 Hz (ratios 1 : 2.21 : 3.71 : 6.07).
     * - Facteur de qualité élevé (Q entre 15 et 35), enveloppe très courte (15 ms à 35 ms), zéro maintien.
     */
    public playIvoryDiceCollision(velocity: number = 0.8): ModalSynthesisDispatchReport {
        const vel = clampVelocity(velocity);
        const {
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            decayMultiplier,
            cutoffMultiplier,
            jitterFactor,
        } = this.evaluateCadenceProtection();

        const modalFrequenciesHz = IVORY_DICE_SPEC.modesHz.map((hz) =>
            Number((hz * jitterFactor).toFixed(2)),
        );
        const lowpassCutoffHz = Number(
            (IVORY_DICE_SPEC.lowpassCutoffHz * jitterFactor * cutoffMultiplier).toFixed(2),
        );

        // Enveloppe très courte strictement comprise entre 15 ms et 35 ms (modulée en Blitz)
        const baseEnvelopeSec = 0.028;
        const decaySec = Number(
            Math.max(
                IVORY_DICE_SPEC.minDecaySec * decayMultiplier,
                Math.min(IVORY_DICE_SPEC.maxDecaySec, baseEnvelopeSec * decayMultiplier),
            ).toFixed(5),
        );

        const report: ModalSynthesisDispatchReport = {
            preset: 'IVORY_DICE',
            velocity: vel,
            jitterFactor,
            modalFrequenciesHz,
            lowpassCutoffHz,
            decayDurationSec: decaySec,
            attackDurationSec: 0.0005,
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            pitchMultiplier: 1.0,
            qualityFactors: [...IVORY_DICE_SPEC.modalQ],
        };
        this.lastDispatchReport = report;

        if (this.isMuted) return report;
        const ctx = this.ensureContext();
        if (!ctx) return report;

        try {
            const now = ctx.currentTime;
            const masterLowpass = ctx.createBiquadFilter();
            masterLowpass.type = 'lowpass';
            masterLowpass.frequency.setValueAtTime(lowpassCutoffHz, now);
            masterLowpass.connect(ctx.destination);

            const modeWeights = [0.42, 0.30, 0.18, 0.10] as const;
            const modeDecays = [
                decaySec,
                Math.max(0.015 * decayMultiplier, decaySec * 0.82),
                Math.max(0.015 * decayMultiplier, decaySec * 0.68),
                Math.max(0.015 * decayMultiplier, decaySec * 0.55),
            ];

            modalFrequenciesHz.forEach((freqHz, idx) => {
                const qFactor = IVORY_DICE_SPEC.modalQ[idx] ?? 25;
                const modeDecay = modeDecays[idx] ?? decaySec;
                const weight = modeWeights[idx] ?? 0.15;

                // Résonateur modal à Q élevé (15..35)
                const resonator = ctx.createBiquadFilter();
                resonator.type = 'bandpass';
                resonator.frequency.setValueAtTime(freqHz, now);
                resonator.Q.setValueAtTime(qFactor, now);

                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freqHz, now);

                const gain = ctx.createGain();
                const peak = Math.max(0.0002, vel * weight * 0.55 * this.masterVolume);
                gain.gain.setValueAtTime(peak, now);
                // Zéro maintien (sustain = 0) : décroissance exponentielle immédiate
                gain.gain.exponentialRampToValueAtTime(0.0001, now + modeDecay);

                osc.connect(resonator);
                resonator.connect(gain);
                gain.connect(masterLowpass);

                osc.start(now);
                osc.stop(now + modeDecay + 0.004);
            });

            if (this.excitationBuffer) {
                const noise = ctx.createBufferSource();
                noise.buffer = this.excitationBuffer;

                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(Math.max(0.0002, vel * 0.18 * this.masterVolume), now);
                noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015 * decayMultiplier);

                noise.connect(noiseGain);
                noiseGain.connect(masterLowpass);

                const offset = (this.rng() * 0.7) % Math.max(0.1, EXCITATION_NOISE_DURATION_SEC - 0.05);
                noise.start(now, offset, 0.02);
                noise.stop(now + 0.02);
            }
        } catch {
            // Repli silencieux
        }

        return report;
    }

    /**
     * Preset 4 : Jeton de Casino Lourd / Dame en Argile Composite 14g (`playHeavyCasinoChip`)
     * - Signature bimodale : Pression d'air 185 Hz + modes cristallins couplés à 2670 Hz et 3890 Hz (Q ≈ 40).
     * - Micro-rebond de tassement à +6 ms.
     * - Encoche (notch) à 3200 Hz pour protéger le pic de sensibilité du conduit auditif.
     */
    public playHeavyCasinoChip(velocity: number = 0.85): ModalSynthesisDispatchReport {
        const vel = clampVelocity(velocity);
        const {
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            decayMultiplier,
            cutoffMultiplier,
            jitterFactor,
        } = this.evaluateCadenceProtection();

        const airHz = Number((HEAVY_CASINO_CHIP_SPEC.airPressureHz * jitterFactor).toFixed(2));
        const crystal1Hz = Number((HEAVY_CASINO_CHIP_SPEC.crystalModesHz[0] * jitterFactor).toFixed(2));
        const crystal2Hz = Number((HEAVY_CASINO_CHIP_SPEC.crystalModesHz[1] * jitterFactor).toFixed(2));
        const notchHz = Number((HEAVY_CASINO_CHIP_SPEC.earCanalNotchHz * jitterFactor).toFixed(2));
        const lowpassCutoffHz = Number(
            (HEAVY_CASINO_CHIP_SPEC.lowpassCutoffHz * jitterFactor * cutoffMultiplier).toFixed(2),
        );
        const decaySec = Number((HEAVY_CASINO_CHIP_SPEC.baseDecaySec * decayMultiplier).toFixed(5));

        const report: ModalSynthesisDispatchReport = {
            preset: 'HEAVY_CASINO_CHIP',
            velocity: vel,
            jitterFactor,
            modalFrequenciesHz: [airHz, crystal1Hz, crystal2Hz],
            lowpassCutoffHz,
            decayDurationSec: decaySec,
            attackDurationSec: 0.001,
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            pitchMultiplier: 1.0,
            notchFrequencyHz: notchHz,
            microBounceDelaySec: HEAVY_CASINO_CHIP_SPEC.microBounceDelaySec,
            qualityFactors: [HEAVY_CASINO_CHIP_SPEC.crystalQ],
        };
        this.lastDispatchReport = report;

        if (this.isMuted) return report;
        const ctx = this.ensureContext();
        if (!ctx) return report;

        try {
            const now = ctx.currentTime;

            // Encoche psychoacoustique à 3200 Hz (protection du conduit auditif)
            const earCanalNotch = ctx.createBiquadFilter();
            earCanalNotch.type = 'notch';
            earCanalNotch.frequency.setValueAtTime(notchHz, now);
            earCanalNotch.Q.setValueAtTime(HEAVY_CASINO_CHIP_SPEC.earCanalNotchQ, now);

            const masterLowpass = ctx.createBiquadFilter();
            masterLowpass.type = 'lowpass';
            masterLowpass.frequency.setValueAtTime(lowpassCutoffHz, now);

            earCanalNotch.connect(masterLowpass);
            masterLowpass.connect(ctx.destination);

            const triggerBimodalStrike = (startTime: number, strikeVel: number) => {
                // 1. Pression d'air sub-grave (185 Hz)
                const airOsc = ctx.createOscillator();
                const airGain = ctx.createGain();
                airOsc.type = 'sine';
                airOsc.frequency.setValueAtTime(airHz, startTime);
                airOsc.frequency.exponentialRampToValueAtTime(Math.max(45, airHz * 0.58), startTime + decaySec);

                airGain.gain.setValueAtTime(Math.max(0.0002, strikeVel * 0.46 * this.masterVolume), startTime);
                airGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decaySec);

                airOsc.connect(airGain);
                airGain.connect(earCanalNotch);
                airOsc.start(startTime);
                airOsc.stop(startTime + decaySec + 0.005);

                // 2. Modes cristallins couplés (2670 Hz et 3890 Hz, Q ≈ 40)
                for (const crystalHz of [crystal1Hz, crystal2Hz]) {
                    const resonator = ctx.createBiquadFilter();
                    resonator.type = 'bandpass';
                    resonator.frequency.setValueAtTime(crystalHz, startTime);
                    resonator.Q.setValueAtTime(HEAVY_CASINO_CHIP_SPEC.crystalQ, startTime);

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(crystalHz, startTime);

                    const cDecay = decaySec * 0.62;
                    gain.gain.setValueAtTime(Math.max(0.0002, strikeVel * 0.22 * this.masterVolume), startTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + cDecay);

                    osc.connect(resonator);
                    resonator.connect(gain);
                    gain.connect(earCanalNotch);
                    osc.start(startTime);
                    osc.stop(startTime + cDecay + 0.004);
                }
            };

            // Impact principal à t = 0 ms + micro-rebond de tassement à +6 ms
            triggerBimodalStrike(now, vel);
            triggerBimodalStrike(now + HEAVY_CASINO_CHIP_SPEC.microBounceDelaySec, vel * 0.45);
        } catch {
            // Repli silencieux
        }

        return report;
    }

    /**
     * Micro-clic mécanique sec d'horlogerie (Validation de tour / Bouton Lancer).
     */
    public playMechanicalClick(velocity: number = 0.65): ModalSynthesisDispatchReport {
        const vel = clampVelocity(velocity);
        const {
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            decayMultiplier,
            cutoffMultiplier,
            jitterFactor,
        } = this.evaluateCadenceProtection();

        const clickFreqHz = Number((1850 * jitterFactor).toFixed(2));
        const bodyFreqHz = Number((420 * jitterFactor).toFixed(2));
        const lowpassCutoffHz = Number((2400 * jitterFactor * cutoffMultiplier).toFixed(2));
        const decaySec = Number((0.014 * decayMultiplier).toFixed(5));

        const report: ModalSynthesisDispatchReport = {
            preset: 'MECHANICAL_CLICK',
            velocity: vel,
            jitterFactor,
            modalFrequenciesHz: [bodyFreqHz, clickFreqHz],
            lowpassCutoffHz,
            decayDurationSec: decaySec,
            attackDurationSec: 0.0005,
            isRapidCadenceDucking,
            interStrokeDeltaMs,
            pitchMultiplier: 1.0,
        };
        this.lastDispatchReport = report;

        if (this.isMuted) return report;
        const ctx = this.ensureContext();
        if (!ctx) return report;

        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(clickFreqHz, now);
            osc.frequency.exponentialRampToValueAtTime(bodyFreqHz, now + decaySec);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(lowpassCutoffHz, now);

            gain.gain.setValueAtTime(Math.max(0.0002, vel * 0.25 * this.masterVolume), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + decaySec);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + decaySec + 0.003);
        } catch {
            // Repli silencieux
        }

        return report;
    }
}

export const luxuryBoardAudioEngine = new LuxuryBoardAudioEngine();
export default luxuryBoardAudioEngine;
