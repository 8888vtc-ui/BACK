/**
 * MISSION 30/50 : SIMULATION AUTOMATIQUE DE 1 000 PARTIES COMPLÈTES EN MÉMOIRE
 *
 * Invariants certifiés après CHAQUE demi-coup de CHAQUE partie :
 *   1. Conservation stricte : totalWhiteCheckers === 15 et totalBlackCheckers === 15
 *      (sur le plateau 1..24 + sur la barre + déjà sortis borneOff).
 *   2. Homogénéité des flèches : aucune case 1..24 ne contient simultanément
 *      des pions Blancs et Noirs. Barre X >= 0, Barre O <= 0.
 *   3. Finitude : aucune partie ne boucle à l'infini (maxTurns < 400).
 *   4. Vérité du score & Règle Jacoby :
 *      - Simple = 1x
 *      - Gammon = 2x
 *      - Backgammon = 3x
 *      - En Money Game (matchLength = 0), si cubeValue = 1 (videau non tourné),
 *        la règle Jacoby ramène le multiplicateur de Gammon et Backgammon à 1x.
 *      - En Match Play (matchLength > 0) ou avec videau tourné (cubeValue >= 2),
 *        le plein multiplicateur est appliqué.
 *
 * Strictement 0 `any`, fichier <= 400 lignes.
 */

import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    generateLegalMoves,
    borneOffCount,
    X_BAR,
    O_BAR,
    type BoardState,
    type Player,
    type MoveSequence,
} from '../backgammonEngine';
import { evaluateWin, type GameResult, type WinType } from '../aiHeuristics';
import { computeJacobyMultiplier } from '../cubeRules';

