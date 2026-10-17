'use client';

/**
 * Plateau de Backgammon « Luxury Crisloid / Hector Saxe » — Rendu HTML/Tailwind.
 *
 * Architecture visuelle : pions 3D concaves (finger-dish), flèches cousues en SVG,
 * pile de pions strictement plafonnée à 5 avec badge numérique, indicateur discret
 * de destination au survol (remplace les gros cercles fantômes rouges/verts).
 *
 * Ce composant est un rendu alternatif à `BackgammonBoard.tsx` (SVG). Il se branche
 * sur les mêmes états et handlers du projet :
 *   - `state` (BoardState) : `board`, `turn`, `cubeValue`, `cubeOwner`, `dice`.
 *   - `pipCounts` dérivé de `pipCount(board)`.
 *   - `off` / `borneOff` dérivés de `borneOffCount(board, player)`.
 *   - Handlers : `onCheckerClick`, `onDestinationClick`, `onCheckerRightClick`,
 *     `onCheckerDoubleClick`, `onSelectDie`, `onDeselect`.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    BoardState,
    Player,
    X_BAR,
    O_BAR,
    pipCount,
    borneOffCount,
} from '../../engine/backgammonEngine';

// ---------------------------------------------------------------------------
// Constantes de layout & données statiques
// ---------------------------------------------------------------------------

/** Nombre maximal de pions affichés par pile (règle des 5 + badge). */
const MAX_VISIBLE = 5;

/** Rangée du haut : points 13..24 (de gauche à droite). */
const TOP_ROW = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

/** Rangée du bas : points 12..1 (de gauche à droite). */
const BOTTOM_ROW = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

type CheckerColor = 'white' | 'black';

// ---------------------------------------------------------------------------
// Helpers purs (aucune dépendance React)
// ---------------------------------------------------------------------------

/** Couleur du pion occupant une flèche, ou `null` si vide. */
function getPointColor(board: number[], point: number): CheckerColor | null {
    const value = board[point];
    if (value > 0) return 'white';
    if (value < 0) return 'black';
    return null;
}

/** Nombre absolu de pions sur une flèche. */
function getPointCount(board: number[], point: number): number {
    return Math.abs(board[point] || 0);
}

/** Données dérivées du plateau (pip counts, barre, sorties). */
interface DerivedBoardData {
    pipCounts: { X: number; O: number };
    off: { X: number; O: number };
    bar: { X: number; O: number };
}

function deriveBoardData(board: number[]): DerivedBoardData {
    return {
        pipCounts: pipCount(board),
        off: {
            X: borneOffCount(board, 'X'),
            O: borneOffCount(board, 'O'),
        },
        bar: {
            X: Math.max(0, board[X_BAR]),
            O: Math.max(0, -board[O_BAR]),
        },
    };
}

// ---------------------------------------------------------------------------
// SOUS-COMPOSANT : PION 3D CONCAVE (STYLE CRISLOID / HECTOR SAXE)
// ---------------------------------------------------------------------------

interface CheckerProps {
    color: CheckerColor;
    /** Affiche 6, 7, 8... sur le 5ème pion si la pile > 5. */
    countBadge?: number;
    isPlayable?: boolean;
    isTopChecker?: boolean;
}

