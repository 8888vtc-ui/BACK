import { describe, expect, it } from 'vitest';
import {
    BEAR_OFF_CAVITY_PITCH_STEP,
    DICE_CUP_SHAKE_TIMES_MS,
    DIE_A_BOUNCE_TIMES_MS,
    DIE_B_BOUNCE_TIMES_MS,
    FILTER_CUTOFF_JITTER_PCT,
    MAX_NOISE_BUFFER_OFFSET_SEC,
    MAX_STEREO_PAN,
    OSCILLATOR_FREQ_JITTER_PCT,
    SAFE_EXPONENTIAL_GAIN_FLOOR,
    SENSORY_PRESETS,
    applyStochasticJitter,
    computeBearOffPitchMultiplier,
    computeCheckerMoveKinematics,
    computePointStereoPan,
    computeRandomNoiseOffset,
    type GameEventType,
} from './sensoryPresets';

describe('sensoryPresets — Spécification Game Feel & Juice Sensoriel Cercle Monte-Carlo', () => {
    it('définit les 9 événements de jeu avec durées cinématiques strictement comprises entre 80 ms et 220 ms', () => {
        const events: readonly GameEventType[] = [
            'checkerPickup',
            'checkerSlideAndPlace',
            'blotHit',
            'diceRollAndBounce',
            'doublingCubeDrop',
            'bearOff',
            'swapDice',
            'reviewBrilliantMove',
            'reviewBlunderMove',
        ];

        for (const ev of events) {
            const preset = SENSORY_PRESETS[ev];
            expect(preset).toBeDefined();
            expect(preset.event).toBe(ev);
            expect(preset.kinematics.durationMs).toBeGreaterThanOrEqual(80);
            expect(preset.kinematics.durationMs).toBeLessThanOrEqual(220);
            expect(preset.kinematics.easing).toContain('cubic-bezier(');
            expect(preset.haptics.webVibrationPattern.length).toBeGreaterThan(0);
            expect(preset.haptics.nativeSteps.length).toBeGreaterThan(0);
        }
    });

    it('applique un jitter stochastique borné à ±3.5 % sur les fréquences et ±5 % sur les filtres', () => {
        expect(OSCILLATOR_FREQ_JITTER_PCT).toBe(0.035);
        expect(FILTER_CUTOFF_JITTER_PCT).toBe(0.05);
        expect(SAFE_EXPONENTIAL_GAIN_FLOOR).toBe(0.0001);

        expect(applyStochasticJitter(1000, OSCILLATOR_FREQ_JITTER_PCT, () => 0)).toBeCloseTo(965, 2);
        expect(applyStochasticJitter(1000, OSCILLATOR_FREQ_JITTER_PCT, () => 0.5)).toBeCloseTo(1000, 2);
        expect(applyStochasticJitter(1000, OSCILLATOR_FREQ_JITTER_PCT, () => 1)).toBeCloseTo(1035, 2);

        expect(applyStochasticJitter(2000, FILTER_CUTOFF_JITTER_PCT, () => 0)).toBeCloseTo(1900, 2);
        expect(applyStochasticJitter(2000, FILTER_CUTOFF_JITTER_PCT, () => 1)).toBeCloseTo(2100, 2);
    });

    it('calcule un offset de tampon de bruit aléatoire borné dans [0, 0.5] s', () => {
        expect(MAX_NOISE_BUFFER_OFFSET_SEC).toBe(0.5);
        expect(computeRandomNoiseOffset(() => 0)).toBe(0);
        expect(computeRandomNoiseOffset(() => 0.5)).toBe(0.25);
        expect(computeRandomNoiseOffset(() => 1)).toBe(0.5);
    });

    it('calcule le panoramique stéréo (-0.45 à +0.45) selon la colonne de la flèche frappée (1..24)', () => {
        expect(MAX_STEREO_PAN).toBe(0.45);
        // Extrême gauche : flèche 13 (haut-gauche) et flèche 12 (bas-gauche) -> -0.45
        expect(computePointStereoPan(13)).toBeCloseTo(-0.45, 4);
        expect(computePointStereoPan(12)).toBeCloseTo(-0.45, 4);

        // Extrême droite : flèche 24 (haut-droite) et flèche 1 (bas-droite) -> +0.45
        expect(computePointStereoPan(24)).toBeCloseTo(0.45, 4);
        expect(computePointStereoPan(1)).toBeCloseTo(0.45, 4);

        // Hors bornes -> 0
        expect(computePointStereoPan(0)).toBe(0);
        expect(computePointStereoPan(25)).toBe(0);
    });

    it('applique le pitch-shift progressif de cavité (+1.2 % par pion dans le sabot de bear-off 1..15)', () => {
        expect(BEAR_OFF_CAVITY_PITCH_STEP).toBe(0.012);
        expect(computeBearOffPitchMultiplier(1)).toBeCloseTo(1.0, 4);
        expect(computeBearOffPitchMultiplier(2)).toBeCloseTo(1.012, 4);
        expect(computeBearOffPitchMultiplier(15)).toBeCloseTo(1 + 14 * 0.012, 4);
    });

    it('distingue les déplacements courts (1-6 flèches : 145 ms) et longs (7-24 flèches : 195 ms)', () => {
        expect(computeCheckerMoveKinematics(1)).toEqual({
            durationMs: 145,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        });
        expect(computeCheckerMoveKinematics(6)).toEqual({
            durationMs: 145,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        });
        expect(computeCheckerMoveKinematics(7)).toEqual({
            durationMs: 195,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
        expect(computeCheckerMoveKinematics(24)).toEqual({
            durationMs: 195,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        });
    });

    it('expose les séquences temporelles exactes du cornet cuir et des rebonds polyrythmiques des dés', () => {
        expect(DICE_CUP_SHAKE_TIMES_MS).toEqual([0, 58, 122]);
        expect(DIE_A_BOUNCE_TIMES_MS).toEqual([195, 285, 342, 378, 400]);
        expect(DIE_B_BOUNCE_TIMES_MS).toEqual([218, 316, 376, 414, 438, 452]);
        expect(SENSORY_PRESETS.diceRollAndBounce.haptics.webVibrationPattern).toEqual([
            12, 46, 14, 65, 18, 22, 14, 48, 10, 38, 8,
        ]);
    });
});
