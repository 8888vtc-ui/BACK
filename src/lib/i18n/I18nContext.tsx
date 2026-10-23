'use client';

/**
 * Contexte d'internationalisation multilingue (5 langues : FR, EN, ES, DE, JA).
 * Strictement 0 any, typage rigoureux et fallback robuste.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Locale, TranslationDictionary, isRtlLocale } from './types';
import { fr } from './translations/fr';
import { en } from './translations/en';
import { es } from './translations/es';
import { pt } from './translations/pt';
import { de } from './translations/de';
import { ar } from './translations/ar';
import { ja } from './translations/ja';

export const DICTIONARIES: Record<Locale, TranslationDictionary> = { fr, en, es, pt, de, ar, ja };

export interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (keyPath: string, params?: Record<string, string | number>) => string;
    dir: 'ltr' | 'rtl';
    isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Résout une clé imbriquée de type "coach.title" dans le dictionnaire donné,
 * avec remplacement des variables {var}. Strictement 0 any.
 */
export function resolveTranslation(
    dict: Record<string, unknown>,
    keyPath: string,
    params?: Record<string, string | number>,
): string | null {
    const parts = keyPath.split('.');
    let current: unknown = dict;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part];
        } else {
            return null;
        }
    }

    if (typeof current !== 'string') {
        return null;
    }

    if (!params) {
        return current;
    }

    let result = current;
    for (const [k, v] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return result;
}

/**
 * Récupère une traduction pour une locale donnée hors composant React.
 */
export function getTranslation(
    locale: Locale,
    keyPath: string,
    params?: Record<string, string | number>,
): string {
    const dict = (DICTIONARIES[locale] || DICTIONARIES.fr) as unknown as Record<string, unknown>;
    const resolved = resolveTranslation(dict, keyPath, params);
    if (resolved !== null) return resolved;

    // Repli sur l'anglais puis sur le français
    if (locale !== 'en') {
        const fallbackEn = resolveTranslation(
            DICTIONARIES.en as unknown as Record<string, unknown>,
            keyPath,
            params,
        );
        if (fallbackEn !== null) return fallbackEn;
    }

    if (locale !== 'fr') {
        const fallbackFr = resolveTranslation(
            DICTIONARIES.fr as unknown as Record<string, unknown>,
            keyPath,
            params,
        );
        if (fallbackFr !== null) return fallbackFr;
    }

    return keyPath;
}

export interface I18nProviderProps {
    children: ReactNode;
    initialLocale?: Locale;
}

const FRENCH_TIMEZONES = new Set([
    'Europe/Paris',
    'Europe/Brussels',
    'Europe/Monaco',
    'Europe/Luxembourg',
    'Europe/Zurich',
    'America/Montreal',
    'Africa/Abidjan',
    'Africa/Dakar',
    'Africa/Tunis',
    'Africa/Algiers',
    'Africa/Casablanca',
    'Indian/Reunion',
    'Pacific/Tahiti',
]);

const SPANISH_TIMEZONES = new Set([
    'Europe/Madrid',
    'America/Mexico_City',
    'America/Buenos_Aires',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
]);

const GERMAN_TIMEZONES = new Set([
    'Europe/Berlin',
    'Europe/Vienna',
]);

const PORTUGUESE_TIMEZONES = new Set([
    'Europe/Lisbon',
    'America/Sao_Paulo',
    'America/Fortaleza',
    'America/Recife',
    'America/Manaus',
]);

const ARABIC_TIMEZONES = new Set([
    'Asia/Riyadh',
    'Asia/Dubai',
    'Asia/Qatar',
    'Asia/Kuwait',
    'Asia/Baghdad',
    'Asia/Amman',
    'Asia/Beirut',
    'Africa/Cairo',
]);

const VALID_LOCALES = new Set<Locale>(['fr', 'en', 'es', 'pt', 'de', 'ar', 'ja']);

/**
 * Détecte la langue initiale selon l'ordre de priorité :
 * 1. Choix manuel sauvegardé (localStorage 'bg_locale').
 * 2. Paramètre d'URL (?lang=fr|en|es|pt|de|ar|ja).
 * 3. Langue du navigateur.
 * 4. Fuseau horaire.
 * 5. Défaut : 'en' (Anglais international).
 */
export function detectLocale(): Locale {
    if (typeof window === 'undefined') return 'fr';

    try {
        const saved = window.localStorage.getItem('bg_locale') as Locale | null;
        if (saved && VALID_LOCALES.has(saved)) {
            return saved;
        }
    } catch {
        // localStorage indisponible
    }

    try {
        if (typeof window.location?.search === 'string' && window.location.search.length > 1) {
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang')?.toLowerCase() as Locale | undefined;
            if (urlLang && VALID_LOCALES.has(urlLang)) {
                return urlLang;
            }
        }
    } catch {
        // URLSearchParams indisponible
    }

    try {
        const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
        if (navLang.startsWith('fr')) return 'fr';
        if (navLang.startsWith('es')) return 'es';
        if (navLang.startsWith('pt')) return 'pt';
        if (navLang.startsWith('de')) return 'de';
        if (navLang.startsWith('ar')) return 'ar';
        if (navLang.startsWith('ja')) return 'ja';
        if (navLang.startsWith('en')) return 'en';
    } catch {
        // navigator indisponible
    }

    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone) {
            if (FRENCH_TIMEZONES.has(timeZone)) return 'fr';
            if (SPANISH_TIMEZONES.has(timeZone)) return 'es';
            if (PORTUGUESE_TIMEZONES.has(timeZone)) return 'pt';
            if (GERMAN_TIMEZONES.has(timeZone)) return 'de';
            if (ARABIC_TIMEZONES.has(timeZone)) return 'ar';
            if (timeZone.startsWith('Asia/Tokyo')) return 'ja';
        }
    } catch {
        // Intl indisponible
    }

    return 'en';
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale || 'fr');

    useEffect(() => {
        if (!initialLocale) {
            const detected = detectLocale();
            if (detected !== 'fr') {
                setLocaleState(detected);
            }
        }
    }, [initialLocale]);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage?.setItem('bg_locale', newLocale);
                document.documentElement.lang = newLocale;
                document.documentElement.dir = isRtlLocale(newLocale) ? 'rtl' : 'ltr';
            } catch {
                // ignore
            }
        }
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
            document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
        }
    }, [locale]);

    const t = useMemo(() => {
        return (keyPath: string, params?: Record<string, string | number>) => {
            return getTranslation(locale, keyPath, params);
        };
    }, [locale]);

    const isRtl = isRtlLocale(locale);
    const dir: 'ltr' | 'rtl' = isRtl ? 'rtl' : 'ltr';

    const value = useMemo<I18nContextValue>(() => ({
        locale,
        setLocale,
        t,
        dir,
        isRtl,
    }), [locale, t, dir, isRtl]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        return {
            locale: 'fr',
            setLocale: () => {},
            t: (keyPath: string, params?: Record<string, string | number>) =>
                getTranslation('fr', keyPath, params),
            dir: 'ltr',
            isRtl: false,
        };
    }
    return ctx;
}
