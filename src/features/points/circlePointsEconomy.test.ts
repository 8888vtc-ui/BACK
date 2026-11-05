import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCirclePointsState,
  applyPointsTransaction,
  recordBlunderSolvedForCoachGrant,
  resetCirclePointsForTests,
  INITIAL_CIRCLE_POINTS,
  SAFETY_FLOOR_REFILL,
  COACH_GRANT_REWARD,
} from './circlePointsEconomy';
import { calculateFairEquityCashOut } from '../multiplayer/fairEquityCashOut';

describe('Circle Points Economy & Monte-Carlo Wallet', () => {
  beforeEach(() => {
    resetCirclePointsForTests();
  });

  it('initialise le solde à 10 000 PTS par défaut avec historique', () => {
    const state = getCirclePointsState();
    expect(state.balance).toBe(INITIAL_CIRCLE_POINTS);
    expect(state.history.length).toBeGreaterThanOrEqual(1);
    expect(state.history[0]?.reason).toBe('INITIAL_GRANT');
  });

  it('applique le filet de sécurité à 1 000 PTS dès que le solde tombe sous 200 PTS', () => {
    // Joueur perd 9 850 PTS => solde tombe à 150 PTS (< 200 PTS)
    const result = applyPointsTransaction(-9850, 'MATCH_LOSS');
    expect(result.safetyFloorTriggered).toBe(true);
    expect(result.state.balance).toBe(SAFETY_FLOOR_REFILL);
  });

  it('accorde la Bourse d\'Étude du Coach (+2 500 PTS) après 3 quiz de blunders résolus', () => {
    const r1 = recordBlunderSolvedForCoachGrant();
    expect(r1.grantAwarded).toBe(false);
    expect(r1.state.consecutiveBlundersSolvedForGrant).toBe(1);

    const r2 = recordBlunderSolvedForCoachGrant();
    expect(r2.grantAwarded).toBe(false);
    expect(r2.state.consecutiveBlundersSolvedForGrant).toBe(2);

    const r3 = recordBlunderSolvedForCoachGrant();
    expect(r3.grantAwarded).toBe(true);
    expect(r3.state.consecutiveBlundersSolvedForGrant).toBe(0);
    expect(r3.state.balance).toBe(INITIAL_CIRCLE_POINTS + COACH_GRANT_REWARD);
  });

  it('garantit la stricte somme nulle sur un Cash-Out d\'équité équitable', () => {
    const cashOut = calculateFairEquityCashOut({
      equityA: 0.25, // EMG
      currentStakePoints: 1000,
      ratingA: 1550,
      ratingB: 1500,
    });

    expect(cashOut.zeroSumVerified).toBe(true);
    expect(cashOut.deltaPointsA + cashOut.deltaPointsB).toBe(0);
    expect(cashOut.eloDeltaA + cashOut.eloDeltaB).toBe(0);
  });
});

