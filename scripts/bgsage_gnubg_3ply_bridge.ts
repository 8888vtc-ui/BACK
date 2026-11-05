/**
 * @file scripts/bgsage_gnubg_3ply_bridge.ts
 * @description Pont binaire & HTTP (`bgsage` 3-ply + `gnubg-cli.exe` 3-ply cubeful) pour l'usine à Quiz (`CHECKER_PLAY` + `CUBE_DECISION`).
 * Strictement <= 220 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { Gnubg3PlyCrossCheckReport } from '../src/features/drills/bgsage3PlyQuizFactoryCore';

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

export interface BgsageRawMove {
    readonly rank: number;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly evalLevel?: string;
    readonly playerGamePlan?: string;
    readonly opponentGamePlan?: string;
    readonly probabilities: BgsageProbabilities;
    readonly board: number[];
}

export interface BgsageRawCube {
    readonly noDouble: number;
    readonly doubleTake: number;
    readonly doublePass: number;
    readonly optimalAction: string;
}

export interface BgsageRawResponse {
    readonly chequerPlay: BgsageRawMove[];
    readonly cubeDecision?: BgsageRawCube;
    readonly gamePlans?: { readonly player: string; readonly opponent: string };
    readonly isRace?: boolean;
}

export interface Gnubg3PlyMoveResult {
    readonly rank: number;
    readonly ply: number;
    readonly notation: string;
    readonly equity: number;
    readonly loss: number;
    readonly probabilities: BgsageProbabilities;
}

export interface Gnubg3PlyCubeResult {
    readonly optimalAction: string;
    readonly noDoubleEq: number;
    readonly doubleTakeEq: number;
    readonly doublePassEq: number;
    readonly probabilities: BgsageProbabilities;
}

export async function callBgsageEvaluate(xgid: string, ply: number): Promise<BgsageRawResponse> {
    const res = await fetch(`${BGSAGE_BASE_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xgid, ply }),
    });
    if (!res.ok) throw new Error(`bgsage /api/evaluate HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as BgsageRawResponse;
}

export async function callBgsageForced3Ply(
    board26: ReadonlyArray<number>,
    dice: readonly [number, number],
): Promise<BgsageRawResponse> {
    const res = await fetch(`${BGSAGE_BASE_URL}/api/evaluate-board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: Array.from(board26), dice: [dice[0], dice[1]], ply: 3 }),
    });
    if (!res.ok) throw new Error(`bgsage /api/evaluate-board HTTP ${res.status}: ${await res.text()}`);
    return (await res.json()) as BgsageRawResponse;
}

export function normalizeNotationForCompare(n: string): string {
    const cleaned = n.replace(/\*/g, '').trim();
    const expanded = cleaned.replace(/(\S+)\(([234])\)/g, (_m, step: string, countStr: string) => {
        const count = Number(countStr);
        return Array.from({ length: count }, () => step).join(' ');
    });
    return expanded
        .split(/\s+/)
        .flatMap((tok) => {
            const parts = tok.split('/');
            return parts.length > 2 ? parts.slice(0, -1).map((p, k) => `${p}/${parts[k + 1]}`) : [tok];
        })
        .filter((s) => s.length > 0)
        .sort()
        .join(' ')
        .toLowerCase();
}

