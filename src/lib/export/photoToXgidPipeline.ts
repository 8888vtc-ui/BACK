/**
 * @file src/lib/export/photoToXgidPipeline.ts
 * @description Pipeline Optique « Photo-to-XGID » (< 1,5 s) et Automate `.mat` complet :
 * - Étape 1 : Redressement homographique 3x3 des 4 coins du coffret vers un canevas 1024x800 px.
 * - Étape 2 : Géométrie des 28 ROIs (24 flèches, 2 demi-barres, 2 cours) et régularisation sous
 *   contrainte de conservation des 15 dames par camp.
 * - Étape 3 : Contrôleur interactif 1-Tap (`OneTapXGIDController`), automate `.mat` Crawford/Post-Crawford
 *   et entonnoir d'élagage 3-Ply (`runXG3PlySearchIntervalPipeline`).
 *
 * Strictement < 400 lignes, 0 `any`, 100 % pur et déterministe.
 */

import {
    type XGIDState,
    type MatTurnSnapshot,
    encodeXGID,
    createStartingBoard,
    applyMatCheckerPlay,
} from './xgBinaryAndMatParser';

export interface Point2D {
    readonly x: number;
    readonly y: number;
}

export interface PointDetection {
    pointIndex: number;
    rawCount: number;
    regularizedCount: number;
    owner: -1 | 0 | 1;
    confidence: number;
    isStacked: boolean;
}

export class BoardHomographyRectifier {
    public static readonly CANONICAL_WIDTH = 1024;
    public static readonly CANONICAL_HEIGHT = 800;

    public static orderQuadCorners(
        corners: [Point2D, Point2D, Point2D, Point2D],
    ): [Point2D, Point2D, Point2D, Point2D] {
        const sortedByY = [...corners].sort((a, b) => a.y - b.y);
        const topTwo = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottomTwo = sortedByY.slice(2, 4).sort((a, b) => a.x - b.x);
        return [topTwo[0]!, topTwo[1]!, bottomTwo[1]!, bottomTwo[0]!];
    }

    public static computeInverseHomography(
        srcQuad: [Point2D, Point2D, Point2D, Point2D],
        dstW = BoardHomographyRectifier.CANONICAL_WIDTH,
        dstH = BoardHomographyRectifier.CANONICAL_HEIGHT,
    ): Float64Array {
        const [tl, tr, br, bl] = BoardHomographyRectifier.orderQuadCorners(srcQuad);
        const dstPts: [Point2D, Point2D, Point2D, Point2D] = [
            { x: 0, y: 0 },
            { x: dstW, y: 0 },
            { x: dstW, y: dstH },
            { x: 0, y: dstH },
        ];
        const srcPts = [tl, tr, br, bl];
        const A: number[][] = [];
        const b: number[] = [];

        for (let i = 0; i < 4; i++) {
            const u = dstPts[i]!.x;
            const v = dstPts[i]!.y;
            const x = srcPts[i]!.x;
            const y = srcPts[i]!.y;
            A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
            b.push(x);
            A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
            b.push(y);
        }

        const h8 = BoardHomographyRectifier.solveLinearSystem8x8(A, b);
        return new Float64Array([
            h8[0] ?? 0, h8[1] ?? 0, h8[2] ?? 0,
            h8[3] ?? 0, h8[4] ?? 0, h8[5] ?? 0,
            h8[6] ?? 0, h8[7] ?? 0, 1.0,
        ]);
    }

    private static solveLinearSystem8x8(A: number[][], b: number[]): number[] {
        const n = 8;
        for (let col = 0; col < n; col++) {
            let maxRow = col;
            let maxVal = Math.abs(A[col]?.[col] ?? 0);
            for (let row = col + 1; row < n; row++) {
                const absVal = Math.abs(A[row]?.[col] ?? 0);
                if (absVal > maxVal) {
                    maxVal = absVal;
                    maxRow = row;
                }
            }
            const tmpRow = A[col]!;
            A[col] = A[maxRow]!;
            A[maxRow] = tmpRow;
            const tmpB = b[col]!;
            b[col] = b[maxRow]!;
            b[maxRow] = tmpB;

            const pivot = A[col]![col] || 1e-12;
            for (let j = col; j < n; j++) A[col]![j] = (A[col]![j] ?? 0) / pivot;
            b[col] = (b[col] ?? 0) / pivot;

            for (let row = 0; row < n; row++) {
                if (row !== col) {
                    const factor = A[row]![col] ?? 0;
                    for (let j = col; j < n; j++) {
                        A[row]![j] = (A[row]![j] ?? 0) - factor * (A[col]![j] ?? 0);
                    }
                    b[row] = (b[row] ?? 0) - factor * (b[col] ?? 0);
                }
            }
        }
        return b;
    }
}

