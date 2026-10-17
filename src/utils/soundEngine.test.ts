import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundEngine } from './soundEngine';

describe('SoundEngine', () => {
    beforeEach(() => {
        soundEngine.setMuted(false);
        soundEngine.setHapticsEnabled(true);
    });

    it('gère le mode muet et toggle', () => {
        expect(soundEngine.getMuted()).toBe(false);
        soundEngine.toggleMuted();
        expect(soundEngine.getMuted()).toBe(true);
        soundEngine.setMuted(false);
        expect(soundEngine.getMuted()).toBe(false);
    });

    it('gère l activation haptique', () => {
        expect(soundEngine.getHapticsEnabled()).toBe(true);
        soundEngine.setHapticsEnabled(false);
        expect(soundEngine.getHapticsEnabled()).toBe(false);
    });

    it('joue les sons sans erreur même si AudioContext n est pas simulé ou muted', () => {
        expect(() => {
            soundEngine.playDiceRoll();
            soundEngine.playCheckerMove();
            soundEngine.playHit();
            soundEngine.playBearOff();
            soundEngine.playClick();
        }).not.toThrow();

        soundEngine.setMuted(true);
        expect(() => {
            soundEngine.playDiceRoll();
            soundEngine.playCheckerMove();
            soundEngine.playHit();
            soundEngine.playBearOff();
            soundEngine.playClick();
        }).not.toThrow();
    });
});
