/**
 * Moteur sonore et haptique procédural pour Backgammon Tournament / Snowie 4 Pro.
 * Utilise la Web Audio API synthétisée (bruits feutrés, résonances de bois noble
 * et de feutrine de casino) : aucun chargement de fichier externe requis,
 * latence 0 ms, fonctionne hors-ligne.
 *
 * Inclut la gestion du mode muet (localStorage), du vibreur mobile (navigator.vibrate),
 * et de l'initialisation sûre (AudioContext suspendu par les navigateurs avant geste utilisateur).
 */

class SoundEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private isHapticsEnabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined') {
            const savedMute = localStorage.getItem('bg_sound_muted');
            if (savedMute !== null) {
                this.isMuted = savedMute === 'true';
            }
            const savedHaptics = localStorage.getItem('bg_haptics_enabled');
            if (savedHaptics !== null) {
                this.isHapticsEnabled = savedHaptics !== 'false';
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
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
        if (typeof window !== 'undefined') {
            localStorage.setItem('bg_sound_muted', String(muted));
        }
    }

    public getMuted(): boolean {
        return this.isMuted;
    }

    public toggleMuted(): boolean {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    public setHapticsEnabled(enabled: boolean) {
        this.isHapticsEnabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('bg_haptics_enabled', String(enabled));
        }
    }

    public getHapticsEnabled(): boolean {
        return this.isHapticsEnabled;
    }

    private vibrate(pattern: number | number[]) {
        if (!this.isHapticsEnabled || typeof window === 'undefined' || !navigator.vibrate) return;
        try {
            navigator.vibrate(pattern);
        } catch {
            // Ignorer si bloqué par les permissions
        }
    }

    /**
     * Bruit de roulement de dés dans le cornet en cuir + choc sur la feutrine.
     */
    public playDiceRoll() {
        this.vibrate([15, 30, 20]);
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 3 à 4 petits impacts de dés qui rebondissent
        const impacts = [0, 0.08, 0.16, 0.24];
        impacts.forEach((delay, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140 + idx * 25, now + delay);
            osc.frequency.exponentialRampToValueAtTime(45, now + delay + 0.07);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now + delay);

            gain.gain.setValueAtTime(0.18 - idx * 0.03, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.08);
        });
    }

    /**
     * Glissement soyeux et atterrissage d'un pion sur une flèche (bois sur feutrine).
     */
    public playCheckerMove() {
        this.vibrate(10);
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.09);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Choc de frappe (Hit) : pion adverse percuté et expulsé vers la barre.
     */
    public playHit() {
        this.vibrate([25, 20, 35]);
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // Impact plus sec et claquant (bois contre bois)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    /**
     * Glissement vers le sabot de sortie (Bear-off).
     */
    public playBearOff() {
        this.vibrate([12, 15, 12]);
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Résonance douce ascendante / satisfaisante
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Clic léger d'interface ou de dé sélectionné.
     */
    public playClick() {
        this.vibrate(6);
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.035);
    }
}

export const soundEngine = new SoundEngine();
export default soundEngine;
