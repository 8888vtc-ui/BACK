import type { RectLike, Vec2 } from '../../lib/gameFeel/flightPhysics';
import {
    BOT_BASE,
    CHECKER_D,
    MAX_VISIBLE,
    POINT_W,
    TOP_BASE,
    pointLayout,
} from '../../components/board/boardGeometry';
import { getOrientedRows, type BoardOrientation } from '../../components/board/boardOrientation';

export function queryPointElement(
    point: number,
    kind: 'point' | 'bar' | 'off',
    containerEl: HTMLElement | null,
): HTMLElement | null {
    const root: ParentNode | null = containerEl ?? (typeof document !== 'undefined' ? document : null);
    if (!root) return null;
    if (kind === 'off') {
        return root.querySelector(`[data-off-tray="${point}"]`) as HTMLElement | null;
    }
    if (kind === 'bar') {
        return (
            (root.querySelector(`[data-testid="bar-section-${point}"] [data-checker-top="true"]`) as HTMLElement | null) ??
            (root.querySelector(`[data-testid="bar-section-${point}"]`) as HTMLElement | null)
        );
    }
    return (
        (root.querySelector(`[data-testid="point-stack-${point}"] [data-checker-top="true"]`) as HTMLElement | null) ??
        (root.querySelector(`[data-point="${point}"]:not([data-off-tray])`) as HTMLElement | null)
    );
}

export function resolveCoordinate(
    point: number,
    kind: 'point' | 'bar' | 'off',
    stackIndex: number,
    containerEl: HTMLElement | null,
    orientation: BoardOrientation,
    capturedFirstRect?: RectLike | null,
): { pos: Vec2; diameter: number; rect: RectLike; element: HTMLElement | null } {
    const { top: topRow } = getOrientedRows(orientation);
    const clampedSlot = Math.min(MAX_VISIBLE - 1, Math.max(0, stackIndex));
    const targetEl = queryPointElement(point, kind, containerEl);

    if (containerEl && typeof document !== 'undefined') {
        const boardRect = containerEl.getBoundingClientRect();
        if (boardRect.width > 0 && boardRect.height > 0 && targetEl) {
            const rawRect = capturedFirstRect ?? targetEl.getBoundingClientRect();
            const width = rawRect.width ?? CHECKER_D;
            const height = rawRect.height ?? CHECKER_D;
            if (width > 0 && height > 0) {
                const diameter = Math.min(46, Math.max(18, width * 0.78));
                const cx = rawRect.left - boardRect.left + width / 2;
                if (kind === 'off' || kind === 'bar' || targetEl.hasAttribute('data-checker-top')) {
                    const cy = rawRect.top - boardRect.top + height / 2;
                    return { pos: { x: cx, y: cy }, diameter, rect: rawRect, element: targetEl };
                }
                const isTop = topRow.includes(point);
                const step = diameter * 0.85;
                const cy = isTop
                    ? rawRect.top - boardRect.top + (clampedSlot + 0.5) * step
                    : rawRect.top + height - boardRect.top - (clampedSlot + 0.5) * step;
                return { pos: { x: cx, y: cy }, diameter, rect: { left: cx, top: cy, width: diameter, height: diameter }, element: targetEl };
            }
        }
    }

    const layout = pointLayout(point, orientation, kind === 'off');
    const x = layout.x + POINT_W / 2;
    const y = layout.top
        ? TOP_BASE + (clampedSlot + 0.5) * CHECKER_D
        : BOT_BASE - (clampedSlot + 0.5) * CHECKER_D;
    const fallbackRect: RectLike = capturedFirstRect ?? { left: x, top: y, width: CHECKER_D, height: CHECKER_D };
    return { pos: { x, y }, diameter: CHECKER_D, rect: fallbackRect, element: targetEl };
}
