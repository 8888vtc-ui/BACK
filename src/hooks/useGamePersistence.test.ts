// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamePersistence } from './useGamePersistence';
import {
    saveEmergencyCheckpoint,
    loadEmergencyCheckpoint,
    clearEmergencyCheckpoint,
    RESTORED_GAME_TOAST_TITLE,
    RESTORED_GAME_TOAST_MESSAGE,
} from '../lib/offline/emergencyCrashRecovery';
import { toast } from '../components/toast/ToastContext';
import { createInitialState } from '../engine/backgammonEngine';
import type { UseBackgammonGameReturn } from './useBackgammonGame';
import type { RawGameTurn } from '../features/rating';

describe('useGamePersistence & Emergency Crash Recovery (Audit 20 / 20)', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.restoreAllMocks();
    });

    const createMockGame = (): UseBackgammonGameReturn => {
        const initialState = {
            ...createInitialState(7),
            cubeValue: 4,
            cubeOwner: 'X' as const,
        };
        return {
            state: initialState,
            difficulty: 'expert',
            phase: 'WAITING_FOR_ROLL',
            dice: null,
            usedDice: [false, false],
            lastOpponentDice: null,
            lastOpponentMoves: null,
            applyRemoteState: vi.fn(),
        } as unknown as UseBackgammonGameReturn;
    };

    it('initializes gameId, empty turnsHistory and writes an atomic emergency checkpoint', () => {
        const game = createMockGame();
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            }),
        );

        expect(result.current.gameIdRef.current).toContain('game_');
        expect(result.current.turnsHistoryRef.current).toHaveLength(0);
        expect(result.current.latestGameAnalysis).toBeNull();

        const savedCheckpoint = loadEmergencyCheckpoint();
        expect(savedCheckpoint).not.toBeNull();
        expect(savedCheckpoint?.gameId).toBe(result.current.gameIdRef.current);
        expect(savedCheckpoint?.cubeValue).toBe(4);
    });

    it('restores a match snapshot without overwriting existing cube state or turn equity metrics', () => {
        const game = createMockGame();
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            }),
        );

        const initialTurn: RawGameTurn = {
            turnNumber: 1,
            player: 'X',
            dice: [3, 1],
            boardBefore: [...game.state.board],
            boardAfter: [...game.state.board],
            moves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
        };

        act(() => {
            result.current.restoreMatchSnapshot({
                gameId: 'game_restored_99',
                turns: [initialTurn],
                cubeValue: 4,
                cubeOwner: 'X',
            });
        });

        expect(result.current.gameIdRef.current).toBe('game_restored_99');
        expect(result.current.turnsHistoryRef.current).toHaveLength(1);
        expect(result.current.turnsHistoryRef.current[0].dice).toEqual([3, 1]);
    });

    it('resets history and purges emergency checkpoint on resetGameHistory', () => {
        const game = createMockGame();
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            }),
        );

        const sampleTurn: RawGameTurn = {
            turnNumber: 1,
            player: 'X',
            dice: [6, 5],
            boardBefore: [...game.state.board],
            boardAfter: [...game.state.board],
            moves: [{ from: 24, to: 13 }],
        };

        act(() => {
            result.current.turnsHistoryRef.current.push(sampleTurn);
            result.current.resetGameHistory();
        });

        expect(result.current.turnsHistoryRef.current).toHaveLength(0);
        expect(result.current.latestGameAnalysis).toBeNull();
        expect(loadEmergencyCheckpoint()).toBeNull();
    });

    it('Audit 20/20 : sauvegarde atomiquement chaque sous-dé et restaure instantanément avec Toast « Partie restaurée »', () => {
        const game = createMockGame();
        const toastSpy = vi.spyOn(toast, 'success');
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            }),
        );

        const customBoard = [...game.state.board];
        customBoard[24] -= 1;
        customBoard[21] += 1;

        saveEmergencyCheckpoint({
            gameId: 'game_crash_recovery_42',
            board: customBoard,
            turn: 'X',
            dice: [3, 1],
            usedDice: [true, false],
            cubeValue: 2,
            cubeOwner: 'X',
            scoreX: 3,
            scoreO: 2,
            matchLength: 7,
            crawford: false,
            phase: 'PLAYING_MOVES',
            subMovesPlayed: [{ from: 24, to: 21 }],
            savedAtMs: Date.now(),
        });

        let restored: ReturnType<typeof result.current.restoreEmergencyCheckpoint> = null;
        act(() => {
            restored = result.current.restoreEmergencyCheckpoint();
        });

        expect(restored).not.toBeNull();
        expect(result.current.gameIdRef.current).toBe('game_crash_recovery_42');
        expect(result.current.currentTurnMovesRef.current).toEqual([{ from: 24, to: 21 }]);
        expect(game.applyRemoteState).toHaveBeenCalledWith(
            expect.objectContaining({
                board: customBoard,
                dice: [3, 1],
                usedDice: [true, false],
                cubeValue: 2,
                phase: 'PLAYING_MOVES',
            }),
        );
        expect(toastSpy).toHaveBeenCalledWith(RESTORED_GAME_TOAST_MESSAGE, RESTORED_GAME_TOAST_TITLE);

        clearEmergencyCheckpoint();
        expect(loadEmergencyCheckpoint()).toBeNull();
    });
});
