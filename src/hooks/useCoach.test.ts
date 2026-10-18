// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCoach } from './useCoach';
import { createInitialState } from '../engine/backgammonEngine';

describe('useCoach hook', () => {
    it('initialise matchStatsX et matchStatsO avec PR à 0', () => {
        const game = {
            state: createInitialState(7),
            dice: [3, 1] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert',
            lastOpponentDice: null,
            lastOpponentMoves: null,
        };
        const currentTurnMovesRef = { current: [] };
        const currentTurnDiceRef = { current: null };
        const turnBoardBeforeRef = { current: [] };

        const { result } = renderHook(() =>
            useCoach({
                game,
                currentTurnMovesRef,
                currentTurnDiceRef,
                turnBoardBeforeRef,
            })
        );

        expect(result.current.matchStats.decisionsCount).toBe(0);
        expect(result.current.matchStatsX.decisionsCount).toBe(0);
        expect(result.current.matchStatsO.decisionsCount).toBe(0);
    });

    it('met à jour matchStatsO quand l’adversaire termine son coup', () => {
        const game = {
            state: { ...createInitialState(7), turn: 'X' as const },
            dice: [4, 2] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert',
            lastOpponentDice: [5, 3] as [number, number],
            lastOpponentMoves: [{ from: 13, to: 8 }, { from: 13, to: 10 }],
        };
        const currentTurnMovesRef = { current: [] };
        const currentTurnDiceRef = { current: null };
        const turnBoardBeforeRef = { current: [] };

        const { result } = renderHook(() =>
            useCoach({
                game,
                currentTurnMovesRef,
                currentTurnDiceRef,
                turnBoardBeforeRef,
            })
        );

        // Une décision adverse est automatiquement prise en compte
        expect(result.current.matchStatsO.decisionsCount).toBe(1);
        expect(result.current.matchStatsO.totalEquityLoss).toBeGreaterThan(0);
        expect(result.current.matchStatsO.totalErrorRate).toBeGreaterThan(0);
    });

    it('ferme automatiquement coach et coachHighlight quand X lance ses nouveaux dés', () => {
        const game = {
            state: { ...createInitialState(7), turn: 'X' as const },
            dice: [6, 2] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert',
            lastOpponentDice: null,
            lastOpponentMoves: null,
            moveHistory: [{ player: 'X', moves: [] }],
        };
        const currentTurnMovesRef = { current: [] };
        const currentTurnDiceRef = { current: null };
        const turnBoardBeforeRef = { current: [] };

        const { result } = renderHook(() =>
            useCoach({
                game,
                currentTurnMovesRef,
                currentTurnDiceRef,
                turnBoardBeforeRef,
            })
        );

        // Au lancement des dés de X, le coach ne doit pas afficher d'analyse résiduelle
        expect(result.current.coach).toBeNull();
        expect(result.current.coachHighlight).toBeNull();
    });

    it('réinitialise le coach dès qu’une nouvelle manche commence (moveHistory vide)', () => {
        const game = {
            state: { ...createInitialState(7), turn: 'X' as const },
            dice: null,
            undoMove: vi.fn(),
            difficulty: 'expert',
            lastOpponentDice: null,
            lastOpponentMoves: null,
            moveHistory: [],
        };
        const currentTurnMovesRef = { current: [] };
        const currentTurnDiceRef = { current: null };
        const turnBoardBeforeRef = { current: [] };

        const { result } = renderHook(() =>
            useCoach({
                game,
                currentTurnMovesRef,
                currentTurnDiceRef,
                turnBoardBeforeRef,
            })
        );

        expect(result.current.coach).toBeNull();
        expect(result.current.coachHighlight).toBeNull();
    });
});

