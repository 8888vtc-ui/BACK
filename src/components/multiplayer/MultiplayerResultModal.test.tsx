import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MultiplayerResultModal from './MultiplayerResultModal';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    EloCalculationResult,
} from '../../features/multiplayer/types';

describe('MultiplayerResultModal', () => {
    const localProfile: PlayerEloProfile = {
        id: 'usr_local',
        username: 'alice',
        displayName: 'Alice',
        rating: 1500,
    };

    const opponentProfile: PlayerEloProfile = {
        id: 'usr_remote',
        username: 'bob',
        displayName: 'Bob',
        rating: 1500,
    };

    const matchInfo: MultiplayerMatchInfo = {
        roomId: 'match_123',
        playerX: localProfile,
        playerO: opponentProfile,
        matchLength: 7,
        startedAt: new Date().toISOString(),
        localRole: 'X',
    };

    it('ne rend rien si isOpen est faux', () => {
        const eloResult: EloCalculationResult = {
            playerXNewRating: 1516,
            playerONewRating: 1484,
            deltaX: 16,
            deltaO: -16,
            expectedScoreX: 0.5,
            expectedScoreO: 0.5,
        };

        const html = renderToStaticMarkup(
            <MultiplayerResultModal
                isOpen={false}
                matchInfo={matchInfo}
                localProfile={localProfile}
                opponentProfile={opponentProfile}
                eloResult={eloResult}
                onRematch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toBe('');
    });

    it('affiche la victoire avec le gain d’Elo en vert (+16)', () => {
        const eloResult: EloCalculationResult = {
            playerXNewRating: 1516,
            playerONewRating: 1484,
            deltaX: 16,
            deltaO: -16,
            expectedScoreX: 0.5,
            expectedScoreO: 0.5,
        };

        const html = renderToStaticMarkup(
            <MultiplayerResultModal
                isOpen={true}
                matchInfo={matchInfo}
                localProfile={localProfile}
                opponentProfile={opponentProfile}
                eloResult={eloResult}
                onRematch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toContain('VICTOIRE !');
        expect(html).toContain('+16 Elo');
        expect(html).toContain('1500');
        expect(html).toContain('1516');
        expect(html).toContain('Compétiteur');
    });

    it('affiche la défaite avec la perte d’Elo (-16)', () => {
        const eloResult: EloCalculationResult = {
            playerXNewRating: 1484,
            playerONewRating: 1516,
            deltaX: -16,
            deltaO: 16,
            expectedScoreX: 0.5,
            expectedScoreO: 0.5,
        };

        const html = renderToStaticMarkup(
            <MultiplayerResultModal
                isOpen={true}
                matchInfo={matchInfo}
                localProfile={localProfile}
                opponentProfile={opponentProfile}
                eloResult={eloResult}
                onRematch={vi.fn()}
                onClose={vi.fn()}
            />,
        );

        expect(html).toContain('DÉFAITE');
        expect(html).toContain('-16 Elo');
    });
});
