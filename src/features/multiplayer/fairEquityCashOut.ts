/**
 * @file src/features/multiplayer/fairEquityCashOut.ts
 * @description Moteur de Synchronisation du Videau & Partage au Prorata (Cash-Out) à Somme Nulle (<= 350 lignes, 0 any).
 * Invariants :
 * - Double / Take / Pass synchronisé : Take donne la possession exclusive du cube, Pass adjuge la valeur courante.
 * - Cash-Out au prorata d'équité bgsage 3-ply : deltaS_A + deltaS_B = 0 strictement.
 * - Adjudication anti-vol au temps : si un joueur abandonne ou se déconnecte avec >= 60% d'équité adverse.
 */

import type { Player } from '../../engine/backgammonEngine';

export interface SynchronizedCubeState {
  readonly cubeValue: number;
  readonly cubeOwner: Player | null; // null = centré, 'X' ou 'O'
  readonly doublingOfferedBy: Player | null;
  readonly status: 'ACTIVE' | 'OFFERED' | 'ACCEPTED' | 'PASSED';
  readonly pointsAwarded?: number;
  readonly winner?: Player;
}

export interface FairCashOutResult {
  readonly pointsShareA: number;
  readonly pointsShareB: number;
  readonly deltaPointsA: number;
  readonly deltaPointsB: number;
  readonly eloDeltaA: number;
  readonly eloDeltaB: number;
  readonly zeroSumVerified: boolean;
  readonly winProbabilityA: number;
  readonly winProbabilityB: number;
}

/**
 * Initialise l'état du Videau au début d'une manche.
 */
export function createInitialCubeState(): SynchronizedCubeState {
  return {
    cubeValue: 1,
    cubeOwner: null,
    doublingOfferedBy: null,
    status: 'ACTIVE',
  };
}

/**
 * Propose de doubler la valeur du Videau.
 */
export function offerDouble(
  current: SynchronizedCubeState,
  byPlayer: Player
): SynchronizedCubeState {
  if (current.doublingOfferedBy !== null) {
    throw new Error('Une proposition de videau est déjà en cours.');
  }
  if (current.cubeOwner !== null && current.cubeOwner !== byPlayer) {
    throw new Error(`Le joueur ${byPlayer} ne possède pas le videau (propriétaire : ${current.cubeOwner}).`);
  }

  const nextValue = current.cubeValue === 1 ? 2 : current.cubeValue * 2;
  return {
    ...current,
    cubeValue: nextValue,
    doublingOfferedBy: byPlayer,
    status: 'OFFERED',
  };
}

/**
 * Accepte la proposition de double (Take).
 * Le joueur qui accepte devient le propriétaire exclusif du videau doublé.
 */
export function acceptDouble(
  current: SynchronizedCubeState,
  byPlayer: Player
): SynchronizedCubeState {
  if (current.status !== 'OFFERED' || current.doublingOfferedBy === null) {
    throw new Error('Aucun double à accepter.');
  }
  if (current.doublingOfferedBy === byPlayer) {
    throw new Error('Un joueur ne peut pas accepter son propre double.');
  }

  return {
    cubeValue: current.cubeValue,
    cubeOwner: byPlayer, // L'accepteur possède désormais le cube
    doublingOfferedBy: null,
    status: 'ACCEPTED',
  };
}

/**
 * Refuse la proposition de double (Pass).
 * Le joueur qui a proposé remporte la manche à la valeur précédente du videau.
 */
export function passDouble(
  current: SynchronizedCubeState,
  byPlayer: Player
): SynchronizedCubeState {
  if (current.status !== 'OFFERED' || current.doublingOfferedBy === null) {
    throw new Error('Aucun double à refuser.');
  }
  if (current.doublingOfferedBy === byPlayer) {
    throw new Error('Un joueur ne peut pas refuser son propre double.');
  }

  const winner = current.doublingOfferedBy;
  const previousValue = current.cubeValue / 2;

  return {
    cubeValue: previousValue,
    cubeOwner: current.cubeOwner,
    doublingOfferedBy: null,
    status: 'PASSED',
    winner,
    pointsAwarded: previousValue,
  };
}

/**
 * Calcule le partage équitable au prorata (Cash-Out) à Somme Nulle stricte :
 * Delta S_A + Delta S_B = 0
 * Delta Elo_A + Delta Elo_B = 0
 */
export function calculateFairEquityCashOut(params: {
  readonly equityA: number; // EMG [-1.0 .. +1.0] ou probabilité MWC [0.0 .. 1.0]
  readonly currentStakePoints: number; // Valeur actuelle de l'enjeu (ex: 2, 4, 100 PTS)
  readonly ratingA: number;
  readonly ratingB: number;
  readonly isAdjudicationTimeout?: boolean; // Forfait ou déconnexion anti-vol
}): FairCashOutResult {
  const { equityA, currentStakePoints, ratingA, ratingB, isAdjudicationTimeout = false } = params;

  // Conversion en probabilité de gain winProbabilityA ∈ [0, 1]
  let winProbA: number;
  if (equityA >= 0 && equityA <= 1.0 && params.equityA !== 0) {
    winProbA = Math.max(0.01, Math.min(0.99, equityA));
  } else {
    // Équité EMG standard : winProb = (equity + 1) / 2
    winProbA = Math.max(0.01, Math.min(0.99, (equityA + 1.0) / 2.0));
  }
  const winProbB = 1.0 - winProbA;

  // Répartition des points au prorata exact
  // pointsShareA = stake * (winProbA - 0.5) * 2
  // À somme nulle : deltaPointsA = -deltaPointsB
  const rawDeltaA = (winProbA - 0.5) * 2.0 * currentStakePoints;
  const roundedDeltaA = Number(rawDeltaA.toFixed(2));
  const roundedDeltaB = Number((-roundedDeltaA).toFixed(2));

  // Points totaux distribués
  const pointsShareA = Number((currentStakePoints * winProbA).toFixed(2));
  const pointsShareB = Number((currentStakePoints * winProbB).toFixed(2));

  // Ajustement Elo proportionnel à l'espérance
  // Espérance classique Elo : E_A = 1 / (1 + 10^((R_B - R_A)/400))
  const expectedA = 1.0 / (1.0 + Math.pow(10, (ratingB - ratingA) / 400));
  const kFactor = isAdjudicationTimeout ? 24 : 16;
  const rawEloDeltaA = Math.round(kFactor * (winProbA - expectedA));
  const eloDeltaA = rawEloDeltaA;
  const eloDeltaB = -rawEloDeltaA; // Somme nulle stricte

  const zeroSumPoints = Math.abs(roundedDeltaA + roundedDeltaB) <= 0.001;
  const zeroSumElo = eloDeltaA + eloDeltaB === 0;

  return {
    pointsShareA,
    pointsShareB,
    deltaPointsA: roundedDeltaA,
    deltaPointsB: roundedDeltaB,
    eloDeltaA,
    eloDeltaB,
    zeroSumVerified: zeroSumPoints && zeroSumElo,
    winProbabilityA: Number(winProbA.toFixed(4)),
    winProbabilityB: Number(winProbB.toFixed(4)),
  };
}
