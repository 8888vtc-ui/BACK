/**
 * Synthèse Vocale Multilingue du Coach IA (Web Speech API).
 *
 * Langues supportées (matrice i18n 5 langues) :
 * - EN (`en-US`)
 * - FR (`fr-FR`)
 * - ES (`es-ES`)
 * - DE (`de-DE`)
 * - JA (`ja-JP`)
 *
 * Résilience & A11y :
 * - SSR-safe et compatible environnement de test / Node.js.
 * - Nettoyage approfondi du Markdown et de la notation technique avant prononciation.
 * - Sélection automatique de la voix native du système correspondant à la locale.
 * - Annulation propre (`cancel()`) pour contrer les chevauchements lors de cadences rapides.
 * - Respect du mode muet global et persistance de la préférence utilisateur.
 * - Strictement 0 any.
 */

export type VoiceCoachLocale = 'en' | 'fr' | 'es' | 'de' | 'ja';

export const VOICE_LOCALE_BCP47: Record<VoiceCoachLocale, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    ja: 'ja-JP',
};

export const VOICE_COACH_STORAGE_KEY = 'bg_voice_coach_enabled';
export const COACH_VOICE_STORAGE_KEY = 'backgammon.coachVoiceEnabled';

export const VOICE_BCP47_MAP: Record<string, string> = {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
    ja: 'ja-JP',
    pt: 'pt-BR',
    ar: 'ar-SA',
};

const PREFERRED_VOICE_NAMES: readonly string[] = [
    'google français',
    'google us english',
    'google uk english',
    'thomas',
    'audrey',
    'amélie',
    'amelie',
    'daniel',
    'samantha',
    'natural',
    'neural',
    'google',
];

interface SpeechHost {
    speechSynthesis?: {
        cancel: () => void;
        speak: (utterance: SpeechSynthesisUtterance) => void;
        getVoices?: () => SpeechSynthesisVoice[];
    };
    SpeechSynthesisUtterance?: {
        new (text?: string): SpeechSynthesisUtterance;
    };
}

/**
 * Nettoie le texte Markdown / technique pour une lecture vocale fluide.
 */
export function sanitizeTextForSpeech(rawText: string): string {
    if (!rawText) return '';
    return rawText
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/ΔEq/gi, 'delta equity')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Convertit la notation technique brute (ex: "24/18 13/8") et le Markdown en texte fluide.
 */
export function cleanCoachTextForSpeech(rawText: string, locale: string = 'fr'): string {
    if (!rawText) return '';
    const isFr = locale.toLowerCase().startsWith('fr');
    const toWord = isFr ? 'vers' : 'to';
    const barWord = isFr ? 'barre' : 'bar';
    const offWord = isFr ? 'sortie' : 'off';
    const deltaWord = isFr ? 'delta équité' : 'delta equity';

    return rawText
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/ΔEq/gi, deltaWord)
        .replace(/\bbar\/(\d+)\*?/gi, `${barWord} ${toWord} $1`)
        .replace(/\b(\d+)\/off\*?/gi, `$1 ${toWord} ${offWord}`)
        .replace(/\b(\d+)\/(\d+)\((\d+)\)\*?/g, isFr ? '$1 vers $2 $3 fois' : '$1 to $2 $3 times')
        .replace(/\b(\d+)\/(\d+)\*?/g, `$1 ${toWord} $2`)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Sélectionne la meilleure voix disponible correspondant à la langue active.
 */
