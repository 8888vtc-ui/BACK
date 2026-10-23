// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { X_OFF, O_OFF } from '../../engine/backgammonEngine';
import {
    HAPTIC_NORMAL_MS,
    HAPTIC_BEAR_OFF_MS,
    HAPTIC_HIT_MS,
    MAX_AUDIO_DISPATCH_LATENCY_MS,
    SENSORY_PROFILES,
    classifyMoveSensoryNuance,
    getHapticDurationForNuance,
    PreloadedSensoryAudioEngine,
} from './sensoryAudioHaptics';

describe('sensoryAudioHaptics (Audit 11/20 — Système Audio-Haptique & Sensory Game Feel)', () => {
    it('différencie exactement les 4 nuances sonores : FELT_LAND, STACK_CLACK, BLOT_HIT et BEAR_OFF', () => {
        const board = new Array<number>(26).fill(0);
        board[8] = 2; // Pile existante de X en 8
        board[5] = -1; // Blot adverse de O en 5

        // 1. Pose normale sur le feutre (flèche 9 vide) -> FELT_LAND
        expect(classifyMoveSensoryNuance(board, 'X', 13, 9)).toBe('FELT_LAND');

        // 2. Empilement sur une pile existante (flèche 8 déjà occupée par X) -> STACK_CLACK
        expect(classifyMoveSensoryNuance(board, 'X', 13, 8)).toBe('STACK_CLACK');

        // 3. Prise d'un blot adverse (flèche 5 occupée par -1) -> BLOT_HIT
        expect(classifyMoveSensoryNuance(board, 'X', 8, 5)).toBe('BLOT_HIT');

        // 4. Sortie dans le sabot (X_OFF ou O_OFF) -> BEAR_OFF
        expect(classifyMoveSensoryNuance(board, 'X', 4, X_OFF)).toBe('BEAR_OFF');
        expect(classifyMoveSensoryNuance(board, 'O', 21, O_OFF)).toBe('BEAR_OFF');

        // Vérifie que les 4 profils ont des fréquences distinctes (bois / feutre / Bakélite)
        const freqs = new Set([
            SENSORY_PROFILES.FELT_LAND.startFreqHz,
            SENSORY_PROFILES.STACK_CLACK.startFreqHz,
            SENSORY_PROFILES.BEAR_OFF.startFreqHz,
            SENSORY_PROFILES.BLOT_HIT.startFreqHz,
        ]);
        expect(freqs.size).toBe(4);
    });

    it('calibre les micro-vibrations à 10ms (normal), 25ms (bear-off) et 50ms (hit)', () => {
        expect(HAPTIC_NORMAL_MS).toBe(10);
        expect(HAPTIC_BEAR_OFF_MS).toBe(25);
        expect(HAPTIC_HIT_MS).toBe(50);

        expect(getHapticDurationForNuance('FELT_LAND')).toBe(10);
        expect(getHapticDurationForNuance('STACK_CLACK')).toBe(10);
        expect(getHapticDurationForNuance('BEAR_OFF')).toBe(25);
        expect(getHapticDurationForNuance('BLOT_HIT')).toBe(50);
    });

    it('garantit une latence d’émission Web Audio strictement inférieure à 10ms', () => {
        const engine = new PreloadedSensoryAudioEngine();
        engine.prewarm();

        for (const nuance of ['FELT_LAND', 'STACK_CLACK', 'BEAR_OFF', 'BLOT_HIT'] as const) {
            const latencyMs = engine.playNuance(nuance, false);
            expect(latencyMs).toBeLessThan(MAX_AUDIO_DISPATCH_LATENCY_MS);
        }
    });
});
