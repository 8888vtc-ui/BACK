'use client';

/**
 * Calque SVG (`pointer-events-none`) des flèches de trajectoire :
 *   - Persistance du dernier coup adverse (Chantier 3 : courbe de Bézier quadratique
 *     avec flèche de courbure de 28 px, gris ardoise `rgba(148, 163, 184, 0.52)`,
 *     épaisseur `2.25px`, point d'origine `r=3.5px`, et croix cinétique rouge `✕`
 *     sur toute frappe d'un blot joueur).
 *   - Feedback Coach : coup joué (rouge) vs coup optimal (vert).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Move } from '../../engine/backgammonEngine';
import { pointLayout, VB_W, VB_H, TOP_APEX, BOT_APEX, POINT_W } from './boardGeometry';
import type { BoardOrientation } from './boardOrientation';

/** Flèche de courbure (sagitta) de la courbe de Bézier quadratique du dernier coup adverse (28 px). */
export const OPPONENT_ARROW_CURVATURE_PX = 28;
/** Couleur gris ardoise translucide du dernier coup adverse. */
export const OPPONENT_ARROW_STROKE = 'rgba(148, 163, 184, 0.52)';
/** Épaisseur du trait du dernier coup adverse (2.25 px). */
export const OPPONENT_ARROW_STROKE_WIDTH = 2.25;
/** Rayon du point d'origine du dernier coup adverse (3.5 px). */
export const OPPONENT_ORIGIN_RADIUS = 3.5;

export interface OpponentSubMoveArrow {
    readonly from: number;
    readonly to: number;
    readonly isHit?: boolean;
}

export interface CoachArrowsProps {
    /** Coups joués (rouge). */
    played?: Move[];
    /** Coups optimaux (vert). */
    optimal?: Move[];
    /** Sous-coups (2 à 4) du dernier tour adverse persistés jusqu'au lancer ou videau. */
    opponent?: OpponentSubMoveArrow[];
    /** Orientation du plateau (normal ou inverted). */
    orientation?: BoardOrientation;
}

/** Coordonnées et tracé d'une flèche (départ → arrivée) dans le viewBox SVG. */
export interface ArrowCoords {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    path: string;
    isHit?: boolean;
}

/**
 * Calcule un tracé de Bézier quadratique avec flèche de courbure de 28 px vers le centre du plateau.
 */