export function queryGnubgTopMovesAtPly(xgid: string, ply: number): ReadonlyArray<Gnubg3PlyMoveResult> {
    if (!fs.existsSync(GNUBG_CLI_PATH)) return [];
    const cleanXgid = xgid.replace(/^XGID=/, '');
    const cmdLines = [
        'set output mwc off',
        `set evaluation chequerplay evaluation plies ${ply}`,
        'set evaluation chequerplay evaluation cubeful on',
        'set evaluation movefilter 3 0 0 8 0.16',
        'set evaluation movefilter 3 1 0 8 0.16',
        'set evaluation movefilter 3 2 0 8 0.16',
        `set xgid ${cleanXgid}`,
        'hint 6',
        'quit',
    ];
    const proc = spawnSync(GNUBG_CLI_PATH, ['-t', '-q'], { input: cmdLines.join('\n'), encoding: 'utf8', timeout: 30000 });
    if (proc.error) return [];
    const lines = (proc.stdout ?? '').replace(/,/g, '.').split(/\r?\n/);
    const results: Gnubg3PlyMoveResult[] = [];
    for (let i = 0; i < lines.length; i++) {
        const m = (lines[i] ?? '').match(
            /^\s*(\d+)\.\s+Cubeful\s+(\d+)-ply\s+(.+?)\s+Eq\.:\s*([+-]?\d+\.\d+)(?:\s*\(([+-]?\d+\.\d+)\))?/,
        );
        if (!m) continue;
        const pLine = lines[i + 1] ?? '';
        const pm = pLine.match(
            /^\s*(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+-\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/,
        );
        if (!pm) continue;
        const eq = Number(m[4]);
        const topEq = results.length === 0 ? eq : results[0]!.equity;
        const loss = results.length === 0 ? 0 : m[5] ? Math.abs(Number(m[5])) : Number(Math.abs(topEq - eq).toFixed(3));
        const winProb = Number(pm[1]);
        results.push({
            rank: Number(m[1]),
            ply: Number(m[2]),
            notation: m[3]!.trim(),
            equity: eq,
            loss,
            probabilities: {
                win: winProb,
                winGammon: Number(pm[2]),
                winBackgammon: Number(pm[3]),
                loseWin: Number((1 - winProb).toFixed(4)),
                loseGammon: Number(pm[5]),
                loseBackgammon: Number(pm[6]),
            },
        });
    }
    return results;
}

export function queryGnubgCube3Ply(xgid: string): Gnubg3PlyCubeResult | null {
    if (!fs.existsSync(GNUBG_CLI_PATH)) return null;
    const cubeXgid = xgid.replace(/^XGID=/, '').replace(/:([0-6][0-6]):/, ':00:');
    const cmdLines = [
        'set output mwc off',
        'set evaluation cubedecision evaluation plies 3',
        'set evaluation cubedecision evaluation cubeful on',
        `set xgid ${cubeXgid}`,
        'hint',
        'quit',
    ];
    const proc = spawnSync(GNUBG_CLI_PATH, ['-t', '-q'], { input: cmdLines.join('\n'), encoding: 'utf8', timeout: 30000 });
    if (proc.error) return null;
    const out = (proc.stdout ?? '').replace(/,/g, '.');
    const probMatch = out.match(
        /3-ply cubeless equity[^\r\n]*\r?\n\s*(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s+-\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/i,
    );
    const dtMatch = out.match(/Double[.,]\s*take\s+([+-]?\d+\.\d+)/i);
    const dpMatch = out.match(/Double[.,]\s*pass\s+([+-]?\d+\.\d+)/i);
    const ndMatch = out.match(/No\s+(?:redouble|double)\s+([+-]?\d+\.\d+)/i);
    const actionMatch = out.match(/Proper\s+cube\s+action:\s*(.+)/i);
    if (!probMatch || !dtMatch || !ndMatch || !actionMatch) return null;
    const rawAction = actionMatch[1]!.trim();
    const normAction =
        /^No\s+(?:redouble|double)/i.test(rawAction) || /Too\s+good/i.test(rawAction)
            ? 'No Double / Take'
            : /Double.*pass/i.test(rawAction)
              ? 'Double / Pass'
              : 'Double / Take';
    const cubeWinProb = Number(probMatch[1]);
    return {
        optimalAction: normAction,
        noDoubleEq: Number(ndMatch[1]),
        doubleTakeEq: Number(dtMatch[1]),
        doublePassEq: dpMatch ? Number(dpMatch[1]) : 1.0,
        probabilities: {
            win: cubeWinProb,
            winGammon: Number(probMatch[2]),
            winBackgammon: Number(probMatch[3]),
            loseWin: Number((1 - cubeWinProb).toFixed(4)),
            loseGammon: Number(probMatch[5]),
            loseBackgammon: Number(probMatch[6]),
        },
    };
}

export function verifyWithGnubg3Ply(
    xgid: string,
    bgsageTopMove: string,
    bgsageMoves3Ply: ReadonlyArray<BgsageRawMove>,
): Gnubg3PlyCrossCheckReport {
    const gnubgMoves = queryGnubgTopMovesAtPly(xgid, 3);
    if (gnubgMoves.length === 0) {
        return { gnubgTopMove3Ply: bgsageTopMove, bgsageTopMove3Ply: bgsageTopMove, top1DisagreementEmg: 0.0, isAgreementValid: false };
    }
    const gnubgTop = gnubgMoves[0]!;
    const normBgsage = normalizeNotationForCompare(bgsageTopMove);
    const normGnubg = normalizeNotationForCompare(gnubgTop.notation);
    if (normBgsage === normGnubg) {
        return { gnubgTopMove3Ply: gnubgTop.notation, bgsageTopMove3Ply: bgsageTopMove, top1DisagreementEmg: 0.0, isAgreementValid: true };
    }
    const bgsageInGnubg = gnubgMoves.find((m) => normalizeNotationForCompare(m.notation) === normBgsage);
    const gnubgInBgsage = bgsageMoves3Ply.find((m) => normalizeNotationForCompare(m.notation) === normGnubg);
    const disagreement = bgsageInGnubg ? bgsageInGnubg.loss : gnubgInBgsage ? Math.abs(gnubgInBgsage.equityLoss) : 0.05;
    const roundedDisagreement = Number(disagreement.toFixed(4));
    return {
        gnubgTopMove3Ply: gnubgTop.notation,
        bgsageTopMove3Ply: bgsageTopMove,
        top1DisagreementEmg: roundedDisagreement,
        isAgreementValid: roundedDisagreement <= 0.025,
    };
}
