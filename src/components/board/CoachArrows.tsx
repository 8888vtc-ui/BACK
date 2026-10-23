'use client';

/**
 * Flèches SVG de trajectoire pour le feedback du Coach.
 *
 * Superpose des flèches SVG entre `from` et `to` pour :
 *   - le coup joué (rouge),
 *   - le coup optimal (vert),
 *   - le coup de l'adversaire IA (cyan).
 *
 * Synchronise automatiquement les abscisses sur les centres DOM réels des flèches
 * (`ResizeObserver`) tout en conservant `pointLayout` en repli synchrone/SSR.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Move } from '../../engine/backgammonEngine';
import { pointLayout, VB_W, VB_H, TOP_APEX, BOT_APEX, POINT_W } from './boardGeometry';
import type { BoardOrientation } from './boardOrientation';

export interface CoachArrowsProps {
    /** Coups joués (rouge). */
    played?: Move[];
    /** Coups optimaux (vert). */
    optimal?: Move[];
    /** Coups de l'adversaire IA (indigo/cyan). */
    opponent?: { from: number; to: number }[];
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
}

/**
 * Calcule un tracé de Bézier courbé en arche vers le centre du plateau pour éviter les piles de pions.
 */
export function computeCurvedArrowPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;

    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    const curveAmount = Math.min(48, Math.max(18, dist * 0.14));
    const toCenterSign = my < VB_H / 2 ? 1 : -1;

    const cx = Math.abs(dy) > Math.abs(dx) * 1.5 ? mx + 20 : mx;
    const cy = my + curveAmount * toCenterSign;

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

    const path = computeCurvedArrowPath(fromX, fromY, toX, toY);

    return { x1: fromX, y1: fromY, x2: toX, y2: toY, path };
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
            const barEl = boardRoot.querySelector('[data-testid="central-bar"]');
            if (barEl) {
                const r = barEl.getBoundingClientRect();
                next.bar = ((r.left + r.width / 2 - svgRect.left) / svgRect.width) * VB_W;
            }
            const offEl = boardRoot.querySelector('[data-testid^="off-tray-"]');
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
        () => opponent.map((m) => computeArrowCoords(m.from, m.to, orientation, domCenters)),
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
                <marker id="arrowhead-opponent" markerWidth="11" markerHeight="8" refX="9.5" refY="4" orient="auto">
                    <polygon points="0 0, 11 4, 0 8, 3 4" fill="#38bdf8" />
                </marker>
            </defs>

            {opponentArrows.map((a, i) => (
                <g key={`opp-${i}`} className="transition-opacity duration-300">
                    <path
                        d={a.path}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.75"
                        strokeLinecap="round"
                        markerEnd="url(#arrowhead-opponent)"
                        opacity="0.9"
                    />
                    <circle cx={a.x1} cy={a.y1} r="3.5" fill="#38bdf8" opacity="0.9" />
                </g>
            ))}

            {playedArrows.map((a, i) => (
                <g key={`played-${i}`} filter="url(#glow-red)">
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
                <g key={`optimal-${i}`} filter="url(#glow-green)">
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
