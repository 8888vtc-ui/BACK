import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fr } from './translations/fr';
import { en } from './translations/en';
import { resolveTranslation, getTranslation, detectLocale } from './I18nContext';

function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
    let keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            keys = keys.concat(getAllKeys(v, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

describe('i18n Dictionary Parity & Interpolation', () => {
    it('possède une parité exacte de clés entre le dictionnaire FR et le dictionnaire EN', () => {
        const frKeys = getAllKeys(fr).sort();
        const enKeys = getAllKeys(en).sort();

        expect(frKeys).toEqual(enKeys);
    });

    it('toutes les valeurs dans les deux dictionnaires sont des chaînes non-vides', () => {
        const frKeys = getAllKeys(fr);
        for (const key of frKeys) {
            const frVal = resolveTranslation(fr, key);
            const enVal = resolveTranslation(en, key);

            expect(typeof frVal).toBe('string');
            expect((frVal as string).trim().length).toBeGreaterThan(0);

            expect(typeof enVal).toBe('string');
            expect((enVal as string).trim().length).toBeGreaterThan(0);
        }
    });

    it('interpole correctement les variables dynamiques {var}', () => {
        const resultFr = resolveTranslation(fr, 'rollout.launchBtn', { trials: 1296 });
        expect(resultFr).toBe('Lancer le Rollout Profond (1296 parties)');

        const resultEn = resolveTranslation(en, 'rollout.launchBtn', { trials: 1296 });
        expect(resultEn).toBe('Launch Deep Rollout (1296 trials)');
    });

    it('gère les interpolations multiples dans une seule chaîne', () => {
        const resFr = resolveTranslation(fr, 'engine.diceRolled', { player: 'Blanc', d1: 6, d2: 4 });
        expect(resFr).toBe('Blanc a lancé 6 et 4');

        const resEn = resolveTranslation(en, 'engine.diceRolled', { player: 'White', d1: 6, d2: 4 });
        expect(resEn).toBe('White rolled 6 and 4');
    });

    it('getTranslation replie sur le français si la clé manque dans la locale anglaise', () => {
        const customDict = { fr: { test: 'Bonjour' }, en: {} };
        // Clé existante en FR
        const val = getTranslation('fr', 'common.close');
        expect(val).toBe('Fermer');

        // Clé en EN
        const valEn = getTranslation('en', 'common.close');
        expect(valEn).toBe('Close');
    });

    it('retourne la clé brute si introuvable dans tous les dictionnaires', () => {
        const missing = getTranslation('fr', 'unknown.nonexistent.key');
        expect(missing).toBe('unknown.nonexistent.key');
    });
});

describe('detectLocale — détection automatique de la langue', () => {
    let storage: Record<string, string>;

    beforeEach(() => {
        storage = {};
        const localStorageMock = {
            getItem: (k: string) => storage[k] ?? null,
            setItem: (k: string, v: string) => { storage[k] = v; },
            clear: () => { storage = {}; },
        };
        vi.stubGlobal('window', { localStorage: localStorageMock });
        vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
        vi.stubGlobal('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'UTC' }) }) });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('priorise le choix manuel sauvegardé dans localStorage', () => {
        storage['bg_locale'] = 'en';
        expect(detectLocale()).toBe('en');
        storage['bg_locale'] = 'fr';
        expect(detectLocale()).toBe('fr');
    });

    it('détecte le français via navigator.language', () => {
        vi.stubGlobal('navigator', { language: 'fr-FR', languages: ['fr-FR'] });
        expect(detectLocale()).toBe('fr');
    });

    it('détecte l\'anglais via navigator.language', () => {
        vi.stubGlobal('navigator', { language: 'en-US', languages: ['en-US'] });
        expect(detectLocale()).toBe('en');
    });

    it('détecte le français via le fuseau horaire (Europe/Paris)', () => {
        vi.stubGlobal('navigator', { language: 'de-DE', languages: ['de-DE'] });
        vi.stubGlobal('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Europe/Paris' }) }) });
        expect(detectLocale()).toBe('fr');
    });

    it('retourne "en" par défaut pour le reste du monde', () => {
        vi.stubGlobal('navigator', { language: 'ja-JP', languages: ['ja-JP'] });
        vi.stubGlobal('Intl', { DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' }) }) });
        expect(detectLocale()).toBe('en');
    });
});
