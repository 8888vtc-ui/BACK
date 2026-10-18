/**
 * Hook de persistance hors-ligne et historique de match (SQLite, IDB, XGID).
 *
 * Rôle :
 *   Gère l'enregistrement local des parties, la capture des tours (pour l'analyse de fin de partie),
 *   et l'importation automatique de positions XGID depuis l'URL.
 *
 * Dépendances :
 *   `persistenceService`, `rating`, `export`, `toast`, `UseBackgammonGameReturn`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `page.tsx`.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { persistNewGame, persistGameUpdate, persistMove } from '../lib/offline/persistenceService';
import { analyzeCompleteGame, saveGameAnalysis, type CompleteGameAnalysis, type RawGameTurn } from '../features/rating';
import { parseFromXGID } from '../features/export';
import { formatMoveSequenceNotationAbsolute } from '../lib/engine/evaluator';
import { toast } from '../components/toast/ToastContext';
import type { UseBackgammonGameReturn, GameResult } from './useBackgammonGame';

export interface UseGamePersistenceOptions {
    game: UseBackgammonGameReturn;
    isMultiplayerActive: boolean;
    t: (key: string) => string;
}

export function useGamePersistence({ game, isMultiplayerActive, t }: UseGamePersistenceOptions) {
    const gameIdRef = useRef<string>('');
    const moveCountRef = useRef<number>(0);
    const turnsHistoryRef = useRef<RawGameTurn[]>([]);
    const currentTurnMovesRef = useRef<{ from: number; to: number }[]>([]);
    const turnBoardBeforeRef = useRef<number[]>([]);
    const currentTurnDiceRef = useRef<[number, number] | null>(null);
    const [latestGameAnalysis, setLatestGameAnalysis] = useState<CompleteGameAnalysis | null>(null);

    // Initialisation d'une nouvelle session locale persistée
    useEffect(() => {
        const id = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        gameIdRef.current = id;
        moveCountRef.current = 0;
        const now = new Date().toISOString();
        persistNewGame({
            id,
            opponent_type: isMultiplayerActive ? 'human' : 'ai',
            opponent_difficulty: isMultiplayerActive ? null : game.difficulty,
            match_length: game.state.matchLength,
            score_x: game.state.scoreX, score_o: game.state.scoreO,
            cube_value: game.state.cubeValue, cube_owner: game.state.cubeOwner,
            is_crawford: game.state.crawford, status: 'in_progress',
            started_at: now, created_at: now, updated_at: now,
        }).catch(() => { });
    }, [isMultiplayerActive]);

    // Enregistrement du début de tour pour X
    useEffect(() => {
        if (game.dice && game.state.turn === 'X') {
            turnBoardBeforeRef.current = [...game.state.board];
            currentTurnDiceRef.current = game.dice;
            currentTurnMovesRef.current = [];
        }
    }, [game.dice, game.state.turn]);

    // Enregistrement du tour de X dans l'historique quand le tour passe à O
    useEffect(() => {
        if (game.state.turn === 'O' && currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            turnsHistoryRef.current.push({
                turnNumber: turnsHistoryRef.current.length + 1,
                player: 'X',
                dice: currentTurnDiceRef.current,
                boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : game.state.board,
                boardAfter: [...game.state.board],
                moves: [...currentTurnMovesRef.current],
            });
            currentTurnMovesRef.current = [];
        }
    }, [game.state.turn, game.state.board]);

    // Enregistrement des coups joués par l'ordinateur en solo
    useEffect(() => {
        if (!isMultiplayerActive && game.lastOpponentDice) {
            const notation = game.lastOpponentMoves && game.lastOpponentMoves.length > 0
                ? formatMoveSequenceNotationAbsolute(game.lastOpponentMoves, 'O')
                : t('game.noMovePossible');
            toast.info(`L’ordinateur (O) a joué [${game.lastOpponentDice[0]}, ${game.lastOpponentDice[1]}] : ${notation}`, 'Tour de l’adversaire');

            if (game.lastOpponentMoves && game.lastOpponentMoves.length > 0) {
                moveCountRef.current += 1;
                turnsHistoryRef.current.push({
                    turnNumber: turnsHistoryRef.current.length + 1,
                    player: 'O',
                    dice: [game.lastOpponentDice[0], game.lastOpponentDice[1]],
                    boardBefore: game.state.board,
                    boardAfter: game.state.board,
                    moves: game.lastOpponentMoves,
                });
                persistMove({
                    id: `mv_${Date.now()}_${moveCountRef.current}`,
                    game_id: gameIdRef.current || 'game_default',
                    move_number: moveCountRef.current,
                    player: 'O',
                    dice: [game.lastOpponentDice[0], game.lastOpponentDice[1]],
                    move_notation: notation,
                    board_before: game.state.board,
                    board_after: game.state.board,
                    played_at: new Date().toISOString(),
                }).catch(() => { });
            }
        }
    }, [game.lastOpponentDice, game.lastOpponentMoves, isMultiplayerActive, t]);

    // Analyse complète de fin de partie
    const handleGameOverAnalysis = useCallback((result: GameResult) => {
        if (gameIdRef.current) {
            persistGameUpdate(gameIdRef.current, {
                status: 'completed',
                winner: result.winner,
                win_type: result.winType,
                points_won: result.pointsWon,
                score_x: game.state.scoreX,
                score_o: game.state.scoreO,
                ended_at: new Date().toISOString(),
            }).catch(() => { });
        }

        if (currentTurnMovesRef.current.length > 0 && currentTurnDiceRef.current) {
            turnsHistoryRef.current.push({
                turnNumber: turnsHistoryRef.current.length + 1,
                player: 'X',
                dice: currentTurnDiceRef.current,
                boardBefore: turnBoardBeforeRef.current.length > 0 ? turnBoardBeforeRef.current : game.state.board,
                boardAfter: [...game.state.board],
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
                scoreX: game.state.scoreX,
                scoreO: game.state.scoreO,
                matchLength: game.state.matchLength,
            });
            saveGameAnalysis(analysis);
            setLatestGameAnalysis(analysis);
        } catch (e) {
            console.warn('[Persistence] Échec analyse fin de partie :', e);
        }
    }, [game.state, isMultiplayerActive]);

    // Chargement automatique depuis l'URL (?xgid=...)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const sharedXgid = new URLSearchParams(window.location.search).get('xgid');
            if (sharedXgid) {
                const parsed = parseFromXGID(sharedXgid);
                game.applyRemoteState({
                    board: parsed.board,
                    dice: parsed.dice,
                    turn: parsed.turn,
                    cubeValue: parsed.cubeValue,
                    cubeOwner: parsed.cubeOwner,
                    phase: parsed.dice ? 'PLAYING_MOVES' : 'WAITING_FOR_ROLL',
                    usedDice: [false, false],
                });
                toast.success('Position XGID partagée chargée avec succès !', 'Lien de partage');
                window.history.replaceState({}, '', window.location.pathname);
            }
        } catch (err) {
            console.warn('[Persistence] Erreur paramètre XGID partagé :', err);
        }
    }, [game.applyRemoteState]);

    const resetGameHistory = useCallback(() => {
        turnsHistoryRef.current = [];
        setLatestGameAnalysis(null);
    }, []);

    return {
        gameIdRef,
        turnsHistoryRef,
        currentTurnMovesRef,
        turnBoardBeforeRef,
        currentTurnDiceRef,
        latestGameAnalysis,
        setLatestGameAnalysis,
        handleGameOverAnalysis,
        resetGameHistory,
    };
}
