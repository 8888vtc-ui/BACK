/**
 * @file scripts/audit_bots_vs_gnubg.ts
 * @description Audit indépendant de TOUS les bots du projet face à GNU Backgammon 3-ply cubeful.
 *
 * Pour chacune des 50 positions de `gnubg3PlyCertifiedPositions.ts` :
 * 1. GNUBG note TOUS les coups légaux (`hint 999`, 3-ply sur le Top-5, plis inférieurs au-delà).
 * 2. Chaque bot choisit son coup ; on lit la perte d'équité de ce coup dans la liste GNUBG
 *    (appariement par plateau résultant, pas par texte).
 * 3. On agrège : % de coups identiques à GNUBG, perte moyenne (EMG), PR ≈ perte × 500, nb de blunders (> 0.080).
 *
 * Usage : npx tsx scripts/audit_bots_vs_gnubg.ts
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    applyMove,
    generateLegalMoves,
    parseXGID,
    type BoardState,
    type MoveSequence,
} from '../src/engine/backgammonEngine';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../src/lib/engine/gnubg3PlyCertifiedPositions';
import { parseCoachNotationMoves } from '../src/features/coach/coachMoveNotation';
import { pickLocalMove } from '../src/hooks/orchestrators/opponentMoveCalculator';
import { selectBotMoveWithBgsage } from '../src/lib/engine/bgsageClient';
import { findBestBoardMove } from '../src/lib/engine/evaluator';
import { analyzeBtCoreMoves } from '../src/lib/engine/btCoreEngine';
import { selectBestOpponentSequence, type AIDifficulty } from '../src/engine/aiHeuristics';

const GNUBG_CLI_PATH = 'C:\\Program Files (x86)\\gnubg\\gnubg-cli.exe';

interface GnubgScoredMove {
    readonly notation: string;
    readonly equityLoss: number;
    readonly plyLabel: string;
}

function parseNumFr(raw: string): number {
    return Number(raw.replace(',', '.').replace('+', '').trim());
}

function parseAllMoves(block: string): GnubgScoredMove[] {
    const out: GnubgScoredMove[] = [];
    for (const line of block.split(/\r?\n/)) {
        const m = line.match(/^\s*\d+\.\s+(Cubeful\s+\d+-ply)\s+(.+?)\s+Eq\.:\s*([+-]?\d+[.,]\d+)(?:\s*\(([+-]?\d+[.,]\d+)\))?/);
        if (!m) continue;
        out.push({ plyLabel: m[1]!, notation: m[2]!.trim(), equityLoss: m[4] ? Math.abs(parseNumFr(m[4])) : 0 });
    }
    return out;
}

/** Développe la notation GNUBG (ex. `8/4(2)`, frappes chaînées, `bar/22`) en sous-coups simples. */
function expandGnubgNotation(notation: string): string {
    const tokens: string[] = [];
    for (const raw of notation.replace(/\*/g, '').trim().split(/\s+/)) {
        const rep = raw.match(/^(.+)\((\d)\)$/);
        const body = rep ? rep[1]! : raw;
        const count = rep ? Number(rep[2]) : 1;
        const parts = body.toLowerCase().replace('bar', '25').replace('off', '0').split('/');
        const steps: string[] = [];
        for (let k = 0; k < parts.length - 1; k++) steps.push(`${parts[k]}/${parts[k + 1]}`);
        for (let c = 0; c < count; c++) tokens.push(...steps);
    }
    return tokens.join(' ');
}

function boardKey(b: ReadonlyArray<number>): string {
    return b.slice(0, 26).join(',');
}

function boardAfterGnubgMove(base: number[], notation: string): string | null {
    try {
        let b = [...base];
        for (const mv of parseCoachNotationMoves(expandGnubgNotation(notation), 'X')) b = applyMove(b, mv, 'X');
        return boardKey(b);
    } catch {
        return null;
    }
}