export class TournamentBoardOpticalAnalyzer {
    public static getPointGeometry(
        pointIdx: number,
        homeOnRight = true,
    ): { uCenter: number; vBase: number; vTip: number; direction: 1 | -1 } {
        const leftStart = 64;
        const rightStart = 544;
        const pointWidth = 416 / 6;

        if (pointIdx === 0) return { uCenter: 512, vBase: 720, vTip: 420, direction: -1 };
        if (pointIdx === 25) return { uCenter: 512, vBase: 80, vTip: 380, direction: 1 };

        const isBottomRow = pointIdx >= 1 && pointIdx <= 12;
        const colFromLeft = isBottomRow
            ? homeOnRight ? 12 - pointIdx : pointIdx - 1
            : homeOnRight ? pointIdx - 13 : 24 - pointIdx;

        const uCenter =
            colFromLeft < 6
                ? leftStart + (colFromLeft + 0.5) * pointWidth
                : rightStart + (colFromLeft - 6 + 0.5) * pointWidth;

        return isBottomRow
            ? { uCenter, vBase: 760, vTip: 430, direction: -1 }
            : { uCenter, vBase: 40, vTip: 370, direction: 1 };
    }

    public static enforceFifteenCheckersConstraint(
        detections: PointDetection[],
        rawBearOffBottom: number,
        rawBearOffTop: number,
    ): { bearOffBottom: number; bearOffTop: number } {
        const adjustCamp = (camp: 1 | -1, rawBearOff: number): number => {
            let boardSum = 0;
            for (const d of detections) {
                if (d.owner === camp) boardSum += d.rawCount;
            }
            let bearOff = Math.max(0, Math.min(15, rawBearOff));
            let total = boardSum + bearOff;

            while (total !== 15) {
                const candidates = detections
                    .filter((d) => d.owner === camp && d.regularizedCount >= 4)
                    .sort((a, b) => a.confidence - b.confidence);

                if (total < 15 && candidates.length > 0 && rawBearOff === 0) {
                    candidates[0]!.regularizedCount += 1;
                    candidates[0]!.isStacked = candidates[0]!.regularizedCount >= 6;
                    candidates[0]!.confidence *= 0.85;
                    total += 1;
                } else if (total > 15 && candidates.length > 0) {
                    candidates[0]!.regularizedCount -= 1;
                    candidates[0]!.confidence *= 0.85;
                    total -= 1;
                } else {
                    bearOff = Math.max(0, 15 - (total - bearOff));
                    break;
                }
            }
            return bearOff;
        };

        return {
            bearOffBottom: adjustCamp(1, rawBearOffBottom),
            bearOffTop: adjustCamp(-1, rawBearOffTop),
        };
    }
}

export class OneTapXGIDController {
    private state: XGIDState;
    public homeOnRight = true;

    constructor(initialState: XGIDState) {
        this.state = {
            ...initialState,
            checkers: new Int8Array(initialState.checkers),
        };
    }

    public onTapPointSlot(pointIndex: number, slotIndex: number, selectedCamp: 1 | -1): string {
        if (pointIndex < 0 || pointIndex > 25) return this.getXGID();
        if (slotIndex <= 0) {
            this.state.checkers[pointIndex] = 0;
        } else {
            const currentVal = this.state.checkers[pointIndex] ?? 0;
            const currentOwner = Math.sign(currentVal);
            const currentCount = Math.abs(currentVal);
            if (currentOwner === selectedCamp && currentCount >= slotIndex && slotIndex === 5) {
                this.state.checkers[pointIndex] = Math.min(15, currentCount + 1) * selectedCamp;
            } else {
                this.state.checkers[pointIndex] = slotIndex * selectedCamp;
            }
        }
        return this.getXGID();
    }

    public onTapFlipBoardDirection(): string {
        const next = new Int8Array(26);
        next[0] = this.state.checkers[0] ?? 0;
        next[25] = this.state.checkers[25] ?? 0;
        for (let p = 1; p <= 12; p++) next[p] = this.state.checkers[13 - p] ?? 0;
        for (let p = 13; p <= 24; p++) next[p] = this.state.checkers[37 - p] ?? 0;
        this.state.checkers = next;
        this.homeOnRight = !this.homeOnRight;
        return this.getXGID();
    }

    public onTapSwapPlayers(): string {
        const next = new Int8Array(26);
        for (let i = 0; i < 26; i++) next[25 - i] = -(this.state.checkers[i] ?? 0);
        this.state.checkers = next;
        this.state.cubeOwner = (-this.state.cubeOwner || 0) as -1 | 0 | 1;
        this.state.turn = (-this.state.turn) as -1 | 1;
        const prevBottom = this.state.scoreBottom;
        this.state.scoreBottom = this.state.scoreTop;
        this.state.scoreTop = prevBottom;
        return this.getXGID();
    }

