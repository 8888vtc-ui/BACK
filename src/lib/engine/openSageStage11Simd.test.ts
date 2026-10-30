/**
 * @file openSageStage11Simd.test.ts
 * @module lib/engine/openSageStage11Simd.test
 * @description Tests unitaires de validation Open Sage Stage 11 & SIMD :
 * 1. Routage vers les 24 phases Stage 11 (0..23)
 * 2. Encodage Tesauro-Strehl 200 entrées mis à l'échelle sx = 30
 * 3. Quantification symétrique Int8 excluant -128
 * 4. Filtrage d'élagage Open Sage et invariant a1a9517
 * 5. Sérialisation binaire MoveCandidate sur 96 octets
 */

import { describe, expect, it } from 'vitest';
import {
  applyOpenSageMoveFilterAndRank,
  classifyStage11Phase,
  decodeMoveCandidate96Bytes,
  encodeMoveCandidate96Bytes,
  encodeTesauroStrehl200Scaled,
  quantizeRowSymmetricInt8,
  type Stage11BoardState,
  type Stage11MoveCandidate,
} from './openSageStage11Simd';

describe('classifyStage11Phase (Layout 24 Réseaux Stage 11)', () => {
  const createEmptyBoard = (): Stage11BoardState => {
    const opponentPoints = new Array(24).fill(0);
    // Position de base avec dames adverses sur son point 6 pour assurer la présence adverse
    opponentPoints[5] = 5;
    return {
      playerPoints: new Array(24).fill(0),
      opponentPoints,
      playerBar: 0,
      opponentBar: 0,
      playerOff: 0,
      opponentOff: 0,
      cubePosition: 'centered',
      isCubeAction: false,
      playerPipCount: 100,
      opponentPipCount: 100,
    };
  };

  it('classifie une course sans contact en Phase 0 (Race)', () => {
    const board = createEmptyBoard();
    // Pions du joueur tous dans son jan (points 1 à 3) -> maxPlayer = 3
    const playerPoints = new Array(24).fill(0);
    playerPoints[0] = 5;
    playerPoints[1] = 5;
    playerPoints[2] = 5;

    // Pions adverses tous dans son propre jan (points 1 à 3) -> maxOpp = 3
    const opponentPoints = new Array(24).fill(0);
    opponentPoints[0] = 5;
    opponentPoints[1] = 5;
    opponentPoints[2] = 5;

    const phase = classifyStage11Phase({
      ...board,
      playerPoints,
      opponentPoints,
    });
    expect(phase).toBe(0);
  });

  it('classifie une triple ancre profonde en Phase 23 (Massive Backgame)', () => {
    const board = createEmptyBoard();
    const playerPoints = [...board.playerPoints];
    // Flèches 24, 23, 22 = points 1, 2, 3 adverses
    playerPoints[23] = 2;
    playerPoints[22] = 2;
    playerPoints[21] = 2;

    const phase = classifyStage11Phase({
      ...board,
      playerPoints,
      playerPipCount: 140,
      opponentPipCount: 90,
    });
    expect(phase).toBe(23);
  });

  it('classifie les classic backgames 2-1 (11) et 4-3 (18) avec retard de course', () => {
    const board = createEmptyBoard();
    const playerPoints = [...board.playerPoints];

    // 2-1 backgame : ancres sur points 1 et 2 adverses (flèches 24 et 23)
    playerPoints[23] = 2;
    playerPoints[22] = 2;

    const phase21 = classifyStage11Phase({
      ...board,
      playerPoints,
      playerPipCount: 130,
      opponentPipCount: 90, // retard > 15
    });
    expect(phase21).toBe(11);

    // 4-3 backgame : ancres sur points 3 et 4 adverses (flèches 22 et 21)
    const playerPoints43 = [...board.playerPoints];
    playerPoints43[21] = 2;
    playerPoints43[20] = 2;

    const phase43 = classifyStage11Phase({
      ...board,
      playerPoints: playerPoints43,
      playerPipCount: 130,
      opponentPipCount: 90,
    });
    expect(phase43).toBe(18);
  });

  it('classifie The Snake (Phase 22) lors de 4 portes consécutives bloquant un straggler', () => {
    const board = createEmptyBoard();
    const playerPoints = new Array(24).fill(0);
    // Portes consécutives 14, 15, 16, 17
    playerPoints[13] = 2;
    playerPoints[14] = 2;
    playerPoints[15] = 2;
    playerPoints[16] = 2;

    const opponentPoints = new Array(24).fill(0);
    opponentPoints[0] = 1; // 1 unique straggler adverse en arrière (point 1 adverse)
    opponentPoints[18] = 5; // autres pions rentrés (point 19 adverse)

    const phase = classifyStage11Phase({
      ...board,
      playerPoints,
      opponentPoints,
    });
    expect(phase).toBe(22);
  });

  it('classifie le Blitz (Phase 2) avec adversaire sur la barre et jan armé', () => {
    const board = createEmptyBoard();
    const playerPoints = [...board.playerPoints];
    playerPoints[4] = 2; // point 5
    playerPoints[5] = 2; // point 6
    playerPoints[3] = 2; // point 4

    const phase = classifyStage11Phase({
      ...board,
      playerPoints,
      opponentBar: 1,
    });
    expect(phase).toBe(2);
  });
});

