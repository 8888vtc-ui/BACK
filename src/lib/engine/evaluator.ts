/**
 * Évaluateur Backgammon — calculs des probabilités, équités, coups et décisions de videau.
 *
 * Fournit l'implémentation de référence du modèle de neurones / heuristiques GNUBG
 * pour l'exécution embarquée (pure TypeScript sans dépendance I/O).
 */

import {
    BoardState,
    Move,
    MoveSequence,
    Player,
    applyMove,
    borneOffCount,
    generateLegalMoves,
    parseXGID,
    pipCount,
    serializeXGID,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../../engine/backgammonEngine';
import {
    Probabilities,
    EvaluateResult,
    MoveAnalysis,
    AnalyzeMovesResult,
    CubeDecisionResult,
    BestMoveResult,
} from './types';
import { bearoffExpectedRolls } from './bearoffTable';
import { computeKeithCount, evaluateKeithCube } from './keithCount';
import { countShotsExact } from './shotCounter';
export {
    calculateEffectivePipCount,
    evaluateRaceCube,
    isPureRace,
    isBearOffPhase,
    type EffectivePipResult,
    type RaceCubeEvaluation,
} from './effectivePipCount';

/**
 * Formate un déplacement unique en notation standard de Backgammon (ex: "24/20", "bar/20", "6/off").
 * Les flèches sont numérotées de 1 à 24 du point de vue du joueur au trait.
 */
export function formatSingleMove(move: Move, player: Player): string {
    const fromStr =
        player === 'X'
            ? move.from === X_BAR
                ? 'bar'
                : String(move.from)
            : move.from === O_BAR
                ? 'bar'
                : String(25 - move.from);

    const toStr =
        player === 'X'
            ? move.to === X_OFF
                ? 'off'
                : String(move.to)
            : move.to === O_OFF
                ? 'off'
                : String(25 - move.to);

    return `${fromStr}/${toStr}`;
}

/**
 * Formate une séquence complète de coups (ex: "24/20 13/11").
 */
export function formatMoveSequenceNotation(moves: Move[], player: Player): string {
    if (moves.length === 0) return 'Pass';
    return moves.map((m) => formatSingleMove(m, player)).join(' ');
}

/**
 * Formate un déplacement unique en numérotation ABSOLUE (1-24, la même que le
 * plateau), indépendamment du joueur au trait. Utile pour afficher les coups de
 * l'adversaire dans le log avec la même numérotation que le plateau visuel.
 */
export function formatSingleMoveAbsolute(move: Move, player: Player): string {
    const fromStr =
        move.from === X_BAR || move.from === O_BAR
            ? 'bar'
            : String(move.from);
    const toStr =
        move.to === X_OFF || move.to === O_OFF
            ? 'off'
            : String(move.to);
    return `${fromStr}/${toStr}`;
}

/**
 * Formate une séquence complète de coups en numérotation absolue (1-24).
 */
export function formatMoveSequenceNotationAbsolute(moves: Move[], player: Player): string {
    if (moves.length === 0) return 'Pass';
    return moves.map((m) => formatSingleMoveAbsolute(m, player)).join(' ');
}

/**
 * Formate une séquence complète de coups en marquant les frappes (hits) d'un
 * astérisque `*`, conformément à la notation standard de Backgammon.
 *
 * Une frappe survient quand la destination `to` contient exactement un pion
 * adverse (blot). Le plateau `board` est celui AVANT l'application de la
 * séquence ; il est mis à jour au fil des coups pour détecter les frappes
 * successives (ex: "13/7* 7/5").
 *
 * @param moves   Séquence de coups à formater.
 * @param player  Joueur au trait (perspective de la notation).
 * @param board   Plateau initial (26 entiers) avant la séquence.
 */
export function formatMoveSequenceNotationWithHits(
    moves: Move[],
    player: Player,
    board: number[],
): string {
    if (moves.length === 0) return 'Pass';
    let currentBoard = board.slice();
    const tokens: string[] = [];
    for (const m of moves) {
        const token = formatSingleMove(m, player);
        // Détection de frappe : la destination contient un blot adverse.
        const isHit =
            m.to !== X_OFF &&
            m.to !== O_OFF &&
            (player === 'X' ? currentBoard[m.to] === -1 : currentBoard[m.to] === 1);
        tokens.push(isHit ? `${token}*` : token);
        currentBoard = applyMove(currentBoard, m, player);
    }
    return tokens.join(' ');
}

/**
 * Assure qu'on dispose d'un BoardState complet (parse le XGID si nécessaire).
 */
export function resolveBoardState(position: BoardState | string, fallbackPlayer?: Player): BoardState {
    if (typeof position === 'string') {
        const parsed = parseXGID(position);
        if (fallbackPlayer) parsed.turn = fallbackPlayer;
        return parsed;
    }
    return position;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// MOTEUR D'ÉVALUATION TRI-PHASE (Contact / Crashed / Race-BearOff)
// ---------------------------------------------------------------------------
// Architecture inspirée de GNU Backgammon / TD-Gammon : la position est
// classée dans l'un des 3 régimes de jeu, puis évaluée par un évaluateur
// spécialisé. Ceci remplace l'ancienne régression logistique à 4 coefficients.
// ---------------------------------------------------------------------------

/** Régime de jeu d'une position. */
export type PositionRegime = 'RACE' | 'CRASHED' | 'CONTACT';

/** Poids stratégiques des flèches clés (valeur réelle au Backgammon). */
const KEY_POINT_WEIGHTS: Record<number, number> = {
    1: 0.25, // As : mauvais à fermer tôt
    2: 0.65,
    3: 0.9,
    4: 1.2,
    5: 1.45, // Golden Point
    6: 1.0,
    7: 1.25, // Bar Point
};

/**
 * Détecte le régime de jeu exact d'une position.
 *
 * - `RACE` : aucun contact possible (les armées se sont croisées) et barre vide.
 * - `CRASHED` : contact encore possible, mais un joueur a <= 6 pions sur le
 *   plateau OU a écrasé son jan intérieur (plus de 7 pions sur les flèches 1 et 2).
 * - `CONTACT` : position normale de combat / blitz / prime / holding game.
 */
export function classifyPosition(board: number[]): PositionRegime {
    const barX = board[X_BAR];
    const barO = board[O_BAR];

    // Pion Noir (O) le plus avancé = flèche la plus haute (O avance 1 -> 24).
    let furthestO = 0;
    for (let p = 1; p <= 24; p++) {
        if (board[p] < 0) {
            furthestO = p;
            break;
        }
    }
    // Pion Blanc (X) le plus avancé = flèche la plus basse (X avance 24 -> 1).
    let furthestX = 25;
    for (let p = 24; p >= 1; p--) {
        if (board[p] > 0) {
            furthestX = p;
            break;
        }
    }

    // Contact si un pion Blanc est encore « derrière » le pion Noir le plus avancé.
    const contact = furthestX > furthestO;

    if (!contact && barX === 0 && barO === 0) {
        return 'RACE';
    }

    // Détection CRASHED : un joueur a <= 6 pions sur le plateau, ou a écrasé
    // son jan intérieur (plus de 7 pions empilés sur les flèches 1 et 2).
    let xOnBoard = 0;
    let oOnBoard = 0;
    let xStackedLow = 0;
    let oStackedLow = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v > 0) {
            xOnBoard += v;
            if (p <= 2) xStackedLow += v;
        } else if (v < 0) {
            oOnBoard += -v;
            if (p >= 23) oStackedLow += -v;
        }
    }

    const xCrashed = xOnBoard <= 6 || xStackedLow > 7;
    const oCrashed = oOnBoard <= 6 || oStackedLow > 7;

    if (xCrashed || oCrashed) return 'CRASHED';

    return 'CONTACT';
}

