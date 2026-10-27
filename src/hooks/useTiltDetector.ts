'use client';

/**
 * @file src/hooks/useTiltDetector.ts
 * @description Hook React de détection du Tilt cognitif et émotionnel basé sur la Formule de Zare.
 * Surveille la perte d'équité (ΔE_skill), la précipitation (< 3.5s) et les erreurs post-bad-beat.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  evaluateZareTiltScore,
  type TiltDecisionSample,
  type TiltLevel,
  type ZareTiltEvaluation,
} from '../lib/coach/zareTiltEngine';

export interface UseTiltDetectorOptions {
  /** Taille de la fenêtre glissante de coups analysés (défaut : 6) */
  windowSize?: number;
  /** Historique initial optionnel (utile pour les tests ou la reprise de session) */
  initialSamples?: readonly TiltDecisionSample[];
}

export interface UseTiltDetectorReturn {
  /** Évaluation complète selon la formule de Douglas Zare */
  evaluation: ZareTiltEvaluation;
  /** Score de tilt entre 0 et 100 */
  tiltScore: number;
  /** Niveau de tilt ('calm' | 'warming' | 'tilted') */
  tiltLevel: TiltLevel;
  /** Indique si le joueur est en état de tilt avéré */
  isTilted: boolean;
  /** Indique si l'alerte de tilt doit être affichée dans l'UI */
  showTiltAlert: boolean;
  /** Indique si l'utilisateur a masqué manuellement l'alerte actuelle */
  isAlertDismissed: boolean;
  /** Historique des décisions enregistrées */
  history: readonly TiltDecisionSample[];
  /** Enregistre l'instant où les dés sont lancés pour calculer automatiquement le temps de réflexion */
  markRollTimestamp: (timestampMs?: number) => void;
  /** Enregistre une décision du joueur et met à jour l'indice de Zare */
  recordDecision: (sample: TiltDecisionSample) => void;
  /** Masque temporairement la bannière d'alerte de tilt jusqu'à la prochaine gaffe */
  dismissTiltAlert: () => void;
  /** Réinitialise complètement le détecteur de tilt (nouvelle partie) */
  resetTilt: () => void;
}

const MAX_STORED_SAMPLES = 24;

export function useTiltDetector(options: UseTiltDetectorOptions = {}): UseTiltDetectorReturn {
  const { windowSize = 6, initialSamples = [] } = options;

  const [history, setHistory] = useState< readonly TiltDecisionSample[]>(() =>
    initialSamples.slice(-MAX_STORED_SAMPLES)
  );
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);
  const lastRollTimestampRef = useRef<number | null>(null);

  const markRollTimestamp = useCallback((timestampMs?: number) => {
    lastRollTimestampRef.current = typeof timestampMs === 'number' ? timestampMs : Date.now();
  }, []);

  const recordDecision = useCallback((sample: TiltDecisionSample) => {
    const now = Date.now();
    const computedReactionMs =
      typeof sample.reactionTimeMs === 'number'
        ? sample.reactionTimeMs
        : lastRollTimestampRef.current !== null
          ? Math.max(0, now - lastRollTimestampRef.current)
          : undefined;

    lastRollTimestampRef.current = null;

    const enrichedSample: TiltDecisionSample = {
      ...sample,
      equityLoss: Math.max(0, Number.isFinite(sample.equityLoss) ? sample.equityLoss : 0),
      reactionTimeMs: computedReactionMs,
    };

    setHistory((prev) => {
      const next = [...prev, enrichedSample];
      return next.length > MAX_STORED_SAMPLES ? next.slice(-MAX_STORED_SAMPLES) : next;
    });

    if (enrichedSample.equityLoss >= 0.06) {
      setIsAlertDismissed(false);
    }
  }, []);

  const dismissTiltAlert = useCallback(() => {
    setIsAlertDismissed(true);
  }, []);

  const resetTilt = useCallback(() => {
    lastRollTimestampRef.current = null;
    setHistory([]);
    setIsAlertDismissed(false);
  }, []);

  const evaluation = useMemo(
    () => evaluateZareTiltScore(history, windowSize),
    [history, windowSize]
  );

  const showTiltAlert = evaluation.isTilted && !isAlertDismissed;

  return {
    evaluation,
    tiltScore: evaluation.tiltScore,
    tiltLevel: evaluation.tiltLevel,
    isTilted: evaluation.isTilted,
    showTiltAlert,
    isAlertDismissed,
    history,
    markRollTimestamp,
    recordDecision,
    dismissTiltAlert,
    resetTilt,
  };
}
