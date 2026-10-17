'use client';

/**
 * Plateau de Backgammon « Tournament Grade » — Inspiré de Snowie 4 Pro & TrueMoneyGames (TMG).
 *
 * Fonctionnalités majeures :
 *  - Modèle d'interaction Snowie/TMG complet : Drag-and-drop primaire + Clic unique auto-move
 *    (gauche = dé 1, droite = dé 2) + Auto-move intelligent (sélection ciblée & double-clic coup sûr).
 *  - Animation fluide de chaque déplacement : Translation SVG du pion source vers cible en 300 ms
 *    (easing cubic-bezier), file d'attente pour coups séquentiels (multi-coups IA et joueur),
 *    pion adverse frappé qui vole vers la barre avec impact, et bear-off glissant vers le sabot.
 *    Acceptance stricte : AUCUNE TÉLÉPORTATION VISIBLE.
 *  - Animation du lancer de dés : Secouage réaliste (shake puis settle) pour joueur et IA,
 *    puis grisage individuel de chaque dé consommé.
 *  - Rendu épuré façon Snowie/TMG : Feutre vert profond, flèches ivoire doux et bordeaux velours,
 *    cadre noyer sobre, pions à bevel 3D subtil (nacre ivoire et obsidienne) avec highlight doux,
 *    videau décalé pour éviter tout chevauchement avec les pions sur la barre,
 *    sabots de sortie en creux et badges de pip count clairs aux coins.
 *  - Discipline de surbrillance : Un seul halo discret à la couleur du joueur au trait,
 *    rouge et vert réservés exclusivement au Coach, accessibilité ARIA complète.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import BackgammonBoardSkeleton from './BackgammonBoardSkeleton';
import {
    BoardState,
    Move,
    Player,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    pipCount,
    borneOffCount,
    applyMove,
    detectBoardMove,
    DetectedMove,
} from '../../engine/backgammonEngine';
import { soundEngine } from '../../utils/soundEngine';

export interface CoachHighlight {
    played: Move[];
    optimal: Move[];
}

export type ThemeName = 'snowie_classic' | 'tournament' | 'midnight';

export interface BackgammonBoardProps {
    state: BoardState;
    /** Destinations légales pour le dé gauche (d1) : flèche source -> destinations. */
    leftDieTargets: Map<number, number[]>;
    /** Destinations légales pour le dé droit (d2) : flèche source -> destinations. */
    rightDieTargets: Map<number, number[]>;
    /** Flèche source sélectionnée. */
    selectedPoint: number | null;
    /** Dé sélectionné (0 = gauche, 1 = droit) pour l'aperçu fantôme. */
    selectedDie: 0 | 1 | null;
    /** Dés déjà consommés ce tour (pour les griser). */
    usedDice: [boolean, boolean] | boolean[];
    onCheckerClick: (point: number) => void;
    onCheckerDoubleClick?: (point: number) => void;
    onCheckerRightClick: (point: number) => void;
    onDestinationClick: (point: number) => void;
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
    onSelectDie?: (die: 0 | 1) => void;
    onDieDoubleClick?: (die: 0 | 1) => void;
    onDeselect?: () => void;
    coachHighlight?: CoachHighlight | null;
    opponentHighlight?: { from: number; to: number } | null;
    theme?: ThemeName;
    isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Géométrie (viewBox 16:10 standard de compétition)
// ---------------------------------------------------------------------------
const VB_W = 1120;
const VB_H = 700;
const BORDER_TB = 44; // bordure haute/basse (numéros)
const BORDER_LR = 30; // bordure gauche/droite
const TRAY_W = 120; // largeur des sabots de sortie
const BAR_W = 76; // largeur de la barre centrale

const PLAY_X0 = BORDER_LR; // 30
const PLAY_X1 = VB_W - BORDER_LR; // 1090
const PLAY_Y0 = BORDER_TB; // 44
const PLAY_Y1 = VB_H - BORDER_TB; // 656
const PLAY_H = PLAY_Y1 - PLAY_Y0; // 612

const TRAY_X0 = PLAY_X1 - TRAY_W; // 970
const PTS_X0 = PLAY_X0; // 30
const PTS_X1 = TRAY_X0; // 970
const PTS_W = PTS_X1 - PTS_X0; // 940

const BAR_CX = PTS_X0 + PTS_W / 2; // 500
const BAR_X0 = BAR_CX - BAR_W / 2; // 462
const BAR_X1 = BAR_CX + BAR_W / 2; // 538

const HALF_W = BAR_X0 - PTS_X0; // 432
const POINT_W = HALF_W / 6; // 72

const POINT_H = 264; // ~43 % de PLAY_H
const RIVER_H = PLAY_H - 2 * POINT_H; // 84
const TOP_BASE = PLAY_Y0; // 44
const TOP_APEX = TOP_BASE + POINT_H; // 308
const RIVER_Y0 = TOP_APEX; // 308
const RIVER_Y1 = RIVER_Y0 + RIVER_H; // 392
const BOT_APEX = RIVER_Y1; // 392
const BOT_BASE = PLAY_Y1; // 656

const CHECKER_D = POINT_W - 2; // 70 (diamètre ajusté à la base du triangle)
const CHECKER_R = CHECKER_D / 2; // 35
const MAX_VISIBLE = 5; // règle des 5 pions visibles + badge
const CUBE_SIZE = 42;
const CUBE_PAD = 12;

// ---------------------------------------------------------------------------
// Thèmes épurés (Palette feutre / bois noble sans tape-à-l'œil)
// ---------------------------------------------------------------------------
interface Theme {
    frame: string;
    frameInner: string;
    surface: string;
    surfaceInner: string;
    pointA: string;
    pointB: string;
    river: string;
    bar: string;
    barLine: string;
    tray: string;
    trayInner: string;
    traySliceX: string;
    traySliceO: string;
    numberText: string;
    badgeBg: string;
    badgeText: string;
    cubeFace: string;
    cubeText: string;
    ghost: string;
    impact: string;
}

const THEMES: Record<ThemeName, Theme> = {
    snowie_classic: {
        frame: '#2b170c',
        frameInner: '#422413',
        surface: '#0f3d26', // Feutre vert compétition Snowie
        surfaceInner: '#0b2f1d',
        pointA: '#f4ecd8',
        pointB: '#831b28',
        river: '#0b2f1d',
        bar: '#221108',
        barLine: '#d4af37',
        tray: '#1f0f07',
        trayInner: '#120a05',
        traySliceX: '#fcfaf4',
        traySliceO: '#1c1917',
        numberText: '#f5ebd2',
        badgeBg: '#221108',
        badgeText: '#fef08a',
        cubeFace: '#fdfaf2',
        cubeText: '#18181b',
        ghost: '#22c55e',
        impact: '#ef4444',
    },
    tournament: {
        frame: '#5c3a21',
        frameInner: '#7a4f2e',
        surface: '#14532d',
        surfaceInner: '#115e3e',
        pointA: '#e7dcc3',
        pointB: '#1f6f4a',
        river: '#115e3e',
        bar: '#3e2714',
        barLine: '#5c3a21',
        tray: '#3e2714',
        trayInner: '#130a05',
        traySliceX: '#f5f0e6',
        traySliceO: '#1f2937',
        numberText: '#ffffff',
        badgeBg: '#3e2714',
        badgeText: '#ffffff',
        cubeFace: '#f8fafc',
        cubeText: '#0f172a',
        ghost: '#16a34a',
        impact: '#dc2626',
    },
    midnight: {
        frame: '#0b1220',
        frameInner: '#1e293b',
        surface: '#0f172a',
        surfaceInner: '#0d1526',
        pointA: '#3b4a63',
        pointB: '#23405e',
        river: '#0d1526',
        bar: '#1e293b',
        barLine: '#334155',
        tray: '#0b1220',
        trayInner: '#04070a',
        traySliceX: '#cbd5e1',
        traySliceO: '#475569',
        numberText: '#e2e8f0',
        badgeBg: '#1e293b',
        badgeText: '#ffffff',
        cubeFace: '#f59e0b',
        cubeText: '#0f172a',
        ghost: '#22c55e',
        impact: '#ef4444',
    },
};

// ---------------------------------------------------------------------------
// Helpers d'Accessibilité ARIA & Navigation Clavier
// ---------------------------------------------------------------------------
export const TOP_ROW_NAV = [13, 14, 15, 16, 17, 18, 25, 19, 20, 21, 22, 23, 24, 101];
export const BOT_ROW_NAV = [12, 11, 10, 9, 8, 7, 0, 6, 5, 4, 3, 2, 1, 100];

export function getPointAriaLabel(
    point: number,
    board: number[],
    player: Player,
    selectedPoint: number | null,
    ghostDestinations: number[],
    activeDieVal?: number,
): string {
    const isX = player === 'X';
    const count = board[point];
    let label = `Flèche ${point} : `;

    if (count === 0) {
        label += 'vide.';
    } else {
        const owner = count > 0 ? 'X (Blanc)' : 'O (Noir)';
        const abs = Math.abs(count);
        label += `${abs} pion${abs > 1 ? 's' : ''} ${owner}.`;
        if (abs >= 2) {
            label += ' Porte fermée.';
        } else {
            label += ' Blot vulnérable.';
        }
    }

    if (selectedPoint === point) {
        label += ' Flèche sélectionnée.';
    } else if (ghostDestinations.includes(point)) {
        const hit = isX ? count === -1 : count === 1;
        label += ` Destination légale${activeDieVal ? ` avec le dé ${activeDieVal}` : ''}.${hit ? ' Frappe le pion adverse !' : ''} Appuyez sur Entrée pour jouer.`;
    } else if ((isX && count > 0) || (!isX && count < 0)) {
        label += ' Appuyez sur Entrée pour sélectionner ce pion.';
    }

    return label;
}

export function getBarAriaLabel(
    barPoint: number,
    board: number[],
    player: Player,
    selectedPoint: number | null,
    ghostDestinations: number[],
): string {
    const isX = barPoint === X_BAR;
    const count = isX ? board[X_BAR] : -board[O_BAR];
    const ownerName = isX ? 'Joueur X (Blanc)' : 'Joueur O (Noir)';
    let label = `Barre centrale ${ownerName} : `;

    if (count === 0) {
        label += 'aucun pion frappé.';
    } else {
        label += `${count} pion${count > 1 ? 's' : ''} frappé${count > 1 ? 's' : ''}.`;
        if ((isX && player === 'X') || (!isX && player === 'O')) {
            label += ' Prioritaire : vous devez réentrer ce pion sur le plateau avant tout autre déplacement.';
        }
    }

    if (selectedPoint === barPoint) {
        label += ' Pion de barre actuellement sélectionné.';
    } else if (ghostDestinations.includes(barPoint)) {
        label += ' Destination légale.';
    }

    return label;
}

export function getTrayAriaLabel(board: number[], player: Player, canBearOff: boolean): string {
    const isX = player === 'X';
    const count = borneOffCount(board, player);
    let label = `Sabots de sortie : ${count} pion${count > 1 ? 's' : ''} ${isX ? 'X (Blanc)' : 'O (Noir)'} sorti${count > 1 ? 's' : ''}.`;
    if (canBearOff) {
        label += ' Destination légale de sortie (Bear-off). Appuyez sur Entrée pour sortir un pion.';
    }
    return label;
}

