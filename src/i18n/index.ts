'use client';

/**
 * Point d'entrée unifié de l'architecture d'internationalisation (`src/i18n/`).
 *
 * Expose :
 * - `useTranslation()` : hook enrichi donnant accès à `locale`, `setLocale`, `t`, `ui` (chaînes UI typées), `dir` ('ltr'|'rtl') et `isRtl`.
 * - Les 6 langues principales du Backgammon mondial (`fr`, `en`, `es`, `pt`, `de`, `ar`) + `ja`.
 * - La matrice terminologique internationale (`BACKGAMMON_TERMINOLOGY_MATRIX`).
 */

import { useMemo } from 'react';
import {
    useI18n,
    I18nProvider,
    DICTIONARIES,
    LOCALE_METADATA,
    PRIMARY_LOCALES,
    isRtlLocale,
    getTranslation,
    resolveTranslation,
    detectLocale,
    BACKGAMMON_TERMINOLOGY_MATRIX,
    getInternationalTerm,
    type Locale,
    type PrimaryLocale,
    type LocaleMetadata,
    type TranslationDictionary,
    type I18nContextValue,
    type BackgammonTermKey,
} from '../lib/i18n';
import { getUiStrings, UI_TRANSLATIONS, type UiLocaleStrings } from './uiTranslations';

export interface UseTranslationResult extends I18nContextValue {
    readonly ui: UiLocaleStrings;
    readonly metadata: LocaleMetadata;
}

export function useTranslation(): UseTranslationResult {
    const i18n = useI18n();
    const ui = useMemo(() => getUiStrings(i18n.locale), [i18n.locale]);
    const metadata = useMemo(() => LOCALE_METADATA[i18n.locale] ?? LOCALE_METADATA.fr, [i18n.locale]);

    return useMemo(
        () => ({
            ...i18n,
            ui,
            metadata,
        }),
        [i18n, ui, metadata],
    );
}

export {
    useI18n,
    I18nProvider,
    DICTIONARIES,
    LOCALE_METADATA,
    PRIMARY_LOCALES,
    isRtlLocale,
    getTranslation,
    resolveTranslation,
    detectLocale,
    BACKGAMMON_TERMINOLOGY_MATRIX,
    getInternationalTerm,
    getUiStrings,
    UI_TRANSLATIONS,
};

export type {
    Locale,
    PrimaryLocale,
    LocaleMetadata,
    TranslationDictionary,
    I18nContextValue,
    BackgammonTermKey,
    UiLocaleStrings,
};
