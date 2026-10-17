import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MultiplayerBanner from './MultiplayerBanner';
import type { PlayerEloProfile, MultiplayerMatchInfo } from '../../features/multiplayer/types';

describe('MultiplayerBanner', () => {
    const localProfile: PlayerEloProfile = {
        id: 'user_x',
        username: 'alice',
        displayName: 'Alice',
        rating: 1540,
    };

    const opponentProfile: PlayerEloProfile = {
        id: 'user_o',
        username: 'bob',
        displayName: 'Bob',
        rating: 1510,
    };

    const matchInfo: MultiplayerMatchInfo = {
        roomId: 'room_abc',
        playerX: localProfile,
        playerO: opponentProfile,
        matchLength: 7,
        startedAt: new Date().toISOString(),
        localRole: 'X',
    };

    it('affiche les deux joueurs avec leurs classements Elo respectifs', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="connected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="X"
                turnTimeRemaining={35}
                disconnectCountdown={null}
                quickChatMessage={null}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('Alice (Vous)');
        expect(html).toContain('1540 Elo');
        expect(html).toContain('Bob');
        expect(html).toContain('1510 Elo');
    });

    it('indique clairement quand c’est le tour du joueur local', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="connected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="X"
                turnTimeRemaining={28}
                disconnectCountdown={null}
                quickChatMessage={null}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('À VOUS DE JOUER');
        expect(html).toContain('28s');
    });

    it('affiche le message d’alerte avec compte à rebours si l’adversaire est déconnecté', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="opponent_disconnected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="O"
                turnTimeRemaining={40}
                disconnectCountdown={38}
                quickChatMessage={null}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('Adversaire temporairement déconnecté');
        expect(html).toContain('Forfait dans 38s');
    });

    it('affiche un message de quick chat quand présent', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="connected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="X"
                turnTimeRemaining={42}
                disconnectCountdown={null}
                quickChatMessage={{ player: 'O', messageId: 'nice_move' }}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('Bob : 🎯 Joli coup !');
    });

    it('affiche les pendules doubles de tournoi pour les deux joueurs quand clockState est fourni', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="connected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="X"
                turnTimeRemaining={35}
                disconnectCountdown={null}
                quickChatMessage={null}
                clockState={{
                    timeControlType: 'delay',
                    bankXMs: 540000, // 09:00
                    bankOMs: 600000, // 10:00
                    delayRemainingMs: 8000,
                    activePlayer: 'X',
                    turnStartedAt: Date.now(),
                    isFlagFallen: false,
                    flagFallenPlayer: null,
                    isPaused: false,
                }}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('data-testid="local-clock"');
        expect(html).toContain('09:00');
        expect(html).toContain('data-testid="opponent-clock"');
        expect(html).toContain('10:00');
    });

    it('affiche la bannière de reconnexion lors d’une coupure réseau détectée', () => {
        const html = renderToStaticMarkup(
            <MultiplayerBanner
                status="connected"
                matchInfo={matchInfo}
                opponentProfile={opponentProfile}
                localProfile={localProfile}
                turn="X"
                turnTimeRemaining={35}
                disconnectCountdown={null}
                quickChatMessage={null}
                isReconnecting={true}
                onSendQuickChat={vi.fn()}
                onResign={vi.fn()}
            />,
        );

        expect(html).toContain('data-testid="reconnecting-warning"');
        expect(html).toContain('Coupure réseau détectée... Tentative de reconnexion automatique');
    });
});
