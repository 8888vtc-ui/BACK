/**
 * @file src/lib/engine/btDuplicateArena.ts
 * @description Arène Officielle de Duel Machine-contre-Machine en « Duplicate Dice » (`BT-Core` vs Concurrents).
 *
 * Protocole Duplicate Match (Standard BMAB / Tournoi Duplicate) :
 * - Chaque graine (`seed`) génère une séquence déterministe de jets de dés (`Mulberry32`).
 * - Manche Aller : `Engine A = X`, `Engine B = O` avec `diceSequence`.
 * - Manche Retour : `Engine B = X`, `Engine A = O` avec la MÊME `diceSequence`.
 * - Élimine 100 % du facteur chance des dés et mesure le différentiel mathématique pur (`netPPG`).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import {
    borneOffCount,
    createInitialState,
    generateLegalMoves,
    X_BAR,
    O_BAR,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import { analyzeBoardCube, analyzeBoardMoves } from './evaluator';
import { analyzeBtCoreCube, analyzeBtCoreMoves } from './btCoreEngine';

export interface DuplicateEngineAdapter {
    readonly id: string;
    readonly name: string;
    selectMove(state: BoardState, dice: [number, number]): MoveSequence | null;
    decideCube(state: BoardState): { shouldOfferDouble: boolean; shouldTakeIfOffered: boolean };
}

export interface DuplicateGameOutcome {
    readonly winner: Player;
    readonly pointsWon: number;
    readonly winType: 'single' | 'gammon' | 'backgammon' | 'pass';
    readonly cubeValue: number;
    readonly turnsPlayed: number;
}

export interface DuplicatePairOutcome {
    readonly seed: number;
    readonly leg1Aller: DuplicateGameOutcome; // A = X, B = O
    readonly leg2Retour: DuplicateGameOutcome; // B = X, A = O
    readonly netPointsForA: number;
}

export interface DuplicateSeriesReport {
    readonly engineA: string;
    readonly engineB: string;
    readonly pairsPlayed: number;
    readonly totalGamesPlayed: number;
    readonly winsA: number;
    readonly winsB: number;
    readonly winRateA: number;
    readonly totalPointsA: number;
    readonly totalPointsB: number;
    readonly netPointsA: number;
    readonly netPointsPerPair: number;
    readonly netPointsPerGame: number;
    readonly pairs: ReadonlyArray<DuplicatePairOutcome>;
}

/**
 * Générateur PRNG Mulberry32 déterministe pour séquences de dés Duplicate.
 */
export function createDuplicateDiceSequence(seed: number, length = 240): Array<[number, number]> {
    let s = seed >>> 0;
    const nextFloat = (): number => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const sequence: Array<[number, number]> = [];
    // Premier jet : non-double obligatoire au tour d'ouverture (règle WBGF)
    let d1 = 1;
    let d2 = 1;
    while (d1 === d2) {
        d1 = Math.floor(nextFloat() * 6) + 1;
        d2 = Math.floor(nextFloat() * 6) + 1;
    }
    sequence.push([d1, d2]);

    for (let i = 1; i < length; i++) {
        const a = Math.floor(nextFloat() * 6) + 1;
        const b = Math.floor(nextFloat() * 6) + 1;
        sequence.push([a, b]);
    }
    return sequence;
}

function computeWinMultiplier(board: readonly number[], winner: Player): {
    multiplier: 1 | 2 | 3;
    winType: 'single' | 'gammon' | 'backgammon';
} {
    const loser: Player = winner === 'X' ? 'O' : 'X';
    const loserOff = borneOffCount(board as number[], loser);
    if (loserOff > 0) {
        return { multiplier: 1, winType: 'single' };
    }
    const loserOnBar = loser === 'X' ? (board[X_BAR] ?? 0) > 0 : (board[O_BAR] ?? 0) < 0;
    let loserInWinnerHome = false;
    if (winner === 'X') {
        for (let p = 1; p <= 6; p++) {
            if ((board[p] ?? 0) < 0) loserInWinnerHome = true;
        }
    } else {
        for (let p = 19; p <= 24; p++) {
            if ((board[p] ?? 0) > 0) loserInWinnerHome = true;
        }
    }
    if (loserOnBar || loserInWinnerHome) {
        return { multiplier: 3, winType: 'backgammon' };
    }
    return { multiplier: 2, winType: 'gammon' };
}

