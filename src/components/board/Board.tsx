'use client';

/**
 * Plateau de Backgammon « Luxury Crisloid / Hector Saxe » — Rendu HTML/Tailwind.
 *
 * Rendu alternatif au `BackgammonBoard.tsx` (SVG) : pions 3D concaves (finger-dish),
 * flèches cousues en SVG, pile plafonnée à 5 avec badge.
 *
 * Réutilise les fonctions pures isolées :
 *   - `boardGeometry.ts` : géométrie, layout, hit-testing.
 *   - `boardAria.ts` : labels ARIA et navigation clavier.
 *
 * Délégation pure : toute la logique métier (auto-move, sélection) est gérée par
 * le parent via les handlers, exactement comme `BackgammonBoard`.
 *
 * Composition (LOI 5 — composants ≤ 300 lignes) :
 *   `BoardPoint`, `BoardCentralBar`, `BoardNumberRow`, `BoardDiceRiver`,
 *   `BoardOffTray`, `BoardFrame`/`FeltSurface`, `BoardCenterControls`,
 *   `PipCountBadge`, hook `useBoardPointInteractions`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Player, X_BAR, O_BAR, X_OFF, O_OFF, pipCount, borneOffCount } from '../../engine/backgammonEngine';
import { getPointColor, getPointCount } from './boardGeometry';
import { getPointAriaLabel } from './boardAria';
import { PipCountBadge } from './PipCountBadge';
import { BoardPoint } from './BoardPoint';
import { BoardCentralBar } from './BoardCentralBar';
import { BoardNumberRow } from './BoardNumberRow';
import { BoardDiceRiver } from './BoardDiceRiver';
import { BoardOffTray } from './BoardOffTray';
import { CoachArrows } from './CoachArrows';
import { BoardCenterControls } from './BoardCenterControls';
import { BoardFrame, FeltSurface } from './BoardFrame';
import { BoardSkeleton } from './BoardSkeleton';
import { normalizeHighlightPoint, isRealPoint, collectMovableSources } from './boardHighlights';
import { useBoardPointInteractions } from '../../hooks/useBoardPointInteractions';
import type { BoardProps } from './boardTypes';
import {
    getOrientedRows,
    toggleOrientation,
    getSavedOrientation,
    saveOrientation,
    type BoardOrientation,
} from './boardOrientation';

export type { BoardProps } from './boardTypes';

export default function Board({
    state,
    leftDieTargets,
    rightDieTargets,
    selectedPoint,
    selectedDie,
    usedDice,
    opponentDice = null,
    onCheckerClick,
    onCheckerDoubleClick,
    onCheckerRightClick,
    onDestinationClick,
    onSelectDie,
    onDieDoubleClick,
    onDiceClick,
    onDeselect,
    coachHighlight = null,
    opponentHighlight = null,
    canDouble = false,
    isLoading = false,
    gamePhase = 'HUMAN_WAITING_ROLL',
    onRoll,
    onConfirm,
    onUndo,
    canUndo = false,
    canConfirm = false,
    isMatchStarted = true,
}: BoardProps) {
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;

    // Orientation du plateau (sortie X à gauche ou à droite), persistée.
    // ANTI-HYDRATATION : on démarre sur 'normal' (identique SSR/CSR) puis on
    // synchronise la préférence persistée APRÈS le montage, dans un useEffect.
    const [orientation, setOrientation] = useState<BoardOrientation>('normal');

    useEffect(() => {
        const saved = getSavedOrientation('normal');
        if (saved !== 'normal') setOrientation(saved);
    }, []);

    const { top: TOP_ROW, bottom: BOTTOM_ROW } = useMemo(
        () => getOrientedRows(orientation),
        [orientation],
    );

    const handleToggleOrientation = () => {
        setOrientation((prev) => {
            const next = toggleOrientation(prev);
            saveOrientation(next);
            return next;
        });
    };

    const pipCounts = useMemo(() => pipCount(board), [board]);
    const movableSources = useMemo(
        () => collectMovableSources(leftDieTargets, rightDieTargets, gamePhase),
        [leftDieTargets, rightDieTargets, gamePhase],
    );
    const off = useMemo(() => ({ X: borneOffCount(board, 'X'), O: borneOffCount(board, 'O') }), [board]);
    const bar = useMemo(() => ({ X: Math.max(0, board[X_BAR]), O: Math.max(0, -board[O_BAR]) }), [board]);

    const ghostDestinations = useMemo(() => {
        if (selectedPoint === null) return new Set<number>();
        if (selectedDie !== null) {
            const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
            return new Set(targets.get(selectedPoint) ?? []);
        }
        const left = leftDieTargets.get(selectedPoint) ?? [];
        const right = rightDieTargets.get(selectedPoint) ?? [];
        return new Set([...left, ...right]);
    }, [selectedPoint, selectedDie, leftDieTargets, rightDieTargets]);

    // Interactions clavier/souris des flèches, de la barre et des sabots
    // (hook dédié — LOI 5).
    const {
        focusedPoint,
        handlePointClick,
        handlePointRightClick,
        handleBarClick,
        handleOffClick,
        handlePointFocus,
        handlePointKeyDown,
    } = useBoardPointInteractions({
        board,
        isX,
        bar,
        xBarPoint: X_BAR,
        oBarPoint: O_BAR,
        ghostDestinations,
        onCheckerClick,
        onCheckerRightClick,
        onDestinationClick,
        onDeselect,
    });

    const renderPoint = (point: number, isTopRow: boolean) => {
        const color = getPointColor(board, point);
        const count = getPointCount(board, point);
        const isTarget = ghostDestinations.has(point);
        const isBlotTarget =
            isTarget && count === 1 && (isX ? board[point] < 0 : board[point] > 0);
        const isOpponentFrom =
            isRealPoint(point) &&
            (opponentHighlight?.some((h) => normalizeHighlightPoint(h.from, false) === point) ?? false);
        const isOpponentTo =
            isRealPoint(point) &&
            (opponentHighlight?.some((h) => normalizeHighlightPoint(h.to, true) === point) ?? false);
        const ariaLabel = getPointAriaLabel(
            point,
            board,
            player,
            selectedPoint,
            Array.from(ghostDestinations),
        );

        return (
            <BoardPoint
                key={`point-${point}`}
                pointNumber={point}
                isTopRow={isTopRow}
                checkerColor={color}
                checkerCount={count}
                isTargetDestination={isTarget}
                isBlotTarget={isBlotTarget}
                isMovable={movableSources.has(point)}
                isSelected={selectedPoint === point}
                isOpponentFrom={isOpponentFrom}
                isOpponentTo={isOpponentTo}
                isFocused={focusedPoint === point}
                ariaLabel={ariaLabel}
                onClickPoint={handlePointClick}
                onDoubleClickPoint={onCheckerDoubleClick}
                onRightClickPoint={handlePointRightClick}
                onKeyDownPoint={handlePointKeyDown}
                onFocusPoint={handlePointFocus}
            />
        );
    };

    const renderOffTray = (offPoint: number, count: number, trayZoneId: string) => (
        <BoardOffTray
            offPoint={offPoint}
            count={count}
            board={board}
            player={player}
            isTarget={ghostDestinations.has(offPoint)}
            isOpponentToOff={opponentHighlight?.some((h) => h.to === X_OFF || h.to === O_OFF) ?? false}
            trayZoneId={trayZoneId}
            onClick={handleOffClick}
        />
    );

    if (isLoading) return <BoardSkeleton />;

    return (
        <div
            id="backgammon-board"
            data-testid="backgammon-board"
            className="h-full max-h-full w-full mx-auto select-none touch-manipulation flex flex-col items-center justify-center"
            onClick={onDeselect}
        >
            <BoardFrame>
                {(coachHighlight || (state.turn === 'O' && opponentHighlight && opponentHighlight.length > 0)) && (
                    <CoachArrows
                        played={coachHighlight?.played}
                        optimal={coachHighlight?.optimal}
                        opponent={state.turn === 'O' ? (opponentHighlight ?? undefined) : undefined}
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
                    />
                )}

                <BoardNumberRow row={TOP_ROW} padding="top" onToggleOrientation={handleToggleOrientation} />

                <FeltSurface>
                    <div className="flex-1 min-h-0 grid grid-cols-[1fr_auto_1fr] grid-rows-2 gap-x-1">
                        <div className="flex min-h-0">
                            {TOP_ROW.slice(0, 6).map((p) => renderPoint(p, true))}
                        </div>

                        <BoardCentralBar
                            barX={bar.X}
                            barO={bar.O}
                            isXTurn={isX}
                            cubeValue={state.cubeValue}
                            cubeOwner={state.cubeOwner}
                            canDouble={canDouble}
                            onBarClick={handleBarClick}
                            onBarRightClick={onCheckerRightClick}
                            xBarPoint={X_BAR}
                            oBarPoint={O_BAR}
                        />

                        <div className="flex min-h-0">
                            <div className="flex flex-1">
                                {TOP_ROW.slice(6).map((p) => renderPoint(p, true))}
                            </div>
                            <div className="w-10 sm:w-16 md:w-20 flex flex-col justify-start pt-2">
                                {renderOffTray(O_BAR, off.O, 'tray-zone-o')}
                            </div>
                        </div>

                        <div className="flex min-h-0">
                            {BOTTOM_ROW.slice(0, 6).map((p) => renderPoint(p, false))}
                        </div>

                        <div className="flex min-h-0">
                            <div className="flex flex-1">
                                {BOTTOM_ROW.slice(6).map((p) => renderPoint(p, false))}
                            </div>
                            <div className="w-10 sm:w-16 md:w-20 flex flex-col justify-end pb-2">
                                {renderOffTray(X_BAR, off.X, 'tray-zone-x')}
                            </div>
                        </div>
                    </div>

                    <BoardDiceRiver
                        dice={state.dice}
                        usedDice={usedDice}
                        selectedDie={selectedDie}
                        opponentDice={opponentDice}
                        onDiceClick={onDiceClick}
                        onSelectDie={onSelectDie}
                        onDieDoubleClick={onDieDoubleClick}
                    />
                </FeltSurface>

                <BoardNumberRow row={BOTTOM_ROW} padding="bottom" />

                <PipCountBadge pipX={pipCounts.X} pipO={pipCounts.O} turn={player} />
            </BoardFrame>
        </div>
    );
}
