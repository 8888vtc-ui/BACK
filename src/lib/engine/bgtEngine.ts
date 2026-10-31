/**
 * @file src/lib/engine/bgtEngine.ts
 * @description BGT (BackgammonTour Open-Source Neural Engine) — Propulsé par GNU Backgammon (`gnubg`).
 *
 * Site officiel & Documentation Open Source : https://backgammontour.com
 * Licence : GPL-3.0-or-later (conforme à GNU Backgammon)
 *
 * Convertit l'évaluation neuronale officielle de GNU Backgammon (`gnubg-cli` & `gnubg.wd`)
 * dans le contrat JSON exact d'Open Sage (`BgsageEvaluateResponse` : `chequerPlay`, `cubeDecision`,
 * probabilités à 6 composantes, plateaux canoniques à 26 entiers et coups légaux).
 */

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    applyMove,
    generateLegalMoves,
    parseXGID,
    serializeCanonicalXGID,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import {
    calculateCubelessEquity,
    type BgsageCubeDecision,
    type BgsageEvaluateResponse,
    type BgsageMove,
    type BgsageProbabilities,
} from './bgsageClient';
import { formatMoveSequenceNotation } from './evaluator';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';

export const BGT_SUPPORTED_MATCH_LENGTHS = [0, 3, 7, 9, 11, 21] as const;
export type BgtSupportedMatchLength = (typeof BGT_SUPPORTED_MATCH_LENGTHS)[number];

export const BGT_ENGINE_METADATA = {
    name: 'BGT (BackgammonTour Open-Source Neural Engine)',
    shortName: 'bgt',
    version: '1.1.0',
    license: 'GPL-3.0-or-later',
    homepage: 'https://backgammontour.com',
    poweredBy: 'GNU Backgammon 1.08.003 (Kazaross-XG2 MET) & BackgammonTour.com',
    supportedMatchLengths: BGT_SUPPORTED_MATCH_LENGTHS,
} as const;

const DEFAULT_WINDOWS_GNUBG_DIR = 'C:\\Program Files (x86)\\gnubg';
const CANDIDATE_CLI_PATHS = [
    process.env.BGT_CLI_PATH,
    path.join(DEFAULT_WINDOWS_GNUBG_DIR, 'gnubg-cli.exe'),
    '/usr/games/gnubg',
    '/usr/bin/gnubg',
    '/opt/homebrew/bin/gnubg',
].filter((p): p is string => Boolean(p && p.trim()));

export interface BgtWeightsInfo {
    available: boolean;
    path: string | null;
    byteLength: number;
    magicHeaderAscii: string;
    homepage: string;
}

/**
 * Résout le chemin de l'exécutable `gnubg-cli` local s'il est installé sur la machine.
 */
export function resolveBgtCliPath(): string | null {
    for (const candidate of CANDIDATE_CLI_PATHS) {
        try {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        } catch {
            // Ignore les chemins inaccessibles
        }
    }
    return null;
}

/**
 * Indique si le moteur neuronal local BGT (`gnubg-cli`) est disponible sur l'hôte.
 */
export function isBgtAvailable(): boolean {
    return resolveBgtCliPath() !== null;
}

/**
 * Inspecte le fichier binaire officiel des poids neuronaux `gnubg.wd` (408 016 octets).
 */
export function inspectBgtWeightsFile(customPath?: string): BgtWeightsInfo {
    const targetPath =
        customPath ??
        process.env.BGT_WEIGHTS_PATH ??
        path.join(DEFAULT_WINDOWS_GNUBG_DIR, 'gnubg.wd');
    try {
        if (!fs.existsSync(targetPath)) {
            return {
                available: false,
                path: null,
                byteLength: 0,
                magicHeaderAscii: '',
                homepage: BGT_ENGINE_METADATA.homepage,
            };
        }
        const stat = fs.statSync(targetPath);
        const fd = fs.openSync(targetPath, 'r');
        const headerBuf = Buffer.alloc(32);
        fs.readSync(fd, headerBuf, 0, 32, 0);
        fs.closeSync(fd);
        return {
            available: stat.size > 100_000,
            path: targetPath,
            byteLength: stat.size,
            magicHeaderAscii: headerBuf.toString('ascii').replace(/[^\x20-\x7E]/g, '').trim(),
            homepage: BGT_ENGINE_METADATA.homepage,
        };
    } catch {
        return {
            available: false,
            path: null,
            byteLength: 0,
            magicHeaderAscii: '',
            homepage: BGT_ENGINE_METADATA.homepage,
        };
    }
}

/**
 * Convertit un plateau projet (`board[0..25]`) dans le format 26 entiers attendu par `bgsageMoveBoardToProjectBoard`.
 */
