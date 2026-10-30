/**
 * Dictionnaire Maître des Presets Sensoriels & Cinématiques 60 FPS (`sensoryPresets.ts`).
 *
 * Rôle :
 *   Centralise les paramètres acoustiques (Web Audio API 0 Ko d'assets : oscillateurs,
 *   bruit blanc/rose Paul Kellet, filtres Biquad, enveloppes ADSR, jitter stochastique),
 *   les courbes cinématiques 60 FPS (80–220 ms, `transform` / `opacity` GPU-only) et
 *   les séquences haptiques bimodales (`navigator.vibrate` + `@capacitor/haptics`).
 *
 * Strictement 0 `any`, ≤ 400 lignes.
 */

export type GameEventType =
    | 'checkerPickup'
    | 'checkerSlideAndPlace'
    | 'blotHit'
    | 'diceRollAndBounce'
    | 'doublingCubeDrop'
    | 'bearOff'
    | 'swapDice'
    | 'reviewBrilliantMove'
    | 'reviewBlunderMove';

export type NativeHapticAction =
    | 'ImpactLight'
    | 'ImpactMedium'
    | 'ImpactHeavy'
    | 'SelectionChanged'
    | 'NotificationSuccess'
    | 'NotificationWarning';

export interface NativeHapticStep {
    readonly delayMs: number;
    readonly action: NativeHapticAction;
}

export interface BiquadFilterSpec {
    readonly type: BiquadFilterType;
    readonly frequencyHz: number;
    readonly q: number;
}

export interface AdsrEnvelopeSpec {
    readonly attackMs: number;
    readonly peakGain: number;
    readonly sustainMs?: number;
    readonly sustainGain?: number;
    readonly decayOrReleaseMs: number;
}

export interface AcousticSynthesisSpec {
    readonly totalDurationMs: number;
    readonly oscillators: readonly {
        readonly waveform: OscillatorType;
        readonly startFreqHz: number;
        readonly endFreqHz: number;
        readonly pitchSweepMs?: number;
        readonly delayMs?: number;
    }[];
    readonly noiseType: 'white' | 'pink' | 'both' | 'none';
    readonly filters: readonly BiquadFilterSpec[];
    readonly envelope: AdsrEnvelopeSpec;
}

export interface KinematicMotionSpec {
    readonly durationMs: number;
    readonly secondaryDurationMs?: number;
    readonly easing: string;
    readonly secondaryEasing?: string;
    readonly gpuTransformSummary: string;
    readonly accentColorHex?: string;
}

export interface HapticChoreographySpec {
    readonly webVibrationPattern: readonly number[];
    readonly nativeSteps: readonly NativeHapticStep[];
}

export interface SensoryPreset {
    readonly event: GameEventType;
    readonly label: string;
    readonly acoustic: AcousticSynthesisSpec | null;
    readonly kinematics: KinematicMotionSpec;
    readonly haptics: HapticChoreographySpec;
}

export const SAFE_EXPONENTIAL_GAIN_FLOOR = 0.0001;
export const SAFE_NODE_STOP_MARGIN_SEC = 0.005;
export const OSCILLATOR_FREQ_JITTER_PCT = 0.035;
export const FILTER_CUTOFF_JITTER_PCT = 0.05;
export const MAX_NOISE_BUFFER_OFFSET_SEC = 0.5;
export const MAX_STEREO_PAN = 0.45;
export const BEAR_OFF_CAVITY_PITCH_STEP = 0.012;

export const DICE_CUP_SHAKE_TIMES_MS = Object.freeze([0, 58, 122] as const);
export const DIE_A_BOUNCE_TIMES_MS = Object.freeze([195, 285, 342, 378, 400] as const);
export const DIE_B_BOUNCE_TIMES_MS = Object.freeze([218, 316, 376, 414, 438, 452] as const);
export const DIE_A_PITCH_FACTOR = 1.04;
export const DIE_B_PITCH_FACTOR = 0.97;

/** Applique une micro-variation stochastique bornée à `±pct` autour de `baseValue`. */
export function applyStochasticJitter(
    baseValue: number,
    pct: number = OSCILLATOR_FREQ_JITTER_PCT,
    rng: () => number = Math.random,
): number {
    const u = Math.max(0, Math.min(1, rng()));
    return Number((baseValue * (1 + (u * 2 - 1) * pct)).toFixed(4));
}

