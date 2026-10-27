/**
 * Calculs géométriques purs de la courbe d'équité SVG (< 150 lignes, 0 any).
 */

import type { EvaluatedTurn } from '../../features/rating/types';

export type EquityChartMode = 'emg' | 'mwc' | 'luck';

export const SVG_W = 760;
export const SVG_H = 220;
export const PAD_LEFT = 55;
export const PAD_RIGHT = 30;
export const PAD_TOP = 25;
export const PAD_BOTTOM = 35;
export const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
export const PLOT_H = SVG_H - PAD_TOP - PAD_BOTTOM;

export interface EquityPointCoord {
    index: number;
    moveNumber: number;
    dice: [number, number];
    playedNotation: string;
    optimalNotation: string;
    equityLoss: number;
    cumulativeLoss: number;
    mwcAfter: number;
    cumulativeLuck: number;
    verdict: string;
    x: number;
    y: number;
}

export interface EquityCurveGeometry {
    coords: EquityPointCoord[];
    linePathD: string;
    areaPathD: string;
    gridLevels: Array<{ level: number; y: number; label: string }>;
}

export function getPointColor(verdict: string): string {
    switch (verdict) {
        case 'optimal':
            return '#10b981';
        case 'acceptable':
            return '#14b8a6';
        case 'doubtful':
            return '#f59e0b';
        case 'blunder':
            return '#f43f5e';
        case 'howler':
            return '#ef4444';
        default:
            return '#94a3b8';
    }
}

export function buildEquityCurveGeometry(
    moves: EvaluatedTurn[],
    chartMode: EquityChartMode,
): EquityCurveGeometry {
    let runningLoss = 0;
    let runningLuck = 0;
    const pointsData = moves.map((m, index) => {
        runningLoss += m.equityLoss;
        runningLuck += m.luck ?? 0;
        const mwc = m.mwcAfter ?? Math.max(5, Math.min(95, 50 + runningLoss * 35));
        return {
            index,
            moveNumber: m.moveNumber || index + 1,
            dice: m.dice,
            playedNotation: m.playedNotation,
            optimalNotation: m.optimalNotation,
            equityLoss: m.equityLoss,
            cumulativeLoss: Number(runningLoss.toFixed(4)),
            mwcAfter: Number(mwc.toFixed(1)),
            cumulativeLuck: Number(runningLuck.toFixed(4)),
            verdict: m.verdict,
        };
    });

    const minCumLoss = Math.min(...pointsData.map((p) => p.cumulativeLoss), -0.05);
    const lossRange = Math.abs(minCumLoss) || 0.1;
    const maxAbsLuck = Math.max(0.2, ...pointsData.map((p) => Math.abs(p.cumulativeLuck)));

    const coords: EquityPointCoord[] = pointsData.map((p, i) => {
        const x =
            pointsData.length === 1
                ? PAD_LEFT + PLOT_W / 2
                : PAD_LEFT + (i / (pointsData.length - 1)) * PLOT_W;

        let y: number;
        if (chartMode === 'mwc') {
            y = PAD_TOP + ((100 - p.mwcAfter) / 100) * PLOT_H;
        } else if (chartMode === 'luck') {
            const norm = (maxAbsLuck - p.cumulativeLuck) / (2 * maxAbsLuck);
            y = PAD_TOP + Math.max(0, Math.min(1, norm)) * PLOT_H;
        } else {
            y = PAD_TOP + (Math.abs(p.cumulativeLoss) / lossRange) * PLOT_H;
        }
        return { ...p, x, y };
    });

    const linePathD = coords.reduce(
        (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
        '',
    );

    const areaPathD =
        coords.length > 0
            ? `${linePathD} L ${coords[coords.length - 1].x} ${PAD_TOP + PLOT_H} L ${coords[0].x} ${PAD_TOP + PLOT_H} Z`
            : '';

    const rawLevels =
        chartMode === 'mwc'
            ? [100, 75, 50, 25, 0]
            : chartMode === 'luck'
              ? [maxAbsLuck, maxAbsLuck / 2, 0, -maxAbsLuck / 2, -maxAbsLuck]
              : [0, -lossRange * 0.33, -lossRange * 0.66, -lossRange];

    const gridLevels = rawLevels.map((lvl) => {
        const y =
            chartMode === 'mwc'
                ? PAD_TOP + ((100 - lvl) / 100) * PLOT_H
                : chartMode === 'luck'
                  ? PAD_TOP + ((maxAbsLuck - lvl) / (2 * maxAbsLuck)) * PLOT_H
                  : PAD_TOP + (Math.abs(lvl) / lossRange) * PLOT_H;
        const label =
            chartMode === 'mwc'
                ? `${lvl.toFixed(0)}%`
                : lvl === 0
                  ? '0.00'
                  : lvl.toFixed(2);
        return { level: lvl, y, label };
    });

    return { coords, linePathD, areaPathD, gridLevels };
}
