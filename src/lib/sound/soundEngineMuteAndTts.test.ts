// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundEngine } from './soundEngine';
import { stopCoachVoice } from '../../hooks/useCoachVoice';

describe('SoundEngine & SpeechSynthesis Mute & Cancel Controls', () => {
    let cancelSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        cancelSpy = vi.fn();
        Object.defineProperty(window, 'speechSynthesis', {
            writable: true,
            value: {
                speaking: false,
                cancel: cancelSpy,
                speak: vi.fn(),
                getVoices: vi.fn().mockReturnValue([]),
            },
        });
        localStorage.clear();
        soundEngine.setMuted(false);
        cancelSpy.mockClear();
    });

    it('toggling mute persists to localStorage and cancels ongoing speechSynthesis', () => {
        expect(soundEngine.isMute()).toBe(false);
        expect(localStorage.getItem('bg_sound_muted')).toBe('false');

        // Toggle mute to ON
        soundEngine.toggleMute();
        expect(soundEngine.isMute()).toBe(true);
        expect(localStorage.getItem('bg_sound_muted')).toBe('true');
        expect(cancelSpy).toHaveBeenCalled();

        // Toggle mute to OFF
        soundEngine.toggleMute();
        expect(soundEngine.isMute()).toBe(false);
        expect(localStorage.getItem('bg_sound_muted')).toBe('false');
    });

    it('when muted, soundEngine prevents procedural audio effects and coach alerts', () => {
        soundEngine.setMuted(true);
        expect(soundEngine.isMute()).toBe(true);

        // Procedural sounds should safely return without throwing
        expect(() => soundEngine.playDiceRoll()).not.toThrow();
        expect(() => soundEngine.playCheckerSlide()).not.toThrow();
        expect(() => soundEngine.playCheckerHit()).not.toThrow();
        expect(() => soundEngine.playDoublingCube()).not.toThrow();

        // Coach alert should return false when muted
        const spoken = soundEngine.speakCoachAlert('Gaffe majeure !', 'fr');
        expect(spoken).toBe(false);
    });

    it('stopCoachVoice cleanly invokes window.speechSynthesis.cancel()', () => {
        stopCoachVoice();
        expect(cancelSpy).toHaveBeenCalled();
    });
});
