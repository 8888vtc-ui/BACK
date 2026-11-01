/**
 * @file scripts/generate_50k_3ply_quizzes.ts
 * @description Pipeline de génération de 50 000 Quiz Certifiés 100 % 3-Ply Non-Triviaux (`gnubg-cli.exe -t -q`).
 *
 * Critères d'admission stricts (Agent `FlashLite-NonTrivial-Quiz-Filter`) :
 * 1. ZÉRO Course Pure / ZÉRO Coup Évident :
 *    - Rejette 100 % des positions sans contact (`isContactPosition(board) === false` / `PURE_RACE`).
 *    - Rejette tous les coups forcés ou évidents (écart #1 vs #2 > 0.120 EMG).
 * 2. Dilemme Stratégique 3-Ply Réel :
 *    - Au moins 4 coups légaux non triviaux,
 *    - Le coup #1 en 3-ply diffère du coup naïf 0-ply/1-ply OU les 3 meilleurs coups se tiennent dans
 *      une fenêtre fine (0.008 <= ΔEMG <= 0.085),
 *    - Pré-calcule et stocke tous les coups candidats avec leurs vraies valeurs 3-ply (ΔEMG, W%, G%, BG%),
 *      leur difficulté intrinsèque `requiredEr` (0.0 à 30.0) et leur `XGID` certifié.
 * 3. Mode Batch Parallélisé avec Checkpointing (`data/quizzes_3ply_50k_checkpoint.jsonl`).
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    parseXGID,
    generateLegalMoves,
    pipCount,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    type BoardState,
} from '../src/engine/backgammonEngine';
import { isContactPosition, resolveSemanticArchetype } from '../src/features/drills/drillSubAgentsPipeline';
import { analyzeBoardMoves } from '../src/lib/engine/evaluator';
import { BTCORE_5000_HARVEST_SEEDS } from '../src/features/drills/btCore5000HarvestSeeds';

const GNUBG_CLI_PATH = 'C:\\Program Files (x86)\\gnubg\\gnubg-cli.exe';
const CHECKPOINT_FILE = path.join(process.cwd(), 'node_modules', '.cache', 'quizzes_3ply_50k_checkpoint.jsonl');

export interface Certified3PlyQuizCandidateMove {
    readonly rank: number;
    readonly notation: string;
    readonly equity: number;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
    readonly winBackgammon: number;
    readonly loseWin: number;
    readonly loseGammon: number;
    readonly loseBackgammon: number;
}

export interface Certified3PlyQuizEntry {
    readonly id: string;
    readonly xgid: string;
    readonly dice: readonly [number, number];
    readonly requiredEr: number;
    readonly is3PlyTrapVs0Ply: boolean;
    readonly conceptId: string;
    readonly conceptName: string;
    readonly optimalMove: string;
    readonly playedMove: string;
    readonly equityLoss: number;
    readonly quizChoices: readonly string[];
    readonly candidateMoves3Ply: readonly Certified3PlyQuizCandidateMove[];
}

function normalizeBoardForX(xgid: string): BoardState {
    const state = parseXGID(xgid);
    if (state.turn === 'O') {
        const flipped = new Array<number>(28).fill(0);
        for (let pt = 1; pt <= 24; pt++) {
            flipped[25 - pt] = -(state.board[pt] ?? 0);
        }
        flipped[X_BAR] = Math.abs(state.board[O_BAR] ?? 0);
        flipped[O_BAR] = -Math.abs(state.board[X_BAR] ?? 0);
        flipped[X_OFF] = Math.abs(state.board[O_OFF] ?? 0);
        flipped[O_OFF] = -Math.abs(state.board[X_OFF] ?? 0);
        return {
            ...state,
            board: flipped,
            turn: 'X',
            scoreX: state.scoreO,
            scoreO: state.scoreX,
            cubeOwner: state.cubeOwner === null ? null : state.cubeOwner === 'O' ? 'X' : 'O',
        };
    }
    return state;
}

function parseNumFr(raw: string): number {
    return Number(raw.replace(',', '.').replace('+', '').trim());
}

function parseGnubgMoves(block: string): Certified3PlyQuizCandidateMove[] {
    const lines = block.split(/\r?\n/);
    const moves: Certified3PlyQuizCandidateMove[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        const matchMove = line.match(
            /^\s*(\d+)\.\s+Cubeful\s+\d+-ply\s+(.+?)\s+Eq\.:\s*([+-]?\d+[.,]\d+)(?:\s*\(([+-]?\d+[.,]\d+)\))?/,
        );
        if (!matchMove) continue;
        const probLine = lines[i + 1] ?? '';
        const matchProb = probLine.match(
            /^\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+-\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)/,
        );
        if (!matchProb) continue;

        moves.push({
            rank: Number(matchMove[1]),
            notation: matchMove[2]!.trim(),
            equity: Number(parseNumFr(matchMove[3]!).toFixed(4)),
            equityLoss: matchMove[4] ? Number(Math.abs(parseNumFr(matchMove[4]!)).toFixed(4)) : 0,
            win: Number(parseNumFr(matchProb[1]!).toFixed(4)),
            winGammon: Number(parseNumFr(matchProb[2]!).toFixed(4)),
            winBackgammon: Number(parseNumFr(matchProb[3]!).toFixed(4)),
            loseWin: Number(parseNumFr(matchProb[4]!).toFixed(4)),
            loseGammon: Number(parseNumFr(matchProb[5]!).toFixed(4)),
            loseBackgammon: Number(parseNumFr(matchProb[6]!).toFixed(4)),
        });
    }
    return moves;
}

/**
 * Calibre la difficulté intrinsèque `requiredEr` (0.0 à 30.0) d'un quiz 3-ply :
 * - Plus l'écart ΔEMG entre #1 et #2 est fin (ex: 0.008–0.025) et plus le coup #1 déjoue le 0-ply,
 *   plus le `requiredEr` est bas (Niveau Maître / Grand-Maître : ER 1.8 à 4.5).
 * - Pour un dilemme tactique intermédiaire (ΔEMG 0.045–0.085), `requiredEr` se situe entre 5.0 et 11.5.
 */
