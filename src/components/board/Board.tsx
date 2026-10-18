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

import React, { useCallback, useMemo } from 'react';
import { BoardState, Player, X_BAR, O_BAR, pipCount, borneOffCount } from '../../engine/backgammonEngine';
import { getPointColor, getPointCount } from './boardGeometry';

// ---------------------------------------------------------------------------
// Constantes de layout
// ---------------------------------------------------------------------------

/** Nombre maximal de pions affichés par pile (règle des 5 + badge). */
const MAX_VISIBLE = 5;

/** Rangée du haut : points 13..24 (de gauche à droite). */
const TOP_ROW = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/** Rangée du bas : points 12..1 (de gauche à droite). */
const BOTTOM_ROW = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

type CheckerColor = 'white' | 'black';

// ---------------------------------------------------------------------------
// SOUS-COMPOSANT : PION 3D CONCAVE (STYLE CRISLOID / HECTOR SAXE)
// ---------------------------------------------------------------------------

interface CheckerProps {
    color: CheckerColor;
    countBadge?: number;
    isPlayable?: boolean;
    isTopChecker?: boolean;
}

const LuxuryChecker: React.FC<CheckerProps> = ({
    color,
    countBadge,
    isPlayable = false,
    isTopChecker = false,
}) => {
    const isWhite = color === 'white';

    return (
        <div
            className={`relative w-[42px] h-[42px] xl:w-[46px] xl:h-[46px] rounded-full flex items-center justify-center select-none transition-all duration-300 ease-out ${isPlayable && isTopChecker
                ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 hover:ring-2 hover:ring-amber-400/90'
                : ''
                }`}
            style={{
                background: isWhite
                    ? 'radial-gradient(circle at 30% 28%, #ffffff 0%, #f5ebd6 45%, #cbb894 82%, #8c7651 100%)'
                    : 'radial-gradient(circle at 30% 28%, #52525b 0%, #27272a 42%, #141417 82%, #050507 100%)',
                boxShadow: isWhite
                    ? '0 6px 12px rgba(0,0,0,0.65), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(120,95,60,0.6)'
                    : '0 6px 12px rgba(0,0,0,0.85), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.9)',
                border: isWhite ? '1px solid #dfd1b4' : '1px solid #3f3f46',
            }}
        >
            <div
                className="w-[68%] h-[68%] rounded-full flex items-center justify-center"
                style={{
                    background: isWhite
                        ? 'radial-gradient(circle at 72% 72%, #ffffff 0%, #e6d8bc 58%, #b39d76 100%)'
                        : 'radial-gradient(circle at 72% 72%, #3f3f46 0%, #18181b 60%, #09090b 100%)',
                    boxShadow: isWhite
                        ? 'inset 0 3px 6px rgba(90,70,40,0.45), 0 1px 1px rgba(255,255,255,0.8)'
                        : 'inset 0 4px 7px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.12)',
                }}
            >
                {countBadge !== undefined && countBadge > 5 && (
                    <span
                        className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full shadow-md ${isWhite
                            ? 'bg-amber-900 text-amber-100 border border-amber-300/40'
                            : 'bg-amber-400 text-slate-950'
                            }`}
                    >
                        {countBadge}
                    </span>
                )}
            </div>
        </div>
    );
};

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
    onClickPoint,
    onDoubleClickPoint,
    onRightClickPoint,
}) => {
    const isEven = pointNumber % 2 === 0;
    const visibleCheckers = Math.min(checkerCount, MAX_VISIBLE);

    return (
        <div
            data-point={pointNumber}
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
                                className={
                                    isBlotTarget && checkerCount === 1
                                        ? 'rounded-full ring-4 ring-rose-500 animate-pulse'
                                        : ''
                                }
                            >
                                <LuxuryChecker
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
                        <LuxuryChecker
                            key={idx}
                            color={color}
                            countBadge={count > MAX_VISIBLE && idx === visible - 1 ? count : undefined}
                            isPlayable={isPlayable}
                            isTopChecker={idx === visible - 1}
                        />
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
            className="h-full max-h-full w-full max-w-6xl mx-auto select-none touch-manipulation flex flex-col items-center justify-center"
            onClick={onDeselect}
        >
            {/* Cadre noyer */}
            <div className="w-full h-full rounded-3xl p-3 sm:p-5 shadow-2xl bg-gradient-to-b from-[#4a2a16] via-[#3a2010] to-[#2b170c] flex flex-col">
                {/* Bordure supérieure : numéros 13..24 */}
                <div className="flex items-center justify-center gap-0 px-1 pb-1 shrink-0">
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

                        {/* Barre centrale (unique, row-span-2) : pions frappés + videau au centre */}
                        <div className="row-span-2 w-16 sm:w-20 flex flex-col justify-between bg-[#221108] rounded-lg mx-1 border-x-2 border-[#d4af37]/60">
                            {renderBarSection(O_BAR, 'black', bar.O)}
                            {/* Videau au centre de la barre verticale */}
                            <div className="flex flex-col items-center justify-center gap-1 py-1">
                                <div className="w-11 h-11 rounded-md bg-[#fdfaf2] text-slate-900 flex items-center justify-center text-lg font-extrabold shadow-lg border border-slate-700">
                                    {state.cubeValue === 1 ? '64' : state.cubeValue}
                                </div>
                            </div>
                            {renderBarSection(X_BAR, 'white', bar.X)}
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

                    {/* Rivière centrale : dés uniquement (le videau est au centre de la barre) */}
                    <div className="flex items-center justify-center gap-6 py-3 shrink-0">
                        {state.dice && (
                            <div className="flex items-center gap-3">
                                {state.dice.map((value, i) => {
                                    const die = i as 0 | 1;
                                    const used = Boolean(usedDice[i]);
                                    const active = selectedDie === die;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            data-testid={`board-die-${i}`}
                                            disabled={used}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectDie?.(die);
                                            }}
                                            onDoubleClick={(e) => {
                                                e.stopPropagation();
                                                onDieDoubleClick?.(die);
                                            }}
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-extrabold shadow-md border-2 transition ${used
                                                ? 'bg-slate-700 text-slate-500 border-slate-600 opacity-60'
                                                : active
                                                    ? 'bg-white text-slate-900 border-sky-400 ring-2 ring-sky-400'
                                                    : 'bg-white text-slate-900 border-slate-300 hover:border-sky-300'
                                                }`}
                                        >
                                            {value}
                                        </button>
                                    );
                                })}
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

                {/* Badges Pip Count */}
                <div className="flex items-center justify-between px-2 pt-3 text-xs font-semibold text-slate-300 shrink-0">
                    <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
                        O : {pipCounts.O}
                    </span>
                    <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
                        X : {pipCounts.X}
                    </span>
                </div>
            </div>
        </div>
    );
}
