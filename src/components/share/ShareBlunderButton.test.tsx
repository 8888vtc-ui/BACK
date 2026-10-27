// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createInitialState } from '../../engine/backgammonEngine';
import ShareBlunderButton from './ShareBlunderButton';
import BlunderReviewCard from '../summary/BlunderReviewCard';
import { CoachMoveComparisonCard } from '../coach/CoachMoveComparisonCard';
import type { BlunderQuizCardData } from '../../features/share/blunderShareCard';
import * as pngModule from '../../features/share/renderBlunderQuizPng';

vi.mock('../../features/share/renderBlunderQuizPng', () => ({
    renderBlunderQuizPng: vi.fn(),
    downloadBlunderQuizPng: vi.fn(),
}));

vi.mock('../../lib/subscription/lifecycleEvents', () => ({
    trackSaasLifecycleEvent: vi.fn(),
}));

vi.mock('../toast/ToastContext', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const SAMPLE_DATA: BlunderQuizCardData = {
    board: createInitialState().board,
    dice: [3, 1],
    turn: 'X',
    matchLength: 7,
    scoreX: 2,
    scoreO: 1,
    cubeValue: 1,
    bestMoveNotation: '8/5 6/5',
    playedMoveNotation: '24/21 13/12',
    equityLoss: -0.135,
    keyConcept: 'Contrôle du Golden Point',
    locale: 'fr',
};

describe('ShareBlunderButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('affiche le bouton "Partager ce Quiz (HD)" et la case "Avec solution" en variante full (FR et EN)', () => {
        const htmlFr = renderToStaticMarkup(<ShareBlunderButton data={SAMPLE_DATA} variant="full" />);
        expect(htmlFr).toContain('data-testid="share-blunder-btn"');
        expect(htmlFr).toContain('Partager ce Quiz (HD)');
        expect(htmlFr).toContain('Avec solution');

        const htmlEn = renderToStaticMarkup(
            <ShareBlunderButton data={{ ...SAMPLE_DATA, locale: 'en' }} variant="full" />,
        );
        expect(htmlEn).toContain('Share This Quiz (HD)');
        expect(htmlEn).toContain('With solution');
    });

    it('affiche le bouton compact en variante icon', () => {
        const htmlIcon = renderToStaticMarkup(<ShareBlunderButton data={SAMPLE_DATA} variant="icon" />);
        expect(htmlIcon).toContain('data-testid="share-blunder-btn"');
        expect(htmlIcon).not.toContain('data-testid="include-solution-checkbox"');
    });

    it('génère le PNG 1200x630 et déclenche le téléchargement au clic (avec bascule includeSolution)', async () => {
        const fakeBlob = new Blob(['png-bytes'], { type: 'image/png' });
        vi.mocked(pngModule.renderBlunderQuizPng).mockResolvedValueOnce(fakeBlob);

        render(<ShareBlunderButton data={SAMPLE_DATA} variant="full" />);

        const checkbox = screen.getByTestId('include-solution-checkbox') as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
        fireEvent.click(checkbox);
        expect(checkbox.checked).toBe(true);

        const shareBtn = screen.getByTestId('share-blunder-btn');
        fireEvent.click(shareBtn);

        await waitFor(() => {
            expect(pngModule.renderBlunderQuizPng).toHaveBeenCalledWith(
                expect.objectContaining({
                    bestMoveNotation: '8/5 6/5',
                    includeSolution: true,
                }),
            );
            expect(pngModule.downloadBlunderQuizPng).toHaveBeenCalledWith(
                fakeBlob,
                'backgammon-quiz-31.png',
            );
        });
    });

    it('est branché dans BlunderReviewCard (rapport post-match) et CoachMoveComparisonCard (panneau Coach en direct)', () => {
        const reviewHtml = renderToStaticMarkup(
            <BlunderReviewCard
                blunder={{
                    turnNumber: 4,
                    dice: [3, 1],
                    playedNotation: '24/21 13/12',
                    optimalNotation: '8/5 6/5',
                    equityLoss: 0.135,
                    boardBefore: createInitialState().board,
                    phase: 'contact',
                    diagnostic: 'Vous manquez le Golden Point.',
                    keyConcept: 'Contrôle du Golden Point',
                }}
                idx={0}
                player="X"
                isReplaying={false}
                selectedCandidate={null}
                clickedPoints={[]}
                isVoiceActive={false}
                locale="fr"
                onStartReplay={() => {}}
                onSelectCandidate={() => {}}
                onPointClick={() => {}}
                onSpeak={() => {}}
                onToggleAutoVoice={() => {}}
            />,
        );
        expect(reviewHtml).toContain('data-testid="share-blunder-btn"');
        expect(reviewHtml).toContain('Partager ce Quiz (HD)');

        const coachCardHtml = renderToStaticMarkup(
            <CoachMoveComparisonCard
                verdict="blunder"
                equityLoss={-0.135}
                playedMove="24/21 13/12"
                optimalMove="8/5 6/5"
                board={createInitialState().board}
                dice={[3, 1]}
                locale="fr"
            />,
        );
        expect(coachCardHtml).toContain('data-testid="share-blunder-btn"');
        expect(coachCardHtml).toContain('Partager ce Quiz (HD)');
    });
});
