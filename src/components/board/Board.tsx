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
    getOrientedRows, toggleOrientation, getSavedOrientation, saveOrientation, ORIENTATION_CHANGE_EVENT, type BoardOrientation,
} from './boardOrientation';
import { useCheckerFlights, HIDDEN_X_BAR_KEY, HIDDEN_O_BAR_KEY } from '../../hooks/useCheckerFlights';
import { useBarReentry } from '../../hooks/useBarReentry';
import { useDiceAnimation } from '../../hooks/useDiceAnimation';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import { DraggedCheckerOverlay } from './DraggedCheckerOverlay';
import { FlyingCheckerOverlay } from './FlyingCheckerOverlay';
import { BoardAccessibilityAnnouncer } from './BoardAccessibilityAnnouncer';
import { useBoardDragAndDrop } from './useBoardDragAndDrop';
import { useBoardFlightSound } from './useBoardFlightSound';
import { useBoardInteractionsHandlers } from './useBoardInteractionsHandlers';
import { getBoardRegionAriaLabel } from './boardAria';
import {
    computeRemainingSequences,
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
    canUndo = false, canConfirm = false, autoConfirmEnabled = false,
    autoConfirmMode,
    isMatchStarted = true, swapColors = false, gameSpeed,
    showPipCount = false,
}) => {
    const { t } = useI18n();
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;
    const boardContainerRef = useRef<HTMLDivElement | null>(null);

    const [orientation, setOrientation] = useState<BoardOrientation>('normal');

    useEffect(() => {
        const saved = getSavedOrientation('normal');
        if (saved !== 'normal') setOrientation(saved);
        const onSync = (e: Event) => {
            const detail = (e as CustomEvent<BoardOrientation>).detail;
            if (detail === 'normal' || detail === 'inverted') setOrientation(detail);
        };
        window.addEventListener(ORIENTATION_CHANGE_EVENT, onSync);
        return () => window.removeEventListener(ORIENTATION_CHANGE_EVENT, onSync);
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
    useBoardFlightSound(flights);

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

    const {
        dragState, overlayRef, onCheckerDragStart,
        handlePointerMove, handlePointerUp, handlePointerCancel,
        boardGhostDestinations, dragSourcePoint, suppressClickAfterDragRef,
    } = useBoardDragAndDrop({
        ghostDestinations, leftDieTargets, rightDieTargets, legalSequences,
        selectedPoint, board, player, prepareFlipForStep,
        handlePlayMoveWithFlip, handleDestinationClickWithFlip,
        onTapCheckerPoint: (pt) => handlePointClick(pt, { stopPropagation: () => {} } as React.MouseEvent),
    });

    const isAwaitingRoll = gamePhase === 'HUMAN_WAITING_ROLL' && !state.dice;
    const isAiPhase = gamePhase === 'AI_TURN_ROLLING' || gamePhase === 'AI_TURN_SHOWING_ARROWS';

    const {
        hoveredPoint, handleRollWithClick, handleConfirmWithClick,
        onPointClick, handleBackgroundClick, handleMouseEnterPoint, handleMouseLeavePoint,
    } = useBoardInteractionsHandlers({
        onRoll, onConfirm, onDeselect, handlePointClick,
        suppressClickAfterDragRef, areCheckerClicksLocked: diceAnimation.areCheckerClicksLocked, isAwaitingRoll,
    });

    const hoverTargets = useMemo(
        () =>
            computeHoverTargets(
                barReentry.isOnBar ? barReentry.barPoint : (dragSourcePoint ?? selectedPoint ?? hoveredPoint),
                state.dice, selectedDie, leftDieTargets, rightDieTargets, legalSequences, board,
            ),
        [barReentry.isOnBar, barReentry.barPoint, dragSourcePoint, selectedPoint, hoveredPoint, state.dice, selectedDie, leftDieTargets, rightDieTargets, legalSequences, board],
    );

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
            aria-label={getBoardRegionAriaLabel(t('board.regionLabel'))}
            style={{ touchAction: 'none' }}
            className="h-full max-h-full w-full max-w-[1260px] [@media(max-height:540px)]:!max-w-full mx-auto select-none flex flex-col items-center justify-center relative"
            onClick={handleBackgroundClick}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            <BoardAccessibilityAnnouncer
                player={player}
                dice={state.dice}
                doublingOfferedBy={doublingOfferedBy}
                cubeValue={state.cubeValue}
            />
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
                        autoConfirmEnabled={autoConfirmEnabled}
                        autoConfirmMode={autoConfirmMode}
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
                            onBarClick: (barPt) => {
                                if (suppressClickAfterDragRef.current) {
                                    suppressClickAfterDragRef.current = false;
                                    return;
                                }
                                if (diceAnimation.areCheckerClicksLocked) return;
                                handleBarClick(barPt);
                            },
                            onBarRightClick: handleBarRightClick, onOfferDouble,
                            xBarPoint: X_BAR, oBarPoint: O_BAR, theme, swapColors,
                            isDanced: barReentry.isDanced, dancedMessage: barReentry.dancedMessage,
                            pipX: pipCounts.X, pipO: pipCounts.O,
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

                {showPipCount && (
                    <PipCountBadge
                        pipX={pipCounts.X} pipO={pipCounts.O} turn={player}
                        swapColors={swapColors} playerColor={swapColors ? 'O' : 'X'}
                    />
                )}
            </BoardFrame>

            <FlyingCheckerOverlay flights={flights} onFlightComplete={completeFlight} />
            <DraggedCheckerOverlay dragState={dragState} overlayRef={overlayRef} />
        </div>
    );
};

export const Board = React.memo(BoardComponent);
export default Board;
