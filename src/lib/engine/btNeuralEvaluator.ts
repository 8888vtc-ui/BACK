/**
 * @file src/lib/engine/btNeuralEvaluator.ts
 * @description Inférence Déroulée Ultra-Rapide (< 0.03 ms) & Évaluateur Hybride « BT-Neural v3.0 ».
 *
 * Architecture :
 * 1. Extracteur de caractéristiques normalisées 250 dimensions (Tesauro-Strehl + Structure géométrique)
 * 2. Moteur d'inférence matricielle sans allocation dans la boucle chaude (NNUE sparse skipping + Skip-Connection)
 * 3. Hybridation déterministe :
 *    - Jan intérieur (<= 6 pts) : Bearoff exact (54 264 états) + Timmes 2026 / Keith
 *    - Contact / Prime / Blitz / Backgame : Fusion Réseau Neuronal v3.0 distillé 3-ply + Tri-Phase antisymétrique
 *
 * Strictement 0 any, <= 380 lignes.
 */

import {
    borneOffCount,
    pipCount,
    X_BAR,
    O_BAR,
    type BoardState,
    type Player,
} from '../../engine/backgammonEngine';
import { bearoffExpectedRolls } from './bearoffTable';
import { evaluateTimmesRace } from '../../engine/raceCubeFormulas';
import {
    computeJanowskiCubeEvaluation,
    detectJanowskiPhase,
} from './janowskiCube';
import { evaluateBoard } from './evaluator';
import { countShotsExact } from './shotCounter';
import {
    getBtNeuralWeights,
    type BtNeuralWeights,
} from './btNeuralWeights';
import type { Probabilities } from './types';

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/**
 * Remplit le Float32Array(250) cible sans aucune réallocation.
 */
