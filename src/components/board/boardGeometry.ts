/**
 * Géométrie du plateau de Backgammon — module 100 % pur.
 *
 * Centralise toutes les constantes géométriques (viewBox 16:10) et les fonctions
 * de calcul de positions (flèches, pions, barre, videau, hit-testing), ainsi que
 * les helpers de lecture du plateau (couleur, compte, tassement adaptatif > 5 pions).
 *
 * Ce module ne dépend d'aucun composant React : il est testable isolément et
 * réutilisable par n'importe quel rendu (SVG ou HTML/Tailwind).
 */

import { X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { BoardOrientation, getOrientedRows } from './boardOrientation';

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
export const BORDER_LR = 27; // bordure gauche/droite alignée sur p-5 + p-2.5
export const TRAY_W = 75; // largeur des sabots de sortie alignée sur md:w-20
export const BAR_W = 78; // largeur de la barre centrale alignée sur md:w-20 mx-1

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

export interface CheckerStackLayout {
    /** Nombre de disques 3D physiquement rendus dans la pile (borné à MAX_VISIBLE = 5). */
    readonly visibleCheckers: number;
    /** Vrai si la pile dépasse 5 pions et active le tassement vertical adaptatif (Audit 14/20). */
    readonly isCompressed: boolean;
    /** Chevauchement vertical en pixels entre chaque pion successif (≥ 1px). */
    readonly overlapPx: number;
    /** Index (0..visibleCheckers-1) du pion au sommet de la pile (apex) qui porte le badge et l'interaction. */
    readonly apexIndex: number;
    /** Valeur numérique du badge si checkerCount > MAX_VISIBLE, sinon undefined. */
    readonly badgeCount: number | undefined;
    /** Texte formaté du badge (« ×6 », « ×7 », etc.) ou null. */
    readonly badgeText: string | null;
}

/**
 * Calcule la géométrie d'empilement adaptatif d'une flèche (Audit 14 / 20) :
 * - Tassement vertical progressif au-delà de 5 pions (`overlapPx` adaptatif) pour éviter
 *   tout débordement sur le jan opposé.
 * - Positionnement systématique du badge (`×6`, `×7`...) et de l'interaction sur l'apex
 *   de la pile (en bas de la pile pour `isTopRow=true`, en haut de la pile pour `isTopRow=false`).
 */
export function computeCheckerStackLayout(
    checkerCount: number,
    isTopRow: boolean,
    compactMobile: boolean = false,
): CheckerStackLayout {
    const safeCount = Math.max(0, Math.floor(checkerCount));
    const visibleCheckers = Math.min(safeCount, MAX_VISIBLE);
    const isCompressed = safeCount > MAX_VISIBLE || (compactMobile && safeCount >= 3);
    const extraCheckers =
        safeCount > MAX_VISIBLE
            ? Math.min(10, safeCount - MAX_VISIBLE)
            : compactMobile && safeCount >= 3
              ? safeCount - 2
              : 0;
    const overlapPx =
        safeCount > MAX_VISIBLE
            ? Math.round((compactMobile ? 6 : 4) + extraCheckers * 1.2)
            : compactMobile && safeCount >= 3
              ? Math.round(3 + extraCheckers * 1.5)
              : 1;
    const apexIndex = isTopRow ? Math.max(0, visibleCheckers - 1) : 0;
    const showBadge = safeCount > MAX_VISIBLE || (compactMobile && safeCount >= 3);
    const badgeCount = showBadge ? safeCount : undefined;
    const badgeText = showBadge ? `${safeCount}` : null;

    return {
        visibleCheckers,
        isCompressed,
        overlapPx,
        apexIndex,
        badgeCount,
        badgeText,
    };
}

// ---------------------------------------------------------------------------
// Layout des flèches
// ---------------------------------------------------------------------------

/** Position (x, orientation) d'une flèche 1..24, ou barre / bear-off. */
export function pointLayout(
    point: number,
    orientation: BoardOrientation = 'normal',
    isOff: boolean = false,
): { x: number; top: boolean } {
    if (isOff) {
        if (point === 0) {
            return { x: TRAY_X0 + TRAY_W / 2 - POINT_W / 2, top: orientation === 'normal' ? false : true };
        }
        if (point === 25) {
            return { x: TRAY_X0 + TRAY_W / 2 - POINT_W / 2, top: orientation === 'normal' ? true : false };
        }
    }

    if (point === X_BAR) {
        return { x: BAR_CX - POINT_W / 2, top: orientation === 'normal' ? false : true };
    }
    if (point === O_BAR) {
        return { x: BAR_CX - POINT_W / 2, top: orientation === 'normal' ? true : false };
    }

    const { top: topRow, bottom: bottomRow } = getOrientedRows(orientation);

    const topIdx = topRow.indexOf(point);
    if (topIdx !== -1) {
        if (topIdx < 6) {
            return { x: PTS_X0 + topIdx * POINT_W, top: true };
        } else {
            return { x: BAR_X1 + (topIdx - 6) * POINT_W, top: true };
        }
    }

    const botIdx = bottomRow.indexOf(point);
    if (botIdx !== -1) {
        if (botIdx < 6) {
            return { x: PTS_X0 + botIdx * POINT_W, top: false };
        } else {
            return { x: BAR_X1 + (botIdx - 6) * POINT_W, top: false };
        }
    }

    return { x: 0, top: true };
}
