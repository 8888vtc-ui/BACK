'use client';

/**
 * Hook de gestion audio & synthèse vocale SSR-safe — feedback sonore du jeu et vocalisation Coach IA.
 *
 * Rôle :
 *   Expose une API stable (`playDice`, `playMove`, `playHit`, `playBearOff`,
 *   `playCube`, `playCubeOffer`, `playVictory`, `playBlunder`, `playBrilliantMove`,
 *   `speakCoachAlert`, `stopSpeaking`, `isVoiceEnabled`, `toggleVoice`) et l'état
 *   `isMuted` / `toggleMute` du moteur audio procédural (`soundEngine`) et Web Speech API (`voiceCoach`).
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
    /** Lancer de dés (secousse cornet cuir + rebonds polyrythmiques sur noyer). */
    playDice: () => void;
    /** Déplacement d'un pion (glissement feutre de laine + pose boisée à 95 ms). */
    playMove: () => void;
    /** Frappe d'un blot adverse avec panoramique stéréo optionnel (-0.45..+0.45 selon flèche 1..24). */
    playHit: (pointIndex?: number) => void;
    /** Sortie d'un pion dans la rainure de bear-off (+1.2 % de pitch-shift par pion 1..15). */
    playBearOff?: (checkersInTray?: number) => void;
    /** Pose lourde du videau en laiton brossé sur bois massif. */
    playCube: () => void;
    /** Proposition de double au videau. */
    playCubeOffer: () => void;
    /** Fanfare / arpège cristallin de victoire ou coup brillant. */
    playVictory: () => void;
    /** Alerte de gaffe / blunder post-match (seconde mineure amortie G3/F#3). */
    playBlunder: () => void;
    /** Validation d'un coup brillant / optimal post-match (arpège D5-A5-E6). */
    playBrilliantMove?: () => void;
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
    const playMove = useCallback(() => soundEngine.checkerSlideAndPlace(), []);
    const playHit = useCallback((pointIndex: number = 13) => soundEngine.playCheckerHit(pointIndex), []);
    const playBearOff = useCallback((checkersInTray: number = 1) => soundEngine.playBearOff(checkersInTray), []);
    const playCube = useCallback(() => soundEngine.playDoublingCube(), []);
    const playCubeOffer = useCallback(() => soundEngine.playCubeOffer(), []);
    const playVictory = useCallback(() => soundEngine.playVictory(), []);
    const playBlunder = useCallback(() => soundEngine.playBlunderAlert(), []);
    const playBrilliantMove = useCallback(() => soundEngine.playBrilliantMove(), []);

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
        playBearOff,
        playCube,
        playCubeOffer,
        playVictory,
        playBlunder,
        playBrilliantMove,
    };
}

export default useSoundManager;
