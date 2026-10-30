'use client';

/**
 * Sélecteur de langue accessible (5 locales : FR, EN, ES, DE, JA).
 *
 * A11y & Ergonomie :
 * - Standards WCAG 2.1 AAA (contraste, focus visible, aria-pressed, keyboard navigation).
 * - Bascule instantanée de la locale sans rechargement de page destructif.
 * - Strictement 0 any.
 */

import React from 'react';
import { useI18n } from '../../lib/i18n';
import { Locale } from '../../lib/i18n/types';

export interface LanguageSelectorProps {
    className?: string;
    variant?: 'compact' | 'full';
}

interface LanguageOption {
    code: Locale;
    flag: string;
    label: string;
    ariaLabel: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'fr', flag: 'FR', label: 'FR', ariaLabel: 'Passer en français' },
    { code: 'en', flag: 'EN', label: 'EN', ariaLabel: 'Switch to English' },
    { code: 'es', flag: 'ES', label: 'ES', ariaLabel: 'Cambiar a español' },
    { code: 'de', flag: 'DE', label: 'DE', ariaLabel: 'Auf Deutsch wechseln' },
    { code: 'ja', flag: 'JA', label: 'JA', ariaLabel: '日本語に切り替え' },
];

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
            aria-label={t('hud.language') || 'Language selection'}
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[#090d16]/90 p-0.5 border border-[#d4af37]/30 shadow-inner ${className}`}
        >
            {LANGUAGES.map((lang) => {
                const isSelected = locale === lang.code;
                return (
                    <button
                        key={lang.code}
                        type="button"
                        data-testid={`lang-btn-${lang.code}`}
                        onClick={() => handleSelect(lang.code)}
                        aria-pressed={isSelected}
                        aria-label={lang.ariaLabel}
                        className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold transition-all focus:outline-none focus:ring-1 focus:ring-[#f3c65f] ${
                            isSelected
                                ? 'border border-[#f3c65f]/70 bg-gradient-to-b from-[#3a2a10] to-[#1e1507] text-[#fff8e1] shadow-sm'
                                : 'text-slate-400 hover:text-amber-100 hover:bg-white/5'
                        }`}
                    >
                        {variant === 'full' && <span aria-hidden="true">{lang.flag}</span>}
                        <span>{lang.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
