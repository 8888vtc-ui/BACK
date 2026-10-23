'use client';

/**
 * MiniBoardDiagram — Diagramme vectoriel ultra-léger de position Backgammon avec flèches comparatives.
 *
 * Rôle :
 *   Rend instantanément en SVG pur (sans dépendre d'images PNG statiques ni de ResizeObserver)
 *   une position complète de Backgammon (`board[0..27]`, dés du tour, sens de jeu, sabots)
 *   et superpose :
 *     - en rouge pointillé : le coup joué par l'utilisateur (`playedMove`),
 *     - en vert/or plein : le coup optimal calculé par le moteur (`optimalMove`).
 *
 *   Supporte également un mode interactif (`onPointClick`, `highlightedPoints`, `hideOptimalArrow`)
 *   utilisé par le bouton « Rejouer ce coup » du rapport de fin de match.
 */

import React, { useMemo } from 'react';

export interface MiniBoardMoveArrow {
    /** Flèche de départ (1..24, 0 = barre X, 25 = barre O). */
    from: number;
    /** Flèche d'arrivée (1..24, 0 = sortie X, 25 = sortie O). */
    to: number;
    /** Indique si le sous-coup frappe un blot adverse (*). */
    isHit?: boolean;
}

export interface MiniBoardDiagramProps {
    /** État du plateau (26 à 28 entiers : >0 pions X, <0 pions O, [0]=barre X, [25]=barre O). */
    board: ReadonlyArray<number>;
    /** Dés du tour [d1, d2]. */
    dice?: [number, number] | null;
    /** Joueur au trait ('X' joue 24→1, 'O' joue 1→24). */
    turn?: 'X' | 'O';
    /** Coup joué par l'utilisateur (notation ex: "24/20 13/11" ou liste de mouvements). */
    playedMove?: string | ReadonlyArray<MiniBoardMoveArrow>;
    /** Coup optimal du moteur (notation ex: "24/18" ou liste de mouvements). */
    optimalMove?: string | ReadonlyArray<MiniBoardMoveArrow>;
    /** Orientation visuelle du plateau ('normal' = 13..24 en haut, 12..1 en bas). */
    orientation?: 'normal' | 'inverted';
    /** Masquer la flèche du coup optimal (ex: mode puzzle "Rejouer ce coup"). */
    hideOptimalArrow?: boolean;
    /** Masquer la flèche du coup joué. */
    hidePlayedArrow?: boolean;
    /** Flèches mises en surbrillance en mode interactif. */
    highlightedPoints?: ReadonlyArray<number>;
    /** Callback déclenché au clic sur une flèche (1..24) ou sortie (0/25) en mode interactif. */
    onPointClick?: (point: number) => void;
    /** Afficher la légende comparative sous le plateau. */
    showLegend?: boolean;
    /** Langue d'affichage ('fr' | 'en'). */
    locale?: string;
    /** Classes CSS supplémentaires sur le conteneur. */
    className?: string;
}

// ---------------------------------------------------------------------------
// Constantes géométriques du Mini-Board (viewBox 600 x 360)
// ---------------------------------------------------------------------------
export const MINI_VB_W = 600;
export const MINI_VB_H = 360;
const FRAME_PAD_X = 18;
const FRAME_PAD_Y = 24;
const TRAY_W = 36;
const BAR_W = 34;
const POINT_W = 38;
const POINT_H = 132;

const LEFT_QUAD_X0 = FRAME_PAD_X; // 18
const BAR_X0 = LEFT_QUAD_X0 + 6 * POINT_W; // 246
const RIGHT_QUAD_X0 = BAR_X0 + BAR_W; // 280
const TRAY_X0 = RIGHT_QUAD_X0 + 6 * POINT_W + 6; // 514

const TOP_Y0 = FRAME_PAD_Y; // 24
const BOT_Y1 = MINI_VB_H - FRAME_PAD_Y; // 336
const RIVER_Y = MINI_VB_H / 2; // 180

const CHECKER_R = 14.5;
const MAX_STACK_VISIBLE = 5;

/**
 * Parse une notation standard Backgammon (ex: "24/20 13/11", "8/5(2)", "bar/22 6/5*", "24/20/16", "6/off")
 * en liste de segments `{ from, to, isHit }`.
 */