export function computeCurvedArrowPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    curvaturePx: number = OPPONENT_ARROW_CURVATURE_PX,
): string {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const toCenterSign = my < VB_H / 2 ? 1 : -1;

    const cx = Math.abs(dy) > Math.abs(dx) * 1.5 ? mx + curvaturePx : mx;
    const cy = my + curvaturePx * toCenterSign;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/**
 * Calcule les coordonnées d'une flèche entre deux points selon l'orientation.
 */
export function computeArrowCoords(
    from: number,
    to: number,
    orientation: BoardOrientation = 'normal',
    domCenters?: Readonly<Record<string, number>> | null,
    isHit?: boolean,
): ArrowCoords {
    const isToOff = to === 0 || to === 25;
    const fromLayout = pointLayout(from, orientation, false);
    const toLayout = pointLayout(to, orientation, isToOff);

    const fromKey = from === 0 || from === 25 ? 'bar' : `pt-${from}`;
    const toKey = isToOff ? 'off' : `pt-${to}`;

    const fromX = domCenters?.[fromKey] ?? (fromLayout.x + POINT_W / 2);
    const toX = domCenters?.[toKey] ?? (toLayout.x + POINT_W / 2);

    const fromY = fromLayout.top ? TOP_APEX - 40 : BOT_APEX + 40;
    const toY = toLayout.top ? TOP_APEX - 40 : BOT_APEX + 40;

    const path = computeCurvedArrowPath(fromX, fromY, toX, toY, OPPONENT_ARROW_CURVATURE_PX);

    return { x1: fromX, y1: fromY, x2: toX, y2: toY, path, isHit };
}

const CoachArrowsComponent: React.FC<CoachArrowsProps> = ({
    played = [],
    optimal = [],
    opponent = [],
    orientation = 'normal',
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [domCenters, setDomCenters] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl || typeof window === 'undefined') return;
        const boardRoot = svgEl.parentElement;
        if (!boardRoot) return;

        const measure = () => {
            const svgRect = svgEl.getBoundingClientRect();
            if (svgRect.width <= 0) return;
            const next: Record<string, number> = {};
            for (let pt = 1; pt <= 24; pt++) {
                const el = boardRoot.querySelector(`[data-testid="point-triangle-${pt}"]`);
                if (el) {
                    const r = el.getBoundingClientRect();
                    next[`pt-${pt}`] = ((r.left + r.width / 2 - svgRect.left) / svgRect.width) * VB_W;
                }
            }
            const barEl = boardRoot.querySelector(
                '[data-testid="central-bar-container"], [data-testid="central-bar"]',
            );
            if (barEl) {
                const r = barEl.getBoundingClientRect();
                next.bar = ((r.left + r.width / 2 - svgRect.left) / svgRect.width) * VB_W;
            }
            const offEl = boardRoot.querySelector(
                '[data-off-tray], [data-testid^="tray-zone-"], [data-testid^="off-tray-"]',
            );
            if (offEl) {
                const r = offEl.getBoundingClientRect();
                next.off = ((r.left + r.width / 2 - svgRect.left) / svgRect.width) * VB_W;
            }
            setDomCenters(next);
        };

        measure();
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
        ro?.observe(svgEl);
        return () => ro?.disconnect();
    }, [orientation, played.length, optimal.length, opponent.length]);

    const playedArrows = useMemo(
        () => played.map((m) => computeArrowCoords(m.from, m.to, orientation, domCenters)),
        [played, orientation, domCenters],
    );
    const optimalArrows = useMemo(
        () => optimal.map((m) => computeArrowCoords(m.from, m.to, orientation, domCenters)),
        [optimal, orientation, domCenters],
    );
    const opponentArrows = useMemo(
        () => opponent.map((m) => computeArrowCoords(m.from, m.to, orientation, domCenters, m.isHit)),
        [opponent, orientation, domCenters],
    );

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            data-testid="coach-arrows"
        >
            <defs>
                <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.6" />
                </filter>
                <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.6" />
                </filter>
                <marker id="arrowhead-red" markerWidth="11" markerHeight="8" refX="9.5" refY="4" orient="auto">
                    <polygon points="0 0, 11 4, 0 8, 3 4" fill="#ef4444" />
                </marker>
                <marker id="arrowhead-green" markerWidth="11" markerHeight="8" refX="9.5" refY="4" orient="auto">
                    <polygon points="0 0, 11 4, 0 8, 3 4" fill="#22c55e" />
                </marker>
                <marker id="arrowhead-opponent" markerWidth="10" markerHeight="8" refX="8.5" refY="4" orient="auto">
                    <polygon points="0 0, 10 4, 0 8, 2.5 4" fill={OPPONENT_ARROW_STROKE} />
                </marker>
            </defs>

            {opponentArrows.map((a, i) => (
                <g key={`opp-${i}`} data-testid={`opponent-arrow-${i}`} className="transition-opacity duration-300">
                    <path
                        data-testid={`opponent-arrow-path-${i}`}
                        d={a.path}
                        fill="none"
                        stroke={OPPONENT_ARROW_STROKE}
                        strokeWidth={OPPONENT_ARROW_STROKE_WIDTH}
                        strokeLinecap="round"
                        markerEnd="url(#arrowhead-opponent)"
                    />
                    <circle
                        data-testid={`opponent-arrow-origin-${i}`}
                        cx={a.x1}
                        cy={a.y1}
                        r={OPPONENT_ORIGIN_RADIUS}
                        fill={OPPONENT_ARROW_STROKE}
                    />
                    {a.isHit && (
                        <g data-testid={`opponent-hit-cross-${i}`}>
                            <text
                                x={a.x2}
                                y={a.y2}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#EF4444"
                                fontSize="16"
                                fontWeight="900"
                            >
                                ✕
                            </text>
                        </g>
                    )}
                </g>
            ))}

            {playedArrows.map((a, i) => (
                <g key={`played-${i}`} data-testid={`coach-played-arrow-${i}`} filter="url(#glow-red)">
                    <circle
                        data-testid={`coach-ghost-checker-played-${i}`}
                        cx={a.x2}
                        cy={a.y2}
                        r="14"
                        fill="rgba(239, 68, 68, 0.18)"
                        stroke="#ef4444"
                        strokeWidth="1.75"
                        strokeDasharray="4 3"
                    />
                    <path
                        d={a.path}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="8 5"
                        markerEnd="url(#arrowhead-red)"
                        opacity="0.95"
                    />
                    <circle cx={a.x1} cy={a.y1} r="4" fill="#ef4444" opacity="0.95" />
                </g>
            ))}

            {optimalArrows.map((a, i) => (
                <g key={`optimal-${i}`} data-testid={`coach-optimal-arrow-${i}`} filter="url(#glow-green)">
                    <circle
                        data-testid={`coach-ghost-checker-optimal-${i}`}
                        cx={a.x2}
                        cy={a.y2}
                        r="15"
                        fill="rgba(34, 197, 94, 0.24)"
                        stroke="#22c55e"
                        strokeWidth="2"
                    />
                    <path
                        d={a.path}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3.25"
                        strokeLinecap="round"
                        markerEnd="url(#arrowhead-green)"
                        opacity="0.98"
                    />
                    <circle cx={a.x1} cy={a.y1} r="4.5" fill="#22c55e" opacity="0.98" />
                </g>
            ))}
        </svg>
    );
};

export const CoachArrows = React.memo(CoachArrowsComponent);
export default CoachArrows;