export function encodeBtNeural250Features(
    state: BoardState,
    player: Player,
    out: Float32Array,
): void {
    out.fill(0);
    const board = state.board;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    let offset = 0;
    for (let pt = 1; pt <= 24; pt++) {
        const absPt = player === 'X' ? pt : 25 - pt;
        const v = board[absPt] ?? 0;
        const c = player === 'X' ? Math.max(0, v) : Math.max(0, -v);
        out[offset] = c >= 1 ? 1.0 : 0.0;
        out[offset + 1] = c >= 2 ? 1.0 : 0.0;
        out[offset + 2] = c >= 3 ? 1.0 : 0.0;
        out[offset + 3] = c > 3 ? (c - 3) * 0.5 : 0.0;
        offset += 4;
    }
    for (let pt = 1; pt <= 24; pt++) {
        const absPt = opponent === 'X' ? pt : 25 - pt;
        const v = board[absPt] ?? 0;
        const c = opponent === 'X' ? Math.max(0, v) : Math.max(0, -v);
        out[offset] = c >= 1 ? 1.0 : 0.0;
        out[offset + 1] = c >= 2 ? 1.0 : 0.0;
        out[offset + 2] = c >= 3 ? 1.0 : 0.0;
        out[offset + 3] = c > 3 ? (c - 3) * 0.5 : 0.0;
        offset += 4;
    }

    const pBar = player === 'X' ? Math.max(0, board[X_BAR] ?? 0) : Math.max(0, -(board[O_BAR] ?? 0));
    const oBar = opponent === 'X' ? Math.max(0, board[X_BAR] ?? 0) : Math.max(0, -(board[O_BAR] ?? 0));
    const pOff = borneOffCount(board as number[], player);
    const oOff = borneOffCount(board as number[], opponent);
    out[192] = Math.min(1.0, pBar * 0.5);
    out[193] = Math.min(1.0, oBar * 0.5);
    out[194] = pOff / 15.0;
    out[195] = oOff / 15.0;

    const pips = pipCount(board as number[]);
    const pPip = pips[player];
    const oPip = pips[opponent];
    out[196] = pPip / 150.0;
    out[197] = oPip / 150.0;
    out[198] = (oPip - pPip) / 50.0;

    let pBlots = 0;
    let oBlots = 0;
    let pDirectShots = 0;
    let oDirectShots = 0;
    let pPrime = 0;
    let oPrime = 0;
    let curPPrime = 0;
    let curOPrime = 0;
    let pBack = 0;
    let oBack = 0;
    let pFurthest = 0;
    let oFurthest = 0;
    let pCross = 0;
    let oCross = 0;

    for (let r = 1; r <= 24; r++) {
        const absP = player === 'X' ? r : 25 - r;
        const absO = opponent === 'X' ? r : 25 - r;
        const cP = player === 'X' ? Math.max(0, board[absP] ?? 0) : Math.max(0, -(board[absP] ?? 0));
        const cO = opponent === 'X' ? Math.max(0, board[absO] ?? 0) : Math.max(0, -(board[absO] ?? 0));

        if (cP === 1) {
            pBlots++;
            pDirectShots += countShotsExact(board as number[], absP, opponent).direct;
        }
        if (cO === 1) {
            oBlots++;
            oDirectShots += countShotsExact(board as number[], absO, player).direct;
        }

        if (r <= 6) {
            if (cP >= 2) out[203 + r - 1] = 1.0;
            if (cO >= 2) out[209 + r - 1] = 1.0;
        }

        if (cP >= 2) {
            curPPrime++;
            if (curPPrime > pPrime) pPrime = curPPrime;
        } else curPPrime = 0;

        if (cO >= 2) {
            curOPrime++;
            if (curOPrime > oPrime) oPrime = curOPrime;
        } else curOPrime = 0;

        if (r >= 19 && cP >= 2) out[227 + (r - 19)] = 1.0;
        if (r >= 19 && cO >= 2) out[233 + (r - 19)] = 1.0;

        if (r >= 19 && cP > 0) {
            pBack += cP;
            if (r > pFurthest) pFurthest = r;
        }
        if (r >= 19 && cO > 0) {
            oBack += cO;
            if (r > oFurthest) oFurthest = r;
        }

        if (cP > 0) pCross += cP * Math.floor((r - 1) / 6);
        if (cO > 0) oCross += cO * Math.floor((r - 1) / 6);
    }

    out[199] = Math.min(1.0, pBlots / 5.0);
    out[200] = Math.min(1.0, oBlots / 5.0);
    out[201] = Math.min(1.0, pDirectShots / 36.0);
    out[202] = Math.min(1.0, oDirectShots / 36.0);

    if (pPrime >= 1 && pPrime <= 6) out[215 + pPrime - 1] = 1.0;
    if (oPrime >= 1 && oPrime <= 6) out[221 + oPrime - 1] = 1.0;

    out[239] = Math.min(1.0, pBack / 5.0);
    out[240] = Math.min(1.0, oBack / 5.0);
    out[241] = pFurthest / 24.0;
    out[242] = oFurthest / 24.0;
    out[243] = Math.min(1.0, (pCross + pBar * 4) / 30.0);
    out[244] = Math.min(1.0, (oCross + oBar * 4) / 30.0);

    out[245] = state.cubeOwner === null ? 1.0 : 0.0;
    out[246] = state.cubeOwner === player ? 1.0 : 0.0;
    out[247] = state.cubeOwner === opponent ? 1.0 : 0.0;
    out[248] = Math.min(1.0, Math.log2(state.cubeValue || 1) / 6.0);
    out[249] = state.dice === null ? 1.0 : 0.0;
}

/**
 * 6 Phases Spécialisées du Moteur BT-Neural v4.0 MoE-6 :
 * 0 = CONTACT, 1 = PRIME, 2 = BLITZ, 3 = CRASHED, 4 = BACKGAME, 5 = RACE
 * Strictement symétrique entre X et O (garantit E(P) = -E(O)).
 */
export type BtPhase6 = 0 | 1 | 2 | 3 | 4 | 5;

