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

        // Le clic sur la carte IA garde le panneau d'options replié jusqu'au clic sur le bouton d'options
        fireEvent.click(screen.getByTestId('lobby-card-ai'));
        expect(screen.queryByTestId('lobby-options-panel')).toBeNull();
        fireEvent.click(screen.getByTestId('lobby-options-toggle'));
        expect(screen.getByTestId('lobby-options-panel')).toBeDefined();

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

    it('affiche le panneau Multijoueur avec les 2 actions principales ("Matchmaking Rapide" vs "Salon Privé par Code") et ouvre la modale', () => {
        const onStart = vi.fn();
        const onOpenModule = vi.fn();
        render(<LobbyScreen onStart={onStart} onOpenModule={onOpenModule} />);

        fireEvent.click(screen.getByTestId('lobby-card-multiplayer'));
        const openMatches = screen.getByTestId('open-matches-table');
        expect(openMatches).toBeDefined();
        expect(screen.getByTestId('private-salon-active-badge')).toBeDefined();
        expect(screen.getByTestId('open-matches-quick-matchmaking')).toBeDefined();
        expect(screen.getByTestId('open-matches-private-code')).toBeDefined();
        expect(openMatches.innerHTML).not.toContain('text-[8px]');
        expect(openMatches.innerHTML).not.toContain('text-[9px]');
        expect(openMatches.innerHTML).not.toContain('text-[10px]');

        // Ouverture depuis le bouton Salon Privé par Code
        fireEvent.click(screen.getByTestId('create-open-match-btn'));
        expect(onOpenModule).toHaveBeenCalledWith('multiplayer');

        // Ouverture depuis le bouton principal doré
        fireEvent.click(screen.getByTestId('lobby-start-btn'));
        expect(onOpenModule).toHaveBeenCalledTimes(2);
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
        const promptEvent = Object.assign(new Event('beforeinstallprompt'), {
            prompt: fakePrompt,
            userChoice: Promise.resolve({ outcome: 'accepted' as const, platform: 'web' }),
        });

        render(<LobbyScreen onStart={vi.fn()} />);

        act(() => {
            window.dispatchEvent(promptEvent);
        });

        const lobbyInstallBtn = await screen.findByTestId('lobby-pwa-install-btn');
        expect(lobbyInstallBtn).toBeDefined();
        fireEvent.click(lobbyInstallBtn);
        expect(fakePrompt).toHaveBeenCalled();
    });

    it('respecte la hiérarchie UX/UI : actions principales au-dessus de la section secondaire, 0 micro-texte < 11px et bordure dorée réservée à l’actif et au CTA', () => {
        const { container } = render(<LobbyScreen onStart={vi.fn()} />);

        const cardAi = screen.getByTestId('lobby-card-ai');
        const cardMulti = screen.getByTestId('lobby-card-multiplayer');
        const optionsToggle = screen.getByTestId('lobby-options-toggle');
        const startBtn = screen.getByTestId('lobby-start-btn');
        const secondarySection = screen.getByTestId('lobby-secondary-section');

        // 1. Le CTA principal précède la section secondaire dans le DOM
        expect(startBtn.compareDocumentPosition(secondarySection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(optionsToggle.compareDocumentPosition(startBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // 2. La section secondaire regroupe PlayerProfileCard, CoachPreMatchBriefingCard et LearningModulesGrid
        expect(secondarySection.querySelector('[data-testid="player-profile-card"]')).not.toBeNull();
        expect(secondarySection.querySelector('[data-testid="lobby-prematch-briefing"]')).not.toBeNull();
        expect(secondarySection.querySelector('[data-testid="learning-modules-grid"]')).not.toBeNull();

        // 3. Aucun micro-texte text-[8px] ou text-[9px]
        expect(container.innerHTML).not.toContain('text-[8px]');
        expect(container.innerHTML).not.toContain('text-[9px]');

        // 4. Bordure dorée (#f3c65f) sur la carte active ('multiplayer' par défaut) et le bouton principal, border-white/10 sur les cartes inactives/secondaires
        expect(cardMulti.className).toContain('border-[#f3c65f]');
        expect(startBtn.className).toContain('border-[#f3c65f]');
        expect(cardAi.className).toContain('border-white/10');
        expect(screen.getByTestId('player-profile-card').className).toContain('border-white/10');
        expect(screen.getByTestId('lobby-prematch-briefing').className).toContain('border-white/10');
        expect(screen.getByTestId('lobby-module-puzzles').className).toContain('border-white/10');
    });

    it('expose en 1 tap au-dessus de la ligne de flottaison le Scanner Photo et la Pendule WBF de Tournoi', () => {
        const onOpenModule = vi.fn();
        render(<LobbyScreen onStart={vi.fn()} onOpenModule={onOpenModule} />);

        const scannerBtn = screen.getByTestId('lobby-quick-scanner-btn');
        const clockBtn = screen.getByTestId('lobby-quick-clock-btn');
        expect(scannerBtn).toBeDefined();
        expect(clockBtn).toBeDefined();

        fireEvent.click(scannerBtn);
        expect(onOpenModule).toHaveBeenCalledWith('import_export');

        fireEvent.click(clockBtn);
        expect(screen.getByTestId('tournament-table-clock-modal')).toBeDefined();
    });

    it('permet de basculer en 1 tap entre Match (3/5/7/11 pts - Crawford) et Money Game (Jacoby) sans ouvrir de sous-menu', () => {
        const onStart = vi.fn();
        render(<LobbyScreen onStart={onStart} initialMatchLength={7} />);

        const startBtn = screen.getByTestId('lobby-start-btn');
        expect(startBtn.textContent).toContain('MATCH 7 PTS');

        // Passage en 5 pts en 1 tap
        fireEvent.click(screen.getByTestId('lobby-quick-pts-5'));
        expect(startBtn.textContent).toContain('MATCH 5 PTS');

        // Bascule en Money Game en 1 tap
        fireEvent.click(screen.getByTestId('lobby-pill-money-mode'));
        expect(screen.getByTestId('lobby-money-rule-badge')).toBeDefined();
        expect(startBtn.textContent).toContain('MONEY GAME');

        fireEvent.click(startBtn);
        expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ matchLength: 0 }));
    });
});