// ---------------------------------------------------------------------------
// Helpers Géométriques & Hitbox
// ---------------------------------------------------------------------------
export function pointLayout(point: number): { x: number; top: boolean } {
    if (point >= 13 && point <= 18) {
        return { x: PTS_X0 + (point - 13) * POINT_W, top: true };
    }
    if (point >= 19 && point <= 24) {
        return { x: BAR_X1 + (point - 19) * POINT_W, top: true };
    }
    if (point >= 7 && point <= 12) {
        return { x: PTS_X0 + (12 - point) * POINT_W, top: false };
    }
    if (point >= 1 && point <= 6) {
        return { x: BAR_X1 + (6 - point) * POINT_W, top: false };
    }
    return { x: 0, top: true };
}

export function getPointAtCoordinates(x: number, y: number): number | null {
    // 1. Sabot de sortie (Bear-off)
    if (x >= TRAY_X0 - 10 && x <= VB_W) {
        if (y >= PLAY_Y0 && y <= PLAY_Y0 + PLAY_H / 2) return 25; // O_OFF
        if (y >= PLAY_Y0 + PLAY_H / 2 && y <= PLAY_Y1) return 0; // X_OFF
    }

    // 2. Barre centrale
    if (x >= BAR_X0 - 8 && x <= BAR_X1 + 8) {
        if (y >= PLAY_Y0 && y <= PLAY_Y0 + PLAY_H / 2) return O_BAR;
        if (y >= PLAY_Y0 + PLAY_H / 2 && y <= PLAY_Y1) return X_BAR;
    }

    // 3. Rangée du haut (points 13 à 24)
    if (y >= PLAY_Y0 - 15 && y <= TOP_APEX + 50) {
        if (x >= PTS_X0 - 10 && x <= BAR_X0) {
            const idx = Math.floor((x - PTS_X0) / POINT_W);
            if (idx >= 0 && idx < 6) return 13 + idx;
        }
        if (x >= BAR_X1 && x <= TRAY_X0 + 10) {
            const idx = Math.floor((x - BAR_X1) / POINT_W);
            if (idx >= 0 && idx < 6) return 19 + idx;
        }
    }

    // 4. Rangée du bas (points 1 à 12)
    if (y >= BOT_APEX - 50 && y <= PLAY_Y1 + 15) {
        if (x >= PTS_X0 - 10 && x <= BAR_X0) {
            const idx = Math.floor((x - PTS_X0) / POINT_W);
            if (idx >= 0 && idx < 6) return 12 - idx;
        }
        if (x >= BAR_X1 && x <= TRAY_X0 + 10) {
            const idx = Math.floor((x - BAR_X1) / POINT_W);
            if (idx >= 0 && idx < 6) return 6 - idx;
        }
    }

    return null;
}

function trianglePoints(point: number): string {
    const { x, top } = pointLayout(point);
    return top
        ? `${x},${TOP_BASE} ${x + POINT_W},${TOP_BASE} ${x + POINT_W / 2},${TOP_APEX}`
        : `${x},${BOT_BASE} ${x + POINT_W},${BOT_BASE} ${x + POINT_W / 2},${BOT_APEX}`;
}

function stackSpacing(visible: number): number {
    if (visible <= 1) return 0;
    return Math.min(CHECKER_D, (POINT_H - CHECKER_D) / (visible - 1));
}

function checkerCenter(point: number, k: number, visible: number): { cx: number; cy: number } {
    const { x, top } = pointLayout(point);
    const cx = x + POINT_W / 2;
    const sp = stackSpacing(visible);
    const cy = top ? TOP_BASE + CHECKER_R + k * sp : BOT_BASE - CHECKER_R - k * sp;
    return { cx, cy };
}

/**
 * Calcule avec une précision absolue les coordonnées d'un pion sur le plateau :
 * flèche, barre ou sabot de sortie, avec gestion de l'atterrissage.
 */
export function getCheckerCoordinates(
    board: number[],
    point: number,
    player: Player,
    isLanding: boolean = false,
): { cx: number; cy: number } {
    if (point >= 1 && point <= 24) {
        const count = Math.abs(board[point] || 0);
        const targetCount = isLanding ? count + 1 : count;
        const visible = Math.min(Math.max(1, targetCount), MAX_VISIBLE);
        const k = Math.min(Math.max(0, targetCount - 1), visible - 1);
        return checkerCenter(point, k, visible);
    }

    if (point === X_BAR || (point === 0 && player === 'X')) {
        return { cx: BAR_CX, cy: PLAY_Y1 - 85 };
    }
    if (point === O_BAR || (point === 25 && player === 'O')) {
        return { cx: BAR_CX, cy: PLAY_Y0 + 85 };
    }
    if (point === 0 || point === X_OFF) {
        return { cx: TRAY_X0 + TRAY_W / 2, cy: PLAY_Y1 - 70 };
    }
    if (point === 25 || point === O_OFF) {
        return { cx: TRAY_X0 + TRAY_W / 2, cy: PLAY_Y0 + 70 };
    }

    return { cx: VB_W / 2, cy: VB_H / 2 };
}

function ghostLandingIndex(board: number[], to: number, player: Player): number {
    const v = board[to];
    if (player === 'X') return v > 0 ? v : 0;
    return v < 0 ? -v : 0;
}

function isHit(board: number[], to: number, player: Player): boolean {
    return player === 'X' ? board[to] === -1 : board[to] === 1;
}

// ---------------------------------------------------------------------------
// Barre & Videau (Positionnement sans chevauchement)
// ---------------------------------------------------------------------------
export interface BarLayout {
    cube: {
        x: number;
        y: number;
        size: number;
        label: string;
    };
    xCheckers: Array<{ cx: number; cy: number }>;
    oCheckers: Array<{ cx: number; cy: number }>;
    xBadge: { cx: number; cy: number; count: number } | null;
    oBadge: { cx: number; cy: number; count: number } | null;
}

export function computeBarLayout(
    board: number[],
    cubeOwner: Player | null,
    cubeValue: number,
): BarLayout {
    const BAR_CY = (PLAY_Y0 + PLAY_Y1) / 2;

    const xCount = Math.max(0, board[X_BAR]);
    const oCount = Math.max(0, -board[O_BAR]);

    // Positionnement du videau garantissant l'absence de chevauchement avec les pions de la barre
    let cubeY: number;
    if (cubeOwner === 'O') {
        cubeY = PLAY_Y0 + CUBE_PAD + CUBE_SIZE / 2;
    } else if (cubeOwner === 'X') {
        cubeY = PLAY_Y1 - CUBE_PAD - CUBE_SIZE / 2;
    } else {
        // Videau neutre au centre : s'il y a des pions qui risquent d'empiéter, on le cale dans la rivière
        cubeY = BAR_CY;
    }

    const cubeTop = cubeY - CUBE_SIZE / 2;
    const cubeBottom = cubeY + CUBE_SIZE / 2;
    const cubeLabel = cubeValue === 1 ? '64' : String(cubeValue);

    // Pions O (moitié haute de la barre)
    const oVisible = Math.min(oCount, 4);
    const oMaxY_top = cubeOwner === 'O' ? cubeBottom + CUBE_PAD + CHECKER_R : PLAY_Y0 + CUBE_PAD + CHECKER_R;
    const oMinY_bottom = cubeOwner === null ? cubeTop - CUBE_PAD - CHECKER_R : RIVER_Y0 - CUBE_PAD / 2 - CHECKER_R;
    const oSpan = Math.max(0, oMinY_bottom - oMaxY_top);
    const oSpacing = oVisible > 1 ? Math.min(CHECKER_D * 0.82, oSpan / (oVisible - 1)) : 0;

    const oCheckers: Array<{ cx: number; cy: number }> = [];
    for (let k = 0; k < oVisible; k++) {
        oCheckers.push({ cx: BAR_CX, cy: oMinY_bottom - k * oSpacing });
    }

    const oBadge =
        oCount >= 2 && oVisible > 0
            ? {
                cx: BAR_CX + CHECKER_R * 0.7,
                cy: oMinY_bottom - (oVisible - 1) * oSpacing,
                count: oCount,
            }
            : null;

    // Pions X (moitié basse de la barre)
    const xVisible = Math.min(xCount, 4);
    const xMinY_top = cubeOwner === null ? cubeBottom + CUBE_PAD + CHECKER_R : RIVER_Y1 + CUBE_PAD / 2 + CHECKER_R;
    const xMaxY_bottom = cubeOwner === 'X' ? cubeTop - CUBE_PAD - CHECKER_R : PLAY_Y1 - CUBE_PAD - CHECKER_R;
    const xSpan = Math.max(0, xMaxY_bottom - xMinY_top);
    const xSpacing = xVisible > 1 ? Math.min(CHECKER_D * 0.82, xSpan / (xVisible - 1)) : 0;

    const xCheckers: Array<{ cx: number; cy: number }> = [];
    for (let k = 0; k < xVisible; k++) {
        xCheckers.push({ cx: BAR_CX, cy: xMinY_top + k * xSpacing });
    }

    const xBadge =
        xCount >= 2 && xVisible > 0
            ? {
                cx: BAR_CX + CHECKER_R * 0.7,
                cy: xMinY_top + (xVisible - 1) * xSpacing,
                count: xCount,
            }
            : null;

    return {
        cube: {
            x: BAR_CX,
            y: cubeY,
            size: CUBE_SIZE,
            label: cubeLabel,
        },
        xCheckers,
        oCheckers,
        xBadge,
        oBadge,
    };
}

export function computeCoachGhostPositions(
    board: number[],
    moves: Move[],
    player: Player,
): Array<{ cx: number; cy: number; point: number; landingIndex: number } | null> {
    let simBoard = board.slice();
    return moves.map((m) => {
        if (m.to < 1 || m.to > 24) {
            simBoard = applyMove(simBoard, m, player);
            return null;
        }
        const idx = ghostLandingIndex(simBoard, m.to, player);
        const visible = Math.min(idx + 1, MAX_VISIBLE);
        const ghostK = Math.min(idx, visible - 1);
        const { cx, cy } = checkerCenter(m.to, ghostK, visible);
        simBoard = applyMove(simBoard, m, player);
        return { cx, cy, point: m.to, landingIndex: idx };
    });
}

