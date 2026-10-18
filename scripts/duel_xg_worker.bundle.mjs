// scripts/duel_xg_worker.ts
import fs from "fs";
import { parentPort, workerData } from "worker_threads";

// src/engine/backgammonEngine.ts
var X_BAR = 0;
var O_BAR = 25;
var X_OFF = 0;
var O_OFF = 25;
var CHECKERS_PER_PLAYER = 15;
function createInitialState(matchLength = 0) {
  const board = new Array(26).fill(0);
  board[1] = -2;
  board[6] = 5;
  board[8] = 3;
  board[12] = -5;
  board[13] = 5;
  board[17] = -3;
  board[19] = -5;
  board[24] = 2;
  return {
    board,
    turn: "X",
    cubeValue: 1,
    cubeOwner: null,
    dice: null,
    matchLength,
    scoreX: 0,
    scoreO: 0,
    crawford: false,
    doubled: false,
    resigned: 0
  };
}
function borneOffCount(board, player) {
  let onBoard = 0;
  for (let p = 1; p <= 24; p++) {
    const v = board[p];
    if (player === "X" && v > 0) onBoard += v;
    if (player === "O" && v < 0) onBoard += -v;
  }
  if (player === "X") onBoard += Math.max(0, board[X_BAR]);
  else onBoard += Math.max(0, -board[O_BAR]);
  return CHECKERS_PER_PLAYER - onBoard;
}
function isBlocked(board, point, player) {
  const v = board[point];
  return player === "X" ? v <= -2 : v >= 2;
}
function isAllInHome(board, player) {
  if (player === "X") {
    if (board[X_BAR] > 0) return false;
    for (let p = 7; p <= 24; p++) if (board[p] > 0) return false;
    return true;
  }
  if (board[O_BAR] < 0) return false;
  for (let p = 1; p <= 18; p++) if (board[p] < 0) return false;
  return true;
}
function isHighestOccupied(board, point) {
  for (let p = point + 1; p <= 24; p++) if (board[p] > 0) return false;
  return true;
}
function isLowestOccupied(board, point) {
  for (let p = 1; p < point; p++) if (board[p] < 0) return false;
  return true;
}
function generateSingleMoves(board, player, die) {
  const moves = [];
  if (player === "X") {
    if (board[X_BAR] > 0) {
      const dest = 25 - die;
      if (dest >= 1 && dest <= 24 && !isBlocked(board, dest, "X")) {
        moves.push({ from: X_BAR, to: dest });
      }
      return moves;
    }
    const allHome = isAllInHome(board, "X");
    for (let p = 1; p <= 24; p++) {
      if (board[p] <= 0) continue;
      const dest = p - die;
      if (dest >= 1) {
        if (!isBlocked(board, dest, "X")) moves.push({ from: p, to: dest });
      } else if (allHome) {
        if (dest === 0) moves.push({ from: p, to: X_OFF });
        else if (dest < 0 && isHighestOccupied(board, p)) moves.push({ from: p, to: X_OFF });
      }
    }
  } else {
    if (board[O_BAR] < 0) {
      const dest = die;
      if (dest >= 1 && dest <= 24 && !isBlocked(board, dest, "O")) {
        moves.push({ from: O_BAR, to: dest });
      }
      return moves;
    }
    const allHome = isAllInHome(board, "O");
    for (let p = 1; p <= 24; p++) {
      if (board[p] >= 0) continue;
      const dest = p + die;
      if (dest <= 24) {
        if (!isBlocked(board, dest, "O")) moves.push({ from: p, to: dest });
      } else if (allHome) {
        if (dest === 25) moves.push({ from: p, to: O_OFF });
        else if (dest > 25 && isLowestOccupied(board, p)) moves.push({ from: p, to: O_OFF });
      }
    }
  }
  return moves;
}
function applyMove(board, move, player) {
  const b = board.slice();
  const { from, to } = move;
  if (player === "X") {
    b[from] -= 1;
    if (to !== X_OFF) {
      if (b[to] === -1) {
        b[to] = 1;
        b[O_BAR] -= 1;
      } else {
        b[to] += 1;
      }
    }
  } else {
    b[from] += 1;
    if (to !== O_OFF) {
      if (b[to] === 1) {
        b[to] = -1;
        b[X_BAR] += 1;
      } else {
        b[to] -= 1;
      }
    }
  }
  return b;
}
function moveDistance(move, player) {
  const { from, to } = move;
  if (player === "X") {
    if (from === X_BAR) return 25 - to;
    if (to === X_OFF) return from;
    return from - to;
  }
  if (from === O_BAR) return to;
  if (to === O_OFF) return 25 - from;
  return to - from;
}
function generateSequences(board, player, dice, index, current, results) {
  if (index === dice.length) {
    if (current.length > 0) {
      results.push({ moves: [...current], board });
    }
    return;
  }
  const die = dice[index];
  const singles = generateSingleMoves(board, player, die);
  if (singles.length === 0) {
    generateSequences(board, player, dice, index + 1, current, results);
    return;
  }
  for (const move of singles) {
    const next = applyMove(board, move, player);
    generateSequences(next, player, dice, index + 1, [...current, move], results);
  }
}
function boardKey(board) {
  return board.join(",");
}
function generateLegalMoves(state, dice) {
  const [d1, d2] = dice;
  if (d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) {
    throw new Error(`D\xE9s invalides : [${d1}, ${d2}]`);
  }
  const player = state.turn;
  const orders = d1 === d2 ? [[d1, d1, d1, d1]] : [[d1, d2], [d2, d1]];
  const all = [];
  for (const order of orders) {
    generateSequences(state.board, player, order, 0, [], all);
  }
  if (all.length === 0) return [];
  const maxDice = Math.max(...all.map((s) => s.moves.length));
  let filtered = all.filter((s) => s.moves.length === maxDice);
  const onBar = player === "X" ? state.board[X_BAR] > 0 : state.board[O_BAR] < 0;
  if (maxDice === 1 && d1 !== d2 && !onBar) {
    const used = new Set(filtered.map((s) => moveDistance(s.moves[0], player)));
    if (used.size === 2) {
      const higher = Math.max(d1, d2);
      filtered = filtered.filter((s) => moveDistance(s.moves[0], player) === higher);
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const s of filtered) {
    const key = onBar && s.moves.length > 0 ? `${s.moves[0].from}:${s.moves[0].to}|${boardKey(s.board)}` : boardKey(s.board);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(s);
    }
  }
  return result;
}