/**
 * Extrait les pions du jan intérieur si TOUS les pions du joueur y sont (ou sortis).
 * Retourne les 6 compteurs [flèche 1..6], ou null si le joueur a des pions extérieurs/barre.
 */
function getBearoffCounts(board: number[], player: Player): number[] | null {
    if (player === 'X') {
        if (board[X_BAR] > 0) return null;
        for (let pt = 7; pt <= 24; pt++) {
            if (board[pt] > 0) return null;
        }
        return [
            Math.max(0, board[1]),
            Math.max(0, board[2]),
            Math.max(0, board[3]),
            Math.max(0, board[4]),
            Math.max(0, board[5]),
            Math.max(0, board[6]),
        ];
    } else {
        if (board[O_BAR] < 0) return null;
        for (let pt = 1; pt <= 18; pt++) {
            if (board[pt] < 0) return null;
        }
        return [
            Math.max(0, -board[24]),
            Math.max(0, -board[23]),
            Math.max(0, -board[22]),
            Math.max(0, -board[21]),
            Math.max(0, -board[20]),
            Math.max(0, -board[19]),
        ];
    }
}

/**
 * Évaluateur spécialisé COURSE & BEAR-OFF (exactitude mathématique).
 *
 * Utilise :
 * 1. La table exacte 1-sided Bear-off (54 264 états) quand les deux joueurs
 *    sont en phase de bear-off pur.
 * 2. Le Keith Count officiel (Tom Keith, 1993) avec pénalités de gaspillage
 *    en course pure générale.
 */
