'use client';

/**
 * Hook de gestion audio SSR-safe — feedback sonore du jeu.
 *
 * Rôle :
 *   Expose une API stable (`playDice`, `playMove`, `playHit`, `playCube`,
 *   `playVictory`, `playBlunder`) et l'état `isMuted` / `toggleMute` du
 *   moteur audio procédural (`soundEngine`).
 *
 * ANTI-HYDRATATION :
 *   `soundEngine.isMute()` lit `localStorage` dans le constructeur du singleton.
 *   L'état React démarre donc sur `false` (identique SSR/CSR) et n'est
 *   synchronisé qu'après le montage, dans un `useEffect`.
 *
 * Dépendances :
 *   `soundEngine` (singleton Web Audio).
 *
 * Retrait :
 *   Supprimer ce fichier et remplacer ses usages par des appels directs à
 *   `soundEngine`.
 */

import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from '../lib/sound/soundEngine';

export interface UseSoundManagerResult {
    /** Le son est-il coupé ? */
    isMuted: boolean;
    /** Bascule mute/unmute et persiste la préférence. */
    toggleMute: () => boolean;
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
    // ANTI-HYDRATATION : constante stricte, identique SSR/CSR.
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        setIsMuted(soundEngine.isMute());
    }, []);

    const toggleMute = useCallback(() => {
        const next = soundEngine.toggleMute();
        setIsMuted(next);
        return next;
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
