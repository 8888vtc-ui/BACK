/**
 * Moteur de Synthèse Audio Procédurale Pure Web Audio API (`soundEngine.ts` — 0 Ko d'Assets).
 *
 * Rôle :
 *   Implémente la doctrine acoustique « Cercle Monte-Carlo / Horlogerie Suisse » :
 *   - 2 tampons de bruit de 1.0 s pré-alloués en RAM (Bruit Blanc + Bruit Rose Paul Kellet -3 dB/oct),
 *     lus avec un offset aléatoire `0..0.5 s`.
 *   - Uniquement `sine` et `triangle` + filtres `BiquadFilterNode`, plancher `0.0001` avant `stop(end + 0.005)`.
 *   - Jitter stochastique (±3.5 % sur les fréquences, ±5 % sur les filtres).
 *   - 7 presets acoustiques d'orfèvrerie : `checkerSlideAndPlace`, `blotHit` (`StereoPannerNode` -0.45..+0.45),
 *     `diceRollAndBounce`, `doublingCubeDrop`, `bearOff` (+1.2 % par pion), `reviewBrilliantMove`, `reviewBlunderMove`.
 *
 * Strictement 0 `any`, ≤ 400 lignes.
 */

import { voiceCoach } from './voiceCoach';
import { luxuryBoardAudioEngine } from './LuxuryBoardAudioEngine';
import { sensoryFeedbackController } from './SensoryFeedbackController';
import {
    DICE_CUP_SHAKE_TIMES_MS,
    DIE_A_BOUNCE_TIMES_MS,
    DIE_A_PITCH_FACTOR,
    DIE_B_BOUNCE_TIMES_MS,
    DIE_B_PITCH_FACTOR,
    FILTER_CUTOFF_JITTER_PCT,
    OSCILLATOR_FREQ_JITTER_PCT,
    SAFE_EXPONENTIAL_GAIN_FLOOR,
    SAFE_NODE_STOP_MARGIN_SEC,
    applyStochasticJitter,
    computeBearOffPitchMultiplier,
    computePointStereoPan,
    computeRandomNoiseOffset,
} from '../gameFeel/sensoryPresets';

/** Synthétise un tampon de bruit blanc uniforme de 1.0 s en RAM. */
export function createWhiteNoiseBuffer(ctx: AudioContext, durationSec = 1.0, rng: () => number = Math.random): AudioBuffer {
    const sampleRate = ctx.sampleRate || 44100;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = rng() * 2 - 1;
    return buffer;
}

/** Synthétise un tampon de bruit rose (-3 dB/octave, filtre IIR de Paul Kellet) de 1.0 s en RAM. */
export function createPinkNoiseBuffer(ctx: AudioContext, durationSec = 1.0, rng: () => number = Math.random): AudioBuffer {
    const sampleRate = ctx.sampleRate || 44100;
    const length = Math.max(1, Math.floor(sampleRate * durationSec));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
        const white = rng() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
    }
    return buffer;
}

export class BackgammonSoundEngine {
    private ctx: AudioContext | null = null;
    private whiteNoiseBuffer: AudioBuffer | null = null;
    private pinkNoiseBuffer: AudioBuffer | null = null;
    private isMuted = false;
    private volume = 0.5;
    private readonly rng: () => number;
    private readonly audioContextFactory?: () => AudioContext | null;

    constructor(options?: { audioContextFactory?: () => AudioContext | null; rng?: () => number }) {
        this.audioContextFactory = options?.audioContextFactory;
        this.rng = options?.rng ?? Math.random;
        if (typeof window !== 'undefined' && !options?.audioContextFactory) {
            try {
                const savedMute = localStorage.getItem('bg_sound_muted');
                if (savedMute !== null) this.isMuted = savedMute === 'true';
            } catch { /* ignore */ }
        }
    }

    private getContext(): AudioContext | null {
        if (!this.ctx) {
            if (this.audioContextFactory) {
                this.ctx = this.audioContextFactory();
            } else if (typeof window !== 'undefined') {
                const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (AudioCtx) {
                    try { this.ctx = new AudioCtx(); } catch { this.ctx = null; }
                }
            }
        }
        if (this.ctx && this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
            this.ctx.resume().catch(() => {});
        }
        if (this.ctx && (!this.whiteNoiseBuffer || !this.pinkNoiseBuffer)) {
            try {
                this.whiteNoiseBuffer = createWhiteNoiseBuffer(this.ctx, 1.0, this.rng);
                this.pinkNoiseBuffer = createPinkNoiseBuffer(this.ctx, 1.0, this.rng);
            } catch { /* ignore */ }
        }
        return this.ctx;
    }

