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

    it('clarifie les 2 actions principales ("Matchmaking Rapide" vs "Salon Privé par Code"), sans onglet Classement ni texte < 10px', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
            />,
        );

        expect(html).toContain('Alice Championne');
        expect(html).toContain('1680 Elo');
        expect(html).toContain('Matchmaking Rapide');
        expect(html).toContain('Salon Privé par Code');
        expect(html).toContain('Créer un Salon');
        expect(html).toContain('Rejoindre par Code');
        expect(html).not.toContain('Classement');
        expect(html).not.toContain('text-[8px]');
        expect(html).not.toContain('text-[9px]');
        expect(html).not.toContain('text-[10px]');
        expect(html).toContain('border-white/10');
    });

    it('affiche les sélecteurs de points (1, 3, 5, 7 pts) et les boutons des 2 actions', () => {
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
        expect(html).toContain('Générer un code');
    });

    it('affiche le radar de recherche et le bouton d’annulation en statut searching (Matchmaking Rapide)', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                status="searching"
            />,
        );

        expect(html).toContain('data-testid="matchmaking-searching"');
        expect(html).toContain('Annuler la recherche');
        expect(html).toContain('Tolérance stricte');
        expect(html).toContain('data-testid="waiting-live-tournament-card"');
        expect(html).toContain('Prochain Tournoi Live');
        expect(html).toContain('data-testid="waiting-einstein-quiz-banner"');
        expect(html).toContain('Faites des Quizz pour améliorer votre PR !');
    });

    it('affiche le code du salon privé créé lorsqu’un code est actif', () => {
        const html = renderToStaticMarkup(
            <MultiplayerLobbyModal
                {...defaultProps}
                privateRoomCode="BG-4892"
            />,
        );

        expect(html).toContain('data-testid="multiplayer-lobby-modal"');
        expect(html).toContain('BG-4892');
        expect(html).toContain('Votre Salon Privé est ouvert');
    });

    it('affiche la carte d’affrontement Versus lors de la connexion du partenaire', () => {
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
        expect(html).not.toContain('text-[10px]');
    });
});