export function selectBestCoachVoice(
    voices: readonly SpeechSynthesisVoice[],
    locale: string,
): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;
    const shortLang = (locale || 'fr').toLowerCase().slice(0, 2);
    const targetBcp47 = (VOICE_BCP47_MAP[shortLang] ?? locale).toLowerCase();

    const matching = voices.filter((v) => {
        const normalized = (v.lang || '').toLowerCase().replace('_', '-');
        return normalized === targetBcp47 || normalized.startsWith(shortLang);
    });
    if (matching.length === 0) return null;

    let bestVoice = matching[0];
    let bestScore = -1;

    for (const voice of matching) {
        let score = 0;
        const nameLower = (voice.name || '').toLowerCase();
        const langLower = (voice.lang || '').toLowerCase().replace('_', '-');

        if (langLower === targetBcp47) score += 20;
        if (voice.localService) score += 15;
        if (voice.default) score += 5;

        for (let i = 0; i < PREFERRED_VOICE_NAMES.length; i++) {
            if (nameLower.includes(PREFERRED_VOICE_NAMES[i])) {
                score += 60 - i * 2;
                break;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestVoice = voice;
        }
    }
    return bestVoice;
}

/**
 * Normalise un code de langue vers l'une des 5 locales supportées.
 */
export function resolveVoiceLocale(locale?: string): VoiceCoachLocale {
    const clean = (locale || 'fr').toLowerCase().slice(0, 2);
    if (clean === 'en' || clean === 'fr' || clean === 'es' || clean === 'de' || clean === 'ja') {
        return clean;
    }
    return 'fr';
}

class VoiceCoachEngine {
    private enabled: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(VOICE_COACH_STORAGE_KEY);
                if (saved !== null) {
                    this.enabled = saved === 'true';
                }
            } catch {
                // localStorage indisponible
            }
        }
    }

    private getHost(): SpeechHost | null {
        if (typeof window !== 'undefined') return window as unknown as SpeechHost;
        if (typeof globalThis !== 'undefined') return globalThis as unknown as SpeechHost;
        return null;
    }

    public isSupported(): boolean {
        const host = this.getHost();
        return Boolean(host && host.speechSynthesis);
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(value: boolean): boolean {
        this.enabled = value;
        if (!value) {
            this.stop();
        }
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(VOICE_COACH_STORAGE_KEY, String(this.enabled));
            } catch {
                // ignore
            }
        }
        return this.enabled;
    }

    public toggleEnabled(): boolean {
        return this.setEnabled(!this.enabled);
    }

    public stop(): void {
        const host = this.getHost();
        if (!host?.speechSynthesis) return;
        try {
            host.speechSynthesis.cancel();
        } catch {
            // ignore
        }
    }

    /**
     * Prononce une alerte tactique du Coach IA dans la langue spécifiée.
     */
    public speak(
        text: string,
        locale: string = 'fr',
        options?: { force?: boolean; isGlobalMuted?: boolean; rate?: number },
    ): boolean {
        const host = this.getHost();
        if (!host?.speechSynthesis) return false;
        if (options?.isGlobalMuted) return false;
        if (!this.enabled && !options?.force) return false;

        const cleanText = sanitizeTextForSpeech(text);
        if (!cleanText) return false;

        const resolvedLocale = resolveVoiceLocale(locale);
        const bcp47 = VOICE_LOCALE_BCP47[resolvedLocale];

        try {
            // Annulation préalable pour éviter la cacophonie lors des cadences rapides
            host.speechSynthesis.cancel();

            const UtteranceCtor =
                typeof SpeechSynthesisUtterance !== 'undefined'
                    ? SpeechSynthesisUtterance
                    : host.SpeechSynthesisUtterance;
            if (!UtteranceCtor) return false;

            const utterance = new UtteranceCtor(cleanText);
            utterance.lang = bcp47;
            utterance.rate = options?.rate ?? 1.02;
            utterance.pitch = 1.0;

            const voices: SpeechSynthesisVoice[] = host.speechSynthesis.getVoices?.() ?? [];
            const matchingVoice =
                voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ||
                voices.find((v) => v.lang.toLowerCase().startsWith(resolvedLocale));
            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            host.speechSynthesis.speak(utterance);
            return true;
        } catch {
            return false;
        }
    }
}

export const voiceCoach = new VoiceCoachEngine();
export default voiceCoach;