export const LuxuryChecker: React.FC<CheckerProps> = ({
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
            {/* Creux central concave (finger-dish avec lumière inversée) */}
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
// SOUS-COMPOSANT : FLÈCHE (POINT) COUSUE EN SVG + PILE DE PIONS PLAFONNÉE À 5
// ---------------------------------------------------------------------------

interface BoardPointProps {
    pointNumber: number; // 1 à 24
    isTopRow: boolean; // true pour 13..24, false pour 12..1
    checkerColor: CheckerColor | null;
    checkerCount: number;
    isTargetDestination?: boolean;
    isBlotTarget?: boolean; // Si un pion adverse isolé peut être frappé
    isSelected?: boolean; // Flèche source sélectionnée
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
    onDoubleClickPoint?: (pointNumber: number) => void;
    onRightClickPoint?: (pointNumber: number, e: React.MouseEvent) => void;
}

export const BoardPoint: React.FC<BoardPointProps> = ({
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
            {/* Triangle SVG haute précision avec ombres et dégradés */}
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

            {/* Pile de pions (maximum 5 affichés pour ne jamais toucher le centre) */}
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

            {/* Indicateur discret de destination au survol */}
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
// SOUS-COMPOSANTS : BARRE, SABOT, DÉS, VIDEAU, BADGES
// ---------------------------------------------------------------------------

interface BarSectionProps {
    barPoint: number;
    color: CheckerColor;
    count: number;
    isPlayable: boolean;
    onClick: (barPoint: number) => void;
    onRightClick: (barPoint: number) => void;
}

const BarSection: React.FC<BarSectionProps> = ({
    barPoint,
    color,
    count,
    isPlayable,
    onClick,
    onRightClick,
}) => {
    const visible = Math.min(count, MAX_VISIBLE);

    return (
        <div
            className="flex flex-col items-center justify-center gap-[2px] py-2"
            onClick={(e) => {
                e.stopPropagation();
                onClick(barPoint);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClick(barPoint);
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

interface OffTrayProps {
    offPoint: number;
    count: number;
    isTarget: boolean;
    onClick: (offPoint: number) => void;
}

const OffTray: React.FC<OffTrayProps> = ({ offPoint, count, isTarget, onClick }) => (
    <div
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2 min-h-[64px] ${isTarget
            ? 'border-emerald-400 bg-emerald-400/10 cursor-pointer'
            : 'border-slate-700 bg-slate-900/40'
            }`}
        onClick={(e) => {
            e.stopPropagation();
            onClick(offPoint);
        }}
    >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sortie</span>
        <span className="text-2xl font-extrabold text-slate-200">{count}</span>
    </div>
);

interface DiceTrayProps {
    dice: [number, number];
    usedDice: boolean[];
    selectedDie: 0 | 1 | null;
    onSelectDie: (die: 0 | 1) => void;
    onDoubleClickDie?: (die: 0 | 1) => void;
}

const DiceTray: React.FC<DiceTrayProps> = ({ dice, usedDice, selectedDie, onSelectDie, onDoubleClickDie }) => (
    <div className="flex items-center gap-3">
        {dice.map((value, i) => {
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
                        onSelectDie(die);
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onDoubleClickDie?.(die);
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
);

interface CubeDisplayProps {
    cubeValue: number;
}

const CubeDisplay: React.FC<CubeDisplayProps> = ({ cubeValue }) => (
    <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Videau</span>
        <div className="w-11 h-11 rounded-md bg-[#fdfaf2] text-slate-900 flex items-center justify-center text-lg font-extrabold shadow-lg border border-slate-700">
            {cubeValue === 1 ? '64' : cubeValue}
        </div>
    </div>
);

interface PipCountBadgesProps {
    pipCounts: { X: number; O: number };
}

const PipCountBadges: React.FC<PipCountBadgesProps> = ({ pipCounts }) => (
    <div className="flex items-center justify-between px-2 pt-3 text-xs font-semibold text-slate-300">
        <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
            O : {pipCounts.O}
        </span>
        <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
            X : {pipCounts.X}
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// COMPOSANT PRINCIPAL : PLATEAU LUXE
// ---------------------------------------------------------------------------

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

    // Destinations légales agrégées pour la source active.
    const ghostDestinations = useMemo(() => {
        if (selectedPoint === null) return [];
        if (selectedDie !== null) {
            const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
            return targets.get(selectedPoint) ?? [];
        }
        const left = leftDieTargets.get(selectedPoint) ?? [];
        const right = rightDieTargets.get(selectedPoint) ?? [];
        return Array.from(new Set([...left, ...right]));
    }, [selectedPoint, selectedDie, leftDieTargets, rightDieTargets]);

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
            if (ghostDestinations.includes(pointNumber) && !hasPlayerChecker) {
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
            if (ghostDestinations.includes(offPoint)) {
                onDestinationClick(offPoint);
            } else {
                onDeselect?.();
            }
        },
        [ghostDestinations, onDestinationClick, onDeselect],
    );

    // --- Drag-and-drop (pointer events) : glisser un pion vers une destination ---
    const [dragState, setDragState] = useState<{
        fromPoint: number;
        startX: number;
        startY: number;
        hasDragged: boolean;
    } | null>(null);
    const didDragRef = useRef(false);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            const target = (e.target as HTMLElement).closest('[data-point]');
            if (!target) return;
            const fromPoint = Number(target.getAttribute('data-point'));
            const count = board[fromPoint];
            const hasPlayerChecker = isX ? count > 0 : count < 0;
            if (!hasPlayerChecker) return;

            setDragState({
                fromPoint,
                startX: e.clientX,
                startY: e.clientY,
                hasDragged: false,
            });
            didDragRef.current = false;
        },
        [board, isX],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
            if (dist > 12 && !dragState.hasDragged) {
                setDragState((prev) => (prev ? { ...prev, hasDragged: true } : null));
                didDragRef.current = true;
            }
        },
        [dragState],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const { fromPoint, hasDragged } = dragState;
            setDragState(null);

            if (!hasDragged) return;

            // Hit-testing : trouve la flèche sous le curseur.
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const target = el?.closest('[data-point]');
            if (!target) return;
            const toPoint = Number(target.getAttribute('data-point'));

            const validDestinations = new Set([
                ...(leftDieTargets.get(fromPoint) ?? []),
                ...(rightDieTargets.get(fromPoint) ?? []),
            ]);
            if (validDestinations.has(toPoint)) {
                onPlayMove?.(fromPoint, toPoint);
            }
        },
        [dragState, leftDieTargets, rightDieTargets, onPlayMove],
    );

    const renderPoint = (point: number, isTopRow: boolean) => {
        const color = getPointColor(board, point);
        const count = getPointCount(board, point);
        const isTarget = ghostDestinations.includes(point);
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
            isTarget={ghostDestinations.includes(offPoint)}
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
            onPointerCancel={() => setDragState(null)}
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
                                onSelectDie={onSelectDie ?? (() => undefined)}
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
