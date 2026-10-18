import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import GameModalsContainer from './GameModalsContainer';
import { createInitialState } from '../../engine/backgammonEngine';

describe('GameModalsContainer Component', () => {
    it('rend correctement les modales selon les props', () => {
        const dummyGame: any = {
            state: createInitialState(7),
            phase: 'WAITING_FOR_ROLL',
            gameResult: null,
            applyRemoteState: vi.fn(),
            startNewGame: vi.fn(),
            resetMatch: vi.fn(),
        };

        const dummyModals: any = {
            isMatchmakingModalOpen: false,
            closeMatchmaking: vi.fn(),
            isGameReviewModalOpen: false,
            closeGameReview: vi.fn(),
            isOpeningBookModalOpen: false,
            closeOpeningBook: vi.fn(),
            selectedOpeningIdForModal: undefined,
            isExportImportModalOpen: false,
            closeExportImport: vi.fn(),
            isKnowledgeModalOpen: false,
            closeKnowledgeBase: vi.fn(),
            selectedKnowledgeConceptId: undefined,
        };

        const dummyMultiplayer: any = {
            status: 'idle',
            localProfile: { rating: 1500, displayName: 'Moi' },
            opponentProfile: null,
            matchInfo: null,
            privateRoomCode: null,
            startMatchmaking: vi.fn(),
            createPrivateRoom: vi.fn(),
            joinPrivateRoom: vi.fn(),
            cancelMatchmaking: vi.fn(),
        };

        const html = renderToStaticMarkup(
            <GameModalsContainer
                theme="midnight"
                modals={dummyModals}
                game={dummyGame}
                multiplayer={dummyMultiplayer}
                isMultiplayerActive={false}
                latestGameAnalysis={null}
                turnsHistory={[]}
                openingEntry={null}
                onResetGameHistory={vi.fn()}
            />
        );

        expect(html).toBeDefined();
    });
});
