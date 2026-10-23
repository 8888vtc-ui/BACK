/**
 * Moteur Audio Procédural Web Audio — Ambiance Casino & Club de Backgammon.
 *
 * Zéro dépendance audio externe, zéro latence :
 * - Synthèse dynamique réaliste du gobelet et des dés sur feutrine
 * - Glissement et claquement des pions en bois et ivoire
 * - Frappe sur la barre (blot hit)
 * - Claquement lourd du videau (doubling cube)
 * - Fanfare de victoire de tournoi
 */

import { voiceCoach } from './voiceCoach';

class BackgammonSoundEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private volume: number = 0.5;

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                const savedMute = localStorage.getItem('bg_sound_muted');
                if (savedMute !== null) {
                    this.isMuted = savedMute === 'true';
                }
            } catch {
                // localStorage restreint
            }
        }
    }

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
        return this.ctx;
    }

    public isMute(): boolean {
        return this.isMuted;
    }

    public setVolume(val: number): void {
        this.volume = Math.max(0, Math.min(1, val));
    }

    public getVolume(): number {
        return this.volume;
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('bg_sound_muted', String(this.isMuted));
            } catch {
                // ignore
            }
        }
        return this.isMuted;
    }

    /**
     * Bruit blanc filtré pour simuler les bruits de roulement et de feutrine.
     */
    private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    /**
     * Lancer de dés : secousse dans le gobelet en cuir puis rebonds sur la feutrine.
     */
    public playDiceRoll(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Cliquetis initial dans le gobelet (2 petits clics rapprochés)
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + i * 0.06;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(420 + i * 180, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.04);

            gain.gain.setValueAtTime(0.25 * this.volume, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.05);
        }

        // 2. Chute et rebonds feutrés sur le tapis (roulement feutré)
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 0.35);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now + 0.18);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.45);

        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(0.001, now);
        gainNoise.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.22);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

        noise.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(ctx.destination);

        noise.start(now + 0.18);
        noise.stop(now + 0.5);
    }

    /**
     * Déplacement d'un pion : glissement soyeux et impact boisé doux sur la flèche.
     */
    public playCheckerSlide(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Impact boisé / résine douce
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);

        gain.gain.setValueAtTime(0.28 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

        // Petit frottement feutrine
        const noise = ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer(ctx, 0.08);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);

        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(0.12 * this.volume, now);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        noise.connect(filter);
        filter.connect(gainNoise);
        gainNoise.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.08);
    }

    /**
     * Pose d'un pion (clac mat résine/acajou sur bois) :
     * impulsion très courte (45ms), oscillateur triangle 320Hz -> 90Hz,
     * filtre passe-bande autour de 800Hz.
     */
    public playCheckerClack(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.045);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(1.2, now);

        gain.gain.setValueAtTime(0.3 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Frappe d'un blot adverse : choc sec sur le bois puis résonance de la barre centrale.
     */
    public playCheckerHit(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Clac sec (hautes fréquences)
        const oscHit = ctx.createOscillator();
        const gainHit = ctx.createGain();

        oscHit.type = 'triangle';
        oscHit.frequency.setValueAtTime(850, now);
        oscHit.frequency.exponentialRampToValueAtTime(220, now + 0.06);

        gainHit.gain.setValueAtTime(0.55 * this.volume, now);
        gainHit.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        oscHit.connect(gainHit);
        gainHit.connect(ctx.destination);

        oscHit.start(now);
        oscHit.stop(now + 0.08);

        // Résonance boisée creuse de la barre centrale
        const oscWood = ctx.createOscillator();
        const gainWood = ctx.createGain();

        oscWood.type = 'sine';
        oscWood.frequency.setValueAtTime(190, now);
        oscWood.frequency.exponentialRampToValueAtTime(75, now + 0.16);

        gainWood.gain.setValueAtTime(0.4 * this.volume, now);
        gainWood.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        oscWood.connect(gainWood);
        gainWood.connect(ctx.destination);

        oscWood.start(now);
        oscWood.stop(now + 0.19);
    }

    /**
     * Doublage au videau : claque lourd et métallique sur le rebord en laiton.
     */
    public playDoublingCube(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Proposition du Videau : accord ascendant doux et solennel à deux notes
     * (440Hz puis 660Hz, onde sine, enveloppe douce de 200ms).
     */
    public playCubeOffer(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [440, 660];

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.12;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.22 * this.volume, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.22);
        });
    }

    /**
     * Alerte de Blunder (erreur grave détectée par le Coach) :
     * note grave discrète et feutrée (160Hz -> 120Hz, onde sine, 220ms, volume faible).
     */
    public playBlunderAlert(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
    }

    /**
     * Victoire de manche : arpège triomphal classique de casino.
     */
    public playVictory(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99]; // Do Mi Sol Do Mi Sol

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.08;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.25 * this.volume, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.4);
        });
    }

    /**
     * Synthèse vocale facultative du Coach IA (Web Speech API en 5 langues : EN, FR, ES, DE, JA).
     */
    public isVoiceCoachEnabled(): boolean {
        return voiceCoach.isEnabled();
    }

    public toggleVoiceCoach(): boolean {
        return voiceCoach.toggleEnabled();
    }

    public speakCoachAlert(text: string, locale: string = 'fr', force: boolean = false): boolean {
        return voiceCoach.speak(text, locale, {
            force,
            isGlobalMuted: this.isMuted,
        });
    }

    public stopCoachVoice(): void {
        voiceCoach.stop();
    }
}

export const soundEngine = new BackgammonSoundEngine();
