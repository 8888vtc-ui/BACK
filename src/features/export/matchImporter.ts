/**
 * Parseur et importateur universel de matchs et positions (.mat, .sgf, XGID).
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any, fonctions pures).
 */

import {
    createInitialState,
    applyMove,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
    type BoardState,
    type Move,
    type Player,
} from '../../engine/backgammonEngine';
import { parseXGID, isValidXGID } from '../../lib/engine/xgid';
import { parseMAT } from './matSerializer';
import { parseSGF } from './sgfSerializer';
import type { MatchLogEntry } from '../../actions/types';
import type { ParsedSGFData } from './types';

export interface ImportedXGIDResult {
    readonly type: 'xgid';
    readonly state: BoardState;
    readonly rawXgid: string;
}

export interface ImportedMatchResult {
    readonly type: 'mat' | 'sgf';
    readonly playerX: string;
    readonly playerO: string;
    readonly matchLength: number;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly winner?: Player | null;
    readonly pointsWon?: number;
    readonly result?: string;
    readonly turns: ReadonlyArray<MatchLogEntry>;
    readonly initialBoard: ReadonlyArray<number>;
    readonly finalBoard: ReadonlyArray<number>;
}

export type ImportResult = ImportedXGIDResult | ImportedMatchResult;

/**
 * Détecte si un token représente une absence de mouvement légal ou une passe.
 */
function isPassNotation(token: string): boolean {
    const lower = token.trim().toLowerCase();
    return (
        lower === 'cannot move' ||
        lower === "can't move" ||
        lower === 'pass' ||
        lower === 'double' ||
        lower === 'take' ||
        lower === 'drop' ||
        lower === 'no play'
    );
}

/**
 * Décompose un jeton unitaire (ex: "8/5", "13/7*", "bar/20", "6/off") en Move.
 * La numérotation de la notation est relative au joueur actif (1 = home board, 24 = fond adverse).
 */
export function parseSingleMoveToken(token: string, player: Player): Move | null {
    const cleaned = token.replace(/\*+$/, '').trim();
    const parts = cleaned.split('/');
    if (parts.length !== 2) return null;

    const fromRaw = parts[0].toLowerCase();
    const toRaw = parts[1].toLowerCase();

    let from: number;
    if (fromRaw === 'bar' || fromRaw === '25') {
        from = player === 'X' ? X_BAR : O_BAR;
    } else {
        const val = parseInt(fromRaw, 10);
        if (isNaN(val) || val < 1 || val > 24) return null;
        from = player === 'X' ? val : 25 - val;
    }

    let to: number;
    if (toRaw === 'off' || toRaw === '0') {
        to = player === 'X' ? X_OFF : O_OFF;
    } else {
        const val = parseInt(toRaw, 10);
        if (isNaN(val) || val < 1 || val > 24) return null;
        to = player === 'X' ? val : 25 - val;
    }

    return { from, to };
}

/**
 * Décompose une sous-expression pouvant comporter une répétition (ex: "13/10(2)")
 * ou un déplacement composé (ex: "24/18/13").
 */
