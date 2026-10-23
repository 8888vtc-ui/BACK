// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckerSoundFeedback } from './useCheckerSoundFeedback';
import * as haptics from '../lib/capacitor/haptics';
import * as soundManagerModule from './useSoundManager';
import { X_OFF } from '../engine/backgammonEngine';

describe('useCheckerSoundFeedback hook', () => {
    const playMoveMock = vi.fn();
    const playHitMock = vi.fn();

    beforeEach(() => {
        vi.restoreAllMocks();
        playMoveMock.mockReset();
        playHitMock.mockReset();
        vi.spyOn(soundManagerModule, 'useSoundManager').mockReturnValue({
            isMuted: false,
            toggleMute: vi.fn(),
            isVoiceEnabled: false,
            toggleVoice: vi.fn(),
            speakCoachAlert: vi.fn(),
            stopSpeaking: vi.fn(),
            playDice: vi.fn(),
            playMove: playMoveMock,
            playHit: playHitMock,
            playCube: vi.fn(),
            playCubeOffer: vi.fn(),
            playVictory: vi.fn(),
            playBlunder: vi.fn(),
        });
    });

    it('déclenche playHit() et impactHeavy() lors de la prise d’un blot adverse', () => {
        const heavySpy = vi.spyOn(haptics, 'impactHeavy').mockResolvedValue();
        const mediumSpy = vi.spyOn(haptics, 'impactMedium').mockResolvedValue();
        const lightSpy = vi.spyOn(haptics, 'impactLight').mockResolvedValue();
        const onPlayMove = vi.fn();

        const board = Array(26).fill(0);
        board[5] = -1; // Blot adverse (O) sur la flèche 5

        const { result } = renderHook(() =>
            useCheckerSoundFeedback({
                board,
                turn: 'X',
                onPlayMove,
            }),
        );

        act(() => {
            result.current(8, 5, 0);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, 5, 0);
        expect(playHitMock).toHaveBeenCalledTimes(1);
        expect(heavySpy).toHaveBeenCalledTimes(1);
        expect(mediumSpy).not.toHaveBeenCalled();
        expect(lightSpy).not.toHaveBeenCalled();
    });

    it('déclenche playMove() et impactMedium() lors d’une sortie de pion (bearoff)', () => {
        const heavySpy = vi.spyOn(haptics, 'impactHeavy').mockResolvedValue();
        const mediumSpy = vi.spyOn(haptics, 'impactMedium').mockResolvedValue();
        const lightSpy = vi.spyOn(haptics, 'impactLight').mockResolvedValue();
        const onPlayMove = vi.fn();

        const board = Array(26).fill(0);
        board[4] = 2;

        const { result } = renderHook(() =>
            useCheckerSoundFeedback({
                board,
                turn: 'X',
                onPlayMove,
            }),
        );

        act(() => {
            result.current(4, X_OFF, 0);
        });

        expect(onPlayMove).toHaveBeenCalledWith(4, X_OFF, 0);
        expect(playMoveMock).toHaveBeenCalledTimes(1);
        expect(mediumSpy).toHaveBeenCalledTimes(1);
        expect(heavySpy).not.toHaveBeenCalled();
        expect(lightSpy).not.toHaveBeenCalled();
    });

    it('déclenche playMove() et impactLight() lors d’un déplacement normal sans frappe', () => {
        const heavySpy = vi.spyOn(haptics, 'impactHeavy').mockResolvedValue();
        const mediumSpy = vi.spyOn(haptics, 'impactMedium').mockResolvedValue();
        const lightSpy = vi.spyOn(haptics, 'impactLight').mockResolvedValue();
        const onPlayMove = vi.fn();

        const board = Array(26).fill(0);

        const { result } = renderHook(() =>
            useCheckerSoundFeedback({
                board,
                turn: 'X',
                onPlayMove,
            }),
        );

        act(() => {
            result.current(13, 9, 0);
        });

        expect(onPlayMove).toHaveBeenCalledWith(13, 9, 0);
        expect(playMoveMock).toHaveBeenCalledTimes(1);
        expect(lightSpy).toHaveBeenCalledTimes(1);
        expect(heavySpy).not.toHaveBeenCalled();
        expect(mediumSpy).not.toHaveBeenCalled();
    });
});