/** LCG déterministe (audit reproductible) pour les bots qui tirent au hasard. */
function makeLcg(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

type BotPick = (state: BoardState, dice: [number, number], legal: MoveSequence[], idx: number) => Promise<MoveSequence | null>;

const LOCAL_LEVELS: AIDifficulty[] = ['beginner', 'intermediate', 'expert', 'grandmaster'];

const BOTS: Array<{ id: string; label: string; pick: BotPick }> = [
    ...LOCAL_LEVELS.map((lvl) => ({
        id: `opensage_cloud_${lvl}`,
        label: `Open Sage Cloud Run — niveau ${lvl} (chemin du jeu réel)`,
        pick: (async (st, _d, legal, idx) => {
            const r = await selectBotMoveWithBgsage(st, legal, lvl, 20000, makeLcg(1000 + idx));
            return r?.sequence ?? null;
        }) as BotPick,
    })),
    ...LOCAL_LEVELS.map((lvl) => ({
        id: `local_fallback_${lvl}`,
        label: `Repli local hors-ligne — niveau ${lvl} (pickLocalMove)`,
        pick: (async (st, d, legal) => pickLocalMove(st, d, legal, lvl)) as BotPick,
    })),
    {
        id: 'btcore_3ply_engine_only',
        label: 'BT-Core « 3-ply » seul (sans table GNUBG)',
        pick: async (st, d, legal) => {
            const r = analyzeBtCoreMoves(st, d, { candidateMoves: legal, ply: 3, maxMoves: 1, useCertifiedTable: false });
            const m = r.bestMove;
            return m?.moves && m.board ? { moves: m.moves, board: m.board } : null;
        },
    },
    {
        id: 'evaluator_2ply',
        label: 'Évaluateur heuristique tri-phase 2-ply (findBestBoardMove)',
        pick: async (st, d) => findBestBoardMove(st, d, 2)?.sequence ?? null,
    },
    {
        id: 'heuristic_expert',
        label: 'Heuristique simple aiHeuristics (expert)',
        pick: async (_st, _d, legal, idx) => selectBestOpponentSequence(legal, 'X', 'expert', makeLcg(2000 + idx)),
    },
];

async function main(): Promise<void> {
    const positions = GNUBG_3PLY_CERTIFIED_POSITIONS;
    const tmpDir = path.join(process.cwd(), 'node_modules', '.cache');
    fs.mkdirSync(tmpDir, { recursive: true });

    // 1. GNUBG note tous les coups légaux de chaque position
    const lines = [
        'set output mwc off',
        'set evaluation chequerplay evaluation plies 3',
        'set evaluation chequerplay evaluation cubeful on',
        'set evaluation movefilter 3 0 0 8 0.16',
        'set evaluation movefilter 3 1 0 8 0.16',
        'set evaluation movefilter 3 2 0 5 0.16',
    ];
    for (const p of positions) lines.push(`set xgid ${p.xgid}`, 'hint 999');
    lines.push('quit');
    const cmdFile = path.join(tmpDir, 'audit_bots_all_moves.cmd');
    fs.writeFileSync(cmdFile, lines.join('\n'), 'ascii');
    console.log(`[Audit] GNUBG note tous les coups de ${positions.length} positions...`);
    const proc = spawnSync(GNUBG_CLI_PATH, ['-t', '-q', '-c', cmdFile], { encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
    if (proc.error) throw proc.error;
    const blocks = proc.stdout.split('GNU Backgammon  Position ID:').slice(1);

    const tables = positions.map((p, i) => {
        const state: BoardState = { ...parseXGID(p.xgid), dice: [p.dice[0], p.dice[1]] };
        const scored = parseAllMoves(blocks[i] ?? '');
        const byBoard = new Map<string, GnubgScoredMove>();
        for (const s of scored) {
            const k = boardAfterGnubgMove(state.board, s.notation);
            if (k && !byBoard.has(k)) byBoard.set(k, s);
        }
        return { p, state, scored, byBoard };
    });

    // 2. Chaque bot joue les 50 positions
    const results: Array<Record<string, number | string>> = [];
    for (const bot of BOTS) {
        let matched = 0;
        let top1 = 0;
        let lossSum = 0;
        let blunders = 0;
        let errors = 0;
        let unmatched = 0;
        const t0 = Date.now();
        for (let i = 0; i < tables.length; i++) {
            const { p, state, byBoard } = tables[i]!;
            const dice: [number, number] = [p.dice[0], p.dice[1]];
            const legal = generateLegalMoves(state, dice);
            let seq: MoveSequence | null = null;
            try {
                seq = await bot.pick(state, dice, legal, i);
            } catch {
                seq = null;
            }
            if (!seq) {
                errors++;
                continue;
            }
            const g = byBoard.get(boardKey(seq.board));
            if (!g) {
                unmatched++;
                continue;
            }
            matched++;
            lossSum += g.equityLoss;
            if (g.equityLoss === 0) top1++;
            if (g.equityLoss > 0.08) blunders++;
        }
        const meanLoss = matched > 0 ? lossSum / matched : NaN;
        const row = {
            id: bot.id,
            label: bot.label,
            positions: tables.length,
            evaluated: matched,
            noMove: errors,
            unmatched,
            top1Pct: matched > 0 ? Math.round((top1 / matched) * 100) : 0,
            meanLossEmg: Number(meanLoss.toFixed(4)),
            prApprox: Number((meanLoss * 500).toFixed(1)),
            blundersOver080: blunders,
            seconds: Math.round((Date.now() - t0) / 1000),
        };
        results.push(row);
        console.log(JSON.stringify(row));
    }

    const outPath = path.join(process.cwd(), 'data', 'campaign', 'bots_audit_vs_gnubg3ply.json');
    fs.writeFileSync(outPath, JSON.stringify({ date: new Date().toISOString(), reference: 'GNU Backgammon 1.08.003 3-ply cubeful', results }, null, 2), 'utf8');
    console.log(`[OK] Résultats : ${outPath}`);
}

void main();
