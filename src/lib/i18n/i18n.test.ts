import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fr } from './translations/fr';
import { en } from './translations/en';
import { resolveTranslation, getTranslation } from './I18nContext';

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