// src/lib/engine/bearoffTable.ts
var HOME_POINTS = 6;
var MAX_CHECKERS = 15;
var BINOM = (() => {
  const N = MAX_CHECKERS + HOME_POINTS + 1;
  const table = [];
  for (let n = 0; n <= N; n++) {
    table[n] = new Array(HOME_POINTS + 1).fill(0);
    table[n][0] = 1;
    for (let k = 1; k <= HOME_POINTS; k++) {
      table[n][k] = table[n - 1]?.[k] ?? 0;
      if (n >= 1) table[n][k] += table[n - 1][k - 1];
    }
  }
  return table;
})();

// src/engine/aiHeuristics.ts
function evaluateWin(board, cubeValue = 1) {
  const validCube = cubeValue && cubeValue > 0 ? cubeValue : 1;
  const xOff = borneOffCount(board, "X");
  const oOff = borneOffCount(board, "O");
  if (xOff === 15) {
    const winner = "X";
    const loser = "O";
    if (oOff > 0) {
      return { winner, loser, winType: "single", multiplier: 1, pointsWon: validCube };
    }
    let inHomeOrBar = board[O_BAR] < 0;
    if (!inHomeOrBar) {
      for (let p = 1; p <= 6; p++) {
        if (board[p] < 0) {
          inHomeOrBar = true;
          break;
        }
      }
    }
    if (inHomeOrBar) {
      return { winner, loser, winType: "backgammon", multiplier: 3, pointsWon: 3 * validCube };
    }
    return { winner, loser, winType: "gammon", multiplier: 2, pointsWon: 2 * validCube };
  }
  if (oOff === 15) {
    const winner = "O";
    const loser = "X";
    if (xOff > 0) {
      return { winner, loser, winType: "single", multiplier: 1, pointsWon: validCube };
    }
    let inHomeOrBar = board[X_BAR] > 0;
    if (!inHomeOrBar) {
      for (let p = 19; p <= 24; p++) {
        if (board[p] > 0) {
          inHomeOrBar = true;
          break;
        }
      }
    }
    if (inHomeOrBar) {
      return { winner, loser, winType: "backgammon", multiplier: 3, pointsWon: 3 * validCube };
    }
    return { winner, loser, winType: "gammon", multiplier: 2, pointsWon: 2 * validCube };
  }
  return null;
}

