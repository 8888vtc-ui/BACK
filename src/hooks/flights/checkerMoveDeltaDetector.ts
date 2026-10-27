import { borneOffCount, O_BAR, O_OFF, X_BAR, X_OFF, type Player } from '../../engine/backgammonEngine';
import { CONVERGENCE_STAGGER_MS } from '../../lib/gameFeel/flightPhysics';

/** Clés virtuelles dans `hiddenAt` pour les pions expulsés vers la barre centrale. */
export const HIDDEN_X_BAR_KEY = -1;
export const HIDDEN_O_BAR_KEY = -25;

export interface DetectedMoveDelta {
    readonly player: Player;
    /** Liste ordonnée des points parcourus (`[from, to]` ou `[from, mid, to]`). */
    readonly waypoints: readonly number[];
    /** Vrai si la destination finale est le sabot de sortie (`X_OFF` ou `O_OFF`). */
    readonly isBearOff: boolean;
    /** Décalage temporel initial (ms) pour échelonner une convergence à 2 pions (Make a Point). */
    readonly delayMs: number;
    /** Point (1..24) où un blot adverse a été frappé par ce déplacement. */
    readonly hitOpponentAt?: number;
}

export function ownAt(board: ReadonlyArray<number>, point: number, player: Player): number {
    const val = board[point] ?? 0;
    if (player === 'X') return point === X_BAR || (point >= 1 && point <= 24) ? Math.max(0, val) : 0;
    return point === O_BAR || (point >= 1 && point <= 24) ? Math.max(0, -val) : 0;
}

export function collectPlayerDiff(prev: ReadonlyArray<number>, next: ReadonlyArray<number>, player: Player) {
    const sources: number[] = [];
    const dests: { point: number; isBearOff: boolean }[] = [];
    const pointsToScan =
        player === 'X'
            ? [X_BAR, ...Array.from({ length: 24 }, (_, i) => i + 1)]
            : [...Array.from({ length: 24 }, (_, i) => i + 1), O_BAR];

    for (const pt of pointsToScan) {
        const before = ownAt(prev, pt, player);
        const after = ownAt(next, pt, player);
        if (before > after) {
            for (let i = 0; i < before - after; i++) sources.push(pt);
        } else if (after > before) {
            for (let i = 0; i < after - before; i++) dests.push({ point: pt, isBearOff: false });
        }
    }

    const offBefore = borneOffCount(prev as number[], player);
    const offAfter = borneOffCount(next as number[], player);
    if (offAfter > offBefore) {
        const offPt = player === 'X' ? X_OFF : O_OFF;
        for (let i = 0; i < offAfter - offBefore; i++) dests.push({ point: offPt, isBearOff: true });
    }
    return { sources, dests };
}

export function inferCombinedWaypoints(
    from: number,
    to: number,
    player: Player,
    prevBoard: ReadonlyArray<number>,
    dice: readonly [number, number] | null | undefined,
    hitPoints: readonly number[],
): number[] {
    const intermediateHit = hitPoints.find((hp) => hp !== to && hp >= 1 && hp <= 24);
    if (intermediateHit !== undefined) return [from, intermediateHit, to];
    if (!dice) return [from, to];

    const startPip = from === X_BAR && player === 'X' ? 25 : from === O_BAR && player === 'O' ? 0 : from;
    const dist = player === 'X' ? startPip - to : to - startPip;
    if (dist <= 0) return [from, to];

    const [d1, d2] = dice;
    const dir = player === 'X' ? -1 : 1;
    const isLandingLegal = (pt: number): boolean => {
        if (pt < 1 || pt > 24) return false;
        const v = prevBoard[pt] ?? 0;
        return player === 'X' ? v >= -1 : v <= 1;
    };

    if (d1 !== d2 && dist === d1 + d2) {
        const midHigh = startPip + dir * Math.max(d1, d2);
        const midLow = startPip + dir * Math.min(d1, d2);
        if (isLandingLegal(midHigh)) return [from, midHigh, to];
        if (isLandingLegal(midLow)) return [from, midLow, to];
    } else if (d1 === d2 && dist > d1 && dist % d1 === 0) {
        const steps = dist / d1;
        if (steps >= 2 && steps <= 4) {
            const chain = [from];
            for (let s = 1; s < steps; s++) {
                const mid = startPip + dir * d1 * s;
                if (mid >= 1 && mid <= 24) chain.push(mid);
            }
            chain.push(to);
            return chain;
        }
    }
    return [from, to];
}

/**
 * Détecte de façon pure les déplacements de pions entre deux états consécutifs du plateau.
 * Ignore les réinitialisations complètes de partie (> 4 pions déplacés simultanément).
 */
export function detectBoardMoveDeltas(
    prevBoard: ReadonlyArray<number>,
    nextBoard: ReadonlyArray<number>,
    dice?: readonly [number, number] | null,
): DetectedMoveDelta[] {
    if (prevBoard.length < 26 || nextBoard.length < 26) return [];
    let anyDiff = false;
    for (let i = 0; i < 26; i++) {
        if (prevBoard[i] !== nextBoard[i]) {
            anyDiff = true;
            break;
        }
    }
    if (!anyDiff) return [];

    const diffX = collectPlayerDiff(prevBoard, nextBoard, 'X');
    const diffO = collectPlayerDiff(prevBoard, nextBoard, 'O');

    const xMoved =
        diffX.sources.length > 0 &&
        diffX.sources.length <= 4 &&
        diffX.sources.length === diffX.dests.length &&
        diffO.dests.every((d) => !d.isBearOff && d.point === O_BAR);

    const oMoved =
        diffO.sources.length > 0 &&
        diffO.sources.length <= 4 &&
        diffO.sources.length === diffO.dests.length &&
        diffX.dests.every((d) => !d.isBearOff && d.point === X_BAR);

    if (!xMoved && !oMoved) return [];

    const mover: Player = xMoved ? 'X' : 'O';
    const { sources, dests } = xMoved ? diffX : diffO;
    const oppDiff = xMoved ? diffO : diffX;
    const hitPoints = oppDiff.sources.filter((pt) => pt >= 1 && pt <= 24);

    const sortedSources = [...sources].sort((a, b) =>
        mover === 'X' ? (b === X_BAR ? 25 : b) - (a === X_BAR ? 25 : a) : a - b,
    );
    const sortedDests = [...dests].sort((a, b) => {
        const pa = a.isBearOff ? (mover === 'X' ? 0 : 25) : a.point;
        const pb = b.isBearOff ? (mover === 'X' ? 0 : 25) : b.point;
        return mover === 'X' ? pb - pa : pa - pb;
    });

    const usedHits = new Set<number>();
    return sortedSources.map((from, idx) => {
        const target = sortedDests[idx];
        const waypoints = target.isBearOff
            ? [from, target.point]
            : sortedSources.length === 1
              ? inferCombinedWaypoints(from, target.point, mover, prevBoard, dice, hitPoints)
              : [from, target.point];

        let hitOpponentAt: number | undefined;
        for (const wp of waypoints.slice(1)) {
            if (!target.isBearOff && hitPoints.includes(wp) && !usedHits.has(wp)) {
                hitOpponentAt = wp;
                usedHits.add(wp);
                break;
            }
        }

        return {
            player: mover,
            waypoints,
            isBearOff: target.isBearOff,
            delayMs: idx * CONVERGENCE_STAGGER_MS,
            hitOpponentAt,
        };
    });
}