// ---------------------------------------------------------------------------
// Sous-composant Pion (Bevel 3D, Nacre & Obsidienne)
// ---------------------------------------------------------------------------
const Checker = React.memo(function Checker({
    cx,
    cy,
    isX,
    opacity = 1,
    onClick,
    onDoubleClick,
    onContextMenu,
    onPointerDown,
    onMouseEnter,
    onMouseLeave,
    dataTestId,
    isDragging,
}: {
    cx: number;
    cy: number;
    isX: boolean;
    opacity?: number;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    dataTestId?: string;
    isDragging?: boolean;
}) {
    return (
        <g
            opacity={opacity}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            onPointerDown={onPointerDown}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={
                onClick || onPointerDown
                    ? 'cursor-pointer'
                    : undefined
            }
            data-testid={dataTestId}
            style={{ touchAction: 'none' }}
        >
            {/* Ombre portée douce (séparée du corps pour un rendu net) */}
            <circle
                cx={cx}
                cy={cy + 2.5}
                r={CHECKER_R}
                fill="#000000"
                opacity={0.28}
                filter="url(#bgCheckerBlur)"
                pointerEvents="none"
            />
            {/* Corps du pion : dégradé radial */}
            <circle
                cx={cx}
                cy={cy}
                r={CHECKER_R}
                fill={isX ? 'url(#bgGradX3D)' : 'url(#bgGradO3D)'}
                stroke={isX ? '#94a3b8' : '#000000'}
                strokeWidth={1}
            />
            {/* Bevel : anneau dégradé donnant l'épaisseur du bord */}
            <circle
                cx={cx}
                cy={cy}
                r={CHECKER_R}
                fill="none"
                stroke={isX ? 'url(#bgBevelX)' : 'url(#bgBevelO)'}
                strokeWidth={CHECKER_R * 0.28}
                pointerEvents="none"
            />
            {/* Reflet spéculaire en haut-gauche */}
            <ellipse
                cx={cx - CHECKER_R * 0.28}
                cy={cy - CHECKER_R * 0.34}
                rx={CHECKER_R * 0.42}
                ry={CHECKER_R * 0.26}
                fill="#ffffff"
                opacity={isX ? 0.5 : 0.16}
                transform={`rotate(-28 ${cx - CHECKER_R * 0.28} ${cy - CHECKER_R * 0.34})`}
                pointerEvents="none"
            />
            {/* Liseré intérieur de profondeur */}
            <circle
                cx={cx}
                cy={cy}
                r={CHECKER_R * 0.82}
                fill="none"
                stroke={isX ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.10)'}
                strokeWidth={1}
                pointerEvents="none"
            />
        </g>
    );
});

const PIP_LAYOUTS: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.3, 0.3], [0.7, 0.7]],
    3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
    4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
    5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
    6: [[0.3, 0.26], [0.7, 0.26], [0.3, 0.5], [0.7, 0.5], [0.3, 0.74], [0.7, 0.74]],
};

function DieFace({
    value,
    cx,
    cy,
    size,
    used,
}: {
    value: number;
    cx: number;
    cy: number;
    size: number;
    used: boolean;
}) {
    const x = cx - size / 2;
    const y = cy - size / 2;
    const pips = PIP_LAYOUTS[value] ?? [];
    return (
        <g opacity={used ? 0.28 : 1} style={{ transition: 'opacity 250ms ease' }}>
            <rect
                x={x}
                y={y + 2}
                width={size}
                height={size}
                rx={size * 0.2}
                fill="#000000"
                opacity={0.3}
                filter="url(#bgCheckerBlur)"
            />
            <rect
                x={x}
                y={y}
                width={size}
                height={size}
                rx={size * 0.2}
                fill={used ? '#e2e8f0' : '#ffffff'}
                stroke={used ? '#94a3b8' : '#0f172a'}
                strokeWidth={used ? 1.5 : 2}
            />
            <rect
                x={x}
                y={y}
                width={size}
                height={size}
                rx={size * 0.2}
                fill="none"
                stroke="url(#bgBevelX)"
                strokeWidth={3}
            />
            <rect
                x={x + size * 0.12}
                y={y + size * 0.08}
                width={size * 0.76}
                height={size * 0.3}
                rx={size * 0.12}
                fill="#ffffff"
                opacity={0.4}
            />
            {pips.map(([px, py], i) => (
                <circle
                    key={i}
                    cx={x + px * size}
                    cy={y + py * size}
                    r={size * 0.088}
                    fill={used ? '#64748b' : '#0f172a'}
                />
            ))}
        </g>
    );
}

// ---------------------------------------------------------------------------
// Définitions SVG mémoïsées (0 recalcul lors des re-rendus)
// ---------------------------------------------------------------------------
const BoardSvgDefs = React.memo(function BoardSvgDefs() {
    return (
        <defs>
            <filter id="bgCheckerBlur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" />
            </filter>
            {/* Texture de feutre : grain fin via turbulence (1 octave pour la perf) */}
            <filter id="bgFeltTexture" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="noise" />
                <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
                <feComponentTransfer in="gray" result="faded">
                    <feFuncA type="linear" slope="0.06" />
                </feComponentTransfer>
                <feBlend in="SourceGraphic" in2="faded" mode="multiply" />
            </filter>
            {/* Texture de bois : veinage horizontal (1 octave pour la perf) */}
            <filter id="bgWoodTexture" x="0%" y="0%" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="1" seed="11" result="noise" />
                <feColorMatrix in="noise" type="saturate" values="0" result="gray" />
                <feComponentTransfer in="gray" result="faded">
                    <feFuncA type="linear" slope="0.10" />
                </feComponentTransfer>
                <feBlend in="SourceGraphic" in2="faded" mode="multiply" />
            </filter>
            {/* Dégradé bois noyer (veinage vertical clair→sombre) */}
            <linearGradient id="bgWoodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a2a16" />
                <stop offset="50%" stopColor="#3a2010" />
                <stop offset="100%" stopColor="#2b170c" />
            </linearGradient>
            <filter id="bgCheckerShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#000000" floodOpacity="0.45" />
            </filter>
            <radialGradient id="bgGradX3D" cx="35%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#f1f5f9" />
                <stop offset="70%" stopColor="#dbe3ec" />
                <stop offset="100%" stopColor="#aeb9c7" />
            </radialGradient>
            <radialGradient id="bgGradO3D" cx="35%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#5b6b82" />
                <stop offset="40%" stopColor="#263449" />
                <stop offset="75%" stopColor="#111a2b" />
                <stop offset="100%" stopColor="#05080f" />
            </radialGradient>
            <linearGradient id="bgBevelX" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="bgBevelO" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#1e293b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </linearGradient>
            {/* Dégradés de flèches (profondeur : clair à la base, sombre à la pointe) */}
            <linearGradient id="bgPointA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fdfaf0" />
                <stop offset="100%" stopColor="#e8dfc8" />
            </linearGradient>
            <linearGradient id="bgPointB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9a2433" />
                <stop offset="100%" stopColor="#6d1622" />
            </linearGradient>
            <style>
                {`
                    @keyframes diceShakeAnim {
                        0% { transform: translate(0, 0) rotate(0deg); }
                        20% { transform: translate(-3px, 2px) rotate(-8deg); }
                        40% { transform: translate(3px, -2px) rotate(8deg); }
                        60% { transform: translate(-2px, -3px) rotate(-5deg); }
                        80% { transform: translate(2px, 2px) rotate(5deg); }
                        100% { transform: translate(0, 0) rotate(0deg); }
                    }
                    @keyframes diceSettleAnim {
                        0% { transform: scale(1.08) translate(0, -4px); }
                        60% { transform: scale(0.97) translate(0, 1px); }
                        100% { transform: scale(1) translate(0, 0); }
                    }
                    .dice-shaking {
                        animation: diceShakeAnim 0.12s infinite linear;
                        transform-origin: center;
                    }
                    .dice-settling {
                        animation: diceSettleAnim 0.18s ease-out forwards;
                        transform-origin: center;
                    }
                `}
            </style>
        </defs>
    );
});

interface PointStackProps {
    point: number;
    count: number;
    isTurnPlayer: boolean;
    onPointerDown?: (e: React.PointerEvent) => void;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    badgeBg: string;
    badgeText: string;
}

function PointStackComponent({
    point,
    count,
    isTurnPlayer,
    onPointerDown,
    onClick,
    onDoubleClick,
    onContextMenu,
    onMouseEnter,
    onMouseLeave,
    badgeBg,
    badgeText,
}: PointStackProps) {
    if (count === 0) return null;
    const ownerIsX = count > 0;
    const n = Math.abs(count);
    const visible = Math.min(n, MAX_VISIBLE);
    const interactive = isTurnPlayer;
    const out = [];

    for (let k = 0; k < visible; k++) {
        const { cx, cy } = checkerCenter(point, k, visible);
        out.push(
            <Checker
                key={`p${point}-${k}`}
                cx={cx}
                cy={cy}
                isX={ownerIsX}
                dataTestId={`checker-p${point}-${k}`}
                onPointerDown={interactive ? onPointerDown : undefined}
                onClick={interactive ? onClick : undefined}
                onDoubleClick={interactive ? onDoubleClick : undefined}
                onContextMenu={interactive ? onContextMenu : undefined}
                onMouseEnter={interactive ? onMouseEnter : undefined}
                onMouseLeave={interactive ? onMouseLeave : undefined}
            />,
        );
    }

    if (n > MAX_VISIBLE) {
        const { cx, cy } = checkerCenter(point, visible - 1, visible);
        out.push(
            <g key={`badge${point}`} pointerEvents="none" data-testid={`overstack-badge-${point}`}>
                <circle cx={cx} cy={cy} r={CHECKER_R * 0.52} fill={badgeBg} stroke={badgeText} strokeWidth={1.5} />
                <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={CHECKER_R * 0.62}
                    fontWeight={700}
                    fill={badgeText}
                    data-testid={`overstack-badge-text-${point}`}
                >
                    {n}
                </text>
            </g>,
        );
    }
    return <g key={`stack-${point}`}>{out}</g>;
}

function arePointStackPropsEqual(prev: PointStackProps, next: PointStackProps): boolean {
    return (
        prev.point === next.point &&
        prev.count === next.count &&
        prev.isTurnPlayer === next.isTurnPlayer &&
        prev.badgeBg === next.badgeBg &&
        prev.badgeText === next.badgeText &&
        prev.onClick === next.onClick &&
        prev.onPointerDown === next.onPointerDown &&
        prev.onDoubleClick === next.onDoubleClick &&
        prev.onContextMenu === next.onContextMenu
    );
}

const PointStack = React.memo(PointStackComponent, arePointStackPropsEqual);

// ---------------------------------------------------------------------------
// Composant Principal
// ---------------------------------------------------------------------------
interface AnimatingMoveState {
    id: number;
    move: DetectedMove;
    startPos: { cx: number; cy: number };
    endPos: { cx: number; cy: number };
    hitStartPos?: { cx: number; cy: number };
    hitEndPos?: { cx: number; cy: number };
}