// scripts/duel_xg_worker.ts
var wasmBuffer = fs.readFileSync("public/engine/xg_web_core.wasm");
var wasmModule = await WebAssembly.instantiate(wasmBuffer, {});
var wasm = wasmModule.instance.exports;
wasm.xg_init();
var memory = wasm.memory;
var boardPtr = 4096;
var outPtr = 8192;
function areMovesEqual(m1, m2) {
  if (m1.length !== m2.length) return false;
  for (let i = 0; i < m1.length; i++) {
    if (m1[i].from !== m2[i].from || m1[i].to !== m2[i].to) return false;
  }
  return true;
}
function areBoardsEqual(b1, b2) {
  if (b1.length !== b2.length) return false;
  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) return false;
  }
  return true;
}
function getWasmMove(board, player, dice, legalSeqs, ply) {
  if (legalSeqs.length <= 1) {
    return { seq: legalSeqs[0], equity: 0 };
  }
  const boardBytes = new Int8Array(memory.buffer, boardPtr, 26);
  for (let i = 0; i < 26; i++) {
    boardBytes[i] = board[i];
  }
  const turn = player === "X" ? 1 : -1;
  wasm.xg_search_moves(boardPtr, turn, dice[0], dice[1], ply, outPtr);
  const results = new Float32Array(memory.buffer, outPtr, 200);
  const count2 = Math.min(8, Math.floor(results[0]));
  if (count2 === 0) return { seq: legalSeqs[0], equity: 0 };
  const subCount = Math.round(results[1 + 8]);
  const wasmMoves = [];
  for (let m = 0; m < subCount; m++) {
    wasmMoves.push({
      from: Math.round(results[1 + m * 2]),
      to: Math.round(results[1 + m * 2 + 1])
    });
  }
  const equity = results[1 + 9];
  for (const s of legalSeqs) {
    if (areMovesEqual(s.moves, wasmMoves)) return { seq: s, equity };
  }
  let simulated = [...board];
  for (const m of wasmMoves) simulated = applyMove(simulated, m, player);
  for (const s of legalSeqs) {
    if (areBoardsEqual(s.board, simulated)) return { seq: s, equity };
  }
  if (wasmMoves.length > 0) {
    for (const s of legalSeqs) {
      if (s.moves.length > 0 && s.moves[0].from === wasmMoves[0].from && s.moves[0].to === wasmMoves[0].to) {
        return { seq: s, equity };
      }
    }
  }
  return { seq: legalSeqs[0], equity };
}
function mulberry32(seed2) {
  let a = seed2 >>> 0;
  return () => {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rollDice(rng2) {
  return [1 + Math.floor(rng2() * 6), 1 + Math.floor(rng2() * 6)];
}
var { workerId, startIdx, count, seed } = workerData;
var rng = mulberry32(seed);
var stats = {
  games: 0,
  winsXGPlus: 0,
  winsExpert: 0,
  gammonsXGPlus: 0,
  gammonsExpert: 0,
  pointsXGPlus: 0,
  pointsExpert: 0,
  divergentMoves: 0,
  totalDecisions: 0
};
for (let i = 0; i < count; i++) {
  const gameNum = startIdx + i;
  const xgPlusPlayer = gameNum % 2 === 1 ? "X" : "O";
  const expertPlayer = xgPlusPlayer === "X" ? "O" : "X";
  let state = createInitialState(0);
  let gameOver = false;
  let turns = 0;
  let d1 = 1, d2 = 1;
  while (d1 === d2) {
    d1 = 1 + Math.floor(rng() * 6);
    d2 = 1 + Math.floor(rng() * 6);
  }
  let currentTurn = d1 > d2 ? "X" : "O";
  let initialDice = [d1, d2];
  while (!gameOver && turns < 250) {
    turns++;
    const dice = initialDice ? initialDice : rollDice(rng);
    initialDice = null;
    const player = currentTurn;
    const opponent = player === "X" ? "O" : "X";
    const legalSeqs = generateLegalMoves({ ...state, turn: player }, dice);
    if (legalSeqs.length === 0) {
      currentTurn = opponent;
      continue;
    }
    const isXGPlusTurn = player === xgPlusPlayer;
    let chosenSeq;
    if (legalSeqs.length > 1) {
      stats.totalDecisions++;
    }
    if (isXGPlusTurn) {
      const res3 = getWasmMove(state.board, player, dice, legalSeqs, 3);
      chosenSeq = res3.seq;
    } else {
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
      const isXGPlusWin = res.winner === xgPlusPlayer;
      if (isXGPlusWin) {
        stats.winsXGPlus++;
        stats.pointsXGPlus += res.pointsWon;
        if (res.winType === "gammon" || res.winType === "backgammon") stats.gammonsXGPlus++;
      } else {
        stats.winsExpert++;
        stats.pointsExpert += res.pointsWon;
        if (res.winType === "gammon" || res.winType === "backgammon") stats.gammonsExpert++;
      }
      gameOver = true;
      break;
    }
    state = { ...state, board: newBoard, turn: opponent };
    currentTurn = opponent;
  }
  if ((i + 1) % 25 === 0 || i + 1 === count) {
    parentPort?.postMessage({
      type: "PROGRESS",
      workerId,
      stats
    });
  }
}
parentPort?.postMessage({
  type: "DONE",
  workerId,
  stats
});
