'use client';

/**
 * Plateau de Backgammon de Tournoi (style Backgammon Galaxy / Snowie 4 Pro) —
 * Rendu HTML/Tailwind & SVG haute fidélité (< 230 lignes, 0 any).
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
import { useBarReentry } from '../../hooks/useBarReentry';
import { useDiceAnimation } from '../../hooks/useDiceAnimation';
import { DraggedCheckerOverlay } from './DraggedCheckerOverlay';

export { BoardQuadrantRow };
export type { BoardProps } from './boardTypes';

const BoardComponent: React.FC<BoardProps> = ({
    state, leftDieTargets, rightDieTargets, selectedPoint, selectedDie, usedDice,
    opponentDice = null, onCheckerClick, onCheckerDoubleClick, onCheckerRightClick,
    onDestinationClick, onSelectDie, onDieDoubleClick, onDiceClick, onDeselect, onPlayMove,
    coachHighlight = null, opponentHighlight = null, canDouble = false, doublingOfferedBy = null,
    onOfferDouble, onTakeDouble, onPassDouble, theme, isLoading = false,
    gamePhase = 'HUMAN_WAITING_ROLL', onRoll, onConfirm, onUndo,
    canUndo = false, canConfirm = false, autoConfirmEnabled = false, onToggleAutoConfirm,
    isMatchStarted = true, swapColors = false,
}) => {
    const { t } = useI18n();
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;

    const [orientation, setOrientation] = useState<BoardOrientation>('normal');
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

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
    const diceAnimation = useDiceAnimation({ dice: state.dice });

    const barReentry = useBarReentry({
        board,
        player,
        dice: state.dice,
        usedDice,
        leftDieTargets,
        rightDieTargets,
        gamePhase,
        onAutoPassTurn: canUndo ? undefined : onConfirm,
    });

    const movableSources = useMemo(
        () => collectMovableSources(leftDieTargets, rightDieTargets, gamePhase, barReentry.isOnBar),
        [leftDieTargets, rightDieTargets, gamePhase, barReentry.isOnBar],
    );

    const ghostDestinations = useMemo(
        () =>
            computeGhostDestinations({
                isOnBar: barReentry.isOnBar,
                barPoint: barReentry.barPoint,
                legalEntryPoints: barReentry.legalEntryPoints,
                selectedPoint,
                selectedDie,
                leftDieTargets,
                rightDieTargets,
                dice: state.dice,
                gamePhase,
            }),
        [barReentry.isOnBar, barReentry.barPoint, barReentry.legalEntryPoints, selectedPoint, selectedDie, leftDieTargets, rightDieTargets, state.dice, gamePhase],
    );

    const hoverTargets = useMemo(
        () =>
            computeHoverTargets(
                barReentry.isOnBar ? barReentry.barPoint : (selectedPoint ?? hoveredPoint),
                state.dice,
                selectedDie,
                leftDieTargets,
                rightDieTargets,
            ),
        [barReentry.isOnBar, barReentry.barPoint, selectedPoint, hoveredPoint, state.dice, selectedDie, leftDieTargets, rightDieTargets],
    );

    const {
        focusedPoint, handlePointClick, handlePointRightClick,
        handleBarClick, handleBarRightClick, handleOffClick, handleOffRightClick, handlePointFocus, handlePointKeyDown,
    } = useBoardPointInteractions({
        board, isX, bar, xBarPoint: X_BAR, oBarPoint: O_BAR, ghostDestinations, selectedPoint,
        leftDieTargets, rightDieTargets, dice: state.dice, selectedDie,
        onCheckerClick, onCheckerRightClick, onDestinationClick, onPlayMove, onDeselect,
    });

    const [dragSourcePoint, setDragSourcePoint] = useState<number | null>(null);
    const suppressClickAfterDragRef = useRef(false);
    const activeLegalDestinations = useMemo(() => {
        const activePt = dragSourcePoint ?? selectedPoint;
        if (activePt === null) return ghostDestinations;
        const left = leftDieTargets?.get(activePt) ?? [];
        const right = rightDieTargets?.get(activePt) ?? [];
        return new Set([...left, ...right]);
    }, [dragSourcePoint, selectedPoint, ghostDestinations, leftDieTargets, rightDieTargets]);

    const {
        dragState,
        handlePointerDown: onCheckerDragStart,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
    } = useCheckerDragAndDrop({
        legalDestinations: activeLegalDestinations,
        onDropMove: (from, to) => {
            suppressClickAfterDragRef.current = true;
            setDragSourcePoint(null);
            if (onPlayMove) onPlayMove(from, to);
            else onDestinationClick(to);
        },
        onTapPoint: () => {
            setDragSourcePoint(null);
        },
        onCancelDrag: () => {
            suppressClickAfterDragRef.current = true;
            setDragSourcePoint(null);
        },
    });

    const boardGhostDestinations = dragState.isDragging ? activeLegalDestinations : ghostDestinations;
    const isAwaitingRoll = gamePhase === 'HUMAN_WAITING_ROLL' && !state.dice;
    const isAiPhase = gamePhase === 'AI_TURN_ROLLING' || gamePhase === 'AI_TURN_SHOWING_ARROWS';

    const onPointClick = useCallback(
        (...args: Parameters<typeof handlePointClick>) => {
            if (suppressClickAfterDragRef.current) {
                suppressClickAfterDragRef.current = false;
                return;
            }
            if (diceAnimation.areCheckerClicksLocked) return;
            if (isAwaitingRoll) {
                onRoll?.();
                return;
            }
            handlePointClick(...args);
        },
        [diceAnimation.areCheckerClicksLocked, isAwaitingRoll, onRoll, handlePointClick],
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

    return (
        <div
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
                {(coachHighlight || (opponentHighlight && opponentHighlight.length > 0)) && (
                    <CoachArrows
                        played={coachHighlight?.played}
                        optimal={coachHighlight?.optimal}
                        opponent={
                            coachHighlight
                                ? undefined
                                : !state.dice
                                  ? (opponentHighlight ?? undefined)
                                  : state.turn === 'O'
                                    ? (opponentHighlight ?? undefined)
                                    : undefined
                        }
                        orientation={orientation}
                    />
                )}

                {isMatchStarted && (
                    <BoardCenterControls
                        gamePhase={gamePhase}
                        onRoll={onRoll ?? (() => { })}
                        onConfirm={onConfirm ?? (() => { })}
                        onUndo={onUndo ?? (() => { })}
                        canUndo={canUndo}
                        canConfirm={canConfirm}
                        hasDice={Boolean(state.dice)}
                        canDouble={canDouble}
                        cubeValue={state.cubeValue}
                        doublingOfferedBy={doublingOfferedBy}
                        onOfferDouble={onOfferDouble}
                        onTakeDouble={onTakeDouble}
                        onPassDouble={onPassDouble}
                        autoConfirmEnabled={autoConfirmEnabled}
                        onToggleAutoConfirm={onToggleAutoConfirm}
                    />
                )}

                <BoardNumberRow row={TOP_ROW} padding="top" onToggleOrientation={handleToggleOrientation} />

                <FeltSurface theme={theme}>
                    <BoardPlayfieldGrid
                        topRow={TOP_ROW} bottomRow={BOTTOM_ROW} board={board} player={player} off={off}
                        ghostDestinations={boardGhostDestinations} hoverTargets={hoverTargets} movableSources={movableSources}
                        selectedPoint={selectedPoint} opponentHighlight={coachHighlight ? null : opponentHighlight} focusedPoint={focusedPoint}
                        theme={theme} swapColors={swapColors} onBackgroundClick={handleBackgroundClick}
                        onOffClick={handleOffClick} onOffRightClick={handleOffRightClick} onPointClick={onPointClick}
                        onCheckerDoubleClick={onCheckerDoubleClick} onPointRightClick={handlePointRightClick}
                        onPointKeyDown={handlePointKeyDown} onPointFocus={handlePointFocus}
                        onMouseEnterPoint={handleMouseEnterPoint} onMouseLeavePoint={handleMouseLeavePoint}
                        onCheckerPointerDown={(pt, color, e) => {
                            if (diceAnimation.areCheckerClicksLocked) return;
                            if (barReentry.areOtherCheckersLocked && pt !== barReentry.barPoint) return;
                            setDragSourcePoint(pt);
                            onCheckerDragStart(pt, color, e);
                        }}
                        centralBarProps={{
                            barX: bar.X, barO: bar.O, isXTurn: isX,
                            cubeValue: state.cubeValue, cubeOwner: state.cubeOwner, canDouble,
                            onBarClick: handleBarClick, onBarDoubleClick: onCheckerDoubleClick,
                            onBarRightClick: handleBarRightClick, onOfferDouble,
                            xBarPoint: X_BAR, oBarPoint: O_BAR, theme, swapColors,
                            isDanced: barReentry.isDanced, dancedMessage: barReentry.dancedMessage,
                        }}
                    />

                    <BoardDiceRiver
                        dice={isAiPhase ? null : state.dice}
                        usedDice={usedDice}
                        selectedDie={selectedDie}
                        opponentDice={isAiPhase ? (state.dice ?? opponentDice) : opponentDice}
                        onDiceClick={onDiceClick}
                        onSelectDie={onSelectDie}
                        onDieDoubleClick={onDieDoubleClick}
                    />
                </FeltSurface>

                <BoardNumberRow row={BOTTOM_ROW} padding="bottom" />

                <PipCountBadge
                    pipX={pipCounts.X} pipO={pipCounts.O} turn={player}
                    swapColors={swapColors} playerColor={swapColors ? 'O' : 'X'}
                />
            </BoardFrame>

            <DraggedCheckerOverlay dragState={dragState} />
        </div>
    );
};

export const Board = React.memo(BoardComponent);
export default Board;
