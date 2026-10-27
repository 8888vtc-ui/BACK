/**
 * @file src/hooks/useMultiplayerActions.ts
 * @description Actions de diffusion et de communication temps réel pour le mode multijoueur (< 200 lignes, 0 any).
 */
import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import type { Player, Move } from '../engine/backgammonEngine';
import type { MultiplayerMatchInfo } from '../features/multiplayer/types';
import type { MultiplayerRealtimeManager } from '../features/multiplayer/realtimeChannel';
import type { MatchClockState, ClockConfig } from '../features/multiplayer/clockManager';
import { switchClockTurn } from '../features/multiplayer/clockManager';

export interface UseMultiplayerActionsParams {
    matchInfo: MultiplayerMatchInfo | null;
    realtimeRef: MutableRefObject<MultiplayerRealtimeManager | null>;
    currentTurnRef: MutableRefObject<Player>;
    clockConfigRef: MutableRefObject<ClockConfig>;
    setClockState: Dispatch<SetStateAction<MatchClockState | null>>;
    setQuickChatMessage: Dispatch<SetStateAction<{ player: Player; messageId: string } | null>>;
    handleMatchOver: (winner: Player, winType: string, pointsWon: number) => void;
}

export function useMultiplayerActions({
    matchInfo,
    realtimeRef,
    currentTurnRef,
    clockConfigRef,
    setClockState,
    setQuickChatMessage,
    handleMatchOver,
}: UseMultiplayerActionsParams) {
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

            // Passage de tour sur la pendule de match et synchronisation broadcast
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
        broadcastDiceRolled,
        broadcastMovePlayed,
        broadcastTurnFinished,
        broadcastDoubleOffered,
        broadcastDoubleAccepted,
        broadcastDoublePassed,
        broadcastResign,
        sendQuickChat,
    };
}
