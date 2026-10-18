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
 */

import React, { useCallback, useMemo, useState } from 'react';
import { BoardState, Player, X_BAR, O_BAR, pipCount, borneOffCount } from '../../engine/backgammonEngine';
import { getPointColor, getPointCount } from './boardGeometry';
import { getPointAriaLabel } from './boardAria';
import { PipCountBadge } from './PipCountBadge';
import { Checker, type CheckerColor } from './Checker';
import { Die } from './Die';
import { DoublingCube } from './DoublingCube';
import { CoachArrows } from './CoachArrows';
import {
    getOrientedRows,
    toggleOrientation,
    getSavedOrientation,
    saveOrientation,
    type BoardOrientation,
} from './boardOrientation';

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

/** Nombre maximal de pions affichés par pile (règle des 5 + badge). */
const MAX_VISIBLE = 5;

// ---------------------------------------------------------------------------
// SOUS-COMPOSANT : FLÈCHE (POINT) COUSUE EN SVG + PILE DE PIONS
// ---------------------------------------------------------------------------

interface BoardPointProps {
    pointNumber: number;
    isTopRow: boolean;
    checkerColor: CheckerColor | null;
    checkerCount: number;
    isTargetDestination?: boolean;
    isBlotTarget?: boolean;
    isSelected?: boolean;
    ariaLabel?: string;
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
    onDoubleClickPoint?: (pointNumber: number) => void;
    onRightClickPoint?: (pointNumber: number, e: React.MouseEvent) => void;
}