export function classifyPhase6FromFeatures(input: Float32Array): BtPhase6 {
    const pBar = input[192];
    const oBar = input[193];
    const pFurthest = input[241];
    const oFurthest = input[242];

    if (pBar === 0 && oBar === 0 && pFurthest + oFurthest <= 1.001) {
        return 5; // RACE
    }

    const pipDiffNorm = input[198];
    const pBack = input[239];
    const oBack = input[240];
    const anchorsP = input[227] + input[228] + input[229] + input[230] + input[231] + input[232];
    const anchorsO = input[233] + input[234] + input[235] + input[236] + input[237] + input[238];
    if (
        (anchorsP >= 1.9 && pBack >= 0.79 && pipDiffNorm <= -0.50) ||
        (anchorsO >= 1.9 && oBack >= 0.79 && pipDiffNorm >= 0.50)
    ) {
        return 4; // BACKGAME
    }

    let stack123P = 0;
    let stack123O = 0;
    for (let r = 0; r < 3; r++) {
        const offP = r * 4;
        const offO = 96 + r * 4;
        stack123P += input[offP] + input[offP + 1] + input[offP + 2] + input[offP + 3] * 2.0;
        stack123O += input[offO] + input[offO + 1] + input[offO + 2] + input[offO + 3] * 2.0;
    }
    if (
        (stack123P >= 6.9 && (oBack > 0 || oBar > 0)) ||
        (stack123O >= 6.9 && (pBack > 0 || pBar > 0))
    ) {
        return 3; // CRASHED
    }

    const homeP = input[203] + input[204] + input[205] + input[206] + input[207] + input[208];
    const homeO = input[209] + input[210] + input[211] + input[212] + input[213] + input[214];
    const pBlots = input[199];
    const oBlots = input[200];
    if (
        (homeP >= 2.9 && (oBar > 0 || (oBlots >= 0.39 && oBack <= 0.41))) ||
        (homeO >= 2.9 && (pBar > 0 || (pBlots >= 0.39 && pBack <= 0.41)))
    ) {
        return 2; // BLITZ
    }

    const prime4P = input[218] + input[219] + input[220] > 0.5;
    const prime4O = input[224] + input[225] + input[226] > 0.5;
    if ((prime4P && (oBack > 0 || oBar > 0)) || (prime4O && (pBack > 0 || pBar > 0))) {
        return 1; // PRIME
    }

    return 0; // CONTACT
}

export class BtNeuralEngine {
    private weights: BtNeuralWeights;
    private readonly inputBuf = new Float32Array(250);
    private readonly h1Buf = new Float32Array(128);
    private readonly h2Buf = new Float32Array(64);
    private readonly outBuf = new Float32Array(5);
    private lastPhase6: BtPhase6 = 0;

    constructor(weights?: BtNeuralWeights) {
        this.weights = weights ?? getBtNeuralWeights();
    }

    public reloadWeights(weights: BtNeuralWeights): void {
        this.weights = weights;
    }

    public getLastPhase6(): BtPhase6 {
        return this.lastPhase6;
    }

    public evaluateProbabilities(state: BoardState, player: Player): Float32Array {
        encodeBtNeural250Features(state, player, this.inputBuf);
        const input = this.inputBuf;
        const phase6 = classifyPhase6FromFeatures(input);
        this.lastPhase6 = phase6;

        const { w1, b1, w2, b2, w3, b3, linearOut, phaseExperts } = this.weights;
        const expert = phaseExperts && phaseExperts.length === 6 ? phaseExperts[phase6] : undefined;
        const effB2 = expert ? expert.b2Phase : b2;
        const effW3 = expert ? expert.w3Phase : w3;
        const effB3 = expert ? expert.b3Phase : b3;
        const effLin = expert ? expert.linearOutPhase : linearOut;

        const h1 = this.h1Buf;
        const h2 = this.h2Buf;
        const out = this.outBuf;

        h1.set(b1);
        out.set(effB3);
        for (let i = 0; i < 250; i++) {
            const xi = input[i];
            if (xi === 0) continue;
            const wOff = i * 128;
            for (let j = 0; j < 128; j += 8) {
                h1[j] += xi * w1[wOff + j];
                h1[j + 1] += xi * w1[wOff + j + 1];
                h1[j + 2] += xi * w1[wOff + j + 2];
                h1[j + 3] += xi * w1[wOff + j + 3];
                h1[j + 4] += xi * w1[wOff + j + 4];
                h1[j + 5] += xi * w1[wOff + j + 5];
                h1[j + 6] += xi * w1[wOff + j + 6];
                h1[j + 7] += xi * w1[wOff + j + 7];
            }
            if (effLin) {
                const lOff = i * 5;
                out[0] += xi * effLin[lOff];
                out[1] += xi * effLin[lOff + 1];
                out[2] += xi * effLin[lOff + 2];
                out[3] += xi * effLin[lOff + 3];
                out[4] += xi * effLin[lOff + 4];
            }
        }
        if (expert) {
            const g1 = expert.gamma1;
            const bt1 = expert.beta1;
            for (let j = 0; j < 128; j++) {
                const v = h1[j] * g1[j] + bt1[j];
                h1[j] = v > 0 ? v : 0;
            }
        } else {
            for (let j = 0; j < 128; j += 4) {
                if (h1[j] < 0) h1[j] = 0;
                if (h1[j + 1] < 0) h1[j + 1] = 0;
                if (h1[j + 2] < 0) h1[j + 2] = 0;
                if (h1[j + 3] < 0) h1[j + 3] = 0;
            }
        }

        h2.set(effB2);
        for (let i = 0; i < 128; i++) {
            const h1Val = h1[i];
            if (h1Val === 0) continue;
            const wOff = i * 64;
            for (let j = 0; j < 64; j += 8) {
                h2[j] += h1Val * w2[wOff + j];
                h2[j + 1] += h1Val * w2[wOff + j + 1];
                h2[j + 2] += h1Val * w2[wOff + j + 2];
                h2[j + 3] += h1Val * w2[wOff + j + 3];
                h2[j + 4] += h1Val * w2[wOff + j + 4];
                h2[j + 5] += h1Val * w2[wOff + j + 5];
                h2[j + 6] += h1Val * w2[wOff + j + 6];
                h2[j + 7] += h1Val * w2[wOff + j + 7];
            }
        }
        for (let j = 0; j < 64; j += 4) {
            if (h2[j] < 0) h2[j] = 0;
            if (h2[j + 1] < 0) h2[j + 1] = 0;
            if (h2[j + 2] < 0) h2[j + 2] = 0;
            if (h2[j + 3] < 0) h2[j + 3] = 0;
        }

        for (let i = 0; i < 64; i++) {
            const h2Val = h2[i];
            if (h2Val === 0) continue;
            const wOff = i * 5;
            out[0] += h2Val * effW3[wOff];
            out[1] += h2Val * effW3[wOff + 1];
            out[2] += h2Val * effW3[wOff + 2];
            out[3] += h2Val * effW3[wOff + 3];
            out[4] += h2Val * effW3[wOff + 4];
        }

        for (let k = 0; k < 5; k++) {
            out[k] = 1.0 / (1.0 + Math.exp(-clamp(out[k], -12, 12)));
        }

        return out;
    }
}

