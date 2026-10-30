// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCoach } from './useCoach';
import { createInitialState } from '../engine/backgammonEngine';
import * as logAnalyzer from '../features/coach/logAnalyzer';
import * as cubeCoach from '../features/coach/cubeCoach';
import type { MatchLogEntry } from '../actions/types';

function createEmptyRefs() {
    return {
        currentTurnMovesRef: { current: [] },
        currentTurnDiceRef: { current: null },
        turnBoardBeforeRef: { current: [] },
    };
}

describe('useCoach hook', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('initialise matchStatsX et matchStatsO avec PR à 0', () => {
        const game = {
            state: createInitialState(7),
            dice: [3, 1] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            lastOpponentDice: null,
            lastOpponentMoves: null,
        };
        const { result } = renderHook(() => useCoach({ game, ...createEmptyRefs() }));
        expect(result.current.matchStats.decisionsCount).toBe(0);
        expect(result.current.matchStatsX.decisionsCount).toBe(0);
        expect(result.current.matchStatsO.decisionsCount).toBe(0);
    });

    it('n’analyse PAS les coups de l’IA (matchStatsO reste à 0)', () => {
        const game = {
            state: { ...createInitialState(7), turn: 'X' as const },
            dice: [4, 2] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            lastOpponentDice: [5, 3] as [number, number],
            lastOpponentMoves: [{ from: 13, to: 8 }, { from: 13, to: 10 }],
            matchLog: [],
        };
        const { result } = renderHook(() => useCoach({ game, ...createEmptyRefs() }));
        expect(result.current.matchStatsO.decisionsCount).toBe(0);
        expect(result.current.matchStatsO.totalEquityLoss).toBe(0);
    });

    it('ferme automatiquement coach et coachHighlight sur nouveau lancer de dés ou nouvelle manche (autorité unifiée)', () => {
        const game = {
            state: { ...createInitialState(7), turn: 'X' as const },
            dice: [6, 2] as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            lastOpponentDice: null,
            lastOpponentMoves: null,
            moveHistory: [{ player: 'X' as const, moves: [] }],
        };
        const { result } = renderHook(() => useCoach({ game, ...createEmptyRefs() }));
        expect(result.current.coach).toBeNull();
        expect(result.current.coachHighlight).toBeNull();
    });

    it('ne plafonne pas la perte d’équité à 0.500 (cumule Math.abs(equityLoss) exact)', async () => {
        const initial = createInitialState(7);
        vi.spyOn(logAnalyzer, 'analyzeHumanMoveFromLogWithBgsage').mockResolvedValueOnce({
            turnIndex: 1,
            player: 'X',
            verdict: 'blunder',
            equityLoss: -0.78,
            playedNotation: '24/23 24/22',
            optimalNotation: '8/5 6/5',
            optimalMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            isBlunder: true,
            isUnforced: true,
            playedEquity: -0.56,
            bestEquity: 0.22,
            source: 'bgsage' as const,
            candidateMoves: [
                { notation: '8/5 6/5', equity: 0.22, equityLoss: 0 },
                { notation: '24/23 24/22', equity: -0.56, equityLoss: -0.78 },
            ],
        });

        const game = {
            state: { ...initial, turn: 'O' as const },
            dice: null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            matchLog: [
                {
                    turnIndex: 1,
                    player: 'X' as const,
                    dice: [3, 1] as const,
                    boardBefore: initial.board,
                    movePlayed: [{ from: 24, to: 23 }, { from: 24, to: 22 }],
                    boardAfter: initial.board,
                },
            ],
        };

        const { result } = renderHook(() => useCoach({ game, ...createEmptyRefs() }));
        await waitFor(() => expect(result.current.matchStats.decisionsCount).toBe(1));

        expect(result.current.matchStats.totalEquityLoss).toBeCloseTo(0.78, 4);
        expect(result.current.matchStats.totalErrorRate).toBeCloseTo(0.78 * 500, 2);
        expect(result.current.coach?.verdict).toBe('blunder');
        expect(result.current.coach?.positionKey).toContain('XGID=');
    });

    it('supporte les 4 paliers officiels dans CoachState.verdict (ex: inaccuracy)', async () => {
        const initial = createInitialState(7);
        vi.spyOn(logAnalyzer, 'analyzeHumanMoveFromLogWithBgsage').mockResolvedValueOnce({
            turnIndex: 2,
            player: 'X',
            verdict: 'inaccuracy',
            equityLoss: -0.045,
            playedNotation: '13/10 13/12',
            optimalNotation: '8/5 6/5',
            optimalMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            isBlunder: false,
            isUnforced: true,
            playedEquity: 0.155,
            bestEquity: 0.2,
            source: 'bgsage' as const,
            candidateMoves: [
                { notation: '8/5 6/5', equity: 0.2, equityLoss: 0 },
                { notation: '13/10 13/12', equity: 0.155, equityLoss: -0.045 },
            ],
        });

        const baseGame = {
            state: { ...initial, turn: 'X' as 'X' | 'O' },
            dice: null as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            matchLog: [] as MatchLogEntry[],
        };

        const { result, rerender } = renderHook(
            ({ g }) => useCoach({ game: g, ...createEmptyRefs() }),
            { initialProps: { g: baseGame } },
        );

        act(() => result.current.setNotificationLevel('error'));

        rerender({
            g: {
                ...baseGame,
                state: { ...initial, turn: 'O' as const },
                matchLog: [
                    {
                        turnIndex: 2,
                        player: 'X',
                        dice: [3, 1],
                        boardBefore: initial.board,
                        movePlayed: [{ from: 13, to: 10 }, { from: 13, to: 12 }],
                        boardAfter: initial.board,
                    },
                ],
            },
        });

        await waitFor(() => expect(result.current.coach).not.toBeNull());
        expect(result.current.coach?.verdict).toBe('inaccuracy');
        expect(result.current.matchStats.decisionCounters?.inaccuracy).toBe(1);
    });

    it('intercepte OFFER_DOUBLE, TAKE_DOUBLE et PASS_DOUBLE via analyzeCubeDecision de cubeCoach.ts', async () => {
        const spyCube = vi.spyOn(cubeCoach, 'analyzeCubeDecision');
        const initial = createInitialState(7);
        const baseGame = {
            state: initial,
            dice: null as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            phase: 'WAITING_FOR_ROLL',
            doublingOfferedBy: null as 'X' | 'O' | null,
            moveHistory: [] as { type?: string }[],
        };

        const onCoachTriggered = vi.fn();
        const { result, rerender } = renderHook(
            ({ g }) => useCoach({ game: g, ...createEmptyRefs(), onCoachTriggered }),
            { initialProps: { g: baseGame } },
        );

        rerender({ g: { ...baseGame, phase: 'DOUBLING_OFFERED', doublingOfferedBy: 'X' } });

        await waitFor(() => expect(result.current.coach?.verdict).toBe('blunder'));
        expect(spyCube).toHaveBeenCalledWith(expect.any(Object), 'double');
        expect(result.current.coach?.playedMove).toContain('Doubler');
        expect(onCoachTriggered).toHaveBeenCalled();

        act(() => {
            result.current.evaluateCubeAction('TAKE_DOUBLE', initial);
            result.current.evaluateCubeAction('PASS_DOUBLE', initial);
        });
        expect(result.current.matchStats.decisionsCount).toBe(3);
    });

    it('élimine toute race condition lors d’une rafale de 50 coups rapides consécutifs', async () => {
        const initial = createInitialState(7);
        const pendingResolvers: Array<() => void> = [];

        vi.spyOn(logAnalyzer, 'analyzeHumanMoveFromLogWithBgsage').mockImplementation(({ logEntry }) => {
            return new Promise((resolve) => {
                pendingResolvers.push(() =>
                    resolve({
                        turnIndex: logEntry.turnIndex,
                        player: 'X',
                        verdict: 'blunder',
                        equityLoss: -0.15,
                        playedNotation: '13/10',
                        optimalNotation: `Opt-${logEntry.turnIndex}`,
                        optimalMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
                        isBlunder: true,
                        isUnforced: true,
                        playedEquity: 0.0,
                        bestEquity: 0.15,
                        source: 'bgsage',
                        candidateMoves: [{ notation: `Opt-${logEntry.turnIndex}`, equity: 0.15, equityLoss: 0 }],
                    }),
                );
            });
        });

        const baseGame = {
            state: { ...initial, turn: 'O' as const },
            dice: null as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            matchLog: [] as MatchLogEntry[],
        };

        const { result, rerender } = renderHook(
            ({ g }) => useCoach({ game: g, ...createEmptyRefs() }),
            { initialProps: { g: baseGame } },
        );

        for (let i = 1; i <= 50; i++) {
            rerender({
                g: {
                    ...baseGame,
                    matchLog: [
                        {
                            turnIndex: i,
                            player: 'X',
                            dice: [3, 1],
                            boardBefore: initial.board,
                            movePlayed: [{ from: 13, to: 10 }],
                            boardAfter: initial.board,
                        },
                    ],
                },
            });
        }

        await act(async () => {
            for (let idx = pendingResolvers.length - 1; idx >= 0; idx--) {
                pendingResolvers[idx]();
            }
        });

        await waitFor(() => expect(result.current.coach).not.toBeNull());
        expect(result.current.coach?.optimalMove).toBe('Opt-50');
        expect(result.current.matchStats.decisionsCount).toBe(1);
    });

    it('persiste le panneau coach lors d’un nouveau lancer humain tout en effaçant coachHighlight et en alimentant coachHistory', async () => {
        const initial = createInitialState(7);
        vi.spyOn(logAnalyzer, 'analyzeHumanMoveFromLogWithBgsage').mockResolvedValueOnce({
            turnIndex: 1,
            player: 'X',
            verdict: 'blunder',
            equityLoss: -0.18,
            playedNotation: '24/23 24/22',
            optimalNotation: '8/5 6/5',
            optimalMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            isBlunder: true,
            isUnforced: true,
            playedEquity: -0.05,
            bestEquity: 0.13,
            source: 'bgsage',
            candidateMoves: [{ notation: '8/5 6/5', equity: 0.13, equityLoss: 0 }],
        });

        const baseGame = {
            state: { ...initial, turn: 'O' as 'X' | 'O' },
            dice: null as [number, number] | null,
            undoMove: vi.fn(),
            difficulty: 'expert' as const,
            moveHistory: [{ player: 'X' as const, moves: [{ from: 24, to: 23 }] }],
            matchLog: [
                {
                    turnIndex: 1,
                    player: 'X' as const,
                    dice: [3, 1] as const,
                    boardBefore: initial.board,
                    movePlayed: [{ from: 24, to: 23 }, { from: 24, to: 22 }],
                    boardAfter: initial.board,
                },
            ],
        };

        const { result, rerender } = renderHook(
            ({ g }) => useCoach({ game: g, ...createEmptyRefs() }),
            { initialProps: { g: baseGame } },
        );

        await waitFor(() => expect(result.current.coach).not.toBeNull());
        expect(result.current.coachHighlight).not.toBeNull();
        expect(result.current.coachHistory).toHaveLength(1);

        // Nouveau lancer humain : coach reste affiché, mais coachHighlight est effacé du plateau actif
        rerender({
            g: {
                ...baseGame,
                state: { ...initial, turn: 'X' },
                dice: [5, 2],
            },
        });

        expect(result.current.coach).not.toBeNull();
        expect(result.current.coach?.optimalMove).toBe('8/5 6/5');
        expect(result.current.coachHighlight).toBeNull();

        // Sélection dans coachHistory restaure l'analyse et ses flèches
        act(() => result.current.selectCoachHistoryIndex(0));
        expect(result.current.selectedCoachHistoryIndex).toBe(0);
        expect(result.current.coachHighlight).not.toBeNull();
    });

    it('ne relance jamais la même erreur et ne dégrade pas le PR lors des mises à jour d’état IA ou de Rejouer ce coup (replayMove)', async () => {
        const initial = createInitialState(7);
        const spyAnalyze = vi.spyOn(logAnalyzer, 'analyzeHumanMoveFromLogWithBgsage').mockResolvedValue({
            turnIndex: 1,
            player: 'X',
            verdict: 'blunder',
            equityLoss: -0.16,
            playedNotation: '24/23 24/22',
            optimalNotation: '8/5 6/5',
            optimalMoves: [{ from: 8, to: 5 }, { from: 6, to: 5 }],
            isBlunder: true,
            isUnforced: true,
            playedEquity: -0.04,
            bestEquity: 0.12,
            source: 'bgsage',
            candidateMoves: [
                { notation: '8/5 6/5', equity: 0.12, equityLoss: 0 },
                { notation: '24/23 24/22', equity: -0.04, equityLoss: -0.16 },
            ],
        });

        const rewindToLogTurn = vi.fn(() => true);
        const xBlunderLog: MatchLogEntry = {
            turnIndex: 1,
            player: 'X',
            dice: [3, 1],
            boardBefore: initial.board,
            movePlayed: [{ from: 24, to: 23 }, { from: 24, to: 22 }],
            boardAfter: initial.board,
            notation: '24/23 24/22',
        };
        const oReplyLog: MatchLogEntry = {
            turnIndex: 2,
            player: 'O',
            dice: [6, 1],
            boardBefore: initial.board,
            movePlayed: [{ from: 13, to: 7 }, { from: 8, to: 7 }],
            boardAfter: initial.board,
            notation: '13/7 8/7',
        };

        const baseGame = {
            state: { ...initial, turn: 'O' as 'X' | 'O' },
            dice: null as [number, number] | null,
            undoMove: vi.fn(),
            rewindToLogTurn,
            difficulty: 'expert' as const,
            matchLog: [xBlunderLog] as MatchLogEntry[],
        };

        const { result, rerender } = renderHook(
            ({ g }) => useCoach({ game: g, ...createEmptyRefs() }),
            { initialProps: { g: baseGame } },
        );

        await waitFor(() => expect(result.current.matchStats.decisionsCount).toBe(1));
        expect(result.current.matchStats.totalErrorRate).toBeCloseTo(0.16 * 500, 2);
        expect(result.current.lastMoveFeedback?.verdict).toBe('blunder');
        expect(spyAnalyze).toHaveBeenCalledTimes(1);

        // L'IA joue son tour (matchLog s'allonge avec le tour O et state change) : aucune ré-analyse de X, PR inchangé
        rerender({
            g: {
                ...baseGame,
                state: { ...initial, turn: 'X' },
                matchLog: [xBlunderLog, oReplyLog],
            },
        });
        expect(spyAnalyze).toHaveBeenCalledTimes(1);
        expect(result.current.matchStats.decisionsCount).toBe(1);
        expect(result.current.matchStats.totalErrorRate).toBeCloseTo(0.16 * 500, 2);

        // Même si notificationLevel === 'none' (coach === null), replayMove cible turnIndex=1 via lastMoveFeedback/coachHistory
        act(() => result.current.replayMove());
        expect(rewindToLogTurn).toHaveBeenCalledWith(1);
        expect(result.current.lastMoveFeedback).toBeNull();
        expect(result.current.coach).toBeNull();
        expect(result.current.matchStats.decisionsCount).toBe(0);
        expect(result.current.matchStats.totalErrorRate).toBe(0);
    });
});
