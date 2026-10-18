'use client';

/**
 * Flèches SVG de trajectoire pour le feedback du Coach.
 *
 * Superpose des flèches SVG entre `from` et `to` pour :
 *   - le coup joué (rouge),
 *   - le coup optimal (vert).
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx`.
 * Mémoïsé (`React.memo`).
 */

import React, { useMemo } from 'react';
import type { Move } from '../../engine/backgammonEngine';
import { pointLayout, VB_W, VB_H, PLAY_Y0, PLAY_Y1, POINT_W } from './boardGeometry';

export interface CoachArrowsProps {
    /** Coups joués (rouge). */
    played: Move[];
    /** Coups optimaux (vert). */
    optimal: Move[];
}

/** Coordonnées d'une flèche (départ → arrivée) dans le viewBox SVG. */
interface ArrowCoords {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

/**
 * Calcule les coordonnées d'une flèche entre deux points.
 *
 * @param from - Point de départ (1..24, ou barre 0/25).
 * @param to - Point d'arrivée (1..24, ou bear-off 0/25).
 * @returns Coordonnées SVG de la flèche.
 */
export function computeArrowCoords(from: number, to: number): ArrowCoords {
    const fromLayout = pointLayout(from);
    const toLayout = pointLayout(to);

    // Centre horizontal du point (base du triangle).
    const fromX = fromLayout.x + POINT_W / 2;
    const toX = toLayout.x + POINT_W / 2;

    // Position verticale : haut (top) ou bas (bottom).
    const fromY = fromLayout.top ? PLAY_Y0 + 20 : PLAY_Y1 - 20;
    const toY = toLayout.top ? PLAY_Y0 + 20 : PLAY_Y1 - 20;

    return { x1: fromX, y1: fromY, x2: toX, y2: toY };
}

const CoachArrowsComponent: React.FC<CoachArrowsProps> = ({ played, optimal }) => {
    const playedArrows = useMemo(
        () => played.map((m) => computeArrowCoords(m.from, m.to)),
        [played],
    );
    const optimalArrows = useMemo(
        () => optimal.map((m) => computeArrowCoords(m.from, m.to)),
        [optimal],
    );

    return (
        <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            data-testid="coach-arrows"
        >
            <defs>
                <marker
                    id="arrowhead-red"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker
                    id="arrowhead-green"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                </marker>
            </defs>

            {/* Coups joués (rouge) */}
            {playedArrows.map((a, i) => (
                <line
                    key={`played-${i}`}
                    x1={a.x1}
                    y1={a.y1}
                    x2={a.x2}
                    y2={a.y2}
                    stroke="#ef4444"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    markerEnd="url(#arrowhead-red)"
                    opacity="0.85"
                />
            ))}

            {/* Coups optimaux (vert) */}
            {optimalArrows.map((a, i) => (
                <line
                    key={`optimal-${i}`}
                    x1={a.x1}
                    y1={a.y1}
                    x2={a.x2}
                    y2={a.y2}
                    stroke="#22c55e"
                    strokeWidth="4"
                    markerEnd="url(#arrowhead-green)"
                    opacity="0.85"
                />
            ))}
        </svg>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachArrows = React.memo(CoachArrowsComponent);

export default CoachArrows;