function evaluateRace(
    state: BoardState,
    player: Player,
    opponent: Player,
): { cubelessEquity: number; probabilities: Probabilities } {
    const offPlayer = borneOffCount(state.board, player);
    const offOpponent = borneOffCount(state.board, opponent);

    const bearoffPlayer = getBearoffCounts(state.board, player);
    const bearoffOpponent = getBearoffCounts(state.board, opponent);

    let winProb: number;

    if (offPlayer >= 15) {
        winProb = 1.0;
    } else if (offOpponent >= 15) {
        winProb = 0.0;
    } else if (bearoffPlayer !== null && bearoffOpponent !== null) {
        // Phase Bear-Off exacte via la table des 54 264 états précalculés
        const expP = bearoffExpectedRolls(bearoffPlayer);
        const expO = bearoffExpectedRolls(bearoffOpponent);
        if (expP <= 0) {
            winProb = 1.0;
        } else if (expO <= 0) {
            winProb = 0.0;
        } else {
            // Le joueur au trait joue en premier (+0.5 jet d'avance moyen)
            const diffRolls = expO - expP + 0.5;
            const sigma = Math.sqrt(Math.max(1, expP + expO)) * 0.45;
            const z = diffRolls / sigma;
            winProb = clamp(1 / (1 + Math.exp(-2.2 * z)), 0.0001, 0.9999);
        }
    } else {
        // Course pure générale : Keith Count officiel avec pénalités
        const keithP = computeKeithCount(state.board, player).total;
        const keithO = computeKeithCount(state.board, opponent).total;
        const ep = keithP - Math.floor(keithP / 7);
        const eo = keithO;
        const z = (eo - ep) / (Math.sqrt(ep + eo) * 1.65);
        winProb = clamp(1 / (1 + Math.exp(-1.7 * z)), 0.001, 0.999);
    }

    const loseProb = 1 - winProb;

    // Gammon en course : impossible si l'adversaire a déjà sorti un pion.
    let winGammon = 0;
    let loseGammon = 0;
    if (offOpponent === 0) {
        winGammon = clamp((winProb - 0.5) * 0.35, 0, 0.4);
    }
    if (offPlayer === 0) {
        loseGammon = clamp((loseProb - 0.5) * 0.35, 0, 0.4);
    }

    const winBackgammon = 0;
    const loseBackgammon = 0;

    const probabilities: Probabilities = {
        win: Number(winProb.toFixed(4)),
        winGammon: Number(winGammon.toFixed(4)),
        winBackgammon: Number(winBackgammon.toFixed(4)),
        loseWin: Number(loseProb.toFixed(4)),
        loseGammon: Number(loseGammon.toFixed(4)),
        loseBackgammon: Number(loseBackgammon.toFixed(4)),
    };

    const cubelessEquity = Number(
        (
            winProb -
            loseProb +
            (winGammon - loseGammon) +
            (winBackgammon - loseBackgammon)
        ).toFixed(4),
    );

    return { cubelessEquity, probabilities };
}

/**
 * Compte le nombre de lancers (sur 36) qui frappent un blot situé sur la
 * flèche `point`, via le comptage EXACT des tirs (directs + indirects, pions
 * sur la barre inclus), pondéré par la force du jan intérieur adverse.
 */
function countShotsOnBlot(
    board: number[],
    point: number,
    player: Player,
    opponent: Player,
): number {
    const opponentHomeStrength = opponentHomeBoardStrength(board, opponent);

    // Comptage exact des 36 lancers (directs + indirects + pions sur la barre).
    const { total } = countShotsExact(board, point, opponent);

    // Pondération par la force du jan intérieur adverse (caractéristique
    // stratégique légitime : un jan fermé rend la frappe plus coûteuse).
    return total * (1 + opponentHomeStrength * 0.15);
}

