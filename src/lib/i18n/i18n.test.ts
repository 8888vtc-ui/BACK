import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fr } from './translations/fr';
import { en } from './translations/en';
import { es } from './translations/es';
import { pt } from './translations/pt';
import { de } from './translations/de';
import { ar } from './translations/ar';
import { ja } from './translations/ja';
import { resolveTranslation, getTranslation, detectLocale } from './I18nContext';
import { isRtlLocale, PRIMARY_LOCALES } from './types';
import { BACKGAMMON_TERMINOLOGY_MATRIX, getTerminologyRow } from './terminologyMatrix';

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    let keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            keys = keys.concat(getAllKeys(v as Record<string, unknown>, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

describe('i18n Dictionary Parity & Interpolation (6 Primary Languages: FR, EN, ES, PT, DE, AR + JA)', () => {
    it('possède une parité exacte de clés entre tous les dictionnaires (FR, EN, ES, PT, DE, AR, JA)', () => {
        const frKeys = getAllKeys(fr as unknown as Record<string, unknown>).sort();
        const enKeys = getAllKeys(en as unknown as Record<string, unknown>).sort();
        const esKeys = getAllKeys(es as unknown as Record<string, unknown>).sort();
        const ptKeys = getAllKeys(pt as unknown as Record<string, unknown>).sort();
        const deKeys = getAllKeys(de as unknown as Record<string, unknown>).sort();
        const arKeys = getAllKeys(ar as unknown as Record<string, unknown>).sort();
        const jaKeys = getAllKeys(ja as unknown as Record<string, unknown>).sort();

        expect(frKeys).toEqual(enKeys);
        expect(frKeys).toEqual(esKeys);
        expect(frKeys).toEqual(ptKeys);
        expect(frKeys).toEqual(deKeys);
        expect(frKeys).toEqual(arKeys);
        expect(frKeys).toEqual(jaKeys);
    });

    it('toutes les valeurs dans les dictionnaires sont des chaînes non-vides', () => {
        const frKeys = getAllKeys(fr as unknown as Record<string, unknown>);
        const dicts = [
            fr as unknown as Record<string, unknown>,
            en as unknown as Record<string, unknown>,
            es as unknown as Record<string, unknown>,
            pt as unknown as Record<string, unknown>,
            de as unknown as Record<string, unknown>,
            ar as unknown as Record<string, unknown>,
            ja as unknown as Record<string, unknown>,
        ];

        for (const key of frKeys) {
            for (const dict of dicts) {
                const val = resolveTranslation(dict, key);
                expect(typeof val).toBe('string');
                expect((val as string).trim().length).toBeGreaterThan(0);
            }
        }
    });

    it('interpole correctement les variables dynamiques {var} en FR, EN, ES, PT, DE, AR, JA', () => {
        expect(resolveTranslation(fr as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('Lancer le Rollout Profond (1296 parties)');
        expect(resolveTranslation(en as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('Launch Deep Rollout (1296 trials)');
        expect(resolveTranslation(es as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('Iniciar Rollout (1296 partidas)');
        expect(resolveTranslation(pt as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('Iniciar Rollout Profundo (1296 partidas)');
        expect(resolveTranslation(de as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('Rollout starten (1296 Spiele)');
        expect(resolveTranslation(ar as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('بدء المحاكاة العميقة (1296 جولة)');
        expect(resolveTranslation(ja as unknown as Record<string, unknown>, 'rollout.launchBtn', { trials: 1296 }))
            .toBe('ロールアウト開始（1296試行）');
    });

    it('gère les interpolations multiples dans une seule chaîne', () => {
        const resFr = resolveTranslation(fr as unknown as Record<string, unknown>, 'engine.diceRolled', { player: 'Blanc', d1: 6, d2: 4 });
        expect(resFr).toBe('Blanc a lancé 6 et 4');

        const resEn = resolveTranslation(en as unknown as Record<string, unknown>, 'engine.diceRolled', { player: 'White', d1: 6, d2: 4 });
        expect(resEn).toBe('White rolled 6 and 4');
    });

    it('getTranslation fonctionne pour toutes les langues avec repli gracieux', () => {
        expect(getTranslation('fr', 'common.close')).toBe('Fermer');
        expect(getTranslation('en', 'common.close')).toBe('Close');
        expect(getTranslation('es', 'common.close')).toBe('Cerrar');
        expect(getTranslation('pt', 'common.close')).toBe('Fechar');
        expect(getTranslation('de', 'common.close')).toBe('Schließen');
        expect(getTranslation('ar', 'common.close')).toBe('إغلاق');
        expect(getTranslation('ja', 'common.close')).toBe('閉じる');
    });

    it('retourne la clé brute si introuvable dans tous les dictionnaires', () => {
        const missing = getTranslation('fr', 'unknown.nonexistent.key');
        expect(missing).toBe('unknown.nonexistent.key');
    });

    it('gère correctement le support RTL pour la langue arabe et la matrice terminologique', () => {
        expect(PRIMARY_LOCALES).toEqual(['fr', 'en', 'es', 'pt', 'de', 'ar']);
        expect(isRtlLocale('ar')).toBe(true);
        expect(isRtlLocale('fr')).toBe(false);
        expect(isRtlLocale('en')).toBe(false);

        expect(Object.keys(BACKGAMMON_TERMINOLOGY_MATRIX).length).toBeGreaterThanOrEqual(25);
        const cubeRow = getTerminologyRow('doublingCube');
        expect(cubeRow?.fr).toBe('Videau');
        expect(cubeRow?.en).toBe('Doubling Cube');
        expect(cubeRow?.es).toBe('Cubo de doblaje');
        expect(cubeRow?.pt).toBe('Dado de dobra (Cubo)');
        expect(cubeRow?.de).toBe('Dopplungswürfel');
        expect(cubeRow?.ar).toBe('مكعب المضاعفة (Doubling Cube)');
    });
});

describe('detectLocale — détection automatique de la langue (6 langues + JA)', () => {
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

    it('priorise le choix manuel sauvegardé dans localStorage pour toutes les langues', () => {
        for (const loc of ['fr', 'en', 'es', 'pt', 'de', 'ar', 'ja'] as const) {
            storage['bg_locale'] = loc;
            expect(detectLocale()).toBe(loc);
        }
    });

    it('détecte la langue via navigator.language', () => {
        vi.stubGlobal('navigator', { language: 'es-ES', languages: ['es-ES'] });
        expect(detectLocale()).toBe('es');

        vi.stubGlobal('navigator', { language: 'pt-BR', languages: ['pt-BR'] });
        expect(detectLocale()).toBe('pt');

        vi.stubGlobal('navigator', { language: 'de-DE', languages: ['de-DE'] });
        expect(detectLocale()).toBe('de');

        vi.stubGlobal('navigator', { language: 'ar-SA', languages: ['ar-SA'] });
        expect(detectLocale()).toBe('ar');

        vi.stubGlobal('navigator', { language: 'ja-JP', languages: ['ja-JP'] });
        expect(detectLocale()).toBe('ja');
    });
});
