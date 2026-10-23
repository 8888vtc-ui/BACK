// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, cleanup } from '@testing-library/react';
import PageTransition, { useSpaNavigation, BackToLobbyButton } from './PageTransition';

describe('PageTransition & Navigation SPA', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('affiche le contenu enfant et la barre de chargement lors d\'une transition', () => {
        const { rerender } = render(
            <PageTransition isTransitioning={false}>
                <div>Contenu de la vue</div>
            </PageTransition>,
        );

        expect(screen.getByText('Contenu de la vue')).toBeDefined();
        expect(screen.queryByTestId('spa-top-loading-bar')).toBeNull();

        // Activation de la transition
        rerender(
            <PageTransition isTransitioning={true}>
                <div>Contenu de la vue</div>
            </PageTransition>,
        );

        expect(screen.getByTestId('spa-top-loading-bar')).toBeDefined();
    });

    it('BackToLobbyButton rend un lien préchargé vers / par défaut', () => {
        render(<BackToLobbyButton label="Retour au Lobby" />);

        const btn = screen.getByTestId('universal-back-to-lobby-btn');
        expect(btn).toBeDefined();
        expect(btn.getAttribute('href')).toBe('/');
        expect(screen.getByText('Retour au Lobby')).toBeDefined();
    });

    it('BackToLobbyButton exécute onClick lorsqu\'il est fourni', () => {
        const onClick = vi.fn();
        render(<BackToLobbyButton label="Quitter vers Lobby" onClick={onClick} />);

        const btn = screen.getByTestId('universal-back-to-lobby-btn');
        fireEvent.click(btn);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('useSpaNavigation déclenche l\'état de navigation temporaire', () => {
        const { result } = renderHook(() => useSpaNavigation());

        expect(result.current.isNavigating).toBe(false);

        act(() => {
            result.current.navigateTo('/puzzles');
        });

        expect(result.current.isNavigating).toBe(true);
    });
});
