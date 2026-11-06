// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { resolvePersonaMeta } from '../BoardPortraitAndActionRails';
import { GameScreenTopBar } from '../GameScreenTopBar';

describe('MISSION 11/25 : Strict separation between Matchmaking (Online) and Guided Play (Professor)', () => {
    it('resolvePersonaMeta strictly returns real opponent and never "The Professor" or "TEACHING MENTOR" in online match', () => {
        const challenger = {
            id: 'challenger_123',
            username: 'Taro_Tokyo',
            displayName: 'Taro_Tokyo',
            rating: 1540,
        };

        // When in beginner gate, but with challengerProfile and isOnlineMatch = true
        const metaOnline = resolvePersonaMeta(
            'beginner',
            'fr',
            null,
            null,
            challenger,
            true, // isBeginner
            true, // isOnlineMatch
        );

        expect(metaOnline.opponentDisplayName).toBe('Taro S.');
        expect(metaOnline.opponentBadge).toBe('Adversaire en ligne');
        expect(metaOnline.opponentDisplayName).not.toContain('Professeur');
        expect(metaOnline.opponentBadge).not.toContain('PÉDAGOGIQUE');
        expect(metaOnline.opponentPhotoUrl).not.toContain('einstein');
    });

    it('resolvePersonaMeta in EN strictly returns real opponent and never "The Professor" or "TEACHING MENTOR"', () => {
        const challenger = {
            id: 'challenger_456',
            username: 'Alex_Lon',
            displayName: 'Alex_Lon',
            rating: 1620,
        };

        const metaOnlineEn = resolvePersonaMeta(
            'beginner',
            'en',
            null,
            null,
            challenger,
            true,
            true,
        );

        expect(metaOnlineEn.opponentDisplayName).toBe('Alex C.');
        expect(metaOnlineEn.opponentBadge).toBe('Online Opponent');
        expect(metaOnlineEn.opponentDisplayName).not.toContain('Professor');
        expect(metaOnlineEn.opponentBadge).not.toContain('TEACHING MENTOR');
    });

    it('resolvePersonaMeta strictly returns "Le Professeur" / "TEACHING MENTOR" when NOT online and in guided beginner mode', () => {
        const metaGuided = resolvePersonaMeta(
            'beginner',
            'fr',
            null,
            null,
            null, // no challenger
            true, // isBeginner
            false, // isOnlineMatch
        );

        expect(metaGuided.opponentDisplayName).toBe('Le Professeur');
        expect(metaGuided.opponentBadge).toBe('MENTOR PÉDAGOGIQUE');
        expect(metaGuided.opponentPhotoUrl).toBe('/avatars/einstein-quiz-coach.jpg');
    });

    it('GameScreenTopBar never displays "• Partie Guidée" in online match even if tierGate is BEGINNER', () => {
        const dummyGame: any = {
            state: { matchLength: 5, scoreX: 0, scoreO: 0, cubeValue: 1, turn: 'X', board: new Array(26).fill(0) },
            matchLog: [],
        };
        const dummyMultiplayer: any = { status: 'connected' };
        const dummyModals: any = {};

        render(
            <GameScreenTopBar
                isFullFocusMode={false}
                onToggleFullFocusMode={() => {}}
                t={(k) => k}
                theme="snowie_classic"
                onToggleTheme={() => {}}
                game={dummyGame}
                isMultiplayerActive={true}
                isOnlinePvpMatch={true}
                multiplayer={dummyMultiplayer}
                modals={dummyModals}
                onTriggerCoach={() => {}}
                turnsCount={0}
                prX={null}
                prO={null}
                onBackToLobby={() => {}}
                quotaBadge="5/5"
                isVip={false}
            />
        );

        const versionBadge = screen.getByTestId('app-version-badge');
        expect(versionBadge.textContent).toBe('Mode Débutant');
        expect(versionBadge.textContent).not.toContain('Partie Guidée');
        expect(versionBadge.className).toContain('shrink-0');
        expect(versionBadge.className).toContain('whitespace-nowrap');

        const pointsBadge = screen.getByTestId('navbar-points-badge');
        expect(pointsBadge.className).toContain('shrink-0');
        expect(pointsBadge.className).toContain('whitespace-nowrap');
    });
});