/**
 * Simule une partie complète entre `engineX` et `engineO` avec la séquence de dés fournie.
 */
export function playDuplicateGame(
    engineX: DuplicateEngineAdapter,
    engineO: DuplicateEngineAdapter,
    diceSequence: ReadonlyArray<[number, number]>,
    options: { matchLength?: number; enableCube?: boolean; maxTurns?: number } = {},
): DuplicateGameOutcome {
    const matchLength = options.matchLength ?? 0;
    const enableCube = options.enableCube ?? true;
    const maxTurns = options.maxTurns ?? 220;

    let state: BoardState = {
        ...createInitialState(matchLength),
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
    };

    for (let turnIdx = 0; turnIdx < maxTurns; turnIdx++) {
        const activePlayer = state.turn;
        const opponent: Player = activePlayer === 'X' ? 'O' : 'X';
        const activeEngine = activePlayer === 'X' ? engineX : engineO;
        const oppEngine = activePlayer === 'X' ? engineO : engineX;

        // 1. Décision de videau avant le lancer (à partir du tour 2)
        if (
            enableCube &&
            turnIdx >= 2 &&
            state.cubeValue < 64 &&
            (state.cubeOwner === null || state.cubeOwner === activePlayer)
        ) {
            const doublerDecision = activeEngine.decideCube(state);
            if (doublerDecision.shouldOfferDouble) {
                const oppState: BoardState = { ...state, turn: opponent, dice: null };
                const takerDecision = oppEngine.decideCube(oppState);
                if (!takerDecision.shouldTakeIfOffered) {
                    return {
                        winner: activePlayer,
                        pointsWon: state.cubeValue,
                        winType: 'pass',
                        cubeValue: state.cubeValue,
                        turnsPlayed: turnIdx + 1,
                    };
                }
                state = {
                    ...state,
                    cubeValue: state.cubeValue * 2,
                    cubeOwner: opponent,
                };
            }
        }

        // 2. Jet de dés déterministe
        const dice = diceSequence[turnIdx % diceSequence.length] ?? [3, 1];
        state = { ...state, dice };

        const chosenSeq = activeEngine.selectMove(state, dice);
        const nextBoard = chosenSeq ? chosenSeq.board : state.board;

        if (borneOffCount(nextBoard, activePlayer) >= 15) {
            const { multiplier, winType } = computeWinMultiplier(nextBoard, activePlayer);
            return {
                winner: activePlayer,
                pointsWon: multiplier * state.cubeValue,
                winType,
                cubeValue: state.cubeValue,
                turnsPlayed: turnIdx + 1,
            };
        }

        state = {
            ...state,
            board: nextBoard,
            turn: opponent,
            dice: null,
        };
    }

    // Départage au pip count si maxTurns atteint
    const offX = borneOffCount(state.board, 'X');
    const offO = borneOffCount(state.board, 'O');
    const winner: Player = offX >= offO ? 'X' : 'O';
    return {
        winner,
        pointsWon: state.cubeValue,
        winType: 'single',
        cubeValue: state.cubeValue,
        turnsPlayed: maxTurns,
    };
}

/**
 * Exécute un championnat de $N$ paires Duplicate ($2N$ parties) entre `engineA` et `engineB`.
 */
