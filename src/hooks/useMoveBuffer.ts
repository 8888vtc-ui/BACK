'use client';

/**
 * Hook React de Buffer d'Actions & Pre-Move non-bloquant (Audit 6 / 20 — useMoveBuffer).
 *
 * Responsabilités :
 *   1. File FIFO non-bloquante permettant d'enchaîner jusqu'à 2 coups d'avance pendant
 *      l'animation du pion précédent (`ACTION_QUEUE_INTERVAL_MS = 120 ms`).
 *   2. Purge immédiate si l'état du plateau rend le coup suivant illégal ou si l'adversaire
 *      prend la main (`OPPONENT_TURN` / `ILLEGAL_MOVE`).
 *   3. Garantie de 0 input-drop à 5 clics/seconde (intervalle de 200 ms > 120 ms de dépilement).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '../engine/backgammonEngine';
import {
    ACTION_QUEUE_INTERVAL_MS,
    MAX_PREMOVE_AHEAD,
    MoveActionQueue,
    type ActionQueueSnapshot,
    type MoveLegalityValidator,
    type QueuePurgeReason,
} from '../engine/actionQueue';

export interface UseMoveBufferParams {
    /** Joueur actuellement au trait. */
    activePlayer: Player;
    /** Phase de jeu courante. */
    gamePhase?: string;
    /** Cibles légales du dé gauche (pour validation dynamique avant dépilement). */
    leftDieTargets?: ReadonlyMap<number, readonly number[]>;
    /** Cibles légales du dé droit (pour validation dynamique avant dépilement). */
    rightDieTargets?: ReadonlyMap<number, readonly number[]>;
    /** Callback exécutant réellement le coup sur le moteur. */
    onExecuteMove: (from: number, to: number, die?: 0 | 1) => void;
    /** Validateur personnalisé optionnel appelé juste avant l'exécution d'un coup bufferisé. */
    validateMove?: MoveLegalityValidator;
    /** Intervalle de cadence entre deux coups enchaînés (défaut : `120 ms`). */
    intervalMs?: number;
    /** Capacité maximale de coups en attente (défaut : `2`). */
    maxAhead?: number;
}

export interface UseMoveBufferResult {
    /** Enfile ou exécute immédiatement un coup `(from -> to)` sans aucun input-drop. */
    enqueueMove: (from: number, to: number, die?: 0 | 1) => boolean;
    /** Purge manuellement tous les pre-moves en attente. */
    purgeBuffer: (reason?: QueuePurgeReason) => void;
    /** État courant de la file d'attente FIFO. */
    snapshot: ActionQueueSnapshot;
}

export function useMoveBuffer({
    activePlayer,
    gamePhase = 'HUMAN_MOVING',
    leftDieTargets,
    rightDieTargets,
    onExecuteMove,
    validateMove,
    intervalMs = ACTION_QUEUE_INTERVAL_MS,
    maxAhead = MAX_PREMOVE_AHEAD,
}: UseMoveBufferParams): UseMoveBufferResult {
    const queueRef = useRef<MoveActionQueue>(new MoveActionQueue(maxAhead));
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [snapshot, setSnapshot] = useState<ActionQueueSnapshot>(() =>
        queueRef.current.getSnapshot(),
    );

    const activePlayerRef = useRef<Player>(activePlayer);
    const leftTargetsRef = useRef(leftDieTargets);
    const rightTargetsRef = useRef(rightDieTargets);
    const onExecuteMoveRef = useRef(onExecuteMove);
    const validateMoveRef = useRef(validateMove);

    activePlayerRef.current = activePlayer;
    leftTargetsRef.current = leftDieTargets;
    rightTargetsRef.current = rightDieTargets;
    onExecuteMoveRef.current = onExecuteMove;
    validateMoveRef.current = validateMove;

    const syncSnapshot = useCallback(() => {
        setSnapshot(queueRef.current.getSnapshot());
    }, []);

    const clearStepTimer = useCallback(() => {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const purgeBuffer = useCallback(
        (reason: QueuePurgeReason = 'MANUAL_CLEAR') => {
            clearStepTimer();
            queueRef.current.purge(reason);
            syncSnapshot();
        },
        [clearStepTimer, syncSnapshot],
    );

    const scheduleNextStep = useCallback(() => {
        clearStepTimer();
        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            const validator: MoveLegalityValidator = (action) => {
                if (validateMoveRef.current) {
                    return validateMoveRef.current(action);
                }
                return MoveActionQueue.isMoveLegalInTargets(
                    action,
                    leftTargetsRef.current,
                    rightTargetsRef.current,
                );
            };

            const { action } = queueRef.current.dequeueNext(
                activePlayerRef.current,
                validator,
            );
            syncSnapshot();

            if (action) {
                onExecuteMoveRef.current(action.from, action.to, action.die);
                scheduleNextStep();
            }
        }, Math.max(1, intervalMs));
    }, [clearStepTimer, intervalMs, syncSnapshot]);

    const enqueueMove = useCallback(
        (from: number, to: number, die?: 0 | 1): boolean => {
            if (intervalMs <= 0) {
                onExecuteMoveRef.current(from, to, die);
                return true;
            }

            const res = queueRef.current.enqueue({
                from,
                to,
                die,
                player: activePlayerRef.current,
            });
            syncSnapshot();

            if (res.executeImmediately) {
                onExecuteMoveRef.current(from, to, die);
                scheduleNextStep();
            } else if (res.accepted && timerRef.current === null) {
                scheduleNextStep();
            }

            return res.accepted;
        },
        [intervalMs, scheduleNextStep, syncSnapshot],
    );

    // Purge immédiate si l'adversaire prend la main ou si le tour se termine
    const prevPlayerRef = useRef<Player>(activePlayer);
    useEffect(() => {
        if (prevPlayerRef.current !== activePlayer) {
            prevPlayerRef.current = activePlayer;
            if (queueRef.current.size() > 0 || queueRef.current.isProcessing()) {
                purgeBuffer('OPPONENT_TURN');
            }
            return;
        }
        if (
            gamePhase === 'AI_TURN_ROLLING' ||
            gamePhase === 'AI_TURN_SHOWING_ARROWS' ||
            gamePhase === 'OPPONENT_THINKING' ||
            gamePhase === 'GAME_OVER'
        ) {
            if (queueRef.current.size() > 0 || queueRef.current.isProcessing()) {
                purgeBuffer('OPPONENT_TURN');
            }
        }
    }, [activePlayer, gamePhase, purgeBuffer]);

    useEffect(() => () => clearStepTimer(), [clearStepTimer]);

    return {
        enqueueMove,
        purgeBuffer,
        snapshot,
    };
}

export default useMoveBuffer;
