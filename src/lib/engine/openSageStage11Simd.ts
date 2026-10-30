/**
 * @file openSageStage11Simd.ts
 * @module lib/engine/openSageStage11Simd
 * @description Moteur Open Sage Stage 11 & Inférence WASM SIMD Int8 :
 * 1. Classification de phase Stage 11 (24 réseaux 0..23)
 * 2. Encodage Tesauro-Strehl 200 entrées mis à l'échelle (sx = 30 dans [0, 180])
 * 3. Quantification symétrique Int8 par canal ([-127, +127] sans -128)
 * 4. Filtre d'élagage Open Sage et invariant du commit a1a9517
 * 5. Sérialisation binaire MoveCandidate alignée sur 96 octets
 */

export interface Stage11BoardState {
  readonly playerPoints: ReadonlyArray<number>; // 24 flèches, point 1 = jan intérieur, 24 = fond adverse
  readonly opponentPoints: ReadonlyArray<number>; // 24 flèches adverses (du point de vue adverse 1..24)
  readonly playerBar: number;
  readonly opponentBar: number;
  readonly playerOff: number;
  readonly opponentOff: number;
  readonly cubePosition: 'centered' | 'player' | 'opponent';
  readonly isCubeAction: boolean;
  readonly playerPipCount: number;
  readonly opponentPipCount: number;
}

export interface Stage11MoveCandidate {
  readonly notation: string;
  readonly flags: number;
  readonly plyLevel: number;
  readonly probabilities: readonly [number, number, number, number, number]; // [win, winG, winBG, loseG, loseBG]
  readonly cubelessEquity: number;
  readonly cubefulEquity: number;
  readonly emgDelta: number;
}

/**
 * 1. Classification de Phase Stage 11 vers les 24 indices (0..23)
 */
export function classifyStage11Phase(board: Stage11BoardState): number {
  // 1. Race pure (aucun pion ne s'est pas croisé)
  let maxPlayer = 0;
  for (let i = 24; i >= 1; i--) {
    if (board.playerPoints[i - 1] > 0) {
      maxPlayer = i;
      break;
    }
  }
  let maxOpp = 0;
  for (let i = 24; i >= 1; i--) {
    if (board.opponentPoints[i - 1] > 0) {
      maxOpp = i;
      break;
    }
  }

  // Course sans contact : aucun pion derrière l'autre (pions 24..1 player vs opp 1..24)
  // En coordonnées unifiées : contact si maxPlayer + maxOpp > 25
  const isContact = board.playerBar > 0 || board.opponentBar > 0 || maxPlayer + maxOpp > 25;
  if (!isContact) {
    return 0; // Phase 0: Pure Race
  }

  // Calcul des ancres dans le jan adverse (flèches 20 à 24 du joueur = points 1 à 5 adverses)
  // Flèche 24 = as adverse (point 1), 23 = point 2, 22 = point 3, 21 = point 4, 20 = point 5
  const oppPoint1Anchor = board.playerPoints[23] >= 2;
  const oppPoint2Anchor = board.playerPoints[22] >= 2;
  const oppPoint3Anchor = board.playerPoints[21] >= 2;
  const oppPoint4Anchor = board.playerPoints[20] >= 2;
  const oppPoint5Anchor = board.playerPoints[19] >= 2;

  const anchorsInOppHome = [
    oppPoint1Anchor,
    oppPoint2Anchor,
    oppPoint3Anchor,
    oppPoint4Anchor,
    oppPoint5Anchor,
  ].filter(Boolean).length;

  const backCheckersCount =
    (board.playerPoints[23] ?? 0) +
    (board.playerPoints[22] ?? 0) +
    (board.playerPoints[21] ?? 0) +
    (board.playerPoints[20] ?? 0) +
    (board.playerPoints[19] ?? 0);

  const pipLag = board.playerPipCount - board.opponentPipCount;

  // Indice 23 : Massive Backgame (>= 3 ancres profondes ou 2 ancres avec >= 7 pions arrières)
  if (anchorsInOppHome >= 3 || (anchorsInOppHome === 2 && backCheckersCount >= 7)) {
    return 23;
  }

  // Indices 11..20 : Les 10 Classic Backgames (retard > 15 pips et exactement 2 ancres en 1..5)
  if (pipLag > 15 && anchorsInOppHome === 2) {
    if (oppPoint1Anchor && oppPoint2Anchor) return 11; // 2-1 backgame
    if (oppPoint1Anchor && oppPoint3Anchor) return 12; // 3-1 backgame
    if (oppPoint1Anchor && oppPoint4Anchor) return 13; // 4-1 backgame
    if (oppPoint1Anchor && oppPoint5Anchor) return 14; // 5-1 backgame
    if (oppPoint2Anchor && oppPoint3Anchor) return 15; // 3-2 backgame
    if (oppPoint2Anchor && oppPoint4Anchor) return 16; // 4-2 backgame
    if (oppPoint2Anchor && oppPoint5Anchor) return 17; // 5-2 backgame
    if (oppPoint3Anchor && oppPoint4Anchor) return 18; // 4-3 backgame
    if (oppPoint3Anchor && oppPoint5Anchor) return 19; // 5-3 backgame
    if (oppPoint4Anchor && oppPoint5Anchor) return 20; // 5-4 backgame
  }

  // Indice 22 : The Snake NN (stage11s)
  // >= 4 portes consécutives entre les points 13 et 22 bloquant 1 unique straggler adverse
  let consecutivePrime = 0;
  let maxConsecutive = 0;
  for (let pt = 13; pt <= 22; pt++) {
    if (board.playerPoints[pt - 1] >= 2) {
      consecutivePrime++;
      if (consecutivePrime > maxConsecutive) maxConsecutive = consecutivePrime;
    } else {
      consecutivePrime = 0;
    }
  }
  let oppStragglers = 0;
  for (let pt = 1; pt <= 12; pt++) {
    oppStragglers += board.opponentPoints[pt - 1];
  }
  if (maxConsecutive >= 4 && oppStragglers === 1) {
    return 22;
  }

  // Indice 21 : Containment NN (dames amies avancées ou sorties avec 1..3 dames adverses isolées)
  if (
    board.playerOff > 0 &&
    (board.opponentBar > 0 || backCheckersCount <= 3) &&
    board.playerPipCount < board.opponentPipCount
  ) {
    return 21;
  }

  // Indice 2 : Blitz (attaque dans le jan avec adversaire sur la barre et >= 3 points intérieurs faits)
  let playerHomePoints = 0;
  for (let pt = 1; pt <= 6; pt++) {
    if (board.playerPoints[pt - 1] >= 2) playerHomePoints++;
  }
  if (board.opponentBar >= 1 && playerHomePoints >= 3) {
    return 2;
  }

  // Indice 3 : Crashed (position déstructurée avec empilements massifs sur peu de points)
  let heavilyStackedPoints = 0;
  for (let pt = 1; pt <= 24; pt++) {
    if (board.playerPoints[pt - 1] >= 5) heavilyStackedPoints++;
  }
  if (heavilyStackedPoints >= 2 && playerHomePoints <= 2) {
    return 3;
  }

  // Indice 1 : Contact / Priming par défaut
  return 1;
}

