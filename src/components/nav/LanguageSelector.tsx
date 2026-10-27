'use client';

/**
 * Sélecteur de langue horloger Monte-Carlo (6 Langues : FR, EN, ES, PT, DE, AR).
 *
 * Caractéristiques :
 * - Rail biseauté Or & Ébène (`#d4af37` / `#070a10`)
 * - Bascule instantanée avec persistance `localStorage('bg_locale')`
 * - Mise à jour automatique de `document.documentElement.lang` et `dir="rtl"` pour l'arabe (`ar`)
 * - 100 % compatible avec les sélecteurs E2E (`language-selector`, `lang-btn-fr`, `lang-btn-en`, etc.)
 */

import React from 'react';
import { useTranslation, PRIMARY_LOCALES, LOCALE_METADATA, type PrimaryLocale } from '../../i18n';

const LanguageSelectorComponent: React.FC = () => {
    const { locale, setLocale, ui } = useTranslation();

    return (
        <div
            role="group"
            aria-label={ui.navbar.languageSelectorAria}
            data-testid="language-selector"
            className="flex items-center gap-0.5 rounded-full border border-white/10 bg-[#070a10]/95 p-0.5 shadow-inner"
        >
            {PRIMARY_LOCALES.map((code: PrimaryLocale) => {
                const meta = LOCALE_METADATA[code];
                const isActive = locale === code;
                return (
                    <button
                        key={code}
                        type="button"
                        data-testid={`lang-btn-${code}`}
                        aria-pressed={isActive}
                        title={`${meta.nativeLabel} (${meta.label})`}
                        onClick={() => setLocale(code)}
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-150 ${
                            isActive
                                ? 'border border-[#f3c65f] bg-gradient-to-b from-[#3b2b12] via-[#261b0a] to-[#171005] text-[#fff6d6] shadow-sm'
                                : 'text-slate-400 hover:bg-white/[0.05] hover:text-amber-200'
                        }`}
                    >
                        {meta.shortLabel}
                    </button>
                );
            })}
        </div>
    );
};

export const LanguageSelector = React.memo(LanguageSelectorComponent);
export default LanguageSelector;
