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

    it('permet de lancer une partie rapide via la barre latérale', () => {
        const onStart = vi.fn();
        render(<LobbyScreen onStart={onStart} />);

        const quickPlayBtn = screen.getByTestId('sidebar-quick-play-btn');
        expect(quickPlayBtn).toBeDefined();
        fireEvent.click(quickPlayBtn);

        expect(onStart).toHaveBeenCalledWith(
            expect.objectContaining({
                playerColor: expect.any(String),
            }),
        );
    });

    it('respecte la hiérarchie UX/UI : zéro micro-texte < 11px sur le container principal', () => {
        const { container } = render(<LobbyScreen onStart={vi.fn()} />);
        expect(container.innerHTML).not.toContain('text-[8px]');
        expect(container.innerHTML).not.toContain('text-[9px]');
    });
});