/**
 * 2. Encodage Tesauro-Strehl 200 entrées mis à l'échelle (sx = 30 => [0, 180])
 */
export function encodeTesauroStrehl200Scaled(board: Stage11BoardState): Int16Array {
  const encoded = new Int16Array(200);
  const sx = 30;

  // Points 1 à 24 pour le joueur (192 entrées = 24 points * 2 joueurs * 4 caractéristiques)
  let offset = 0;
  for (let p = 0; p < 24; p++) {
    const n = board.playerPoints[p] ?? 0;
    encoded[offset++] = n >= 1 ? sx : 0;
    encoded[offset++] = n >= 2 ? sx : 0;
    encoded[offset++] = n >= 3 ? sx : 0;
    encoded[offset++] = n > 3 ? Math.min(180, Math.round(((n - 3) / 2) * sx)) : 0;
  }

  // Points 1 à 24 pour l'adversaire
  for (let p = 0; p < 24; p++) {
    const n = board.opponentPoints[p] ?? 0;
    encoded[offset++] = n >= 1 ? sx : 0;
    encoded[offset++] = n >= 2 ? sx : 0;
    encoded[offset++] = n >= 3 ? sx : 0;
    encoded[offset++] = n > 3 ? Math.min(180, Math.round(((n - 3) / 2) * sx)) : 0;
  }

  // 192..195: Barres et Sorties
  encoded[192] = Math.min(sx, Math.round((board.playerBar / 2) * sx));
  encoded[193] = Math.min(sx, Math.round((board.opponentBar / 2) * sx));
  encoded[194] = Math.min(sx, Math.round((board.playerOff / 15) * sx));
  encoded[195] = Math.min(sx, Math.round((board.opponentOff / 15) * sx));

  // 196..198: One-Hot Possession Videau
  encoded[196] = board.cubePosition === 'centered' ? sx : 0;
  encoded[197] = board.cubePosition === 'player' ? sx : 0;
  encoded[198] = board.cubePosition === 'opponent' ? sx : 0;

  // 199: Type de Décision
  encoded[199] = board.isCubeAction ? sx : 0;

  return encoded;
}

/**
 * 3. Quantification Symétrique par Canal Int8 ([-127, +127] sans -128)
 */
