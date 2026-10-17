'use client';

import React from 'react';
import { useI18n } from '../../lib/i18n';
import { Locale } from '../../lib/i18n/types';

export interface LanguageSelectorProps {
    className?: string;
    variant?: 'compact' | 'full';
}

export default function LanguageSelector({ className = '', variant = 'compact' }: LanguageSelectorProps) {
    const { locale, setLocale, t } = useI18n();

    const handleSelect = (newLocale: Locale) => {
        if (newLocale !== locale) {
            setLocale(newLocale);
        }
    };

    return (
        <div
            data-testid="language-selector"
            role="group"
            aria-label={locale === 'fr' ? 'Sélection de la langue' : 'Language selection'}
            className={`inline-flex shrink-0 items-center rounded-xl bg-slate-950/80 p-0.5 border border-slate-700/60 shadow-sm ${className}`}
        >
            <button
                type="button"
                data-testid="lang-btn-fr"
                onClick={() => handleSelect('fr')}
                aria-pressed={locale === 'fr'}
                aria-label="Passer en français"
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                    locale === 'fr'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
                <span aria-hidden="true">🇫🇷</span>
                <span>FR</span>
            </button>

            <button
                type="button"
                data-testid="lang-btn-en"
                onClick={() => handleSelect('en')}
                aria-pressed={locale === 'en'}
                aria-label="Switch to English"
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                    locale === 'en'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
                <span aria-hidden="true">🇬🇧</span>
                <span>EN</span>
            </button>
        </div>
    );
}
