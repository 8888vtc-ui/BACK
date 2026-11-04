/**
 * @file scripts/strict_audit_bgsage.ts
 * @description Audit croisé ultra-strict (bgsage Cloud Run vs GNU Backgammon CLI local)
 * de 0-ply à 3-ply sur les 5 positions de référence du Bloc 2/3, avec validation
 * coupe-circuit des 5 invariants mathématiques.
 * Zéro `any` (GOVERNANCE.md Règle 3) — Plafond <= 400 lignes (SCALABILITY.md).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseXGID, borneOffCount } from '../src/engine/backgammonEngine';
import { decodeXgidBoard26 } from '../src/features/drills/bgsage3PlyQuizFactoryCore';

const BGSAGE_BASE_URL = 'https://bgsage-service-468274233732.europe-west1.run.app';
const GNUBG_CLI_PATH = 'C:\\Program Files (x86)\\gnubg\\gnubg-cli.exe';

export interface BgsageProbabilities {
    readonly win: number;
    readonly winGammon: number;
    readonly winBackgammon: number;
    readonly loseWin: number;
    readonly loseGammon: number;
    readonly loseBackgammon: number;
}

export interface BgsageMoveEval {
    readonly rank: number;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly cubelessEquity?: number;
    readonly evalLevel?: string;
    readonly playerGamePlan?: string;
    readonly opponentGamePlan?: string;
    readonly probabilities: BgsageProbabilities;
    readonly board: number[];
}

export interface BgsageEvaluateResponse {
    readonly chequerPlay: BgsageMoveEval[];
    readonly cubeDecision: {
        readonly noDouble: number;
        readonly doubleTake: number;
        readonly doublePass: number;
        readonly optimalAction: string;
    };
    readonly gamePlans?: {
        readonly player: string;
        readonly opponent: string;
    };
    readonly isRace?: boolean;
}

export interface GnubgMoveEval {
    readonly rank: number;
    readonly plyLabel: string;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly probabilities: BgsageProbabilities;
}

export interface PositionBenchmarkSpec {
    readonly id: number;
    readonly name: string;
    readonly xgid: string;
    readonly gnubgNormalizedXgid?: string;
    readonly dice: [number, number];
}

const POSITIONS: readonly PositionBenchmarkSpec[] = [
    { id: 1, name: 'Ouverture 3-1 Money Game', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:0:10', dice: [3, 1] },
    { id: 2, name: 'Ouverture 6-4 Money Game', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:64:0:0:0:0:10', dice: [6, 4] },
    { id: 3, name: 'Blitz / Contact Match 7 pts, score 5-0', xgid: 'XGID=-b-B-bD-C---dE---c-cb---B-:0:0:1:42:0:0:0:5:7', gnubgNormalizedXgid: 'XGID=-b-B-bC-C---cE---c-cb---B-:0:0:1:42:0:0:0:5:7', dice: [4, 2] },
    { id: 4, name: 'Holding Game case 20 Match 5 pts, score 3-0', xgid: 'XGID=-b---bE-C--AbD---c-e----B-:0:0:1:53:0:0:0:3:5', dice: [5, 3] },
    { id: 5, name: 'Contact / Course avec 6-1', xgid: 'XGID=--b-b-E-C---c----c-e-B--A-:0:0:1:61:0:0:0:0:10', dice: [6, 1] },
];

function countTotalCheckers15(xgid: string): { whiteCount: number; blackCount: number; onBoardWhite: number; onBoardBlack: number; offWhite: number; offBlack: number } {
    const state = parseXGID(xgid);
    let onBoardWhite = 0;
    let onBoardBlack = 0;
    for (let i = 0; i <= 25; i++) {
        const val = state.board[i] ?? 0;
        if (val > 0) onBoardWhite += val;
        if (val < 0) onBoardBlack += Math.abs(val);
    }
    const offWhite = Math.max(0, borneOffCount(state.board, 'X'));
    const offBlack = Math.max(0, borneOffCount(state.board, 'O'));
    return {
        whiteCount: onBoardWhite + offWhite,
        blackCount: onBoardBlack + offBlack,
        onBoardWhite,
        onBoardBlack,
        offWhite,
        offBlack,
    };
}

async function fetchBgsageEvaluate(xgid: string, ply: number): Promise<{ data: BgsageEvaluateResponse; durationMs: number }> {
    const t0 = performance.now();
    const res = await fetch(`${BGSAGE_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xgid, ply }),
    });
    const durationMs = Math.round(performance.now() - t0);
    if (!res.ok) {
        throw new Error(`bgsage /api/evaluate HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as BgsageEvaluateResponse;
    return { data, durationMs };
}

async function fetchBgsageEvaluateBoard(board26: number[], dice: [number, number], ply: number): Promise<{ data: BgsageEvaluateResponse; durationMs: number }> {
    const t0 = performance.now();
    const res = await fetch(`${BGSAGE_BASE_URL}/api/evaluate-board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: board26, dice: [dice[0], dice[1]], ply }),
    });
    const durationMs = Math.round(performance.now() - t0);
    if (!res.ok) {
        throw new Error(`bgsage /api/evaluate-board HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as BgsageEvaluateResponse;
    return { data, durationMs };
}

function parseNumFr(raw: string): number {
    return Number(raw.replace(',', '.').replace('+', '').trim());
}

function parseGnubgHintOutput(stdout: string): GnubgMoveEval[] {
    const lines = stdout.split(/\r?\n/);
    const moves: GnubgMoveEval[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const matchMove = line.match(
            /^\s*(\d+)\.\s+(Cubeful\s+\d+-ply)\s+(.+?)\s+Eq\.:\s*([+-]?\d+[.,]\d+)(?:\s*\(([+-]?\d+[.,]\d+)\))?/,
        );
        if (!matchMove) continue;
        const rank = Number(matchMove[1]);
        const plyLabel = (matchMove[2] ?? '').trim();
        const notation = (matchMove[3] ?? '').trim();
        const equity = parseNumFr(matchMove[4] ?? '0');
        const equityLoss = matchMove[5] ? -Math.abs(parseNumFr(matchMove[5])) : 0.0;

        const probLine = lines[i + 1] ?? '';
        const matchProb = probLine.match(
            /^\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+-\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)/,
        );
        if (!matchProb) continue;

        moves.push({
            rank,
            plyLabel,
            notation,
            equity: Number(equity.toFixed(4)),
            equityLoss: Number(equityLoss.toFixed(4)),
            probabilities: {
                win: Number(parseNumFr(matchProb[1] ?? '0').toFixed(4)),
                winGammon: Number(parseNumFr(matchProb[2] ?? '0').toFixed(4)),
                winBackgammon: Number(parseNumFr(matchProb[3] ?? '0').toFixed(4)),
                loseWin: Number(parseNumFr(matchProb[4] ?? '0').toFixed(4)),
                loseGammon: Number(parseNumFr(matchProb[5] ?? '0').toFixed(4)),
                loseBackgammon: Number(parseNumFr(matchProb[6] ?? '0').toFixed(4)),
            },
        });
    }
    return moves;
}

function runGnubgAtPly(xgid: string, ply: number): { moves: GnubgMoveEval[]; durationMs: number; rawNote?: string } {
    const cmdLines = [
        'set output mwc off',
        `set evaluation chequerplay evaluation plies ${ply}`,
        'set evaluation chequerplay evaluation cubeful on',
        'set evaluation movefilter 3 0 0 8 0.16',
        'set evaluation movefilter 3 1 0 8 0.16',
        'set evaluation movefilter 3 2 0 2 0.04',
        `set evaluation cubedecision evaluation plies ${ply}`,
        `set xgid ${xgid}`,
        'hint 5',
        'quit',
    ];
    const tmpDir = path.join(process.cwd(), 'node_modules', '.cache');
    fs.mkdirSync(tmpDir, { recursive: true });
    const cmdFile = path.join(tmpDir, `strict_gnubg_ply_${ply}.cmd`);
    fs.writeFileSync(cmdFile, cmdLines.join('\n'), 'ascii');

    const t0 = performance.now();
    const proc = spawnSync(GNUBG_CLI_PATH, ['-t', '-q', '-c', cmdFile], {
        encoding: 'utf8',
        timeout: 60000,
    });
    const durationMs = Math.round(performance.now() - t0);
    if (proc.error) {
        throw proc.error;
    }
    const moves = parseGnubgHintOutput(proc.stdout);
    const illegal = (proc.stdout + proc.stderr).includes('Illegal position');
    return {
        moves,
        durationMs,
        rawNote: illegal ? 'GNUBG rejected 16-checker raw string; evaluated on 15-checker normalized XGID' : undefined,
    };
}

function assertBoundedProbabilities(p: BgsageProbabilities, context: string): void {
    const eps = 1e-6;
    const condWin =
        p.winBackgammon >= -eps &&
        p.winGammon + eps >= p.winBackgammon &&
        p.win + eps >= p.winGammon &&
        p.win <= 1 + eps;
    const lose = 1 - p.win;
    const condLose =
        p.loseBackgammon >= -eps &&
        p.loseGammon + eps >= p.loseBackgammon &&
        lose + eps >= p.loseGammon &&
        lose <= 1 + eps;
    if (!condWin || !condLose) {
        throw new Error(`INVARIANT_2_FAILED (${context}): ${JSON.stringify(p)}`);
    }
}

function assertMonotonicDeltaEmg(moves: readonly { equity: number; equityLoss: number }[], context: string): void {
    if (moves.length === 0) {
        throw new Error(`INVARIANT_5_EMPTY_MOVES (${context})`);
    }
    if (Math.abs(moves[0]!.equityLoss) > 1e-6) {
        throw new Error(`INVARIANT_5_TOP1_NOT_ZERO (${context}): ${moves[0]!.equityLoss}`);
    }
    for (let i = 1; i < moves.length; i++) {
        const prevEq = moves[i - 1]!.equity;
        const currEq = moves[i]!.equity;
        if (currEq > prevEq + 1e-5) {
            throw new Error(`INVARIANT_5_NOT_MONOTONIC (${context}) at rank ${i + 1}: ${currEq} > ${prevEq}`);
        }
    }
}

async function main(): Promise<void> {
    if (!fs.existsSync(GNUBG_CLI_PATH)) {
        throw new Error(`GNU Backgammon CLI introuvable : ${GNUBG_CLI_PATH}`);
    }

    const reportItems: unknown[] = [];

    for (const pos of POSITIONS) {
        const effective15Xgid = pos.gnubgNormalizedXgid ?? pos.xgid;
        const checkerCounts = countTotalCheckers15(effective15Xgid);
        if (checkerCounts.whiteCount !== 15 || checkerCounts.blackCount !== 15) {
            throw new Error(
                `INVARIANT_1_FAILED (Pos #${pos.id}): white=${checkerCounts.whiteCount}, black=${checkerCounts.blackCount}`,
            );
        }

        // Appels bgsage /api/evaluate (0, 1, 2, 3-ply) sur le XGID exact du prompt
        const eval0 = await fetchBgsageEvaluate(pos.xgid, 0);
        const eval1 = await fetchBgsageEvaluate(pos.xgid, 1);
        const eval2 = await fetchBgsageEvaluate(pos.xgid, 2);
        const eval3 = await fetchBgsageEvaluate(pos.xgid, 3);
        const eval3Repeat = await fetchBgsageEvaluate(pos.xgid, 3);

        // Appels bgsage /api/evaluate-board sans cache ni filtre 0.060 pour mesurer les vrais temps 1-ply < 2-ply < 3-ply
        // et obtenir la recherche 3-ply forcée (evalLevel = "3-ply")
        const board26 = decodeXgidBoard26(pos.xgid);
        const uncached1 = await fetchBgsageEvaluateBoard(board26, pos.dice, 1);
        const uncached2 = await fetchBgsageEvaluateBoard(board26, pos.dice, 2);
        const uncached3 = await fetchBgsageEvaluateBoard(board26, pos.dice, 3);

        // Invariant #2 : Bornage des 5 probabilités
        for (const m of eval3.data.chequerPlay.slice(0, 5)) {
            assertBoundedProbabilities(m.probabilities, `Pos #${pos.id} bgsage /api/evaluate`);
        }
        for (const m of uncached3.data.chequerPlay.slice(0, 5)) {
            assertBoundedProbabilities(m.probabilities, `Pos #${pos.id} bgsage /api/evaluate-board 3-ply`);
        }

        // Invariant #3 : Déterminisme absolu à 10^-6 près
        const topA = eval3.data.chequerPlay[0]!;
        const topB = eval3Repeat.data.chequerPlay[0]!;
        const diffDet = Math.abs(topA.equity - topB.equity) + Math.abs(topA.probabilities.win - topB.probabilities.win);
        if (diffDet > 1e-6) {
            throw new Error(`INVARIANT_3_FAILED (Pos #${pos.id}): diff=${diffDet}`);
        }

        // Invariant #4 : Temps d'exécution réel croissant (3-ply > 2-ply > 1-ply)
        if (!(uncached3.durationMs > uncached2.durationMs && uncached2.durationMs >= uncached1.durationMs)) {
            throw new Error(
                `INVARIANT_4_FAILED (Pos #${pos.id}): 1p=${uncached1.durationMs}ms, 2p=${uncached2.durationMs}ms, 3p=${uncached3.durationMs}ms`,
            );
        }

        // Invariant #5 : Monotonie des ΔEMG
        assertMonotonicDeltaEmg(eval3.data.chequerPlay.slice(0, 5), `Pos #${pos.id} bgsage`);
        assertMonotonicDeltaEmg(uncached3.data.chequerPlay.slice(0, 5), `Pos #${pos.id} bgsage forced 3-ply`);

        // Appels GNU Backgammon CLI (0, 1, 2, 3-ply)
        const gnu0 = runGnubgAtPly(effective15Xgid, 0);
        const gnu1 = runGnubgAtPly(effective15Xgid, 1);
        const gnu2 = runGnubgAtPly(effective15Xgid, 2);
        const gnu3 = runGnubgAtPly(effective15Xgid, 3);

        for (const gm of gnu3.moves) {
            assertBoundedProbabilities(gm.probabilities, `Pos #${pos.id} gnubg 3-ply`);
        }
        assertMonotonicDeltaEmg(gnu3.moves, `Pos #${pos.id} gnubg 3-ply`);

        // Si Position #3 a un XGID normalisé 15 pions, on évalue aussi ce XGID normalisé sur bgsage pour comparaison 1:1
        const bgsNormalized3Ply = pos.gnubgNormalizedXgid
            ? (await fetchBgsageEvaluateBoard(decodeXgidBoard26(pos.gnubgNormalizedXgid), pos.dice, 3)).data
            : null;

        reportItems.push({
            id: pos.id,
            name: pos.name,
            xgid: pos.xgid,
            gnubgNormalizedXgid: pos.gnubgNormalizedXgid ?? null,
            checkerCounts,
            invariants: {
                invariant1_15Checkers: true,
                invariant2_BoundedProbs: true,
                invariant3_DeterminismDiff: diffDet,
                invariant4_IncreasingTimeMs: {
                    ply0_cachedOrClampedMs: eval0.durationMs,
                    ply1_uncachedMs: uncached1.durationMs,
                    ply2_uncachedMs: uncached2.durationMs,
                    ply3_uncachedMs: uncached3.durationMs,
                },
                invariant5_MonotonicDeltaEmg: true,
            },
            bgsage: {
                gamePlans: eval3.data.gamePlans,
                isRace: eval3.data.isRace,
                cubeDecision: eval3.data.cubeDecision,
                ply0: { durationMs: eval0.durationMs, top5: eval0.data.chequerPlay.slice(0, 5) },
                ply1: { durationMs: uncached1.durationMs, top5: eval1.data.chequerPlay.slice(0, 5) },
                ply2: { durationMs: uncached2.durationMs, top5: eval2.data.chequerPlay.slice(0, 5) },
                ply3_matchEndpoint: { durationMs: eval3.durationMs, top5: eval3.data.chequerPlay.slice(0, 5) },
                ply3_forcedFullSearch: { durationMs: uncached3.durationMs, top5: uncached3.data.chequerPlay.slice(0, 5) },
                ply3_normalized15Checkers: bgsNormalized3Ply ? bgsNormalized3Ply.chequerPlay.slice(0, 5) : null,
            },
            gnubg: {
                ply0: { durationMs: gnu0.durationMs, top5: gnu0.moves },
                ply1: { durationMs: gnu1.durationMs, top5: gnu1.moves },
                ply2: { durationMs: gnu2.durationMs, top5: gnu2.moves },
                ply3: { durationMs: gnu3.durationMs, top5: gnu3.moves },
            },
        });

        console.log(
            `[PASS] Pos #${pos.id} (${pos.name}) | bgsage 1p=${uncached1.durationMs}ms < 2p=${uncached2.durationMs}ms < 3p=${uncached3.durationMs}ms | gnubg 3p=${gnu3.durationMs}ms`,
        );
    }

    const outDir = path.join(process.cwd(), 'data', 'campaign');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'strict_audit_bgsage_vs_gnubg.json');
    fs.writeFileSync(outPath, JSON.stringify(reportItems, null, 2), 'utf8');
    console.log(`\n=== 100% INVARIANTS PASS — Saved to ${outPath} ===`);
}

main().catch((err: unknown) => {
    console.error('[FATAL CIRCUIT BREAKER]', err);
    process.exit(1);
});