describe('encodeTesauroStrehl200Scaled & Quantification Int8', () => {
  it('génère un vecteur Int16 de 200 entrées borné strictement dans [0, 180]', () => {
    const board: Stage11BoardState = {
      playerPoints: [2, 0, 0, 0, 3, 5, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      opponentPoints: [0, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
      playerBar: 0,
      opponentBar: 1,
      playerOff: 0,
      opponentOff: 0,
      cubePosition: 'player',
      isCubeAction: true,
      playerPipCount: 150,
      opponentPipCount: 160,
    };

    const encoded = encodeTesauroStrehl200Scaled(board);
    expect(encoded.length).toBe(200);

    for (let i = 0; i < 200; i++) {
      expect(encoded[i]).toBeGreaterThanOrEqual(0);
      expect(encoded[i]).toBeLessThanOrEqual(180);
    }

    // Vérification cube et action
    expect(encoded[196]).toBe(0); // centered
    expect(encoded[197]).toBe(30); // player owns
    expect(encoded[199]).toBe(30); // is cube action
  });

  it('quantifie symétriquement en Int8 en excluant la valeur asymétrique -128', () => {
    const weights = new Float32Array([-2.5, -1.2, 0.0, 1.8, 2.5]);
    const { scale, quantized } = quantizeRowSymmetricInt8(weights);

    expect(scale).toBeCloseTo(2.5 / 127);
    expect(quantized.length).toBe(5);
    expect(quantized[0]).toBe(-127); // plafonné
    expect(quantized[4]).toBe(127);

    // Vérifier l'exclusion absolue de -128
    for (let i = 0; i < quantized.length; i++) {
      expect(quantized[i]).toBeGreaterThanOrEqual(-127);
      expect(quantized[i]).toBeLessThanOrEqual(127);
      expect(quantized[i]).not.toBe(-128);
    }
  });
});

describe('applyOpenSageMoveFilterAndRank & Invariant a1a9517', () => {
  const candidate = (notation: string, equity: number, ply = 1): Stage11MoveCandidate => ({
    notation,
    flags: 0,
    plyLevel: ply,
    probabilities: [0.6, 0.15, 0.01, 0.1, 0.01],
    cubelessEquity: equity - 0.02,
    cubefulEquity: equity,
    emgDelta: 0,
  });

  it('filtre au plus 5 candidats dans la marge de 0.080 en 2-ply et respecte l’invariant a1a9517', () => {
    const pool: Stage11MoveCandidate[] = [
      candidate('24/20 13/9', 0.5), // best 1-ply
      candidate('13/9 13/9', 0.48), // delta 0.02 -> 2-ply
      candidate('8/4 6/2', 0.45), // delta 0.05 -> 2-ply
      candidate('24/20 24/20', 0.43), // delta 0.07 -> 2-ply
      candidate('13/5', 0.425), // delta 0.075 -> 2-ply (5e candidat)
      candidate('6/2 6/2', 0.41), // delta 0.09 > 0.08 -> élagué
      candidate('13/11 6/4', 0.35), // delta 0.15 -> élagué
    ];

    const ranked = applyOpenSageMoveFilterAndRank(pool, 2);

    // Les 5 premiers doivent être passés à 2-ply
    expect(ranked.slice(0, 5).every((c) => c.plyLevel === 2)).toBe(true);
    // Les 2 suivants doivent rester à 1-ply
    expect(ranked.slice(5).every((c) => c.plyLevel === 1)).toBe(true);

    // Invariant a1a9517 : aucun coup élagué à 1-ply ne doit être classé
    // devant un coup 2-ply, même si son equity 1-ply brute est supérieure
    const firstPruned = ranked[5];
    const lastTwoPly = ranked[4];
    expect(ranked.indexOf(lastTwoPly)).toBeLessThan(ranked.indexOf(firstPruned));
  });
});

describe('encodeMoveCandidate96Bytes & decodeMoveCandidate96Bytes', () => {
  it('sérialise et désérialise un candidat avec une fidélité binaire exacte sur 96 octets', () => {
    const original: Stage11MoveCandidate = {
      notation: '24/20 13/9*',
      flags: 0x0042,
      plyLevel: 2,
      probabilities: [0.654, 0.21, 0.015, 0.12, 0.005],
      cubelessEquity: 0.382,
      cubefulEquity: 0.415,
      emgDelta: 0.025,
    };

    const buffer = encodeMoveCandidate96Bytes(original);
    expect(buffer.byteLength).toBe(96);

    const decoded = decodeMoveCandidate96Bytes(buffer);
    expect(decoded.notation).toBe(original.notation);
    expect(decoded.flags).toBe(original.flags);
    expect(decoded.plyLevel).toBe(original.plyLevel);
    expect(decoded.probabilities[0]).toBeCloseTo(original.probabilities[0], 5);
    expect(decoded.cubefulEquity).toBeCloseTo(original.cubefulEquity, 5);
    expect(decoded.emgDelta).toBeCloseTo(original.emgDelta, 5);
  });
});
