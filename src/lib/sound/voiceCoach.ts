/**
 * Synthèse Vocale Multilingue & Transducteur Phonétique AST-to-SSML du Coach IA (Web Speech API).
 *
 * Langues supportées :
 * - EN (`en-US`), FR (`fr-FR`), ES (`es-ES`), DE (`de-DE`), JA (`ja-JP`), PT (`pt-BR`), AR (`ar-SA`)
 * - Strictement 0 any, < 270 lignes.
 */

import {
    transduceMoveNotationToPhonetic,
    transduceToPhoneticSSML,
    getPhoneticLexicon,
    type PhoneticLocaleLexicon,
} from './ssmlTransducer';
import { detectLocale } from '../i18n/I18nContext';

export {
    transduceMoveNotationToPhonetic,
    transduceToPhoneticSSML,
    getPhoneticLexicon,
    type PhoneticLocaleLexicon,
};

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
    const lex = getPhoneticLexicon(locale);
    const isEn = (locale || 'fr').toLowerCase().startsWith('en');
    return rawText
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/ΔEq/gi, lex.deltaWord)
        .replace(/\b(\d+)\/36\b/g, (_, n: string) => (isEn ? `${n} chances out of 36` : `${n} chances sur 36`))
        .replace(/\bbar\/(\d+)\*?/gi, `${lex.barWord} ${lex.toWord} $1`)
        .replace(/\b(\d+)\/off\*?/gi, `$1 ${lex.toWord} ${lex.offWord}`)
        .replace(/\b(\d+)\/(\d+)\((\d+)\)\*?/g, (_, from: string, to: string, count: string) =>
            `${from} ${lex.toWord} ${to} ${lex.timesFormat(count)}`,
        )
        .replace(/\b(\d+)\/(\d+)\*?/g, `$1 ${lex.toWord} $2`)
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Alias de compatibilité AST-to-SSML (`<speak>...</speak>`).
 */
export function transduceCoachToSsml(rawText: string, locale: string = 'fr'): string {
    return transduceToPhoneticSSML(rawText, locale);
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

export function resolveVoiceLocale(locale?: string): VoiceCoachLocale {
    const raw = locale || detectLocale();
    const clean = raw.toLowerCase().slice(0, 2);
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
                if (saved !== null) this.enabled = saved === 'true';
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
        if (!value) this.stop();
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

    public buildSSML(text: string, locale?: string): string {
        return transduceToPhoneticSSML(text, resolveVoiceLocale(locale));
    }

    public speak(
        text: string,
        locale?: string,
        options?: { force?: boolean; isGlobalMuted?: boolean; rate?: number; phoneticMoves?: boolean },
    ): boolean {
        const host = this.getHost();
        if (!host?.speechSynthesis || options?.isGlobalMuted) return false;
        if (!this.enabled && !options?.force) return false;

        const resolvedLocale = resolveVoiceLocale(locale);
        const cleanText = options?.phoneticMoves
            ? transduceMoveNotationToPhonetic(text, resolvedLocale)
            : sanitizeTextForSpeech(text);
        if (!cleanText) return false;

        const bcp47 = VOICE_LOCALE_BCP47[resolvedLocale];

        try {
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
            if (matchingVoice) utterance.voice = matchingVoice;

            host.speechSynthesis.speak(utterance);
            return true;
        } catch {
            return false;
        }
    }
}

export const voiceCoach = new VoiceCoachEngine();
export default voiceCoach;