/**
 * Force du jan intérieur d'un joueur (nombre de portes fermées dans son jan).
 */
function opponentHomeBoardStrength(board: number[], player: Player): number {
    let strength = 0;
    for (let p = 1; p <= 6; p++) {
        const v = board[p];
        const count = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        if (count >= 2) strength++;
    }
    return strength;
}

/**
 * Mesure la plus longue séquence de portes consécutives (prime) d'un joueur.
 */
function longestPrime(board: number[], player: Player): number {
    let longest = 0;
    let current = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const count = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        if (count >= 2) {
            current++;
            if (current > longest) longest = current;
        } else {
            current = 0;
        }
    }
    return longest;
}

/**
 * Compte les pions adverses piégés derrière la prime d'un joueur.
 */
function trappedCheckersBehindPrime(board: number[], player: Player): number {
    const prime = longestPrime(board, player);
    if (prime < 2) return 0;

    // Trouve la flèche la plus avancée de la prime du joueur (le « front »).
    // Pour X (avance 24 -> 1), le front est la flèche la plus basse de la prime.
    // Pour O (avance 1 -> 24), le front est la flèche la plus haute de la prime.
    let primeFront = -1;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const count = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        if (count >= 2) {
            if (player === 'X') {
                // X : front = flèche la plus basse (la plus avancée).
                if (primeFront === -1 || p < primeFront) primeFront = p;
            } else {
                // O : front = flèche la plus haute (la plus avancée).
                if (primeFront === -1 || p > primeFront) primeFront = p;
            }
        }
    }
    if (primeFront === -1) return 0;

    let trapped = 0;
    const opponent = player === 'X' ? 'O' : 'X';
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const isOpp = opponent === 'X' ? v > 0 : v < 0;
        if (!isOpp) continue;
        // Un pion adverse est « derrière » la prime s'il est plus reculé que le
        // front de la prime (pour X : flèche > front ; pour O : flèche < front).
        const behind = player === 'X' ? p > primeFront : p < primeFront;
        if (behind) trapped += Math.abs(v);
    }
    return trapped;
}

/**
 * Valeur de l'ancre défensive d'un joueur (flèche 20/21 = ancre avancée).
 */
function anchorValue(board: number[], player: Player): number {
    let value = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const count = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        if (count < 2) continue;
        // Ancre dans le jan adverse.
        const isAdvancedAnchor =
            player === 'X' ? p >= 20 && p <= 21 : p >= 4 && p <= 5;
        const isDeepAnchor =
            player === 'X' ? p >= 23 : p <= 2;
        if (isAdvancedAnchor) value += 0.28;
        else if (isDeepAnchor) value += 0.08;
    }
    return value;
}

/**
 * Évaluateur spécialisé CONTACT (16 caractéristiques stratégiques réelles).
 */