export function calibrateQuizRequiredEr(
    moves3Ply: readonly Certified3PlyQuizCandidateMove[],
    is3PlyTrapVs0Ply: boolean,
    legalMovesCount: number,
): number {
    const gap12 = moves3Ply[1]?.equityLoss ?? 0.04;
    const gap13 = moves3Ply[2]?.equityLoss ?? 0.07;
    const baseEr = gap12 * 95 + gap13 * 35;
    const trapBonus = is3PlyTrapVs0Ply ? -1.4 : 0;
    const complexityBonus = legalMovesCount >= 12 ? -0.6 : 0;
    const raw = 2.2 + baseEr + trapBonus + complexityBonus;
    return Number(Math.max(1.2, Math.min(24.0, raw)).toFixed(1));
}

export function runBatchCertification(maxBatchCount: number = 60): Certified3PlyQuizEntry[] {
    fs.mkdirSync(path.dirname(CHECKPOINT_FILE), { recursive: true });
    const existingById = new Map<string, Certified3PlyQuizEntry>();

    if (fs.existsSync(CHECKPOINT_FILE)) {
        const lines = fs.readFileSync(CHECKPOINT_FILE, 'utf8').split(/\r?\n/).filter(Boolean);
        for (const l of lines) {
            try {
                const parsed = JSON.parse(l) as Certified3PlyQuizEntry;
                existingById.set(parsed.id, parsed);
            } catch {
                // ignore malformed checkpoint line
            }
        }
    }

    const candidates = BTCORE_5000_HARVEST_SEEDS.filter((seed) => {
        if (existingById.has(seed.id)) return false;
        if (seed.conceptId === 'race_management' || seed.conceptId === 'bearoff_technique') return false;
        const parts = seed.xgid.split(':');
        if (parts[3] !== '1') return false;
        const state = normalizeBoardForX(seed.xgid);
        if (!isContactPosition(state.board)) return false;
        const pips = pipCount(state.board);
        if (pips.X < 65 || pips.O < 65) return false;
        const legal = generateLegalMoves(state, seed.dice);
        return legal.length >= 4;
    }).slice(0, maxBatchCount);

    if (candidates.length === 0) {
        return Array.from(existingById.values());
    }

    const cmdLines = [
        'set output mwc off',
        'set evaluation chequerplay evaluation plies 3',
        'set evaluation chequerplay evaluation cubeful on',
        'set evaluation movefilter 3 0 0 8 0.16',
        'set evaluation movefilter 3 1 0 8 0.16',
        'set evaluation movefilter 3 2 0 5 0.16',
        'set evaluation cubedecision evaluation plies 3',
    ];
    for (const c of candidates) {
        cmdLines.push(`set xgid ${c.xgid}`);
        cmdLines.push('hint 5');
    }
    cmdLines.push('quit');

    const cmdFile = path.join(path.dirname(CHECKPOINT_FILE), 'batch_50k_gen.cmd');
    fs.writeFileSync(cmdFile, cmdLines.join('\n'), 'ascii');

    const proc = spawnSync(GNUBG_CLI_PATH, ['-t', '-q', '-c', cmdFile], {
        encoding: 'utf8',
        timeout: 120000,
    });
    if (proc.error) throw proc.error;

    const blocks = proc.stdout.split('GNU Backgammon  Position ID:').slice(1);
    const appendStream: string[] = [];

    for (let i = 0; i < candidates.length; i++) {
        const seed = candidates[i]!;
        const moves3Ply = parseGnubgMoves(blocks[i] ?? '');
        if (moves3Ply.length < 4) continue;

        const m1 = moves3Ply[0]!;
        const m2 = moves3Ply[1]!;
        const m3 = moves3Ply[2]!;

        // Rejet strict des évidences (> 0.120 EMG entre #1 et #2) et des égalités parfaites (< 0.004 EMG)
        if (m2.equityLoss > 0.120 || m2.equityLoss < 0.004) continue;

        const state = normalizeBoardForX(seed.xgid);
        const legal = generateLegalMoves(state, seed.dice);
        const eval0Ply = analyzeBoardMoves(state, seed.dice, { ply: 0, maxMoves: 1 });
        const top0PlyNotation = eval0Ply.bestMove?.notation ?? '';
        const is3PlyTrapVs0Ply = top0PlyNotation !== '' && top0PlyNotation !== m1.notation;
        const isFineWindow = m2.equityLoss >= 0.008 && m3.equityLoss <= 0.085;

        if (!is3PlyTrapVs0Ply && !isFineWindow) continue;

        const semantic = resolveSemanticArchetype(state.board, {
            conceptId: seed.conceptId,
            conceptName: seed.conceptName,
            optimalMove: m1.notation,
        });
        if (!semantic.isContact || semantic.archetype === 'PURE_RACE' || semantic.archetype === 'BEAROFF') {
            continue;
        }

        const requiredEr = calibrateQuizRequiredEr(moves3Ply, is3PlyTrapVs0Ply, legal.length);
        const entry: Certified3PlyQuizEntry = {
            id: seed.id,
            xgid: seed.xgid,
            dice: seed.dice,
            requiredEr,
            is3PlyTrapVs0Ply,
            conceptId: semantic.conceptId,
            conceptName: semantic.conceptName,
            optimalMove: m1.notation,
            playedMove: m2.notation,
            equityLoss: m2.equityLoss,
            quizChoices: moves3Ply.slice(0, 4).map((m) => m.notation),
            candidateMoves3Ply: moves3Ply.slice(0, 5),
        };

        existingById.set(entry.id, entry);
        appendStream.push(JSON.stringify(entry));
    }

    if (appendStream.length > 0) {
        fs.appendFileSync(CHECKPOINT_FILE, appendStream.join('\n') + '\n', 'utf8');
    }

    return Array.from(existingById.values());
}

if (process.argv[1] && process.argv[1].endsWith('generate_50k_3ply_quizzes.ts')) {
    const batchSize = Number(process.argv[2] ?? 60);
    const certified = runBatchCertification(batchSize);
    console.log(`[FlashLite-NonTrivial-Quiz-Filter] ${certified.length} quiz 3-ply non-triviaux certifiés dans le checkpoint.`);
}
