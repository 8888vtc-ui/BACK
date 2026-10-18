/**
 * Worker pour le Duel XG++++ (3-Ply Sélectif) vs EXPERT (2-Ply).
 */

import fs from 'fs';
import { parentPort, workerData } from 'worker_threads';
import {
    BoardState,
    Player,
    MoveSequence,
    createInitialState,
    generateLegalMoves,
    applyMove,
} from '../src/engine/backgammonEngine';
import { evaluateWin } from '../src/engine/aiHeuristics';

// Instanciation WASM dédiée au thread
const wasmBuffer = fs.readFileSync('public/engine/xg_web_core.wasm');
const wasmModule = await WebAssembly.instantiate(wasmBuffer, {});
const wasm = wasmModule.instance.exports as any;
wasm.xg_init();

const memory = wasm.memory;
const boardPtr = 4096;
const outPtr = 8192;

interface ScoredCandidate {
    moves: Array<{ from: number; to: number }>;
    equity: number;
    board?: number[];
}

function areMovesEqual(m1: Array<{ from: number; to: number }>, m2: Array<{ from: number; to: number }>): boolean {
    if (m1.length !== m2.length) return false;
    for (let i = 0; i < m1.length; i++) {
        if (m1[i].from !== m2[i].from || m1[i].to !== m2[i].to) return false;
    }
    return true;
}

function areBoardsEqual(b1: number[], b2: number[]): boolean {
    if (b1.length !== b2.length) return false;
    for (let i = 0; i < b1.length; i++) {
        if (b1[i] !== b2[i]) return false;
    }
    return true;
}

function getWasmMove(
    board: number[],
    player: Player,
    dice: [number, number],
    legalSeqs: MoveSequence[],
    ply: number,
): { seq: MoveSequence; equity: number } {
    if (legalSeqs.length <= 1) {
        return { seq: legalSeqs[0], equity: 0 };
    }

    const boardBytes = new Int8Array(memory.buffer, boardPtr, 26);
    for (let i = 0; i < 26; i++) {
        boardBytes[i] = board[i];
    }

    const turn = player === 'X' ? 1 : -1;
    wasm.xg_search_moves(boardPtr, turn, dice[0], dice[1], ply, outPtr);

    const results = new Float32Array(memory.buffer, outPtr, 200);
    const count = Math.min(8, Math.floor(results[0]));
    if (count === 0) return { seq: legalSeqs[0], equity: 0 };

    const subCount = Math.round(results[1 + 8]);
    const wasmMoves: Array<{ from: number; to: number }> = [];
    for (let m = 0; m < subCount; m++) {
        wasmMoves.push({
            from: Math.round(results[1 + m * 2]),
            to: Math.round(results[1 + m * 2 + 1]),
        });
    }

    const equity = results[1 + 9];

    // 1. Égalité exacte
    for (const s of legalSeqs) {
        if (areMovesEqual(s.moves, wasmMoves)) return { seq: s, equity };
    }

    // 2. Transposition
    let simulated = [...board];
    for (const m of wasmMoves) simulated = applyMove(simulated, m, player);
    for (const s of legalSeqs) {
        if (areBoardsEqual(s.board, simulated)) return { seq: s, equity };
    }

    // 3. Premier coup
    if (wasmMoves.length > 0) {
        for (const s of legalSeqs) {
            if (s.moves.length > 0 && s.moves[0].from === wasmMoves[0].from && s.moves[0].to === wasmMoves[0].to) {
                return { seq: s, equity };
            }
        }
    }

    return { seq: legalSeqs[0], equity };
}

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

function rollDice(rng: () => number): [number, number] {
    return [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)];
}

const { workerId, startIdx, count, seed } = workerData;
const rng = mulberry32(seed);

const stats = {
    games: 0,
    winsXGPlus: 0,
    winsExpert: 0,
    gammonsXGPlus: 0,
    gammonsExpert: 0,
    pointsXGPlus: 0,
    pointsExpert: 0,
    divergentMoves: 0,
    totalDecisions: 0,
};

for (let i = 0; i < count; i++) {
    const gameNum = startIdx + i;
    // Alternance stricte des couleurs :
    // Impair : XG++++ = 'X', Expert = 'O'
    // Pair   : Expert = 'X', XG++++ = 'O'
    const xgPlusPlayer: Player = gameNum % 2 === 1 ? 'X' : 'O';
    const expertPlayer: Player = xgPlusPlayer === 'X' ? 'O' : 'X';

    let state: BoardState = createInitialState(0);
    let gameOver = false;
    let turns = 0;

    let d1 = 1, d2 = 1;
    while (d1 === d2) {
        d1 = 1 + Math.floor(rng() * 6);
        d2 = 1 + Math.floor(rng() * 6);
    }
    let currentTurn: Player = d1 > d2 ? 'X' : 'O';
    let initialDice: [number, number] | null = [d1, d2];

    while (!gameOver && turns < 250) {
        turns++;
        const dice = initialDice ? initialDice : rollDice(rng);
        initialDice = null;

        const player = currentTurn;
        const opponent: Player = player === 'X' ? 'O' : 'X';

        const legalSeqs = generateLegalMoves({ ...state, turn: player }, dice);
        if (legalSeqs.length === 0) {
            currentTurn = opponent;
            continue;
        }

        const isXGPlusTurn = (player === xgPlusPlayer);
        let chosenSeq: MoveSequence;

        if (legalSeqs.length > 1) {
            stats.totalDecisions++;
        }

        if (isXGPlusTurn) {
            // XG++++ joue avec 3-ply sélectif
            const res3 = getWasmMove(state.board, player, dice, legalSeqs, 3);
            chosenSeq = res3.seq;
        } else {
            // Expert joue avec 2-ply
            const res2 = getWasmMove(state.board, player, dice, legalSeqs, 2);
            chosenSeq = res2.seq;
        }

        let newBoard = state.board;
        for (const m of chosenSeq.moves) {
            newBoard = applyMove(newBoard, m, player);
        }

        const res = evaluateWin(newBoard, 1);
        if (res) {
            stats.games++;
            const isXGPlusWin = (res.winner === xgPlusPlayer);

            if (isXGPlusWin) {
                stats.winsXGPlus++;
                stats.pointsXGPlus += res.pointsWon;
                if (res.winType === 'gammon' || res.winType === 'backgammon') stats.gammonsXGPlus++;
            } else {
                stats.winsExpert++;
                stats.pointsExpert += res.pointsWon;
                if (res.winType === 'gammon' || res.winType === 'backgammon') stats.gammonsExpert++;
            }
            gameOver = true;
            break;
        }

        state = { ...state, board: newBoard, turn: opponent };
        currentTurn = opponent;
    }

    if ((i + 1) % 25 === 0 || i + 1 === count) {
        parentPort?.postMessage({
            type: 'PROGRESS',
            workerId,
            stats,
        });
    }
}

parentPort?.postMessage({
    type: 'DONE',
    workerId,
    stats,
});