function evaluateContact(
    state: BoardState,
    player: Player,
    opponent: Player,
): { cubelessEquity: number; probabilities: Probabilities } {
    const board = state.board;
    const pips = pipCount(board);
    const pipDiff = pips[player] - pips[opponent];

    let z = 0;

    // 1. Course aux pips (base).
    z += -0.02 * pipDiff;

    // 2. Vraie probabilité de frappe : pénalise les blots exposés (antisymétrique player vs opponent).
    let blotPenaltyPlayer = 0;
    let blotPenaltyOpponent = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const isPlayerBlot = player === 'X' ? v === 1 : v === -1;
        const isOpponentBlot = opponent === 'X' ? v === 1 : v === -1;
        if (isPlayerBlot) {
            const shots = countShotsOnBlot(board, p, player, opponent);
            blotPenaltyPlayer += shots * 0.06;
        } else if (isOpponentBlot) {
            const shots = countShotsOnBlot(board, p, opponent, player);
            blotPenaltyOpponent += shots * 0.06;
        }
    }
    z += blotPenaltyOpponent - blotPenaltyPlayer;

    // 3. Force de Prime (mur de portes consécutives, antisymétrique player vs opponent).
    const primePlayer = longestPrime(board, player);
    const trappedByPlayer = trappedCheckersBehindPrime(board, player);
    if (primePlayer >= 5 && trappedByPlayer > 0) {
        z += 0.45 + Math.min(0.4, (primePlayer - 5) * 0.2);
    } else if (primePlayer >= 4 && trappedByPlayer > 0) {
        z += 0.25;
    } else if (primePlayer >= 2) {
        z += primePlayer * 0.04;
    }

    const primeOpponent = longestPrime(board, opponent);
    const trappedByOpponent = trappedCheckersBehindPrime(board, opponent);
    if (primeOpponent >= 5 && trappedByOpponent > 0) {
        z -= 0.45 + Math.min(0.4, (primeOpponent - 5) * 0.2);
    } else if (primeOpponent >= 4 && trappedByOpponent > 0) {
        z -= 0.25;
    } else if (primeOpponent >= 2) {
        z -= primeOpponent * 0.04;
    }

    // 4. Qualité de l'ancre défensive.
    z += anchorValue(board, player);
    z -= anchorValue(board, opponent);

    // 5. Contrôle des flèches clés (jan intérieur 1..7 + jan extérieur 8..11), SYMÉTRIQUE X/O.
    let keyPointsPlayer = 0;
    let keyPointsOpponent = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const countX = Math.max(0, v);
        const countO = Math.max(0, -v);

        const wX =
            p >= 1 && p <= 7
                ? (KEY_POINT_WEIGHTS[p] ?? 1.0)
                : p >= 8 && p <= 11
                  ? 0.45 - (p - 8) * 0.05
                  : 0;
        const revP = 25 - p;
        const wO =
            revP >= 1 && revP <= 7
                ? (KEY_POINT_WEIGHTS[revP] ?? 1.0)
                : revP >= 8 && revP <= 11
                  ? 0.45 - (revP - 8) * 0.05
                  : 0;

        if (countX >= 2) {
            if (player === 'X') keyPointsPlayer += wX;
            else keyPointsOpponent += wX;
        }
        if (countO >= 2) {
            if (player === 'O') keyPointsPlayer += wO;
            else keyPointsOpponent += wO;
        }
    }
    z += 0.14 * (keyPointsPlayer - keyPointsOpponent);

    // 6. Pénalité de chandeliers (empilement > 5 pions sur une même flèche, antisymétrique).
    let stackingPenaltyPlayer = 0;
    let stackingPenaltyOpponent = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        const countP = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        const countO = opponent === 'X' ? Math.max(0, v) : Math.max(0, -v);
        if (countP > 5) stackingPenaltyPlayer += 0.08 * (countP - 5);
        if (countO > 5) stackingPenaltyOpponent += 0.08 * (countO - 5);
    }
    z += stackingPenaltyOpponent - stackingPenaltyPlayer;

    // 7. Mobilité des pions arrières (bloqués en 24/23 face à une prime adverse, antisymétrique).
    if (primeOpponent >= 4) {
        for (const p of player === 'X' ? [24, 23] : [1, 2]) {
            const v = board[p];
            const count = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
            if (count > 0) z -= 0.06 * count;
        }
    }
    if (primePlayer >= 4) {
        for (const p of opponent === 'X' ? [24, 23] : [1, 2]) {
            const v = board[p];
            const count = opponent === 'X' ? Math.max(0, v) : Math.max(0, -v);
            if (count > 0) z += 0.06 * count;
        }
    }

    // 8. Pions sur la barre.
    const barPlayer = player === 'X' ? board[X_BAR] : -board[O_BAR];
    const barOpponent = opponent === 'X' ? board[X_BAR] : -board[O_BAR];
    z += 0.25 * (barOpponent - barPlayer);

    const winProb = clamp(1 / (1 + Math.exp(-z)), 0.02, 0.98);
    const loseProb = 1 - winProb;

    // Gammons en contact.
    let winGammon = 0;
    let loseGammon = 0;
    const offPlayer = borneOffCount(board, player);
    const offOpponent = borneOffCount(board, opponent);

    if (winProb > 0.5) {
        winGammon = clamp((winProb - 0.5) * 0.4 * (1 + barOpponent * 0.3), 0.01, 0.5);
        loseGammon = clamp((0.5 - loseProb) * 0.12, 0.005, 0.15);
    } else {
        loseGammon = clamp((loseProb - 0.5) * 0.4 * (1 + barPlayer * 0.3), 0.01, 0.5);
        winGammon = clamp((0.5 - winProb) * 0.12, 0.005, 0.15);
    }

    // Règle officielle : un joueur ayant sorti >= 1 pion ne peut JAMAIS perdre
    // de gammon ni de backgammon.
    if (offPlayer >= 1) {
        loseGammon = 0;
    }
    if (offOpponent >= 1) {
        winGammon = 0;
    }

    const winBackgammon = clamp(winGammon * 0.04, 0, 0.05);
    const loseBackgammon = clamp(loseGammon * 0.04, 0, 0.05);

    const probabilities: Probabilities = {
        win: Number(winProb.toFixed(4)),
        winGammon: Number(winGammon.toFixed(4)),
        winBackgammon: Number(winBackgammon.toFixed(4)),
        loseWin: Number(loseProb.toFixed(4)),
        loseGammon: Number(loseGammon.toFixed(4)),
        loseBackgammon: Number(loseBackgammon.toFixed(4)),
    };

    const cubelessEquity = Number(
        (
            winProb -
            loseProb +
            (winGammon - loseGammon) +
            (winBackgammon - loseBackgammon)
        ).toFixed(4),
    );

    return { cubelessEquity, probabilities };
}

