'use client';

/**
 * @file src/hooks/useDrillBoardInteraction.ts
 * @description Hook de gestion des mouvements et clics sur le plateau de quiz (< 100 lignes, 0 any).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { applyMove, computeLegalTargets, X_BAR, O_BAR, type Move, type BoardState } from '../engine/backgammonEngine';
import { impactLight } from '../lib/capacitor/haptics';
import type { PlayerBlunderRecord, DrillValidationResult } from '../features/drills/types';
import { validateDrillMove } from '../features/drills/blunderDrillEngine';

export interface UseDrillBoardInteractionProps {
    readonly currentBlunder: PlayerBlunderRecord | null;
    readonly validatedInitialBoard: number[];
    readonly validationResult: DrillValidationResult | null;
    readonly onApplyValidation: (result: DrillValidationResult) => void;
    readonly attemptsLeft: number;
    readonly onSetAttemptsLeft: (updater: (prev: number) => number) => void;
}

export function useDrillBoardInteraction({
    currentBlunder,
    validatedInitialBoard,
    validationResult,
    onApplyValidation,
    attemptsLeft,
    onSetAttemptsLeft,
}: UseDrillBoardInteractionProps) {
    const [currentBoard, setCurrentBoard] = useState<number[]>(() => validatedInitialBoard);
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);

    const liveDrillRef = useRef<{ board: number[]; usedDice: [boolean, boolean]; playedMoves: Move[] }>({
        board: currentBoard, usedDice: [false, false], playedMoves: [],
    });
    liveDrillRef.current = { board: currentBoard, usedDice, playedMoves };

    useEffect(() => {
        if (!currentBlunder) return;
        setCurrentBoard(validatedInitialBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        liveDrillRef.current = { board: validatedInitialBoard, usedDice: [false, false], playedMoves: [] };
    }, [currentBlunder, validatedInitialBoard]);

    const handleResetCurrentAttempt = useCallback(() => {
        if (!currentBlunder) return;
        setCurrentBoard(validatedInitialBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        if (attemptsLeft <= 0) onSetAttemptsLeft(() => 1);
        liveDrillRef.current = { board: validatedInitialBoard, usedDice: [false, false], playedMoves: [] };
        impactLight();
    }, [currentBlunder, validatedInitialBoard, attemptsLeft, onSetAttemptsLeft]);

    const handlePlayMove = useCallback((from: number, to: number, explicitDie?: 0 | 1) => {
        if (!currentBlunder || validationResult !== null) return;
        const live = liveDrillRef.current;
        const bs: BoardState = {
            board: [...live.board], turn: currentBlunder.player, cubeValue: 1, cubeOwner: null,
            dice: currentBlunder.dice, matchLength: 7, scoreX: 0, scoreO: 0, crawford: false,
            doubled: false, resigned: 0,
        };
        let targets;
        try { targets = computeLegalTargets(bs, currentBlunder.dice, live.usedDice); } catch { return; }
        const leftDests = targets.leftDieTargets.get(from) ?? [];
        const rightDests = targets.rightDieTargets.get(from) ?? [];
        let dieUsed: 0 | 1 | null = null;
        if (explicitDie === 0 && !live.usedDice[0] && leftDests.includes(to)) dieUsed = 0;
        else if (explicitDie === 1 && !live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        else if (selectedDie === 1 && !live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        else if (!live.usedDice[0] && leftDests.includes(to)) dieUsed = 0;
        else if (!live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        if (dieUsed === null) return;

        impactLight();
        const move: Move = { from, to };
        const newBoard = applyMove(live.board, move, currentBlunder.player);
        const newUsed: [boolean, boolean] = [live.usedDice[0], live.usedDice[1]];
        newUsed[dieUsed] = true;
        const newPlayedMoves = [...live.playedMoves, move];
        liveDrillRef.current = { board: newBoard, usedDice: newUsed, playedMoves: newPlayedMoves };
        setCurrentBoard(newBoard);
        setUsedDice(newUsed);
        setPlayedMoves(newPlayedMoves);
        setSelectedPoint(null);
        setSelectedDie(null);
    }, [currentBlunder, validationResult, selectedDie]);

    const handleConfirmBoardMove = useCallback(() => {
        if (!currentBlunder || validationResult !== null || playedMoves.length === 0) return;
        impactLight();
        onApplyValidation(validateDrillMove(currentBlunder, playedMoves, currentBoard));
    }, [currentBlunder, validationResult, playedMoves, currentBoard, onApplyValidation]);

    const handleCheckerClick = useCallback((point: number, leftTargets: Map<number, number[]>, rightTargets: Map<number, number[]>) => {
        if (!currentBlunder || validationResult !== null) return;
        const isPlayerX = currentBlunder.player === 'X';
        const hasChecker = isPlayerX ? (point === X_BAR ? currentBoard[X_BAR] > 0 : currentBoard[point] > 0) : (point === O_BAR ? currentBoard[O_BAR] < 0 : currentBoard[point] < 0);
        if (!hasChecker) return;
        const leftDests = leftTargets.get(point) ?? [];
        const rightDests = rightTargets.get(point) ?? [];
        if (selectedDie === 1 && !usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
        else if (!usedDice[0] && leftDests.length > 0) handlePlayMove(point, leftDests[0], 0);
        else if (!usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
    }, [currentBlunder, validationResult, currentBoard, selectedDie, usedDice, handlePlayMove]);

    return {
        currentBoard, setCurrentBoard, playedMoves, setPlayedMoves,
        usedDice, setUsedDice, selectedPoint, setSelectedPoint,
        selectedDie, setSelectedDie, liveDrillRef,
        handleResetCurrentAttempt, handlePlayMove, handleConfirmBoardMove, handleCheckerClick,
    };
}
