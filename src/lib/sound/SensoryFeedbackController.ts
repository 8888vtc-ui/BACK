/**
 * Contrôleur de Rétroaction Sensorielle Unifié (`SensoryFeedbackController`).
 *
 * Rôle :
 *   Orchestre la synchronisation audio-haptique (< 15 ms) en couplant le moteur
 *   psychoacoustique modal (`LuxuryBoardAudioEngine`) et le service haptique
 *   (`src/lib/capacitor/haptics.ts`).
 *
 * Interactions clés :
 *   1. Frappe de Blot ("Blot Hit" - 15 ms) :
 *      - Audio simultané : `playNobleWoodImpact(0.95, true)` + `playHeavyCasinoChip(0.85)`.
 *      - Haptique : impulsion sèche immédiate de 15 ms avec freinage actif (`triggerBrakedHapticPulse(15)`).
 *      - Support de l'alignement cinématique à 75 % du vol du pion attaquant.
 *   2. Roulement Granulaire de Dés (610 ms - 10 impacts dégressifs) :
 *      - Nappe de feutre continue de 0 à 500 ms (`triggerContinuousHapticBed(500)` / `playFeltBrush`).
 *      - 10 rebonds calibrés :
 *        0 ms (0.95, feutre), 18 ms (0.88, feutre), 45 ms (0.82, ivoire), 82 ms (0.74, ivoire),
 *        130 ms (0.65, ivoire), 192 ms (0.56, ivoire), 270 ms (0.48, ivoire), 368 ms (0.40, ivoire),
 *        485 ms (0.35, ivoire), 610 ms (0.32, ivoire final stabilisé).
 *   3. Déplacement de Pion Standard :
 *      - `playFeltBrush(0.8)` à la levée du pion, `playNobleWoodImpact(0.7)` au dépôt sur la flèche.
 *   4. Validation de Tour / Bouton Lancer :
 *      - Micro-clic mécanique sec et satisfaisant (`playMechanicalClick`).
 *
 * Strictement 0 `any`.
 */

import {
    LuxuryBoardAudioEngine,
    luxuryBoardAudioEngine,
    type ModalSynthesisDispatchReport,
} from './LuxuryBoardAudioEngine';
import {
    impactLight,
    impactMedium,
    triggerBrakedHapticPulse,
    triggerContinuousHapticBed,
    vibrate,
} from '../capacitor/haptics';
import { HIT_EJECT_DELAY_RATIO, computeHitEjectDelayMs } from '../gameFeel/flightPhysics';

/** Budget maximal de synchronisation audio-haptique (ms). */
export const MAX_AUDIO_HAPTIC_SYNC_MS = 15;

/** Durée de l'impulsion haptique sèche avec freinage actif lors d'un Blot Hit (ms). */
export const BLOT_HIT_BRAKED_HAPTIC_MS = 15;

/** Durée totale de la séquence granulaire de roulement de dés (ms). */
export const GRANULAR_DICE_ROLL_DURATION_MS = 610;

/** Durée de la nappe continue de feutre lors du roulement de dés (ms). */
export const GRANULAR_DICE_FELT_BED_MS = 500;

/** Clé localStorage pour l'activation haptique. */
export const HAPTICS_ENABLED_STORAGE_KEY = 'bg_haptics_enabled';

/** Clé localStorage pour le mode muet audio. */
export const SOUND_MUTED_STORAGE_KEY = 'bg_sound_muted';

export type GranularBounceMaterial = 'felt' | 'ivory';

export interface GranularDiceBounceStep {
    readonly timeMs: number;
    readonly velocity: number;
    readonly material: GranularBounceMaterial;
}

/**
 * Séquence exacte des 10 impacts dégressifs du roulement granulaire de dés (610 ms).
 */