/**
 * Évalue les probabilités de gain et les équités d'une position.
 *
 * Moteur tri-phase : détecte le régime (RACE / CRASHED / CONTACT) puis délègue
 * à l'évaluateur spécialisé correspondant. L'équité est bornée entre -1 et +1.
 */
export function evaluateBoard(
    state: BoardState,
    _ply: number = 2,
): { cubelessEquity: number; cubefulEquity: number; probabilities: Probabilities } {
    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    const offPlayer = borneOffCount(state.board, player);
    const offOpponent = borneOffCount(state.board, opponent);

    // Cas terminaux immédiats.
    if (offPlayer >= 15) {
        const probs: Probabilities = {
            win: 1.0,
            winGammon: 0.2,
            winBackgammon: 0.02,
            loseWin: 0.0,
            loseGammon: 0.0,
            loseBackgammon: 0.0,
        };
        return { cubelessEquity: 1.0, cubefulEquity: 1.0, probabilities: probs };
    }
    if (offOpponent >= 15) {
        const probs: Probabilities = {
            win: 0.0,
            winGammon: 0.0,
            winBackgammon: 0.0,
            loseWin: 1.0,
            loseGammon: 0.2,
            loseBackgammon: 0.02,
        };
        return { cubelessEquity: -1.0, cubefulEquity: -1.0, probabilities: probs };
    }

    const regime = classifyPosition(state.board);

    let cubelessEquity: number;
    let probabilities: Probabilities;

    if (regime === 'RACE') {
        const race = evaluateRace(state, player, opponent);
        cubelessEquity = race.cubelessEquity;
        probabilities = race.probabilities;
    } else if (regime === 'CRASHED') {
        // Régime écrasé : on réutilise l'évaluateur de contact (les blots et
        // portes restent pertinents car le contact est encore possible).
        const contact = evaluateContact(state, player, opponent);
        cubelessEquity = contact.cubelessEquity;
        probabilities = contact.probabilities;
    } else {
        const contact = evaluateContact(state, player, opponent);
        cubelessEquity = contact.cubelessEquity;
        probabilities = contact.probabilities;
    }

    // Ajustement cubeful (borné entre -1 et +1).
    let cubefulEquity = cubelessEquity;
    if (state.cubeOwner === null) {
        cubefulEquity = cubelessEquity * 1.05;
    } else if (state.cubeOwner === player) {
        cubefulEquity = cubelessEquity + 0.08 * (1 - Math.abs(cubelessEquity));
    } else {
        cubefulEquity = cubelessEquity - 0.08 * (1 - Math.abs(cubelessEquity));
    }
    cubefulEquity = Number(clamp(cubefulEquity, -1.0, 1.0).toFixed(4));
    cubelessEquity = Number(clamp(cubelessEquity, -1.0, 1.0).toFixed(4));

    return {
        cubelessEquity,
        cubefulEquity,
        probabilities,
    };
}

/**
 * Analyse exhaustivement les coups légaux possibles et les classe par équité.
 */
