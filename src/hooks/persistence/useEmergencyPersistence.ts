import { useCallback, useEffect, type MutableRefObject } from 'react';
import {
    saveEmergencyCheckpoint,
    loadEmergencyCheckpoint,
    clearEmergencyCheckpoint,
    RESTORED_GAME_TOAST_TITLE,
    RESTORED_GAME_TOAST_MESSAGE,
    type EmergencySubMoveCheckpoint,
} from '../../lib/offline/emergencyCrashRecovery';
import { persistGameUpdate } from '../../lib/offline/persistenceService';
import { toast } from '../../components/toast/ToastContext';
import { SW_BEFORE_RELOAD_EVENT } from '../usePWA';
import type { Player } from '../../engine/backgammonEngine';
import type { GamePhase } from '../gameStateReducer';
import type { UseBackgammonGameReturn } from '../useBackgammonGame';

export interface UseEmergencyPersistenceParams {
    gameIdRef: MutableRefObject<string>;
    gameBoard: number[];
    gameTurn: Player;
    gameDice: [number, number] | null;
    gameUsedDice: boolean[];
    gameCubeValue: number;
    gameCubeOwner: Player | null;
    gameScoreX: number;
    gameScoreO: number;
    gameMatchLength: number;
    gameCrawford: boolean;
    gamePhase: GamePhase;
    currentTurnMovesRef: MutableRefObject<{ from: number; to: number }[]>;
    applyRemoteState: UseBackgammonGameReturn['applyRemoteState'];
}

export function useEmergencyPersistence({
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
}: UseEmergencyPersistenceParams) {
    const writeAtomicSubMoveCheckpoint = useCallback(() => {
        if (!gameIdRef.current || gamePhase === 'GAME_OVER') return;
        saveEmergencyCheckpoint({
            gameId: gameIdRef.current,
            board: gameBoard,
            turn: gameTurn,
            dice: gameDice,
            usedDice: gameUsedDice,
            cubeValue: gameCubeValue,
            cubeOwner: gameCubeOwner,
            scoreX: gameScoreX,
            scoreO: gameScoreO,
            matchLength: gameMatchLength,
            crawford: gameCrawford,
            phase: gamePhase,
            subMovesPlayed: currentTurnMovesRef.current,
            savedAtMs: Date.now(),
        });
    }, [gameIdRef, gameBoard, gameTurn, gameDice, gameUsedDice, gameCubeValue, gameCubeOwner, gameScoreX, gameScoreO, gameMatchLength, gameCrawford, gamePhase, currentTurnMovesRef]);

    useEffect(() => {
        writeAtomicSubMoveCheckpoint();
    }, [writeAtomicSubMoveCheckpoint]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleEmergencyFlush = () => {
            writeAtomicSubMoveCheckpoint();
            if (!gameIdRef.current) return;
            persistGameUpdate(gameIdRef.current, {
                score_x: gameScoreX,
                score_o: gameScoreO,
                cube_value: gameCubeValue,
                cube_owner: gameCubeOwner,
                is_crawford: gameCrawford,
            }).catch(() => {});
        };
        window.addEventListener(SW_BEFORE_RELOAD_EVENT, handleEmergencyFlush);
        window.addEventListener('pagehide', handleEmergencyFlush);
        window.addEventListener('beforeunload', handleEmergencyFlush);
        return () => {
            window.removeEventListener(SW_BEFORE_RELOAD_EVENT, handleEmergencyFlush);
            window.removeEventListener('pagehide', handleEmergencyFlush);
            window.removeEventListener('beforeunload', handleEmergencyFlush);
        };
    }, [writeAtomicSubMoveCheckpoint, gameIdRef, gameScoreX, gameScoreO, gameCubeValue, gameCubeOwner, gameCrawford]);

    const restoreEmergencyCheckpoint = useCallback((): EmergencySubMoveCheckpoint | null => {
        const checkpoint = loadEmergencyCheckpoint();
        if (!checkpoint) return null;
        gameIdRef.current = checkpoint.gameId;
        currentTurnMovesRef.current = [...checkpoint.subMovesPlayed];
        applyRemoteState({
            board: [...checkpoint.board],
            dice: checkpoint.dice ? [checkpoint.dice[0], checkpoint.dice[1]] : null,
            turn: checkpoint.turn,
            cubeValue: checkpoint.cubeValue,
            cubeOwner: checkpoint.cubeOwner,
            phase: checkpoint.dice ? 'PLAYING_MOVES' : 'WAITING_FOR_ROLL',
            usedDice: [Boolean(checkpoint.usedDice[0]), Boolean(checkpoint.usedDice[1])],
        });
        toast.success(RESTORED_GAME_TOAST_MESSAGE, RESTORED_GAME_TOAST_TITLE);
        return checkpoint;
    }, [applyRemoteState, gameIdRef, currentTurnMovesRef]);

    return {
        writeAtomicSubMoveCheckpoint,
        restoreEmergencyCheckpoint,
        clearEmergencyCheckpoint,
    };
}
