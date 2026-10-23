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

describe('LanguageSelector Component (5 Langues : FR, EN, ES, DE, JA)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = 'fr';
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche le sélecteur de langue avec les 5 boutons FR, EN, ES, DE, JA', () => {
        render(
            <I18nProvider initialLocale="fr">
                <TestApp />
            </I18nProvider>,
        );

        expect(screen.getByTestId('language-selector')).toBeDefined();
        expect(screen.getByTestId('lang-btn-fr')).toBeDefined();
        expect(screen.getByTestId('lang-btn-en')).toBeDefined();
        expect(screen.getByTestId('lang-btn-es')).toBeDefined();
        expect(screen.getByTestId('lang-btn-de')).toBeDefined();
        expect(screen.getByTestId('lang-btn-ja')).toBeDefined();
        expect(screen.getByTestId('current-lang').textContent).toBe('fr');
        expect(screen.getByTestId('translated-title').textContent).toBe('Coach en Temps Réel');
    });

    it('bascule vers l’espagnol, l’allemand et le japonais au clic', () => {
        render(
            <I18nProvider initialLocale="fr">
                <TestApp />
            </I18nProvider>,
        );

        // Clic sur ES
        fireEvent.click(screen.getByTestId('lang-btn-es'));
        expect(screen.getByTestId('current-lang').textContent).toBe('es');
        expect(screen.getByTestId('translated-title').textContent).toBe('Entrenador en Tiempo Real');
        expect(document.documentElement.lang).toBe('es');

        // Clic sur DE
        fireEvent.click(screen.getByTestId('lang-btn-de'));
        expect(screen.getByTestId('current-lang').textContent).toBe('de');
        expect(screen.getByTestId('translated-title').textContent).toBe('Echtzeit-Trainer');
        expect(document.documentElement.lang).toBe('de');

        // Clic sur JA
        fireEvent.click(screen.getByTestId('lang-btn-ja'));
        expect(screen.getByTestId('current-lang').textContent).toBe('ja');
        expect(screen.getByTestId('translated-title').textContent).toBe('リアルタイム・コーチ');
        expect(document.documentElement.lang).toBe('ja');
    });

    it('bascule vers l’anglais et mémorise le choix dans localStorage', () => {
        render(
            <I18nProvider initialLocale="fr">
                <TestApp />
            </I18nProvider>,
        );

        fireEvent.click(screen.getByTestId('lang-btn-en'));

        expect(screen.getByTestId('current-lang').textContent).toBe('en');
        expect(screen.getByTestId('translated-title').textContent).toBe('Real-Time Coach');
        expect(document.documentElement.lang).toBe('en');
        expect(window.localStorage.getItem('bg_locale')).toBe('en');
    });
});
