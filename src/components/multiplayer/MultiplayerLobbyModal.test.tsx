import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MultiplayerLobbyModal from './MultiplayerLobbyModal';
import type { PlayerEloProfile } from '../../features/multiplayer/types';

describe('MultiplayerLobbyModal', () => {
    const localProfile: PlayerEloProfile = {
        id: 'usr_test_1',
        username: 'alice',
        displayName: 'Alice Championne',
        rating: 1680,
    };

    const opponentProfile: PlayerEloProfile = {
        id: 'usr_test_2',
        username: 'bob',
        displayName: 'Bob Le Grand',
        rating: 1720,
    };

    const defaultProps = {
        isOpen: true,
        status: 'idle' as const,
        localProfile,
        opponentProfile: null,
        matchInfo: null,
        privateRoomCode: null,
        onStartSearch: vi.fn(),
        onCreatePrivateRoom: vi.fn().mockResolvedValue('BG-1234'),
        onJoinPrivateRoom: vi.fn().mockResolvedValue(undefined),
        onCancelSearch: vi.fn(),
        onClose: vi.fn(),
    };

    it('ne rend rien si isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                isOpen={false}
            />,
        );

        expect(html).toBe('');
    });

    it('affiche l’en-tête avec profil local, badge de rang et les 3 onglets du lobby', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
            />,
        );

        expect(html).toContain('Alice Championne');
        expect(html).toContain('1680 Elo');
        // Les 3 onglets du lobby
        expect(html).toContain('Matchmaking Classé');
        expect(html).toContain('Salon Privé');
        expect(html).toContain('Classement');
    });

    it('affiche les sélecteurs de points (1, 3, 5, 7 pts) et le bouton de recherche', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
            />,
        );

        expect(html).toContain('1 pt');
        expect(html).toContain('3 pts');
        expect(html).toContain('5 pts');
        expect(html).toContain('7 pts');
        expect(html).toContain('Lancer la recherche');
    });

    it('affiche le radar de recherche et le bouton d’annulation en statut searching', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                status="searching"
            />,
        );

        expect(html).toContain('matchmaking-searching');
        expect(html).toContain('Annuler la recherche');
        expect(html).toContain('Tolérance stricte');
    });

    it('affiche la carte d’affrontement Versus lors du match trouvé', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                status="matched"
                opponentProfile={opponentProfile}
                matchInfo={{
                    roomId: 'room_123',
                    matchLength: 7,
                    startedAt: new Date().toISOString(),
                    localRole: 'X',
                    playerX: defaultProps.localProfile,
                    playerO: opponentProfile,
                }}
            />,
        );

        expect(html).toContain('lobby-matched-view');
        expect(html).toContain('Adversaire trouvé !');
        expect(html).toContain('Alice Championne (Vous)');
        expect(html).toContain('Bob Le Grand');
        expect(html).toContain('1680 Elo');
        expect(html).toContain('1720 Elo');
    });

    it('passe les props pour salon privé sans erreur de rendu', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                privateRoomCode="BG-4892"
            />,
        );

        expect(html).toContain('data-testid="multiplayer-lobby-modal"');
    });
});