export function projectBoardToBgtWireBoard(projectBoard: ReadonlyArray<number>, player: Player): number[] {
    const wire = new Array<number>(26).fill(0);
    if (player === 'X') {
        wire[0] = Math.abs(projectBoard[25] ?? 0);
        wire[25] = Math.abs(projectBoard[0] ?? 0);
        for (let p = 1; p <= 24; p++) {
            const v = projectBoard[p] ?? 0;
            wire[p] = v === 0 ? 0 : v;
        }
    } else {
        wire[0] = Math.abs(projectBoard[0] ?? 0);
        wire[25] = Math.abs(projectBoard[25] ?? 0);
        for (let p = 1; p <= 24; p++) {
            const v = -(projectBoard[25 - p] ?? 0);
            wire[p] = v === 0 ? 0 : v;
        }
    }
    return wire;
}

function normalizeBgtNotation(notation: string): string {
    return notation
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .sort()
        .join(' ');
}

function expandChainedGnubgNotation(notation: string): string {
    const clean = notation.replace(/\*/g, '').trim();
    const expandedTokens: string[] = [];
    for (const rawTok of clean.split(/\s+/)) {
        const repeatMatch = rawTok.match(/^(.+?)\((\d+)\)$/);
        const baseTok = repeatMatch ? repeatMatch[1] : rawTok;
        const count = repeatMatch ? Number(repeatMatch[2]) : 1;

        const parts = baseTok.split('/');
        const steps: string[] = [];
        if (parts.length > 2) {
            for (let k = 0; k < parts.length - 1; k++) {
                steps.push(`${parts[k]}/${parts[k + 1]}`);
            }
        } else {
            steps.push(baseTok);
        }
        for (let c = 0; c < count; c++) {
            expandedTokens.push(...steps);
        }
    }
    return expandedTokens.join(' ');
}

function matchGnubgNotationToLegalSequence(
    gnubgNotation: string,
    legalSeqs: ReadonlyArray<MoveSequence>,
    boardBefore: ReadonlyArray<number>,
    player: Player,
): MoveSequence | undefined {
    const normTarget = normalizeBgtNotation(gnubgNotation);
    const direct = legalSeqs.find(
        (seq) => normalizeBgtNotation(formatMoveSequenceNotation(seq.moves, player)) === normTarget,
    );
    if (direct) return direct;

    const expanded = expandChainedGnubgNotation(gnubgNotation);
    const parsedMoves = parseCoachNotationMoves(expanded, player);
    if (parsedMoves.length > 0) {
        let sim = [...boardBefore];
        for (const m of parsedMoves) {
            sim = applyMove(sim, m, player);
        }
        const sigTarget = sim.slice(0, 26).join(',');
        const byBoard = legalSeqs.find((seq) => seq.board.slice(0, 26).join(',') === sigTarget);
        if (byBoard) return byBoard;

        const sigPoints = sim.slice(1, 25).join(',');
        const byPoints = legalSeqs.find((seq) => seq.board.slice(1, 25).join(',') === sigPoints);
        if (byPoints) return byPoints;
    }

    return undefined;
}

