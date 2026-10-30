import { useCallback, type MutableRefObject } from 'react';
import { persistGameUpdate } from '../../lib/offline/persistenceService';
import { analyzeCompleteGame, saveGameAnalysis, type CompleteGameAnalysis, type RawGameTurn } from '../../features/rating';
import { parseFromXGID } from '../../features/export';
import type { GameResult, UseBackgammonGameReturn } from '../useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import type { MatchSnapshotRestorePayload } from './gamePersistenceTypes';

export interface UseGameOverAnalysisParams {
    gameIdRef: MutableRefObject<string>;
    clearEmergencyCheckpoint: () => void;
    currentTurnMovesRef: MutableRefObject<{ from: number; to: number }[]>;
    currentTurnDiceRef: MutableRefObject<[number, number] | null>;
    turnsHistoryRef: MutableRefObject<RawGameTurn[]>;
    turnBoardBeforeRef: MutableRefObject<number[]>;
    gameBoard: number[];
    gameScoreX: number;
    gameScoreO: number;
    gameCubeValue: number;
    gameCubeOwner: Player | null;
    gameMatchLength: number;
    gameCrawford?: boolean;
    gameDifficulty?: string | null;
    gameMatchLog?: ReadonlyArray<MatchLogEntry>;
    isMultiplayerActive: boolean;
    setTurnsHistory: (turns: RawGameTurn[]) => void;
    setLatestGameAnalysis: (analysis: CompleteGameAnalysis | null) => void;
    applyRemoteState: UseBackgammonGameReturn['applyRemoteState'];
}

export function useGameOverAnalysis({
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
    gameCrawford = false,
    gameDifficulty = null,
    gameMatchLog,
    isMultiplayerActive,
    setTurnsHistory,
    setLatestGameAnalysis,
    applyRemoteState,
}: UseGameOverAnalysisParams) {
    const handleGameOverAnalysis = useCallback((result: GameResult) => {
        clearEmergencyCheckpoint();
        if (gameIdRef.current) {
            persistGameUpdate(gameIdRef.current, {
                status: 'completed',
                winner: result.winner,
                win_type: result.winType,
                points_won: result.pointsWon,
                score_x: gameScoreX,
                score_o: gameScoreO,
                cube_value: gameCubeValue,
                cube_owner: gameCubeOwner,
                ended_at: new Date().toISOString(),
            }).catch(() => {});
        }
        if (currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            turnsHistoryRef.current.push({
                turnNumber: turnsHistoryRef.current.length + 1,
                player: 'X',
                dice: currentTurnDiceRef.current,
                boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : gameBoard,
                boardAfter: [...gameBoard],
                moves: [...currentTurnMovesRef.current],
            });
            currentTurnMovesRef.current = [];
        }

        // Source d'autorité : `gameMatchLog` (enregistré de façon atomique par le reducer,
        // insensible aux clics directs sans sélection et nettoyé lors des Rewinds).
        const logDiceEntries = (gameMatchLog ?? []).filter(
            (e) => e.dice && e.dice[0] > 0 && e.dice[1] > 0,
        );
        let turnsForAnalysis = turnsHistoryRef.current;
        if (logDiceEntries.some((e) => e.player === 'X')) {
            turnsForAnalysis = logDiceEntries.map((e, idx) => ({
                turnNumber: e.turnIndex || idx + 1,
                player: e.player,
                dice: [e.dice[0], e.dice[1]],
                boardBefore: [...e.boardBefore],
                boardAfter: [...e.boardAfter],
                moves: e.movePlayed.map((m) => ({ from: m.from, to: m.to })),
                cubeValue: gameCubeValue,
                cubeOwner: gameCubeOwner,
                crawford: gameCrawford,
            }));
            turnsHistoryRef.current = turnsForAnalysis;
            setTurnsHistory([...turnsForAnalysis]);
        }

        try {
            const analysis = analyzeCompleteGame(turnsForAnalysis, {
                targetPlayer: 'X',
                gameId: gameIdRef.current || `game_${Date.now()}`,
                opponentType: isMultiplayerActive ? 'human' : 'ai',
                opponentDifficulty: isMultiplayerActive ? null : gameDifficulty,
                winner: result.winner,
                winType: result.winType,
                pointsWon: result.pointsWon,
                scoreX: gameScoreX,
                scoreO: gameScoreO,
                matchLength: gameMatchLength,
                cubeValue: gameCubeValue,
                cubeOwner: gameCubeOwner,
                crawford: gameCrawford,
            });
            saveGameAnalysis(analysis);
            setLatestGameAnalysis(analysis);
        } catch (e) {
            console.warn('[Persistence] Échec analyse fin de partie :', e);
        }
    }, [clearEmergencyCheckpoint, gameBoard, gameCrawford, gameCubeOwner, gameCubeValue, gameDifficulty, gameIdRef, gameMatchLength, gameMatchLog, gameScoreO, gameScoreX, isMultiplayerActive, setLatestGameAnalysis, setTurnsHistory, currentTurnDiceRef, currentTurnMovesRef, turnBoardBeforeRef, turnsHistoryRef]);

    const restoreMatchSnapshot = useCallback((snapshot: MatchSnapshotRestorePayload) => {
        if (snapshot.gameId) gameIdRef.current = snapshot.gameId;
        if (snapshot.turns && snapshot.turns.length > 0) {
            const existingByTurn = new Map(turnsHistoryRef.current.map((tr) => [tr.turnNumber, tr]));
            const merged = snapshot.turns.map((incoming) => {
                const prev = existingByTurn.get(incoming.turnNumber);
                return prev ? { ...prev, ...incoming } : incoming;
            });
            turnsHistoryRef.current = merged;
            setTurnsHistory([...merged]);
        }
        if (snapshot.analysis) setLatestGameAnalysis(snapshot.analysis);
        if (snapshot.xgid) {
            const parsed = parseFromXGID(snapshot.xgid);
            applyRemoteState({
                board: parsed.board,
                dice: parsed.dice,
                turn: parsed.turn,
                cubeValue: snapshot.cubeValue ?? parsed.cubeValue ?? gameCubeValue,
                cubeOwner: snapshot.cubeOwner !== undefined ? snapshot.cubeOwner : (parsed.cubeOwner ?? gameCubeOwner),
                phase: parsed.dice ? 'PLAYING_MOVES' : 'WAITING_FOR_ROLL',
                usedDice: [false, false],
            });
        }
    }, [applyRemoteState, gameCubeOwner, gameCubeValue, gameIdRef, setLatestGameAnalysis, setTurnsHistory, turnsHistoryRef]);

    return {
        handleGameOverAnalysis,
        restoreMatchSnapshot,
    };
}