export function runDuplicateMatchSeries(
    engineA: DuplicateEngineAdapter,
    engineB: DuplicateEngineAdapter,
    pairCount: number,
    options: { baseSeed?: number; matchLength?: number; enableCube?: boolean } = {},
): DuplicateSeriesReport {
    const baseSeed = options.baseSeed ?? 20261031;
    const pairs: DuplicatePairOutcome[] = [];

    let winsA = 0;
    let winsB = 0;
    let totalPointsA = 0;
    let totalPointsB = 0;

    for (let i = 0; i < pairCount; i++) {
        const seed = baseSeed + i * 7919;
        const diceSeq = createDuplicateDiceSequence(seed, 240);

        // Manche Aller : A = X, B = O
        const leg1Aller = playDuplicateGame(engineA, engineB, diceSeq, options);
        // Manche Retour : B = X, A = O avec la MÊME séquence de dés
        const leg2Retour = playDuplicateGame(engineB, engineA, diceSeq, options);

        const ptsAllerA = leg1Aller.winner === 'X' ? leg1Aller.pointsWon : -leg1Aller.pointsWon;
        const ptsRetourA = leg2Retour.winner === 'O' ? leg2Retour.pointsWon : -leg2Retour.pointsWon;

        if (leg1Aller.winner === 'X') {
            winsA++;
            totalPointsA += leg1Aller.pointsWon;
        } else {
            winsB++;
            totalPointsB += leg1Aller.pointsWon;
        }

        if (leg2Retour.winner === 'O') {
            winsA++;
            totalPointsA += leg2Retour.pointsWon;
        } else {
            winsB++;
            totalPointsB += leg2Retour.pointsWon;
        }

        pairs.push({
            seed,
            leg1Aller,
            leg2Retour,
            netPointsForA: ptsAllerA + ptsRetourA,
        });
    }

    const totalGamesPlayed = pairCount * 2;
    const netPointsA = totalPointsA - totalPointsB;

    return {
        engineA: engineA.name,
        engineB: engineB.name,
        pairsPlayed: pairCount,
        totalGamesPlayed,
        winsA,
        winsB,
        winRateA: Number(((winsA / Math.max(1, totalGamesPlayed)) * 100).toFixed(2)),
        totalPointsA,
        totalPointsB,
        netPointsA,
        netPointsPerPair: Number((netPointsA / Math.max(1, pairCount)).toFixed(4)),
        netPointsPerGame: Number((netPointsA / Math.max(1, totalGamesPlayed)).toFixed(4)),
        pairs,
    };
}

/**
 * Adaptateur pour le moteur propriétaire `BT-Core v2.0`.
 */
export function createBtCoreDuplicateAdapter(ply = 2): DuplicateEngineAdapter {
    return {
        id: `bt-core-${ply}ply`,
        name: `BT-Core v2.0 (${ply}-ply)`,
        selectMove(state, dice) {
            const res = analyzeBtCoreMoves(state, dice, { ply, maxMoves: 1, timeBudgetMs: 60 });
            if (res.bestMove && res.bestMove.moves && res.bestMove.board) {
                return { moves: res.bestMove.moves, board: res.bestMove.board };
            }
            const legal = generateLegalMoves(state, dice);
            return legal[0] ?? null;
        },
        decideCube(state) {
            const cube = analyzeBtCoreCube(state);
            const shouldOfferDouble = Boolean(cube.optimalAction?.startsWith('Double'));
            // Du point de vue du receveur (state.turn = receveur), on vérifie si l'adversaire aurait un Double/Pass
            const opp: Player = state.turn === 'X' ? 'O' : 'X';
            const oppCube = analyzeBtCoreCube({ ...state, turn: opp, cubeOwner: state.cubeOwner === opp ? opp : null });
            const shouldTakeIfOffered = oppCube.optimalAction !== 'Double, pass';
            return { shouldOfferDouble, shouldTakeIfOffered };
        },
    };
}

/**
 * Adaptateur de référence (Baseline Legacy 0-ply/1-ply).
 */
export function createLegacyBaselineAdapter(ply = 0): DuplicateEngineAdapter {
    return {
        id: `legacy-${ply}ply`,
        name: `Baseline Legacy (${ply}-ply)`,
        selectMove(state, dice) {
            const res = analyzeBoardMoves(state, dice, { ply, maxMoves: 1 });
            if (res.bestMove && res.bestMove.moves && res.bestMove.board) {
                return { moves: res.bestMove.moves, board: res.bestMove.board };
            }
            const legal = generateLegalMoves(state, dice);
            return legal[0] ?? null;
        },
        decideCube(state) {
            const cube = analyzeBoardCube(state, { ply });
            const shouldOfferDouble = Boolean(cube.optimalAction?.startsWith('Double'));
            const opp: Player = state.turn === 'X' ? 'O' : 'X';
            const oppCube = analyzeBoardCube({ ...state, turn: opp, cubeOwner: state.cubeOwner === opp ? opp : null }, { ply });
            const shouldTakeIfOffered = oppCube.optimalAction !== 'Double, pass';
            return { shouldOfferDouble, shouldTakeIfOffered };
        },
    };
}

