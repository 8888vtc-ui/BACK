/**
 * Worker unitaire pour la simulation parallèle du Duel 6 000 parties.
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
import { evaluateWin, selectBestOpponentSequence } from '../src/engine/aiHeuristics';

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

function getWasmMoveAndEval(
    board: number[],
    player: Player,
    dice: [number, number],
    legalSeqs: MoveSequence[],
): {
    bestSeq: MoveSequence;
    bestEquity: number;
    topMoves: ScoredCandidate[];
} {
    if (legalSeqs.length <= 1) {
        return {
            bestSeq: legalSeqs[0],
            bestEquity: 0,
            topMoves: legalSeqs.length === 1 ? [{ moves: legalSeqs[0].moves, equity: 0, board: legalSeqs[0].board }] : [],
        };
    }

    const boardBytes = new Int8Array(memory.buffer, boardPtr, 26);
    for (let i = 0; i < 26; i++) {
        boardBytes[i] = board[i];
    }

    const turn = player === 'X' ? 1 : -1;
    wasm.xg_search_moves(boardPtr, turn, dice[0], dice[1], 2, outPtr);

    const results = new Float32Array(memory.buffer, outPtr, 200);
    const count = Math.min(8, Math.floor(results[0]));

    const topMoves: ScoredCandidate[] = [];

    for (let k = 0; k < count; k++) {
        const base = 1 + k * 18;
        const subCount = Math.round(results[base + 8]);
        const mvs: Array<{ from: number; to: number }> = [];
        for (let m = 0; m < subCount; m++) {
            mvs.push({
                from: Math.round(results[base + m * 2]),
                to: Math.round(results[base + m * 2 + 1]),
            });
        }
        const eq = results[base + 9];

        let b = [...board];
        for (const mv of mvs) {
            b = applyMove(b, mv, player);
        }
        topMoves.push({ moves: mvs, equity: eq, board: b });
    }

    const bestEquity = topMoves[0]?.equity ?? 0;

    let bestSeq = legalSeqs[0];
    if (topMoves.length > 0) {
        const first = topMoves[0];
        const exactMatch = legalSeqs.find(seq => areMovesEqual(seq.moves, first.moves));
        if (exactMatch) {
            bestSeq = exactMatch;
        } else if (first.board) {
            const boardMatch = legalSeqs.find(seq => areBoardsEqual(seq.board, first.board!));
            if (boardMatch) {
                bestSeq = boardMatch;
            } else if (first.moves.length > 0) {
                const partial = legalSeqs.find(seq =>
                    seq.moves.length > 0 &&
                    seq.moves[0].from === first.moves[0].from &&
                    seq.moves[0].to === first.moves[0].to
                );
                if (partial) bestSeq = partial;
            }
        }
    }

    return { bestSeq, bestEquity, topMoves };
}

function getMoveEquityFromWasm(
    seq: MoveSequence,
    topMoves: ScoredCandidate[],
    bestEquity: number,
): number {
    if (topMoves.length === 0) return bestEquity;

    const seqMatch = topMoves.find(tm => areMovesEqual(tm.moves, seq.moves));
    if (seqMatch !== undefined) return seqMatch.equity;

    if (seq.board) {
        const boardMatch = topMoves.find(tm => tm.board && areBoardsEqual(tm.board, seq.board));
        if (boardMatch !== undefined) return boardMatch.equity;
    }

    const worstTop = topMoves[topMoves.length - 1].equity;
    return Math.min(worstTop - 0.035, bestEquity - 0.080);
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

// Réception du travail : startIdx, count, seed
const { workerId, startIdx, count, seed } = workerData;
const rng = mulberry32(seed);

const stats = {
    games: 0,
    winsActuel: 0,
    winsNouveau: 0,
    gammonsActuel: 0,
    gammonsNouveau: 0,
    bgActuel: 0,
    bgNouveau: 0,
    pointsActuel: 0,
    pointsNouveau: 0,
    decisionsActuel: 0,
    decisionsNouveau: 0,
    lossActuel: 0,
    lossNouveau: 0,
    blundersActuel: 0,
    blundersNouveau: 0,
    errorsActuel: 0,
    errorsNouveau: 0,
};

for (let i = 0; i < count; i++) {
    const gameNum = startIdx + i;
    // Alternance stricte des couleurs :
    // gameNum impair : Actuel = 'X', Nouveau = 'O'
    // gameNum pair   : Nouveau = 'X', Actuel = 'O'
    const botActuelPlayer: Player = gameNum % 2 === 1 ? 'X' : 'O';
    const botNouveauPlayer: Player = botActuelPlayer === 'X' ? 'O' : 'X';

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

        const isActuelTurn = (player === botActuelPlayer);

        const { bestSeq: wasmBestSeq, bestEquity, topMoves } = getWasmMoveAndEval(
            state.board,
            player,
            dice,
            legalSeqs,
        );

        let chosenSeq: MoveSequence;

        if (isActuelTurn) {
            const chosen = selectBestOpponentSequence(legalSeqs, player, 'expert');
            chosenSeq = chosen ?? legalSeqs[0];

            if (legalSeqs.length > 1) {
                const chosenEq = getMoveEquityFromWasm(chosenSeq, topMoves, bestEquity);
                const loss = Math.max(0, bestEquity - chosenEq);
                stats.decisionsActuel++;
                stats.lossActuel += loss;
                if (loss >= 0.080) stats.blundersActuel++;
                else if (loss >= 0.020) stats.errorsActuel++;
            }
        } else {
            chosenSeq = wasmBestSeq;

            if (legalSeqs.length > 1) {
                const chosenEq = getMoveEquityFromWasm(chosenSeq, topMoves, bestEquity);
                const loss = Math.max(0, bestEquity - chosenEq);
                stats.decisionsNouveau++;
                stats.lossNouveau += loss;
                if (loss >= 0.080) stats.blundersNouveau++;
                else if (loss >= 0.020) stats.errorsNouveau++;
            }
        }

        let newBoard = state.board;
        for (const m of chosenSeq.moves) {
            newBoard = applyMove(newBoard, m, player);
        }

        const res = evaluateWin(newBoard, 1);
        if (res) {
            stats.games++;
            const isActuelWin = (res.winner === botActuelPlayer);

            if (isActuelWin) {
                stats.winsActuel++;
                stats.pointsActuel += res.pointsWon;
                if (res.winType === 'gammon') stats.gammonsActuel++;
                if (res.winType === 'backgammon') stats.bgActuel++;
            } else {
                stats.winsNouveau++;
                stats.pointsNouveau += res.pointsWon;
                if (res.winType === 'gammon') stats.gammonsNouveau++;
                if (res.winType === 'backgammon') stats.bgNouveau++;
            }
            gameOver = true;
            break;
        }

        state = { ...state, board: newBoard, turn: opponent };
        currentTurn = opponent;
    }

    // Rapport d'avancement par batch de 20 parties
    if ((i + 1) % 20 === 0 || i + 1 === count) {
        parentPort?.postMessage({
            type: 'PROGRESS',
            workerId,
            completedInBatch: (i + 1) % 20 === 0 ? 20 : (count % 20),
            stats,
        });
    }
}

parentPort?.postMessage({
    type: 'DONE',
    workerId,
    stats,
});
