/**
 * @file mobileLifecycleAndFlip120.test.ts
 * @module lib/board/mobileLifecycleAndFlip120.test
 * @description Tests unitaires de validation front-end mobile & 120 FPS ProMotion :
 * 1. Détection du bug WebKit 254545 (iOS 16.4 à 18.3 en PWA standalone)
 * 2. Corridor TouchGestureGuard 32px contre le swipe-back
 * 3. Réconciliation atomique WAL / IndexedDB par sequenceId
 * 4. Horloge Bronstein absolue sans dérive
 * 5. Interpolation delta-time FLIP et estimation de fréquence d'écran
 */

import { describe, expect, it } from 'vitest';
import {
  type AtomicTurnState,
  type BronsteinClockParams,
  computeBronsteinClockSnapshot,
  computeFlipDeltaStep,
  estimateRefreshRateHz,
  isAffectedByWebKitBug254545,
  reconcileAtomicTurnStates,
  shouldInterceptEdgeSwipeTouch,
} from './mobileLifecycleAndFlip120';

describe('isAffectedByWebKitBug254545 (WakeLock iOS Standalone)', () => {
  const uaIOS17 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
  const uaIOS16_4 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
  const uaIOS18_2 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
  const uaIOS18_4 =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)';
  const uaAndroid =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

  it('détecte le bug pour iOS 16.4, 17.4 et 18.2 en mode PWA standalone', () => {
    expect(isAffectedByWebKitBug254545(uaIOS16_4, true)).toBe(true);
    expect(isAffectedByWebKitBug254545(uaIOS17, true)).toBe(true);
    expect(isAffectedByWebKitBug254545(uaIOS18_2, true)).toBe(true);
  });

  it('ne déclenche pas le bug si iOS 18.4+ (bogue résolu par WebKit)', () => {
    expect(isAffectedByWebKitBug254545(uaIOS18_4, true)).toBe(false);
  });

  it('ne déclenche pas le bug si ouvert dans un onglet navigateur (non-standalone)', () => {
    expect(isAffectedByWebKitBug254545(uaIOS17, false)).toBe(false);
  });

  it('ne déclenche pas le bug sur Android ou autre OS', () => {
    expect(isAffectedByWebKitBug254545(uaAndroid, true)).toBe(false);
    expect(isAffectedByWebKitBug254545('', true)).toBe(false);
  });
});

describe('shouldInterceptEdgeSwipeTouch (Corridor 32px Safari)', () => {
  const viewportWidth = 390; // iPhone standard

  it('intercepte les touches dans le couloir gauche (0 à 32px)', () => {
    expect(shouldInterceptEdgeSwipeTouch(10, viewportWidth)).toBe(true);
    expect(shouldInterceptEdgeSwipeTouch(32, viewportWidth)).toBe(true);
  });

  it('intercepte les touches dans le couloir droit (>= 358px sur 390px)', () => {
    expect(shouldInterceptEdgeSwipeTouch(360, viewportWidth)).toBe(true);
    expect(shouldInterceptEdgeSwipeTouch(389, viewportWidth)).toBe(true);
  });

  it('autorise les interactions normales dans la zone de jeu centrale', () => {
    expect(shouldInterceptEdgeSwipeTouch(100, viewportWidth)).toBe(false);
    expect(shouldInterceptEdgeSwipeTouch(195, viewportWidth)).toBe(false);
  });
});

