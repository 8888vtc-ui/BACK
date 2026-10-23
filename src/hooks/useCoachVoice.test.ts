// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useCoachVoice,
    COACH_VOICE_STORAGE_KEY,
    cleanCoachTextForSpeech,
    selectBestCoachVoice,
} from './useCoachVoice';
import * as haptics from '../lib/capacitor/haptics';

class MockSpeechSynthesisUtterance {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    voice: SpeechSynthesisVoice | null = null;
    onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
    onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => unknown) | null = null;
    onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => unknown) | null = null;

    constructor(text = '') {
        this.text = text;
    }
}

describe('useCoachVoice — Synthèse vocale du Coach IA (Web Speech API)', () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();
    const getVoicesMock = vi.fn<() => SpeechSynthesisVoice[]>(() => []);

    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();
        speakMock.mockReset();
        cancelMock.mockReset();
        getVoicesMock.mockReset().mockReturnValue([]);

        Object.defineProperty(window, 'speechSynthesis', {
            value: {
                speak: speakMock,
                cancel: cancelMock,
                getVoices: getVoicesMock,
            },
            configurable: true,
            writable: true,
        });

        Object.defineProperty(window, 'SpeechSynthesisUtterance', {
            value: MockSpeechSynthesisUtterance,
            configurable: true,
            writable: true,
        });
        Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
            value: MockSpeechSynthesisUtterance,
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('initialise isVoiceEnabled à false par défaut et persiste dans localStorage via toggleVoice avec impactLight', () => {
        const impactSpy = vi.spyOn(haptics, 'impactLight').mockResolvedValue();
        const { result } = renderHook(() => useCoachVoice());

        expect(result.current.isVoiceEnabled).toBe(false);
        expect(result.current.isSpeaking).toBe(false);
        expect(result.current.currentText).toBeNull();

        act(() => {
            result.current.toggleVoice();
        });

        expect(result.current.isVoiceEnabled).toBe(true);
        expect(localStorage.getItem(COACH_VOICE_STORAGE_KEY)).toBe('true');
        expect(impactSpy).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.toggleVoice();
        });

        expect(result.current.isVoiceEnabled).toBe(false);
        expect(localStorage.getItem(COACH_VOICE_STORAGE_KEY)).toBe('false');
        expect(impactSpy).toHaveBeenCalledTimes(2);
    });

    it('restaure la préférence persistée depuis localStorage sous backgammon.coachVoiceEnabled', () => {
        localStorage.setItem(COACH_VOICE_STORAGE_KEY, 'true');
        const { result } = renderHook(() => useCoachVoice());

        expect(result.current.isVoiceEnabled).toBe(true);
    });

    it('n’énonce le texte que si isVoiceEnabled est actif ou si options.force est vrai', () => {
        const { result } = renderHook(() => useCoachVoice());

        // Voix désactivée : ne parle pas
        act(() => {
            const spoken = result.current.speak('Blunder critique sur le point 5.');
            expect(spoken).toBe(false);
        });
        expect(speakMock).not.toHaveBeenCalled();

        // Lecture forcée à la demande (clic sur Réécouter)
        act(() => {
            const spoken = result.current.speak('Explication à la demande.', { force: true });
            expect(spoken).toBe(true);
        });
        expect(speakMock).toHaveBeenCalledTimes(1);
        expect(result.current.isSpeaking).toBe(true);
        expect(result.current.currentText).toBe('Explication à la demande.');
    });

    it('nettoie la notation technique brute (ex: "24/18 13/8") et le Markdown avant prononciation', () => {
        expect(cleanCoachTextForSpeech('### **Blunder** : *24/18 13/8* perd `0.145` ΔEq.', 'fr')).toBe(
            'Blunder : 24 vers 18 13 vers 8 perd 0.145 delta équité.',
        );
        expect(cleanCoachTextForSpeech('Play bar/20 6/off instead of 8/5(2)*', 'en')).toBe(
            'Play bar to 20 6 to off instead of 8 to 5 2 times',
        );
    });

    it('sélectionne et priorise les voix naturelles locales correspondant à la langue active (useI18n)', () => {
        const genericFr = { name: 'Standard FR', lang: 'fr-FR', localService: false, default: false } as SpeechSynthesisVoice;
        const thomasFr = { name: 'Thomas', lang: 'fr-FR', localService: true, default: false } as SpeechSynthesisVoice;
        const googleFr = { name: 'Google français', lang: 'fr-FR', localService: true, default: false } as SpeechSynthesisVoice;
        const danielEn = { name: 'Daniel', lang: 'en-GB', localService: true, default: false } as SpeechSynthesisVoice;

        getVoicesMock.mockReturnValue([genericFr, thomasFr, googleFr, danielEn]);

        expect(selectBestCoachVoice([genericFr, thomasFr, googleFr, danielEn], 'fr')?.name).toBe('Google français');
        expect(selectBestCoachVoice([genericFr, thomasFr, danielEn], 'fr')?.name).toBe('Thomas');
        expect(selectBestCoachVoice([genericFr, thomasFr, danielEn], 'en')?.name).toBe('Daniel');

        localStorage.setItem(COACH_VOICE_STORAGE_KEY, 'true');
        const { result } = renderHook(() => useCoachVoice());

        act(() => {
            result.current.speak('Le coup 24/18 expose un blot.');
        });

        expect(speakMock).toHaveBeenCalledTimes(1);
        const utterance = speakMock.mock.calls[0][0] as MockSpeechSynthesisUtterance;
        expect(utterance.lang).toBe('fr-FR');
        expect(utterance.voice?.name).toBe('Google français');
        expect(utterance.text).toBe('Le coup 24 vers 18 expose un blot.');
    });

    it('interrompt immédiatement la lecture via stop(), à la désactivation ou au démontage du composant', () => {
        localStorage.setItem(COACH_VOICE_STORAGE_KEY, 'true');
        const { result, unmount } = renderHook(() => useCoachVoice());

        act(() => {
            result.current.speak('Analyse en cours de lecture.');
        });
        expect(result.current.isSpeaking).toBe(true);
        expect(result.current.currentText).toBe('Analyse en cours de lecture.');

        // Interruption explicite via stop()
        act(() => {
            result.current.stop();
        });
        expect(cancelMock).toHaveBeenCalled();
        expect(result.current.isSpeaking).toBe(false);
        expect(result.current.currentText).toBeNull();

        // Fin naturelle via onend
        act(() => {
            result.current.speak('Seconde phrase.');
        });
        const lastUtterance = speakMock.mock.calls[speakMock.mock.calls.length - 1][0] as MockSpeechSynthesisUtterance;
        act(() => {
            lastUtterance.onend?.call(
                lastUtterance as unknown as SpeechSynthesisUtterance,
                new Event('end') as SpeechSynthesisEvent,
            );
        });
        expect(result.current.isSpeaking).toBe(false);
        expect(result.current.currentText).toBeNull();

        // Nettoyage automatique au démontage
        cancelMock.mockClear();
        unmount();
        expect(cancelMock).toHaveBeenCalledTimes(1);
    });
});
