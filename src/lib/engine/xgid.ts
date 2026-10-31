/**
 * Module d'import et export au format XGID (eXtreme Gammon / GNU Backgammon standard).
 * Respecte strictement SCALABILITY.md (< 400 lignes, 0 any).
 */

import {
    serializeXGID as engineSerializeXGID,
    serializeCanonicalXGID as engineSerializeCanonicalXGID,
    parseXGID as engineParseXGID,
    type BoardState,
} from '../../engine/backgammonEngine';

/**
 * Sérialise un état de plateau en chaîne XGID standard.
 */
export function serializeXGID(state: BoardState): string {
    return engineSerializeXGID(state);
}

/**
 * Sérialise un état de plateau en chaîne XGID canonique eXtreme Gammon (10 champs).
 */
export function serializeCanonicalXGID(state: BoardState): string {
    return engineSerializeCanonicalXGID(state);
}

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function tryParseGnuidPositionId(rawInput: string): BoardState | null {
    const clean = rawInput.replace(/^GNUID=/i, '').trim();
    const posPart = clean.split(':')[0]?.trim() ?? '';
    if (!/^[A-Za-z0-9+/]{14}$/.test(posPart)) return null;

    const bytes = new Uint8Array(10);
    let bitBuf = 0;
    let bitCount = 0;
    let byteIdx = 0;
    for (let i = 0; i < 14; i++) {
        const val = B64_ALPHABET.indexOf(posPart[i]!);
        if (val < 0) return null;
        bitBuf = (bitBuf << 6) | val;
        bitCount += 6;
        if (bitCount >= 8 && byteIdx < 10) {
            bitCount -= 8;
            bytes[byteIdx++] = (bitBuf >> bitCount) & 0xff;
        }
    }

    const counts = new Int32Array(50);
    let ptIdx = 0;
    let currentRun = 0;
    for (let b = 0; b < 10 && ptIdx < 50; b++) {
        const byte = bytes[b]!;
        for (let bit = 0; bit < 8 && ptIdx < 50; bit++) {
            if ((byte >> bit) & 1) {
                currentRun++;
            } else {
                counts[ptIdx++] = currentRun;
                currentRun = 0;
            }
        }
    }

    const board = new Array<number>(26).fill(0);
    let totalX = 0;
    let totalO = 0;
    // Points 0..23 de O (1..24 sur notre plateau) + 24 = barre O (board[25])
    for (let i = 0; i < 24; i++) {
        const c = counts[i] ?? 0;
        if (c > 0) {
            board[i + 1] = -c;
            totalO += c;
        }
    }
    if ((counts[24] ?? 0) > 0) {
        board[25] = -(counts[24] ?? 0);
        totalO += counts[24] ?? 0;
    }
    // Points 25..48 de X (24..1 sur notre plateau) + 49 = barre X (board[0])
    for (let i = 0; i < 24; i++) {
        const c = counts[25 + i] ?? 0;
        const pt = 24 - i;
        if (c > 0) {
            if (board[pt] !== 0) return null;
            board[pt] = c;
            totalX += c;
        }
    }
    if ((counts[49] ?? 0) > 0) {
        board[0] = counts[49] ?? 0;
        totalX += counts[49] ?? 0;
    }
    if (totalX > 15 || totalO > 15 || (totalX === 0 && totalO === 0)) return null;

    return {
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: [3, 1],
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

/**
 * Parse une chaîne XGID (avec ou sans préfixe 'XGID=') ou un GNUID (14 car. Base64 GNU Backgammon) en BoardState valide.
 * Lève une erreur explicite si le format est corrompu ou incomplet.
 */
export function parseXGID(xgidString: string): BoardState {
    const trimmed = xgidString.trim();
    if (!trimmed) {
        throw new Error('Chaîne XGID vide.');
    }
    if (!trimmed.startsWith('XGID=')) {
        const gnuidState = tryParseGnuidPositionId(trimmed);
        if (gnuidState) return gnuidState;
    }
    const normalized = trimmed.startsWith('XGID=') ? trimmed : `XGID=${trimmed}`;
    return engineParseXGID(normalized);
}

/**
 * Vérifie si une chaîne donnée représente un XGID syntaxiquement valide.
 */
export function isValidXGID(xgidString: string): boolean {
    if (!xgidString || typeof xgidString !== 'string') return false;
    try {
        parseXGID(xgidString);
        return true;
    } catch {
        return false;
    }
}

export const serializeToXGID = serializeXGID;
