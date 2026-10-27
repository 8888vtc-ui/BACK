/**
 * Géométrie, constantes et parseur de notation Backgammon pour MiniBoardDiagram (< 300 lignes, 0 any).
 */

export interface MiniBoardMoveArrow {
    /** Flèche de départ (1..24, 0 = barre X, 25 = barre O). */
    from: number;
    /** Flèche d'arrivée (1..24, 0 = sortie X, 25 = sortie O). */
    to: number;
    /** Indique si le sous-coup frappe un blot adverse (*). */
    isHit?: boolean;
}

export interface MiniBoardDiagramProps {
    board: ReadonlyArray<number>;
    dice?: [number, number] | null;
    turn?: 'X' | 'O';
    playedMove?: string | ReadonlyArray<MiniBoardMoveArrow>;
    optimalMove?: string | ReadonlyArray<MiniBoardMoveArrow>;
    orientation?: 'normal' | 'inverted';
    hideOptimalArrow?: boolean;
    hidePlayedArrow?: boolean;
    highlightedPoints?: ReadonlyArray<number>;
    onPointClick?: (point: number) => void;
    showLegend?: boolean;
    locale?: string;
    className?: string;
}

export const MINI_VB_W = 600;
export const MINI_VB_H = 360;
export const FRAME_PAD_X = 18;
export const FRAME_PAD_Y = 24;
export const TRAY_W = 36;
export const BAR_W = 34;
export const POINT_W = 38;
export const POINT_H = 132;

export const LEFT_QUAD_X0 = FRAME_PAD_X; // 18
export const BAR_X0 = LEFT_QUAD_X0 + 6 * POINT_W; // 246
export const RIGHT_QUAD_X0 = BAR_X0 + BAR_W; // 280
export const TRAY_X0 = RIGHT_QUAD_X0 + 6 * POINT_W + 6; // 514

export const TOP_Y0 = FRAME_PAD_Y; // 24
export const BOT_Y1 = MINI_VB_H - FRAME_PAD_Y; // 336
export const RIVER_Y = MINI_VB_H / 2; // 180

export const CHECKER_R = 14.5;
export const MAX_STACK_VISIBLE = 5;

/** Positions des points (pips) sur un dé 1..6 dans un carré unitaire [-1..1]. */
export const DIE_PIPS: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [[-0.48, -0.48], [0.48, 0.48]],
    3: [[-0.5, -0.5], [0, 0], [0.5, 0.5]],
    4: [[-0.48, -0.48], [0.48, -0.48], [-0.48, 0.48], [0.48, 0.48]],
    5: [[-0.5, -0.5], [0.5, -0.5], [0, 0], [-0.5, 0.5], [0.5, 0.5]],
    6: [[-0.48, -0.52], [0.48, -0.52], [-0.48, 0], [0.48, 0], [-0.48, 0.52], [0.48, 0.52]],
};

/**
 * Parse une notation standard Backgammon (ex: "24/20 13/11", "8/5(2)", "bar/22 6/5*", "24/20/16", "6/off")
 * en liste de segments `{ from, to, isHit }`.
 */
export function parseDiagramMoveNotation(
    notation: string | ReadonlyArray<MiniBoardMoveArrow> | undefined | null,
    turn: 'X' | 'O' = 'X',
): MiniBoardMoveArrow[] {
    if (!notation) return [];
    if (typeof notation !== 'string') return [...notation];

    const trimmed = notation.trim();
    if (!trimmed || trimmed === '—' || trimmed === '-' || /^(pass|drop|take|double|no\s*double)$/i.test(trimmed)) {
        return [];
    }

    const tokens = trimmed.split(/\s+/);
    const arrows: MiniBoardMoveArrow[] = [];

    for (const rawToken of tokens) {
        if (!rawToken.includes('/')) continue;

        const repeatMatch = rawToken.match(/\((\d+)\)$/);
        const repeatCount = repeatMatch ? Math.min(4, Math.max(1, parseInt(repeatMatch[1], 10))) : 1;
        const cleanToken = rawToken.replace(/\(\d+\)$/, '');

        const parts = cleanToken.split('/');
        if (parts.length < 2) continue;

        const parseEndpoint = (part: string): number => {
            const clean = part.replace(/\*/g, '').trim().toLowerCase();
            if (clean === 'bar' || clean === 'off' || clean === '0') {
                return turn === 'X' ? 0 : 25;
            }
            const n = parseInt(clean, 10);
            return Number.isFinite(n) ? n : NaN;
        };

        for (let step = 0; step < parts.length - 1; step++) {
            const from = parseEndpoint(parts[step]);
            const to = parseEndpoint(parts[step + 1]);
            const isHit = parts[step + 1].includes('*');
            if (!Number.isNaN(from) && !Number.isNaN(to)) {
                for (let r = 0; r < repeatCount; r++) {
                    arrows.push({ from, to, isHit });
                }
            }
        }
    }

    return arrows;
}

/**
 * Calcule l'abscisse et l'ordonnée de référence d'un point (1..24, barre, ou bear-off)
 * dans le système de coordonnées du `MiniBoardDiagram`.
 */
export function computeMiniPointCoords(
    point: number,
    turn: 'X' | 'O' = 'X',
    isDestination: boolean = false,
    orientation: 'normal' | 'inverted' = 'normal',
): { x: number; y: number; isTop: boolean } {
    const topPoints =
        orientation === 'normal'
            ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
            : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const botPoints =
        orientation === 'normal'
            ? [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
            : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    if (point <= 0 || point >= 25) {
        if (isDestination) {
            const isTopTray = orientation === 'normal' ? turn === 'O' : turn === 'X';
            return {
                x: TRAY_X0 + TRAY_W / 2,
                y: isTopTray ? TOP_Y0 + 60 : BOT_Y1 - 60,
                isTop: isTopTray,
            };
        }
        const isTopBar = point === 25 || turn === 'O';
        return {
            x: BAR_X0 + BAR_W / 2,
            y: isTopBar ? TOP_Y0 + 62 : BOT_Y1 - 62,
            isTop: isTopBar,
        };
    }

    const topIdx = topPoints.indexOf(point);
    if (topIdx !== -1) {
        const xBase = topIdx < 6 ? LEFT_QUAD_X0 + topIdx * POINT_W : RIGHT_QUAD_X0 + (topIdx - 6) * POINT_W;
        return { x: xBase + POINT_W / 2, y: TOP_Y0 + 76, isTop: true };
    }

    const botIdx = botPoints.indexOf(point);
    if (botIdx !== -1) {
        const xBase = botIdx < 6 ? LEFT_QUAD_X0 + botIdx * POINT_W : RIGHT_QUAD_X0 + (botIdx - 6) * POINT_W;
        return { x: xBase + POINT_W / 2, y: BOT_Y1 - 76, isTop: false };
    }

    return { x: MINI_VB_W / 2, y: RIVER_Y, isTop: true };
}

/** Construit une courbe de Bézier quadratique harmonieuse entre deux points du Mini-Board. */
export function buildMiniCurvedPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    offsetIndex: number = 0,
): string {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return `M ${x1} ${y1} L ${x2} ${y2}`;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const archSign = my < RIVER_Y ? 1 : -1;
    const archMagnitude = Math.min(42, Math.max(16, dist * 0.16)) + offsetIndex * 10;

    const cx = Math.abs(dy) > Math.abs(dx) * 1.4 ? mx + (16 + offsetIndex * 8) : mx;
    const cy = my + archMagnitude * archSign;

    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
