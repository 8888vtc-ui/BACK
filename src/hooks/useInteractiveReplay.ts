'use client';

/**
 * Hook d'Historique Interactif & Replay Pas-à-Pas (Audit 18 / 20).
 *
 * Exigences :
 *   1. Navigation pas-à-pas dans l'historique des coups (Début, Précédent, Suivant, Direct)
 *      via timeline ou flèches avec aperçu fantôme (`ghostMoves`, `previewBoard`).
 *   2. Retour instantané au direct (`returnToLive`) sur action joueur, nouveau tour ou touche Échap.
 *   3. Formatage en notation officielle de tournoi (`24/18 13/9`, `bar/22`, `6/off`, `*` frappe).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Move } from '../engine/backgammonEngine';
import type { RawGameTurn } from '../features/rating';
import { formatStandardMoveSequence } from '../features/coach/coachMoveNotation';

export interface UseInteractiveReplayOptions {
    turnsHistory: readonly RawGameTurn[];
    liveBoard?: readonly number[];
    onReplayChange?: (turn: RawGameTurn | null, index: number | null) => void;
}

export interface UseInteractiveReplayReturn {
    /** Index du tour inspecté (0..N-1), ou `null` si l'affichage est en Direct (Live). */
    readonly replayIndex: number | null;
    /** Vrai si le joueur visualise la position en direct. */
    readonly isLive: boolean;
    /** Tour actuellement inspecté en mode Replay, ou `null` en Direct. */
    readonly selectedTurn: RawGameTurn | null;
    /** Plateau correspondant au tour inspecté (ou le plateau en direct si `isLive`). */
    readonly activeBoard: readonly number[] | null;
    /** Séquence de sous-coups fantômes du tour inspecté pour affichage des flèches sur le plateau. */
    readonly ghostMoves: readonly Move[];
    /** Notation officielle standard du tour inspecté (ex: `"24/18 13/9"`). */
    readonly officialNotation: string | null;
    readonly canStepPrev: boolean;
    readonly canStepNext: boolean;
    readonly selectTurnIndex: (index: number | null) => void;
    readonly stepFirst: () => void;
    readonly stepPrev: () => void;
    readonly stepNext: () => void;
    readonly returnToLive: () => void;
}

export function useInteractiveReplay({
    turnsHistory,
    liveBoard,
    onReplayChange,
}: UseInteractiveReplayOptions): UseInteractiveReplayReturn {
    const [replayIndex, setReplayIndex] = useState<number | null>(null);
    const prevLengthRef = useRef<number>(turnsHistory.length);

    const updateIndex = useCallback(
        (nextIndex: number | null) => {
            setReplayIndex(nextIndex);
            const turn =
                nextIndex !== null && nextIndex >= 0 && nextIndex < turnsHistory.length
                    ? turnsHistory[nextIndex]
                    : null;
            onReplayChange?.(turn, nextIndex);
        },
        [turnsHistory, onReplayChange],
    );

    // Retour instantané au direct dès qu'un nouveau tour est joué en direct
    useEffect(() => {
        if (turnsHistory.length !== prevLengthRef.current) {
            prevLengthRef.current = turnsHistory.length;
            if (replayIndex !== null) {
                updateIndex(null);
            }
        }
    }, [turnsHistory.length, replayIndex, updateIndex]);

    const returnToLive = useCallback(() => {
        updateIndex(null);
    }, [updateIndex]);

    const stepFirst = useCallback(() => {
        if (turnsHistory.length === 0) return;
        updateIndex(0);
    }, [turnsHistory.length, updateIndex]);

    const stepPrev = useCallback(() => {
        if (turnsHistory.length === 0) return;
        if (replayIndex === null) {
            updateIndex(turnsHistory.length - 1);
            return;
        }
        updateIndex(Math.max(0, replayIndex - 1));
    }, [turnsHistory.length, replayIndex, updateIndex]);

    const stepNext = useCallback(() => {
        if (replayIndex === null) return;
        if (replayIndex + 1 >= turnsHistory.length) {
            updateIndex(null);
            return;
        }
        updateIndex(replayIndex + 1);
    }, [replayIndex, turnsHistory.length, updateIndex]);

    const selectedTurn = useMemo(() => {
        if (replayIndex === null || replayIndex < 0 || replayIndex >= turnsHistory.length) {
            return null;
        }
        return turnsHistory[replayIndex];
    }, [replayIndex, turnsHistory]);

    const officialNotation = useMemo(() => {
        if (!selectedTurn) return null;
        return formatStandardMoveSequence(
            selectedTurn.moves,
            selectedTurn.player,
            selectedTurn.boardBefore,
        );
    }, [selectedTurn]);

    const activeBoard = useMemo(() => {
        if (selectedTurn) return selectedTurn.boardAfter;
        return liveBoard ?? null;
    }, [selectedTurn, liveBoard]);

    const ghostMoves = useMemo<readonly Move[]>(() => {
        if (!selectedTurn) return [];
        return selectedTurn.moves;
    }, [selectedTurn]);

    const isLive = replayIndex === null;
    const canStepPrev = turnsHistory.length > 0 && (isLive || replayIndex > 0);
    const canStepNext = !isLive;

    return {
        replayIndex,
        isLive,
        selectedTurn,
        activeBoard,
        ghostMoves,
        officialNotation,
        canStepPrev,
        canStepNext,
        selectTurnIndex: updateIndex,
        stepFirst,
        stepPrev,
        stepNext,
        returnToLive,
    };
}
