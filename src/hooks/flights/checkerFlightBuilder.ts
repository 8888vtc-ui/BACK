import { O_BAR, O_OFF, X_BAR, X_OFF } from '../../engine/backgammonEngine';
import {
    BEAR_OFF_DURATION_MS,
    BEAR_OFF_EASING,
    BEAR_OFF_END_SCALE_Y,
    HIT_ATTACKER_EASING,
    HIT_ATTACKER_SCALE,
    HIT_TO_BAR_DURATION_MS,
    HIT_TO_BAR_EASING,
    INTERMEDIATE_TOUCH_PAUSE_MS,
    NORMAL_APEX_DROP_SHADOW,
    NORMAL_APEX_OFFSET,
    NORMAL_APEX_SCALE,
    NORMAL_FLIGHT_EASING,
    buildFlipElementKeyframes,
    computeArcHeight,
    computeContractedFirstHopMs,
    computeFlipInvertVector,
    computeHitAttackerDurationPx,
    computeHitEjectDelayMs,
    computeNormalFlightDurationPx,
    distance,
    getFlightTotalMs,
    type FlightSpec,
    type RectLike,
    type Vec2,
} from '../../lib/gameFeel/flightPhysics';
import { CHECKER_D } from '../../components/board/boardGeometry';
import type { BoardOrientation } from '../../components/board/boardOrientation';
import type { DetectedMoveDelta } from './checkerMoveDeltaDetector';
import { ownAt, HIDDEN_O_BAR_KEY, HIDDEN_X_BAR_KEY } from './checkerMoveDeltaDetector';
import { resolveCoordinate } from './checkerCoordinateResolver';

export interface BuildFlightSpecsParams {
    deltas: DetectedMoveDelta[];
    prevBoard: ReadonlyArray<number>;
    board: ReadonlyArray<number>;
    speedFactor: number;
    containerEl: HTMLElement | null;
    orientation: BoardOrientation;
    swapColors: boolean;
    firstRects: Map<number, RectLike>;
    nextFlightId: () => string;
}

