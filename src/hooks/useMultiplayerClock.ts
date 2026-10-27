/**
 * @file src/hooks/useMultiplayerClock.ts
 * @description Gestion de la pendule de match (WBF delay / flag fall) et du chronomètre de tour pour le mode multijoueur (< 200 lignes, 0 any).
 */
import { useState, useEffect, useRef, type MutableRefObject } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { MatchmakingState, MultiplayerMatchInfo } from '../features/multiplayer/types';
import {
    computeClockTick,
    pauseClock,
    resumeClock,
    getRecommendedClockConfig,
    type MatchClockState,
    type ClockConfig,
} from '../features/multiplayer/clockManager';
import { fetchRecoverableRoomSnapshot } from '../features/multiplayer/sessionRecovery';

export const TURN_TIME_LIMIT_SECONDS = 45;

export interface UseMultiplayerClockParams {
    status: MatchmakingState;
    matchInfo: MultiplayerMatchInfo | null;
    currentTurnRef: MutableRefObject<Player>;
    onTimeout: (reason: 'timeout') => void;
}

export function useMultiplayerClock({
    status,
    matchInfo,
    currentTurnRef,
    onTimeout,
}: UseMultiplayerClockParams) {
    const [clockState, setClockState] = useState<MatchClockState | null>(null);
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(TURN_TIME_LIMIT_SECONDS);
    const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
    const clockConfigRef = useRef<ClockConfig>(getRecommendedClockConfig(7, 'delay'));
    const turnTimerRef = useRef<ReturnType<typeof setInterval>>(null);

    // Écouteurs de perte / reprise de connexion réseau
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

    // Ticking précis de la pendule de match (WBF delay / flag fall)
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
                        onTimeout('timeout');
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
    }, [status, hasClockState, isClockPaused, isClockFlagFallen, matchInfo, onTimeout]);

    // Horloge de réflexion par tour (45s)
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

    // Détection d'expiration du temps de jeu
    useEffect(() => {
        if (turnTimeRemaining === 0 && status === 'connected' && matchInfo) {
            const isLocalPlayerTurn = matchInfo.localRole === currentTurnRef.current;
            if (isLocalPlayerTurn) {
                onTimeout('timeout');
            }
        }
    }, [turnTimeRemaining, status, matchInfo, currentTurnRef, onTimeout]);

    const resetTurnTimer = () => {
        setTurnTimeRemaining(TURN_TIME_LIMIT_SECONDS);
    };

    const clearTimers = () => {
        if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };

    return {
        clockState,
        setClockState,
        turnTimeRemaining,
        setTurnTimeRemaining,
        isReconnecting,
        setIsReconnecting,
        clockConfigRef,
        resetTurnTimer,
        clearTimers,
    };
}
