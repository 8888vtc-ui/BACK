import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { RawGameTurn } from '../../features/rating';
import { persistMove } from '../../lib/offline/persistenceService';
import { formatMoveSequenceNotationAbsolute } from '../../lib/engine/evaluator';
import type { GamePhase } from '../gameStateReducer';

export interface UseTurnHistoryRecorderParams {
    gameIdRef: MutableRefObject<string>;
    moveCountRef: MutableRefObject<number>;
    turnsHistoryRef: MutableRefObject<RawGameTurn[]>;
    currentTurnMovesRef: MutableRefObject<{ from: number; to: number }[]>;
    turnBoardBeforeRef: MutableRefObject<number[]>;
    currentTurnDiceRef: MutableRefObject<[number, number] | null>;
    gameBoard: number[];
    gameTurn: Player;
    gameDice: [number, number] | null;
    gamePhase: GamePhase;
    lastOpponentDice: [number, number] | null;
    lastOpponentMoves: { from: number; to: number }[] | null;
    isMultiplayerActive: boolean;
    t: (key: string) => string;
}

export function useTurnHistoryRecorder({
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
}: UseTurnHistoryRecorderParams) {
    const [turnsHistory, setTurnsHistory] = useState<RawGameTurn[]>([]);
    const turnBoardBeforeRefO = useRef<number[]>([]);
    const lastRecordedOpponentKeyRef = useRef<string | null>(null);
    const lastRecordedPlayerKeyRef = useRef<string | null>(null);
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
    }, [gameDice, gameTurn, gameBoard, currentTurnDiceRef, currentTurnMovesRef, turnBoardBeforeRef]);

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
    }, [gameTurn, gameBoard, currentTurnDiceRef, currentTurnMovesRef, turnBoardBeforeRef, turnsHistoryRef]);

    useEffect(() => {
        if (!isMultiplayerActive && lastOpponentDice && lastOpponentMoves !== null && gamePhase !== 'OPPONENT_THINKING' && gameTurn === 'X') {
            const opponentKey = `${turnsHistoryRef.current.length}:${lastOpponentDice[0]}-${lastOpponentDice[1]}:${(lastOpponentMoves ?? []).map((m) => `${m.from}/${m.to}`).join(' ')}`;
            if (lastRecordedOpponentKeyRef.current === opponentKey) return;
            lastRecordedOpponentKeyRef.current = opponentKey;

            const hasMoves = Boolean(lastOpponentMoves && lastOpponentMoves.length > 0);
            const notation = hasMoves ? formatMoveSequenceNotationAbsolute(lastOpponentMoves!, 'O') : t('game.noMovePossible');

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
    }, [lastOpponentDice, lastOpponentMoves, gamePhase, gameTurn, gameBoard, isMultiplayerActive, t, gameIdRef, moveCountRef, turnsHistoryRef]);

    const resetTurnHistory = () => {
        turnsHistoryRef.current = [];
        setTurnsHistory([]);
        lastRecordedOpponentKeyRef.current = null;
        lastRecordedPlayerKeyRef.current = null;
    };

    return {
        turnsHistory,
        setTurnsHistory,
        resetTurnHistory,
    };
}
