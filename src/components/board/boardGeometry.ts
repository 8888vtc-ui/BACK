/**
 * Géométrie du plateau de Backgammon — module 100 % pur.
 *
 * Centralise toutes les constantes géométriques (viewBox 16:10) et les fonctions
 * de calcul de positions (flèches, pions, barre, videau, hit-testing), ainsi que
 * les helpers de lecture du plateau (couleur, compte).
 *
 * Ce module ne dépend d'aucun composant React : il est testable isolément et
 * réutilisable par n'importe quel rendu (SVG ou HTML/Tailwind).
 */

import { Player, X_BAR, O_BAR, X_OFF, O_OFF, applyMove, Move } from '../../engine/backgammonEngine';

/** Couleur d'un pion : blanc (X) ou noir (O). */
export type CheckerColor = 'white' | 'black';

/**
 * Couleur du pion occupant une flèche, ou `null` si vide.
 * Convention du moteur : `board[p] > 0` = X (blanc), `board[p] < 0` = O (noir).
 */
export function getPointColor(board: number[], point: number): CheckerColor | null {
    const value = board[point];
    if (value > 0) return 'white';
    if (value < 0) return 'black';
    return null;
}

/** Nombre absolu de pions sur une flèche. */
export function getPointCount(board: number[], point: number): number {
    return Math.abs(board[point] || 0);
}

// ---------------------------------------------------------------------------
// Géométrie (viewBox 16:10 standard de compétition)
// ---------------------------------------------------------------------------
export const VB_W = 1120;
export const VB_H = 700;
export const BORDER_TB = 44; // bordure haute/basse (numéros)
export const BORDER_LR = 30; // bordure gauche/droite
export const TRAY_W = 120; // largeur des sabots de sortie
export const BAR_W = 76; // largeur de la barre centrale

export const PLAY_X0 = BORDER_LR; // 30
export const PLAY_X1 = VB_W - BORDER_LR; // 1090
export const PLAY_Y0 = BORDER_TB; // 44
export const PLAY_Y1 = VB_H - BORDER_TB; // 656
export const PLAY_H = PLAY_Y1 - PLAY_Y0; // 612

export const TRAY_X0 = PLAY_X1 - TRAY_W; // 970
export const PTS_X0 = PLAY_X0; // 30
export const PTS_X1 = TRAY_X0; // 970
export const PTS_W = PTS_X1 - PTS_X0; // 940

export const BAR_CX = PTS_X0 + PTS_W / 2; // 500
export const BAR_X0 = BAR_CX - BAR_W / 2; // 462
export const BAR_X1 = BAR_CX + BAR_W / 2; // 538

export const HALF_W = BAR_X0 - PTS_X0; // 432
export const POINT_W = HALF_W / 6; // 72

export const POINT_H = 264; // ~43 % de PLAY_H
export const RIVER_H = PLAY_H - 2 * POINT_H; // 84
export const TOP_BASE = PLAY_Y0; // 44
export const TOP_APEX = TOP_BASE + POINT_H; // 308
export const RIVER_Y0 = TOP_APEX; // 308
export const RIVER_Y1 = RIVER_Y0 + RIVER_H; // 392
export const BOT_APEX = RIVER_Y1; // 392
export const BOT_BASE = PLAY_Y1; // 656

export const CHECKER_D = POINT_W - 2; // 70 (diamètre ajusté à la base du triangle)
export const CHECKER_R = CHECKER_D / 2; // 35
export const MAX_VISIBLE = 5; // règle des 5 pions visibles + badge
export const CUBE_SIZE = 42;
export const CUBE_PAD = 12;

// ---------------------------------------------------------------------------
// Layout des flèches
// ---------------------------------------------------------------------------

/** Position (x, orientation) d'une flèche 1..24. */
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

/** Détermine la flèche (ou barre/sabot) sous des coordonnées SVG. */
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

/** Points du triangle SVG d'une flèche. */
export function trianglePoints(point: number): string {
    const { x, top } = pointLayout(point);
    return top
        ? `${x},${TOP_BASE} ${x + POINT_W},${TOP_BASE} ${x + POINT_W / 2},${TOP_APEX}`
        : `${x},${BOT_BASE} ${x + POINT_W},${BOT_BASE} ${x + POINT_W / 2},${BOT_APEX}`;
}

/** Espacement vertical entre pions d'une pile. */
export function stackSpacing(visible: number): number {
    if (visible <= 1) return 0;
    return Math.min(CHECKER_D, (POINT_H - CHECKER_D) / (visible - 1));
}

/** Centre d'un pion à l'index `k` d'une pile de `visible` pions. */
export function checkerCenter(point: number, k: number, visible: number): { cx: number; cy: number } {
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

/** Index d'atterrissage d'un pion fantôme sur une flèche. */
export function ghostLandingIndex(board: number[], to: number, player: Player): number {
    const v = board[to];
    if (player === 'X') return v > 0 ? v : 0;
    return v < 0 ? -v : 0;
}

/** Vrai si le coup frappe un pion adverse isolé. */
export function isHit(board: number[], to: number, player: Player): boolean {
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
