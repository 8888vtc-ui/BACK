/**
 * @file mobileLifecycleAndFlip120.ts
 * @module lib/board/mobileLifecycleAndFlip120
 * @description Architecture Mobile 120 FPS ProMotion, Cycle de Vie & Anti-Jetsam :
 * 1. Détection WebKit Bug 254545 (iOS 16.4 à 18.3 en PWA standalone)
 * 2. TouchGestureGuard & interception du swipe-back Safari (corridor 32px)
 * 3. Réconciliation atomique WAL vs IndexedDB (sequenceId monotone)
 * 4. Horloge Bronstein sans dérive au retour de veille/appel
 * 5. Moteur d'interpolation delta-time FLIP 120 FPS & estimation Hz
 */

// --- 1. Détection Bug WebKit 254545 (WakeLock en PWA iOS) ---

/**
 * Détecte si le terminal est affecté par le bug WebKit 254545 :
 * Sous iOS 16.4 à 18.3 en mode PWA standalone, navigator.wakeLock.request('screen')
 * fige le thread ou rejette silencieusement. Corrigé dans iOS 18.4+.
 */
export function isAffectedByWebKitBug254545(userAgent: string, isStandalone: boolean): boolean {
  if (!isStandalone) {
    return false;
  }

  // Exemple UA : "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X)..."
  const match = userAgent.match(/iPhone OS (\d+)_(\d+)/i) ?? userAgent.match(/OS (\d+)_(\d+)/i);
  if (!match) {
    return false;
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);

  if (Number.isNaN(major) || Number.isNaN(minor)) {
    return false;
  }

  const version = major + minor / 10;

  // Affecté entre iOS 16.4 et iOS 18.3
  return version >= 16.4 && version <= 18.39;
}

// --- 2. TouchGestureGuard (Corridor Latéral 32px) ---

/**
 * Détermine si un touchstart doit être intercepté en non-passif pour bloquer
 * le geste d'historique swipe-back d'iOS Safari.
 */
export function shouldInterceptEdgeSwipeTouch(
  clientX: number,
  viewportWidth: number,
  edgeThresholdPx = 32
): boolean {
  if (viewportWidth <= 0) return false;
  return clientX <= edgeThresholdPx || clientX >= viewportWidth - edgeThresholdPx;
}

// --- 3. Réconciliation Atomique WAL vs IndexedDB ---

export interface AtomicTurnState {
  readonly sequenceId: number;
  readonly movesJson: string;
  readonly timestampMs: number;
}

/**
 * Réconcilie le Write-Ahead Log de localStorage et le stockage IndexedDB
 * en sélectionnant rigoureusement l'état au sequenceId monotone le plus élevé.
 */
export function reconcileAtomicTurnStates(
  walState: AtomicTurnState | null,
  idbState: AtomicTurnState | null
): AtomicTurnState | null {
  if (!walState && !idbState) return null;
  if (!walState) return idbState;
  if (!idbState) return walState;

  if (walState.sequenceId > idbState.sequenceId) {
    return walState;
  }
  if (idbState.sequenceId > walState.sequenceId) {
    return idbState;
  }

  // En cas d'égalité stricte, choisir le timestamp le plus récent
  return walState.timestampMs >= idbState.timestampMs ? walState : idbState;
}

// --- 4. Horloge Bronstein Sans Dérive (Différentiel Monotone) ---

export interface BronsteinClockParams {
  readonly allocatedDelayMs: number;
  readonly initialReserveMs: number;
  readonly turnStartTimestampMs: number;
  readonly currentTimestampMs: number;
  readonly penaltyPoints: number;
}

export interface BronsteinClockSnapshot {
  readonly elapsedTurnMs: number;
  readonly remainingDelayMs: number;
  readonly remainingReserveMs: number;
  readonly isFlagged: boolean;
  readonly penaltyPoints: number;
}

/**
 * Calcule l'état exact de l'horloge Bronstein sans dérive d'intervalle,
 * immunisé contre les suspensions d'appels téléphoniques et le mode veille.
 */
export function computeBronsteinClockSnapshot(
  params: BronsteinClockParams
): BronsteinClockSnapshot {
  const elapsedTurnMs = Math.max(0, params.currentTimestampMs - params.turnStartTimestampMs);
  const consumedDelayMs = Math.min(elapsedTurnMs, params.allocatedDelayMs);
  const remainingDelayMs = params.allocatedDelayMs - consumedDelayMs;

  const excessTimeMs = Math.max(0, elapsedTurnMs - params.allocatedDelayMs);
  const remainingReserveMs = Math.max(0, params.initialReserveMs - excessTimeMs);
  const isFlagged = remainingReserveMs <= 0;

  return {
    elapsedTurnMs,
    remainingDelayMs,
    remainingReserveMs,
    isFlagged,
    penaltyPoints: params.penaltyPoints,
  };
}

// --- 5. Interpolation Delta-Time FLIP 120 FPS & Estimation Hz ---

export interface FlipDeltaParams {
  readonly current: number;
  readonly target: number;
  readonly deltaMs: number;
  readonly speedPxPerSecond: number;
}

export interface FlipDeltaStep {
  readonly nextValue: number;
  readonly isCompleted: boolean;
}

/**
 * Calcule un pas d'animation physique FLIP indépendant du taux de rafraîchissement
 * (identique sur 60 Hz, 90 Hz ou 120 Hz ProMotion).
 */
export function computeFlipDeltaStep(params: FlipDeltaParams): FlipDeltaStep {
  const distance = params.target - params.current;
  if (Math.abs(distance) < 0.01 || params.deltaMs <= 0) {
    return { nextValue: params.target, isCompleted: true };
  }

  const maxStep = (params.speedPxPerSecond * params.deltaMs) / 1000;
  if (Math.abs(distance) <= maxStep) {
    return { nextValue: params.target, isCompleted: true };
  }

  const step = Math.sign(distance) * maxStep;
  const nextValue = params.current + step;
  return { nextValue, isCompleted: false };
}

/**
 * Estime la fréquence de rafraîchissement de l'écran (60, 90 ou 120 Hz)
 * à partir d'échantillons delta-time consécutifs en millisecondes.
 */
export function estimateRefreshRateHz(deltaSamplesMs: readonly number[]): 60 | 90 | 120 {
  if (deltaSamplesMs.length === 0) return 60;

  const validSamples = deltaSamplesMs.filter((d) => d > 3 && d < 35);
  if (validSamples.length === 0) return 60;

  const sum = validSamples.reduce((acc, v) => acc + v, 0);
  const avgDelta = sum / validSamples.length;

  // 120 Hz : ~8.33 ms (seuil <= 9.8 ms)
  if (avgDelta <= 9.8) {
    return 120;
  }
  // 90 Hz : ~11.11 ms (seuil <= 13.5 ms)
  if (avgDelta <= 13.5) {
    return 90;
  }
  // 60 Hz par défaut : ~16.66 ms
  return 60;
}