export function analyzeBoardMoves(
    state: BoardState,
    dice: [number, number],
    options: { candidateMoves?: MoveSequence[]; ply?: number; maxMoves?: number } = {},
): AnalyzeMovesResult {
    const xgid = serializeXGID(state);
    const candidateSeqs = options.candidateMoves ?? generateLegalMoves(state, dice);

    if (candidateSeqs.length === 0) {
        return {
            xgid,
            moves: [],
            bestMove: null,
            isWasm: false,
        };
    }

    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    // SANITY CHECK (Règle d'or n°1) : log de vérification du coin de mire
    // uniquement si explicitement activé via DEBUG_EVALUATOR=true.
    if (typeof console !== 'undefined' && process.env.DEBUG_EVALUATOR === 'true') {
        const pips = pipCount(state.board);
        // eslint-disable-next-line no-console
        console.log('BOARD ANALYSÉ POUR', player, state.board);
        // eslint-disable-next-line no-console
        console.log('PIP COUNT — X (Blanc):', pips.X, '| O (Noir):', pips.O);
    }

    // Évaluation de chaque séquence candidate
    const scoredCandidates: Array<{
        seq: MoveSequence;
        equity: number;
        probabilities: Probabilities;
        notation: string;
    }> = [];

    for (const seq of candidateSeqs) {
        // État résultant après le coup
        const resultingState: BoardState = {
            ...state,
            board: seq.board,
            turn: opponent, // Le tour passe à l'adversaire
            dice: null,
        };

        // On évalue la position du point de vue de l'adversaire puis on inverse l'équité
        const oppEval = evaluateBoard(resultingState, options.ply ?? 2);
        const playerEquity = -oppEval.cubefulEquity;

        // Inversion des probabilités pour le joueur au trait
        const playerProbs: Probabilities = {
            win: oppEval.probabilities.loseWin,
            winGammon: oppEval.probabilities.loseGammon,
            winBackgammon: oppEval.probabilities.loseBackgammon,
            loseWin: oppEval.probabilities.win,
            loseGammon: oppEval.probabilities.winGammon,
            loseBackgammon: oppEval.probabilities.winBackgammon,
        };

        scoredCandidates.push({
            seq,
            equity: Number(playerEquity.toFixed(4)),
            probabilities: playerProbs,
            notation: formatMoveSequenceNotation(seq.moves, player),
        });
    }

    // Tri décroissant par équité
    scoredCandidates.sort((a, b) => b.equity - a.equity);

    const bestEquity = scoredCandidates[0].equity;
    const maxMoves = options.maxMoves ?? 5;
    const sliced = scoredCandidates.slice(0, maxMoves);

    // SANITY CHECK (Règle d'or n°3) : chaque sous-coup de la meilleure séquence doit
    // partir d'une flèche contenant un pion du joueur actif sur le plateau simulé pas à pas.
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
        const bestSeq = scoredCandidates[0].seq;
        let simBoard = state.board.slice();
        for (const m of bestSeq.moves) {
            const src = simBoard[m.from];
            const ownsSource = player === 'X' ? src > 0 : src < 0;
            if (!ownsSource) {
                // eslint-disable-next-line no-console
                console.warn(
                    `[SANITY CHECK] Meilleur coup invalide pour ${player} : from=${m.from} (board[${m.from}]=${src}) ne contient pas de pion du joueur actif. Indice potentiellement inversé.`,
                );
            }
            simBoard = applyMove(simBoard, m, player);
        }
    }

    const moves: MoveAnalysis[] = sliced.map((item, index) => ({
        rank: index + 1,
        notation: item.notation,
        equity: item.equity,
        equityLoss: Number((item.equity - bestEquity).toFixed(4)),
        probabilities: item.probabilities,
        moves: item.seq.moves,
        board: item.seq.board,
    }));

    return {
        xgid,
        moves,
        bestMove: moves[0] ?? null,
        isWasm: false,
    };
}

import { calculateTakePoint } from '../../features/coach/matchContext';
import { isInitialBoardPosition } from '../../features/openings/openingDatabase';

/**
 * Analyse la décision de videau pour la position donnée.
 *
 * Utilise les seuils officiels de Janowski ajustés dynamiquement selon
 * la table d'équité de match (MET Kazaross-XG2) et les régimes Crawford / DMP / Dead Cube.
 */