export function buildFlightSpecs({
    deltas,
    prevBoard,
    board,
    speedFactor,
    containerEl,
    orientation,
    swapColors,
    firstRects,
    nextFlightId,
}: BuildFlightSpecsParams): FlightSpec[] {
    const spawned: FlightSpec[] = [];

    for (const delta of deltas) {
        const id = nextFlightId();
        const moverColor: 'white' | 'black' = (delta.player === 'X') !== swapColors ? 'white' : 'black';
        const isHitMove = delta.hitOpponentAt !== undefined;
        const isCombinedLeap = delta.waypoints.length > 2;

        const vecWaypoints: Vec2[] = [];
        const domElements: (HTMLElement | null)[] = [];
        const stepRects: RectLike[] = [];
        let diameter = CHECKER_D;

        delta.waypoints.forEach((pt, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === delta.waypoints.length - 1;
            const kind: 'point' | 'bar' | 'off' =
                isLast && delta.isBearOff
                    ? 'off'
                    : isFirst && (pt === X_BAR || pt === O_BAR)
                      ? 'bar'
                      : 'point';
            const stackCount = isFirst
                ? Math.max(0, ownAt(prevBoard, pt, delta.player) - 1)
                : isLast && !delta.isBearOff
                  ? Math.max(0, ownAt(board, pt, delta.player) - 1)
                  : 0;
            const capturedFirst = isFirst ? (firstRects.get(pt) ?? null) : null;
            const resolved = resolveCoordinate(pt, kind, stackCount, containerEl, orientation, capturedFirst);
            vecWaypoints.push(resolved.pos);
            domElements.push(resolved.element);
            stepRects.push(resolved.rect);
            diameter = resolved.diameter;
        });

        const segmentDurationsMs: number[] = [];
        let longestSeg = 0;
        for (let i = 0; i < vecWaypoints.length - 1; i++) {
            const a = vecWaypoints[i];
            const b = vecWaypoints[i + 1];
            const invert = computeFlipInvertVector(
                stepRects[i] ?? { left: a.x, top: a.y },
                stepRects[i + 1] ?? { left: b.x, top: b.y },
            );
            const distPx = invert.distPx > 0 ? invert.distPx : distance(a, b);
            if (distPx > longestSeg) longestSeg = distPx;

            const isLastBearOff = delta.isBearOff && i === vecWaypoints.length - 2;
            let segMs: number;
            if (isLastBearOff) {
                segMs = Math.max(40, Math.round(BEAR_OFF_DURATION_MS * speedFactor));
            } else if (isHitMove && i === vecWaypoints.length - 2) {
                segMs = computeHitAttackerDurationPx(distPx, speedFactor);
            } else {
                segMs = computeNormalFlightDurationPx(distPx, speedFactor);
            }
            if (isCombinedLeap && i === 0) {
                segMs = computeContractedFirstHopMs(segMs);
            }
            segmentDurationsMs.push(segMs);
        }

        const touchdownMs = isCombinedLeap ? INTERMEDIATE_TOUCH_PAUSE_MS : 0;
        const arrivalPoint = delta.isBearOff
            ? delta.player === 'X'
                ? X_OFF
                : O_OFF
            : delta.waypoints[delta.waypoints.length - 1];

        const easing = delta.isBearOff
            ? BEAR_OFF_EASING
            : isHitMove
              ? HIT_ATTACKER_EASING
              : NORMAL_FLIGHT_EASING;
        const peakScale = isHitMove ? HIT_ATTACKER_SCALE : NORMAL_APEX_SCALE;

        const moverSpec: FlightSpec = {
            id,
            color: moverColor,
            waypoints: vecWaypoints,
            segmentDurationsMs,
            touchdownMs,
            delayMs: delta.delayMs,
            easing,
            arcHeight: computeArcHeight(longestSeg, diameter),
            peakScale,
            apexOffsetRatio: NORMAL_APEX_OFFSET,
            apexDropShadow: NORMAL_APEX_DROP_SHADOW,
            endScaleY: delta.isBearOff ? BEAR_OFF_END_SCALE_Y : undefined,
            arrivalPoint,
        };
        spawned.push(moverSpec);

        // PLAY FLIP WAAPI direct sur l'élément d'arrivée si disponible
        const lastEl = domElements[domElements.length - 1];
        const firstRect = stepRects[0];
        const lastRect = stepRects[stepRects.length - 1];
        if (lastEl && typeof lastEl.animate === 'function' && firstRect && lastRect) {
            const inv = computeFlipInvertVector(firstRect, lastRect);
            const flipFrames = buildFlipElementKeyframes({
                dx: inv.dx !== 0 ? inv.dx : vecWaypoints[0].x - vecWaypoints[vecWaypoints.length - 1].x,
                dy: inv.dy !== 0 ? inv.dy : vecWaypoints[0].y - vecWaypoints[vecWaypoints.length - 1].y,
                isHit: isHitMove,
                isBearOff: delta.isBearOff,
            });
            try {
                lastEl.animate(flipFrames, {
                    duration: getFlightTotalMs(moverSpec),
                    delay: delta.delayMs,
                    easing,
                    fill: 'both',
                });
            } catch {
                // Environnement sans moteur WAAPI complet
            }
        }

        if (delta.hitOpponentAt !== undefined) {
            const hitId = nextFlightId();
            const victimColor: 'white' | 'black' = moverColor === 'white' ? 'black' : 'white';
            const oppBar = delta.player === 'X' ? O_BAR : X_BAR;
            const fromHit = resolveCoordinate(delta.hitOpponentAt, 'point', 0, containerEl, orientation);
            const toBar = resolveCoordinate(oppBar, 'bar', 0, containerEl, orientation);
            const hitDist = distance(fromHit.pos, toBar.pos);
            const attackerTotalMs = getFlightTotalMs(moverSpec);
            const hitSpec: FlightSpec = {
                id: hitId,
                color: victimColor,
                waypoints: [fromHit.pos, toBar.pos],
                segmentDurationsMs: [Math.max(50, Math.round(HIT_TO_BAR_DURATION_MS * speedFactor))],
                touchdownMs: 0,
                delayMs: delta.delayMs + computeHitEjectDelayMs(attackerTotalMs),
                easing: HIT_TO_BAR_EASING,
                arcHeight: computeArcHeight(hitDist, fromHit.diameter),
                peakScale: NORMAL_APEX_SCALE,
                apexOffsetRatio: NORMAL_APEX_OFFSET,
                apexDropShadow: NORMAL_APEX_DROP_SHADOW,
                arrivalPoint: delta.player === 'X' ? HIDDEN_O_BAR_KEY : HIDDEN_X_BAR_KEY,
            };
            spawned.push(hitSpec);
        }
    }

    return spawned;
}