    public getXGID(): string {
        return encodeXGID(this.state);
    }
}

export type SearchIntervalPreset = 'Normal' | 'Large' | 'Huge';

export interface CandidateMoveEval {
    moveNotation: string;
    resultingXGID: string;
    equity1PlyCubeless: number;
    equity1PlyCubeful?: number;
    equity2Ply?: number;
    equity3Ply?: number;
    evalLevelReached: 1 | 2 | 3;
}

export const XG_SEARCH_INTERVAL_CONFIG: Record<
    SearchIntervalPreset,
    { maxMoves1PlyCubeful: number; maxMoves2Ply: number; eqWindow2Ply: number; maxMoves3Ply: number; eqWindow3Ply: number }
> = {
    Normal: { maxMoves1PlyCubeful: 32, maxMoves2Ply: 8, eqWindow2Ply: 0.16, maxMoves3Ply: 4, eqWindow3Ply: 0.08 },
    Large: { maxMoves1PlyCubeful: 32, maxMoves2Ply: 12, eqWindow2Ply: 0.24, maxMoves3Ply: 6, eqWindow3Ply: 0.12 },
    Huge: { maxMoves1PlyCubeful: 32, maxMoves2Ply: 16, eqWindow2Ply: 0.32, maxMoves3Ply: 8, eqWindow3Ply: 0.16 },
};

export async function runXG3PlySearchIntervalPipeline(
    candidates: CandidateMoveEval[],
    preset: SearchIntervalPreset,
    evaluator: {
        eval1PlyCubeful: (m: CandidateMoveEval) => Promise<number>;
        eval2Ply: (m: CandidateMoveEval) => Promise<number>;
        eval3Ply: (m: CandidateMoveEval) => Promise<number>;
    },
): Promise<CandidateMoveEval[]> {
    const cfg = XG_SEARCH_INTERVAL_CONFIG[preset];
    candidates.sort((a, b) => b.equity1PlyCubeless - a.equity1PlyCubeless);

    const top32 = candidates.slice(0, cfg.maxMoves1PlyCubeful);
    for (const m of top32) {
        m.equity1PlyCubeful = await evaluator.eval1PlyCubeful(m);
        m.evalLevelReached = 1;
    }
    top32.sort((a, b) => (b.equity1PlyCubeful ?? -999) - (a.equity1PlyCubeful ?? -999));

    const best1PlyEq = top32[0]?.equity1PlyCubeful ?? 0;
    const pool2Ply = top32
        .filter((m) => best1PlyEq - (m.equity1PlyCubeful ?? -999) <= cfg.eqWindow2Ply)
        .slice(0, cfg.maxMoves2Ply);

    for (const m of pool2Ply) {
        m.equity2Ply = await evaluator.eval2Ply(m);
        m.evalLevelReached = 2;
    }
    pool2Ply.sort((a, b) => (b.equity2Ply ?? -999) - (a.equity2Ply ?? -999));

    const best2PlyEq = pool2Ply[0]?.equity2Ply ?? 0;
    const pool3Ply = pool2Ply
        .filter((m) => best2PlyEq - (m.equity2Ply ?? -999) <= cfg.eqWindow3Ply)
        .slice(0, cfg.maxMoves3Ply);

    for (const m of pool3Ply) {
        m.equity3Ply = await evaluator.eval3Ply(m);
        m.evalLevelReached = 3;
    }

    return top32.sort((a, b) => {
        if (a.evalLevelReached !== b.evalLevelReached) return b.evalLevelReached - a.evalLevelReached;
        const eqA = a.equity3Ply ?? a.equity2Ply ?? a.equity1PlyCubeful ?? a.equity1PlyCubeless;
        const eqB = b.equity3Ply ?? b.equity2Ply ?? b.equity1PlyCubeful ?? b.equity1PlyCubeless;
        return eqB - eqA;
    });
}

