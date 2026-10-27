/**
 * @file src/hooks/useGameSessionControl.ts
 * @description Contrôle de session (vitesse de jeu, provably fair, timers d'orchestration, notification de fin de partie)
 * pour useBackgammonGame (< 200 lignes, 0 any).
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameResult } from '../engine/aiHeuristics';
import { type GameSpeed } from '../lib/gameFeel/speedPresets';
import { getSavedGameSpeed, saveGameSpeed } from '../lib/settings/gameplaySettings';
import {
    createProvablyFairSession,
    type ProvablyFairSessionState,
} from '../lib/crypto/provablyFairRng';
import { sensoryFeedbackController } from '../lib/sound/SensoryFeedbackController';

export interface UseGameSessionControlParams {
    explicitGameSpeed?: GameSpeed;
    onGameOver?: (result: GameResult) => void;
    provablyFairState?: ProvablyFairSessionState;
    gameResult: GameResult | null;
}

export function useGameSessionControl({
    explicitGameSpeed,
    onGameOver,
    provablyFairState,
    gameResult,
}: UseGameSessionControlParams) {
    const [gameSpeed, setGameSpeedState] = useState<GameSpeed>(() => explicitGameSpeed ?? getSavedGameSpeed());
    useEffect(() => {
        if (explicitGameSpeed !== undefined) setGameSpeedState(explicitGameSpeed);
    }, [explicitGameSpeed]);
    const gameSpeedRef = useRef<GameSpeed>(gameSpeed);
    gameSpeedRef.current = gameSpeed;
    const setGameSpeed = useCallback((speed: GameSpeed) => {
        setGameSpeedState(speed);
        saveGameSpeed(speed);
    }, []);

    const onGameOverRef = useRef(onGameOver);
    useEffect(() => { onGameOverRef.current = onGameOver; }, [onGameOver]);
    const lastReportedGameResultRef = useRef<GameResult | null>(null);
    useEffect(() => {
        if (gameResult && gameResult !== lastReportedGameResultRef.current) {
            lastReportedGameResultRef.current = gameResult;
            onGameOverRef.current?.(gameResult);
        } else if (!gameResult) {
            lastReportedGameResultRef.current = null;
        }
    }, [gameResult]);

    const currentProvablyFair = provablyFairState ?? createProvablyFairSession();
    const provablyFairRef = useRef<ProvablyFairSessionState>(currentProvablyFair);
    provablyFairRef.current = currentProvablyFair;

    const opponentTurnInProgressRef = useRef(false);
    const opponentTimersRef = useRef<NodeJS.Timeout[]>([]);
    const opponentTurnTokenRef = useRef<number>(0);
    const humanTimersRef = useRef<NodeJS.Timeout[]>([]);

    const clearOpponentTimers = useCallback(() => {
        opponentTurnTokenRef.current += 1;
        opponentTimersRef.current.forEach(clearTimeout);
        opponentTimersRef.current = [];
    }, []);

    const clearHumanTimers = useCallback(() => {
        humanTimersRef.current.forEach(clearTimeout);
        humanTimersRef.current = [];
    }, []);

    useEffect(() => () => {
        opponentTurnInProgressRef.current = false;
        clearOpponentTimers();
        clearHumanTimers();
        sensoryFeedbackController.cancelScheduledTimers();
    }, [clearOpponentTimers, clearHumanTimers]);

    return {
        gameSpeed,
        setGameSpeed,
        gameSpeedRef,
        currentProvablyFair,
        provablyFairRef,
        opponentTurnInProgressRef,
        opponentTimersRef,
        opponentTurnTokenRef,
        humanTimersRef,
        clearOpponentTimers,
        clearHumanTimers,
    };
}
