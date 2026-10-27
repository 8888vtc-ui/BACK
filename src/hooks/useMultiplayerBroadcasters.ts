'use client';

import { useCallback } from 'react';
import type { Player, Move } from '../engine/backgammonEngine';
import type { MultiplayerMatchInfo } from '../features/multiplayer/types';
import type { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import {
    switchClockTurn,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';

export interface UseMultiplayerBroadcastersParams {
    matchInfo: MultiplayerMatchInfo | null;
    realtimeRef: React.MutableRefObject<MultiplayerRealtimeManager | null>;
    currentTurnRef: React.MutableRefObject<Player>;
    clockConfigRef: React.MutableRefObject<ClockConfig>;
    setClockState: React.Dispatch<React.SetStateAction<MatchClockState | null>>;
    setQuickChatMessage: React.Dispatch<
        React.SetStateAction<{ player: Player; messageId: string } | null>
    >;
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
}

export function useMultiplayerBroadcasters({
    matchInfo,
    realtimeRef,
    currentTurnRef,
    clockConfigRef,
    setClockState,
    setQuickChatMessage,
    handleMatchOver,
}: UseMultiplayerBroadcastersParams) {
    const broadcastResign = useCallback(
        (reason: 'surrender' | 'timeout' | 'disconnect' = 'surrender') => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'RESIGNED',
                player: matchInfo.localRole,
                reason,
                timestamp: Date.now(),
            });
            const winner = matchInfo.localRole === 'X' ? 'O' : 'X';
            handleMatchOver(winner, reason, 1);
        },
        [matchInfo, realtimeRef, handleMatchOver],
    );

    const broadcastDiceRolled = useCallback(
        (dice: [number, number]) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DICE_ROLLED',
                player: matchInfo.localRole,
                dice,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef],
    );

    const broadcastMovePlayed = useCallback(
        (move: Move, newBoard: number[], usedDice: [boolean, boolean] | boolean[]) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'CHECKER_MOVED',
                player: matchInfo.localRole,
                move,
                board: newBoard,
                usedDice,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef],
    );

    const broadcastTurnFinished = useCallback(
        (nextTurn: Player) => {
            if (!matchInfo || !realtimeRef.current) return;
            currentTurnRef.current = nextTurn;
            realtimeRef.current.sendAction({
                type: 'TURN_FINISHED',
                player: matchInfo.localRole,
                nextTurn,
                timestamp: Date.now(),
            });

            setClockState((prev) => {
                if (!prev) return null;
                const updated = switchClockTurn(prev, nextTurn, clockConfigRef.current, Date.now());
                realtimeRef.current?.sendAction({
                    type: 'CLOCK_SYNC',
                    player: matchInfo.localRole,
                    bankXMs: updated.bankXMs,
                    bankOMs: updated.bankOMs,
                    delayRemainingMs: updated.delayRemainingMs,
                    activePlayer: updated.activePlayer,
                    turnStartedAt: updated.turnStartedAt,
                    isFlagFallen: updated.isFlagFallen,
                    timestamp: Date.now(),
                });
                return updated;
            });
        },
        [matchInfo, realtimeRef, currentTurnRef, clockConfigRef, setClockState],
    );

    const broadcastDoubleOffered = useCallback(
        (cubeValue: number) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_OFFERED',
                player: matchInfo.localRole,
                cubeValue,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef],
    );

    const broadcastDoubleAccepted = useCallback(
        (cubeValue: number) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_ACCEPTED',
                player: matchInfo.localRole,
                cubeValue,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef],
    );

    const broadcastDoublePassed = useCallback(
        (winner: Player) => {
            if (!matchInfo || !realtimeRef.current) return;
            realtimeRef.current.sendAction({
                type: 'DOUBLE_PASSED',
                player: matchInfo.localRole,
                winner,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef],
    );

    const sendQuickChat = useCallback(
        (messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => {
            if (!matchInfo || !realtimeRef.current) return;
            setQuickChatMessage({ player: matchInfo.localRole, messageId });
            setTimeout(() => setQuickChatMessage(null), 3000);
            realtimeRef.current.sendAction({
                type: 'QUICK_CHAT',
                player: matchInfo.localRole,
                messageId,
                timestamp: Date.now(),
            });
        },
        [matchInfo, realtimeRef, setQuickChatMessage],
    );

    return {
        broadcastResign,
        broadcastDiceRolled,
        broadcastMovePlayed,
        broadcastTurnFinished,
        broadcastDoubleOffered,
        broadcastDoubleAccepted,
        broadcastDoublePassed,
        sendQuickChat,
    };
}
