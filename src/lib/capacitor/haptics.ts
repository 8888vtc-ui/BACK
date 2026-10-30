/**
 * Service de retour haptique unifié pour Backgammon (`haptics.ts`).
 *
 * Rôle :
 *   Implémente la chorégraphie haptique bimodale « Cercle Monte-Carlo » :
 *   - `@capacitor/haptics` sur iOS et Android natifs (Taptic Engine / actionneur linéaire LRA)
 *   - `navigator.vibrate(pattern)` sur Web / PWA Android Chrome
 *   - Gestion défensive des rafales et annulation immédiate (`cancelHaptics()` -> `navigator.vibrate(0)`)
 *
 * Strictement 0 `any`, ≤ 300 lignes.
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import {
    SENSORY_PRESETS,
    type GameEventType,
    type NativeHapticAction,
} from '../gameFeel/sensoryPresets';

const activeHapticTimers: Set<ReturnType<typeof setTimeout>> = new Set();

export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Annule immédiatement toute vibration Web en cours (`navigator.vibrate(0)`)
 * ainsi que les timers d'impulsions natives différées.
 */
export function cancelHaptics(): void {
    activeHapticTimers.forEach((t) => clearTimeout(t));
    activeHapticTimers.clear();
    try {
        if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(0);
        }
    } catch {
        // Ignorer sur iOS Safari / Desktop
    }
}

async function dispatchNativeHapticAction(action: NativeHapticAction): Promise<void> {
    switch (action) {
        case 'ImpactLight':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
        case 'ImpactMedium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
        case 'ImpactHeavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
        case 'SelectionChanged':
            if (typeof Haptics.selectionChanged === 'function') {
                await Haptics.selectionChanged();
            } else {
                await Haptics.impact({ style: ImpactStyle.Light });
            }
            break;
        case 'NotificationSuccess':
            await Haptics.notification({ type: NotificationType.Success });
            break;
        case 'NotificationWarning':
            await Haptics.notification({ type: NotificationType.Warning });
            break;
    }
}

/**
 * Déclenche la séquence haptique synchronisée (Web `navigator.vibrate` ou `@capacitor/haptics`)
 * correspondant à l'un des 9 événements sensoriels du dictionnaire maître `SENSORY_PRESETS`.
 */
export async function triggerSensoryEventHaptics(event: GameEventType): Promise<void> {
    const preset = SENSORY_PRESETS[event];
    if (!preset) return;

    cancelHaptics();

    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            for (const step of preset.haptics.nativeSteps) {
                if (step.delayMs <= 0) {
                    await dispatchNativeHapticAction(step.action);
                } else {
                    const timer = setTimeout(() => {
                        activeHapticTimers.delete(timer);
                        void dispatchNativeHapticAction(step.action).catch(() => {});
                    }, step.delayMs);
                    activeHapticTimers.add(timer);
                }
            }
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            const pattern = [...preset.haptics.webVibrationPattern];
            navigator.vibrate(pattern.length === 1 ? pattern[0] : pattern);
        }
    } catch {
        // Silence gracieux sur navigateurs sans support haptique (iOS Safari PWA)
    }
}

/**
 * Retour tactile léger : tap sur un pion, bascule de dé, clic d'interface (`[10]`).
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
 * Notification de succès : coup brillant ou victoire (`[10, 30, 16]`).
 */
export async function notificationSuccess(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.notification({ type: NotificationType.Success });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([10, 30, 16]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Notification d'avertissement : gaffe / blunder post-match (`[30, 40, 25]`).
 */
export async function notificationWarning(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.notification({ type: NotificationType.Warning });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate([30, 40, 25]);
        }
    } catch {
        // Ignorer
    }
}

/**
 * Notification d'erreur : blunder grave ou coup illégal.
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
 * Impulsion haptique sèche de 15 ms avec rupture nette (freinage électromagnétique actif).
 */
export async function triggerBrakedHapticPulse(durationMs = 15): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            await Haptics.vibrate({ duration: durationMs });
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
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

/**
 * Tick haptique ultra-court de sélection (`[6]`).
 */
export async function selectionChangedHaptic(): Promise<void> {
    try {
        if (Capacitor.isPluginAvailable('Haptics')) {
            if (typeof Haptics.selectionStart === 'function') {
                await Haptics.selectionStart();
            }
            if (typeof Haptics.selectionChanged === 'function') {
                await Haptics.selectionChanged();
            }
            if (typeof Haptics.selectionEnd === 'function') {
                await Haptics.selectionEnd();
            }
        } else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(6);
        }
    } catch {
        // Ignorer sur appareil non compatible
    }
}
