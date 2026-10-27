import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    voiceCoach,
    sanitizeTextForSpeech,
    resolveVoiceLocale,
    VOICE_LOCALE_BCP47,
    transduceMoveNotationToPhonetic,
    transduceToPhoneticSSML,
} from './voiceCoach';

describe('voiceCoach — Web Speech API & Transducteur Phonétique SSML (5 Langues : EN, FR, ES, DE, JA)', () => {
    beforeEach(() => {
        voiceCoach.setEnabled(false);
        vi.restoreAllMocks();
    });

    it('resolveVoiceLocale normalise les 5 langues supportées (en, fr, es, de, ja)', () => {
        expect(resolveVoiceLocale('en-US')).toBe('en');
        expect(resolveVoiceLocale('fr-FR')).toBe('fr');
        expect(resolveVoiceLocale('es')).toBe('es');
        expect(resolveVoiceLocale('de-DE')).toBe('de');
        expect(resolveVoiceLocale('ja-JP')).toBe('ja');
        expect(resolveVoiceLocale('it')).toBe('fr');
        expect(VOICE_LOCALE_BCP47).toEqual({
            en: 'en-US',
            fr: 'fr-FR',
            es: 'es-ES',
            de: 'de-DE',
            ja: 'ja-JP',
        });
    });

    it('sanitizeTextForSpeech nettoie le Markdown et les symboles techniques', () => {
        const raw = '### **Blunder** : *8/5 6/5* perd `0.120` ΔEq.';
        expect(sanitizeTextForSpeech(raw)).toBe('Blunder : 8/5 6/5 perd 0.120 delta equity.');
    });

    it('transduceMoveNotationToPhonetic convertit la notation algébrique (13/8 6/5*, bar/20*, 6/off(2)) en phonétique naturelle', () => {
        const frPhonetic = transduceMoveNotationToPhonetic(
            'Jouez bar/20* puis 13/8 6/5* et 6/off(2) pour sauver 0.120 ΔEq (EPC).',
            'fr'
        );
        expect(frPhonetic).toContain('barre vers 20 avec frappe');
        expect(frPhonetic).toContain('13 vers 8');
        expect(frPhonetic).toContain('6 vers 5 avec frappe');
        expect(frPhonetic).toContain('6 vers sortie 2 fois');
        expect(frPhonetic).toContain('delta équité');
        expect(frPhonetic).toContain('compte de pips effectifs');

        const enPhonetic = transduceMoveNotationToPhonetic('Play 13/8 6/5* and bar/20*', 'en');
        expect(enPhonetic).toContain('13 to 8');
        expect(enPhonetic).toContain('6 to 5 hitting');
        expect(enPhonetic).toContain('bar to 20 hitting');
    });

    it('transduceToPhoneticSSML et voiceCoach.buildSSML génèrent une enveloppe SSML W3C valide', () => {
        const ssml = voiceCoach.buildSSML('Optimal : 13/8 6/5*', 'fr');
        expect(ssml).toMatch(/^<speak xml:lang="fr-FR"><prosody rate="102%" pitch="\+0st">/);
        expect(ssml).toContain('<say-as interpret-as="cardinal">13</say-as> vers <say-as interpret-as="cardinal">8</say-as>');
        expect(ssml).toContain('<emphasis level="moderate">avec frappe</emphasis>');
        expect(ssml).toContain('<break time="180ms"/>');
        expect(ssml).toMatch(/<\/prosody><\/speak>$/);

        const emptySsml = transduceToPhoneticSSML('', 'en');
        expect(emptySsml).toBe('<speak xml:lang="en-US"></speak>');
    });

    it('speak déclenche window.speechSynthesis avec la locale BCP-47 correspondante quand activé', () => {
        const speakSpy = vi.fn();
        const cancelSpy = vi.fn();
        const mockVoice = { lang: 'ja-JP', name: 'Japanese Voice' } as SpeechSynthesisVoice;
        const mockVoiceFr = { lang: 'fr-FR', name: 'French Voice' } as SpeechSynthesisVoice;
        const getVoicesSpy = vi.fn(() => [mockVoice, mockVoiceFr]);

        class MockUtterance {
            text: string;
            lang = '';
            rate = 1;
            pitch = 1;
            voice: SpeechSynthesisVoice | null = null;
            constructor(text: string) {
                this.text = text;
            }
        }

        Object.defineProperty(globalThis, 'speechSynthesis', {
            value: {
                speak: speakSpy,
                cancel: cancelSpy,
                getVoices: getVoicesSpy,
            },
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
            value: MockUtterance,
            configurable: true,
            writable: true,
        });

        // Désactivé par défaut -> ne parle pas sans force
        expect(voiceCoach.speak('Alarme tactique', 'fr')).toBe(false);
        expect(speakSpy).not.toHaveBeenCalled();

        // Activation de la synthèse vocale
        voiceCoach.setEnabled(true);
        expect(voiceCoach.isEnabled()).toBe(true);

        // Test en Japonais (JA -> ja-JP)
        const okJa = voiceCoach.speak('**プライム**を構築しましょう', 'ja');
        expect(okJa).toBe(true);
        expect(cancelSpy).toHaveBeenCalled();
        expect(speakSpy).toHaveBeenCalledTimes(1);
        const utteranceJa = speakSpy.mock.calls[0][0] as MockUtterance;
        expect(utteranceJa.lang).toBe('ja-JP');
        expect(utteranceJa.text).toBe('プライムを構築しましょう');
        expect(utteranceJa.voice?.lang).toBe('ja-JP');

        // Respecte le mode muet global
        expect(voiceCoach.speak('Test muet', 'en', { isGlobalMuted: true })).toBe(false);
    });
});