export function expandMoveExpression(expr: string, player: Player): Move[] {
    const trimmed = expr.trim();
    if (!trimmed || isPassNotation(trimmed)) return [];

    // Cas 1 : Répétition avec parenthèses (ex: "8/5(2)" ou "6/off(3)")
    const repeatMatch = trimmed.match(/^([^(]+)\((\d+)\)$/);
    if (repeatMatch) {
        const subExpr = repeatMatch[1];
        const count = parseInt(repeatMatch[2], 10);
        const single = parseSingleMoveToken(subExpr, player);
        if (!single) return [];
        return Array.from({ length: Math.max(1, count) }, () => ({ ...single }));
    }

    // Cas 2 : Déplacement composé (ex: "24/18/13")
    const segments = trimmed.replace(/\*+$/, '').split('/');
    if (segments.length > 2) {
        const moves: Move[] = [];
        for (let i = 0; i < segments.length - 1; i++) {
            const pair = `${segments[i]}/${segments[i + 1]}`;
            const m = parseSingleMoveToken(pair, player);
            if (m) moves.push(m);
        }
        return moves;
    }

    // Cas 3 : Mouvement simple
    const single = parseSingleMoveToken(trimmed, player);
    return single ? [single] : [];
}

/**
 * Parse une chaîne de notation complète d'un tour (ex: "8/5 6/5", "13/10(2) 8/5(2)", "24/13")
 * et retourne le tableau exhaustif des Move correspondants.
 */
export function parseNotationToMoves(notation: string, player: Player): Move[] {
    if (!notation || isPassNotation(notation)) return [];

    const tokens = notation.split(/\s+/).filter(Boolean);
    const moves: Move[] = [];

    for (const token of tokens) {
        const expanded = expandMoveExpression(token, player);
        moves.push(...expanded);
    }

    return moves;
}

/**
 * Reconstruit la liste séquentielle des MatchLogEntry depuis les coups parsés.
 * Simule le plateau à chaque tour pour garantir l'intégrité de boardBefore et boardAfter.
 */
export function reconstructMatchLog(
    parsedData: ParsedSGFData,
    initialBoard?: number[],
): { turns: MatchLogEntry[]; finalBoard: number[] } {
    const startBoard = initialBoard ? initialBoard.slice() : createInitialState(parsedData.matchLength).board;
    let currentBoard = startBoard.slice();
    const turns: MatchLogEntry[] = [];

    for (let i = 0; i < parsedData.moves.length; i++) {
        const m = parsedData.moves[i];
        const boardBefore = Object.freeze(currentBoard.slice());
        const moves = parseNotationToMoves(m.notation, m.player);

        // Applique les coups séquentiellement
        for (const move of moves) {
            currentBoard = applyMove(currentBoard, move, m.player);
        }

        const boardAfter = Object.freeze(currentBoard.slice());

        const entry: MatchLogEntry = Object.freeze({
            turnIndex: i + 1,
            player: m.player,
            dice: [m.dice[0], m.dice[1]] as const,
            boardBefore,
            movePlayed: Object.freeze(moves),
            boardAfter,
            notation: m.notation || 'Cannot Move',
            timestamp: Date.now() + i * 1000,
        });

        turns.push(entry);
    }

    return {
        turns,
        finalBoard: currentBoard,
    };
}

/**
 * Importe un fichier texte .mat (JellyFish / Galaxy / GNUbg) et reconstruit
 * les métadonnées et la log complète du match.
 */
export function importMAT(matContent: string): ImportedMatchResult {
    const parsed = parseMAT(matContent);
    const { turns, finalBoard } = reconstructMatchLog(parsed);
    const initialBoard = Object.freeze(createInitialState(parsed.matchLength).board);

    return {
        type: 'mat',
        playerX: parsed.playerX,
        playerO: parsed.playerO,
        matchLength: parsed.matchLength,
        scoreX: parsed.scoreX,
        scoreO: parsed.scoreO,
        winner: parsed.winner,
        pointsWon: parsed.pointsWon,
        result: parsed.result,
        turns: Object.freeze(turns),
        initialBoard,
        finalBoard: Object.freeze(finalBoard),
    };
}

/**
 * Importe un fichier SGF et reconstruit la log de match.
 */
export function importSGF(sgfContent: string): ImportedMatchResult {
    const parsed = parseSGF(sgfContent);
    const { turns, finalBoard } = reconstructMatchLog(parsed);
    const initialBoard = Object.freeze(createInitialState(parsed.matchLength).board);

    return {
        type: 'sgf',
        playerX: parsed.playerX,
        playerO: parsed.playerO,
        matchLength: parsed.matchLength,
        scoreX: parsed.scoreX,
        scoreO: parsed.scoreO,
        winner: parsed.winner,
        pointsWon: parsed.pointsWon,
        result: parsed.result,
        turns: Object.freeze(turns),
        initialBoard,
        finalBoard: Object.freeze(finalBoard),
    };
}

/**
 * Importe une chaîne XGID (position unique).
 */
export function importXGID(xgidString: string): ImportedXGIDResult {
    const state = parseXGID(xgidString);
    return {
        type: 'xgid',
        state,
        rawXgid: xgidString.trim(),
    };
}

/**
 * Détecte et importe automatiquement tout contenu universel :
 * - Chaîne XGID
 * - Fichier .mat (JellyFish / Galaxy)
 * - Fichier SGF
 */
export function importMatchOrPosition(rawContent: string): ImportResult {
    const trimmed = rawContent.trim();
    if (!trimmed) {
        throw new Error('Contenu vide : impossible d’importer.');
    }

    // 1. Détection XGID
    if (trimmed.startsWith('XGID=') || isValidXGID(trimmed)) {
        return importXGID(trimmed);
    }

    // 2. Détection SGF
    if (trimmed.startsWith('(') || trimmed.includes('GM[6]')) {
        return importSGF(trimmed);
    }

    // 3. Détection .mat (JellyFish)
    if (
        /^\s*\d+\s+point\s+match/i.test(trimmed) ||
        /Game\s+\d+/i.test(trimmed) ||
        /^\s*\d+\)\s*\d{2}:/m.test(trimmed)
    ) {
        return importMAT(trimmed);
    }

    // Tentative de parsing XGID en dernier recours si cela ressemble à un corps XGID
    if (trimmed.length > 20 && isValidXGID(`XGID=${trimmed}`)) {
        return importXGID(trimmed);
    }

    throw new Error('Format non reconnu : veuillez coller une chaîne XGID ou un fichier .mat valide.');
}
