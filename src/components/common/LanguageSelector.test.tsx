// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import LanguageSelector from './LanguageSelector';
import { I18nProvider, useI18n } from '../../lib/i18n';

function TestApp() {
    const { locale, t } = useI18n();
    return (
        <div>
            <LanguageSelector />
            <span data-testid="current-lang">{locale}</span>
            <span data-testid="translated-title">{t('coach.title')}</span>
        </div>
    );
}

describe('LanguageSelector Component', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = 'fr';
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche le sélecteur de langue avec les boutons FR et EN', () => {
        render(
            <I18nProvider initialLocale="fr">
                <TestApp />
            </I18nProvider>
        );

        expect(screen.getByTestId('language-selector')).toBeDefined();
        expect(screen.getByTestId('lang-btn-fr')).toBeDefined();
        expect(screen.getByTestId('lang-btn-en')).toBeDefined();
        expect(screen.getByTestId('current-lang').textContent).toBe('fr');
        expect(screen.getByTestId('translated-title').textContent).toBe('Coach en Temps Réel');
    });

    it('bascule vers l’anglais au clic sur le bouton EN', () => {
        render(
            <I18nProvider initialLocale="fr">
                <TestApp />
            </I18nProvider>
        );

        const btnEn = screen.getByTestId('lang-btn-en');
        fireEvent.click(btnEn);

        expect(screen.getByTestId('current-lang').textContent).toBe('en');
        expect(screen.getByTestId('translated-title').textContent).toBe('Real-Time Coach');
        expect(document.documentElement.lang).toBe('en');
        expect(window.localStorage.getItem('bg_locale')).toBe('en');
    });

    it('bascule à nouveau vers le français au clic sur FR', () => {
        render(
            <I18nProvider initialLocale="en">
                <TestApp />
            </I18nProvider>
        );

        const btnFr = screen.getByTestId('lang-btn-fr');
        fireEvent.click(btnFr);

        expect(screen.getByTestId('current-lang').textContent).toBe('fr');
        expect(screen.getByTestId('translated-title').textContent).toBe('Coach en Temps Réel');
        expect(document.documentElement.lang).toBe('fr');
        expect(window.localStorage.getItem('bg_locale')).toBe('fr');
    });
});