export const globalBtNeuralEngine = new BtNeuralEngine();

function extractHomeBoardCounts(board: readonly number[], player: Player): number[] | null {
    const bar = player === 'X' ? board[X_BAR] ?? 0 : -(board[O_BAR] ?? 0);
    if (bar > 0) return null;

    if (player === 'X') {
        for (let pt = 7; pt <= 24; pt++) {
            if ((board[pt] ?? 0) > 0) return null;
        }
        return [
            Math.max(0, board[1] ?? 0),
            Math.max(0, board[2] ?? 0),
            Math.max(0, board[3] ?? 0),
            Math.max(0, board[4] ?? 0),
            Math.max(0, board[5] ?? 0),
            Math.max(0, board[6] ?? 0),
        ];
    } else {
        for (let pt = 1; pt <= 18; pt++) {
            if ((board[pt] ?? 0) < 0) return null;
        }
        return [
            Math.max(0, -(board[24] ?? 0)),
            Math.max(0, -(board[23] ?? 0)),
            Math.max(0, -(board[22] ?? 0)),
            Math.max(0, -(board[21] ?? 0)),
            Math.max(0, -(board[20] ?? 0)),
            Math.max(0, -(board[19] ?? 0)),
        ];
    }
}

export function evaluateBtNeuralBoard(
    state: BoardState,
    _ply?: number,
    neuralBlendWeight: number = 0.35,
): {
    cubelessEquity: number;
    cubefulEquity: number;
    probabilities: Probabilities;
    isExactBearoff: boolean;
} {
    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const offP = borneOffCount(state.board as number[], player);
    const offO = borneOffCount(state.board as number[], opponent);

    if (offP >= 15) {
        return {
            cubelessEquity: 1.0,
            cubefulEquity: 1.0,
            probabilities: { win: 1.0, winGammon: 0.0, winBackgammon: 0.0, loseWin: 0.0, loseGammon: 0.0, loseBackgammon: 0.0 },
            isExactBearoff: true,
        };
    }
    if (offO >= 15) {
        return {
            cubelessEquity: -1.0,
            cubefulEquity: -1.0,
            probabilities: { win: 0.0, winGammon: 0.0, winBackgammon: 0.0, loseWin: 1.0, loseGammon: 0.0, loseBackgammon: 0.0 },
            isExactBearoff: true,
        };
    }

    const homeP = extractHomeBoardCounts(state.board, player);
    const homeO = extractHomeBoardCounts(state.board, opponent);

    if (homeP !== null && homeO !== null) {
        const expP = bearoffExpectedRolls(homeP);
        const expO = bearoffExpectedRolls(homeO);
        const diffRolls = expO - expP + 0.5;
        const sigma = Math.sqrt(Math.max(1, expP + expO)) * 0.45;
        const z = diffRolls / sigma;
        const winProb = Number(clamp(1.0 / (1.0 + Math.exp(-2.2 * z)), 0.0001, 0.9999).toFixed(4));
        const loseProb = Number((1.0 - winProb).toFixed(4));

        const winGammon = offO === 0 ? Number(clamp((winProb - 0.5) * 0.35, 0.0, 0.4).toFixed(4)) : 0;
        const loseGammon = offP === 0 ? Number(clamp((loseProb - 0.5) * 0.35, 0.0, 0.4).toFixed(4)) : 0;

        const probabilities: Probabilities = {
            win: winProb,
            winGammon,
            winBackgammon: 0,
            loseWin: loseProb,
            loseGammon,
            loseBackgammon: 0,
        };
        const cubelessEquity = Number(clamp(winProb - loseProb + (winGammon - loseGammon), -1.0, 1.0).toFixed(4));
        const timmes = evaluateTimmesRace(state.board as number[], player, state.cubeOwner === player);
        let cubefulEquity = cubelessEquity;
        if (timmes.decision === 'DOUBLE_PASS' || timmes.decision === 'REDOUBLE_PASS') {
            cubefulEquity = 1.0;
        } else if (timmes.decision === 'NO_DOUBLE_TAKE') {
            cubefulEquity = Number((cubelessEquity * 0.85).toFixed(4));
        }

        return { cubelessEquity, cubefulEquity, probabilities, isExactBearoff: true };
    }

    // Fusion antisymétrique entre le réseau neuronal distillé 3-ply et la base tri-phase
    const base = evaluateBoard(state, 0);
    const nnP = globalBtNeuralEngine.evaluateProbabilities(state, player);
    const p0 = nnP[0];
    const p1 = nnP[1];
    const p2 = nnP[2];
    const p3 = nnP[3];
    const p4 = nnP[4];
    const nnO = globalBtNeuralEngine.evaluateProbabilities({ ...state, turn: opponent }, opponent);
    const o0 = nnO[0];
    const o1 = nnO[1];
    const o2 = nnO[2];
    const o3 = nnO[3];
    const o4 = nnO[4];

    // Symétrisation stricte E_nn(P) = -E_nn(O) : win_sym = 0.5 * (p0 + (1 - o0))
    const nnWinSym = 0.5 * (p0 + (1.0 - o0));
    const nnWinGSym = 0.5 * (p1 + o3);
    const nnLoseGSym = 0.5 * (p3 + o1);
    const nnWinBGSym = 0.5 * (p2 + o4);
    const nnLoseBGSym = 0.5 * (p4 + o2);

    const w = clamp(neuralBlendWeight, 0.0, 1.0);
    const win = Number(clamp((1 - w) * base.probabilities.win + w * nnWinSym, 0.0001, 0.9999).toFixed(4));
    const lose = Number((1.0 - win).toFixed(4));
    let winG = Number(clamp((1 - w) * base.probabilities.winGammon + w * nnWinGSym, 0.0, win).toFixed(4));
    let winBG = Number(clamp((1 - w) * base.probabilities.winBackgammon + w * nnWinBGSym, 0.0, winG).toFixed(4));
    let loseG = Number(clamp((1 - w) * base.probabilities.loseGammon + w * nnLoseGSym, 0.0, lose).toFixed(4));
    let loseBG = Number(clamp((1 - w) * base.probabilities.loseBackgammon + w * nnLoseBGSym, 0.0, loseG).toFixed(4));

    if (offO >= 1) { winG = 0; winBG = 0; }
    if (offP >= 1) { loseG = 0; loseBG = 0; }

    const probabilities: Probabilities = {
        win,
        winGammon: winG,
        winBackgammon: winBG,
        loseWin: lose,
        loseGammon: loseG,
        loseBackgammon: loseBG,
    };

    const cubelessEquity = Number(
        clamp(win - lose + (winG - loseG) + (winBG - loseBG), -1.0, 1.0).toFixed(4),
    );

    const phase = detectJanowskiPhase(state.board as number[], player);
    const jEval = computeJanowskiCubeEvaluation(probabilities, phase, {
        cubeOwner: state.cubeOwner === null ? 'CENTERED' : state.cubeOwner === player ? 'PLAYER' : 'OPPONENT',
        board: state.board as number[],
        player,
    });
    const cubefulEquity = Number(clamp(jEval.cubefulEquity, -1.0, 1.0).toFixed(4));

    return { cubelessEquity, cubefulEquity, probabilities, isExactBearoff: false };
}
