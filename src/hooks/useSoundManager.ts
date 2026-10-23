'use client';

/**
 * Hook de gestion audio & synthèse vocale SSR-safe — feedback sonore du jeu et vocalisation Coach IA.
 *
 * Rôle :
 *   Expose une API stable (`playDice`, `playMove`, `playHit`, `playCube`,
 *   `playVictory`, `playBlunder`, `speakCoachAlert`, `stopSpeaking`,
 *   `isVoiceEnabled`, `toggleVoice`) et l'état `isMuted` / `toggleMute` du
 *   moteur audio procédural (`soundEngine`) et Web Speech API (`voiceCoach`).
 */

import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from '../lib/sound/soundEngine';

export interface UseSoundManagerResult {
    /** Le son est-il coupé ? */
    isMuted: boolean;
    /** Bascule mute/unmute et persiste la préférence. */
    toggleMute: () => boolean;
    /** La synthèse vocale du Coach IA (Web Speech API) est-elle activée ? */
    isVoiceEnabled: boolean;
    /** Bascule l'activation de la synthèse vocale du Coach IA. */
    toggleVoice: () => boolean;
    /** Prononce une alerte tactique du Coach IA en 5 langues (EN, FR, ES, DE, JA). */
    speakCoachAlert: (text: string, locale?: string, force?: boolean) => boolean;
    /** Interrompt toute annonce vocale en cours. */
    stopSpeaking: () => void;
    /** Lancer de dés (gobelet + rebonds feutrés). */
    playDice: () => void;
    /** Déplacement d'un pion (glissement + clac boisé). */
    playMove: () => void;
    /** Frappe d'un blot adverse (choc sec + résonance). */
    playHit: () => void;
    /** Claquement lourd du videau. */
    playCube: () => void;
    /** Proposition de double (accord solennel). */
    playCubeOffer: () => void;
    /** Fanfare de victoire de manche. */
    playVictory: () => void;
    /** Alerte grave du Coach (blunder). */
    playBlunder: () => void;
}

export function useSoundManager(): UseSoundManagerResult {
    // ANTI-HYDRATATION : constantes strictes, identiques SSR/CSR.
    const [isMuted, setIsMuted] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

    useEffect(() => {
        setIsMuted(soundEngine.isMute());
        setIsVoiceEnabled(soundEngine.isVoiceCoachEnabled());
    }, []);

    const toggleMute = useCallback(() => {
        const next = soundEngine.toggleMute();
        setIsMuted(next);
        if (next) {
            soundEngine.stopCoachVoice();
        }
        return next;
    }, []);

    const toggleVoice = useCallback(() => {
        const next = soundEngine.toggleVoiceCoach();
        setIsVoiceEnabled(next);
        return next;
    }, []);

    const speakCoachAlert = useCallback(
        (text: string, locale: string = 'fr', force: boolean = false) => {
            return soundEngine.speakCoachAlert(text, locale, force);
        },
        [],
    );

    const stopSpeaking = useCallback(() => {
        soundEngine.stopCoachVoice();
    }, []);

    const playDice = useCallback(() => soundEngine.playDiceRoll(), []);
    const playMove = useCallback(() => {
        soundEngine.playCheckerSlide();
        soundEngine.playCheckerClack();
    }, []);
    const playHit = useCallback(() => soundEngine.playCheckerHit(), []);
    const playCube = useCallback(() => soundEngine.playDoublingCube(), []);
    const playCubeOffer = useCallback(() => soundEngine.playCubeOffer(), []);
    const playVictory = useCallback(() => soundEngine.playVictory(), []);
    const playBlunder = useCallback(() => soundEngine.playBlunderAlert(), []);

    return {
        isMuted,
        toggleMute,
        isVoiceEnabled,
        toggleVoice,
        speakCoachAlert,
        stopSpeaking,
        playDice,
        playMove,
        playHit,
        playCube,
        playCubeOffer,
        playVictory,
        playBlunder,
    };
}

export default useSoundManager;
