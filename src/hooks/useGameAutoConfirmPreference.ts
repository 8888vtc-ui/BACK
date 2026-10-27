'use client';

/**
 * Hook de gestion des préférences et du mode d'auto-confirmation de tour (Game Feel Spec §5).
 * Conforme à SCALABILITY.md (< 90 lignes).
 */

import { useCallback, useEffect, useState } from 'react';
import {
    getNextAutoConfirmMode,
    getSavedAutoConfirmMode,
    getSavedAutoConfirmPreference,
    saveAutoConfirmMode,
    saveAutoConfirmPreference,
    type AutoConfirmMode,
} from './useTurnConfirmation';

export interface UseGameAutoConfirmPreferenceOptions {
    initialAutoConfirm?: boolean;
    initialAutoConfirmTurn?: boolean;
    explicitAutoConfirmMode?: AutoConfirmMode;
}

export function useGameAutoConfirmPreference({
    initialAutoConfirm,
    initialAutoConfirmTurn,
    explicitAutoConfirmMode,
}: UseGameAutoConfirmPreferenceOptions) {
    const explicitAutoConfirm = initialAutoConfirmTurn ?? initialAutoConfirm;

    const [autoConfirmTurn, setAutoConfirmTurnState] = useState<boolean>(() => {
        if (explicitAutoConfirmMode !== undefined) {
            return explicitAutoConfirmMode === 'always' || explicitAutoConfirmMode === 'always_except_cube';
        }
        if (explicitAutoConfirm !== undefined) return explicitAutoConfirm;
        return getSavedAutoConfirmPreference(false);
    });

    const [autoConfirmMode, setAutoConfirmModeState] = useState<AutoConfirmMode>(() => {
        if (explicitAutoConfirmMode !== undefined) return explicitAutoConfirmMode;
        if (explicitAutoConfirm !== undefined) return explicitAutoConfirm ? 'always' : 'never';
        return getSavedAutoConfirmMode(getSavedAutoConfirmPreference(false) ? 'always' : 'never');
    });

    useEffect(() => {
        if (explicitAutoConfirmMode !== undefined) {
            setAutoConfirmModeState(explicitAutoConfirmMode);
            setAutoConfirmTurnState(
                explicitAutoConfirmMode === 'always' || explicitAutoConfirmMode === 'always_except_cube',
            );
        } else if (explicitAutoConfirm !== undefined) {
            setAutoConfirmTurnState(explicitAutoConfirm);
            setAutoConfirmModeState(explicitAutoConfirm ? 'always' : 'never');
        }
    }, [explicitAutoConfirm, explicitAutoConfirmMode]);

    const setAutoConfirmTurn = useCallback((enabled: boolean) => {
        setAutoConfirmTurnState(enabled);
        setAutoConfirmModeState(enabled ? 'always' : 'never');
        saveAutoConfirmPreference(enabled);
    }, []);

    const toggleAutoConfirmTurn = useCallback(() => {
        setAutoConfirmTurnState((prev) => {
            const next = !prev;
            setAutoConfirmModeState(next ? 'always' : 'never');
            saveAutoConfirmPreference(next);
            return next;
        });
    }, []);

    const setAutoConfirmMode = useCallback((mode: AutoConfirmMode) => {
        const enabled = mode === 'always' || mode === 'always_except_cube';
        setAutoConfirmModeState(mode);
        setAutoConfirmTurnState(enabled);
        saveAutoConfirmMode(mode);
        saveAutoConfirmPreference(enabled);
    }, []);

    const cycleAutoConfirmMode = useCallback(() => {
        setAutoConfirmModeState((prev) => {
            const next = getNextAutoConfirmMode(prev);
            const enabled = next === 'always' || next === 'always_except_cube';
            setAutoConfirmTurnState(enabled);
            saveAutoConfirmMode(next);
            saveAutoConfirmPreference(enabled);
            return next;
        });
    }, []);

    return {
        autoConfirmTurn,
        autoConfirmMode,
        setAutoConfirmTurn,
        toggleAutoConfirmTurn,
        setAutoConfirmMode,
        cycleAutoConfirmMode,
    };
}
