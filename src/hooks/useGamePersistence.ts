/**
 * Hook de persistance hors-ligne, sauvegarde atomique d'urgence à chaque sous-dé
 * et historique de match (SQLite, IDB, XGID — Audit 20 / 20).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { persistNewGame, persistGameUpdate, persistMove } from '../lib/offline/persistenceService';
import {
    saveEmergencyCheckpoint,
    loadEmergencyCheckpoint,
    clearEmergencyCheckpoint,
    RESTORED_GAME_TOAST_TITLE,
    RESTORED_GAME_TOAST_MESSAGE,
    type EmergencySubMoveCheckpoint,
} from '../lib/offline/emergencyCrashRecovery';
import { analyzeCompleteGame, saveGameAnalysis, type CompleteGameAnalysis, type RawGameTurn } from '../features/rating';
import { parseFromXGID } from '../features/export';
import { formatMoveSequenceNotationAbsolute } from '../lib/engine/evaluator';
import { toast } from '../components/toast/ToastContext';
import { SW_BEFORE_RELOAD_EVENT } from './usePWA';
import type { UseBackgammonGameReturn, GameResult } from './useBackgammonGame';

export interface MatchSnapshotRestorePayload {
    gameId?: string;
    xgid?: string;
    turns?: RawGameTurn[];
    analysis?: CompleteGameAnalysis | null;
    cubeValue?: number;
    cubeOwner?: 'X' | 'O' | null;
}

export interface UseGamePersistenceOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    t: (key: string) => string;
}

export function useGamePersistence({ game, isMultiplayerActive, t }: UseGamePersistenceOptions) {
    const gameIdRef = useRef<string>('');
    const moveCountRef = useRef<number>(0);
    const turnsHistoryRef = useRef<RawGameTurn[]>([]);
    const [turnsHistory, setTurnsHistory] = useState<RawGameTurn[]>([]);
    const currentTurnMovesRef = useRef<{ from: number; to: number }[]>([]);
    const turnBoardBeforeRef = useRef<number[]>([]);
    const turnBoardBeforeRefO = useRef<number[]>([]);
    const currentTurnDiceRef = useRef<[number, number] | null>(null);
    const [latestGameAnalysis, setLatestGameAnalysis] = useState<CompleteGameAnalysis | null>(null);
    const lastRecordedOpponentKeyRef = useRef<string | null>(null);
    const lastRecordedPlayerKeyRef = useRef<string | null>(null);

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
    }, [gameBoard, gameTurn, gameDice, gameUsedDice, gameCubeValue, gameCubeOwner, gameScoreX, gameScoreO, gameMatchLength, gameCrawford, gamePhase]);

    // Initialisation ou mise à jour de la session locale sans écraser le videau
    useEffect(() => {
        if (!gameIdRef.current) {
            const id = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            gameIdRef.current = id;
            moveCountRef.current = 0;
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

    // Sauvegarde atomique à chaque sous-dé joué + événements d'urgence (SW reload, pagehide, beforeunload)
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
    }, [writeAtomicSubMoveCheckpoint, gameScoreX, gameScoreO, gameCubeValue, gameCubeOwner, gameCrawford]);

    const hadHumanRollRef = useRef<boolean>(false);
    useEffect(() => {
        if (gameDice && gameTurn === 'X') {
            if (!hadHumanRollRef.current) {
                hadHumanRollRef.current = true;
                turnBoardBeforeRef.current = [...gameBoard];
                currentTurnDiceRef.current = gameDice;
                currentTurnMovesRef.current = [];
            }
        } else {
            hadHumanRollRef.current = false;
        }
    }, [gameDice, gameTurn, gameBoard]);

    useEffect(() => {
        if (gameTurn === 'O' && gamePhase === 'OPPONENT_THINKING' && turnBoardBeforeRefO.current.length === 0) {
            turnBoardBeforeRefO.current = [...gameBoard];
        }
    }, [gameTurn, gamePhase, gameBoard]);

    useEffect(() => {
        if (gameTurn === 'O' && currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            const playerKey = `${currentTurnDiceRef.current[0]}-${currentTurnDiceRef.current[1]}:${currentTurnMovesRef.current.map((m) => `${m.from}/${m.to}`).join(' ')}`;
            if (lastRecordedPlayerKeyRef.current !== playerKey) {
                lastRecordedPlayerKeyRef.current = playerKey;
                const turnX: RawGameTurn = {
                    turnNumber: turnsHistoryRef.current.length + 1,
                    player: 'X',
                    dice: currentTurnDiceRef.current,
                    boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : gameBoard,
                    boardAfter: [...gameBoard],
                    moves: [...currentTurnMovesRef.current],
                };
                turnsHistoryRef.current.push(turnX);
                setTurnsHistory([...turnsHistoryRef.current]);
            }
        }
    }, [gameTurn, gameBoard]);

    useEffect(() => {
        if (!isMultiplayerActive && lastOpponentDice && lastOpponentMoves !== null && gamePhase !== 'OPPONENT_THINKING' && gameTurn === 'X') {
            const opponentKey = `${turnsHistoryRef.current.length}:${lastOpponentDice[0]}-${lastOpponentDice[1]}:${(lastOpponentMoves ?? []).map((m) => `${m.from}/${m.to}`).join(' ')}`;
            if (lastRecordedOpponentKeyRef.current === opponentKey) return;
            lastRecordedOpponentKeyRef.current = opponentKey;

            const hasMoves = Boolean(lastOpponentMoves && lastOpponentMoves.length > 0);
            const notation = hasMoves ? formatMoveSequenceNotationAbsolute(lastOpponentMoves!, 'O') : t('game.noMovePossible');
            if (!hasMoves) {
                toast.info(`L’IA a tiré [${lastOpponentDice[0]}-${lastOpponentDice[1]}] — ${notation}`, 'IA bloquée');
            }

            if (lastOpponentMoves && lastOpponentMoves.length > 0) {
                const lastTurn = turnsHistoryRef.current[turnsHistoryRef.current.length - 1];
                if (!lastTurn || lastTurn.player !== 'O') {
                    moveCountRef.current += 1;
                    const boardBeforeO = turnBoardBeforeRefO.current.length > 0 ? [...turnBoardBeforeRefO.current] : [...gameBoard];
                    turnBoardBeforeRefO.current = [];
                    const turnO: RawGameTurn = {
                        turnNumber: turnsHistoryRef.current.length + 1,
                        player: 'O',
                        dice: [lastOpponentDice[0], lastOpponentDice[1]],
                        boardBefore: boardBeforeO,
                        boardAfter: [...gameBoard],
                        moves: lastOpponentMoves,
                    };
                    turnsHistoryRef.current.push(turnO);
                    setTurnsHistory([...turnsHistoryRef.current]);

                    persistMove({
                        id: `mv_${Date.now()}_${moveCountRef.current}`,
                        game_id: gameIdRef.current || 'game_default',
                        move_number: moveCountRef.current,
                        player: 'O',
                        dice: [lastOpponentDice[0], lastOpponentDice[1]],
                        move_notation: notation,
                        board_before: boardBeforeO,
                        board_after: gameBoard,
                        played_at: new Date().toISOString(),
                    }).catch(() => {});
                }
            }
        }
    }, [lastOpponentDice, lastOpponentMoves, gamePhase, gameTurn, gameBoard, isMultiplayerActive, t]);

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
            moveCountRef.current = merged.length;
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
    }, [applyRemoteState, gameCubeValue, gameCubeOwner]);

    /** Restaure instantanément le dernier checkpoint d'urgence et affiche le toast « Partie restaurée ». */
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
    }, [applyRemoteState]);

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
        try {
            const analysis = analyzeCompleteGame(turnsHistoryRef.current, {
                targetPlayer: 'X',
                gameId: gameIdRef.current || `game_${Date.now()}`,
                opponentType: isMultiplayerActive ? 'human' : 'ai',
                winner: result.winner,
                winType: result.winType,
                pointsWon: result.pointsWon,
                scoreX: gameScoreX,
                scoreO: gameScoreO,
                matchLength: gameMatchLength,
            });
            saveGameAnalysis(analysis);
            setLatestGameAnalysis(analysis);
        } catch (e) {
            console.warn('[Persistence] Échec analyse fin de partie :', e);
        }
    }, [gameBoard, gameScoreX, gameScoreO, gameCubeValue, gameCubeOwner, gameMatchLength, isMultiplayerActive]);

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
        turnsHistoryRef.current = [];
        setTurnsHistory([]);
        lastRecordedOpponentKeyRef.current = null;
        lastRecordedPlayerKeyRef.current = null;
        setLatestGameAnalysis(null);
    }, []);

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