export function parseDiagramMoveNotation(
    notation: string | ReadonlyArray<MiniBoardMoveArrow> | undefined | null,
    turn: 'X' | 'O' = 'X',
): MiniBoardMoveArrow[] {
    if (!notation) return [];
    if (typeof notation !== 'string') {
        return [...notation];
    }

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

        const parseEndpoint = (part: string, isFrom: boolean): number => {
            const clean = part.replace(/\*/g, '').trim().toLowerCase();
            if (clean === 'bar') {
                return turn === 'X' ? 0 : 25;
            }
            if (clean === 'off' || clean === '0') {
                return isFrom ? (turn === 'X' ? 0 : 25) : turn === 'X' ? 0 : 25;
            }
            const n = parseInt(clean, 10);
            return Number.isFinite(n) ? n : NaN;
        };

        for (let step = 0; step < parts.length - 1; step++) {
            const from = parseEndpoint(parts[step], true);
            const to = parseEndpoint(parts[step + 1], false);
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

    // Barre ou Sortie (0 ou 25)
    if (point <= 0 || point >= 25) {
        if (isDestination) {
            // Sortie (Bear-off tray à droite)
            const isTopTray = orientation === 'normal' ? turn === 'O' : turn === 'X';
            return {
                x: TRAY_X0 + TRAY_W / 2,
                y: isTopTray ? TOP_Y0 + 60 : BOT_Y1 - 60,
                isTop: isTopTray,
            };
        }
        // Barre centrale
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
        return {
            x: xBase + POINT_W / 2,
            y: TOP_Y0 + 76,
            isTop: true,
        };
    }

    const botIdx = botPoints.indexOf(point);
    if (botIdx !== -1) {
        const xBase = botIdx < 6 ? LEFT_QUAD_X0 + botIdx * POINT_W : RIGHT_QUAD_X0 + (botIdx - 6) * POINT_W;
        return {
            x: xBase + POINT_W / 2,
            y: BOT_Y1 - 76,
            isTop: false,
        };
    }

    return { x: MINI_VB_W / 2, y: RIVER_Y, isTop: true };
}

/**
 * Construit une courbe de Bézier quadratique harmonieuse entre deux points du Mini-Board.
 */
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

/** Positions des points (pips) sur un dé 1..6 dans un carré unitaire [-1..1]. */
const DIE_PIPS: Record<number, Array<[number, number]>> = {
    1: [[0, 0]],
    2: [
        [-0.48, -0.48],
        [0.48, 0.48],
    ],
    3: [
        [-0.5, -0.5],
        [0, 0],
        [0.5, 0.5],
    ],
    4: [
        [-0.48, -0.48],
        [0.48, -0.48],
        [-0.48, 0.48],
        [0.48, 0.48],
    ],
    5: [
        [-0.5, -0.5],
        [0.5, -0.5],
        [0, 0],
        [-0.5, 0.5],
        [0.5, 0.5],
    ],
    6: [
        [-0.48, -0.52],
        [0.48, -0.52],
        [-0.48, 0],
        [0.48, 0],
        [-0.48, 0.52],
        [0.48, 0.52],
    ],
};

const MiniBoardDiagramComponent: React.FC<MiniBoardDiagramProps> = ({
    board,
    dice = null,
    turn = 'X',
    playedMove,
    optimalMove,
    orientation = 'normal',
    hideOptimalArrow = false,
    hidePlayedArrow = false,
    highlightedPoints = [],
    onPointClick,
    showLegend = true,
    locale = 'fr',
    className = '',
}) => {
    const isEn = locale === 'en';

    const topPoints = useMemo(
        () =>
            orientation === 'normal'
                ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
                : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        [orientation],
    );

    const botPoints = useMemo(
        () =>
            orientation === 'normal'
                ? [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
                : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        [orientation],
    );

    const playedArrows = useMemo(
        () => (hidePlayedArrow ? [] : parseDiagramMoveNotation(playedMove, turn)),
        [playedMove, turn, hidePlayedArrow],
    );

    const optimalArrows = useMemo(
        () => (hideOptimalArrow ? [] : parseDiagramMoveNotation(optimalMove, turn)),
        [optimalMove, turn, hideOptimalArrow],
    );

    // Calcul des pions sur le plateau, la barre et sortis (borne off)
    const { barX, barO, offX, offO } = useMemo(() => {
        let onBoardX = 0;
        let onBoardO = 0;
        for (let p = 1; p <= 24; p++) {
            const v = board?.[p] ?? 0;
            if (v > 0) onBoardX += v;
            else if (v < 0) onBoardO += Math.abs(v);
        }
        const bx = Math.max(0, board?.[0] ?? 0);
        const bo = Math.abs(Math.min(0, board?.[25] ?? 0));
        return {
            barX: bx,
            barO: bo,
            offX: Math.max(0, 15 - onBoardX - bx),
            offO: Math.max(0, 15 - onBoardO - bo),
        };
    }, [board]);

    const renderPointColumn = (pt: number, idx: number, isTop: boolean) => {
        const x0 = idx < 6 ? LEFT_QUAD_X0 + idx * POINT_W : RIGHT_QUAD_X0 + (idx - 6) * POINT_W;
        const cx = x0 + POINT_W / 2;
        const baseY = isTop ? TOP_Y0 : BOT_Y1;
        const apexY = isTop ? TOP_Y0 + POINT_H : BOT_Y1 - POINT_H;
        const isDarkTriangle = pt % 2 === 1;
        const fillTriangle = isDarkTriangle ? '#5c2c16' : '#c89d54';
        const strokeTriangle = isDarkTriangle ? '#7c3f23' : '#dfba73';

        const rawVal = board?.[pt] ?? 0;
        const count = Math.abs(rawVal);
        const isXChecker = rawVal > 0;
        const visibleCount = Math.min(count, MAX_STACK_VISIBLE);
        const stepY = visibleCount >= 5 ? 23.5 : 26;

        const isHighlighted = highlightedPoints.includes(pt);
        const isInteractive = Boolean(onPointClick);

        return (
            <g
                key={`pt-${pt}`}
                data-testid={`mini-board-point-${pt}`}
                onClick={onPointClick ? () => onPointClick(pt) : undefined}
                className={isInteractive ? 'cursor-pointer' : undefined}
            >
                {/* Zone cliquable transparente pour le mode interactif */}
                <rect
                    x={x0}
                    y={isTop ? TOP_Y0 : BOT_Y1 - POINT_H}
                    width={POINT_W}
                    height={POINT_H}
                    fill={isHighlighted ? 'rgba(243, 198, 95, 0.22)' : 'transparent'}
                    stroke={isHighlighted ? '#f3c65f' : 'none'}
                    strokeWidth={isHighlighted ? 1.5 : 0}
                    rx={4}
                />

                {/* Flèche triangulaire */}
                <polygon
                    points={`${x0 + 2},${baseY} ${x0 + POINT_W - 2},${baseY} ${cx},${apexY}`}
                    fill={fillTriangle}
                    stroke={strokeTriangle}
                    strokeWidth="0.8"
                    opacity="0.92"
                />

                {/* Numéro de la flèche sur la bordure */}
                <text
                    x={cx}
                    y={isTop ? TOP_Y0 - 7 : BOT_Y1 + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fill={isHighlighted ? '#f3c65f' : '#e8dcc6'}
                    opacity={isHighlighted ? 1 : 0.8}
                >
                    {pt}
                </text>

                {/* Pile de pions */}
                {Array.from({ length: visibleCount }).map((_, stackIdx) => {
                    const cy = isTop
                        ? TOP_Y0 + CHECKER_R + 2 + stackIdx * stepY
                        : BOT_Y1 - CHECKER_R - 2 - stackIdx * stepY;
                    const isApex = stackIdx === visibleCount - 1;
                    const showBadge = isApex && count > MAX_STACK_VISIBLE;

                    return (
                        <g
                            key={`checker-${pt}-${stackIdx}`}
                            data-testid={isApex ? `mini-board-checker-${pt}` : undefined}
                        >
                            <circle
                                cx={cx}
                                cy={cy}
                                r={CHECKER_R}
                                fill={isXChecker ? 'url(#mini-checker-x)' : 'url(#mini-checker-o)'}
                                stroke={isXChecker ? '#fff8e7' : '#d4af37'}
                                strokeWidth={isXChecker ? '1.3' : '1.1'}
                            />
                            <circle
                                cx={cx}
                                cy={cy}
                                r={CHECKER_R - 4}
                                fill="none"
                                stroke={isXChecker ? 'rgba(180,145,80,0.35)' : 'rgba(243,198,95,0.28)'}
                                strokeWidth="0.9"
                            />
                            {showBadge && (
                                <text
                                    x={cx}
                                    y={cy + 3.5}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="900"
                                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                                    fill={isXChecker ? '#1a0f07' : '#fdf8eb'}
                                >
                                    ×{count}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <div
            data-testid="mini-board-diagram"
            className={`rounded-2xl border border-[#d4af37]/45 bg-[#120a06] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,245,205,0.12)] ${className}`}
        >
            <svg
                viewBox={`0 0 ${MINI_VB_W} ${MINI_VB_H}`}
                role="img"
                aria-label={
                    isEn
                        ? `Backgammon position diagram, turn ${turn}`
                        : `Diagramme de position Backgammon, trait à ${turn}`
                }
                data-testid="mini-board-svg"
                className="h-auto w-full select-none overflow-visible rounded-xl"
            >
                <defs>
                    {/* Dégradé pion X (Ivoire & Or) */}
                    <radialGradient id="mini-checker-x" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#fffdf9" />
                        <stop offset="65%" stopColor="#efe2c6" />
                        <stop offset="100%" stopColor="#c7b083" />
                    </radialGradient>

                    {/* Dégradé pion O (Acajou & Obsidienne) */}
                    <radialGradient id="mini-checker-o" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#4a2512" />
                        <stop offset="60%" stopColor="#261107" />
                        <stop offset="100%" stopColor="#120703" />
                    </radialGradient>

                    {/* Filtres d'éclat pour les flèches */}
                    <filter id="mini-glow-played" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.75" />
                    </filter>
                    <filter id="mini-glow-optimal" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
                    </filter>

                    {/* Pointes de flèches */}
                    <marker
                        id="mini-arrowhead-played"
                        markerWidth="9"
                        markerHeight="7"
                        refX="7.5"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 9 3.5, 0 7, 2.2 3.5" fill="#ef4444" />
                    </marker>
                    <marker
                        id="mini-arrowhead-optimal"
                        markerWidth="9"
                        markerHeight="7"
                        refX="7.5"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 9 3.5, 0 7, 2.2 3.5" fill="#10b981" />
                    </marker>
                </defs>

                {/* Cadre extérieur en acajou & filet laiton */}
                <rect
                    x="1"
                    y="1"
                    width={MINI_VB_W - 2}
                    height={MINI_VB_H - 2}
                    rx="14"
                    fill="#190e08"
                    stroke="#d4af37"
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                />

                {/* Tapis de jeu gauche et droit (cuir sombre) */}
                <rect
                    x={LEFT_QUAD_X0}
                    y={TOP_Y0}
                    width={6 * POINT_W}
                    height={BOT_Y1 - TOP_Y0}
                    rx="4"
                    fill="#23140b"
                    stroke="#d4af37"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                />
                <rect
                    x={RIGHT_QUAD_X0}
                    y={TOP_Y0}
                    width={6 * POINT_W}
                    height={BOT_Y1 - TOP_Y0}
                    rx="4"
                    fill="#23140b"
                    stroke="#d4af37"
                    strokeOpacity="0.3"
                    strokeWidth="1"
                />

                {/* Barre centrale (Laiton / Acajou) */}
                <rect
                    x={BAR_X0}
                    y={TOP_Y0}
                    width={BAR_W}
                    height={BOT_Y1 - TOP_Y0}
                    fill="#140b06"
                    stroke="#d4af37"
                    strokeOpacity="0.35"
                    strokeWidth="1"
                />
                <text
                    x={BAR_X0 + BAR_W / 2}
                    y={RIVER_Y + 3}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="800"
                    letterSpacing="1"
                    fill="#d4af37"
                    opacity="0.65"
                >
                    BAR
                </text>

                {/* Sabot de sortie (Bear-off Tray) à droite */}
                <g
                    data-testid="mini-board-off-tray"
                    onClick={onPointClick ? () => onPointClick(turn === 'X' ? 0 : 25) : undefined}
                    className={onPointClick ? 'cursor-pointer' : undefined}
                >
                    <rect
                        x={TRAY_X0}
                        y={TOP_Y0}
                        width={TRAY_W}
                        height={BOT_Y1 - TOP_Y0}
                        rx="6"
                        fill="#120904"
                        stroke="#d4af37"
                        strokeOpacity="0.4"
                        strokeWidth="1"
                    />
                    {/* Compteur sortie O (haut) */}
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={TOP_Y0 + 22}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill="#e8dcc6"
                        opacity="0.65"
                    >
                        OFF O
                    </text>
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={TOP_Y0 + 40}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="900"
                        fontFamily="ui-monospace, monospace"
                        fill="#f3c65f"
                    >
                        {offO}
                    </text>

                    {/* Indicateur de sens de jeu au milieu du sabot */}
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={RIVER_Y + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="900"
                        fill="#f3c65f"
                        data-testid="mini-board-direction"
                    >
                        {turn === 'X' ? '24↓1' : '1↑24'}
                    </text>

                    {/* Compteur sortie X (bas) */}
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={BOT_Y1 - 28}
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="700"
                        fill="#e8dcc6"
                        opacity="0.65"
                    >
                        OFF X
                    </text>
                    <text
                        x={TRAY_X0 + TRAY_W / 2}
                        y={BOT_Y1 - 12}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="900"
                        fontFamily="ui-monospace, monospace"
                        fill="#fdf8eb"
                    >
                        {offX}
                    </text>
                </g>

                {/* Rendu des 24 flèches et de leurs pions */}
                {topPoints.map((pt, idx) => renderPointColumn(pt, idx, true))}
                {botPoints.map((pt, idx) => renderPointColumn(pt, idx, false))}

                {/* Pions sur la barre centrale */}
                {barO > 0 && (
                    <g data-testid="mini-board-bar-o">
                        <circle
                            cx={BAR_X0 + BAR_W / 2}
                            cy={TOP_Y0 + 62}
                            r={CHECKER_R - 1}
                            fill="url(#mini-checker-o)"
                            stroke="#d4af37"
                            strokeWidth="1.2"
                        />
                        <text
                            x={BAR_X0 + BAR_W / 2}
                            y={TOP_Y0 + 66}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="900"
                            fill="#fdf8eb"
                        >
                            {barO > 1 ? `×${barO}` : 'O'}
                        </text>
                    </g>
                )}
                {barX > 0 && (
                    <g data-testid="mini-board-bar-x">
                        <circle
                            cx={BAR_X0 + BAR_W / 2}
                            cy={BOT_Y1 - 62}
                            r={CHECKER_R - 1}
                            fill="url(#mini-checker-x)"
                            stroke="#fff8e7"
                            strokeWidth="1.2"
                        />
                        <text
                            x={BAR_X0 + BAR_W / 2}
                            y={BOT_Y1 - 58}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="900"
                            fill="#1a0f07"
                        >
                            {barX > 1 ? `×${barX}` : 'X'}
                        </text>
                    </g>
                )}

                {/* Dés du tour au centre de la rivière */}
                {dice && dice[0] >= 1 && dice[1] >= 1 && (
                    <g data-testid="mini-board-dice">
                        {[dice[0], dice[1]].map((dieVal, dIdx) => {
                            const dieSize = 28;
                            const dieX = LEFT_QUAD_X0 + 3 * POINT_W - dieSize - 4 + dIdx * (dieSize + 8);
                            const dieY = RIVER_Y - dieSize / 2;
                            const pips = DIE_PIPS[dieVal] ?? DIE_PIPS[1];

                            return (
                                <g key={`die-${dIdx}`} data-testid={`mini-board-die-${dIdx}`}>
                                    <rect
                                        x={dieX}
                                        y={dieY}
                                        width={dieSize}
                                        height={dieSize}
                                        rx="6"
                                        fill="#fdf8eb"
                                        stroke="#d4af37"
                                        strokeWidth="1.5"
                                    />
                                    {pips.map(([px, py], pIdx) => (
                                        <circle
                                            key={pIdx}
                                            cx={dieX + dieSize / 2 + px * (dieSize * 0.52)}
                                            cy={dieY + dieSize / 2 + py * (dieSize * 0.52)}
                                            r="2.4"
                                            fill="#1a0f07"
                                        />
                                    ))}
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* SURIMPRESSION 1 : Flèches du coup joué par l'utilisateur (Rouge / Pointillé) */}
                {playedArrows.map((arrow, idx) => {
                    const start = computeMiniPointCoords(arrow.from, turn, false, orientation);
                    const end = computeMiniPointCoords(arrow.to, turn, true, orientation);
                    const path = buildMiniCurvedPath(start.x, start.y, end.x, end.y, idx);

                    return (
                        <g
                            key={`played-arrow-${idx}-${arrow.from}-${arrow.to}`}
                            data-testid="mini-board-arrow-played"
                            filter="url(#mini-glow-played)"
                        >
                            <path
                                d={path}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeDasharray="7 5"
                                markerEnd="url(#mini-arrowhead-played)"
                                opacity="0.95"
                            />
                            <circle cx={start.x} cy={start.y} r="4" fill="#ef4444" />
                        </g>
                    );
                })}

                {/* SURIMPRESSION 2 : Flèches du coup optimal du moteur (Vert / Or plein) */}
                {optimalArrows.map((arrow, idx) => {
                    const start = computeMiniPointCoords(arrow.from, turn, false, orientation);
                    const end = computeMiniPointCoords(arrow.to, turn, true, orientation);
                    const path = buildMiniCurvedPath(start.x, start.y, end.x, end.y, idx);

                    return (
                        <g
                            key={`optimal-arrow-${idx}-${arrow.from}-${arrow.to}`}
                            data-testid="mini-board-arrow-optimal"
                            filter="url(#mini-glow-optimal)"
                        >
                            {/* Halo doré sous la flèche optimale */}
                            <path
                                d={path}
                                fill="none"
                                stroke="#f3c65f"
                                strokeWidth="5.2"
                                strokeLinecap="round"
                                opacity="0.35"
                            />
                            <path
                                d={path}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3.4"
                                strokeLinecap="round"
                                markerEnd="url(#mini-arrowhead-optimal)"
                                opacity="0.98"
                            />
                            <circle cx={start.x} cy={start.y} r="4.2" fill="#10b981" stroke="#f3c65f" strokeWidth="1" />
                        </g>
                    );
                })}
            </svg>

            {/* Légende comparative sous le diagramme */}
            {showLegend && (
                <div
                    data-testid="mini-board-legend"
                    className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1.5 text-[10px] text-[#e8dcc6]/85"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-300">
                            <span
                                aria-hidden="true"
                                className="inline-block h-0.5 w-4 border-b-2 border-dashed border-rose-400"
                            />
                            <span>
                                {isEn ? 'Played' : 'Coup joué'}
                                {typeof playedMove === 'string' && playedMove ? ` (${playedMove})` : ''}
                            </span>
                        </span>
                        {!hideOptimalArrow && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                                <span
                                    aria-hidden="true"
                                    className="inline-block h-1 w-4 rounded-full bg-gradient-to-r from-[#f3c65f] to-emerald-400"
                                />
                                <span>
                                    {isEn ? 'Optimal' : 'Optimal'}
                                    {typeof optimalMove === 'string' && optimalMove ? ` (${optimalMove})` : ''}
                                </span>
                            </span>
                        )}
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#f3c65f]/85">
                        {turn === 'X'
                            ? isEn
                                ? 'Direction: 24 ➔ 1'
                                : 'Sens : 24 ➔ 1'
                            : isEn
                              ? 'Direction: 1 ➔ 24'
                              : 'Sens : 1 ➔ 24'}
                    </span>
                </div>
            )}
        </div>
    );
};

export const MiniBoardDiagram = React.memo(MiniBoardDiagramComponent);
export default MiniBoardDiagram;