function BackgammonBoardComponent({
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
    onPlayMove,
    onSelectDie,
    onDieDoubleClick,
    onDeselect,
    coachHighlight = null,
    opponentHighlight = null,
    theme = 'snowie_classic',
    isLoading = false,
}: BackgammonBoardProps) {
    const T = THEMES[theme];
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    const player = state.turn;
    const isX = player === 'X';

    // --- 1. GESTION DES COUPS SÉQUENTIELS ET ANIMATIONS SANS TÉLÉPORTATION ---
    const prevBoardRef = useRef<number[]>(state.board.slice());
    const queueRef = useRef<DetectedMove[]>([]);
    const [activeAnim, setActiveAnim] = useState<AnimatingMoveState | null>(null);
    const [animPhase, setAnimPhase] = useState<'start' | 'moving'>('start');
    const animIdCounterRef = useRef(0);

    const processNextInQueue = useCallback(() => {
        if (queueRef.current.length === 0) {
            setActiveAnim(null);
            return;
        }

        const move = queueRef.current.shift()!;
        const startPos = getCheckerCoordinates(prevBoardRef.current, move.from, move.player, false);
        const endPos = getCheckerCoordinates(state.board, move.to, move.player, true);

        let hitStartPos: { cx: number; cy: number } | undefined;
        let hitEndPos: { cx: number; cy: number } | undefined;

        if (move.isHit) {
            const victimPlayer: Player = move.player === 'X' ? 'O' : 'X';
            hitStartPos = { cx: endPos.cx, cy: endPos.cy };
            hitEndPos = getCheckerCoordinates(state.board, victimPlayer === 'X' ? X_BAR : O_BAR, victimPlayer, true);
            soundEngine.playHit();
        } else if (move.isBearOff) {
            soundEngine.playBearOff();
        } else {
            soundEngine.playCheckerMove();
        }

        const animId = ++animIdCounterRef.current;
        setActiveAnim({
            id: animId,
            move,
            startPos,
            endPos,
            hitStartPos,
            hitEndPos,
        });
        setAnimPhase('start');

        // Transition SVG vers la position cible au tick suivant (300 ms easing)
        const frameTimer = setTimeout(() => {
            setAnimPhase('moving');
        }, 20);

        // Fin de l'animation après 300 ms : pose nette et passage au coup suivant
        const endTimer = setTimeout(() => {
            setActiveAnim(null);
            setTimeout(() => {
                processNextInQueue();
            }, 30);
        }, 320);

        return () => {
            clearTimeout(frameTimer);
            clearTimeout(endTimer);
        };
    }, [state.board]);

    const activeAnimRef = useRef<AnimatingMoveState | null>(null);
    activeAnimRef.current = activeAnim;

    useEffect(() => {
        const prev = prevBoardRef.current;
        const next = state.board;
        const detected = detectBoardMove(prev, next);

        prevBoardRef.current = next.slice();

        if (detected && !opponentHighlight) {
            queueRef.current.push(detected);
            if (!activeAnimRef.current) {
                processNextInQueue();
            }
        } else {
            // Changement multiple, reset complet de partie ou géré par opponentHighlight
            queueRef.current = [];
            setActiveAnim(null);
        }
    }, [state.board, opponentHighlight, processNextInQueue]);

    // Plateau d'affichage statique : masque le pion qui vole pour garantir ZERO téléportation
    const displayBoard = useMemo(() => {
        if (!activeAnim) return state.board;
        const b = state.board.slice();
        const { move } = activeAnim;

        // Soustrait temporairement le pion qui vole sur la case cible
        if (move.to >= 1 && move.to <= 24) {
            if (move.player === 'X') {
                b[move.to] = Math.max(0, b[move.to] - 1);
            } else {
                b[move.to] = Math.min(0, b[move.to] + 1);
            }
        }
        // Si frappe, le pion adverse n'est pas encore sur la barre
        if (move.isHit) {
            if (move.player === 'X') {
                // Victime O
                b[O_BAR] = Math.min(0, b[O_BAR] + 1);
            } else {
                // Victime X
                b[X_BAR] = Math.max(0, b[X_BAR] - 1);
            }
        }
        return b;
    }, [state.board, activeAnim]);

    const barLayout = computeBarLayout(displayBoard, state.cubeOwner, state.cubeValue);
    const pips = pipCount(displayBoard);

    // --- 2. ANIMATION DU LANCER DE DÉS (SHAKE PUIS SETTLE) ---
    const prevDiceKeyRef = useRef<string>('');
    const [diceAnimState, setDiceAnimState] = useState<'idle' | 'shaking' | 'settling'>('idle');

    useEffect(() => {
        if (!state.dice) {
            prevDiceKeyRef.current = '';
            setDiceAnimState('idle');
            return;
        }

        const currentKey = `${state.dice[0]}-${state.dice[1]}-${state.turn}`;
        if (prevDiceKeyRef.current && prevDiceKeyRef.current !== currentKey) {
            // Nouveau lancer de dés détecté (joueur ou IA)
            soundEngine.playDiceRoll();
            setDiceAnimState('shaking');

            const settleTimer = setTimeout(() => {
                setDiceAnimState('settling');
            }, 260);

            const idleTimer = setTimeout(() => {
                setDiceAnimState('idle');
            }, 440);

            prevDiceKeyRef.current = currentKey;
            return () => {
                clearTimeout(settleTimer);
                clearTimeout(idleTimer);
            };
        }
        prevDiceKeyRef.current = currentKey;
    }, [state.dice, state.turn]);

    // --- 3. DRAG-AND-DROP PRIMAIRE (POINTER EVENTS) ---
    const svgRef = useRef<SVGSVGElement | null>(null);

    const getSvgCoords = useCallback((clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        if (typeof svgRef.current.createSVGPoint === 'function' && typeof svgRef.current.getScreenCTM === 'function') {
            const pt = svgRef.current.createSVGPoint();
            pt.x = clientX;
            pt.y = clientY;
            const ctm = svgRef.current.getScreenCTM();
            if (ctm) {
                const svgP = pt.matrixTransform(ctm.inverse());
                return { x: svgP.x, y: svgP.y };
            }
        }
        const rect = svgRef.current.getBoundingClientRect?.() ?? { left: 0, top: 0, width: VB_W, height: VB_H };
        const w = rect.width || VB_W;
        const h = rect.height || VB_H;
        const scaleX = VB_W / w;
        const scaleY = VB_H / h;
        return {
            x: (clientX - (rect.left || 0)) * scaleX,
            y: (clientY - (rect.top || 0)) * scaleY,
        };
    }, []);

    const [dragState, setDragState] = useState<{
        fromPoint: number;
        currentX: number;
        currentY: number;
        pointerId: number;
        startX: number;
        startY: number;
        hasDragged: boolean;
        validDestinations: number[];
    } | null>(null);

    const [dragHoverPoint, setDragHoverPoint] = useState<number | null>(null);
    const didDragRef = useRef(false);

    const handleExecuteMove = useCallback(
        (from: number, to: number) => {
            if (onPlayMove) {
                onPlayMove(from, to);
            } else {
                onCheckerClick(from);
                onDestinationClick(to);
            }
        },
        [onPlayMove, onCheckerClick, onDestinationClick],
    );

    const handleCheckerPointerDown = useCallback(
        (e: React.PointerEvent, p: number) => {
            if (e.button !== 0) return;
            const count = displayBoard[p];
            const hasPlayerChecker = isX ? count > 0 : count < 0;
            if (!hasPlayerChecker) return;

            const leftDests = leftDieTargets.get(p) ?? [];
            const rightDests = rightDieTargets.get(p) ?? [];
            const validDestinations = Array.from(new Set([...leftDests, ...rightDests]));
            if (validDestinations.length === 0) return;

            const coords = getSvgCoords(e.clientX, e.clientY);
            setDragState({
                fromPoint: p,
                currentX: coords.x,
                currentY: coords.y,
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                hasDragged: false,
                validDestinations,
            });
            didDragRef.current = false;
        },
        [displayBoard, isX, leftDieTargets, rightDieTargets, getSvgCoords],
    );

    const handleSvgPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
            const hasDragged = dragState.hasDragged || dist > 12;
            const coords = getSvgCoords(e.clientX, e.clientY);
            const hoveredPt = getPointAtCoordinates(coords.x, coords.y);
            const isHoverLegal = hoveredPt !== null && dragState.validDestinations.includes(hoveredPt);

            setDragState((prev) =>
                prev
                    ? {
                        ...prev,
                        currentX: coords.x,
                        currentY: coords.y,
                        hasDragged,
                    }
                    : null,
            );
            setDragHoverPoint(isHoverLegal ? hoveredPt : null);
        },
        [dragState, getSvgCoords],
    );

    const handleSvgPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const { fromPoint, hasDragged, validDestinations } = dragState;
            const coords = getSvgCoords(e.clientX, e.clientY);
            const dropTarget = getPointAtCoordinates(coords.x, coords.y);

            setDragState(null);
            setDragHoverPoint(null);

            if (hasDragged) {
                didDragRef.current = true;
                if (dropTarget !== null && validDestinations.includes(dropTarget)) {
                    handleExecuteMove(fromPoint, dropTarget);
                }
            }
        },
        [dragState, getSvgCoords, handleExecuteMove],
    );

    const handleSvgPointerCancel = useCallback(() => {
        setDragState(null);
        setDragHoverPoint(null);
    }, []);

    // --- 4. DESTINATIONS ET SÉLECTION ACTIVE ---
    const isDouble = Boolean(state.dice && state.dice[0] === state.dice[1]);
    const totalMoves = isDouble ? 4 : 2;
    const usedCount = usedDice.filter(Boolean).length;
    const remainingMoves = Math.max(0, totalMoves - usedCount);

    const activeSource = selectedPoint ?? hoveredPoint;
    const activeDie: 0 | 1 =
        selectedDie !== null
            ? selectedDie
            : isDouble
                ? 0
                : usedDice[0] && !usedDice[1]
                    ? 1
                    : 0;

    const ghostDestinations = useMemo(() => {
        if (activeSource === null) return [];
        if (selectedDie !== null) {
            const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
            return targets.get(activeSource) ?? [];
        }
        if (selectedPoint !== null) {
            const l = leftDieTargets.get(activeSource) ?? [];
            const r = rightDieTargets.get(activeSource) ?? [];
            return Array.from(new Set([...l, ...r]));
        }
        const activeTargets = activeDie === 0 ? leftDieTargets : rightDieTargets;
        return activeTargets.get(activeSource) ?? [];
    }, [activeSource, selectedDie, selectedPoint, leftDieTargets, rightDieTargets, activeDie]);

    const canBearOff =
        activeSource !== null &&
        (isX ? ghostDestinations.includes(0) : ghostDestinations.includes(25));

    // Double-clic auto-move vers destination par défaut
    const lastCheckerClickRef = useRef<{ point: number; time: number } | null>(null);
    const lastCheckerDblTimeRef = useRef<number>(0);

    const handleCheckerClickWrapped = useCallback(
        (p: number) => {
            if (didDragRef.current) {
                didDragRef.current = false;
                return;
            }
            const now = Date.now();
            if (
                lastCheckerClickRef.current &&
                lastCheckerClickRef.current.point === p &&
                now - lastCheckerClickRef.current.time < 350
            ) {
                lastCheckerClickRef.current = null;
                if (now - lastCheckerDblTimeRef.current >= 350) {
                    lastCheckerDblTimeRef.current = now;
                    onCheckerDoubleClick?.(p);
                }
                return;
            }
            lastCheckerClickRef.current = { point: p, time: now };
            onCheckerClick(p);
        },
        [onCheckerClick, onCheckerDoubleClick],
    );

    const handleCheckerNativeDblClick = useCallback(
        (p: number) => {
            const now = Date.now();
            if (now - lastCheckerDblTimeRef.current < 350) return;
            lastCheckerDblTimeRef.current = now;
            onCheckerDoubleClick?.(p);
        },
        [onCheckerDoubleClick],
    );

    const lastDieClickRef = useRef<{ die: 0 | 1; time: number } | null>(null);
    const lastDieDblTimeRef = useRef<number>(0);

    const handleDieClickWrapped = useCallback(
        (die: 0 | 1) => {
            const now = Date.now();
            if (
                lastDieClickRef.current &&
                lastDieClickRef.current.die === die &&
                now - lastDieClickRef.current.time < 350
            ) {
                lastDieClickRef.current = null;
                if (now - lastDieDblTimeRef.current >= 350) {
                    lastDieDblTimeRef.current = now;
                    onDieDoubleClick?.(die);
                }
                return;
            }
            lastDieClickRef.current = { die, time: now };
            soundEngine.playClick();
            onSelectDie?.(die);
        },
        [onSelectDie, onDieDoubleClick],
    );

    const handleDieNativeDblClick = useCallback(
        (die: 0 | 1) => {
            const now = Date.now();
            if (now - lastDieDblTimeRef.current < 350) return;
            lastDieDblTimeRef.current = now;
            onDieDoubleClick?.(die);
        },
        [onDieDoubleClick],
    );

    // --- 5. ACCESSIBILITÉ ARIA & NAVIGATION CLAVIER ---
    const [keyboardFocusedPoint, setKeyboardFocusedPoint] = useState<number | null>(null);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    const defaultRovingPoint = useMemo(() => {
        if (selectedPoint !== null) return selectedPoint;
        const hasBarCheckers = isX ? displayBoard[X_BAR] > 0 : displayBoard[O_BAR] < 0;
        if (hasBarCheckers) return isX ? X_BAR : O_BAR;
        return isX ? 24 : 1;
    }, [selectedPoint, isX, displayBoard]);

    const currentFocusPoint = keyboardFocusedPoint ?? defaultRovingPoint;
    const activeDieVal = state.dice ? (activeDie === 0 ? state.dice[0] : state.dice[1]) : undefined;

    const focusedPointDescription = useMemo(() => {
        if (currentFocusPoint === 100 || currentFocusPoint === 101) {
            return getTrayAriaLabel(displayBoard, player, canBearOff);
        }
        if (currentFocusPoint === X_BAR || currentFocusPoint === O_BAR) {
            return getBarAriaLabel(currentFocusPoint, displayBoard, player, selectedPoint, ghostDestinations);
        }
        return getPointAriaLabel(currentFocusPoint, displayBoard, player, selectedPoint, ghostDestinations, activeDieVal);
    }, [currentFocusPoint, displayBoard, player, canBearOff, selectedPoint, ghostDestinations, activeDieVal]);

    const handlePointAction = useCallback(
        (p: number) => {
            if (p === 100 || p === 101) {
                if (canBearOff) onDestinationClick(isX ? 0 : 25);
                return;
            }
            if (selectedPoint !== null) {
                if (ghostDestinations.includes(p)) {
                    onDestinationClick(p);
                    return;
                }
                if (p === selectedPoint) {
                    onDeselect?.();
                    return;
                }
                const count = displayBoard[p];
                const hasPlayerChecker = isX ? count > 0 : count < 0;
                if (hasPlayerChecker) {
                    onCheckerClick(p);
                    return;
                }
                onDeselect?.();
                return;
            }
            if (p === X_BAR) {
                if (isX && displayBoard[X_BAR] > 0) onCheckerClick(X_BAR);
                return;
            }
            if (p === O_BAR) {
                if (!isX && displayBoard[O_BAR] < 0) onCheckerClick(O_BAR);
                return;
            }
            const count = displayBoard[p];
            const hasPlayerChecker = isX ? count > 0 : count < 0;
            if (hasPlayerChecker) {
                onCheckerClick(p);
            }
        },
        [canBearOff, selectedPoint, ghostDestinations, isX, displayBoard, onDestinationClick, onCheckerClick, onDeselect],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            setIsKeyboardActive(true);
            let handled = false;
            const current = keyboardFocusedPoint ?? defaultRovingPoint;
            const isTop = TOP_ROW_NAV.includes(current);
            const currentRow = isTop ? TOP_ROW_NAV : BOT_ROW_NAV;
            const currentIndex = currentRow.indexOf(current);

            switch (e.key) {
                case 'ArrowRight': {
                    const nextIdx = Math.min(currentRow.length - 1, (currentIndex === -1 ? 0 : currentIndex) + 1);
                    setKeyboardFocusedPoint(currentRow[nextIdx]);
                    handled = true;
                    break;
                }
                case 'ArrowLeft': {
                    const prevIdx = Math.max(0, (currentIndex === -1 ? 0 : currentIndex) - 1);
                    setKeyboardFocusedPoint(currentRow[prevIdx]);
                    handled = true;
                    break;
                }
                case 'ArrowDown': {
                    if (isTop) {
                        const idx = currentIndex === -1 ? 0 : currentIndex;
                        setKeyboardFocusedPoint(BOT_ROW_NAV[idx]);
                    }
                    handled = true;
                    break;
                }
                case 'ArrowUp': {
                    if (!isTop) {
                        const idx = currentIndex === -1 ? 0 : currentIndex;
                        setKeyboardFocusedPoint(TOP_ROW_NAV[idx]);
                    }
                    handled = true;
                    break;
                }
                case 'Home': {
                    setKeyboardFocusedPoint(currentRow[0]);
                    handled = true;
                    break;
                }
                case 'End': {
                    setKeyboardFocusedPoint(currentRow[currentRow.length - 1]);
                    handled = true;
                    break;
                }
                case 'Enter':
                case ' ': {
                    handlePointAction(current);
                    handled = true;
                    break;
                }
                case 'Escape': {
                    onDeselect?.();
                    handled = true;
                    break;
                }
                case '1': {
                    onSelectDie?.(0);
                    handled = true;
                    break;
                }
                case '2': {
                    onSelectDie?.(1);
                    handled = true;
                    break;
                }
            }

            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        [keyboardFocusedPoint, defaultRovingPoint, handlePointAction, onDeselect, onSelectDie],
    );

    // Handlers stables par point (0 à 25) pour React.memo(Checker)
    const pointClickHandlers = useMemo(
        () => Array.from({ length: 26 }, (_, p) => () => handleCheckerClickWrapped(p)),
        [handleCheckerClickWrapped],
    );
    const pointPointerDownHandlers = useMemo(
        () => Array.from({ length: 26 }, (_, p) => (e: React.PointerEvent) => handleCheckerPointerDown(e, p)),
        [handleCheckerPointerDown],
    );
    const pointDblClickHandlers = useMemo(
        () => Array.from({ length: 26 }, (_, p) => () => handleCheckerNativeDblClick(p)),
        [handleCheckerNativeDblClick],
    );
    const pointRightClickHandlers = useMemo(
        () =>
            Array.from({ length: 26 }, (_, p) => (e: React.MouseEvent) => {
                e.preventDefault();
                onCheckerRightClick(p);
            }),
        [onCheckerRightClick],
    );

    const pointMouseEnterHandlers = useMemo(
        () => Array.from({ length: 26 }, (_, p) => () => setHoveredPoint(p)),
        [],
    );
    const pointMouseLeaveHandler = useCallback(() => setHoveredPoint(null), []);

    // --- 7. DISCIPLINE DE SURBRILLANCE : UN SEUL HALO DISCRET COULEUR DU JOUEUR ---
    function renderDestinationTargets() {
        return ghostDestinations.map((to) => {
            if (to < 1 || to > 24) return null;
            const { x, top } = pointLayout(to);

            return (
                <g key={`dest-target-group-${to}`} className="cursor-pointer" onClick={() => onDestinationClick(to)}>
                    <polygon
                        points={trianglePoints(to)}
                        fill="#22c55e"
                        fillOpacity={0.25}
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        strokeDasharray="6,3"
                        data-testid={`destination-target-${to}`}
                    />
                    <rect
                        x={x}
                        y={top ? TOP_BASE : BOT_BASE - POINT_H}
                        width={POINT_W}
                        height={POINT_H}
                        fill="transparent"
                        pointerEvents="all"
                    />
                </g>
            );
        });
    }

    // --- 8. PIONS FANTÔMES DISCRETS ---
    function renderGhosts() {
        return ghostDestinations.map((to) => {
            if (to < 1 || to > 24) return null;
            const idx = ghostLandingIndex(displayBoard, to, player);
            const visible = Math.min(idx + 1, MAX_VISIBLE);
            const ghostK = Math.min(idx, visible - 1);
            const { cx, cy } = checkerCenter(to, ghostK, visible);
            const hit = isHit(displayBoard, to, player);
            return (
                <g
                    key={`ghost${to}`}
                    onClick={() => onDestinationClick(to)}
                    className="cursor-pointer"
                    pointerEvents="all"
                    data-testid={`ghost-checker-${to}`}
                >
                    <Checker cx={cx} cy={cy} isX={isX} opacity={0.38} dataTestId={`ghost-checker-circle-${to}`} />
                    {hit && (
                        <text
                            x={cx + CHECKER_R * 0.6}
                            y={cy - CHECKER_R * 0.6}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={CHECKER_R * 0.85}
                            fontWeight={800}
                            fill={T.impact}
                            stroke="#ffffff"
                            strokeWidth={2}
                            paintOrder="stroke"
                            data-testid={`ghost-hit-indicator-${to}`}
                        >
                            ✱
                        </text>
                    )}
                </g>
            );
        });
    }

    // --- 9. FANTÔMES DU COACH (RÉSERVÉS STRICTEMENT AU PANNEAU COACH) ---
    function renderCoachGhosts() {
        if (!coachHighlight) return null;
        const render = (moves: Move[], color: string, keyPrefix: string) => {
            const positions = computeCoachGhostPositions(displayBoard, moves, player);
            return positions.map((pos, i) => {
                if (!pos) return null;
                return (
                    <g key={`${keyPrefix}${i}`} pointerEvents="none" data-testid={`${keyPrefix}-${i}`}>
                        <circle cx={pos.cx} cy={pos.cy} r={CHECKER_R} fill={color} opacity={0.5} stroke="#ffffff" strokeWidth={1.5} />
                    </g>
                );
            });
        };
        return (
            <>
                {render(coachHighlight.played, T.impact, 'cg-played')}
                {render(coachHighlight.optimal, T.ghost, 'cg-optimal')}
            </>
        );
    }

    function renderOpponentHighlight() {
        if (!opponentHighlight) return null;
        const { from, to } = opponentHighlight;
        const fromPos = getCheckerCoordinates(displayBoard, from, !isX ? 'X' : 'O', false);
        const toPos = getCheckerCoordinates(displayBoard, to, !isX ? 'X' : 'O', true);

        const midX = (fromPos.cx + toPos.cx) / 2;
        const midY = (fromPos.cy + toPos.cy) / 2 + (fromPos.cy > VB_H / 2 ? -40 : 40);
        const pathD = `M ${fromPos.cx} ${fromPos.cy} Q ${midX} ${midY} ${toPos.cx} ${toPos.cy}`;

        return (
            <g pointerEvents="none" data-testid="opponent-move-highlight">
                <circle
                    cx={fromPos.cx}
                    cy={fromPos.cy}
                    r={CHECKER_R + 6}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="6,3"
                    className="animate-pulse"
                />
                <path d={pathD} fill="none" stroke="#fbbf24" strokeWidth={3.5} strokeDasharray="8,4" opacity={0.85} />
                <circle cx={toPos.cx} cy={toPos.cy} r={CHECKER_R + 6} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth={2.5} />
            </g>
        );
    }

    // --- 10. BARRE CENTRALE & PIONS FRAPPÉS ---
    function renderBarCheckers() {
        const out = [];
        const xInteractive = isX && displayBoard[X_BAR] > 0;
        for (let k = 0; k < barLayout.xCheckers.length; k++) {
            const c = barLayout.xCheckers[k];
            out.push(
                <Checker
                    key={`bx${k}`}
                    cx={c.cx}
                    cy={c.cy}
                    isX
                    dataTestId={`bar-checker-x-${k}`}
                    onPointerDown={xInteractive ? (e) => handleCheckerPointerDown(e, X_BAR) : undefined}
                    onClick={xInteractive ? () => handleCheckerClickWrapped(X_BAR) : undefined}
                    onDoubleClick={xInteractive ? () => handleCheckerNativeDblClick(X_BAR) : undefined}
                    onContextMenu={
                        xInteractive
                            ? (e) => {
                                e.preventDefault();
                                onCheckerRightClick(X_BAR);
                            }
                            : undefined
                    }
                />,
            );
        }
        const oInteractive = !isX && displayBoard[O_BAR] < 0;
        for (let k = 0; k < barLayout.oCheckers.length; k++) {
            const c = barLayout.oCheckers[k];
            out.push(
                <Checker
                    key={`bo${k}`}
                    cx={c.cx}
                    cy={c.cy}
                    isX={false}
                    dataTestId={`bar-checker-o-${k}`}
                    onClick={oInteractive ? () => handleCheckerClickWrapped(O_BAR) : undefined}
                    onDoubleClick={oInteractive ? () => handleCheckerNativeDblClick(O_BAR) : undefined}
                />,
            );
        }
        if (barLayout.xBadge) {
            out.push(
                <g
                    key="bx-badge"
                    onClick={xInteractive ? () => handleCheckerClickWrapped(X_BAR) : undefined}
                    onDoubleClick={xInteractive ? () => handleCheckerNativeDblClick(X_BAR) : undefined}
                    className={xInteractive ? 'cursor-pointer' : undefined}
                    data-testid="bar-badge-x"
                >
                    <circle cx={barLayout.xBadge.cx} cy={barLayout.xBadge.cy} r={13} fill={T.badgeBg} stroke={T.badgeText} strokeWidth={1.5} />
                    <text x={barLayout.xBadge.cx} y={barLayout.xBadge.cy} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={T.badgeText}>{barLayout.xBadge.count}</text>
                </g>,
            );
        }
        if (barLayout.oBadge) {
            out.push(
                <g
                    key="bo-badge"
                    onClick={oInteractive ? () => onCheckerClick(O_BAR) : undefined}
                    className={oInteractive ? 'cursor-pointer' : undefined}
                    data-testid="bar-badge-o"
                >
                    <circle cx={barLayout.oBadge.cx} cy={barLayout.oBadge.cy} r={13} fill={T.badgeBg} stroke={T.badgeText} strokeWidth={1.5} />
                    <text x={barLayout.oBadge.cx} y={barLayout.oBadge.cy} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fill={T.badgeText}>{barLayout.oBadge.count}</text>
                </g>,
            );
        }
        return out;
    }

    // --- 11. SABOTS DE SORTIE (BEAR-OFF TRAYS EN CREUX) ---
    function renderTrays() {
        const xOff = borneOffCount(displayBoard, 'X');
        const oOff = borneOffCount(displayBoard, 'O');
        const sliceH = 14;
        const sliceGap = 3;
        const sliceW = TRAY_W - 24;
        const sliceX = TRAY_X0 + 12;
        const out = [];

        // Tranches O empilées depuis le haut
        for (let k = 0; k < oOff; k++) {
            const y = PLAY_Y0 + 8 + k * (sliceH + sliceGap);
            out.push(
                <rect
                    key={`to${k}`}
                    x={sliceX}
                    y={y}
                    width={sliceW}
                    height={sliceH}
                    rx={sliceH / 2}
                    fill={T.traySliceO}
                    stroke="#000000"
                    strokeOpacity={0.4}
                    strokeWidth={1}
                />,
            );
        }

        // Tranches X empilées depuis le bas
        for (let k = 0; k < xOff; k++) {
            const y = PLAY_Y1 - 8 - (k + 1) * (sliceH + sliceGap) + sliceGap;
            out.push(
                <rect
                    key={`tx${k}`}
                    x={sliceX}
                    y={y}
                    width={sliceW}
                    height={sliceH}
                    rx={sliceH / 2}
                    fill={T.traySliceX}
                    stroke="#000000"
                    strokeOpacity={0.25}
                    strokeWidth={1}
                />,
            );
        }

        // Totaux nets
        out.push(
            <text key="to-count" x={TRAY_X0 + TRAY_W / 2} y={PLAY_Y0 + 145} textAnchor="middle" dominantBaseline="central" fontSize={38} fontWeight={800} fill={T.badgeText} opacity={0.88}>
                {oOff}
            </text>,
            <text key="tx-count" x={TRAY_X0 + TRAY_W / 2} y={PLAY_Y1 - 145} textAnchor="middle" dominantBaseline="central" fontSize={38} fontWeight={800} fill={T.badgeText} opacity={0.88}>
                {xOff}
            </text>,
        );

        if (canBearOff) {
            const trayY = isX ? PLAY_Y0 + PLAY_H / 2 + 4 : PLAY_Y0;
            const trayH = PLAY_H / 2 - 4;
            out.push(
                <g
                    key="dest-bearoff"
                    className="cursor-pointer"
                    onClick={() => onDestinationClick(isX ? 0 : 25)}
                    data-testid="destination-target-bearoff"
                >
                    <rect
                        x={TRAY_X0 + 4}
                        y={trayY + 4}
                        width={TRAY_W - 8}
                        height={trayH - 8}
                        rx={10}
                        fill={isX ? 'rgba(255, 255, 255, 0.22)' : 'rgba(15, 23, 42, 0.4)'}
                        stroke={isX ? '#ffffff' : '#64748b'}
                        strokeWidth={2}
                        strokeDasharray="6,3"
                    />
                    <rect
                        x={TRAY_X0 + 12}
                        y={isX ? PLAY_Y1 - 54 : PLAY_Y0 + 24}
                        width={TRAY_W - 24}
                        height={32}
                        rx={8}
                        fill="#15803d"
                        stroke="#4ade80"
                        strokeWidth={1.5}
                    />
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={isX ? PLAY_Y1 - 38 : PLAY_Y0 + 40}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={800}
                        fill="#ffffff"
                        letterSpacing="0.05em"
                    >
                        SORTIE (TAP)
                    </text>
                </g>,
            );
        }

        return out;
    }

    const renderedNumbers = useMemo(() => {
        const out = [];
        for (let i = 0; i < 6; i++) {
            const xL = PTS_X0 + i * POINT_W + POINT_W / 2;
            const xR = BAR_X1 + i * POINT_W + POINT_W / 2;
            out.push(
                <text key={`nt-l${i}`} x={xL} y={BORDER_TB / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={T.numberText}>{13 + i}</text>,
                <text key={`nt-r${i}`} x={xR} y={BORDER_TB / 2 + 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={T.numberText}>{19 + i}</text>,
            );
        }
        for (let i = 0; i < 6; i++) {
            const xL = PTS_X0 + i * POINT_W + POINT_W / 2;
            const xR = BAR_X1 + i * POINT_W + POINT_W / 2;
            out.push(
                <text key={`nb-l${i}`} x={xL} y={VB_H - BORDER_TB / 2 - 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={T.numberText}>{12 - i}</text>,
                <text key={`nb-r${i}`} x={xR} y={VB_H - BORDER_TB / 2 - 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={T.numberText}>{6 - i}</text>,
            );
        }
        return out;
    }, [T.numberText]);

    // --- 12. DÉS & ANIMATION SHAKE/SETTLE ---
    const dice = state.dice;
    const diceCenterX = isX ? (BAR_X1 + PTS_X1) / 2 : (PTS_X0 + BAR_X0) / 2;
    const diceY = (RIVER_Y0 + RIVER_Y1) / 2;
    const DIE = 54;

    // Différentiel de pip count (Convention Snowie : négatif = en avance = vert)
    const diffX = pips.X - pips.O;
    const diffO = pips.O - pips.X;
    const fmtDiff = (d: number) => (d === 0 ? '±0' : d > 0 ? `+${d}` : `${d}`);
    const colorForDiff = (d: number) => (d < 0 ? '#4ade80' : d > 0 ? '#f87171' : '#cbd5e1');

    if (isLoading) {
        return <BackgammonBoardSkeleton theme={theme} />;
    }

    return (
        <div
            className="h-full max-h-full w-full max-w-6xl mx-auto select-none touch-manipulation flex flex-col items-center justify-center"
        >
            {/* Sélecteur de dé tactile mobile (affiché uniquement sur smartphones et tablettes compactes) */}
            {dice && (
                <div
                    data-testid="mobile-dice-selector"
                    className="w-full mb-3 flex md:hidden flex-col sm:flex-row items-center justify-between gap-2.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 shadow-lg backdrop-blur-md"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Sélecteur de dé tactile :
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            data-testid="die-select-0"
                            disabled={Boolean(usedDice[0])}
                            onClick={() => onSelectDie?.(0)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${usedDice[0]
                                ? 'bg-slate-800 text-slate-500 line-through cursor-not-allowed opacity-60'
                                : activeDie === 0
                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span>Dé 1 : {dice[0]}</span>
                            {usedDice[0] ? (
                                <span className="text-[10px] uppercase font-normal">(Joué)</span>
                            ) : activeDie === 0 ? (
                                <span className="text-[10px] uppercase font-normal">(Actif)</span>
                            ) : null}
                        </button>
                        <button
                            type="button"
                            data-testid="die-select-1"
                            disabled={Boolean(usedDice[1])}
                            onClick={() => onSelectDie?.(1)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${usedDice[1]
                                ? 'bg-slate-800 text-slate-500 line-through cursor-not-allowed opacity-60'
                                : activeDie === 1
                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <span>Dé 2 : {dice[1]}</span>
                            {usedDice[1] ? (
                                <span className="text-[10px] uppercase font-normal">(Joué)</span>
                            ) : activeDie === 1 ? (
                                <span className="text-[10px] uppercase font-normal">(Actif)</span>
                            ) : null}
                        </button>
                    </div>
                </div>
            )}

            <div
                className="relative w-full h-full flex items-center justify-center outline-none"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                onPointerMove={handleSvgPointerMove}
                onPointerUp={handleSvgPointerUp}
                onPointerCancel={handleSvgPointerCancel}
            >
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="w-full h-full max-h-full block select-none drop-shadow-2xl"
                    shapeRendering="geometricPrecision"
                    role="region"
                    aria-label="Plateau de jeu de Backgammon"
                    data-testid="backgammon-board"
                    style={{ touchAction: 'manipulation' }}
                >
                    <BoardSvgDefs />

                    {/* Cadre externe noyer veiné */}
                    <rect x={0} y={0} width={VB_W} height={VB_H} rx={16} fill="url(#bgWoodGrad)" filter="url(#bgWoodTexture)" />
                    <rect
                        x={BORDER_LR - 8}
                        y={BORDER_TB - 8}
                        width={VB_W - 2 * BORDER_LR + 16}
                        height={VB_H - 2 * BORDER_TB + 16}
                        rx={8}
                        fill={T.frameInner}
                        filter="url(#bgWoodTexture)"
                    />

                    {/* Surface de jeu feutre texturé (couleur par thème + grain) */}
                    <rect
                        x={PLAY_X0}
                        y={PLAY_Y0}
                        width={PTS_W}
                        height={PLAY_H}
                        fill={T.surface}
                        filter="url(#bgFeltTexture)"
                        onClick={onDeselect}
                        data-testid="board-surface-background"
                    />
                    <rect
                        x={PLAY_X0}
                        y={RIVER_Y0}
                        width={PTS_W}
                        height={RIVER_H}
                        fill={T.river}
                        opacity={0.65}
                        onClick={onDeselect}
                        data-testid="board-river-background"
                    />

                    {/* Flèches (Triangles ivoire et bordeaux) */}
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((p) => {
                        const isEven = p % 2 === 0;
                        const fill = isEven ? 'url(#bgPointA)' : 'url(#bgPointB)';
                        const strokeColor = isEven ? '#c9b98f' : '#4a0d16';
                        const count = displayBoard[p];
                        const hasPlayerCheckers = isX ? count > 0 : count < 0;
                        const isTarget = ghostDestinations.includes(p);
                        const isSelected = selectedPoint === p;
                        const ariaLabel = getPointAriaLabel(p, displayBoard, player, selectedPoint, ghostDestinations, activeDieVal);

                        return (
                            <polygon
                                key={`pt-${p}`}
                                points={trianglePoints(p)}
                                fill={fill}
                                stroke={strokeColor}
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                                role="button"
                                tabIndex={currentFocusPoint === p ? 0 : -1}
                                aria-label={ariaLabel}
                                aria-pressed={isSelected}
                                aria-disabled={!hasPlayerCheckers && !isTarget}
                                onClick={hasPlayerCheckers ? () => handleCheckerClickWrapped(p) : onDeselect}
                                onFocus={() => setKeyboardFocusedPoint(p)}
                                onKeyDown={handleKeyDown}
                                data-testid={`point-triangle-${p}`}
                                className="focus:outline-none"
                            />
                        );
                    })}

                    {/* Indicateurs visuels de focus clavier */}
                    {currentFocusPoint >= 1 && currentFocusPoint <= 24 && (
                        <polygon
                            points={trianglePoints(currentFocusPoint)}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3.5}
                            strokeDasharray="6,3"
                            pointerEvents="none"
                            opacity={keyboardFocusedPoint !== null ? 1 : 0}
                            data-testid={`keyboard-focus-indicator-${currentFocusPoint}`}
                        />
                    )}
                    {currentFocusPoint === X_BAR && (
                        <rect
                            x={BAR_X0 + 3}
                            y={PLAY_Y0 + PLAY_H / 2 + 3}
                            width={BAR_W - 6}
                            height={PLAY_H / 2 - 6}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3.5}
                            strokeDasharray="6,3"
                            pointerEvents="none"
                            opacity={keyboardFocusedPoint !== null ? 1 : 0}
                            data-testid="keyboard-focus-indicator-bar-x"
                        />
                    )}
                    {currentFocusPoint === O_BAR && (
                        <rect
                            x={BAR_X0 + 3}
                            y={PLAY_Y0 + 3}
                            width={BAR_W - 6}
                            height={PLAY_H / 2 - 6}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3.5}
                            strokeDasharray="6,3"
                            pointerEvents="none"
                            opacity={keyboardFocusedPoint !== null ? 1 : 0}
                            data-testid="keyboard-focus-indicator-bar-o"
                        />
                    )}
                    {currentFocusPoint === 100 && (
                        <rect
                            x={TRAY_X0 + 4}
                            y={PLAY_Y0 + PLAY_H / 2 + 6}
                            width={TRAY_W - 8}
                            height={PLAY_H / 2 - 8}
                            rx={8}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3.5}
                            strokeDasharray="6,3"
                            pointerEvents="none"
                            opacity={keyboardFocusedPoint !== null ? 1 : 0}
                            data-testid="keyboard-focus-indicator-tray-x"
                        />
                    )}
                    {currentFocusPoint === 101 && (
                        <rect
                            x={TRAY_X0 + 4}
                            y={PLAY_Y0 + 2}
                            width={TRAY_W - 8}
                            height={PLAY_H / 2 - 8}
                            rx={8}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth={3.5}
                            strokeDasharray="6,3"
                            pointerEvents="none"
                            opacity={keyboardFocusedPoint !== null ? 1 : 0}
                            data-testid="keyboard-focus-indicator-tray-o"
                        />
                    )}

                    {/* Barre centrale */}
                    <rect x={BAR_X0} y={PLAY_Y0} width={BAR_W} height={PLAY_H} fill={T.bar} onClick={onDeselect} />
                    <line x1={BAR_X0} y1={PLAY_Y0} x2={BAR_X0} y2={PLAY_Y1} stroke={T.barLine} strokeWidth={2} />
                    <line x1={BAR_X1} y1={PLAY_Y0} x2={BAR_X1} y2={PLAY_Y1} stroke={T.barLine} strokeWidth={2} />

                    {/* Zones interactives de barre */}
                    <rect
                        x={BAR_X0}
                        y={PLAY_Y0}
                        width={BAR_W}
                        height={PLAY_H / 2}
                        fill="transparent"
                        role="button"
                        tabIndex={currentFocusPoint === O_BAR ? 0 : -1}
                        aria-label={getBarAriaLabel(O_BAR, displayBoard, player, selectedPoint, ghostDestinations)}
                        aria-pressed={selectedPoint === O_BAR}
                        aria-disabled={!(!isX && displayBoard[O_BAR] < 0)}
                        data-testid="bar-zone-o"
                        onClick={!isX && displayBoard[O_BAR] < 0 ? () => onCheckerClick(O_BAR) : onDeselect}
                        onFocus={() => setKeyboardFocusedPoint(O_BAR)}
                        onKeyDown={handleKeyDown}
                        className="focus:outline-none"
                    />
                    <rect
                        x={BAR_X0}
                        y={PLAY_Y0 + PLAY_H / 2}
                        width={BAR_W}
                        height={PLAY_H / 2}
                        fill="transparent"
                        role="button"
                        tabIndex={currentFocusPoint === X_BAR ? 0 : -1}
                        aria-label={getBarAriaLabel(X_BAR, displayBoard, player, selectedPoint, ghostDestinations)}
                        aria-pressed={selectedPoint === X_BAR}
                        aria-disabled={!(isX && displayBoard[X_BAR] > 0)}
                        data-testid="bar-zone-x"
                        onClick={isX && displayBoard[X_BAR] > 0 ? () => onCheckerClick(X_BAR) : onDeselect}
                        onFocus={() => setKeyboardFocusedPoint(X_BAR)}
                        onKeyDown={handleKeyDown}
                        className="focus:outline-none"
                    />

                    {/* Sabots de sortie en creux */}
                    <rect
                        x={TRAY_X0}
                        y={PLAY_Y0}
                        width={TRAY_W}
                        height={PLAY_H / 2 - 4}
                        rx={8}
                        fill={T.tray}
                        role="button"
                        tabIndex={currentFocusPoint === 101 ? 0 : -1}
                        aria-label={getTrayAriaLabel(displayBoard, 'O', !isX && canBearOff)}
                        data-testid="tray-zone-o"
                        onClick={!isX && canBearOff ? () => onDestinationClick(25) : onDeselect}
                        onFocus={() => setKeyboardFocusedPoint(101)}
                        onKeyDown={handleKeyDown}
                        className="focus:outline-none"
                    />
                    <rect
                        x={TRAY_X0}
                        y={PLAY_Y0 + PLAY_H / 2 + 4}
                        width={TRAY_W}
                        height={PLAY_H / 2 - 4}
                        rx={8}
                        fill={T.tray}
                        role="button"
                        tabIndex={currentFocusPoint === 100 ? 0 : -1}
                        aria-label={getTrayAriaLabel(displayBoard, 'X', isX && canBearOff)}
                        data-testid="tray-zone-x"
                        onClick={isX && canBearOff ? () => onDestinationClick(0) : onDeselect}
                        onFocus={() => setKeyboardFocusedPoint(100)}
                        onKeyDown={handleKeyDown}
                        className="focus:outline-none"
                    />
                    {renderTrays()}

                    {/* Numéros en bordure */}
                    {renderedNumbers}

                    {/* Surbrillance de sélection de flèche */}
                    {selectedPoint !== null && selectedPoint >= 1 && selectedPoint <= 24 && (
                        <polygon points={trianglePoints(selectedPoint)} fill="rgba(250, 204, 21, 0.28)" pointerEvents="none" />
                    )}

                    {/* Cibles et halos légaux */}
                    {renderDestinationTargets()}

                    {/* Dépôt Drag-and-Drop */}
                    {dragState && dragState.hasDragged && dragState.validDestinations.map((to) => {
                        if (to < 1 || to > 24) return null;
                        const isHovered = dragHoverPoint === to;
                        return (
                            <polygon
                                key={`drag-target-${to}`}
                                points={trianglePoints(to)}
                                fill={isX ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.5)'}
                                stroke={isX ? '#ffffff' : '#64748b'}
                                strokeWidth={isHovered ? 2.5 : 1.5}
                                strokeDasharray={isHovered ? undefined : '4,2'}
                                pointerEvents="none"
                                data-testid={`drag-target-${to}`}
                            />
                        );
                    })}

                    {/* Pions statiques sur les flèches (mémoïsés) */}
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((p) => (
                        <PointStack
                            key={`point-stack-${p}`}
                            point={p}
                            count={displayBoard[p]}
                            isTurnPlayer={isX ? displayBoard[p] > 0 : displayBoard[p] < 0}
                            badgeBg={T.badgeBg}
                            badgeText={T.badgeText}
                            onClick={pointClickHandlers[p]}
                            onPointerDown={pointPointerDownHandlers[p]}
                            onDoubleClick={pointDblClickHandlers[p]}
                            onContextMenu={pointRightClickHandlers[p]}
                            onMouseEnter={pointMouseEnterHandlers[p]}
                            onMouseLeave={pointMouseLeaveHandler}
                        />
                    ))}

                    {/* Pions sur la barre */}
                    {renderBarCheckers()}

                    {/* Pion sous le curseur en Drag-and-Drop */}
                    {dragState && dragState.hasDragged && (
                        <g pointerEvents="none" style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.75))' }} data-testid="dragged-checker-layer">
                            <Checker
                                cx={dragState.currentX}
                                cy={dragState.currentY}
                                isX={isX}
                                opacity={0.95}
                                isDragging
                                dataTestId="dragged-checker"
                            />
                        </g>
                    )}

                    {/* CALQUE SVG D'ANIMATION DES DÉPLACEMENTS (ZERO TÉLÉPORTATION) */}
                    {activeAnim && (
                        <g data-testid="animating-checker-layer" pointerEvents="none">
                            {/* Pion principal en vol */}
                            <g
                                style={{
                                    transform: `translate(${animPhase === 'moving'
                                        ? activeAnim.endPos.cx - activeAnim.startPos.cx
                                        : 0
                                        }px, ${animPhase === 'moving'
                                            ? activeAnim.endPos.cy - activeAnim.startPos.cy
                                            : 0
                                        }px)`,
                                    transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                <Checker
                                    cx={activeAnim.startPos.cx}
                                    cy={activeAnim.startPos.cy}
                                    isX={activeAnim.move.player === 'X'}
                                    dataTestId="animating-checker"
                                />
                            </g>

                            {/* Si frappe : pion adverse qui vole vers la barre */}
                            {activeAnim.hitStartPos && activeAnim.hitEndPos && (
                                <g
                                    data-testid="hit-flying-checker"
                                    style={{
                                        transform: `translate(${animPhase === 'moving'
                                            ? activeAnim.hitEndPos.cx - activeAnim.hitStartPos.cx
                                            : 0
                                            }px, ${animPhase === 'moving'
                                                ? activeAnim.hitEndPos.cy - activeAnim.hitStartPos.cy
                                                : 0
                                            }px)`,
                                        transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
                                    }}
                                >
                                    <Checker
                                        cx={activeAnim.hitStartPos.cx}
                                        cy={activeAnim.hitStartPos.cy}
                                        isX={activeAnim.move.player === 'O'}
                                    />
                                    <text
                                        x={activeAnim.hitStartPos.cx}
                                        y={activeAnim.hitStartPos.cy}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={CHECKER_R * 0.9}
                                        fontWeight={800}
                                        fill="#ef4444"
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        paintOrder="stroke"
                                    >
                                        ✱
                                    </text>
                                </g>
                            )}
                        </g>
                    )}

                    {/* Fantômes Coach */}
                    {renderCoachGhosts()}

                    {/* Coup de l'adversaire */}
                    {renderOpponentHighlight()}

                    {/* Pions fantômes */}
                    {renderGhosts()}

                    {/* Videau 3D (bevel + reflet + ombre) */}
                    <g pointerEvents="none">
                        <rect
                            x={barLayout.cube.x - barLayout.cube.size / 2}
                            y={barLayout.cube.y - barLayout.cube.size / 2 + 2}
                            width={barLayout.cube.size}
                            height={barLayout.cube.size}
                            rx={6}
                            fill="#000000"
                            opacity={0.3}
                            filter="url(#bgCheckerBlur)"
                        />
                        <rect
                            x={barLayout.cube.x - barLayout.cube.size / 2}
                            y={barLayout.cube.y - barLayout.cube.size / 2}
                            width={barLayout.cube.size}
                            height={barLayout.cube.size}
                            rx={6}
                            fill={T.cubeFace}
                            stroke="#0f172a"
                            strokeWidth={1.5}
                        />
                        <rect
                            x={barLayout.cube.x - barLayout.cube.size / 2}
                            y={barLayout.cube.y - barLayout.cube.size / 2}
                            width={barLayout.cube.size}
                            height={barLayout.cube.size}
                            rx={6}
                            fill="none"
                            stroke="url(#bgBevelX)"
                            strokeWidth={4}
                        />
                        <rect
                            x={barLayout.cube.x - barLayout.cube.size / 2 + 4}
                            y={barLayout.cube.y - barLayout.cube.size / 2 + 3}
                            width={barLayout.cube.size - 8}
                            height={barLayout.cube.size * 0.32}
                            rx={3}
                            fill="#ffffff"
                            opacity={0.35}
                        />
                        <text
                            x={barLayout.cube.x}
                            y={barLayout.cube.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={19}
                            fontWeight={800}
                            fill={T.cubeText}
                        >
                            {barLayout.cube.label}
                        </text>
                    </g>

                    {/* Dés avec animations Shake puis Settle et grisage individuel */}
                    {dice && (
                        <g className={diceAnimState === 'shaking' ? 'dice-shaking' : diceAnimState === 'settling' ? 'dice-settling' : undefined}>
                            {isDouble && (
                                <g pointerEvents="none">
                                    <rect
                                        x={diceCenterX - DIE * 1.3}
                                        y={diceY - DIE * 0.95}
                                        width={DIE * 2.6}
                                        height={20}
                                        rx={6}
                                        fill="rgba(15, 23, 42, 0.85)"
                                        stroke="#f59e0b"
                                        strokeWidth={1}
                                    />
                                    <text
                                        x={diceCenterX}
                                        y={diceY - DIE * 0.95 + 11}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={11}
                                        fontWeight={800}
                                        fill="#fbbf24"
                                    >
                                        DOUBLE · {remainingMoves} / 4 RESTANTS
                                    </text>
                                </g>
                            )}
                            <g
                                onClick={(!isDouble ? !usedDice[0] : remainingMoves > 0) ? () => handleDieClickWrapped(0) : undefined}
                                onDoubleClick={(!isDouble ? !usedDice[0] : remainingMoves > 0) ? () => handleDieNativeDblClick(0) : undefined}
                                className={(!isDouble ? !usedDice[0] : remainingMoves > 0) ? 'cursor-pointer' : undefined}
                                data-testid="board-die-0"
                            >
                                {activeDie === 0 && (!isDouble ? !usedDice[0] : remainingMoves > 0) && (
                                    <rect
                                        x={diceCenterX - DIE * 0.62 - DIE / 2 - 4}
                                        y={diceY - DIE / 2 - 4}
                                        width={DIE + 8}
                                        height={DIE + 8}
                                        rx={DIE * 0.22}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth={2.5}
                                        strokeDasharray="4,2"
                                    />
                                )}
                                <DieFace
                                    value={dice[0]}
                                    cx={diceCenterX - DIE * 0.62}
                                    cy={diceY}
                                    size={DIE}
                                    used={isDouble ? remainingMoves === 0 : Boolean(usedDice[0])}
                                />
                            </g>
                            <g
                                onClick={(!isDouble ? !usedDice[1] : remainingMoves > 0) ? () => handleDieClickWrapped(1) : undefined}
                                onDoubleClick={(!isDouble ? !usedDice[1] : remainingMoves > 0) ? () => handleDieNativeDblClick(1) : undefined}
                                className={(!isDouble ? !usedDice[1] : remainingMoves > 0) ? 'cursor-pointer' : undefined}
                                data-testid="board-die-1"
                            >
                                {activeDie === 1 && (!isDouble ? !usedDice[1] : remainingMoves > 0) && (
                                    <rect
                                        x={diceCenterX + DIE * 0.62 - DIE / 2 - 4}
                                        y={diceY - DIE / 2 - 4}
                                        width={DIE + 8}
                                        height={DIE + 8}
                                        rx={DIE * 0.22}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth={2.5}
                                        strokeDasharray="4,2"
                                    />
                                )}
                                <DieFace
                                    value={dice[1]}
                                    cx={diceCenterX + DIE * 0.62}
                                    cy={diceY}
                                    size={DIE}
                                    used={isDouble ? remainingMoves === 0 : Boolean(usedDice[1])}
                                />
                            </g>
                        </g>
                    )}

                    {/* Badges Pip Count aux coins (lisibilité WCAG AAA & différentiel coloré) */}
                    <g pointerEvents="none">
                        {/* Coin haut droit (O) */}
                        <rect x={TRAY_X0 + 6} y={6} width={TRAY_W - 12} height={32} rx={6} fill={T.badgeBg} stroke="#334155" strokeWidth={1} />
                        <text x={TRAY_X0 + TRAY_W / 2} y={22} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={T.badgeText}>
                            O : {pips.O} <tspan fill={colorForDiff(diffO)}>({fmtDiff(diffO)})</tspan>
                        </text>

                        {/* Coin bas droit (X) */}
                        <rect x={TRAY_X0 + 6} y={VB_H - 38} width={TRAY_W - 12} height={32} rx={6} fill={T.badgeBg} stroke="#334155" strokeWidth={1} />
                        <text x={TRAY_X0 + TRAY_W / 2} y={VB_H - 22} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill={T.badgeText}>
                            X : {pips.X} <tspan fill={colorForDiff(diffX)}>({fmtDiff(diffX)})</tspan>
                        </text>
                    </g>
                </svg>
            </div>

            {/* Barre d'accessibilité & raccourcis clavier (masquée par défaut, visible lors de navigation ou focus clavier) */}
            <aside
                aria-label="Raccourcis clavier du plateau"
                className={`shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 text-xs text-slate-300 shadow-md backdrop-blur-md transition-all duration-200 ${isKeyboardActive
                    ? 'opacity-100 max-h-12 py-1 mt-1'
                    : 'opacity-0 max-h-0 py-0 m-0 overflow-hidden pointer-events-none focus-within:opacity-100 focus-within:max-h-12 focus-within:py-1 focus-within:mt-1 focus-within:pointer-events-auto'
                    }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px]" aria-hidden="true">
                        ⌨
                    </span>
                    <span className="text-slate-300 italic truncate text-[11px]" aria-live="polite">
                        {focusedPointDescription}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-slate-300">← / →</kbd>
                    <span>Flèches</span>
                    <span className="text-slate-600">•</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-slate-300">Entrée</kbd>
                    <span>Jouer</span>
                    <span className="text-slate-600">•</span>
                    <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-slate-300">1 / 2</kbd>
                    <span>Dés</span>
                </div>
            </aside>
        </div>
    );
}

export function areBoardPropsEqual(prev: BackgammonBoardProps, next: BackgammonBoardProps): boolean {
    if (prev.theme !== next.theme) return false;
    if (prev.isLoading !== next.isLoading) return false;
    if (prev.selectedPoint !== next.selectedPoint) return false;
    if (prev.selectedDie !== next.selectedDie) return false;

    if (prev.coachHighlight !== next.coachHighlight) return false;
    if (
        prev.opponentHighlight?.from !== next.opponentHighlight?.from ||
        prev.opponentHighlight?.to !== next.opponentHighlight?.to
    ) {
        return false;
    }

    const prevUsed = prev.usedDice;
    const nextUsed = next.usedDice;
    if (prevUsed.length !== nextUsed.length) return false;
    for (let i = 0; i < prevUsed.length; i++) {
        if (prevUsed[i] !== nextUsed[i]) return false;
    }

    const pState = prev.state;
    const nState = next.state;
    if (pState !== nState) {
        if (pState.turn !== nState.turn) return false;
        if (pState.cubeValue !== nState.cubeValue) return false;
        if (pState.cubeOwner !== nState.cubeOwner) return false;
        if (pState.crawford !== nState.crawford) return false;
        if (pState.scoreX !== nState.scoreX || pState.scoreO !== nState.scoreO) return false;
        if (pState.dice?.[0] !== nState.dice?.[0] || pState.dice?.[1] !== nState.dice?.[1]) return false;
        if (pState.board !== nState.board) {
            for (let i = 0; i < 28; i++) {
                if (pState.board[i] !== nState.board[i]) return false;
            }
        }
    }

    if (prev.leftDieTargets !== next.leftDieTargets) {
        if (prev.leftDieTargets.size !== next.leftDieTargets.size) return false;
    }
    if (prev.rightDieTargets !== next.rightDieTargets) {
        if (prev.rightDieTargets.size !== next.rightDieTargets.size) return false;
    }

    if (prev.onCheckerClick !== next.onCheckerClick) return false;
    if (prev.onCheckerDoubleClick !== next.onCheckerDoubleClick) return false;
    if (prev.onCheckerRightClick !== next.onCheckerRightClick) return false;
    if (prev.onDestinationClick !== next.onDestinationClick) return false;
    if (prev.onPlayMove !== next.onPlayMove) return false;
    if (prev.onSelectDie !== next.onSelectDie) return false;
    if (prev.onDieDoubleClick !== next.onDieDoubleClick) return false;
    if (prev.onDeselect !== next.onDeselect) return false;

    return true;
}

export const BackgammonBoard = React.memo(BackgammonBoardComponent, areBoardPropsEqual);
export default BackgammonBoard;
