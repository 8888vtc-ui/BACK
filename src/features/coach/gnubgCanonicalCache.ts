/**
 * Couche 3 d'Éradication de l'Indice Idiot Serveur :
 * Cache Canonique Partagé (Supabase / Local) Indexé par GNUBG Position ID (14 caractères Base64)
 * et Normalisation Stratégique du Match en 7 Régimes Canoniques.
 *
 * Rôle :
 *   1. Encode n'importe quel tablier en `Position ID` officiel GNU Backgammon (80 bits / 10 octets -> 14 caractères Base64).
 *      La position initiale produit toujours `4HPwATDgc/ABMA`.
 *   2. Normalise le score du match autour des 7 régimes stratégiques canoniques (`NORMAL`, `CRAWFORD`,
 *      `POST_CRAWFORD`, `DMP`, `GAMMON_GO`, `GAMMON_SAVE`, `BEAROFF_RACE`) afin qu'une position identique
 *      à 0-0 en 7 pts et à 0-0 en 11 pts partage la même entrée de cache Supabase.
 *   3. Encadre les questions au Coach IA par des boutons d'intention structurés (zéro prompt libre,
 *      zéro injection LLM, 100 % des réponses indexables en cache).
 *
 * Règles :
 *   - Module pur et déterministe (0 `any`, < 300 lignes).
 */

import type { Player } from '../../engine/backgammonEngine';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Les 7 régimes stratégiques canoniques de score au Backgammon. */
export type StrategicScoreRegime =
    | 'NORMAL'
    | 'CRAWFORD'
    | 'POST_CRAWFORD'
    | 'DMP'
    | 'GAMMON_GO'
    | 'GAMMON_SAVE'
    | 'BEAROFF_RACE';

/** Intentions structurées autorisées vers le Coach IA (remplace tout champ texte libre). */
export type CoachStructuredIntentId =
    | 'WHY_MISTAKE'
    | 'NEXT_TURN_PLAN'
    | 'WHY_DOUBLE'
    | 'SWAP_DICE_VERDICT';

export interface CoachStructuredIntentSpec {
    readonly id: CoachStructuredIntentId;
    readonly labelFr: string;
    readonly labelEn: string;
    readonly maxInputTokens: number;
    readonly maxOutputTokens: number;
}

export const COACH_STRUCTURED_INTENTS: ReadonlyArray<CoachStructuredIntentSpec> = [
    {
        id: 'WHY_MISTAKE',
        labelFr: 'Pourquoi mon coup est-il une erreur ?',
        labelEn: 'Why is my move a mistake?',
        maxInputTokens: 600,
        maxOutputTokens: 250,
    },
    {
        id: 'NEXT_TURN_PLAN',
        labelFr: 'Quel est le plan au tour suivant ?',
        labelEn: 'What is the plan for the next turn?',
        maxInputTokens: 600,
        maxOutputTokens: 250,
    },
    {
        id: 'WHY_DOUBLE',
        labelFr: 'Pourquoi fallait-il doubler ou passer ?',
        labelEn: 'Why was it a double or pass?',
        maxInputTokens: 600,
        maxOutputTokens: 250,
    },
    {
        id: 'SWAP_DICE_VERDICT',
        labelFr: 'Que se passe-t-il en inversant les dés (Swap Dice) ?',
        labelEn: 'What happens if we swap the dice?',
        maxInputTokens: 600,
        maxOutputTokens: 250,
    },
];

/**
 * Vérifie qu'une intention demandée au Coach IA fait partie de la liste blanche structurée
 * (interdit tout prompt libre / injection LLM).
 */
export function isValidStructuredCoachIntent(intent: string): intent is CoachStructuredIntentId {
    return COACH_STRUCTURED_INTENTS.some((item) => item.id === intent);
}

/**
 * Encode les 10 octets (80 bits) en chaîne Base64 de 14 caractères sans padding `=`,
 * conformément au standard GNU Backgammon Position ID.
 */
function encodeTenBytesToBase64PositionId(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < 9; i += 3) {
        const b0 = bytes[i];
        const b1 = bytes[i + 1];
        const b2 = bytes[i + 2];
        out += BASE64_CHARS[(b0 >> 2) & 0x3f];
        out += BASE64_CHARS[((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f)];
        out += BASE64_CHARS[((b1 & 0x0f) << 2) | ((b2 >> 6) & 0x03)];
        out += BASE64_CHARS[b2 & 0x3f];
    }
    // Dernier octet (octet 9 -> 2 caractères Base64)
    const last = bytes[9];
    out += BASE64_CHARS[(last >> 2) & 0x3f];
    out += BASE64_CHARS[(last & 0x03) << 4];
    return out;
}

/**
 * Calcule le nombre de pions d'un joueur sur son point relatif `1..24` et sa barre `25`.
 * Convention du moteur :
 *   - `board[1..24]` > 0 : pions X ; < 0 : pions O
 *   - `board[0]` : barre de X ; `board[25]` : barre de O (négatif ou positif)
 *   - Pour X (qui sort vers 0), son point 1 est `board[1]`, son point 24 est `board[24]`.
 *   - Pour O (qui sort vers 25), son point 1 est `board[24]`, son point 24 est `board[1]`.
 */
function getPlayerCheckerCountsRel1To25(board: ReadonlyArray<number>, player: Player): number[] {
    const counts = new Array<number>(25).fill(0);
    if (player === 'X') {
        for (let pt = 1; pt <= 24; pt++) {
            const val = board[pt] ?? 0;
            counts[pt - 1] = val > 0 ? val : 0;
        }
        counts[24] = Math.max(0, board[0] ?? 0);
    } else {
        for (let pt = 1; pt <= 24; pt++) {
            const absIdx = 25 - pt;
            const val = board[absIdx] ?? 0;
            counts[pt - 1] = val < 0 ? Math.abs(val) : 0;
        }
        counts[24] = Math.abs(board[25] ?? 0);
    }
    return counts;
}