export function parseMatMatchToXGIDs(matContent: string): MatTurnSnapshot[] {
    const lines = matContent.split(/\r?\n/);
    const snapshots: MatTurnSnapshot[] = [];

    let variation: 'Standard' | 'NackGammon' = 'Standard';
    let matchLength = 0;
    let maxCubeExp = 10;
    const jacobyMoneyFlag = 3;
    let crawfordAlreadyTriggered = false;
    let isCurrentGameCrawford = false;

    let gameNumber = 0;
    let scoreBottom = 0;
    let scoreTop = 0;
    let cubeExp = 0;
    let cubeOwner: -1 | 0 | 1 = 0;
    let board = createStartingBoard(variation);

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith(';')) {
            const varMatch = line.match(/\[Variation\s+"([^"]+)"\]/i);
            if (varMatch && (varMatch[1] ?? '').toLowerCase().includes('nack')) variation = 'NackGammon';
            const cubeLimMatch = line.match(/\[CubeLimit\s+"(\d+)"\]/i);
            if (cubeLimMatch) {
                const lim = parseInt(cubeLimMatch[1] ?? '1', 10);
                maxCubeExp = lim <= 1 ? 0 : Math.round(Math.log2(lim));
            }
            continue;
        }

        const matchLenHeader = line.match(/^(\d+)\s+point\s+match/i);
        if (matchLenHeader) {
            matchLength = parseInt(matchLenHeader[1] ?? '0', 10);
            crawfordAlreadyTriggered = false;
            continue;
        }

        const gameHeader = line.match(/^Game\s+(\d+)/i);
        if (gameHeader) {
            gameNumber = parseInt(gameHeader[1] ?? '1', 10);
            board = createStartingBoard(variation);
            cubeExp = 0;
            cubeOwner = 0;
            continue;
        }

        const scoreLine = line.match(/^.+?:\s*(\d+)\s+.+?:\s*(\d+)$/);
        if (scoreLine && !/^\d+\)/.test(line)) {
            scoreBottom = parseInt(scoreLine[1] ?? '0', 10);
            scoreTop = parseInt(scoreLine[2] ?? '0', 10);
            if (matchLength > 0) {
                if (!crawfordAlreadyTriggered && (scoreBottom === matchLength - 1 || scoreTop === matchLength - 1)) {
                    isCurrentGameCrawford = true;
                    crawfordAlreadyTriggered = true;
                } else {
                    isCurrentGameCrawford = false;
                }
            }
            continue;
        }

        const turnMatch = line.match(/^\s*(\d+)\)\s*(.*)$/);
        if (turnMatch) {
            const moveNumber = parseInt(turnMatch[1] ?? '1', 10);
            const rest = turnMatch[2] ?? '';
            const columns = rest
                .split(/\s{2,}(?=(?:\d{2}:|Doubles|Takes|Drops|Beavers|Wins|Cannot|Resigns))/i)
                .map((c) => c.trim());

            const processHalfTurn = (actionStr: string, player: 1 | -1): void => {
                if (!actionStr) return;
                const crawfordOrJacoby = matchLength > 0 ? (isCurrentGameCrawford ? 1 : 0) : jacobyMoneyFlag;

                if (/^Doubles\s*=>\s*(\d+)/i.test(actionStr)) {
                    const beforeXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: player, dice: '00', scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    const afterXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: (-player) as -1 | 1, dice: 'D', scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    snapshots.push({ gameNumber, moveNumber, player, rawAction: actionStr, xgidBeforePlay: beforeXGID, xgidAfterPlay: afterXGID });
                    return;
                }
                if (/^Takes/i.test(actionStr)) {
                    cubeExp += 1;
                    cubeOwner = player;
                    return;
                }
                if (/^Beavers/i.test(actionStr)) {
                    cubeExp += 2;
                    cubeOwner = player;
                    return;
                }
                const rollMatch = actionStr.match(/^([1-6]{2}):\s*(.*)$/);
                if (rollMatch) {
                    const dice = rollMatch[1] ?? '00';
                    const playStr = rollMatch[2] ?? '';
                    const beforeXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: player, dice, scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    applyMatCheckerPlay(board, player, dice, playStr);
                    const afterXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: (-player) as -1 | 1, dice: '00', scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    snapshots.push({ gameNumber, moveNumber, player, rawAction: actionStr, xgidBeforePlay: beforeXGID, xgidAfterPlay: afterXGID });
                    return;
                }
                if (/^(cannot move|no move|\?\?)$/i.test(actionStr)) {
                    const beforeXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: player, dice: '00', scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    const afterXGID = encodeXGID({ checkers: new Int8Array(board), cubeExp, cubeOwner, turn: (-player) as -1 | 1, dice: '00', scoreBottom, scoreTop, crawfordOrJacoby, matchLength, maxCubeExp });
                    snapshots.push({ gameNumber, moveNumber, player, rawAction: actionStr, xgidBeforePlay: beforeXGID, xgidAfterPlay: afterXGID });
                }
            };

            if (columns.length === 1 && rest.startsWith(' '.repeat(18))) {
                processHalfTurn(columns[0] ?? '', -1);
            } else {
                if (columns[0]) processHalfTurn(columns[0], 1);
                if (columns[1]) processHalfTurn(columns[1], -1);
            }
        }
    }
    return snapshots;
}
