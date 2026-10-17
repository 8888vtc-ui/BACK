'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Locale, TranslationDictionary } from './types';
import { fr } from './translations/fr';
import { en } from './translations/en';

export const DICTIONARIES: Record<Locale, TranslationDictionary> = { fr, en };

export interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Résout une clé imbriquée de type "coach.title" dans le dictionnaire donné,
 * avec remplacement des variables {var}.
 */
export function resolveTranslation(
    dict: Record<string, any>,
    keyPath: string,
    params?: Record<string, string | number>
): string | null {
    const parts = keyPath.split('.');
    let current: any = dict;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
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
    params?: Record<string, string | number>
): string {
    const dict = DICTIONARIES[locale] || DICTIONARIES.fr;
    const resolved = resolveTranslation(dict, keyPath, params);
    if (resolved !== null) return resolved;

    // Repli sur le dictionnaire français
    if (locale !== 'fr') {
        const fallback = resolveTranslation(DICTIONARIES.fr, keyPath, params);
        if (fallback !== null) return fallback;
    }

    return keyPath;
}

export interface I18nProviderProps {
    children: ReactNode;
    initialLocale?: Locale;
}

/**
 * Fuseaux horaires francophones (fallback lieu) pour la détection automatique.
 */
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

/**
 * Détecte la langue initiale selon l'ordre de priorité :
 * 1. Choix manuel sauvegardé (localStorage 'bg_locale').
 * 2. Langue du navigateur (navigator.language / navigator.languages[0]).
 * 3. Fuseau horaire (Intl.DateTimeFormat().resolvedOptions().timeZone).
 * 4. Défaut : 'en' (Anglais international).
 */
export function detectLocale(): Locale {
    if (typeof window === 'undefined') return 'en';

    // 1. Choix manuel sauvegardé.
    try {
        const saved = window.localStorage.getItem('bg_locale');
        if (saved === 'fr' || saved === 'en') return saved;
    } catch {
        // localStorage indisponible
    }

    // 2. Langue du navigateur.
    try {
        const navLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
        if (navLang.toLowerCase().startsWith('fr')) return 'fr';
        if (navLang.toLowerCase().startsWith('en')) return 'en';
    } catch {
        // navigator indisponible
    }

    // 3. Fuseau horaire (fallback lieu).
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone && FRENCH_TIMEZONES.has(timeZone)) return 'fr';
    } catch {
        // Intl indisponible
    }

    // 4. Défaut : Anglais international.
    return 'en';
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (initialLocale) return initialLocale;
        return detectLocale();
    });

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage?.setItem('bg_locale', newLocale);
                document.documentElement.lang = newLocale;
            } catch { }
        }
    };

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.lang = locale;
        }
    }, [locale]);

    const t = useMemo(() => {
        return (keyPath: string, params?: Record<string, string | number>) => {
            return getTranslation(locale, keyPath, params);
        };
    }, [locale]);

    const value = useMemo<I18nContextValue>(() => ({
        locale,
        setLocale,
        t,
    }), [locale, t]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Hook d'internationalisation. Si utilisé en dehors d'un I18nProvider (par ex. tests isolés),
 * retourne un fallback gracieux vers le français.
 */
export function useI18n(): I18nContextValue {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        return {
            locale: 'fr',
            setLocale: () => { },
            t: (keyPath: string, params?: Record<string, string | number>) =>
                getTranslation('fr', keyPath, params),
        };
    }
    return ctx;
}
