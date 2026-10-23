// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import LobbyScreen from './LobbyScreen';
import { PLAYER_COLOR_KEY } from '../hud/ColorSelector';

describe('LobbyScreen', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche le titre, les 3 cartes principales et les 4 cartes secondaires Académie', () => {
        const onOpenModule = vi.fn();
        render(<LobbyScreen onStart={vi.fn()} onOpenModule={onOpenModule} />);
        expect(screen.getByRole('heading', { level: 1, name: 'BACKGAMMON' })).toBeDefined();
        expect(screen.getByTestId('lobby-card-ai')).toBeDefined();
        expect(screen.getByTestId('lobby-card-multiplayer')).toBeDefined();
        expect(screen.getByTestId('lobby-card-training')).toBeDefined();
        expect(screen.getByTestId('lobby-module-puzzles')).toBeDefined();
        expect(screen.getByTestId('lobby-module-openings')).toBeDefined();
        expect(screen.getByTestId('lobby-module-drills')).toBeDefined();
        expect(screen.getByTestId('lobby-module-stats')).toBeDefined();

        fireEvent.click(screen.getByTestId('lobby-module-drills'));
        expect(onOpenModule).toHaveBeenCalledWith('drills');
    });

    it('permet de choisir la couleur des pions et la cadence de pendule puis les transmet lors du démarrage', () => {
        const onStart = vi.fn();
        render(<LobbyScreen onStart={onStart} />);

        // Sélection du mode IA pour afficher les options
        fireEvent.click(screen.getByTestId('lobby-card-ai'));

        // Sélection des Noirs (O)
        const blackBtn = screen.getByTestId('lobby-color-o');
        expect(blackBtn).toBeDefined();
        fireEvent.click(blackBtn);

        expect(localStorage.getItem(PLAYER_COLOR_KEY)).toBe('O');

        // Sélection de la cadence Blitz (30s + 5s)
        const blitzBtn = screen.getByTestId('lobby-clock-blitz');
        expect(blitzBtn).toBeDefined();
        fireEvent.click(blitzBtn);

        // Clic sur Jouer
        const playBtn = screen.getByTestId('lobby-start-btn');
        fireEvent.click(playBtn);

        expect(onStart).toHaveBeenCalledWith(
            expect.objectContaining({
                playerColor: 'O',
                clockPreset: 'blitz',
            }),
        );
    });

    it('affiche la grille des défis ouverts (OpenMatchesTable) lorsque le mode Multijoueur est sélectionné', () => {
        const onOpenModule = vi.fn();
        render(<LobbyScreen onStart={vi.fn()} onOpenModule={onOpenModule} />);

        fireEvent.click(screen.getByTestId('lobby-card-multiplayer'));
        expect(screen.getByTestId('open-matches-table')).toBeDefined();

        // Filtrage par cadence Blitz
        fireEvent.click(screen.getByTestId('open-matches-filter-blitz'));
        expect(screen.getByTestId('open-match-row-chal-ex-3')).toBeDefined();

        // Clic sur Rejoindre
        fireEvent.click(screen.getByTestId('join-open-match-chal-ex-3'));
        expect(onOpenModule).toHaveBeenCalledWith('multiplayer');
    });

    it('affiche la barre de navigation globale (AppNavbar), la carte Mon Espace Joueur (PlayerProfileCard) et les jauges Académie', () => {
        const onOpenModule = vi.fn();
        render(<LobbyScreen onStart={vi.fn()} onOpenModule={onOpenModule} />);

        // Audit 1 : Navbar globale
        expect(screen.getByTestId('app-navbar')).toBeDefined();
        expect(screen.getByTestId('navbar-brand-logo')).toBeDefined();
        expect(screen.getByTestId('lobby-auth-status')).toBeDefined();

        // Audit 3 : Hub Joueur
        expect(screen.getByTestId('player-profile-card')).toBeDefined();
        expect(screen.getByTestId('player-elo-stat')).toBeDefined();
        expect(screen.getByTestId('player-pr-stat')).toBeDefined();
        fireEvent.click(screen.getByTestId('player-profile-review-btn'));
        expect(onOpenModule).toHaveBeenCalledWith('stats');

        // Audit 4 : Académie gamifiée avec barres de progression et badges d'action
        expect(screen.getByTestId('learning-modules-grid')).toBeDefined();
        expect(screen.getByTestId('lobby-module-puzzles-progress-bar')).toBeDefined();
        expect(screen.getByTestId('lobby-module-openings-progress-bar')).toBeDefined();
        expect(screen.getByTestId('lobby-module-drills-progress-bar')).toBeDefined();
        expect(screen.getByTestId('lobby-module-stats-progress-bar')).toBeDefined();
    });

    it('affiche le bouton Installer l’App dans le Salon lorsqu’un prompt d’installation est intercepté', async () => {
        const fakePrompt = vi.fn().mockResolvedValue(undefined);
        const promptEvent = new Event('beforeinstallprompt') as any;
        promptEvent.prompt = fakePrompt;
        promptEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

        render(<LobbyScreen onStart={vi.fn()} />);

        act(() => {
            window.dispatchEvent(promptEvent);
        });

        const lobbyInstallBtn = await screen.findByTestId('lobby-pwa-install-btn');
        expect(lobbyInstallBtn).toBeDefined();
        fireEvent.click(lobbyInstallBtn);
        expect(fakePrompt).toHaveBeenCalled();
    });
});
