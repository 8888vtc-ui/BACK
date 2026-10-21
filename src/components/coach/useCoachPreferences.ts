'use client';

/**
 * Préférences utilisateur du Coach (mode de déclenchement, seuil, hors-ligne).
 *
 * Rôle :
 *   - Initialise les préférences depuis les props ou `localStorage`.
 *   - Persiste chaque changement dans `localStorage`.
 *   - Suit les événements réseau `online` / `offline` du navigateur.
 *
 * Dépendances :
 *   `react` uniquement.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer la logique dans `CoachPanel.tsx`.
 */

import { useCallback, useEffect, useState } from 'react';

export type CoachTriggerMode = 'auto' | 'manual';
export type CoachAutoThreshold = 'blunder' | 'doubtful';

export interface UseCoachPreferencesParams {
    triggerMode?: CoachTriggerMode;
    onTriggerModeChange?: (mode: CoachTriggerMode) => void;
    autoThreshold?: CoachAutoThreshold;
    onAutoThresholdChange?: (threshold: CoachAutoThreshold) => void;
    isOffline?: boolean;
    onOfflineToggle?: (offline: boolean) => void;
}

export interface UseCoachPreferencesResult {
    triggerMode: CoachTriggerMode;
    autoThreshold: CoachAutoThreshold;
    isOffline: boolean;
    setTriggerMode: (mode: CoachTriggerMode) => void;
    setAutoThreshold: (threshold: CoachAutoThreshold) => void;
    setIsOffline: (offline: boolean) => void;
}

/** Lecture sûre de `localStorage` (SSR-safe). */
function readStorage(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** Écriture sûre dans `localStorage` (SSR-safe). */
function writeStorage(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Quota dépassé ou stockage désactivé : on ignore silencieusement.
    }
}

export function useCoachPreferences({
    triggerMode: propTriggerMode,
    onTriggerModeChange,
    autoThreshold: propAutoThreshold,
    onAutoThresholdChange,
    isOffline: propIsOffline,
    onOfflineToggle,
}: UseCoachPreferencesParams): UseCoachPreferencesResult {
    // ANTI-HYDRATATION : les valeurs initiales sont des constantes strictes,
    // identiques côté SSR et côté client. Les préférences persistées sont
    // appliquées dans un `useEffect` après le montage (jamais pendant le rendu).
    const [localTriggerMode, setLocalTriggerMode] = useState<CoachTriggerMode>(
        propTriggerMode ?? 'manual',
    );

    const [localAutoThreshold, setLocalAutoThreshold] = useState<CoachAutoThreshold>(
        propAutoThreshold ?? 'blunder',
    );

    const [localIsOffline, setLocalIsOffline] = useState<boolean>(propIsOffline ?? false);

    // Synchronisation post-montage des préférences persistées.
    useEffect(() => {
        if (!propTriggerMode) {
            const saved = readStorage('bg_coach_trigger_mode');
            if (saved === 'auto' || saved === 'manual') setLocalTriggerMode(saved);
        }
        if (!propAutoThreshold) {
            const saved = readStorage('bg_coach_auto_threshold');
            if (saved === 'blunder' || saved === 'doubtful') setLocalAutoThreshold(saved);
        }
        if (propIsOffline === undefined) {
            if (!window.navigator.onLine || readStorage('bg_coach_offline_mode') === 'true') {
                setLocalIsOffline(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Écoute des changements de connectivité réseau native
    useEffect(() => {
        function handleOnline() {
            if (propIsOffline === undefined) setLocalIsOffline(false);
        }
        function handleOffline() {
            if (propIsOffline === undefined) setLocalIsOffline(true);
        }
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [propIsOffline]);

    const setTriggerMode = useCallback(
        (mode: CoachTriggerMode) => {
            setLocalTriggerMode(mode);
            writeStorage('bg_coach_trigger_mode', mode);
            onTriggerModeChange?.(mode);
        },
        [onTriggerModeChange],
    );

    const setAutoThreshold = useCallback(
        (threshold: CoachAutoThreshold) => {
            setLocalAutoThreshold(threshold);
            writeStorage('bg_coach_auto_threshold', threshold);
            onAutoThresholdChange?.(threshold);
        },
        [onAutoThresholdChange],
    );

    const setIsOffline = useCallback(
        (offline: boolean) => {
            setLocalIsOffline(offline);
            writeStorage('bg_coach_offline_mode', offline ? 'true' : 'false');
            onOfflineToggle?.(offline);
        },
        [onOfflineToggle],
    );

    return {
        triggerMode: propTriggerMode ?? localTriggerMode,
        autoThreshold: propAutoThreshold ?? localAutoThreshold,
        isOffline: propIsOffline ?? localIsOffline,
        setTriggerMode,
        setAutoThreshold,
        setIsOffline,
    };
}