function parseFloatLocale(val: string): number {
    const n = parseFloat(val.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

/**
 * Parse la sortie texte de `gnubg-cli` (coups de pions + analyse du videau)
 * en une réponse `BgsageEvaluateResponse` 100 % conforme.
 */
export function parseBgtGnubgOutput(
    stdout: string,
    state: BoardState,
): BgsageEvaluateResponse {
    const player = state.turn;
    const legalSeqs = state.dice ? generateLegalMoves(state, state.dice) : [];

    const moveRegex =
        /^\s*(\d+)\.\s+Cubeful\s+(\d+)-ply\s+(.+?)\s+Eq\.:\s*([+-]?\d+[.,]\d+)(?:\s*\(([+-]?\d+[.,]\d+)\))?\r?\n\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)\s*-\s*(\d+[.,]\d+)\s+(\d+[.,]\d+)\s+(\d+[.,]\d+)/gm;

    const chequerPlay: BgsageMove[] = [];
    let match: RegExpExecArray | null;
    while ((match = moveRegex.exec(stdout)) !== null) {
        const rank = Number(match[1]);
        const gnubgPly = Number(match[2]);
        const notation = match[3].trim();
        const equity = parseFloatLocale(match[4]);
        const diffRaw = match[5] ? Math.abs(parseFloatLocale(match[5])) : 0;

        const probabilities: BgsageProbabilities = {
            win: parseFloatLocale(match[6]),
            winGammon: parseFloatLocale(match[7]),
            winBackgammon: parseFloatLocale(match[8]),
            loseWin: parseFloatLocale(match[9]),
            loseGammon: parseFloatLocale(match[10]),
            loseBackgammon: parseFloatLocale(match[11]),
        };

        const matchedSeq = matchGnubgNotationToLegalSequence(
            notation,
            legalSeqs,
            state.board,
            player,
        );

        chequerPlay.push({
            rank,
            notation,
            equity,
            equityLoss: rank === 1 ? 0 : diffRaw,
            probabilities,
            cubelessEquity: calculateCubelessEquity(probabilities),
            board: matchedSeq ? projectBoardToBgtWireBoard(matchedSeq.board, player) : null,
            moves: matchedSeq ? matchedSeq.moves : null,
            evalLevel: `bgt-gnubg-${gnubgPly + 1}ply`,
        });
    }

    // Parsing de la décision de videau (Cube analysis : Money Game & Match 3, 7, 9, 11, 21)
    const noDoubleMatch = stdout.match(/No double\s+([+-]?\d+[.,]\d+)/i) ?? stdout.match(/No redouble\s+([+-]?\d+[.,]\d+)/i);
    const doublePassMatch = stdout.match(/(?:Double|Redouble),\s*pass\s+([+-]?\d+[.,]\d+)/i);
    const doubleTakeMatch = stdout.match(/(?:Double|Redouble),\s*take\s+([+-]?\d+[.,]\d+)/i);
    const properActionMatch = stdout.match(/Proper cube action:\s*(.+)/i);

    const noDouble = noDoubleMatch ? parseFloatLocale(noDoubleMatch[1]) : 0;
    const doublePass = doublePassMatch ? parseFloatLocale(doublePassMatch[1]) : 1;
    const doubleTake = doubleTakeMatch ? parseFloatLocale(doubleTakeMatch[1]) : 0;
    const rawProper = properActionMatch ? properActionMatch[1].trim().toLowerCase() : '';

    const matchLen = state.matchLength ?? 0;
    const turnScore = state.turn === 'X' ? state.scoreX : state.scoreO;
    const isPlayerAlreadyAtMatchMinusOne = matchLen > 0 && turnScore >= matchLen - 1;
    const isCubeDeadByValue = matchLen > 0 && turnScore + state.cubeValue >= matchLen;
    const isOpponentOwnedCube = state.cubeOwner !== null && state.cubeOwner !== state.turn;

    let optimalAction = 'NO_DOUBLE';
    if (isOpponentOwnedCube || state.crawford || isPlayerAlreadyAtMatchMinusOne || isCubeDeadByValue) {
        optimalAction = 'NO_DECISION';
    } else if (rawProper.startsWith('too good to double') || rawProper.startsWith('too good to redouble')) {
        optimalAction = rawProper.includes('pass') ? 'TOO_GOOD_PASS' : 'TOO_GOOD_TAKE';
    } else if (rawProper.startsWith('double, pass') || rawProper.startsWith('redouble, pass')) {
        optimalAction = 'DOUBLE_PASS';
    } else if (
        rawProper.startsWith('double, take') ||
        rawProper.startsWith('redouble, take') ||
        rawProper.startsWith('optional double') ||
        rawProper.startsWith('optional redouble') ||
        rawProper.startsWith('double, beaver')
    ) {
        optimalAction = 'DOUBLE_TAKE';
    }

    const cubeDecision: BgsageCubeDecision = {
        noDouble,
        doubleTake,
        doublePass,
        optimalAction,
    };

    return {
        chequerPlay,
        cubeDecision,
        source: 'bgt-gnubg',
    };
}

/**
 * Évalue une position XGID via le moteur neuronal local BGT (`gnubg-cli`)
 * en Money Game (`matchLength = 0`) ou en Match (`3, 7, 9, 11, 21` points avec Kazaross-XG2).
 */
export function evaluateWithBgtSync(
    xgid: string,
    ply: number = 2,
    timeoutMs: number = 5000,
): BgsageEvaluateResponse | null {
    const cliPath = resolveBgtCliPath();
    if (!cliPath) return null;

    let state: BoardState;
    let canonicalXgid: string;
    try {
        state = parseXGID(xgid);
        canonicalXgid = serializeCanonicalXGID(state);
    } catch {
        return null;
    }

    const gnubgPlies = Math.max(0, Math.min(3, (ply ?? 2) - 1));
    const cubeState: BoardState = { ...state, dice: null };
    const cubeXgid = serializeCanonicalXGID(cubeState);

    const commands = [
        'set player 0 human',
        'set player 1 human',
        `set evaluation chequerplay evaluation plies ${gnubgPlies}`,
        `set evaluation cubedecision evaluation plies ${gnubgPlies}`,
        'new game',
        `set xgid ${cubeXgid}`,
        'hint',
    ];

    if (state.dice) {
        commands.push(`set xgid ${canonicalXgid}`);
        commands.push('hint 16');
    }
    commands.push('quit');

    try {
        const res = spawnSync(cliPath, ['-q', '-t'], {
            input: `${commands.join('\n')}\n`,
            encoding: 'utf-8',
            timeout: timeoutMs,
            maxBuffer: 8 * 1024 * 1024,
        });
        if (res.error || !res.stdout) return null;
        const parsed = parseBgtGnubgOutput(res.stdout, state);
        if (state.dice && parsed.chequerPlay.length === 0) return null;
        return parsed;
    } catch {
        return null;
    }
}

