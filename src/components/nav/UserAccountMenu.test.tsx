// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { UserAccountMenu } from './UserAccountMenu';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../../lib/supabase/types';

describe('UserAccountMenu', () => {
    afterEach(() => {
        cleanup();
    });

    const mockUser = {
        id: 'usr-1',
        email: 'champion@backgammon.com',
    } as unknown as User;

    const mockProfile: Profile = {
        id: 'usr-1',
        username: 'champion99',
        display_name: 'Mochy Pro',
        avatar_url: null,
        rating: 1950,
        experience_level: 'expert',
        preferred_theme: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
    };

    it('affiche le squelette de chargement en état loading', () => {
        render(
            <UserAccountMenu
                user={null}
                profile={null}
                isLoading={true}
                onOpenAuthModal={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );
        expect(screen.getByTestId('user-account-loading')).toBeDefined();
    });

    it('affiche le bouton Connexion pour un invité et ouvre la modale au clic', () => {
        const onOpenAuthModal = vi.fn();
        render(
            <UserAccountMenu
                user={null}
                profile={null}
                isLoading={false}
                onOpenAuthModal={onOpenAuthModal}
                onSignOut={vi.fn()}
            />,
        );

        const guestBtn = screen.getByTestId('auth-login-trigger');
        expect(guestBtn).toBeDefined();
        expect(screen.getByText('Connexion')).toBeDefined();

        fireEvent.click(guestBtn);
        expect(onOpenAuthModal).toHaveBeenCalledTimes(1);
    });

    it('affiche l\'avatar, le nom et l\'ELO pour un joueur connecté', () => {
        render(
            <UserAccountMenu
                user={mockUser}
                profile={mockProfile}
                isLoading={false}
                onOpenAuthModal={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        expect(screen.getByText('Mochy Pro')).toBeDefined();
        expect(screen.getByText('1950 ELO')).toBeDefined();
        expect(screen.getByText('MO')).toBeDefined();
    });

    it('ouvre et ferme le menu déroulant avec les options de navigation et la déconnexion', async () => {
        const onSignOut = vi.fn();
        const onNavigate = vi.fn();

        render(
            <UserAccountMenu
                user={mockUser}
                profile={mockProfile}
                isLoading={false}
                onOpenAuthModal={vi.fn()}
                onSignOut={onSignOut}
                onNavigate={onNavigate}
            />,
        );

        // Au départ le menu n'est pas affiché
        expect(screen.queryByTestId('user-dropdown-menu')).toBeNull();

        // Clic sur l'avatar pour ouvrir le menu
        const accountBtn = screen.getByTestId('user-profile-btn');
        fireEvent.click(accountBtn);

        expect(screen.getByTestId('user-dropdown-menu')).toBeDefined();
        expect(screen.getByText('champion@backgammon.com')).toBeDefined();
        expect(screen.getByText('1950 GR')).toBeDefined();

        // Navigation vers statistiques
        const statsItem = screen.getByTestId('user-menu-progression-link');
        fireEvent.click(statsItem);
        expect(onNavigate).toHaveBeenCalledWith('/progression');
        expect(screen.queryByTestId('user-dropdown-menu')).toBeNull();

        // Réouverture et navigation vers tarifs VIP (/pricing)
        fireEvent.click(accountBtn);
        const pricingItem = screen.getByTestId('user-menu-pricing-link');
        fireEvent.click(pricingItem);
        expect(onNavigate).toHaveBeenCalledWith('/pricing');
        expect(screen.queryByTestId('user-dropdown-menu')).toBeNull();

        // Réouverture et test de déconnexion
        fireEvent.click(accountBtn);
        const signoutBtn = screen.getByTestId('auth-logout-btn');
        fireEvent.click(signoutBtn);
        expect(onSignOut).toHaveBeenCalledTimes(1);
    });

    it('se ferme avec la touche Échap', () => {
        render(
            <UserAccountMenu
                user={mockUser}
                profile={mockProfile}
                isLoading={false}
                onOpenAuthModal={vi.fn()}
                onSignOut={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByTestId('user-profile-btn'));
        expect(screen.getByTestId('user-dropdown-menu')).toBeDefined();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByTestId('user-dropdown-menu')).toBeNull();
    });
});
