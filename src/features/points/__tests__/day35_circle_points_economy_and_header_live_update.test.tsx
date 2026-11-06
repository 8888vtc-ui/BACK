// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import {
  getCirclePointsState,
  applyPointsTransaction,
  recordBlunderSolvedForCoachGrant,
  resetCirclePointsForTests,
  INITIAL_CIRCLE_POINTS,
  SAFETY_FLOOR_THRESHOLD,
  SAFETY_FLOOR_REFILL,
  COACH_GRANT_REWARD,
  COACH_GRANT_QUIZZES_REQUIRED,
} from '../circlePointsEconomy';
import { calculateFairEquityCashOut } from '../../multiplayer/fairEquityCashOut';
import { NavbarPointsAndBadges } from '../../../components/nav/NavbarPointsAndBadges';

describe('Mission 35/50: Économie 10 000 PTS, Plancher 1 000 PTS & Bourse Coach +2 500 PTS', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCirclePointsForTests();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Initialise le capital exactement à 10 000 PTS avec entrée initiale dans le grand livre', () => {
    const state = getCirclePointsState();
    expect(state.balance).toBe(10_000);
    expect(INITIAL_CIRCLE_POINTS).toBe(10_000);
    expect(state.consecutiveBlundersSolvedForGrant).toBe(0);
    expect(state.history.length).toBeGreaterThanOrEqual(1);
    expect(state.history[0]?.reason).toBe('INITIAL_GRANT');
    expect(state.history[0]?.delta).toBe(10_000);
  });

  it('2. Garantit la somme nulle stricte (0 % rake) sur tout Cash-Out d équité : DeltaPTS_A + DeltaPTS_B = 0', () => {
    const testCases = [
      { equityA: 0.15, stake: 500 },
      { equityA: -0.42, stake: 1200 },
      { equityA: 0.85, stake: 3000 },
      { equityA: 0.00, stake: 1000 },
    ];

    for (const { equityA, stake } of testCases) {
      const result = calculateFairEquityCashOut({
        equityA,
        currentStakePoints: stake,
        ratingA: 1600,
        ratingB: 1540,
      });

      expect(result.zeroSumVerified).toBe(true);
      // Somme nulle absolue sur les points (0 % rake prélevé)
      expect(Number((result.deltaPointsA + result.deltaPointsB).toFixed(2))).toBe(0);
      // Somme nulle sur l'Elo
      expect(result.eloDeltaA + result.eloDeltaB).toBe(0);
    }
  });

  it('3. Protection anti-banqueroute : recave automatique à 1 000 PTS si le solde tombe sous 200 PTS', () => {
    expect(SAFETY_FLOOR_THRESHOLD).toBe(200);
    expect(SAFETY_FLOOR_REFILL).toBe(1_000);

    // Cas 1 : Perte de 9 700 PTS -> Reste 300 PTS (>= 200 PTS -> pas de recave)
    const resNormal = applyPointsTransaction(-9700, 'MATCH_LOSS');
    expect(resNormal.safetyFloorTriggered).toBe(false);
    expect(resNormal.state.balance).toBe(300);

    // Cas 2 : Perte supplémentaire de 150 PTS -> Reste 150 PTS (< 200 PTS -> recave auto à 1 000 PTS)
    const resRefill = applyPointsTransaction(-150, 'MATCH_LOSS');
    expect(resRefill.safetyFloorTriggered).toBe(true);
    expect(resRefill.state.balance).toBe(1000);
    expect(resRefill.state.history[0]?.reason).toBe('SAFETY_FLOOR_REFILL');
    expect(resRefill.state.history[0]?.newBalance).toBe(1000);

    // Cas 3 : Perte totale (balance 0) -> Reste 0 (< 200 -> recave auto à 1 000 PTS)
    const resZero = applyPointsTransaction(-2000, 'MATCH_LOSS');
    expect(resZero.safetyFloorTriggered).toBe(true);
    expect(resZero.state.balance).toBe(1000);
  });

  it('4. Bourse du Coach : 3 quiz de blunders réussis créditent +2 500 PTS', () => {
    expect(COACH_GRANT_QUIZZES_REQUIRED).toBe(3);
    expect(COACH_GRANT_REWARD).toBe(2_500);

    // 1er quiz réussi
    const q1 = recordBlunderSolvedForCoachGrant();
    expect(q1.grantAwarded).toBe(false);
    expect(q1.state.consecutiveBlundersSolvedForGrant).toBe(1);
    expect(q1.state.balance).toBe(10_000);

    // 2e quiz réussi
    const q2 = recordBlunderSolvedForCoachGrant();
    expect(q2.grantAwarded).toBe(false);
    expect(q2.state.consecutiveBlundersSolvedForGrant).toBe(2);
    expect(q2.state.balance).toBe(10_000);

    // 3e quiz réussi -> DÉCERNEMENT DE LA BOURSE +2 500 PTS
    const q3 = recordBlunderSolvedForCoachGrant();
    expect(q3.grantAwarded).toBe(true);
    expect(q3.state.consecutiveBlundersSolvedForGrant).toBe(0);
    expect(q3.state.balance).toBe(12_500);
    expect(q3.state.history[0]?.reason).toBe('COACH_STUDY_GRANT');
    expect(q3.state.history[0]?.delta).toBe(2_500);
  });

  it('5. NavbarPointsAndBadges : affiche 10 000 PTS et se met à jour en direct lors du versement de la Bourse (+2 500 PTS)', () => {
    render(<NavbarPointsAndBadges tierGate="INTERMEDIATE" />);

    const badge = screen.getByTestId('navbar-points-badge');
    expect(badge).toBeDefined();
    // Doit afficher 10 000 PTS au démarrage
    expect(badge.textContent).toMatch(/10[\s,.]?000\s*PTS/);

    // Résolution de 3 quiz déclenchant la bourse de +2 500 PTS
    act(() => {
      recordBlunderSolvedForCoachGrant();
      recordBlunderSolvedForCoachGrant();
      recordBlunderSolvedForCoachGrant();
    });

    // Le badge Navbar doit s'être mis à jour en direct sans recharger la page
    expect(badge.textContent).toMatch(/12[\s,.]?500\s*PTS/);
  });
});
