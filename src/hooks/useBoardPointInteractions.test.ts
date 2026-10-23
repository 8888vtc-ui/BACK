// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBoardPointInteractions, findBestBearOffSource } from './useBoardPointInteractions';
import { X_BAR, O_BAR, X_OFF } from '../engine/backgammonEngine';

describe('findBestBearOffSource', () => {
    it('priorise la correspondance exacte (distance === dieValue) avant le pion le plus éloigné', () => {
        const targets = new Map<number, number[]>([
            [5, [X_OFF]],
            [3, [X_OFF]],
            [1, [X_OFF]],
        ]);
        expect(findBestBearOffSource(targets, X_OFF, 3, true)).toBe(3);
    });

    it('choisit le pion le plus éloigné de la sortie lors d’un sur-lancer (over-roll)', () => {
        const targets = new Map<number, number[]>([
            [2, [X_OFF]],
            [4, [X_OFF]],
            [1, [X_OFF]],
        ]);
        expect(findBestBearOffSource(targets, X_OFF, 6, true)).toBe(4);
    });
});

describe('useBoardPointInteractions hook', () => {
    it('rend handleOffClick 100 % déterministe : choisit l’exact match sur le second dé avant le sur-lancer du premier dé', () => {
        const board = Array(26).fill(0);
        board[4] = 1;
        board[3] = 1;

        const leftDieTargets = new Map<number, number[]>([[4, [X_OFF]]]); // dé 0 = 6 (sur-lancer depuis 4)
        const rightDieTargets = new Map<number, number[]>([[3, [X_OFF]]]); // dé 1 = 3 (exact match depuis 3)
        const onPlayMove = vi.fn();

        const { result } = renderHook(() =>
            useBoardPointInteractions({
                board,
                isX: true,
                bar: { X: 0, O: 0 },
                xBarPoint: X_BAR,
                oBarPoint: O_BAR,
                ghostDestinations: new Set(),
                leftDieTargets,
                rightDieTargets,
                dice: [6, 3],
                selectedDie: 0,
                onCheckerClick: vi.fn(),
                onCheckerRightClick: vi.fn(),
                onDestinationClick: vi.fn(),
                onPlayMove,
                onDeselect: vi.fn(),
            }),
        );

        act(() => {
            result.current.handleOffClick(X_OFF);
        });

        expect(onPlayMove).toHaveBeenCalledWith(3, X_OFF, 1);
    });

    it('choisit le pion le plus éloigné sur handleOffClick quand aucun dé n’a de correspondance exacte', () => {
        const board = Array(26).fill(0);
        board[4] = 1;
        board[2] = 1;

        const leftDieTargets = new Map<number, number[]>([
            [2, [X_OFF]],
            [4, [X_OFF]],
        ]);
        const rightDieTargets = new Map<number, number[]>();
        const onPlayMove = vi.fn();

        const { result } = renderHook(() =>
            useBoardPointInteractions({
                board,
                isX: true,
                bar: { X: 0, O: 0 },
                xBarPoint: X_BAR,
                oBarPoint: O_BAR,
                ghostDestinations: new Set(),
                leftDieTargets,
                rightDieTargets,
                dice: [6, 5],
                selectedDie: 0,
                onCheckerClick: vi.fn(),
                onCheckerRightClick: vi.fn(),
                onDestinationClick: vi.fn(),
                onPlayMove,
                onDeselect: vi.fn(),
            }),
        );

        act(() => {
            result.current.handleOffClick(X_OFF);
        });

        expect(onPlayMove).toHaveBeenCalledWith(4, X_OFF, 0);
    });

    it('supporte le clic droit sur la barre (handleBarRightClick) pour rentrer directement avec le second dé', () => {
        const board = Array(26).fill(0);
        board[X_BAR] = 1;

        const leftDieTargets = new Map<number, number[]>([[X_BAR, [22]]]);
        const rightDieTargets = new Map<number, number[]>([[X_BAR, [20]]]);
        const onPlayMove = vi.fn();
        const onCheckerRightClick = vi.fn();

        const { result } = renderHook(() =>
            useBoardPointInteractions({
                board,
                isX: true,
                bar: { X: 1, O: 0 },
                xBarPoint: X_BAR,
                oBarPoint: O_BAR,
                ghostDestinations: new Set(),
                leftDieTargets,
                rightDieTargets,
                dice: [3, 5],
                selectedDie: 0,
                onCheckerClick: vi.fn(),
                onCheckerRightClick,
                onDestinationClick: vi.fn(),
                onPlayMove,
                onDeselect: vi.fn(),
            }),
        );

        act(() => {
            result.current.handleBarRightClick(X_BAR);
        });

        expect(onPlayMove).toHaveBeenCalledWith(X_BAR, 20, 1);
        expect(onCheckerRightClick).not.toHaveBeenCalled();
    });
});
