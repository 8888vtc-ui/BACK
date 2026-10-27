'use client';

/**
 * Hook d'orchestration du glisser-déposer (Drag & Drop) sur le plateau de Backgammon.
 * Gère la détection des cibles légales à la volée, le retour haptique et l'application des coups.
 * Conforme à SCALABILITY.md (< 120 lignes).
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { useCheckerDragAndDrop } from '../../hooks/useCheckerDragAndDrop';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import { resolveDestinationClick, type SubMove } from '../../engine/smartClickResolver';

export interface UseBoardDragAndDropOptions {
    ghostDestinations: Set<number>;
    leftDieTargets?: Map<number, number[]>;
    rightDieTargets?: Map<number, number[]>;
    legalSequences: SubMove[][];
    selectedPoint: number | null;
    board: ReadonlyArray<number>;
    player: Player;
    prepareFlipForStep: (from?: number) => void;
    handlePlayMoveWithFlip?: (from: number, to: number, die?: 0 | 1) => void;
    handleDestinationClickWithFlip: (to: number) => void;
}

export function useBoardDragAndDrop({
    ghostDestinations,
    leftDieTargets,
    rightDieTargets,
    legalSequences,
    selectedPoint,
    board,
    player,
    prepareFlipForStep,
    handlePlayMoveWithFlip,
    handleDestinationClickWithFlip,
}: UseBoardDragAndDropOptions) {
    const [dragSourcePoint, setDragSourcePoint] = useState<number | null>(null);
    const suppressClickAfterDragRef = useRef(false);

    const computeTargetsForSource = useCallback(
        (sourcePt: number | null): Set<number> => {
            if (sourcePt === null) return ghostDestinations;
            const left = leftDieTargets?.get(sourcePt) ?? [];
            const right = rightDieTargets?.get(sourcePt) ?? [];
            const targets = new Set([...left, ...right]);
            for (const seq of legalSequences) {
                if (seq.length < 2 || seq[0].from !== sourcePt) continue;
                for (let i = 1; i < seq.length && seq[i].from === seq[i - 1].to; i++) targets.add(seq[i].to);
            }
            return targets;
        },
        [ghostDestinations, leftDieTargets, rightDieTargets, legalSequences],
    );

    const activeLegalDestinations = useMemo(
        () => computeTargetsForSource(dragSourcePoint ?? selectedPoint),
        [computeTargetsForSource, dragSourcePoint, selectedPoint],
    );

    const {
        dragState,
        overlayRef,
        handlePointerDown: onCheckerDragStart,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
    } = useCheckerDragAndDrop({
        legalDestinations: activeLegalDestinations,
        resolveLegalDestinations: computeTargetsForSource,
        onDragStart: (fromPt) => {
            setDragSourcePoint(fromPt);
            sensoryFeedbackController.triggerCheckerLift(0.8);
        },
        onDropMove: (from, to) => {
            suppressClickAfterDragRef.current = true;
            setDragSourcePoint(null);
            prepareFlipForStep(from);
            if (!handlePlayMoveWithFlip) {
                handleDestinationClickWithFlip(to);
                return;
            }
            const isSingle = (leftDieTargets?.get(from) ?? []).includes(to) || (rightDieTargets?.get(from) ?? []).includes(to);
            if (isSingle) {
                handlePlayMoveWithFlip(from, to);
                return;
            }
            const res = resolveDestinationClick(
                { legalSequences, board: [...board], player, selectedSource: from, higherDieFirst: true },
                to,
            );
            if (res.kind !== 'none') res.moves.forEach((m) => handlePlayMoveWithFlip(m.from, m.to));
        },
        onTapPoint: () => setDragSourcePoint(null),
        onCancelDrag: () => {
            suppressClickAfterDragRef.current = true;
            setDragSourcePoint(null);
        },
    });

    const boardGhostDestinations = dragState.isDragging ? activeLegalDestinations : ghostDestinations;

    return {
        dragState,
        overlayRef,
        onCheckerDragStart,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        boardGhostDestinations,
        dragSourcePoint,
        suppressClickAfterDragRef,
    };
}