/** Calcule un offset de lecture aléatoire dans `[0, 0.5]` s pour les tampons de bruit. */
export function computeRandomNoiseOffset(rng: () => number = Math.random): number {
    const u = Math.max(0, Math.min(1, rng()));
    return Number((u * MAX_NOISE_BUFFER_OFFSET_SEC).toFixed(4));
}

/** Calcule le panoramique stéréo (`-0.45` à `+0.45`) d'une flèche `pointIndex` (`1..24`). */
export function computePointStereoPan(pointIndex: number): number {
    if (!Number.isFinite(pointIndex) || pointIndex < 1 || pointIndex > 24) return 0;
    const p = Math.round(pointIndex);
    const colIndex = p >= 13 ? p - 13 : 12 - p;
    return Number((((colIndex / 11) * 2 - 1) * MAX_STEREO_PAN).toFixed(4));
}

/** Calcule le multiplicateur de fréquence du sabot de bear-off (+1.2 % par pion, 1..15). */
export function computeBearOffPitchMultiplier(checkersInTray: number): number {
    const clamped = Math.max(1, Math.min(15, Math.round(Number.isFinite(checkersInTray) ? checkersInTray : 1)));
    return Number((1 + (clamped - 1) * BEAR_OFF_CAVITY_PITCH_STEP).toFixed(4));
}