describe('reconcileAtomicTurnStates (Monotone Sequence ID)', () => {
  it('choisit l’état ayant le sequenceId le plus élevé', () => {
    const walOld: AtomicTurnState = {
      sequenceId: 4,
      movesJson: '["24/20"]',
      timestampMs: 1000,
    };
    const idbNew: AtomicTurnState = {
      sequenceId: 5,
      movesJson: '["24/20", "13/9"]',
      timestampMs: 1200,
    };

    const resolved = reconcileAtomicTurnStates(walOld, idbNew);
    expect(resolved?.sequenceId).toBe(5);
    expect(resolved?.movesJson).toBe('["24/20", "13/9"]');
  });

  it('gère les cas où un stockage est nul ou vide', () => {
    const wal: AtomicTurnState = {
      sequenceId: 1,
      movesJson: '[]',
      timestampMs: 500,
    };
    expect(reconcileAtomicTurnStates(wal, null)).toBe(wal);
    expect(reconcileAtomicTurnStates(null, wal)).toBe(wal);
    expect(reconcileAtomicTurnStates(null, null)).toBeNull();
  });
});

describe('computeBronsteinClockSnapshot (Horloge Absolue Sans Dérive)', () => {
  const baseParams: BronsteinClockParams = {
    allocatedDelayMs: 12000, // 12s délai simple
    initialReserveMs: 60000, // 60s réserve
    turnStartTimestampMs: 100000,
    currentTimestampMs: 105000, // +5s écoulées
    penaltyPoints: 0,
  };

  it('consomme le délai sans entamer la réserve si le coup est sous le délai', () => {
    const snapshot = computeBronsteinClockSnapshot(baseParams);
    expect(snapshot.elapsedTurnMs).toBe(5000);
    expect(snapshot.remainingDelayMs).toBe(7000);
    expect(snapshot.remainingReserveMs).toBe(60000); // réserve intacte
    expect(snapshot.isFlagged).toBe(false);
  });

  it('entame fidèlement la réserve si le coup dépasse le délai', () => {
    const snapshot = computeBronsteinClockSnapshot({
      ...baseParams,
      currentTimestampMs: 115000, // 15s écoulées (12s délai + 3s réserve)
    });
    expect(snapshot.elapsedTurnMs).toBe(15000);
    expect(snapshot.remainingDelayMs).toBe(0);
    expect(snapshot.remainingReserveMs).toBe(57000); // 60s - 3s
    expect(snapshot.isFlagged).toBe(false);
  });

  it('déclenche le drapeau (isFlagged) si la réserve tombe à zéro', () => {
    const snapshot = computeBronsteinClockSnapshot({
      ...baseParams,
      currentTimestampMs: 180000, // 80s écoulées (dépasse 12s + 60s)
    });
    expect(snapshot.remainingReserveMs).toBe(0);
    expect(snapshot.isFlagged).toBe(true);
  });
});

describe('computeFlipDeltaStep & estimateRefreshRateHz', () => {
  it('calcule une translation progressive FLIP selon delta-time', () => {
    const step1 = computeFlipDeltaStep({
      current: 0,
      target: 200,
      deltaMs: 16.66,
      speedPxPerSecond: 800, // 800 px/s * 0.01666s = ~13.33 px
    });
    expect(step1.isCompleted).toBe(false);
    expect(step1.nextValue).toBeCloseTo(13.33, 1);

    // Si la distance restante est inférieure au pas maximum, snap sur la cible
    const stepFinal = computeFlipDeltaStep({
      current: 195,
      target: 200,
      deltaMs: 16.66,
      speedPxPerSecond: 800,
    });
    expect(stepFinal.isCompleted).toBe(true);
    expect(stepFinal.nextValue).toBe(200);
  });

  it('estime la fréquence 120 Hz, 90 Hz ou 60 Hz selon les échantillons de trame', () => {
    // 120 Hz : deltas autour de 8.33 ms
    expect(estimateRefreshRateHz([8.3, 8.4, 8.2, 8.3])).toBe(120);

    // 90 Hz : deltas autour de 11.1 ms
    expect(estimateRefreshRateHz([11.0, 11.2, 11.1])).toBe(90);

    // 60 Hz : deltas autour de 16.6 ms
    expect(estimateRefreshRateHz([16.6, 16.7, 16.5])).toBe(60);

    // Repli sur 60 Hz en cas d’échantillons invalides
    expect(estimateRefreshRateHz([])).toBe(60);
  });
});
