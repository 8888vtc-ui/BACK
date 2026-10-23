/**
 * Réglage du seuil de notification du Coach (anti-fatigue).
 *
 * Rôle :
 *   Définit à quel niveau d'erreur le Coach doit alerter l'utilisateur :
 *   - 'silent'  : jamais signalé (mode zen).
 *   - 'blunder' : alerte seulement sur les grosses erreurs (recommandé).
 *   - 'error'   : alerte sur toutes les erreurs (apprentissage intensif).
 *
 * Module 100 % pur : aucune dépendance React, DOM ou réseau.
 */

import type { CoachVerdict } from './logAnalyzer';

export type CoachNotificationLevel = 'silent' | 'blunder' | 'error';

export const DEFAULT_NOTIFICATION_LEVEL: CoachNotificationLevel = 'blunder';

/**
 * Détermine si un verdict doit déclencher une notification selon le niveau choisi.
 *
 * @param verdict Verdict du coup (optimal, good, inaccuracy, blunder).
 * @param level   Niveau de notification configuré.
 * @returns true si le coup doit être signalé.
 */
export function shouldNotify(verdict: CoachVerdict, level: CoachNotificationLevel): boolean {
    switch (level) {
        case 'silent':
            return false;
        case 'blunder':
            return verdict === 'blunder';
        case 'error':
            return verdict === 'blunder' || verdict === 'inaccuracy';
        default:
            return false;
    }
}

/** Libellé lisible du niveau de notification (pour l'UI). */
export function notificationLevelLabel(level: CoachNotificationLevel): string {
    switch (level) {
        case 'silent':
            return 'Silencieux';
        case 'blunder':
            return 'Blunder uniquement';
        case 'error':
            return 'Erreur + Blunder';
    }
}
