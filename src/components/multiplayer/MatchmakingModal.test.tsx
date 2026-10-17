import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MatchmakingModal from './MatchmakingModal';
import type { PlayerEloProfile } from '../../features/multiplayer/types';

describe('MatchmakingModal', () => {
    const localProfile: PlayerEloProfile = {
        id: 'usr_test_1',
        username: 'alice',
        displayName: 'Alice Championne',
        rating: 1540,
    };

    it('ne rend rien si isOpen est faux', () => {
        const html = renderToStaticMarkup(
            <MatchmakingModal
                isOpen={false}
                status="idle"
                localProfile={localProfile}
                opponentProfile={null}
                matchInfo={null}
                onStartSearch={vi.fn()}
                onCancelSearch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toBe('');
    });

    it('affiche le profil local et les options de format quand status est idle', () => {
        const html = renderToStaticMarkup(
            <MatchmakingModal
                isOpen={true}
                status="idle"
                localProfile={localProfile}
                opponentProfile={null}
                matchInfo={null}
                onStartSearch={vi.fn()}
                onCancelSearch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toContain('Alice Championne');
        expect(html).toContain('1540 Elo');
        expect(html).toContain('Matchmaking Multijoueur Elo');
        expect(html).toContain('Lancer la recherche');
    });

    it('affiche l’état de recherche avec radar et bouton annuler quand status est searching', () => {
        const html = renderToStaticMarkup(
            <MatchmakingModal
                isOpen={true}
                status="searching"
                localProfile={localProfile}
                opponentProfile={null}
                matchInfo={null}
                onStartSearch={vi.fn()}
                onCancelSearch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toContain('Recherche d&#x27;un adversaire...');
        expect(html).toContain('Annuler la recherche');
    });

    it('affiche la confrontation des deux adversaires quand status est matched', () => {
        const opponent: PlayerEloProfile = {
            id: 'usr_opp_2',
            username: 'bob',
            displayName: 'Bob Le Terrible',
            rating: 1510,
        };

        const matchInfo = {
            roomId: 'room_123',
            playerX: localProfile,
            playerO: opponent,
            matchLength: 7,
            startedAt: new Date().toISOString(),
            localRole: 'X' as const,
        };

        const html = renderToStaticMarkup(
            <MatchmakingModal
                isOpen={true}
                status="matched"
                localProfile={localProfile}
                opponentProfile={opponent}
                matchInfo={matchInfo}
                onStartSearch={vi.fn()}
                onCancelSearch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toContain('Adversaire trouvé !');
        expect(html).toContain('Bob Le Terrible');
        expect(html).toContain('1510 Elo');
    });
});