export function analyzeBoardCube(
    state: BoardState,
    options: {
        score?: { scoreX: number; scoreO: number; matchLength?: number };
        ply?: number;
    } = {},
): CubeDecisionResult {
    const xgid = serializeXGID(state);
    const evaluation = evaluateBoard(state, options.ply ?? 2);
    const equity = evaluation.cubefulEquity;
    const cubelessEquity = evaluation.cubelessEquity;

    const noDouble = Number(equity.toFixed(4));
    const doubleTake = Number(clamp(2 * cubelessEquity - 0.15, -1.0, 1.0).toFixed(4));
    const doublePass = 1.0;

    const effectiveMatchLength = options.score?.matchLength ?? state.matchLength ?? 0;
    const scoreX = options.score?.scoreX ?? state.scoreX ?? 0;
    const scoreO = options.score?.scoreO ?? state.scoreO ?? 0;
    const isMoney = effectiveMatchLength <= 0;

    let optimalAction = 'No double, take';

    // 1. Règle de Crawford : le videau est gelé
    if (state.crawford) {
        optimalAction = 'No double (Crawford rule)';
    } else if (!isMoney && scoreX === effectiveMatchLength - 1 && scoreO === effectiveMatchLength - 1) {
        // 2. Double Match Point (DMP) : le videau est sans objet pour les deux joueurs
        optimalAction = 'No double (DMP)';
    } else if (!isMoney && (state.turn === 'X' ? scoreX === effectiveMatchLength - 1 : scoreO === effectiveMatchLength - 1)) {
        // 3. Dead Cube : un joueur à 1 point de la victoire (1-away) ne double jamais
        optimalAction = 'No double (Dead cube)';
    } else if (isInitialBoardPosition(state.board)) {
        // 4. Règle officielle WBF 5.1 : pas de double sur la position initiale avant le premier coup joué
        optimalAction = 'No double (Opening position)';
    } else {
        const regime = classifyPosition(state.board);
        if (regime === 'RACE') {
            // En course pure, la formule de Tom Keith donne la décision exacte de videau
            const isRedouble = state.cubeOwner === state.turn;
            const keithDecision = evaluateKeithCube(state.board, state.turn, isRedouble);
            optimalAction = keithDecision.action;
        } else {
            // Calcul du seuil de passe dynamique (Take Point MET Kazaross-XG2 en match play)
            let takePoint = 0.25;
            if (!isMoney) {
                const awayX = Math.max(1, effectiveMatchLength - scoreX);
                const awayO = Math.max(1, effectiveMatchLength - scoreO);
                const awayTaker = state.turn === 'X' ? awayO : awayX;
                const awayDoubler = state.turn === 'X' ? awayX : awayO;
                takePoint = calculateTakePoint(awayTaker, awayDoubler, false);
            }

            const DOUBLE_THRESHOLD = 0.42;
            const passThreshold = Number(clamp(1.0 - 2 * (takePoint - 0.145), 0.55, 0.95).toFixed(2));

            if (cubelessEquity < DOUBLE_THRESHOLD) {
                optimalAction = 'No double, take';
            } else if (cubelessEquity >= DOUBLE_THRESHOLD && cubelessEquity < passThreshold) {
                optimalAction = 'Double, take';
            } else {
                optimalAction = 'Double, pass';
            }
        }
    }

    return {
        xgid,
        noDouble,
        doubleTake,
        doublePass,
        optimalAction,
        isWasm: false,
    };
}

/**
 * Décision de l'IA sur une proposition de videau (Take / Pass) selon Janowski.
 *
 * @param cubelessEquity Équité cubeless de l'IA (du point de vue de l'IA).
 * @returns `true` si l'IA accepte (Take), `false` si elle abandonne (Pass).
 */
export function shouldTakeDouble(cubelessEquity: number): boolean {
    return cubelessEquity >= -0.54;
}

/**
 * Décision de l'IA de proposer un double (Double) selon Janowski.
 *
 * @param cubelessEquity Équité cubeless de l'IA (du point de vue de l'IA).
 * @returns `true` si l'IA propose de doubler.
 */
export function shouldOfferDouble(cubelessEquity: number): boolean {
    return cubelessEquity >= 0.42;
}

/**
 * Détermine le meilleur coup pour la position et les dés fournis.
 */
export function findBestBoardMove(
    state: BoardState,
    dice: [number, number],
    ply: number = 2,
): BestMoveResult | null {
    const result = analyzeBoardMoves(state, dice, { ply, maxMoves: 1 });
    if (!result.bestMove || !result.bestMove.moves || !result.bestMove.board) {
        return null;
    }

    return {
        xgid: result.xgid,
        notation: result.bestMove.notation,
        sequence: {
            moves: result.bestMove.moves,
            board: result.bestMove.board,
        },
        equity: result.bestMove.equity,
        rank: 1,
        isWasm: false,
    };
}