/** Calcule la durée cinématique (145 ms ou 195 ms) et la courbe `cubic-bezier` selon la distance. */
export function computeCheckerMoveKinematics(distancePoints: number): {
    readonly durationMs: 145 | 195;
    readonly easing: string;
} {
    const dist = Math.abs(Math.round(Number.isFinite(distancePoints) ? distancePoints : 1));
    return dist <= 6
        ? { durationMs: 145, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        : { durationMs: 195, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
}

/** Dictionnaire maître des 9 presets sensoriels (Acoustique + Cinématique 60 FPS + Haptique). */
export const SENSORY_PRESETS: Readonly<Record<GameEventType, SensoryPreset>> = Object.freeze({
    checkerPickup: {
        event: 'checkerPickup',
        label: 'Sélection / Levée du pion',
        acoustic: null,
        kinematics: {
            durationMs: 85,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            gpuTransformSummary: 'translate3d(0, -6px, 0) scale(1.08)',
        },
        haptics: {
            webVibrationPattern: [6],
            nativeSteps: [{ delayMs: 0, action: 'SelectionChanged' }],
        },
    },
    checkerSlideAndPlace: {
        event: 'checkerSlideAndPlace',
        label: 'Glissement sur feutre de laine & pose boisée',
        acoustic: {
            totalDurationMs: 160,
            oscillators: [{ waveform: 'sine', startFreqHz: 185, endFreqHz: 68, pitchSweepMs: 28, delayMs: 95 }],
            noiseType: 'both',
            filters: [
                { type: 'bandpass', frequencyHz: 1150, q: 1.8 },
                { type: 'lowpass', frequencyHz: 2400, q: 0.7 },
                { type: 'lowpass', frequencyHz: 310, q: 2.4 },
                { type: 'bandpass', frequencyHz: 2750, q: 3.2 },
            ],
            envelope: { attackMs: 12, peakGain: 0.38, sustainMs: 55, sustainGain: 0.06, decayOrReleaseMs: 63 },
        },
        kinematics: {
            durationMs: 145,
            secondaryDurationMs: 195,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            secondaryEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            gpuTransformSummary: 'translate3d(Δx, Δy, 0) scale(1.03 -> 0.985 -> 1.0)',
        },
        haptics: {
            webVibrationPattern: [10],
            nativeSteps: [{ delayMs: 145, action: 'ImpactLight' }],
        },
    },
    blotHit: {
        event: 'blotHit',
        label: 'Frappe de blot (claquement résine + résonance noyer)',
        acoustic: {
            totalDurationMs: 107,
            oscillators: [
                { waveform: 'triangle', startFreqHz: 1480, endFreqHz: 640, pitchSweepMs: 22, delayMs: 0 },
                { waveform: 'triangle', startFreqHz: 2390, endFreqHz: 1050, pitchSweepMs: 22, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 142, endFreqHz: 46, pitchSweepMs: 95, delayMs: 12 },
            ],
            noiseType: 'white',
            filters: [
                { type: 'bandpass', frequencyHz: 1850, q: 2.6 },
                { type: 'highpass', frequencyHz: 420, q: 0.7 },
                { type: 'bandpass', frequencyHz: 3300, q: 4.0 },
                { type: 'lowpass', frequencyHz: 220, q: 3.8 },
            ],
            envelope: { attackMs: 1.5, peakGain: 0.58, decayOrReleaseMs: 92 },
        },
        kinematics: {
            durationMs: 130,
            secondaryDurationMs: 215,
            easing: 'cubic-bezier(0.12, 0.95, 0.24, 1)',
            secondaryEasing: 'cubic-bezier(0.18, 0.88, 0.32, 1.08)',
            gpuTransformSummary: 'translate3d(Δx, Δy, 0) rotate(±14deg) scale(1.12 -> 1.0)',
        },
        haptics: {
            webVibrationPattern: [22, 45, 35],
            nativeSteps: [
                { delayMs: 90, action: 'ImpactHeavy' },
                { delayMs: 215, action: 'ImpactLight' },
            ],
        },
    },
    diceRollAndBounce: {
        event: 'diceRollAndBounce',
        label: 'Secousse cornet cuir & rebonds polyrythmiques sur noyer',
        acoustic: {
            totalDurationMs: 480,
            oscillators: [
                { waveform: 'triangle', startFreqHz: 240, endFreqHz: 130, pitchSweepMs: 30, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 420, endFreqHz: 190, pitchSweepMs: 15, delayMs: 195 },
            ],
            noiseType: 'both',
            filters: [
                { type: 'bandpass', frequencyHz: 650, q: 1.5 },
                { type: 'lowpass', frequencyHz: 1150, q: 0.9 },
                { type: 'bandpass', frequencyHz: 840, q: 8.5 },
                { type: 'bandpass', frequencyHz: 2120, q: 8.5 },
            ],
            envelope: { attackMs: 1, peakGain: 0.42, decayOrReleaseMs: 28 },
        },
        kinematics: {
            durationMs: 220,
            easing: 'cubic-bezier(0.15, 0.85, 0.25, 1)',
            gpuTransformSummary: 'translate3d(Δx, Δy, 0) rotate3d(1, 1, 0.5, 540deg) scale3d(1.06, 0.94, 1)',
        },
        haptics: {
            webVibrationPattern: [12, 46, 14, 65, 18, 22, 14, 48, 10, 38, 8],
            nativeSteps: [
                { delayMs: 0, action: 'ImpactLight' },
                { delayMs: 195, action: 'ImpactMedium' },
                { delayMs: 285, action: 'ImpactLight' },
                { delayMs: 342, action: 'ImpactLight' },
            ],
        },
    },
    doublingCubeDrop: {
        event: 'doublingCubeDrop',
        label: 'Pose du videau (cube en laiton brossé sur bois massif)',
        acoustic: {
            totalDurationMs: 210,
            oscillators: [
                { waveform: 'sine', startFreqHz: 96, endFreqHz: 36, pitchSweepMs: 70, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 528, endFreqHz: 528, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 1195, endFreqHz: 1195, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 2680, endFreqHz: 2680, delayMs: 0 },
            ],
            noiseType: 'pink',
            filters: [
                { type: 'lowpass', frequencyHz: 155, q: 4.2 },
                { type: 'lowpass', frequencyHz: 2850, q: 1.4 },
                { type: 'bandpass', frequencyHz: 920, q: 2.0 },
            ],
            envelope: { attackMs: 1.5, peakGain: 0.65, decayOrReleaseMs: 210 },
        },
        kinematics: {
            durationMs: 190,
            secondaryDurationMs: 70,
            easing: 'cubic-bezier(0.55, 0.05, 0.85, 0.25)',
            secondaryEasing: 'cubic-bezier(0.3, 0, 0.6, 1)',
            gpuTransformSummary: 'translate3d(0, -14px, 0) scale(1.22) rotate(-6deg) -> translate3d(0, 1.5px, 0)',
        },
        haptics: {
            webVibrationPattern: [38, 18, 12],
            nativeSteps: [
                { delayMs: 190, action: 'ImpactHeavy' },
                { delayMs: 220, action: 'SelectionChanged' },
            ],
        },
    },
    bearOff: {
        event: 'bearOff',
        label: 'Sortie de pion dans la rainure de bear-off en noyer',
        acoustic: {
            totalDurationMs: 76,
            oscillators: [
                { waveform: 'triangle', startFreqHz: 590, endFreqHz: 410, pitchSweepMs: 18, delayMs: 0 },
                { waveform: 'triangle', startFreqHz: 660, endFreqHz: 460, pitchSweepMs: 18, delayMs: 28 },
            ],
            noiseType: 'white',
            filters: [
                { type: 'bandpass', frequencyHz: 2180, q: 5.5 },
                { type: 'bandpass', frequencyHz: 2440, q: 5.5 },
            ],
            envelope: { attackMs: 1, peakGain: 0.30, decayOrReleaseMs: 46 },
        },
        kinematics: {
            durationMs: 160,
            easing: 'cubic-bezier(0.25, 1, 0.4, 1)',
            gpuTransformSummary: 'translate3d(Δx, Δy, 0) scale3d(0.95, 0.42, 1)',
        },
        haptics: {
            webVibrationPattern: [12, 20, 8],
            nativeSteps: [
                { delayMs: 110, action: 'ImpactMedium' },
                { delayMs: 160, action: 'SelectionChanged' },
            ],
        },
    },
    swapDice: {
        event: 'swapDice',
        label: 'Permutation orbitale 180° des deux dés (Swap Dice)',
        acoustic: null,
        kinematics: {
            durationMs: 180,
            easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
            gpuTransformSummary: 'translate3d(±Δx, ±22px, 0) rotate(180deg) scale(1.08)',
        },
        haptics: {
            webVibrationPattern: [8, 25, 8],
            nativeSteps: [
                { delayMs: 0, action: 'SelectionChanged' },
                { delayMs: 180, action: 'ImpactLight' },
            ],
        },
    },
    reviewBrilliantMove: {
        event: 'reviewBrilliantMove',
        label: 'Validation post-match d’un coup brillant / optimal',
        acoustic: {
            totalDurationMs: 428,
            oscillators: [
                { waveform: 'sine', startFreqHz: 587.33, endFreqHz: 587.33, delayMs: 0 },
                { waveform: 'sine', startFreqHz: 880.0, endFreqHz: 880.0, delayMs: 18 },
                { waveform: 'sine', startFreqHz: 1318.51, endFreqHz: 1318.51, delayMs: 36 },
            ],
            noiseType: 'none',
            filters: [
                { type: 'lowpass', frequencyHz: 3400, q: 0.7 },
                { type: 'highpass', frequencyHz: 300, q: 0.7 },
            ],
            envelope: { attackMs: 12, peakGain: 0.20, decayOrReleaseMs: 380 },
        },
        kinematics: {
            durationMs: 200,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            gpuTransformSummary: 'scale(1.0 -> 1.38) opacity(0.85 -> 0)',
            accentColorHex: '#D4AF37',
        },
        haptics: {
            webVibrationPattern: [10, 30, 16],
            nativeSteps: [{ delayMs: 0, action: 'NotificationSuccess' }],
        },
    },
    reviewBlunderMove: {
        event: 'reviewBlunderMove',
        label: 'Signalement post-match d’une gaffe (blunder ≥ 0.20 EMG)',
        acoustic: {
            totalDurationMs: 225,
            oscillators: [
                { waveform: 'triangle', startFreqHz: 196.0, endFreqHz: 184.0, pitchSweepMs: 140, delayMs: 0 },
                { waveform: 'triangle', startFreqHz: 185.0, endFreqHz: 173.0, pitchSweepMs: 140, delayMs: 0 },
            ],
            noiseType: 'pink',
            filters: [
                { type: 'lowpass', frequencyHz: 410, q: 1.2 },
                { type: 'bandpass', frequencyHz: 310, q: 2.0 },
            ],
            envelope: { attackMs: 15, peakGain: 0.24, decayOrReleaseMs: 210 },
        },
        kinematics: {
            durationMs: 180,
            easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)',
            gpuTransformSummary: 'translate3d(-4px -> +4px -> -2px -> +2px -> 0, 0, 0)',
            accentColorHex: '#B84A39',
        },
        haptics: {
            webVibrationPattern: [30, 40, 25],
            nativeSteps: [{ delayMs: 0, action: 'NotificationWarning' }],
        },
    },
});