/** Générateur PRNG rapide et déterministe (Mulberry32). */
function createPrng(seed: number): () => number {
    let state = seed >>> 0;
    return (): number => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Évalue rapidement et en une seule passe la pertinence d'une séquence pour garantir un déroulement
 * fluide et réaliste des 1 000 parties sans allocation superflue.
 */
function scoreSequenceFast(
    seq: MoveSequence,
    turn: Player,
    prng: () => number
): number {
    const isX = turn === 'X';
    let score = prng() * 50;

    let pointsCheckers = 0;
    let homeCheckers = 0;
    let blots = 0;

    const b = seq.board;
    for (let p = 1; p <= 24; p++) {
        const val = b[p]!;
        if (isX) {
            if (val > 0) {
                pointsCheckers += val;
                if (p <= 6) homeCheckers += val;
                if (val === 1) blots++;
            }
        } else {
            if (val < 0) {
                const count = -val;
                pointsCheckers += count;
                if (p >= 19) homeCheckers += count;
                if (count === 1) blots++;
            }
        }
    }

    const bar = isX ? Math.max(0, b[X_BAR]!) : Math.max(0, -b[O_BAR]!);
    const borneOff = 15 - pointsCheckers - bar;

    score += borneOff * 2500;
    score += homeCheckers * 60;
    score -= blots * 80;

    return score;
}

/** Lance un dé à 6 faces (1..6). */
function rollDie(prng: () => number): number {
    return 1 + Math.floor(prng() * 6);
}

/**
 * Calcule manuellement le type de victoire et le multiplicateur selon les règles officielles WBGF.
 */
function computeExpectedVictory(
    board: readonly number[],
    winner: Player,
    cubeValue: number,
    matchLength: number
): { winType: WinType; multiplier: number; pointsWon: number } {
    const loser: Player = winner === 'X' ? 'O' : 'X';
    const loserBorneOff = borneOffCount(board as number[], loser);

    let rawType: WinType;
    let rawMultiplier: number;

    if (loserBorneOff > 0) {
        rawType = 'single';
        rawMultiplier = 1;
    } else {
        // Le perdant n'a sorti aucun pion : vérifier s'il a un pion sur la barre ou dans le jan du vainqueur
        let hasInWinnerHomeOrBar = false;
        if (winner === 'X') {
            // Jan intérieur de X = cases 1..6, barre de O = O_BAR (25)
            if (board[O_BAR] < 0) {
                hasInWinnerHomeOrBar = true;
            } else {
                for (let p = 1; p <= 6; p++) {
                    if (board[p] < 0) {
                        hasInWinnerHomeOrBar = true;
                        break;
                    }
                }
            }
        } else {
            // Jan intérieur de O = cases 19..24, barre de X = X_BAR (0)
            if (board[X_BAR] > 0) {
                hasInWinnerHomeOrBar = true;
            } else {
                for (let p = 19; p <= 24; p++) {
                    if (board[p] > 0) {
                        hasInWinnerHomeOrBar = true;
                        break;
                    }
                }
            }
        }

        if (hasInWinnerHomeOrBar) {
            rawType = 'backgammon';
            rawMultiplier = 3;
        } else {
            rawType = 'gammon';
            rawMultiplier = 2;
        }
    }

    const multiplier = computeJacobyMultiplier({
        matchLength,
        cubeValue,
        rawMultiplier,
    });
    const pointsWon = multiplier * cubeValue;

    return { winType: rawType, multiplier, pointsWon };
}

describe('Certification Moteur — 1 000 Parties Complètes en Mémoire', () => {
    it('joue 1 000 parties complètes sans violation de conservation, ni blocage, avec scoring exact', () => {
        const prng = createPrng(0x1337cafe);

        let totalTurnsSimulated = 0;
        let totalSingleWins = 0;
        let totalGammonWins = 0;
        let totalBackgammonWins = 0;
        let totalJacobyReductions = 0;

        const TOTAL_GAMES = 1000;

        for (let gameIndex = 0; gameIndex < TOTAL_GAMES; gameIndex++) {
            // Varier matchLength : 50 % Money Game (0), 50 % Match Play (3, 5, 7, 9, 11)
            const isMoneyGame = gameIndex % 2 === 0;
            const matchLength = isMoneyGame ? 0 : [3, 5, 7, 9, 11][gameIndex % 5]!;

            // Varier la valeur du videau : 1 (non tourné), 2, 4
            // Dans 50 % des Money Games, cubeValue = 1 (test règle Jacoby : gammon/backgammon réduits à 1x)
            // Dans les autres, cubeValue = 2 ou 4 (test multiplicateur complet)
            let cubeValue = 1;
            if (gameIndex % 3 === 1) cubeValue = 2;
            else if (gameIndex % 3 === 2) cubeValue = 4;

            let board = createInitialState(matchLength).board;

            // Déterminer le premier joueur par un jet d'ouverture officiel
            let d1 = rollDie(prng);
            let d2 = rollDie(prng);
            while (d1 === d2) {
                d1 = rollDie(prng);
                d2 = rollDie(prng);
            }

            let turn: Player = d1 > d2 ? 'X' : 'O';
            let currentDice: [number, number] = [d1, d2];
            let isOpeningTurn = true;
            let turnsThisGame = 0;

            while (turnsThisGame < 400) {
                turnsThisGame++;
                totalTurnsSimulated++;

                const state: BoardState = {
                    board: [...board],
                    turn,
                    dice: currentDice,
                    cubeValue,
                    cubeOwner: null,
                    matchLength,
                    scoreX: 0,
                    scoreO: 0,
                    crawford: false,
                    doubled: false,
                    resigned: 0,
                };

                const sequences = generateLegalMoves(state, currentDice);

                if (sequences.length > 0) {
                    let bestScore = -Infinity;
                    let bestSeq: MoveSequence = sequences[0]!;

                    for (const seq of sequences) {
                        const score = scoreSequenceFast(seq, turn, prng);
                        if (score > bestScore) {
                            bestScore = score;
                            bestSeq = seq;
                        }
                    }

                    board = [...bestSeq.board];
                }

                // =====================================================================
                // CONTRÔLE DES INVARIANTS APRÈS CHAQUE DEMI-COUP
                // =====================================================================
                const whiteOnPoints = board.slice(1, 25).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
                const whiteOnBar = Math.max(0, board[X_BAR]);
                const whiteBorneOff = borneOffCount(board, 'X');
                const totalWhite = whiteOnPoints + whiteOnBar + whiteBorneOff;

                const blackOnPoints = board.slice(1, 25).reduce((acc, v) => acc + (v < 0 ? -v : 0), 0);
                const blackOnBar = Math.max(0, -board[O_BAR]);
                const blackBorneOff = borneOffCount(board, 'O');
                const totalBlack = blackOnPoints + blackOnBar + blackBorneOff;

                // 1. Invariant de conservation des 15 pions par camp
                expect(totalWhite).toBe(15);
                expect(totalBlack).toBe(15);

                // 2. Homogénéité des flèches et intégrité de la barre
                expect(board[X_BAR]).toBeGreaterThanOrEqual(0);
                expect(board[O_BAR]).toBeLessThanOrEqual(0);
                for (let point = 1; point <= 24; point++) {
                    const val = board[point]!;
                    expect(Number.isInteger(val)).toBe(true);
                }

                // 3. Détection de victoire
                if (whiteBorneOff === 15 || blackBorneOff === 15) {
                    const winner: Player = whiteBorneOff === 15 ? 'X' : 'O';
                    const loser: Player = winner === 'X' ? 'O' : 'X';

                    const expected = computeExpectedVictory(board, winner, cubeValue, matchLength);
                    const evaluated = evaluateWin(board, cubeValue, matchLength);

                    expect(evaluated).not.toBeNull();
                    const winResult: GameResult = evaluated!;

                    expect(winResult.winner).toBe(winner);
                    expect(winResult.loser).toBe(loser);
                    expect(winResult.winType).toBe(expected.winType);
                    expect(winResult.multiplier).toBe(expected.multiplier);
                    expect(winResult.pointsWon).toBe(expected.pointsWon);

                    if (expected.winType === 'single') totalSingleWins++;
                    else if (expected.winType === 'gammon') totalGammonWins++;
                    else if (expected.winType === 'backgammon') totalBackgammonWins++;

                    if (matchLength === 0 && cubeValue === 1 && expected.winType !== 'single') {
                        expect(winResult.multiplier).toBe(1);
                        expect(winResult.pointsWon).toBe(1);
                        totalJacobyReductions++;
                    }

                    break; // Fin normale de la partie
                }

                // Passer au tour suivant
                turn = turn === 'X' ? 'O' : 'X';
                isOpeningTurn = false;
                currentDice = [rollDie(prng), rollDie(prng)];
            }

            // 4. Invariant de finitude (aucune partie bloquée à 400 tours)
            expect(turnsThisGame).toBeLessThan(400);
        }

        // Vérification de la diversité statistique des 1 000 parties
        expect(totalTurnsSimulated).toBeGreaterThan(20000);
        expect(totalSingleWins).toBeGreaterThan(0);
        expect(totalGammonWins).toBeGreaterThan(0);
        // Des réductions Jacoby doivent avoir été exercées sur les Gammons/Backgammons en Money Game cube=1
        expect(totalJacobyReductions).toBeGreaterThan(0);
    });
});