    public isMute(): boolean { return this.isMuted; }
    public setVolume(val: number): void { this.volume = Math.max(0, Math.min(1, val)); }
    public getVolume(): number { return this.volume; }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        luxuryBoardAudioEngine.setMuted(this.isMuted);
        sensoryFeedbackController.setSoundEnabled(!this.isMuted);
        if (typeof window !== 'undefined' && !this.audioContextFactory) {
            try { localStorage.setItem('bg_sound_muted', String(this.isMuted)); } catch { /* ignore */ }
        }
        return this.isMuted;
    }

    private jf(hz: number): number { return applyStochasticJitter(hz, OSCILLATOR_FREQ_JITTER_PCT, this.rng); }
    private jc(hz: number): number { return applyStochasticJitter(hz, FILTER_CUTOFF_JITTER_PCT, this.rng); }

    private makeFilter(ctx: AudioContext, type: BiquadFilterType, freqHz: number, q: number, t: number): BiquadFilterNode {
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.setValueAtTime(this.jc(freqHz), t);
        f.Q.setValueAtTime(q, t);
        return f;
    }

    private makeAdsrGain(ctx: AudioContext, t: number, peak: number, attackSec: number, endSec: number): GainNode {
        const g = ctx.createGain();
        g.gain.setValueAtTime(SAFE_EXPONENTIAL_GAIN_FLOOR, t);
        g.gain.linearRampToValueAtTime(Math.max(0.0002, peak * this.volume), t + attackSec);
        g.gain.exponentialRampToValueAtTime(SAFE_EXPONENTIAL_GAIN_FLOOR, t + endSec);
        return g;
    }

    private makeOsc(
        ctx: AudioContext, type: 'sine' | 'triangle', fStart: number, fEnd: number | null,
        sweepSec: number, t: number, durSec: number, dest: AudioNode,
    ): OscillatorNode {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(this.jf(fStart), t);
        if (fEnd !== null) osc.frequency.exponentialRampToValueAtTime(this.jf(fEnd), t + sweepSec);
        osc.connect(dest);
        osc.start(t);
        osc.stop(t + durSec + SAFE_NODE_STOP_MARGIN_SEC);
        return osc;
    }

    private spawnNoise(ctx: AudioContext, kind: 'white' | 'pink', startTime: number, durationSec: number): AudioBufferSourceNode | null {
        const buf = kind === 'pink' ? this.pinkNoiseBuffer : this.whiteNoiseBuffer;
        if (!buf) return null;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.start(startTime, computeRandomNoiseOffset(this.rng), durationSec + SAFE_NODE_STOP_MARGIN_SEC);
        src.stop(startTime + durationSec + SAFE_NODE_STOP_MARGIN_SEC);
        return src;
    }

    /** 1. Glissement sur feutre de laine (95 ms) suivi de la pose boisée (à t = 95 ms, 65 ms). */
    public checkerSlideAndPlace(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const pink = this.spawnNoise(ctx, 'pink', now, 0.095);
        if (pink) {
            const bp = this.makeFilter(ctx, 'bandpass', 1150, 1.8, now);
            const lp = this.makeFilter(ctx, 'lowpass', 2400, 0.7, now);
            const g1 = ctx.createGain();
            g1.gain.setValueAtTime(SAFE_EXPONENTIAL_GAIN_FLOOR, now);
            g1.gain.linearRampToValueAtTime(Math.max(0.0002, 0.09 * this.volume), now + 0.012);
            g1.gain.linearRampToValueAtTime(Math.max(0.0002, 0.06 * this.volume), now + 0.067);
            g1.gain.exponentialRampToValueAtTime(SAFE_EXPONENTIAL_GAIN_FLOOR, now + 0.095);
            pink.connect(bp); bp.connect(lp); lp.connect(g1); g1.connect(ctx.destination);
        }

        const t2 = now + 0.095;
        const lp2 = this.makeFilter(ctx, 'lowpass', 310, 2.4, t2);
        const g2 = this.makeAdsrGain(ctx, t2, 0.38, 0.002, 0.065);
        lp2.connect(g2); g2.connect(ctx.destination);
        this.makeOsc(ctx, 'sine', 185, 68, 0.028, t2, 0.065, lp2);

        const white = this.spawnNoise(ctx, 'white', t2, 0.015);
        if (white) {
            const bpW = this.makeFilter(ctx, 'bandpass', 2750, 3.2, t2);
            const gW = this.makeAdsrGain(ctx, t2, 0.14, 0.001, 0.015);
            white.connect(bpW); bpW.connect(gW); gW.connect(ctx.destination);
        }
    }

    /** 2. Frappe de blot (2 triangles désaccordés + résonance noyer + panoramique stéréo -0.45..+0.45). */
    public blotHit(pointIndex = 13): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const outNode: AudioNode = (() => {
            if (typeof ctx.createStereoPanner === 'function') {
                const panner = ctx.createStereoPanner();
                panner.pan.setValueAtTime(computePointStereoPan(pointIndex), now);
                panner.connect(ctx.destination);
                return panner;
            }
            return ctx.destination;
        })();

        const bp1 = this.makeFilter(ctx, 'bandpass', 1850, 2.6, now);
        const hp1 = this.makeFilter(ctx, 'highpass', 420, 0.7, now);
        const g1 = this.makeAdsrGain(ctx, now, 0.58, 0.0015, 0.0415);
        bp1.connect(hp1); hp1.connect(g1); g1.connect(outNode);

        this.makeOsc(ctx, 'triangle', 1480, 640, 0.022, now, 0.042, bp1);
        this.makeOsc(ctx, 'triangle', 2390, 1050, 0.022, now, 0.042, bp1);

        const white = this.spawnNoise(ctx, 'white', now, 0.012);
        if (white) {
            const bpW = this.makeFilter(ctx, 'bandpass', 3300, 4.0, now);
            white.connect(bpW); bpW.connect(bp1);
        }

        const t2 = now + 0.012;
        const lp2 = this.makeFilter(ctx, 'lowpass', 220, 3.8, t2);
        const g2 = this.makeAdsrGain(ctx, t2, 0.48, 0.003, 0.095);
        lp2.connect(g2); g2.connect(outNode);
        this.makeOsc(ctx, 'sine', 142, 46, 0.095, t2, 0.095, lp2);
    }

    /** 3. Secousse du cornet en cuir (t = 0, 58, 122 ms) et rebonds polyrythmiques des 2 dés sur le noyer. */
    public diceRollAndBounce(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const cupPeaks = [0.24, 0.19, 0.27] as const;
        DICE_CUP_SHAKE_TIMES_MS.forEach((ms, idx) => {
            const t = now + ms / 1000;
            const bp = this.makeFilter(ctx, 'bandpass', 650, 1.5, t);
            const lp = this.makeFilter(ctx, 'lowpass', 1150, 0.9, t);
            const g = this.makeAdsrGain(ctx, t, cupPeaks[idx] ?? 0.22, 0.004, 0.046);
            bp.connect(lp); lp.connect(g); g.connect(ctx.destination);
            this.makeOsc(ctx, 'triangle', 240, 130, 0.030, t, 0.046, bp);
            const pink = this.spawnNoise(ctx, 'pink', t, 0.046);
            if (pink) pink.connect(bp);
        });

        const triggerBounce = (ms: number, pf: number, baseGain: number, bounceIdx: number) => {
            const t = now + ms / 1000;
            const g = this.makeAdsrGain(ctx, t, baseGain * Math.pow(0.68, bounceIdx), 0.001, 0.029);
            g.connect(ctx.destination);
            this.makeOsc(ctx, 'sine', 420 * pf, 190 * pf, 0.015, t, 0.029, g);
            const white = this.spawnNoise(ctx, 'white', t, 0.008);
            if (white) {
                for (const modeHz of [840, 2120] as const) {
                    const bp = this.makeFilter(ctx, 'bandpass', modeHz * pf, 8.5, t);
                    white.connect(bp); bp.connect(g);
                }
            }
        };

        DIE_A_BOUNCE_TIMES_MS.forEach((ms, i) => triggerBounce(ms, DIE_A_PITCH_FACTOR, 0.42, i));
        DIE_B_BOUNCE_TIMES_MS.forEach((ms, i) => triggerBounce(ms, DIE_B_PITCH_FACTOR, 0.38, i));
    }

    /** 4. Pose du videau (cube en laiton brossé sur bois massif : sub-bass 96->36 Hz + 3 partiels inharmoniques). */
    public doublingCubeDrop(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const lpSub = this.makeFilter(ctx, 'lowpass', 155, 4.2, now);
        const gSub = this.makeAdsrGain(ctx, now, 0.65, 0.0025, 0.1575);
        lpSub.connect(gSub); gSub.connect(ctx.destination);
        this.makeOsc(ctx, 'sine', 96, 36, 0.070, now, 0.160, lpSub);

        const lpBrass = this.makeFilter(ctx, 'lowpass', 2850, 1.4, now);
        lpBrass.connect(ctx.destination);

        for (const [freqHz, peakGain, decaySec] of [[528, 0.28, 0.210], [1195, 0.14, 0.145], [2680, 0.06, 0.085]] as const) {
            const g = this.makeAdsrGain(ctx, now, peakGain, 0.0015, decaySec);
            g.connect(lpBrass);
            this.makeOsc(ctx, 'sine', freqHz, null, 0, now, decaySec, g);
        }

        const pink = this.spawnNoise(ctx, 'pink', now, 0.045);
        if (pink) {
            const bp = this.makeFilter(ctx, 'bandpass', 920, 2.0, now);
            const gP = this.makeAdsrGain(ctx, now, 0.18, 0.001, 0.045);
            pink.connect(bp); bp.connect(gP); gP.connect(lpBrass);
        }
    }

    /** 5. Sortie de pion dans la rainure de bear-off (+1.2 % de pitch-shift par pion déjà sorti 1..15). */
    public bearOff(checkersInTray = 1): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const shift = computeBearOffPitchMultiplier(checkersInTray);

        const triggerSlot = (t: number, bpHz: number, f0: number, f1: number, peak: number, atk: number, dec: number) => {
            const g = this.makeAdsrGain(ctx, t, peak, atk, atk + dec);
            g.connect(ctx.destination);
            this.makeOsc(ctx, 'triangle', f0 * shift, f1 * shift, 0.018, t, atk + dec, g);
            const white = this.spawnNoise(ctx, 'white', t, atk + dec);
            if (white) {
                const bp = this.makeFilter(ctx, 'bandpass', bpHz * shift, 5.5, t);
                white.connect(bp); bp.connect(g);
            }
        };

        triggerSlot(now, 2180, 590, 410, 0.30, 0.001, 0.034);
        triggerSlot(now + 0.028, 2440, 660, 460, 0.22, 0.0015, 0.046);
    }

    /** 6. Coup brillant / optimal post-match : arpège D5 (587.33 Hz), A5 (880.00 Hz), E6 (1318.51 Hz). */
    public reviewBrilliantMove(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const lp = this.makeFilter(ctx, 'lowpass', 3400, 0.7, now);
        const hp = this.makeFilter(ctx, 'highpass', 300, 0.7, now);
        lp.connect(hp); hp.connect(ctx.destination);

        for (const [freqHz, delaySec, peak] of [[587.33, 0, 0.20], [880.00, 0.018, 0.17], [1318.51, 0.036, 0.14]] as const) {
            const t = now + delaySec;
            const g = this.makeAdsrGain(ctx, t, peak, 0.012, 0.392);
            g.connect(lp);
            this.makeOsc(ctx, 'sine', freqHz, null, 0, t, 0.392, g);
            const triGain = ctx.createGain();
            triGain.gain.setValueAtTime(0.125, t);
            triGain.connect(g);
            this.makeOsc(ctx, 'triangle', freqHz, null, 0, t, 0.392, triGain);
        }
    }

    /** 7. Gaffe / Blunder post-match : seconde mineure amortie (G3 196 Hz + F#3 185 Hz, glissando -12 Hz sur 140 ms). */
    public reviewBlunderMove(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const lp = this.makeFilter(ctx, 'lowpass', 410, 1.2, now);
        const g = this.makeAdsrGain(ctx, now, 0.24, 0.015, 0.225);
        lp.connect(g); g.connect(ctx.destination);

        for (const baseHz of [196.0, 185.0] as const) {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(this.jf(baseHz), now);
            osc.frequency.linearRampToValueAtTime(this.jf(baseHz - 12), now + 0.140);
            osc.connect(lp);
            osc.start(now); osc.stop(now + 0.225 + SAFE_NODE_STOP_MARGIN_SEC);
        }

        const pink = this.spawnNoise(ctx, 'pink', now, 0.030);
        if (pink) {
            const bp = this.makeFilter(ctx, 'bandpass', 310, 2.0, now);
            pink.connect(bp); bp.connect(lp);
        }
    }

    public playDiceRoll(): void { this.diceRollAndBounce(); }
    public playCheckerSlide(): void { this.checkerSlideAndPlace(); }
    public playCheckerClack(): void { this.checkerSlideAndPlace(); }
    public playCheckerHit(pointIndex = 13): void { this.blotHit(pointIndex); }
    public playBearOff(checkersInTray = 1): void { this.bearOff(checkersInTray); }
    public playDoublingCube(): void { this.doublingCubeDrop(); }
    public playCubeOffer(): void { this.doublingCubeDrop(); }
    public playBlunderAlert(): void { this.reviewBlunderMove(); }
    public playBrilliantMove(): void { this.reviewBrilliantMove(); }
    public playVictory(): void { this.reviewBrilliantMove(); }

    public isVoiceCoachEnabled(): boolean { return voiceCoach.isEnabled(); }
    public toggleVoiceCoach(): boolean { return voiceCoach.toggleEnabled(); }
    public speakCoachAlert(text: string, locale = 'fr', force = false): boolean {
        return voiceCoach.speak(text, locale, { force, isGlobalMuted: this.isMuted });
    }
    public stopCoachVoice(): void { voiceCoach.stop(); }
}

export const soundEngine = new BackgammonSoundEngine();
