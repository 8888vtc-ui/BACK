'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { MultiplayerMatchInfo, MatchmakingState } from '../features/multiplayer/types';
import {
    computeClockTick,
    pauseClock,
    resumeClock,
    getRecommendedClockConfig,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';
import {
    loadActiveSession,
    touchActiveSession,
    isSessionRecoverable,
    fetchRecoverableRoomSnapshot,
    type ActiveGameSession,
} from '../features/multiplayer/sessionRecovery';

export const TURN_TIME_LIMIT_SECONDS = 45;
export const DISCONNECT_GRACE_SECONDS = 45;

export interface UseMultiplayerClockAndTimersParams {
    status: MatchmakingState;
    matchInfo: MultiplayerMatchInfo | null;
    currentTurnRef: React.MutableRefObject<Player>;
    onTimeoutResign: () => void;
    onDisconnectForfeit: (winner: Player) => void;
}

export function useMultiplayerClockAndTimers({
    status,
    matchInfo,
    currentTurnRef,
    onTimeoutResign,
    onDisconnectForfeit,
}: UseMultiplayerClockAndTimersParams) {
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(TURN_TIME_LIMIT_SECONDS);
    const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
    const [clockState, setClockState] = useState<MatchClockState | null>(null);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const [recoverableSession, setRecoverableSession] = useState<ActiveGameSession | null>(null);

    const clockConfigRef = useRef<ClockConfig>(getRecommendedClockConfig(7, 'delay'));
    const turnTimerRef = useRef<ReturnType<typeof setInterval>>(null);
    const disconnectTimerRef = useRef<ReturnType<typeof setInterval>>(null);

    useEffect(() => {
        const saved = loadActiveSession();
        if (saved && isSessionRecoverable(saved)) {
            setRecoverableSession(saved);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOffline = () => {
            if (status === 'connected') {
                setIsReconnecting(true);
                setClockState((prev) => (prev ? pauseClock(prev) : null));
            }
        };

        const handleOnline = async () => {
            if (status === 'connected' || isReconnecting) {
                setIsReconnecting(true);
                if (matchInfo) {
                    await fetchRecoverableRoomSnapshot(matchInfo.roomId);
                }
                setClockState((prev) => (prev ? resumeClock(prev) : null));
                setIsReconnecting(false);
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [status, isReconnecting, matchInfo]);

    const hasClockState = clockState !== null;
    const isClockPaused = clockState?.isPaused ?? false;
    const isClockFlagFallen = clockState?.isFlagFallen ?? false;

    useEffect(() => {
        if (status !== 'connected' || !hasClockState || isClockPaused || isClockFlagFallen) {
            return;
        }

        const interval = setInterval(() => {
            setClockState((prev) => {
                if (!prev || prev.isPaused || prev.isFlagFallen) return prev;
                const tick = computeClockTick(prev, Date.now());

                if (tick.isFlagFallen && !prev.isFlagFallen) {
                    if (matchInfo && tick.flagFallenPlayer === matchInfo.localRole) {
                        onTimeoutResign();
                    } else if (matchInfo && tick.flagFallenPlayer) {
                        onDisconnectForfeit(matchInfo.localRole);
                    }
                    return {
                        ...prev,
                        bankXMs: tick.bankXMs,
                        bankOMs: tick.bankOMs,
                        isFlagFallen: true,
                        flagFallenPlayer: tick.flagFallenPlayer,
                    };
                }

                return {
                    ...prev,
                    bankXMs: tick.bankXMs,
                    bankOMs: tick.bankOMs,
                    delayRemainingMs: tick.delayRemainingMs,
                };
            });
        }, 500);

        return () => clearInterval(interval);
    }, [status, hasClockState, isClockPaused, isClockFlagFallen, matchInfo, onTimeoutResign]);

    useEffect(() => {
        if (status !== 'connected') return;
        const interval = setInterval(() => {
            touchActiveSession();
        }, 10000);
        return () => clearInterval(interval);
    }, [status]);

    useEffect(() => {
        if (status !== 'connected') {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
            return;
        }

        setTurnTimeRemaining(TURN_TIME_LIMIT_SECONDS);
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);

        turnTimerRef.current = setInterval(() => {
            setTurnTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(turnTimerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (turnTimerRef.current) clearInterval(turnTimerRef.current);
        };
    }, [status]);

    useEffect(() => {
        if (turnTimeRemaining === 0 && status === 'connected' && matchInfo) {
            if (matchInfo.localRole === currentTurnRef.current) {
                onTimeoutResign();
            }
        }
    }, [turnTimeRemaining, status, matchInfo, currentTurnRef, onTimeoutResign]);

    const startDisconnectCountdown = useCallback(() => {
        if (disconnectTimerRef.current) clearInterval(disconnectTimerRef.current);
        let secondsLeft = DISCONNECT_GRACE_SECONDS;
        setDisconnectCountdown(secondsLeft);

        disconnectTimerRef.current = setInterval(() => {
            secondsLeft -= 1;
            setDisconnectCountdown(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(disconnectTimerRef.current!);
                if (matchInfo) {
                    onDisconnectForfeit(matchInfo.localRole);
                }
            }
        }, 1000);
    }, [matchInfo, onDisconnectForfeit]);

    return {
        turnTimeRemaining,
        setTurnTimeRemaining,
        disconnectCountdown,
        setDisconnectCountdown,
        clockState,
        setClockState,
        isReconnecting,
        setIsReconnecting,
        recoverableSession,
        setRecoverableSession,
        clockConfigRef,
        turnTimerRef,
        disconnectTimerRef,
        startDisconnectCountdown,
    };
}