/**
 * Encode un état de plateau en `Position ID` officiel GNU Backgammon (14 caractères Base64, 80 bits).
 * Pour la position initiale standard, retourne exactement `'4HPwATDgc/ABMA'`.
 */
export function encodeGnubgPositionId(
    board: ReadonlyArray<number>,
    turn: Player = 'X',
): string {
    const opponent: Player = turn === 'X' ? 'O' : 'X';
    const playerOnRollCounts = getPlayerCheckerCountsRel1To25(board, turn);
    const opponentCounts = getPlayerCheckerCountsRel1To25(board, opponent);

    const bytes = new Uint8Array(10);
    let bitIndex = 0;

    const appendBit = (bit: 0 | 1) => {
        if (bitIndex >= 80) return;
        if (bit === 1) {
            const byteIdx = bitIndex >> 3;
            const bitOffset = bitIndex & 7; // LSB-first conformément à GNUBG
            bytes[byteIdx] |= 1 << bitOffset;
        }
        bitIndex += 1;
    };

    for (const group of [opponentCounts, playerOnRollCounts]) {
        for (let i = 0; i < 25; i++) {
            const checkers = group[i];
            for (let c = 0; c < checkers; c++) {
                appendBit(1);
            }
            appendBit(0);
        }
    }

    return encodeTenBytesToBase64PositionId(bytes);
}

/**
 * Détecte si les deux camps n'ont plus aucun contact (course pure / bear-off).
 */
export function isPureBearoffOrRace(board: ReadonlyArray<number>): boolean {
    if ((board[0] ?? 0) > 0 || Math.abs(board[25] ?? 0) > 0) return false;
    let highestX = 0;
    let lowestO = 25;
    for (let pt = 1; pt <= 24; pt++) {
        const v = board[pt] ?? 0;
        if (v > 0 && pt > highestX) highestX = pt;
        if (v < 0 && pt < lowestO) lowestO = pt;
    }
    return highestX < lowestO;
}

export interface ScoreRegimeParams {
    readonly board?: ReadonlyArray<number> | null;
    readonly matchLength?: number;
    readonly scorePlayer?: number;
    readonly scoreOpponent?: number;
    readonly cubeValue?: number;
    readonly crawford?: boolean;
}

/**
 * Classifie le contexte de match dans l'un des 7 régimes stratégiques canoniques
 * pour maximiser le taux de hit du cache Supabase sans perdre la justesse stratégique.
 */
export function classifyStrategicScoreRegime(params: ScoreRegimeParams): StrategicScoreRegime {
    if (params.board && params.board.length >= 26 && isPureBearoffOrRace(params.board)) {
        return 'BEAROFF_RACE';
    }

    const matchLength = params.matchLength ?? 0;
    if (matchLength <= 0) {
        return 'NORMAL';
    }

    const awayPlayer = Math.max(1, matchLength - (params.scorePlayer ?? 0));
    const awayOpponent = Math.max(1, matchLength - (params.scoreOpponent ?? 0));
    const cube = Math.max(1, params.cubeValue ?? 1);

    if (awayPlayer === 1 && awayOpponent === 1) {
        return 'DMP';
    }
    if (params.crawford) {
        return 'CRAWFORD';
    }
    if (awayPlayer === 1 || awayOpponent === 1) {
        return 'POST_CRAWFORD';
    }

    // Si un gammon au cube actuel donne le match au joueur alors qu'un gain simple ne suffit pas
    if (awayPlayer <= cube * 2 && awayPlayer > cube && awayOpponent >= 3) {
        return 'GAMMON_GO';
    }
    // Si un gammon adverse au cube actuel fait perdre le match
    if (awayOpponent <= cube * 2 && awayOpponent > cube && awayPlayer >= 3) {
        return 'GAMMON_SAVE';
    }

    return 'NORMAL';
}

export interface CanonicalGnubgCacheKeyParams {
    readonly board: ReadonlyArray<number>;
    readonly turn?: Player;
    readonly dice?: readonly [number, number] | null;
    readonly cubeValue?: number;
    readonly cubeOwner?: Player | null;
    readonly matchLength?: number;
    readonly scorePlayer?: number;
    readonly scoreOpponent?: number;
    readonly crawford?: boolean;
    readonly movePlayed: string;
    readonly bestMove?: string;
    readonly intent?: CoachStructuredIntentId;
}

/**
 * Construit la clé primaire canonique Supabase (`PositionID + Regime + Cube + Dice + MovePlayed + BestMove + Intent`).
 */
export function buildCanonicalGnubgCacheKey(params: CanonicalGnubgCacheKeyParams): string {
    const turn = params.turn ?? 'X';
    const positionId = encodeGnubgPositionId(params.board, turn);
    const regime = classifyStrategicScoreRegime({
        board: params.board,
        matchLength: params.matchLength,
        scorePlayer: params.scorePlayer,
        scoreOpponent: params.scoreOpponent,
        cubeValue: params.cubeValue,
        crawford: params.crawford,
    });

    const sortedDice = params.dice
        ? [params.dice[0], params.dice[1]].sort((a, b) => b - a).join('-')
        : 'cube';
    const cubeState = `${Math.max(1, params.cubeValue ?? 1)}_${params.cubeOwner ?? 'center'}`;
    const played = params.movePlayed.trim();
    const best = (params.bestMove ?? '').trim();
    const intent = params.intent ?? 'WHY_MISTAKE';

    return `gnubg::${positionId}::${regime}::c[${cubeState}]::d[${sortedDice}]::mv[${played}]::opt[${best}]::i[${intent}]`;
}
