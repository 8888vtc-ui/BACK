/**
 * Service de retour haptique unifié pour Backgammon.
 *
 * Utilise @capacitor/haptics sur iOS et Android, avec repli gracieux
 * sur l'API Navigator.vibrate sur le web / PWA, et silence si non supporté.
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Retour tactile léger : tap sur un pion, bascule de dé, clic d'interface.
 */
export async function impactLight(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.impact({ style: ImpactStyle.Light });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(10);
        }
    } catch {
        // Ignorer les erreurs d'environnement sans vibration
    }
}

/**
 * Retour tactile moyen : atterrissage d'un pion, lancer des dés.
 */
export async function impactMedium(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(25);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Retour tactile fort : frappe d'un blot adverse, proposition de double au videau.
 */
export async function impactHeavy(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(50);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Notification de succès : victoire d'une manche ou d'un match.
 */
export async function notificationSuccess(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.notification({ type: NotificationType.Success });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([30, 50, 60]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Notification d'avertissement : coup douteux du coach.
 */
export async function notificationWarning(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.notification({ type: NotificationType.Warning });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([50, 50, 50]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Notification d'erreur : blunder ou howler du coach, coup illégal.
 */
export async function notificationError(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.notification({ type: NotificationType.Error });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([70, 40, 70, 40, 100]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Vibration générique avec durée personnalisée (ms).
 */
export async function vibrate(durationMs = 200): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.vibrate({ duration: durationMs });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(durationMs);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Impulsion haptique sèche de 15 ms avec rupture nette (freinage électromagnétique actif)
 * utilisée pour la frappe d'un blot ("Blot Hit").
 */
export async function triggerBrakedHapticPulse(durationMs = 15): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.vibrate({ duration: durationMs });
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            // Pattern [impulsion, 0] : force l'arrêt net du moteur linéaire à 15 ms
            navigator.vibrate([durationMs, 0]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Nappe haptique continue (ex: roulement sur feutre de 0 à 500 ms).
 */
export async function triggerContinuousHapticBed(durationMs = 500): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.vibrate({ duration: durationMs });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(durationMs);
        }
    } catch {
        // Ignorer
    }
}
