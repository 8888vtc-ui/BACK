/**
 * Module de notification pédagogique du videau (Doubling Cube).
 *
 * Rôle :
 *   Construit les notifications Coach pour les décisions de videau (take/pass/double),
 *   filtrées par le niveau de sensibilité choisi par l'utilisateur (`shouldNotify`).
 *
 * Module 100 % pur : sans effet de bord, testable unitairement.
 */

import { shouldNotify, type CoachNotificationLevel } from './coachNotificationSettings';
import type { CubeCoachResult } from './cubeCoach';

export interface CubeNotification {
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
}

/**
 * Dérive une notification affichable à partir du résultat d'analyse de videau
 * et du seuil de sensibilité configuré.
 *
 * - Si le verdict ne passe pas le filtre `shouldNotify`, renvoie `null` (anti-fatigue).
 * - Blunder -> warning avec explication + conseil.
 * - Inaccuracy -> info avec explication + conseil.
 */
export function buildCubeNotification(
    result: CubeCoachResult,
    level: CoachNotificationLevel,
): CubeNotification | null {
    if (!shouldNotify(result.verdict, level)) {
        return null;
    }

    if (result.verdict === 'blunder') {
        return {
            type: 'warning',
            title: 'Videau : Blunder',
            message: `${result.explanation} ${result.advice}`.trim(),
        };
    }

    if (result.verdict === 'inaccuracy') {
        return {
            type: 'info',
            title: 'Videau : Imprécision',
            message: `${result.explanation} ${result.advice}`.trim(),
        };
    }

    return null;
}
