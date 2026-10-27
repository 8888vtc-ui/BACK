import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameModalsContainer, { type GameModalsContainerProps } from './GameModalsContainer';
import { createInitialState } from '../../engine/backgammonEngine';

function buildDummyProps(): GameModalsContainerProps {
    const dummyGame = {
        state: createInitialState(7),
        phase: 'WAITING_FOR_ROLL',
        gameResult: null,
        isMatchOver: false,
        applyRemoteState: vi.fn(),
        startNewGame: vi.fn(),
        resetMatch: vi.fn(),
    } as unknown as GameModalsContainerProps['game'];

    const dummyModals = {
        isMatchmakingModalOpen: false,
        closeMatchmaking: vi.fn(),
        isGameReviewModalOpen: false,
        openGameReview: vi.fn(),
        closeGameReview: vi.fn(),
        openGameCourse: vi.fn(),
        openDiceAudit: vi.fn(),
        isOpeningBookModalOpen: false,
        closeOpeningBook: vi.fn(),
        selectedOpeningIdForModal: undefined,
        isExportImportModalOpen: false,
        openExportImport: vi.fn(),
        closeExportImport: vi.fn(),
        isKnowledgeModalOpen: false,
        closeKnowledgeBase: vi.fn(),
        selectedKnowledgeConceptId: undefined,
        isDiceAuditModalOpen: false,
        closeDiceAudit: vi.fn(),
        isSubscriptionModalOpen: false,
        closeSubscriptionModal: vi.fn(),
    } as unknown as GameModalsContainerProps['modals'];

    const dummyMultiplayer = {
        status: 'idle',
        localProfile: { rating: 1500, displayName: 'Moi' },
        opponentProfile: null,
        matchInfo: null,
        privateRoomCode: null,
        startMatchmaking: vi.fn(),
        createPrivateRoom: vi.fn(),
        joinPrivateRoom: vi.fn(),
        cancelMatchmaking: vi.fn(),
    } as unknown as GameModalsContainerProps['multiplayer'];

    return {
        theme: 'midnight',
        modals: dummyModals,
        game: dummyGame,
        multiplayer: dummyMultiplayer,
        isMultiplayerActive: false,
        latestGameAnalysis: null,
        turnsHistory: [],
        openingEntry: null,
        onResetGameHistory: vi.fn(),
        locale: 'en',
    };
}

describe('GameModalsContainer Component', () => {
    it('rend correctement les modales selon les props', () => {
        const html = renderToStaticMarkup(<GameModalsContainer {...buildDummyProps()} />);
        expect(html).toBeDefined();
    });

    it('transmet botPr et botCategory à PostMatchTrainingReport en fin de manche', () => {
        const props = buildDummyProps();
        props.game = {
            ...props.game,
            phase: 'GAME_OVER',
            gameResult: { winner: 'X', loser: 'O', winType: 'single', multiplier: 1, pointsWon: 1 },
        };
        const html = renderToStaticMarkup(<GameModalsContainer {...props} />);
        expect(html).toContain('data-testid="post-match-training-report"');
        expect(html).toContain('8.20');
        expect(html).toContain('Intermediate');
    });
});
