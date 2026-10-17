'use client';

/**
 * Plateau de Backgammon « Luxury Crisloid / Hector Saxe » — Rendu HTML/Tailwind.
 *
 * Composant principal d'orchestration : il assemble les sous-composants isolés
 * (pions, flèches, barre, sabots, dés, videau, badges) et délègue toute la
 * logique métier aux handlers fournis par le parent (modèle Snowie/TMG).
 *
 * Chaque sous-composant vit dans son propre fichier, hyper documenté, pour
 * pouvoir être ajouté/retiré indépendamment :
 *   - `LuxuryChecker`  : pion 3D concave.
 *   - `BoardPoint`     : flèche cousue + pile de pions plafonnée à 5.
 *   - `BarSection`     : barre centrale (pions frappés).
 *   - `OffTray`        : sabot de sortie (bear-off).
 *   - `DiceTray`       : dés cliquables.
 *   - `CubeDisplay`    : videau.
 *   - `PipCountBadges` : badges pip count.
 *   - `useCheckerDrag` : hook de drag-and-drop.
 *   - `boardTypes`     : types, constantes et helpers purs partagés.
 */

import React, { useCallback, useMemo } from 'react';
import { BoardState, Player, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { useCheckerDrag } from './useCheckerDrag';
import { BoardPoint } from './BoardPoint';
import { BarSection } from './BarSection';
import { OffTray } from './OffTray';
import { DiceTray } from './DiceTray';
import { CubeDisplay } from './CubeDisplay';
import { PipCountBadges } from './PipCountBadges';
import {
    TOP_ROW,
    BOTTOM_ROW,
    type CheckerColor,
    getPointColor,
    getPointCount,
    deriveBoardData,
} from './boardTypes';

/** Fonction no-op stable (évite de recréer une fonction anonyme à chaque rendu). */
const noop = () => undefined;

export interface BoardProps {
    /** État complet du plateau (BoardState du moteur). */
    state: BoardState;
    /** Destinations légales pour le dé gauche (d1) : flèche source -> destinations. */
    leftDieTargets: Map<number, number[]>;
    /** Destinations légales pour le dé droit (d2) : flèche source -> destinations. */
    rightDieTargets: Map<number, number[]>;
    /** Flèche source sélectionnée. */
    selectedPoint: number | null;
    /** Dé sélectionné (0 = gauche, 1 = droit). */
    selectedDie: 0 | 1 | null;
    /** Dés déjà consommés ce tour. */
    usedDice: [boolean, boolean] | boolean[];
    /** Clic sur un pion (sélection de la source). */
    onCheckerClick: (point: number) => void;
    /** Double-clic sur un pion (auto-move). */
    onCheckerDoubleClick?: (point: number) => void;
    /** Clic droit sur un pion. */
    onCheckerRightClick: (point: number) => void;
    /** Clic sur une destination légale. */
    onDestinationClick: (point: number) => void;
    /** Sélection d'un dé. */
    onSelectDie?: (die: 0 | 1) => void;
    /** Double-clic sur un dé. */
    onDieDoubleClick?: (die: 0 | 1) => void;
    /** Désélection (clic sur le fond). */
    onDeselect?: () => void;
    /** Jouer un coup direct (from -> to). */
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    /** Annuler le dernier coup. */
    onUndo?: () => void;
    /** Surbrillance du coach (coups joués vs optimaux). */
    coachHighlight?: { played: { from: number; to: number }[]; optimal: { from: number; to: number }[] } | null;
    /** Surbrillance du coup de l'adversaire. */
    opponentHighlight?: { from: number; to: number }[] | null;
    /** Thème visuel (accepté pour compatibilité, non utilisé par ce rendu). */
    theme?: string;
    /** Affiche un squelette de chargement. */
    isLoading?: boolean;
}

/**
 * Plateau de Backgammon au rendu « Luxury Crisloid / Hector Saxe ».
 *
 * Branche les états et handlers existants du projet sur l'architecture visuelle
 * exacte (pions 3D concaves, flèches cousues, plafonnement à 5 pions).
 */
export default function Board({
    state,
    leftDieTargets,
    rightDieTargets,
    selectedPoint,
    selectedDie,
    usedDice,
    onCheckerClick,
    onCheckerDoubleClick,
    onCheckerRightClick,
    onDestinationClick,
    onSelectDie,
    onDieDoubleClick,
    onDeselect,
    onPlayMove,
    onUndo,
    coachHighlight = null,
    opponentHighlight = null,
    theme,
    isLoading = false,
}: BoardProps) {
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;

    // Données dérivées du plateau (mémoïsées).
    const { pipCounts, off, bar } = useMemo(() => deriveBoardData(board), [board]);

    // Destinations légales agrégées pour la source active (Set pour lookup O(1)).
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

    // Drag-and-drop (pointer events).
    const {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerCancel,
        didDragRef,
    } = useCheckerDrag({ board, isX, leftDieTargets, rightDieTargets, onPlayMove });

    // Handlers stabilisés — délégation pure aux handlers du consommateur,
    // sans logique de sélection interne (le modèle Snowie/TMG est géré par le parent).
    const handlePointClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            // Ignore le clic si un drag-and-drop vient de se terminer.
            if (didDragRef.current) {
                didDragRef.current = false;
                return;
            }
            const count = board[pointNumber];
            const hasPlayerChecker = isX ? count > 0 : count < 0;

            // Clic sur une destination légale (flèche vide ou adverse) : jouer.
            if (ghostDestinations.has(pointNumber) && !hasPlayerChecker) {
                onDestinationClick(pointNumber);
                return;
            }
            // Clic sur un pion du joueur : sélectionner / auto-move (géré par le parent).
            if (hasPlayerChecker) {
                onCheckerClick(pointNumber);
                return;
            }
            onDeselect?.();
        },
        [board, isX, ghostDestinations, onDestinationClick, onCheckerClick, onDeselect, didDragRef],
    );

    const handlePointRightClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            onCheckerRightClick(pointNumber);
        },
        [onCheckerRightClick],
    );

    const handleBarClick = useCallback(
        (barPoint: number) => {
            const hasBarChecker = barPoint === X_BAR ? bar.X > 0 : bar.O > 0;
            if (hasBarChecker) onCheckerClick(barPoint);
            else onDeselect?.();
        },
        [bar, onCheckerClick, onDeselect],
    );

    const handleOffClick = useCallback(
        (offPoint: number) => {
            if (ghostDestinations.has(offPoint)) {
                onDestinationClick(offPoint);
            } else {
                onDeselect?.();
            }
        },
        [ghostDestinations, onDestinationClick, onDeselect],
    );

    const renderPoint = (point: number, isTopRow: boolean) => {
        const color = getPointColor(board, point);
        const count = getPointCount(board, point);
        const isTarget = ghostDestinations.has(point);
        const isBlotTarget =
            isTarget && count === 1 && (isX ? board[point] < 0 : board[point] > 0);

        return (
            <BoardPoint
                key={`point-${point}`}
                pointNumber={point}
                isTopRow={isTopRow}
                checkerColor={color}
                checkerCount={count}
                isTargetDestination={isTarget}
                isBlotTarget={isBlotTarget}
                isSelected={selectedPoint === point}
                onClickPoint={handlePointClick}
                onDoubleClickPoint={onCheckerDoubleClick}
                onRightClickPoint={handlePointRightClick}
            />
        );
    };

    const renderBarSection = (barPoint: number, color: CheckerColor, count: number) => (
        <BarSection
            key={`bar-${barPoint}`}
            barPoint={barPoint}
            color={color}
            count={count}
            isPlayable={barPoint === X_BAR ? isX : !isX}
            onClick={handleBarClick}
            onRightClick={onCheckerRightClick}
        />
    );

    const renderOffTray = (offPoint: number, count: number) => (
        <OffTray
            key={`off-${offPoint}`}
            offPoint={offPoint}
            count={count}
            isTarget={ghostDestinations.has(offPoint)}
            onClick={handleOffClick}
        />
    );

    if (isLoading) {
        return (
            <div className="w-full max-w-6xl mx-auto select-none">
                <div className="rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c]">
                    <div className="rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#145337_0%,#0b3824_65%,#051c12_100%)] p-2 sm:p-3 animate-pulse">
                        <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 gap-x-1">
                            <div className="h-[42vh] min-h-[240px]" />
                            <div className="row-span-2 w-16 sm:w-20 bg-[#221108] rounded-lg mx-1" />
                            <div className="h-[42vh] min-h-[240px]" />
                            <div className="h-[42vh] min-h-[240px]" />
                            <div className="h-[42vh] min-h-[240px]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full max-w-6xl mx-auto select-none touch-manipulation"
            onClick={onDeselect}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
        >
            {/* Cadre noyer */}
            <div className="rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c]">
                {/* Surface de feutre */}
                <div className="rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#145337_0%,#0b3824_65%,#051c12_100%)] p-2 sm:p-3">
                    {/*
                     * Grille 3 colonnes × 2 rangées :
                     *   - Colonne gauche  : points 13..18 (haut) / 12..7 (bas)
                     *   - Colonne centrale : barre unique (row-span-2)
                     *   - Colonne droite  : points 19..24 (haut) / 6..1 (bas)
                     *   - Sabots de sortie : O en haut à droite, X en bas à droite
                     */}
                    <div className="grid grid-cols-[1fr_auto_1fr] grid-rows-2 gap-x-1">
                        {/* Rangée 1 — gauche (13..18) */}
                        <div className="flex h-[42vh] min-h-[240px]">
                            {TOP_ROW.slice(0, 6).map((p) => renderPoint(p, true))}
                        </div>

                        {/* Barre centrale (unique, s'étend sur les deux rangées) */}
                        <div className="row-span-2 w-16 sm:w-20 flex flex-col justify-between bg-[#221108] rounded-lg mx-1 border-x-2 border-[#d4af37]/60">
                            {renderBarSection(O_BAR, 'black', bar.O)}
                            {renderBarSection(X_BAR, 'white', bar.X)}
                        </div>

                        {/* Rangée 1 — droite (19..24) + sabot O */}
                        <div className="flex h-[42vh] min-h-[240px]">
                            <div className="flex flex-1">
                                {TOP_ROW.slice(6).map((p) => renderPoint(p, true))}
                            </div>
                            <div className="w-16 sm:w-20 flex flex-col justify-start pt-2">
                                {renderOffTray(O_BAR, off.O)}
                            </div>
                        </div>

                        {/* Rangée 2 — gauche (12..7) */}
                        <div className="flex h-[42vh] min-h-[240px]">
                            {BOTTOM_ROW.slice(0, 6).map((p) => renderPoint(p, false))}
                        </div>

                        {/* Rangée 2 — droite (6..1) + sabot X */}
                        <div className="flex h-[42vh] min-h-[240px]">
                            <div className="flex flex-1">
                                {BOTTOM_ROW.slice(6).map((p) => renderPoint(p, false))}
                            </div>
                            <div className="w-16 sm:w-20 flex flex-col justify-end pb-2">
                                {renderOffTray(X_BAR, off.X)}
                            </div>
                        </div>
                    </div>

                    {/* Rivière centrale : dés + videau */}
                    <div className="flex items-center justify-center gap-6 py-3">
                        <CubeDisplay cubeValue={state.cubeValue} />
                        {state.dice && (
                            <DiceTray
                                dice={state.dice}
                                usedDice={usedDice}
                                selectedDie={selectedDie}
                                onSelectDie={onSelectDie ?? noop}
                                onDoubleClickDie={onDieDoubleClick}
                            />
                        )}
                    </div>
                </div>

                {/* Badges Pip Count */}
                <PipCountBadges pipCounts={pipCounts} />
            </div>
        </div>
    );
}
