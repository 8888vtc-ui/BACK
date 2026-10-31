'use client';

import type React from 'react';
import { useCallback, useRef } from 'react';
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

    const lastChallengerReplyRef = useRef<'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks' | null>(null);

    const sendQuickChat = useCallback(
        (messageId: 'gg' | 'nice_move' | 'unlucky' | 'thinking' | 'thanks') => {
            if (!matchInfo) return;
            setQuickChatMessage({ player: matchInfo.localRole, messageId });
            setTimeout(() => setQuickChatMessage(null), 3200);
            if (realtimeRef.current) {
                realtimeRef.current.sendAction({
                    type: 'QUICK_CHAT',
                    player: matchInfo.localRole,
                    messageId,
                    timestamp: Date.now(),
                });
            } else if (matchInfo.isClubChallenger) {
                const oppRole: Player = matchInfo.localRole === 'X' ? 'O' : 'X';
                const replyPools: Record<typeof messageId, ReadonlyArray<typeof messageId>> = {
                    gg: ['thanks', 'gg', 'nice_move'],
                    nice_move: ['thanks', 'gg'],
                    thanks: ['gg', 'nice_move'],
                    unlucky: ['nice_move', 'gg', 'thanks'],
                    thinking: ['gg', 'thanks'],
                };
                const pool = replyPools[messageId];
                const chosen = pool.find((r) => r !== lastChallengerReplyRef.current) ?? pool[0]!;
                lastChallengerReplyRef.current = chosen;
                setTimeout(() => {
                    setQuickChatMessage({ player: oppRole, messageId: chosen });
                    setTimeout(() => setQuickChatMessage(null), 3200);
                }, 1800);
            }
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