export const GRANULAR_DICE_ROLL_SEQUENCE: readonly GranularDiceBounceStep[] = Object.freeze([
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

export interface BlotHitDispatchResult {
    readonly woodReport: ModalSynthesisDispatchReport | null;
    readonly chipReport: ModalSynthesisDispatchReport | null;
    readonly hapticDurationMs: number;
    readonly syncLatencyMs: number;
}

export interface SensoryFeedbackControllerOptions {
    readonly audioEngine?: LuxuryBoardAudioEngine;
    readonly initialSoundEnabled?: boolean;
    readonly initialHapticsEnabled?: boolean;
}

export class SensoryFeedbackController {
    private readonly audioEngine: LuxuryBoardAudioEngine;
    private soundEnabled: boolean = true;
    private hapticsEnabled: boolean = true;
    private activeTimers: Set<ReturnType<typeof setTimeout>> = new Set();

    constructor(options: SensoryFeedbackControllerOptions = {}) {
        this.audioEngine = options.audioEngine ?? luxuryBoardAudioEngine;

        if (options.initialSoundEnabled !== undefined) {
            this.soundEnabled = options.initialSoundEnabled;
            this.audioEngine.setMuted(!options.initialSoundEnabled);
        } else if (typeof window !== 'undefined') {
            try {
                const savedMute = window.localStorage?.getItem(SOUND_MUTED_STORAGE_KEY);
                if (savedMute !== null) {
                    this.soundEnabled = savedMute !== 'true';
                } else {
                    this.soundEnabled = !this.audioEngine.isMute();
                }
            } catch {
                this.soundEnabled = !this.audioEngine.isMute();
            }
        }

        if (options.initialHapticsEnabled !== undefined) {
            this.hapticsEnabled = options.initialHapticsEnabled;
        } else if (typeof window !== 'undefined') {
            try {
                const savedHaptics = window.localStorage?.getItem(HAPTICS_ENABLED_STORAGE_KEY);
                if (savedHaptics !== null) {
                    this.hapticsEnabled = savedHaptics !== 'false';
                }
            } catch {
                this.hapticsEnabled = true;
            }
        }
    }

    /**
     * Synchronise l'état muet avec `localStorage` et le moteur audio sous-jacent.
     */
    private syncPreferencesFromStorage(): void {
        if (typeof window === 'undefined') return;
        try {
            const savedMute = window.localStorage?.getItem(SOUND_MUTED_STORAGE_KEY);
            if (savedMute !== null) {
                this.soundEnabled = savedMute !== 'true';
            }
            const savedHaptics = window.localStorage?.getItem(HAPTICS_ENABLED_STORAGE_KEY);
            if (savedHaptics !== null) {
                this.hapticsEnabled = savedHaptics !== 'false';
            }
        } catch {
            // ignore
        }
    }

    public isSoundEnabled(): boolean {
        this.syncPreferencesFromStorage();
        return this.soundEnabled && !this.audioEngine.isMute();
    }

    public setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
        this.audioEngine.setMuted(!enabled);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage?.setItem(SOUND_MUTED_STORAGE_KEY, String(!enabled));
            } catch {
                // ignore
            }
        }
    }

    public isHapticsEnabled(): boolean {
        this.syncPreferencesFromStorage();
        return this.hapticsEnabled;
    }

    public setHapticsEnabled(enabled: boolean): void {
        this.hapticsEnabled = enabled;
        if (typeof window !== 'undefined') {
            try {
                window.localStorage?.setItem(HAPTICS_ENABLED_STORAGE_KEY, String(enabled));
            } catch {
                // ignore
            }
        }
    }

    public getAudioEngine(): LuxuryBoardAudioEngine {
        return this.audioEngine;
    }

    /**
     * Annule tous les timers de séquençage granulaire ou d'impact différé en cours.
     */
    public cancelScheduledTimers(): void {
        this.activeTimers.forEach((t) => clearTimeout(t));
        this.activeTimers.clear();
    }

    private scheduleAt(delayMs: number, callback: () => void): ReturnType<typeof setTimeout> | null {
        if (delayMs <= 0) {
            callback();
            return null;
        }
        const timer = setTimeout(() => {
            this.activeTimers.delete(timer);
            callback();
        }, delayMs);
        this.activeTimers.add(timer);
        return timer;
    }

    /**
     * 1. Frappe de Blot / Capture ("Blot Hit" - 15 ms) :
     * - Audio simultané : `playNobleWoodImpact(0.95, true)` + `playHeavyCasinoChip(0.85)`.
     * - Haptique : impulsion sèche immédiate de 15 ms avec freinage actif.
     */
    public triggerBlotHit(): BlotHitDispatchResult {
        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        let woodReport: ModalSynthesisDispatchReport | null = null;
        let chipReport: ModalSynthesisDispatchReport | null = null;

        if (this.isSoundEnabled()) {
            woodReport = this.audioEngine.playNobleWoodImpact(0.95, true);
            chipReport = this.audioEngine.playHeavyCasinoChip(0.85);
        }

        if (this.isHapticsEnabled()) {
            void triggerBrakedHapticPulse(BLOT_HIT_BRAKED_HAPTIC_MS);
        }

        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        return {
            woodReport,
            chipReport,
            hapticDurationMs: BLOT_HIT_BRAKED_HAPTIC_MS,
            syncLatencyMs: Math.max(0, t1 - t0),
        };
    }

    /**
     * Programme la frappe d'un blot exactement à l'instant d'expulsion (75 % de la durée du vol attaquant).
     */
    public scheduleBlotHitAtFlightApex(
        attackerFlightDurationMs: number,
        onDispatched?: (result: BlotHitDispatchResult) => void,
    ): number {
        const ejectDelayMs =
            attackerFlightDurationMs > 0
                ? computeHitEjectDelayMs(attackerFlightDurationMs)
                : Math.round(attackerFlightDurationMs * HIT_EJECT_DELAY_RATIO);

        this.scheduleAt(ejectDelayMs, () => {
            const res = this.triggerBlotHit();
            onDispatched?.(res);
        });

        return ejectDelayMs;
    }

    /**
     * 2. Roulement Granulaire de Dés (610 ms - 10 impacts dégressifs) :
     * - Nappe de feutre continue de 0 à 500 ms (`triggerContinuousHapticBed(500)` / `playFeltBrush`).
     * - Séquencement précis des 10 rebonds (0 ms, 18 ms, 45 ms, 82 ms, 130 ms, 192 ms, 270 ms, 368 ms, 485 ms, 610 ms).
     */
    public triggerGranularDiceRoll(
        onBounceStep?: (step: GranularDiceBounceStep, index: number) => void,
    ): readonly GranularDiceBounceStep[] {
        this.cancelScheduledTimers();
        const soundActive = this.isSoundEnabled();
        const hapticsActive = this.isHapticsEnabled();

        // Nappe haptique continue sur feutre de 0 à 500 ms
        if (hapticsActive) {
            void triggerContinuousHapticBed(GRANULAR_DICE_FELT_BED_MS);
        }

        GRANULAR_DICE_ROLL_SEQUENCE.forEach((step, idx) => {
            this.scheduleAt(step.timeMs, () => {
                if (this.isSoundEnabled() && soundActive) {
                    if (step.material === 'felt') {
                        this.audioEngine.playFeltBrush(step.velocity);
                    } else {
                        this.audioEngine.playIvoryDiceCollision(step.velocity);
                    }
                }
                if (this.isHapticsEnabled() && hapticsActive && step.timeMs > 0) {
                    const pulseMs = Math.max(4, Math.round(step.velocity * 12));
                    void vibrate(pulseMs);
                }
                onBounceStep?.(step, idx);
            });
        });

        return GRANULAR_DICE_ROLL_SEQUENCE;
    }

    /**
     * 3a. Levée d'un pion standard : `playFeltBrush(0.8)` + micro-haptique léger.
     */
    public triggerCheckerLift(velocity: number = 0.8): ModalSynthesisDispatchReport | null {
        const report = this.isSoundEnabled() ? this.audioEngine.playFeltBrush(velocity) : null;
        if (this.isHapticsEnabled()) {
            void impactLight();
        }
        return report;
    }

    /**
     * 3b. Dépôt d'un pion standard sur une flèche : `playNobleWoodImpact(0.7, false)` + retour haptique.
     */
    public triggerCheckerLand(velocity: number = 0.7, isBearOff: boolean = false): ModalSynthesisDispatchReport | null {
        const report = this.isSoundEnabled()
            ? this.audioEngine.playNobleWoodImpact(velocity, false)
            : null;
        if (this.isHapticsEnabled()) {
            if (isBearOff) {
                void impactMedium();
            } else {
                void impactLight();
            }
        }
        return report;
    }

    /**
     * 3c. Déplacement complet de pion standard (glissement feutre 0.8 + impact bois noble 0.7).
     */
    public triggerStandardCheckerMove(): {
        feltReport: ModalSynthesisDispatchReport | null;
        woodReport: ModalSynthesisDispatchReport | null;
    } {
        let feltReport: ModalSynthesisDispatchReport | null = null;
        let woodReport: ModalSynthesisDispatchReport | null = null;
        if (this.isSoundEnabled()) {
            feltReport = this.audioEngine.playFeltBrush(0.8);
            woodReport = this.audioEngine.playNobleWoodImpact(0.7, false);
        }
        if (this.isHapticsEnabled()) {
            void impactLight();
        }
        return { feltReport, woodReport };
    }

    /**
     * 4. Validation de Tour / Bouton Lancer : Micro-clic mécanique sec et satisfaisant.
     */
    public triggerMechanicalClick(velocity: number = 0.65): ModalSynthesisDispatchReport | null {
        const report = this.isSoundEnabled() ? this.audioEngine.playMechanicalClick(velocity) : null;
        if (this.isHapticsEnabled()) {
            void impactLight();
        }
        return report;
    }
}

export const sensoryFeedbackController = new SensoryFeedbackController();
export default sensoryFeedbackController;
