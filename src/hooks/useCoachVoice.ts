'use client';

/**
 * Hook React de synthèse vocale du Coach IA ("Voice of the Grandmaster Coach").
 *
 * Rôle :
 *   - Gère l'état `isVoiceEnabled` persisté dans `localStorage` sous `backgammon.coachVoiceEnabled` (défaut `false`).
 *   - Suit le statut de lecture en temps réel : `isSpeaking`, `currentText`.
 *   - Expose `speak(text, options)`, `stop()` et `toggleVoice()` (avec micro-vibration `impactLight`).
 *   - Sélectionne automatiquement la meilleure voix disponible pour la langue active (`useI18n()`),
 *     en priorisant les voix naturelles/locales ("Google français", "Thomas", "Audrey", "Daniel", etc.).
 *   - Épure la notation technique de backgammon ("24/18 13/8") avant prononciation.
 *   - Nettoie et interrompt automatiquement la synthèse au démontage.
 *
 * Strictement 0 `any`, ≤ 200 lignes.
 */

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { impactLight } from '../lib/capacitor/haptics';
import {
    COACH_VOICE_STORAGE_KEY,
    VOICE_BCP47_MAP,
    cleanCoachTextForSpeech,
    selectBestCoachVoice,
    voiceCoach,
} from '../lib/sound/voiceCoach';
import { soundEngine } from '../lib/sound/soundEngine';

export {
    COACH_VOICE_STORAGE_KEY,
    VOICE_BCP47_MAP,
    cleanCoachTextForSpeech,
    selectBestCoachVoice,
};

export interface SpeakOptions {
    /** Force la lecture vocale même si `isVoiceEnabled` est à `false` (ex: clic manuel de réécoute). */
    force?: boolean;
}

export interface UseCoachVoiceResult {
    isVoiceEnabled: boolean;
    isVoiceActive: boolean;
    isSupported: boolean;
    isSpeaking: boolean;
    currentText: string | null;
    speak: (text: string, options?: SpeakOptions) => boolean;
    speakExplanation: (text: string, locale?: string, force?: boolean) => boolean;
    stop: () => void;
    stopVoice: () => void;
    toggleVoice: () => boolean;
    toggleVoiceCoach: () => boolean;
}

interface SharedVoiceState {
    isVoiceEnabled: boolean;
    isSpeaking: boolean;
    currentText: string | null;
}

const listeners = new Set<() => void>();
const sharedState: SharedVoiceState = {
    isVoiceEnabled: false,
    isSpeaking: false,
    currentText: null,
};

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

function readStoredVoiceEnabled(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    try {
        return localStorage.getItem(COACH_VOICE_STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function writeStoredVoiceEnabled(enabled: boolean): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(COACH_VOICE_STORAGE_KEY, String(enabled));
    } catch {
        // Stockage indisponible ou quota atteint
    }
}

/**
 * Coupe immédiatement toute synthèse vocale en cours.
 */
export function stopCoachVoice(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
        } catch {
            // Ignorer les erreurs d'environnement sans moteur audio
        }
    }
    if (sharedState.isSpeaking || sharedState.currentText !== null) {
        sharedState.isSpeaking = false;
        sharedState.currentText = null;
        notifyListeners();
    }
}

export function useCoachVoice(): UseCoachVoiceResult {
    const { locale } = useI18n();
    const [, setTick] = useState(0);

    const [isHydratedVoice, setIsHydratedVoice] = useState<boolean>(() => {
        const stored = readStoredVoiceEnabled();
        sharedState.isVoiceEnabled = stored;
        return stored;
    });

    useEffect(() => {
        const stored = readStoredVoiceEnabled();
        sharedState.isVoiceEnabled = stored;
        setIsHydratedVoice(stored);

        const listener = () => {
            setIsHydratedVoice(sharedState.isVoiceEnabled);
            setTick((t) => t + 1);
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
            stopCoachVoice();
        };
    }, []);

    const stop = useCallback((): void => {
        stopCoachVoice();
    }, []);

    const toggleVoice = useCallback((): boolean => {
        const next = !sharedState.isVoiceEnabled;
        sharedState.isVoiceEnabled = next;
        writeStoredVoiceEnabled(next);
        voiceCoach.setEnabled(next);
        void impactLight();
        if (!next) {
            stopCoachVoice();
        }
        notifyListeners();
        return next;
    }, []);

    const speak = useCallback(
        (text: string, options?: SpeakOptions): boolean => {
            if (typeof window === 'undefined' || !window.speechSynthesis) return false;
            if (soundEngine.isMute() && !options?.force) return false;
            const activeEnabled = sharedState.isVoiceEnabled || readStoredVoiceEnabled();
            if (!activeEnabled && !options?.force) return false;

            const cleaned = cleanCoachTextForSpeech(text, locale);
            if (!cleaned) return false;

            const shortLang = (locale || 'fr').toLowerCase().slice(0, 2);
            const bcp47 = VOICE_BCP47_MAP[shortLang] ?? 'fr-FR';

            try {
                window.speechSynthesis.cancel();
                const UtteranceCtor = window.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance;
                const utterance: SpeechSynthesisUtterance = UtteranceCtor
                    ? new UtteranceCtor(cleaned)
                    : ({ text: cleaned, lang: bcp47, rate: 1, pitch: 1, voice: null } as unknown as SpeechSynthesisUtterance);

                utterance.lang = bcp47;
                utterance.rate = 1.0;
                utterance.pitch = 1.0;

                const voices = window.speechSynthesis.getVoices?.() ?? [];
                const bestVoice = selectBestCoachVoice(voices, locale);
                if (bestVoice) utterance.voice = bestVoice;

                utterance.onstart = () => {
                    sharedState.isSpeaking = true;
                    sharedState.currentText = cleaned;
                    notifyListeners();
                };
                const handleEnd = () => {
                    sharedState.isSpeaking = false;
                    sharedState.currentText = null;
                    notifyListeners();
                };
                utterance.onend = handleEnd;
                utterance.onerror = handleEnd;

                sharedState.isSpeaking = true;
                sharedState.currentText = cleaned;
                notifyListeners();
                window.speechSynthesis.speak(utterance);
                return true;
            } catch {
                sharedState.isSpeaking = false;
                sharedState.currentText = null;
                notifyListeners();
                return false;
            }
        },
        [locale],
    );

    const speakExplanation = useCallback(
        (text: string, _locale?: string, force: boolean = true) => speak(text, { force }),
        [speak],
    );

    return {
        isVoiceEnabled: isHydratedVoice,
        isVoiceActive: isHydratedVoice,
        isSupported: typeof window !== 'undefined' && Boolean(window.speechSynthesis),
        isSpeaking: sharedState.isSpeaking,
        currentText: sharedState.currentText,
        speak,
        speakExplanation,
        stop,
        stopVoice: stop,
        toggleVoice,
        toggleVoiceCoach: toggleVoice,
    };
}

export default useCoachVoice;
