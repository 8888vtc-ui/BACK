'use client';

/**
 * Plateau de Backgammon de Tournoi (style Backgammon Galaxy / Snowie 4 Pro) —
 * Rendu HTML/Tailwind & SVG haute fidélité (< 300 lignes, 0 any).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Player, X_BAR, O_BAR, pipCount, borneOffCount } from '../../engine/backgammonEngine';
import { PipCountBadge } from './PipCountBadge';
import { BoardPlayfieldGrid } from './BoardPlayfieldGrid';
import { BoardQuadrantRow } from './BoardQuadrantRow';
import { BoardNumberRow } from './BoardNumberRow';
import { BoardDiceRiver } from './BoardDiceRiver';
import { CoachArrows } from './CoachArrows';
import { BoardCenterControls } from './BoardCenterControls';
import { BoardFrame, FeltSurface } from './BoardFrame';
import { BoardSkeleton } from './BoardSkeleton';
import { collectMovableSources, computeGhostDestinations, computeHoverTargets } from './boardHighlights';
import { useBoardPointInteractions } from '../../hooks/useBoardPointInteractions';
import type { BoardProps } from './boardTypes';
import { useI18n } from '../../lib/i18n';
import {
    getOrientedRows, toggleOrientation, getSavedOrientation, saveOrientation, type BoardOrientation,
} from './boardOrientation';
import { useCheckerDragAndDrop } from '../../hooks/useCheckerDragAndDrop';
import { useCheckerFlights, HIDDEN_X_BAR_KEY, HIDDEN_O_BAR_KEY } from '../../hooks/useCheckerFlights';
import { useBarReentry } from '../../hooks/useBarReentry';
import { useDiceAnimation } from '../../hooks/useDiceAnimation';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import { DraggedCheckerOverlay } from './DraggedCheckerOverlay';
import { FlyingCheckerOverlay } from './FlyingCheckerOverlay';
import {
    computeRemainingSequences,
    resolveDestinationClick,
    type SubMove,
} from '../../engine/smartClickResolver';

export { BoardQuadrantRow };
export type { BoardProps } from './boardTypes';

const BoardComponent: React.FC<BoardProps> = ({
    state, leftDieTargets, rightDieTargets, selectedPoint, selectedDie, usedDice,
    opponentDice = null, onCheckerClick, onCheckerRightClick,
    onDestinationClick, onSelectDie, onDiceClick, onDeselect, onPlayMove,
    coachHighlight = null, opponentHighlight = null, canDouble = false, doublingOfferedBy = null,
    onOfferDouble, onTakeDouble, onPassDouble, theme, isLoading = false,
    gamePhase = 'HUMAN_WAITING_ROLL', onRoll, onConfirm, onUndo,
    canUndo = false, canConfirm = false, autoConfirmEnabled = false, onToggleAutoConfirm,
    autoConfirmMode, onSelectAutoConfirmMode, onCycleAutoConfirmMode,
    isMatchStarted = true, swapColors = false, gameSpeed, onCycleGameSpeed,
}) => {
    const { t } = useI18n();
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;
    const boardContainerRef = useRef<HTMLDivElement | null>(null);

    const [orientation, setOrientation] = useState<BoardOrientation>('normal');
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [dragSourcePoint, setDragSourcePoint] = useState<number | null>(null);
    const suppressClickAfterDragRef = useRef(false);

    useEffect(() => {
        const saved = getSavedOrientation('normal');
        if (saved !== 'normal') setOrientation(saved);
    }, []);

    const { top: TOP_ROW, bottom: BOTTOM_ROW } = useMemo(() => getOrientedRows(orientation), [orientation]);

    const handleToggleOrientation = useCallback(() => {
        setOrientation((prev) => {
            const next = toggleOrientation(prev);
            saveOrientation(next);
            return next;
        });
    }, []);

    const pipCounts = useMemo(() => pipCount(board), [board]);
    const off = useMemo(() => ({ X: borneOffCount(board, 'X'), O: borneOffCount(board, 'O') }), [board]);
    const bar = useMemo(() => ({ X: Math.max(0, board[X_BAR]), O: Math.max(0, -board[O_BAR]) }), [board]);
    const diceAnimation = useDiceAnimation({
        dice: state.dice,
        onRollStartSound: () => {
            sensoryFeedbackController.triggerGranularDiceRoll();
        },
    });

    const { flights, hiddenAt, prepareFlipForStep, completeFlight } = useCheckerFlights({
        board, dice: state.dice, gameSpeed, orientation, swapColors, containerRef: boardContainerRef,
    });

    const seenHitFlightIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        for (const f of flights) {
            if (f.id.startsWith('flight-hit-') && !seenHitFlightIdsRef.current.has(f.id)) {
                seenHitFlightIdsRef.current.add(f.id);
                // f.delayMs dans useCheckerFlights correspond exactement à 75 % du vol de l'attaquant
                sensoryFeedbackController.scheduleBlotHitAtFlightApex(Math.round(f.delayMs / 0.75));
            }
        }
    }, [flights]);

    const barReentry = useBarReentry({
        board, player, dice: state.dice, usedDice, leftDieTargets, rightDieTargets, gamePhase,
        onAutoPassTurn: canUndo ? undefined : onConfirm,
    });

    const movableSources = useMemo(
        () => collectMovableSources(leftDieTargets, rightDieTargets, gamePhase, barReentry.isOnBar),
        [leftDieTargets, rightDieTargets, gamePhase, barReentry.isOnBar],
    );

    const ghostDestinations = useMemo(
        () =>
            computeGhostDestinations({
                isOnBar: barReentry.isOnBar, barPoint: barReentry.barPoint,
                legalEntryPoints: barReentry.legalEntryPoints, selectedPoint, selectedDie,
                leftDieTargets, rightDieTargets, dice: state.dice, gamePhase,
            }),
        [barReentry.isOnBar, barReentry.barPoint, barReentry.legalEntryPoints, selectedPoint, selectedDie, leftDieTargets, rightDieTargets, state.dice, gamePhase],
    );

    const isHumanMoving = gamePhase === 'HUMAN_MOVING';
    const legalSequences = useMemo<SubMove[][]>(
        () => (isHumanMoving ? computeRemainingSequences(board, player, state.dice, usedDice) : []),
        [isHumanMoving, board, player, state.dice, usedDice],
    );

    const hoverTargets = useMemo(
        () =>
            computeHoverTargets(
                barReentry.isOnBar ? barReentry.barPoint : (dragSourcePoint ?? selectedPoint ?? hoveredPoint),
                state.dice, selectedDie, leftDieTargets, rightDieTargets, legalSequences, board,
            ),
        [barReentry.isOnBar, barReentry.barPoint, dragSourcePoint, selectedPoint, hoveredPoint, state.dice, selectedDie, leftDieTargets, rightDieTargets, legalSequences, board],
    );

    const handlePlayMoveWithFlip = useMemo(() => {
        if (!onPlayMove) return undefined;
        return (from: number, to: number, die?: 0 | 1) => {
            prepareFlipForStep(from);
            onPlayMove(from, to, die);
        };
    }, [onPlayMove, prepareFlipForStep]);

    const handleDestinationClickWithFlip = useCallback(
        (to: number) => {
            prepareFlipForStep(selectedPoint ?? undefined);
            onDestinationClick(to);
        },
        [onDestinationClick, prepareFlipForStep, selectedPoint],
    );

    const {
        focusedPoint, handlePointClick, handlePointRightClick,
        handleBarClick, handleBarRightClick, handleOffClick, handleOffRightClick, handlePointFocus, handlePointKeyDown,
    } = useBoardPointInteractions({
        board, isX, bar, xBarPoint: X_BAR, oBarPoint: O_BAR, ghostDestinations, selectedPoint,
        leftDieTargets, rightDieTargets, dice: state.dice, selectedDie, legalSequences,
        onCheckerClick, onCheckerRightClick, onDestinationClick: handleDestinationClickWithFlip,
        onPlayMove: handlePlayMoveWithFlip, onDeselect,
    });

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
        dragState, overlayRef, handlePointerDown: onCheckerDragStart,
        handlePointerMove, handlePointerUp, handlePointerCancel,
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
                { legalSequences, board, player, selectedSource: from, higherDieFirst: true },
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
    const isAwaitingRoll = gamePhase === 'HUMAN_WAITING_ROLL' && !state.dice;
    const isAiPhase = gamePhase === 'AI_TURN_ROLLING' || gamePhase === 'AI_TURN_SHOWING_ARROWS';

    const handleRollWithClick = useCallback(() => {
        sensoryFeedbackController.triggerMechanicalClick();
        onRoll?.();
    }, [onRoll]);

    const handleConfirmWithClick = useCallback(() => {
        sensoryFeedbackController.triggerMechanicalClick();
        onConfirm?.();
    }, [onConfirm]);

    const onPointClick = useCallback(
        (...args: Parameters<typeof handlePointClick>) => {
            if (suppressClickAfterDragRef.current) {
                suppressClickAfterDragRef.current = false;
                return;
            }
            if (diceAnimation.areCheckerClicksLocked) return;
            if (isAwaitingRoll) {
                handleRollWithClick();
                return;
            }
            handlePointClick(...args);
        },
        [diceAnimation.areCheckerClicksLocked, isAwaitingRoll, handleRollWithClick, handlePointClick],
    );

    const handleBackgroundClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (suppressClickAfterDragRef.current) {
                suppressClickAfterDragRef.current = false;
                return;
            }
            if (e.target === e.currentTarget) onDeselect?.();
        },
        [onDeselect],
    );

    const handleMouseEnterPoint = useCallback((pt: number) => {
        if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) return;
        setHoveredPoint(pt);
    }, []);
    const handleMouseLeavePoint = useCallback(() => setHoveredPoint(null), []);

    if (isLoading) return <BoardSkeleton />;

    const visibleOpponentArrows =
        coachHighlight || (state.dice && state.turn !== 'O') || doublingOfferedBy === player
            ? undefined
            : (opponentHighlight ?? undefined);

    return (
        <div
            ref={boardContainerRef}
            id="backgammon-board"
            data-testid="backgammon-board"
            data-dice-rolling={diceAnimation.isRolling ? 'true' : 'false'}
            role="region"
            aria-label={
                t('board.regionLabel') && t('board.regionLabel') !== 'board.regionLabel' && t('board.regionLabel') !== 'Backgammon Game Board'
                    ? t('board.regionLabel')
                    : 'Plateau de jeu de Backgammon'
            }
            className="h-full max-h-full w-full max-w-[1260px] mx-auto select-none touch-manipulation flex flex-col items-center justify-center relative"
            onClick={handleBackgroundClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="board-accessibility-announcer">
                {t('hud.turn', { player })}
                {state.dice ? `. ${t('engine.diceRolled', { player, d1: state.dice[0], d2: state.dice[1] })}` : ''}
                {doublingOfferedBy ? `. ${t('engine.doubleOffered', { player: doublingOfferedBy, val: state.cubeValue })}` : ''}
            </div>
            <div aria-label="Raccourcis clavier du plateau" className="sr-only">
                Flèches directionnelles pour naviguer, Entrée pour sélectionner, 1 et 2 pour changer de dé, Échap pour désélectionner.
            </div>
            <BoardFrame theme={theme}>
                {(coachHighlight || (visibleOpponentArrows && visibleOpponentArrows.length > 0)) && (
                    <CoachArrows
                        played={coachHighlight?.played}
                        optimal={coachHighlight?.optimal}
                        opponent={visibleOpponentArrows}
                        orientation={orientation}
                    />
                )}

                {isMatchStarted && (
                    <BoardCenterControls
                        gamePhase={gamePhase} onRoll={handleRollWithClick} onConfirm={handleConfirmWithClick}
                        onUndo={onUndo ?? (() => {})} canUndo={canUndo} canConfirm={canConfirm}
                        hasDice={Boolean(state.dice)} canDouble={canDouble} cubeValue={state.cubeValue}
                        doublingOfferedBy={doublingOfferedBy} onOfferDouble={onOfferDouble}
                        onTakeDouble={onTakeDouble} onPassDouble={onPassDouble}
                        autoConfirmEnabled={autoConfirmEnabled} onToggleAutoConfirm={onToggleAutoConfirm}
                        autoConfirmMode={autoConfirmMode} onSelectAutoConfirmMode={onSelectAutoConfirmMode}
                        onCycleAutoConfirmMode={onCycleAutoConfirmMode}
                        gameSpeed={gameSpeed} onCycleGameSpeed={onCycleGameSpeed}
                    />
                )}

                <BoardNumberRow row={TOP_ROW} padding="top" onToggleOrientation={handleToggleOrientation} />

                <FeltSurface theme={theme}>
                    <BoardPlayfieldGrid
                        topRow={TOP_ROW} bottomRow={BOTTOM_ROW} board={board} player={player} off={off}
                        ghostDestinations={boardGhostDestinations} hoverTargets={hoverTargets} movableSources={movableSources}
                        selectedPoint={selectedPoint} opponentHighlight={visibleOpponentArrows ?? null} focusedPoint={focusedPoint}
                        hiddenAt={hiddenAt} theme={theme} swapColors={swapColors} onBackgroundClick={handleBackgroundClick}
                        onOffClick={handleOffClick} onOffRightClick={handleOffRightClick} onPointClick={onPointClick}
                        onPointRightClick={handlePointRightClick} onPointKeyDown={handlePointKeyDown} onPointFocus={handlePointFocus}
                        onMouseEnterPoint={handleMouseEnterPoint} onMouseLeavePoint={handleMouseLeavePoint}
                        onCheckerPointerDown={(pt, color, e) => {
                            if (diceAnimation.areCheckerClicksLocked) return;
                            if (barReentry.areOtherCheckersLocked && pt !== barReentry.barPoint) return;
                            onCheckerDragStart(pt, color, e);
                        }}
                        centralBarProps={{
                            barX: Math.max(0, bar.X - (hiddenAt.get(HIDDEN_X_BAR_KEY) ?? 0)),
                            barO: Math.max(0, bar.O - (hiddenAt.get(HIDDEN_O_BAR_KEY) ?? 0)),
                            isXTurn: isX, cubeValue: state.cubeValue, cubeOwner: state.cubeOwner, canDouble,
                            onBarClick: handleBarClick, onBarRightClick: handleBarRightClick, onOfferDouble,
                            xBarPoint: X_BAR, oBarPoint: O_BAR, theme, swapColors,
                            isDanced: barReentry.isDanced, dancedMessage: barReentry.dancedMessage,
                        }}
                    />

                    <BoardDiceRiver
                        dice={isAiPhase ? null : state.dice} usedDice={usedDice} selectedDie={selectedDie}
                        opponentDice={isAiPhase ? (state.dice ?? opponentDice) : opponentDice}
                        onDiceClick={onDiceClick} onSelectDie={onSelectDie}
                        canConfirm={canConfirm && !autoConfirmEnabled && gamePhase === 'HUMAN_READY_TO_COMMIT'}
                        onConfirmTurn={handleConfirmWithClick}
                    />
                </FeltSurface>

                <BoardNumberRow row={BOTTOM_ROW} padding="bottom" />

                <PipCountBadge
                    pipX={pipCounts.X} pipO={pipCounts.O} turn={player}
                    swapColors={swapColors} playerColor={swapColors ? 'O' : 'X'}
                />
            </BoardFrame>

            <FlyingCheckerOverlay flights={flights} onFlightComplete={completeFlight} />
            <DraggedCheckerOverlay dragState={dragState} overlayRef={overlayRef} />
        </div>
    );
};

export const Board = React.memo(BoardComponent);
export default Board;
