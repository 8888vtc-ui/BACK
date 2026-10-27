import {
    ensureMinimumHitbox,
    MIN_HITBOX_SIZE,
    type PointRect,
} from '../../lib/board/snappingPhysics';

export function getLegalTargetRects(
    targetSet: ReadonlySet<number>,
    minHitboxSize?: number,
): PointRect[] {
    if (typeof document === 'undefined') return [];
    const rects: PointRect[] = [];
    const minHitbox = minHitboxSize ?? MIN_HITBOX_SIZE;

    targetSet.forEach((pt) => {
        const touchZone = document.querySelector(`[data-testid="point-touch-zone-${pt}"]`);
        const pointEl = document.querySelector(`[data-point="${pt}"], [data-off-tray="${pt}"]`);
        const el = touchZone ?? pointEl;
        if (el) {
            const domRect = el.getBoundingClientRect();
            const r = domRect.width === 0 && domRect.height === 0 && pointEl && pointEl !== el
                ? pointEl.getBoundingClientRect()
                : domRect;
            rects.push(
                ensureMinimumHitbox(
                    {
                        pointNumber: pt,
                        left: r.left,
                        top: r.top,
                        right: r.right,
                        bottom: r.bottom,
                        centerX: r.left + r.width / 2,
                        centerY: r.top + r.height / 2,
                    },
                    minHitbox,
                ),
            );
        }
    });
    return rects;
}