const BoardPoint: React.FC<BoardPointProps> = ({
    pointNumber,
    isTopRow,
    checkerColor,
    checkerCount,
    isTargetDestination = false,
    isBlotTarget = false,
    isSelected = false,
    ariaLabel,
    onClickPoint,
    onDoubleClickPoint,
    onRightClickPoint,
}) => {
    const isEven = pointNumber % 2 === 0;
    const visibleCheckers = Math.min(checkerCount, MAX_VISIBLE);

    return (
        <div
            data-point={pointNumber}
            data-testid={`point-triangle-${pointNumber}`}
            role="button"
            aria-label={ariaLabel}
            tabIndex={0}
            className={`relative flex-1 h-full flex flex-col items-center select-none group ${isSelected ? 'ring-2 ring-amber-400/80 rounded-lg' : ''
                }`}
            onClick={(e) => onClickPoint(pointNumber, e)}
            onDoubleClick={() => onDoubleClickPoint?.(pointNumber)}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClickPoint?.(pointNumber, e);
            }}
        >
            <svg
                viewBox="0 0 100 300"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-[86%] pointer-events-none"
                style={{
                    top: isTopRow ? 0 : 'auto',
                    bottom: isTopRow ? 'auto' : 0,
                    filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.45))',
                }}
            >
                <defs>
                    <linearGradient id={`ivoryPoint-${pointNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f6eedc" />
                        <stop offset="100%" stopColor="#d4c29e" />
                    </linearGradient>
                    <linearGradient id={`burgundyPoint-${pointNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#861923" />
                        <stop offset="100%" stopColor="#4c0910" />
                    </linearGradient>
                </defs>
                <polygon
                    points={isTopRow ? '4,0 96,0 50,292' : '4,300 96,300 50,8'}
                    fill={isEven ? `url(#ivoryPoint-${pointNumber})` : `url(#burgundyPoint-${pointNumber})`}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>

            <div
                className={`relative z-10 flex flex-col items-center w-full py-1.5 ${isTopRow ? 'justify-start' : 'justify-end mt-auto'
                    } gap-[2px]`}
            >
                {checkerColor &&
                    Array.from({ length: visibleCheckers }).map((_, idx) => {
                        const isLastRendered = isTopRow
                            ? idx === visibleCheckers - 1
                            : idx === 0;
                        const showCount =
                            checkerCount > MAX_VISIBLE && idx === visibleCheckers - 1
                                ? checkerCount
                                : undefined;

                        return (
                            <div
                                key={idx}
                                data-testid={`checker-p${pointNumber}-${idx}`}
                                className={
                                    isBlotTarget && checkerCount === 1
                                        ? 'rounded-full ring-4 ring-rose-500 animate-pulse'
                                        : ''
                                }
                            >
                                <Checker
                                    color={checkerColor}
                                    countBadge={showCount}
                                    isPlayable
                                    isTopChecker={isLastRendered}
                                />
                            </div>
                        );
                    })}
            </div>

            {isTargetDestination && (
                <div
                    data-testid={`ghost-checker-${pointNumber}`}
                    className={`absolute z-20 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] ring-2 ring-white animate-pulse pointer-events-none ${isTopRow ? 'bottom-[18%]' : 'top-[18%]'
                        }`}
                />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// COMPOSANT PRINCIPAL
// ---------------------------------------------------------------------------

export interface BoardProps {
    state: BoardState;
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    selectedPoint: number | null;
    selectedDie: 0 | 1 | null;
    usedDice: [boolean, boolean] | boolean[];
    /** Dés lancés par l'adversaire (affichés dans la rivière centrale). */
    opponentDice?: [number, number] | null;
    onCheckerClick: (point: number) => void;
    onCheckerDoubleClick?: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onSelectDie?: (die: 0 | 1) => void;
    onDieDoubleClick?: (die: 0 | 1) => void;
    onDeselect?: () => void;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onUndo?: () => void;
    coachHighlight?: { played: { from: number; to: number }[]; optimal: { from: number; to: number }[] } | null;
    opponentHighlight?: { from: number; to: number }[] | null;
    /** Le double est-il possible pour le joueur au trait ? (halo du videau). */
    canDouble?: boolean;
    theme?: string;
    isLoading?: boolean;
}

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
    onDeselect,
    onPlayMove,
    onUndo,
    coachHighlight = null,
    opponentHighlight = null,
    canDouble = false,
    theme,
    isLoading = false,
}: BoardProps) {
    const player: Player = state.turn;
    const isX = player === 'X';
    const board = state.board;

    // Orientation du plateau (sortie X à gauche ou à droite), persistée.
    const [orientation, setOrientation] = useState<BoardOrientation>(() =>
        getSavedOrientation('normal'),
    );
    const { top: TOP_ROW, bottom: BOTTOM_ROW } = useMemo(
        () => getOrientedRows(orientation),
        [orientation],
    );

    const handleToggleOrientation = useCallback(() => {
        setOrientation((prev) => {
            const next = toggleOrientation(prev);
            saveOrientation(next);
            return next;
        });
    }, []);

    const pipCounts = useMemo(() => pipCount(board), [board]);
    const off = useMemo(
        () => ({ X: borneOffCount(board, 'X'), O: borneOffCount(board, 'O') }),
        [board],
    );
    const bar = useMemo(
        () => ({ X: Math.max(0, board[X_BAR]), O: Math.max(0, -board[O_BAR]) }),
        [board],
    );

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

    const handlePointClick = useCallback(
        (pointNumber: number, e: React.MouseEvent) => {
            e.stopPropagation();
            const count = board[pointNumber];
            const hasPlayerChecker = isX ? count > 0 : count < 0;

            if (ghostDestinations.has(pointNumber) && !hasPlayerChecker) {
                onDestinationClick(pointNumber);
                return;
            }
            if (hasPlayerChecker) {
                onCheckerClick(pointNumber);
                return;
            }
            onDeselect?.();
        },
        [board, isX, ghostDestinations, onDestinationClick, onCheckerClick, onDeselect],
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
                isSelected={selectedPoint === point}
                ariaLabel={ariaLabel}
                onClickPoint={handlePointClick}
                onDoubleClickPoint={onCheckerDoubleClick}
                onRightClickPoint={handlePointRightClick}
            />
        );
    };

    const renderBarSection = (barPoint: number, color: CheckerColor, count: number) => {
        const isPlayable = barPoint === X_BAR ? isX : !isX;
        const visible = Math.min(count, MAX_VISIBLE);
        return (
            <div
                key={`bar-${barPoint}`}
                className="flex flex-col items-center justify-center gap-[2px] py-2"
                onClick={(e) => {
                    e.stopPropagation();
                    handleBarClick(barPoint);
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    onCheckerRightClick(barPoint);
                }}
            >
                {count > 0 &&
                    Array.from({ length: visible }).map((_, idx) => (
                        <div
                            key={idx}
                            className="rounded-full ring-2 ring-rose-400/80 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        >
                            <Checker
                                color={color}
                                countBadge={count > MAX_VISIBLE && idx === visible - 1 ? count : undefined}
                                isPlayable={isPlayable}
                                isTopChecker={idx === visible - 1}
                            />
                        </div>
                    ))}
            </div>
        );
    };

    const renderOffTray = (offPoint: number, count: number) => {
        const isTarget = ghostDestinations.has(offPoint);
        return (
            <div
                key={`off-${offPoint}`}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2 min-h-[64px] ${isTarget
                    ? 'border-emerald-400 bg-emerald-400/10 cursor-pointer'
                    : 'border-slate-700 bg-slate-900/40'
                    }`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleOffClick(offPoint);
                }}
            >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sortie</span>
                <span className="text-2xl font-extrabold text-slate-200">{count}</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="h-full w-full max-w-6xl mx-auto select-none">
                <div className="h-full rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c]">
                    <div className="h-full rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#145337_0%,#0b3824_65%,#051c12_100%)] p-2 sm:p-3 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div
            data-testid="backgammon-board"
            className="h-full max-h-full w-full max-w-6xl mx-auto select-none touch-manipulation flex flex-col items-center justify-center"
            onClick={onDeselect}
        >
            {/* Cadre noyer */}
            <div className="relative w-full h-full rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c] flex flex-col">
                {/* Flèches SVG de trajectoire du Coach (Optimal vs Joué) */}
                {coachHighlight && (
                    <CoachArrows
                        played={coachHighlight.played}
                        optimal={coachHighlight.optimal}
                    />
                )}

                {/* Bordure supérieure : numéros 13..24 + bascule d'orientation */}
                <div className="flex items-center justify-center gap-0 px-1 pb-1 shrink-0">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOrientation();
                        }}
                        aria-label="Inverser l'orientation du plateau"
                        title="Inverser l'orientation (sortie à gauche ou à droite)"
                        data-testid="orientation-toggle"
                        className="mr-1 px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
                    >
                        ⇄
                    </button>
                    <div className="flex flex-1 justify-around">
                        {TOP_ROW.map((p) => (
                            <span
                                key={`num-${p}`}
                                className="text-[11px] font-mono text-amber-200/75 select-none w-8 text-center"
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                    <div className="w-16 sm:w-20 shrink-0" />
                </div>

                {/* Surface de feutre */}
                <div className="flex-1 min-h-0 rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#145337_0%,#0b3824_65%,#051c12_100%)] p-2 sm:p-3 flex flex-col">
                    {/* Grille 3 colonnes × 2 rangées */}
                    <div className="flex-1 min-h-0 grid grid-cols-[1fr_auto_1fr] grid-rows-2 gap-x-1">
                        {/* Rangée 1 — gauche (13..18) */}
                        <div className="flex min-h-0">
                            {TOP_ROW.slice(0, 6).map((p) => renderPoint(p, true))}
                        </div>

                        {/* Barre centrale (unique, row-span-2) : pions frappés + videau positionné selon son propriétaire */}
                        <div
                            className="row-span-2 w-16 sm:w-20 flex flex-col justify-between items-center bg-[#221108] rounded-lg mx-1 border-x-2 border-[#d4af37]/60 py-2"
                            data-testid="central-bar-container"
                        >
                            {/* Zone Haut (Côté Joueur O / Noir) */}
                            <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px]" data-testid="bar-zone-top">
                                {renderBarSection(O_BAR, 'black', bar.O)}
                                {state.cubeOwner === 'O' && (
                                    <DoublingCube
                                        cubeValue={state.cubeValue}
                                        cubeOwner={state.cubeOwner}
                                        canDouble={canDouble}
                                    />
                                )}
                            </div>

                            {/* Zone Centre (Neutre au milieu : avant le premier double) */}
                            <div className="flex items-center justify-center min-h-[48px]" data-testid="bar-zone-middle">
                                {state.cubeOwner === null && (
                                    <DoublingCube
                                        cubeValue={state.cubeValue}
                                        cubeOwner={state.cubeOwner}
                                        canDouble={canDouble}
                                    />
                                )}
                            </div>

                            {/* Zone Bas (Côté Joueur X / Blanc) */}
                            <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px]" data-testid="bar-zone-bottom">
                                {state.cubeOwner === 'X' && (
                                    <DoublingCube
                                        cubeValue={state.cubeValue}
                                        cubeOwner={state.cubeOwner}
                                        canDouble={canDouble}
                                    />
                                )}
                                {renderBarSection(X_BAR, 'white', bar.X)}
                            </div>
                        </div>

                        {/* Rangée 1 — droite (19..24) + sabot O */}
                        <div className="flex min-h-0">
                            <div className="flex flex-1">
                                {TOP_ROW.slice(6).map((p) => renderPoint(p, true))}
                            </div>
                            <div className="w-16 sm:w-20 flex flex-col justify-start pt-2">
                                {renderOffTray(O_BAR, off.O)}
                            </div>
                        </div>

                        {/* Rangée 2 — gauche (12..7) */}
                        <div className="flex min-h-0">
                            {BOTTOM_ROW.slice(0, 6).map((p) => renderPoint(p, false))}
                        </div>

                        {/* Rangée 2 — droite (6..1) + sabot X */}
                        <div className="flex min-h-0">
                            <div className="flex flex-1">
                                {BOTTOM_ROW.slice(6).map((p) => renderPoint(p, false))}
                            </div>
                            <div className="w-16 sm:w-20 flex flex-col justify-end pb-2">
                                {renderOffTray(X_BAR, off.X)}
                            </div>
                        </div>
                    </div>

                    {/* Rivière centrale : dés du joueur + dés de l'adversaire */}
                    <div className="flex items-center justify-center gap-6 py-3 shrink-0">
                        {state.dice && (
                            <div className="flex items-center gap-3">
                                {state.dice.map((value, i) => {
                                    const die = i as 0 | 1;
                                    const used = Boolean(usedDice[i]);
                                    const active = selectedDie === die;
                                    return (
                                        <Die
                                            key={i}
                                            value={value}
                                            used={used}
                                            active={active}
                                            disabled={used}
                                            label={`Dé ${i + 1}`}
                                            dataTestId={`board-die-${i}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectDie?.(die);
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                onDieDoubleClick?.(die);
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {opponentDice && (
                            <div
                                data-testid="opponent-dice"
                                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/50 border border-amber-500/40"
                                title="Dés lancés par l'adversaire"
                            >
                                <span className="text-xs font-bold text-amber-300">IA</span>
                                {opponentDice.map((value, i) => (
                                    <span
                                        key={i}
                                        className="w-9 h-9 rounded-md flex items-center justify-center text-lg font-extrabold bg-slate-700 text-amber-200 border border-slate-600"
                                    >
                                        {value}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bordure inférieure : numéros 12..1 */}
                <div className="flex items-center justify-center gap-0 px-1 pt-1 shrink-0">
                    <div className="flex flex-1 justify-around">
                        {BOTTOM_ROW.map((p) => (
                            <span
                                key={`num-${p}`}
                                className="text-[11px] font-mono text-amber-200/75 select-none w-8 text-center"
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                    <div className="w-16 sm:w-20 shrink-0" />
                </div>

                {/* Badges Pip Count Différentiel (±Δ) + toggle masquer/afficher */}
                <PipCountBadge pipX={pipCounts.X} pipO={pipCounts.O} turn={player} />
            </div>
        </div>
    );
}