export function quantizeRowSymmetricInt8(weights: Float32Array): {
  scale: number;
  quantized: Int8Array;
} {
  let maxAbs = 0;
  for (let i = 0; i < weights.length; i++) {
    const absVal = Math.abs(weights[i]);
    if (absVal > maxAbs) maxAbs = absVal;
  }

  if (maxAbs === 0) {
    return {
      scale: 1.0,
      quantized: new Int8Array(weights.length),
    };
  }

  const scale = maxAbs / 127;
  const quantized = new Int8Array(weights.length);

  for (let i = 0; i < weights.length; i++) {
    let q = Math.round(weights[i] / scale);
    if (q > 127) q = 127;
    if (q < -127) q = -127; // exclusion de -128
    quantized[i] = q;
  }

  return { scale, quantized };
}

/**
 * 4. Filtre d'Élagage Open Sage (K <= 5, marge <= 0.080) & Invariant Commit a1a9517
 */
export function applyOpenSageMoveFilterAndRank(
  candidates: readonly Stage11MoveCandidate[],
  plyLevel: 1 | 2
): Stage11MoveCandidate[] {
  if (candidates.length === 0) return [];

  if (plyLevel === 1) {
    return [...candidates].sort((a, b) => b.cubefulEquity - a.cubefulEquity);
  }

  // 2-ply evaluation : identifier le meilleur coup 1-ply
  const sorted1Ply = [...candidates].sort((a, b) => b.cubefulEquity - a.cubefulEquity);
  const best1PlyEquity = sorted1Ply[0].cubefulEquity;

  // Les candidats retenus pour 2-ply ont delta <= 0.080 et maximum 5 candidats
  const twoPlyEvaluated: Stage11MoveCandidate[] = [];
  const prunedCandidates: Stage11MoveCandidate[] = [];

  for (const c of sorted1Ply) {
    if (twoPlyEvaluated.length < 5 && best1PlyEquity - c.cubefulEquity <= 0.08) {
      twoPlyEvaluated.push({
        ...c,
        plyLevel: 2,
      });
    } else {
      prunedCandidates.push(c);
    }
  }

  // INVARIANT a1a9517 : les candidats évalués à 2-ply passent toujours avant
  // les candidats élagués à 1-ply, quelle que soit leur valeur 1-ply brute
  twoPlyEvaluated.sort((a, b) => b.cubefulEquity - a.cubefulEquity);
  prunedCandidates.sort((a, b) => b.cubefulEquity - a.cubefulEquity);

  return [...twoPlyEvaluated, ...prunedCandidates];
}

/**
 * 5. Sérialisation Binaire MoveCandidate alignée sur 96 Octets
 */
export function encodeMoveCandidate96Bytes(candidate: Stage11MoveCandidate): ArrayBuffer {
  const buffer = new ArrayBuffer(96);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 0..53 : notation string UTF-8
  const encoder = new TextEncoder();
  const notBytes = encoder.encode(candidate.notation.slice(0, 53));
  bytes.set(notBytes, 0);

  // 54..55 : flags (Uint16)
  view.setUint16(54, candidate.flags, true);

  // 58..61 : plyLevel (Uint32)
  view.setUint32(58, candidate.plyLevel, true);

  // 64..83 : 5 probabilités (Float32Array)
  for (let i = 0; i < 5; i++) {
    view.setFloat32(64 + i * 4, candidate.probabilities[i] ?? 0, true);
  }

  // 84 : cubelessEquity
  view.setFloat32(84, candidate.cubelessEquity, true);

  // 88 : cubefulEquity
  view.setFloat32(88, candidate.cubefulEquity, true);

  // 92 : emgDelta
  view.setFloat32(92, candidate.emgDelta, true);

  return buffer;
}

export function decodeMoveCandidate96Bytes(buffer: ArrayBuffer): Stage11MoveCandidate {
  if (buffer.byteLength !== 96) {
    throw new Error(`Invalid buffer size: expected 96 bytes, received ${buffer.byteLength}`);
  }
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 0..53 : string
  let strLen = 0;
  while (strLen < 54 && bytes[strLen] !== 0) {
    strLen++;
  }
  const decoder = new TextDecoder();
  const notation = decoder.decode(bytes.subarray(0, strLen));

  const flags = view.getUint16(54, true);
  const plyLevel = view.getUint32(58, true);

  const p0 = view.getFloat32(64, true);
  const p1 = view.getFloat32(68, true);
  const p2 = view.getFloat32(72, true);
  const p3 = view.getFloat32(76, true);
  const p4 = view.getFloat32(80, true);

  const cubelessEquity = view.getFloat32(84, true);
  const cubefulEquity = view.getFloat32(88, true);
  const emgDelta = view.getFloat32(92, true);

  return {
    notation,
    flags,
    plyLevel,
    probabilities: [p0, p1, p2, p3, p4],
    cubelessEquity,
    cubefulEquity,
    emgDelta,
  };
}
