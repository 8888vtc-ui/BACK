// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import LobbyScreen from './LobbyScreen';
import { PLAYER_COLOR_KEY } from '../hud/ColorSelector';
import { PLAYER_TIER_GATE_STORAGE_KEY } from '../../hooks/usePlayerTierGate';

describe('LobbyScreen', () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem(PLAYER_TIER_GATE_STORAGE_KEY, 'INTERMEDIATE');
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche la navbar, la sidebar et le portail Intermédiaire par défaut', () => {
        render(<LobbyScreen onStart={vi.fn()} />);
        expect(screen.getByTestId('app-navbar')).toBeDefined();
        expect(screen.getByTestId('navbar-brand-logo')).toBeDefined();
        expect(screen.getByTestId('lobby-auth-status')).toBeDefined();
        expect(screen.getByTestId('intermediate-home-portal')).toBeDefined();
    });

    it('affiche le portail Débutant lorsque le tierGate est BEGINNER', () => {
        localStorage.setItem(PLAYER_TIER_GATE_STORAGE_KEY, 'BEGINNER');
        render(<LobbyScreen onStart={vi.fn()} />);
        expect(screen.getByTestId('beginner-home-portal')).toBeDefined();
    });

    it('affiche le portail Expert lorsque le tierGate est EXPERT', () => {
        localStorage.setItem(PLAYER_TIER_GATE_STORAGE_KEY, 'EXPERT');
        render(<LobbyScreen onStart={vi.fn()} />);
        expect(screen.getByTestId('expert-home-portal')).toBeDefined();
    });

    it('permet d’ouvrir le panneau d’options et de lancer une partie personnalisée', () => {
        const onStart = vi.fn();
        render(<LobbyScreen onStart={onStart} />);

        // Déplie le groupe de jeu puis ouvre les options IA via la sidebar
        const toggleBtn = screen.getByTestId('sidebar-play-group-toggle');
        fireEvent.click(toggleBtn);
        const aiBtn = screen.getByTestId('sidebar-submenu-ai');
        fireEvent.click(aiBtn);

        // Sélection des Noirs (O)
        const blackBtn = screen.getByTestId('lobby-color-o');
        expect(blackBtn).toBeDefined();
        fireEvent.click(blackBtn);
        expect(localStorage.getItem(PLAYER_COLOR_KEY)).toBe('O');

        // Clic sur Jouer
        const playBtn = screen.getByTestId('lobby-options-start-btn');
        fireEvent.click(playBtn);

        expect(onStart).toHaveBeenCalledWith(
            expect.objectContaining({
                playerColor: 'O',
            }),
        );
    });

    it('respecte la hiérarchie UX/UI : zéro micro-texte < 11px sur le container principal', () => {
        const { container } = render(<LobbyScreen onStart={vi.fn()} />);
        expect(container.innerHTML).not.toContain('text-[8px]');
        expect(container.innerHTML).not.toContain('text-[9px]');
    });
});
