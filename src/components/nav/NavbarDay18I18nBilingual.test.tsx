// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nProvider } from '../../lib/i18n';
import AppNavbar from './AppNavbar';
import { PlayerTierGateSwitch } from '../navigation/PlayerTierGateSwitch';

// Mock usePwaInstall to allow testing the install button
vi.mock('../../hooks/usePwaInstall', () => ({
    default: () => ({
        canInstall: true,
        isInstalled: false,
        showIosModal: false,
        setShowIosModal: vi.fn(),
        handleInstallClick: vi.fn(),
    }),
}));

describe('Day 18: Zero Franglais & Bilingual Verification (FR | EN)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.documentElement.lang = 'fr';
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it('affiche 100 % de textes français en mode FR (Portes, PWA, Invité)', () => {
        window.localStorage.setItem('bgtour_locale', 'fr');

        render(
            <I18nProvider initialLocale="fr">
                <AppNavbar activeTab="play" />
            </I18nProvider>,
        );

        // PlayerTierGateSwitch en FR
        const beginnerBtns = screen.getAllByTestId('tier-gate-btn-beginner');
        expect(beginnerBtns[0].textContent).toContain('Débutant');

        const intermediateBtns = screen.getAllByTestId('tier-gate-btn-intermediate');
        expect(intermediateBtns[0].textContent).toContain('Intermédiaire');

        const expertBtns = screen.getAllByTestId('tier-gate-btn-expert');
        expect(expertBtns[0].textContent).toContain('Expert / Pro');

        // PWA Install en FR
        const pwaBtn = screen.getByTestId('navbar-pwa-install-btn');
        expect(pwaBtn.textContent).toContain("Installer l'App");

        // Invité & Connexion en FR
        expect(screen.getByTestId('lobby-auth-status').textContent).toBe('Joueur Invité');
        const loginBtn = screen.getByTestId('auth-login-trigger');
        expect(loginBtn.textContent).toContain('Connexion');
    });

    it('bascule instantanément vers 100 % anglais via le toggle FR | EN et mémorise bgtour_locale', () => {
        window.localStorage.setItem('bgtour_locale', 'fr');

        render(
            <I18nProvider initialLocale="fr">
                <AppNavbar activeTab="play" />
            </I18nProvider>,
        );

        // Clic sur le bouton de toggle de langue
        const toggleBtn = screen.getByTestId('navbar-locale-toggle-btn');
        fireEvent.click(toggleBtn);

        // Vérification de la persistance sous la clé unifiée 'bgtour_locale'
        expect(window.localStorage.getItem('bgtour_locale')).toBe('en');

        // PlayerTierGateSwitch en EN
        const beginnerBtns = screen.getAllByTestId('tier-gate-btn-beginner');
        expect(beginnerBtns[0].textContent).toContain('Beginner');

        const intermediateBtns = screen.getAllByTestId('tier-gate-btn-intermediate');
        expect(intermediateBtns[0].textContent).toContain('Intermediate');

        const expertBtns = screen.getAllByTestId('tier-gate-btn-expert');
        expect(expertBtns[0].textContent).toContain('Expert / Pro');

        // PWA Install en EN
        const pwaBtn = screen.getByTestId('navbar-pwa-install-btn');
        expect(pwaBtn.textContent).toContain('Install App');

        // Invité & Connexion en EN
        expect(screen.getByTestId('lobby-auth-status').textContent).toBe('Guest Player');
        const loginBtn = screen.getByTestId('auth-login-trigger');
        expect(loginBtn.textContent).toContain('Sign In');
    });

    it('PlayerTierGateSwitch autonome rend les libellés corrects en FR et EN', () => {
        const onSelect = vi.fn();

        const { rerender } = render(
            <I18nProvider key="fr" initialLocale="fr">
                <PlayerTierGateSwitch currentGate="BEGINNER" onSelectGate={onSelect} />
            </I18nProvider>,
        );

        expect(screen.getByTestId('tier-gate-btn-beginner').textContent).toBe('Débutant');
        expect(screen.getByTestId('tier-gate-btn-intermediate').textContent).toBe('Intermédiaire');
        expect(screen.getByTestId('tier-gate-btn-expert').textContent).toBe('Expert / Pro');

        rerender(
            <I18nProvider key="en" initialLocale="en">
                <PlayerTierGateSwitch currentGate="BEGINNER" onSelectGate={onSelect} />
            </I18nProvider>,
        );

        expect(screen.getByTestId('tier-gate-btn-beginner').textContent).toBe('Beginner');
        expect(screen.getByTestId('tier-gate-btn-intermediate').textContent).toBe('Intermediate');
        expect(screen.getByTestId('tier-gate-btn-expert').textContent).toBe('Expert / Pro');
    });
});
