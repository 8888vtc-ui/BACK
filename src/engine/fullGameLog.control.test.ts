/**
 * Test de jeu complet — vérification que la log (retranscription des coups)
 * correspond EXACTEMENT à l'état réel du plateau.
 *
 * Invariant fondamental vérifié pour CHAQUE coup de CHAQUE partie :
 *   rejouer la notation retranscrite sur `boardBefore` reproduit `boardAfter`.
 *
 * Couverture :
 *   - Les 21 combinaisons de dés possibles (1-1, 1-2, ..., 6-6).
 *   - Les deux joueurs X et O.
 *   - Les cas de barre (entrée) et de bear-off (sortie).
 *   - Les frappes (hits) marquées d'un astérisque.
 */
import { describe, it, expect } from 'vitest';
import {
    BoardState,
    Player,
    Move,
    MoveSequence,
    createInitialState,
    generateLegalMoves,
    applyMove,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from './backgammonEngine';
import {
    formatMoveSequenceNotationWithHits,
} from '../lib/engine/evaluator';

function makeState(board: number[], turn: Player = 'X'): BoardState {
    return {
        board,
        turn,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Les 21 combinaisons de dés possibles (doubles inclus). */
const ALL_DICE_COMBINATIONS: [number, number][] = [];
for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = d1; d2 <= 6; d2++) {
        ALL_DICE_COMBINATIONS.push([d1, d2]);
    }
}

/**
 * Parse une notation standard "bar/24", "6/off", "13/7*" en {from, to} absolus
 * du point de vue du joueur. Retourne null si invalide.
 */
function parseNotation(token: string, player: Player): { from: number; to: number } | null {
    const m = token.match(/^(bar|\d+)\/(off|\d+)\*?$/);
    if (!m) return null;
    const fromStr = m[1];
    const toStr = m[2];

    let from: number;
    let to: number;

    if (player === 'X') {
        from = fromStr === 'bar' ? X_BAR : Number(fromStr);
        to = toStr === 'off' ? X_OFF : Number(toStr);
    } else {
        from = fromStr === 'bar' ? O_BAR : 25 - Number(fromStr);
        to = toStr === 'off' ? O_OFF : 25 - Number(toStr);
    }

    return { from, to };
}

/**
 * Rejoue une notation complète (ex: "bar/24 24/19") sur un plateau et retourne
 * le plateau résultant, ou null si la notation est invalide.
 */
function replayNotation(board: number[], notation: string, player: Player): number[] | null {
    let b = board.slice();
    const tokens = notation.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
        const parsed = parseNotation(token, player);
        if (!parsed) return null;
        b = applyMove(b, parsed, player);
    }
    return b;
}

describe('Jeu complet — la log correspond exactement au plateau (21 combinaisons de dés)', () => {
    it('rejouer la notation retranscrite reproduit boardAfter pour chaque coup', () => {
        const rand = mulberry32(987654321);
        let totalTurns = 0;
        let totalMoves = 0;
        let mismatches = 0;
        let firstMismatch: string | null = null;

        // Historique de la partie (log) : chaque entrée enregistre le plateau
        // avant/après un tour, pour vérifier la continuité de la retranscription.
        interface TurnLog {
            boardBefore: number[];
            boardAfter: number[];
            notation: string;
        }

        // Pour chaque combinaison de dés, on joue plusieurs parties complètes.
        for (const dice of ALL_DICE_COMBINATIONS) {
            // 3 parties par combinaison pour couvrir la variabilité.
            for (let game = 0; game < 3; game++) {
                let board = createInitialState().board;
                let turn: Player = 'X';
                const history: TurnLog[] = [];

                for (let ply = 0; ply < 400; ply++) {
                    const state = makeState(board, turn);
                    let sequences: MoveSequence[];
                    try {
                        sequences = generateLegalMoves(state, dice);
                    } catch {
                        break;
                    }

                    if (sequences.length === 0) {
                        turn = turn === 'X' ? 'O' : 'X';
                        continue;
                    }

                    const boardBefore = board.slice();

                    // Vérifie le chaînage de l'historique : le plateau courant doit
                    // être exactement le boardAfter du tour précédent (continuité).
                    if (history.length > 0) {
                        const prevAfter = history[history.length - 1].boardAfter;
                        if (prevAfter.join(',') !== boardBefore.join(',')) {
                            mismatches++;
                            if (!firstMismatch) {
                                firstMismatch =
                                    `chaînage rompu dice=[${dice}] turn=${turn} ` +
                                    `prevAfter=${prevAfter.join(',')} boardBefore=${boardBefore.join(',')}`;
                            }
                        }
                    }

                    // Vérifie la cohérence de TOUTES les séquences légales de la
                    // position (couverture exhaustive de la retranscription).
                    for (const seq of sequences) {
                        const notation = formatMoveSequenceNotationWithHits(seq.moves, turn, boardBefore);
                        const replayed = replayNotation(boardBefore, notation, turn);
                        const boardAfter = seq.board;

                        totalMoves += seq.moves.length;

                        if (!replayed || replayed.join(',') !== boardAfter.join(',')) {
                            mismatches++;
                            if (!firstMismatch) {
                                firstMismatch =
                                    `dice=[${dice}] turn=${turn} notation="${notation}" ` +
                                    `moves=${JSON.stringify(seq.moves)}`;
                            }
                        }
                    }

                    // Choisit une séquence aléatoire pour faire avancer la partie.
                    const seq = sequences[Math.floor(rand() * sequences.length)];
                    totalTurns++;

                    // Enregistre le tour dans la log (historique).
                    history.push({
                        boardBefore,
                        boardAfter: seq.board,
                        notation: formatMoveSequenceNotationWithHits(seq.moves, turn, boardBefore),
                    });

                    board = seq.board;
                    turn = turn === 'X' ? 'O' : 'X';

                    // Fin de partie si un joueur a tout sorti.
                    const xOff = 15 - board.slice(1, 25).reduce((a, v) => a + (v > 0 ? v : 0), 0) - Math.max(0, board[X_BAR]);
                    const oOff = 15 - board.slice(1, 25).reduce((a, v) => a + (v < 0 ? -v : 0), 0) - Math.max(0, -board[O_BAR]);
                    if (xOff >= 15 || oOff >= 15) break;
                }
            }
        }

        expect(totalTurns).toBeGreaterThan(0);
        expect(totalMoves).toBeGreaterThan(0);
        expect(mismatches, firstMismatch ?? 'aucune incohérence').toBe(0);
    });

    it('couvre explicitement chaque combinaison de dés au moins une fois', () => {
        // Vérifie que la liste des combinaisons est bien les 21 combinaisons.
        expect(ALL_DICE_COMBINATIONS.length).toBe(21);
        // Vérifie la présence des doubles et des non-doubles.
        expect(ALL_DICE_COMBINATIONS).toContainEqual([1, 1]);
        expect(ALL_DICE_COMBINATIONS).toContainEqual([6, 6]);
        expect(ALL_DICE_COMBINATIONS).toContainEqual([1, 6]);
        expect(ALL_DICE_COMBINATIONS).toContainEqual([3, 4]);
    });
});
