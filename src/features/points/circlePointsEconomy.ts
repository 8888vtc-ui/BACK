/**
 * @file src/features/points/circlePointsEconomy.ts
 * @description Moteur de gestion des Points de Cercle Monte-Carlo (10 000 PTS initiaux, filet de sécurité, bourse pédagogique, somme nulle).
 * Strictement <= 250 lignes, 0 any.
 */

export const CIRCLE_POINTS_STORAGE_KEY = 'bgtour_circle_points_balance';
export const INITIAL_CIRCLE_POINTS = 10_000;
export const SAFETY_FLOOR_THRESHOLD = 200;
export const SAFETY_FLOOR_REFILL = 1_000;
export const COACH_GRANT_REWARD = 2_500;
export const COACH_GRANT_QUIZZES_REQUIRED = 3;

export interface CirclePointsLedgerEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly delta: number;
  readonly newBalance: number;
  readonly reason: 'INITIAL_GRANT' | 'MATCH_WIN' | 'MATCH_LOSS' | 'CASH_OUT' | 'SAFETY_FLOOR_REFILL' | 'COACH_STUDY_GRANT' | 'ACADEMY_REWARD';
  readonly metadata?: string;
}

export interface CirclePointsState {
  readonly balance: number;
  readonly consecutiveBlundersSolvedForGrant: number;
  readonly history: readonly CirclePointsLedgerEntry[];
}

let inMemoryState: CirclePointsState | null = null;

function getNowIso(): string {
  return new Date().toISOString();
}

/**
 * Charge l'état des Points de Cercle depuis le localStorage ou la mémoire vive.
 */
export function getCirclePointsState(): CirclePointsState {
  if (typeof window === 'undefined' || !window.localStorage) {
    if (!inMemoryState) {
      inMemoryState = {
        balance: INITIAL_CIRCLE_POINTS,
        consecutiveBlundersSolvedForGrant: 0,
        history: [{
          id: 'init_grant',
          timestamp: getNowIso(),
          delta: INITIAL_CIRCLE_POINTS,
          newBalance: INITIAL_CIRCLE_POINTS,
          reason: 'INITIAL_GRANT',
        }],
      };
    }
    return inMemoryState;
  }

  try {
    const raw = window.localStorage.getItem(CIRCLE_POINTS_STORAGE_KEY);
    if (!raw) {
      const initial: CirclePointsState = {
        balance: INITIAL_CIRCLE_POINTS,
        consecutiveBlundersSolvedForGrant: 0,
        history: [{
          id: `grant_${Date.now()}`,
          timestamp: getNowIso(),
          delta: INITIAL_CIRCLE_POINTS,
          newBalance: INITIAL_CIRCLE_POINTS,
          reason: 'INITIAL_GRANT',
        }],
      };
      saveCirclePointsState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as CirclePointsState;
    if (typeof parsed.balance !== 'number' || !Array.isArray(parsed.history)) {
      throw new Error('Invalid schema');
    }
    inMemoryState = parsed;
    return parsed;
  } catch {
    const fallback: CirclePointsState = {
      balance: INITIAL_CIRCLE_POINTS,
      consecutiveBlundersSolvedForGrant: 0,
      history: [{
        id: `grant_${Date.now()}`,
        timestamp: getNowIso(),
        delta: INITIAL_CIRCLE_POINTS,
        newBalance: INITIAL_CIRCLE_POINTS,
        reason: 'INITIAL_GRANT',
      }],
    };
    saveCirclePointsState(fallback);
    return fallback;
  }
}

/**
 * Sauvegarde l'état des Points de Cercle dans le localStorage.
 */
export function saveCirclePointsState(state: CirclePointsState): void {
  inMemoryState = state;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CIRCLE_POINTS_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignorer quota errors
    }
  }
}

/**
 * Réinitialise le compte à 10 000 PTS pour les tests.
 */
export function resetCirclePointsForTests(): void {
  inMemoryState = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(CIRCLE_POINTS_STORAGE_KEY);
  }
}

/**
 * Applique une transaction sur les points avec vérification du filet de sécurité (< 200 PTS => 1 000 PTS).
 */
export function applyPointsTransaction(
  delta: number,
  reason: CirclePointsLedgerEntry['reason'],
  metadata?: string,
): { state: CirclePointsState; safetyFloorTriggered: boolean } {
  const current = getCirclePointsState();
  let candidateBalance = Math.max(0, current.balance + delta);
  let safetyFloorTriggered = false;

  const historyEntries = [...current.history];
  historyEntries.unshift({
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: getNowIso(),
    delta,
    newBalance: candidateBalance,
    reason,
    metadata,
  });

  if (candidateBalance < SAFETY_FLOOR_THRESHOLD) {
    safetyFloorTriggered = true;
    const refillDelta = SAFETY_FLOOR_REFILL - candidateBalance;
    candidateBalance = SAFETY_FLOOR_REFILL;
    historyEntries.unshift({
      id: `refill_${Date.now()}`,
      timestamp: getNowIso(),
      delta: refillDelta,
      newBalance: candidateBalance,
      reason: 'SAFETY_FLOOR_REFILL',
      metadata: 'Filet de sécurité : recharge automatique à 1 000 PTS',
    });
  }

  const nextState: CirclePointsState = {
    balance: candidateBalance,
    consecutiveBlundersSolvedForGrant: current.consecutiveBlundersSolvedForGrant,
    history: historyEntries.slice(0, 50),
  };

  saveCirclePointsState(nextState);
  return { state: nextState, safetyFloorTriggered };
}

/**
 * Enregistre la résolution d'un quiz de blunder pour la « Bourse d'Étude des 3 Quiz ».
 * Dès que 3 quiz de blunders sont réussis en 3-ply, crédite +2 500 PTS.
 */
export function recordBlunderSolvedForCoachGrant(): {
  state: CirclePointsState;
  grantAwarded: boolean;
} {
  const current = getCirclePointsState();
  const nextCount = current.consecutiveBlundersSolvedForGrant + 1;

  if (nextCount >= COACH_GRANT_QUIZZES_REQUIRED) {
    const { state } = applyPointsTransaction(
      COACH_GRANT_REWARD,
      'COACH_STUDY_GRANT',
      'Bourse d\'étude du Coach : 3 quiz de blunders 3-ply résolus !',
    );
    const updated: CirclePointsState = {
      ...state,
      consecutiveBlundersSolvedForGrant: 0,
    };
    saveCirclePointsState(updated);
    return { state: updated, grantAwarded: true };
  }

  const updated: CirclePointsState = {
    ...current,
    consecutiveBlundersSolvedForGrant: nextCount,
  };
  saveCirclePointsState(updated);
  return { state: updated, grantAwarded: false };
}

