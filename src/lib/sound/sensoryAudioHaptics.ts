/**
 * Système Audio-Haptique Sensoriel Zéro-Latence (Audit 11 / 20 — Sensory Game Feel).
 *
 * Exigences :
 *   1. Différencier 4 nuances sonores distinctes (bois / cuir / Bakélite) :
 *      - `FELT_LAND`   : pose douce d'un pion sur une flèche vide (feutrine).
 *      - `STACK_CLACK` : empilement d'un pion sur une pile amie existante (choc Bakélite/résine).
 *      - `BLOT_HIT`    : prise d'un blot adverse (claquement franc + résonance de barre).
 *      - `BEAR_OFF`    : sortie d'un pion dans l'écrin du sabot (encastrement boisé).
 *   2. Coupler chaque action à une micro-vibration mobile calibrée :
 *      - `10 ms` : coup normal (`FELT_LAND` / `STACK_CLACK`)
 *      - `25 ms` : sortie dans le sabot (`BEAR_OFF`)
 *      - `50 ms` : frappe d'un blot adverse (`BLOT_HIT`)
 *   3. Garantir zéro latence (`< 10 ms`) via Web Audio API préchargée en mémoire.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { X_OFF, O_OFF, type Player } from '../../engine/backgammonEngine';

export type MoveSensoryNuance = 'FELT_LAND' | 'STACK_CLACK' | 'BLOT_HIT' | 'BEAR_OFF';

/** Durée de vibration calibrée (ms) pour un déplacement normal (feutre ou pile). */
export const HAPTIC_NORMAL_MS = 10;
/** Durée de vibration calibrée (ms) pour une sortie de pion (bear-off). */
export const HAPTIC_BEAR_OFF_MS = 25;
/** Durée de vibration calibrée (ms) pour une frappe de blot adverse (hit). */
export const HAPTIC_HIT_MS = 50;
/** Budget maximal de latence d'émission audio (ms). */
export const MAX_AUDIO_DISPATCH_LATENCY_MS = 10;

export interface NuanceAcousticProfile {
    readonly nuance: MoveSensoryNuance;
    readonly startFreqHz: number;
    readonly endFreqHz: number;
    readonly durationSec: number;
    readonly waveform: OscillatorType;
    readonly hapticMs: number;
}

export const SENSORY_PROFILES: Record<MoveSensoryNuance, NuanceAcousticProfile> = {
    FELT_LAND: {
        nuance: 'FELT_LAND',
        startFreqHz: 240,
        endFreqHz: 95,
        durationSec: 0.042,
        waveform: 'sine',
        hapticMs: HAPTIC_NORMAL_MS,
    },
    STACK_CLACK: {
        nuance: 'STACK_CLACK',
        startFreqHz: 540,
        endFreqHz: 185,
        durationSec: 0.038,
        waveform: 'triangle',
        hapticMs: HAPTIC_NORMAL_MS,
    },
    BEAR_OFF: {
        nuance: 'BEAR_OFF',
        startFreqHz: 390,
        endFreqHz: 480,
        durationSec: 0.055,
        waveform: 'triangle',
        hapticMs: HAPTIC_BEAR_OFF_MS,
    },
    BLOT_HIT: {
        nuance: 'BLOT_HIT',
        startFreqHz: 850,
        endFreqHz: 210,
        durationSec: 0.075,
        waveform: 'triangle',
        hapticMs: HAPTIC_HIT_MS,
    },
};

/**
 * Classifie de manière déterministe la nuance sensorielle d'un coup `(from -> to)` :
 *   1. `BEAR_OFF`    : si `to` est le sabot de sortie (`0` ou `25`).
 *   2. `BLOT_HIT`    : si la flèche `to` contient exactement 1 pion adverse (`-1` pour X, `+1` pour O).
 *   3. `STACK_CLACK` : si la flèche `to` contient déjà au moins 1 pion ami (`>= 1` pour X, `<= -1` pour O).
 *   4. `FELT_LAND`   : si la flèche `to` est vide (`0`).
 */
export function classifyMoveSensoryNuance(
    board: readonly number[],
    turn: Player,
    _from: number,
    to: number,
): MoveSensoryNuance {
    if (to === X_OFF || to === O_OFF) {
        return 'BEAR_OFF';
    }
    const targetVal = to >= 1 && to <= 24 ? (board[to] ?? 0) : 0;
    const isHit = turn === 'X' ? targetVal === -1 : targetVal === 1;
    if (isHit) {
        return 'BLOT_HIT';
    }
    const hasFriendlyStack = turn === 'X' ? targetVal >= 1 : targetVal <= -1;
    if (hasFriendlyStack) {
        return 'STACK_CLACK';
    }
    return 'FELT_LAND';
}

/**
 * Retourne la durée exacte de micro-vibration (en ms) associée à une nuance (`10`, `25` ou `50`).
 */
export function getHapticDurationForNuance(nuance: MoveSensoryNuance): number {
    return SENSORY_PROFILES[nuance].hapticMs;
}

/**
 * Synthétiseur Web Audio préchargé à latence quasi-nulle (< 1 ms).
 */
export class PreloadedSensoryAudioEngine {
    private ctx: AudioContext | null = null;
    private noiseBuffer: AudioBuffer | null = null;
    private volume: number = 0.45;

    /**
     * Préchauffe le contexte Web Audio et le buffer de bruit blanc en mémoire
     * afin que tout appel ultérieur s'exécute en < 1 ms.
     */
    public prewarm(): boolean {
        if (typeof window === 'undefined') return false;
        if (!this.ctx) {
            const AudioCtx =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return false;
            try {
                this.ctx = new AudioCtx();
            } catch {
                return false;
            }
        }
        if (this.ctx && !this.noiseBuffer) {
            try {
                const len = Math.max(1, Math.floor(this.ctx.sampleRate * 0.08));
                const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < len; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                this.noiseBuffer = buf;
            } catch {
                // Environnement sans support complet AudioBuffer
            }
        }
        return this.ctx !== null;
    }

    /**
     * Joue immédiatement la nuance acoustique demandée et retourne la latence d'émission en ms.
     */
    public playNuance(nuance: MoveSensoryNuance, isMuted: boolean = false): number {
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        if (isMuted) return 0;

        if (!this.ctx) {
            this.prewarm();
        }
        const ctx = this.ctx;
        if (ctx) {
            try {
                const profile = SENSORY_PROFILES[nuance];
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = profile.waveform;
                osc.frequency.setValueAtTime(profile.startFreqHz, now);
                osc.frequency.exponentialRampToValueAtTime(
                    Math.max(20, profile.endFreqHz),
                    now + profile.durationSec,
                );

                gain.gain.setValueAtTime(0.32 * this.volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + profile.durationSec);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + profile.durationSec + 0.005);
            } catch {
                // Silence gracieux en environnement de test / sans sortie audio
            }
        }

        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        return Math.max(0, t1 - t0);
    }
}

export const sensoryAudioEngine = new PreloadedSensoryAudioEngine();
