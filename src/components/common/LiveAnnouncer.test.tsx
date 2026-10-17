// @vitest-environment jsdom

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import {
    AnnouncerProvider,
    useAnnouncer,
    useGameAnnouncements,
} from './LiveAnnouncer';
import { BoardState } from '../../engine/backgammonEngine';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

function createBoardState(overrides: Partial<BoardState> = {}): BoardState {
    const board = new Array<number>(26).fill(0);
    return {
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: [5, 2],
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
        ...overrides,
    };
}

function TestConsumer({
    state,
    phase,
    selectedPoint,
    canDouble,
    doublingOfferedBy,
    opponentStatusMessage,
}: {
    state: BoardState;
    phase: string;
    selectedPoint: number | null;
    canDouble: boolean;
    doublingOfferedBy: 'X' | 'O' | null;
    opponentStatusMessage?: string | null;
}) {
    useGameAnnouncements({
        state,
        phase,
        selectedPoint,
        activeDie: 0,
        leftTargetsCount: 2,
        rightTargetsCount: 1,
        canDouble,
        doublingOfferedBy,
        opponentStatusMessage,
    });

    const { announce } = useAnnouncer();

    return (
        <div>
            <button type="button" onClick={() => announce('Message personnalisé test', 'polite')}>
                Annoncer
            </button>
        </div>
    );
}

describe('LiveAnnouncer - Compatibilité Lecteur d Écran (WCAG 2.1 AA)', () => {
    it('met à jour la région aria-live lors d un appel à announce()', () => {
        vi.useFakeTimers();

        render(
            <AnnouncerProvider>
                <TestConsumer
                    state={createBoardState()}
                    phase="WAITING_FOR_ROLL"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        const liveRegion = screen.getByTestId('live-announcer');
        expect(liveRegion.getAttribute('role')).toBe('status');
        expect(liveRegion.getAttribute('aria-live')).toBe('polite');

        const button = screen.getByRole('button', { name: 'Annoncer' });
        button.click();

        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(liveRegion.textContent).toContain('Message personnalisé test');
    });

    it('annonce le lancer de dés et les doubles via useGameAnnouncements', () => {
        vi.useFakeTimers();

        const stateInitial = createBoardState({ dice: null });
        const { rerender } = render(
            <AnnouncerProvider>
                <TestConsumer
                    state={stateInitial}
                    phase="WAITING_FOR_ROLL"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        // Lancer les dés : double 4
        const stateDoubles = createBoardState({ dice: [4, 4], turn: 'X' });
        rerender(
            <AnnouncerProvider>
                <TestConsumer
                    state={stateDoubles}
                    phase="PLAYING_MOVES"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        const liveRegion = screen.getByTestId('live-announcer');
        expect(liveRegion.textContent).toContain('Double lancé : 4 fois 4');
        expect(liveRegion.textContent).toContain('Joueur X (Blanc)');
    });

    it('annonce la sélection de pion et le nombre de coups disponibles', () => {
        vi.useFakeTimers();

        const state = createBoardState({ turn: 'X' });
        const { rerender } = render(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="PLAYING_MOVES"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        rerender(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="PLAYING_MOVES"
                    selectedPoint={24}
                    canDouble={false}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        const liveRegion = screen.getByTestId('live-announcer');
        expect(liveRegion.textContent).toContain('Flèche 24 sélectionnée');
        expect(liveRegion.textContent).toContain('3 destinations légales disponibles');
    });

    it('annonce une proposition de videau', () => {
        vi.useFakeTimers();

        const state = createBoardState({ cubeValue: 1, turn: 'X' });
        const { rerender } = render(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="WAITING_FOR_ROLL"
                    selectedPoint={null}
                    canDouble={true}
                    doublingOfferedBy={null}
                />
            </AnnouncerProvider>,
        );

        rerender(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="DOUBLING_OFFERED"
                    selectedPoint={null}
                    canDouble={true}
                    doublingOfferedBy="X"
                />
            </AnnouncerProvider>,
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        const liveRegion = screen.getByTestId('live-announcer');
        expect(liveRegion.textContent).toContain('Proposition de videau !');
        expect(liveRegion.textContent).toContain('doubler la valeur à 2');
    });

    it('annonce les coups et actions de l’IA (Opponent) en direct via aria-live', () => {
        vi.useFakeTimers();

        const state = createBoardState({ turn: 'O' });
        const { rerender } = render(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="WAITING_FOR_ROLL"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                    opponentStatusMessage={null}
                />
            </AnnouncerProvider>,
        );

        // L'IA applique un coup
        rerender(
            <AnnouncerProvider>
                <TestConsumer
                    state={state}
                    phase="WAITING_FOR_ROLL"
                    selectedPoint={null}
                    canDouble={false}
                    doublingOfferedBy={null}
                    opponentStatusMessage="Coup 1/2 : Noir déplace 24 → 20"
                />
            </AnnouncerProvider>,
        );

        act(() => {
            vi.advanceTimersByTime(100);
        });

        const liveRegion = screen.getByTestId('live-announcer');
        expect(liveRegion.textContent).toBe('Coup 1/2 : Noir déplace 24 → 20');
    });
});

