import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InstallPrompt from './InstallPrompt';
import * as pwaHook from '../../hooks/usePWA';

describe('InstallPrompt Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('affiche la bannière d’installation quand l’application est installable', () => {
        vi.spyOn(pwaHook, 'usePWA').mockReturnValue({
            isOnline: true,
            isInstallable: true,
            isInstalled: false,
            isIOS: false,
            promptInstall: vi.fn(),
            dismissPrompt: vi.fn(),
        });

        const html = renderToStaticMarkup(<InstallPrompt />);

        expect(html).toContain('data-testid="pwa-install-banner"');
        expect(html).toContain('data-testid="pwa-install-button"');
        expect(html).toContain('data-testid="pwa-dismiss-button"');
        expect(html).toContain('Installer Backgammon Pro');
        expect(html).toContain('Jouez hors-ligne');
    });

    it('n’affiche pas la bannière d’installation quand l’application est déjà installée', () => {
        vi.spyOn(pwaHook, 'usePWA').mockReturnValue({
            isOnline: true,
            isInstallable: false,
            isInstalled: true,
            isIOS: false,
            promptInstall: vi.fn(),
            dismissPrompt: vi.fn(),
        });

        const html = renderToStaticMarkup(<InstallPrompt />);

        expect(html).not.toContain('data-testid="pwa-install-banner"');
    });

    it('affiche l’indicateur de mode hors-ligne quand la connexion est perdue (isOnline = false)', () => {
        vi.spyOn(pwaHook, 'usePWA').mockReturnValue({
            isOnline: false,
            isInstallable: false,
            isInstalled: false,
            isIOS: false,
            promptInstall: vi.fn(),
            dismissPrompt: vi.fn(),
        });

        const html = renderToStaticMarkup(<InstallPrompt />);

        expect(html).toContain('data-testid="pwa-offline-indicator"');
        expect(html).toContain('Mode Hors-Ligne · Sauvegarde locale et IA active');
    });
});
