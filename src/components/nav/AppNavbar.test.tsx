// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import AppNavbar from './AppNavbar';
import InGameMenuModal, { EMERGENCY_MATCH_SNAPSHOT_KEY } from '../hud/InGameMenuModal';
import { createInitialState } from '../../engine/backgammonEngine';

describe('Audits 1, 2 & 5 — AppNavbar & InGameMenuModal', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('rend la barre de navigation globale avec logo, onglets et menu burger mobile', () => {
        const onOpenModule = vi.fn();
        render(<AppNavbar activeTab="play" onOpenModule={onOpenModule} />);

        expect(screen.getByTestId('app-navbar')).toBeDefined();
        expect(screen.getByTestId('nav-tab-play')).toBeDefined();
        expect(screen.getByTestId('nav-tab-puzzles')).toBeDefined();
        expect(screen.getByTestId('nav-tab-drills')).toBeDefined();
        expect(screen.getByTestId('nav-tab-openings')).toBeDefined();
        expect(screen.getByTestId('nav-tab-progression')).toBeDefined();

        // Zéro sélecteur à drapeaux années 80 (auto-détection pure du navigateur)
        expect(screen.queryByTestId('navbar-locale-select')).toBeNull();

        // Ouverture du tiroir mobile
        fireEvent.click(screen.getByTestId('navbar-mobile-burger'));
        expect(screen.getByTestId('navbar-mobile-drawer')).toBeDefined();

        // Clic sur un onglet mobile
        fireEvent.click(screen.getByTestId('mobile-nav-tab-puzzles'));
        expect(onOpenModule).toHaveBeenCalledWith('puzzles');
    });

    it('sauvegarde atomiquement le match lors du clic sur Quitter vers le Lobby et sécurise l’abandon en 2 étapes dans InGameMenuModal', () => {
        const onClose = vi.fn();
        const onLeaveToLobby = vi.fn();
        const onResignGame = vi.fn();
        const state = createInitialState(7);

        render(
            <InGameMenuModal
                isOpen={true}
                onClose={onClose}
                boardState={state}
                cubeValue={2}
                theme="tournament"
                onSelectTheme={vi.fn()}
                isSoundMuted={false}
                onToggleSound={vi.fn()}
                onLeaveToLobby={onLeaveToLobby}
                onResignGame={onResignGame}
            />,
        );

        expect(screen.getByTestId('in-game-menu-modal')).toBeDefined();

        // 1. Test de la confirmation d'abandon en 2 étapes (Gammon 2× avec videau à 2 = 4 pts)
        fireEvent.click(screen.getByTestId('ingame-resign-2x-btn'));
        expect(screen.getByTestId('resign-confirmation-banner').textContent).toContain('4 pts');
        expect(onResignGame).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('confirm-resign-btn'));
        expect(onResignGame).toHaveBeenCalledWith(2);

        // 2. Test de la sauvegarde atomique en quittant vers le lobby
        fireEvent.click(screen.getByTestId('confirm-leave-match-btn'));
        expect(onLeaveToLobby).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem(EMERGENCY_MATCH_SNAPSHOT_KEY)).not.toBeNull();
    });

    it('affiche le bouton Installer l’App quand beforeinstallprompt est émis et permet de lancer l’installation', async () => {
        const fakePrompt = vi.fn().mockResolvedValue(undefined);
        const promptEvent = Object.assign(new Event('beforeinstallprompt'), {
            prompt: fakePrompt,
            userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
        });

        render(<AppNavbar activeTab="play" />);

        act(() => {
            window.dispatchEvent(promptEvent);
        });

        const installBtn = await screen.findByTestId('navbar-pwa-install-btn');
        expect(installBtn).toBeDefined();
        fireEvent.click(installBtn);
        expect(fakePrompt).toHaveBeenCalled();
    });

    it('sur iOS Safari, le clic sur Installer l’App ouvre la modale guidée Monte-Carlo', () => {
        const originalUserAgent = window.navigator.userAgent;
        Object.defineProperty(window.navigator, 'userAgent', {
            value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            configurable: true,
        });

        render(<AppNavbar activeTab="play" />);

        const installBtn = screen.getByTestId('navbar-pwa-install-btn');
        expect(installBtn).toBeDefined();
        fireEvent.click(installBtn);

        expect(screen.getByTestId('pwa-ios-install-modal')).toBeDefined();
        expect(screen.getByText(/Appuyez sur Partager|Tap the Share button/i)).toBeDefined();

        fireEvent.click(screen.getByTestId('pwa-ios-modal-close'));
        expect(screen.queryByTestId('pwa-ios-install-modal')).toBeNull();

        Object.defineProperty(window.navigator, 'userAgent', {
            value: originalUserAgent,
            configurable: true,
        });
    });

    it('masque le bouton Installer l’App lorsque l’application tourne en mode autonome (standalone)', () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockImplementation((query: string) => ({
            matches: query.includes('standalone'),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        render(<AppNavbar activeTab="play" />);

        expect(screen.queryByTestId('navbar-pwa-install-btn')).toBeNull();

        window.matchMedia = originalMatchMedia;
    });
});

