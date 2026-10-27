/**
 * Hook de persistance hors-ligne, sauvegarde atomique d'urgence à chaque sous-dé
 * et historique de match (SQLite, IDB, XGID — Audit 20 / 20).
 *
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md, <= 200 lignes).
 * Strictement 0 `any`.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { persistNewGame, persistGameUpdate } from '../lib/offline/persistenceService';
import type { CompleteGameAnalysis, RawGameTurn } from '../features/rating';
import { toast } from '../components/toast/ToastContext';
import { useEmergencyPersistence } from './persistence/useEmergencyPersistence';
import { useTurnHistoryRecorder } from './persistence/useTurnHistoryRecorder';
import { useGameOverAnalysis } from './persistence/useGameOverAnalysis';
import type { MatchSnapshotRestorePayload, UseGamePersistenceOptions } from './persistence/gamePersistenceTypes';

export type { MatchSnapshotRestorePayload, UseGamePersistenceOptions };

export function useGamePersistence({ game, isMultiplayerActive, t }: UseGamePersistenceOptions) {
    const gameIdRef = useRef<string>('');
    const moveCountRef = useRef<number>(0);
    const turnsHistoryRef = useRef<RawGameTurn[]>([]);
    const currentTurnMovesRef = useRef<{ from: number; to: number }[]>([]);
    const turnBoardBeforeRef = useRef<number[]>([]);
    const currentTurnDiceRef = useRef<[number, number] | null>(null);
    const [latestGameAnalysis, setLatestGameAnalysis] = useState<CompleteGameAnalysis | null>(null);

    const {
        difficulty: gameDifficulty,
        dice: gameDice,
        usedDice: gameUsedDice = [false, false],
        phase: gamePhase,
        state: gameState,
        lastOpponentDice,
        lastOpponentMoves,
        applyRemoteState,
    } = game;
    const {
        board: gameBoard,
        turn: gameTurn,
        matchLength: gameMatchLength,
        scoreX: gameScoreX,
        scoreO: gameScoreO,
        cubeValue: gameCubeValue,
        cubeOwner: gameCubeOwner,
        crawford: gameCrawford,
    } = gameState;

    const { writeAtomicSubMoveCheckpoint, restoreEmergencyCheckpoint, clearEmergencyCheckpoint } = useEmergencyPersistence({
        gameIdRef,
        gameBoard,
        gameTurn,
        gameDice,
        gameUsedDice,
        gameCubeValue,
        gameCubeOwner,
        gameScoreX,
        gameScoreO,
        gameMatchLength,
        gameCrawford,
        gamePhase,
        currentTurnMovesRef,
        applyRemoteState,
    });

    const { turnsHistory, setTurnsHistory, resetTurnHistory } = useTurnHistoryRecorder({
        gameIdRef,
        moveCountRef,
        turnsHistoryRef,
        currentTurnMovesRef,
        turnBoardBeforeRef,
        currentTurnDiceRef,
        gameBoard,
        gameTurn,
        gameDice,
        gamePhase,
        lastOpponentDice,
        lastOpponentMoves,
        isMultiplayerActive,
        t,
    });

    const { handleGameOverAnalysis, restoreMatchSnapshot } = useGameOverAnalysis({
        gameIdRef,
        clearEmergencyCheckpoint,
        currentTurnMovesRef,
        currentTurnDiceRef,
        turnsHistoryRef,
        turnBoardBeforeRef,
        gameBoard,
        gameScoreX,
        gameScoreO,
        gameCubeValue,
        gameCubeOwner,
        gameMatchLength,
        isMultiplayerActive,
        setTurnsHistory,
        setLatestGameAnalysis,
        applyRemoteState,
    });

    // Initialisation ou mise à jour de la session locale sans écraser le videau
    useEffect(() => {
        if (!gameIdRef.current) {
            const id = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            gameIdRef.current = id;
            moveCountRef.current = 0;
            writeAtomicSubMoveCheckpoint();
            const now = new Date().toISOString();
            persistNewGame({
                id,
                opponent_type: isMultiplayerActive ? 'human' : 'ai',
                opponent_difficulty: isMultiplayerActive ? null : gameDifficulty,
                match_length: gameMatchLength,
                score_x: gameScoreX,
                score_o: gameScoreO,
                cube_value: gameCubeValue,
                cube_owner: gameCubeOwner,
                is_crawford: gameCrawford,
                status: 'in_progress',
                started_at: now,
                created_at: now,
                updated_at: now,
            }).catch(() => {});
        } else {
            persistGameUpdate(gameIdRef.current, {
                score_x: gameScoreX,
                score_o: gameScoreO,
                cube_value: gameCubeValue,
                cube_owner: gameCubeOwner,
                is_crawford: gameCrawford,
            }).catch(() => {});
        }
    }, [isMultiplayerActive, gameDifficulty, gameMatchLength, gameScoreX, gameScoreO, gameCubeValue, gameCubeOwner, gameCrawford]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const sharedXgid = new URLSearchParams(window.location.search).get('xgid');
            if (sharedXgid) {
                restoreMatchSnapshot({ xgid: sharedXgid });
                toast.success('Position XGID partagée chargée avec succès !', 'Lien de partage');
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch (err) {
            console.warn('[Persistence] Erreur paramètre XGID partagé :', err);
        }
    }, [restoreMatchSnapshot]);

    const resetGameHistory = useCallback(() => {
        clearEmergencyCheckpoint();
        gameIdRef.current = '';
        resetTurnHistory();
        setLatestGameAnalysis(null);
    }, [clearEmergencyCheckpoint, resetTurnHistory]);

    return {
        gameIdRef,
        turnsHistory,
        turnsHistoryRef,
        currentTurnMovesRef,
        turnBoardBeforeRef,
        currentTurnDiceRef,
        latestGameAnalysis,
        setLatestGameAnalysis,
        handleGameOverAnalysis,
        restoreMatchSnapshot,
        restoreEmergencyCheckpoint,
        resetGameHistory,
    };
}
