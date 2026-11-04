'use client';

import { useState, useEffect, useCallback } from 'react';
import { readPlayerPassport, savePlayerPassport, type PlayerExperienceTier } from '../lib/supabase/auth';

export type PlayerTierGate = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

export const PLAYER_TIER_GATE_STORAGE_KEY = 'bgtour_player_gate';

export function getSavedPlayerTierGate(): PlayerTierGate {
    if (typeof localStorage === 'undefined') return 'BEGINNER';
    try {
        const saved = localStorage.getItem(PLAYER_TIER_GATE_STORAGE_KEY);
        if (saved === 'BEGINNER' || saved === 'INTERMEDIATE' || saved === 'EXPERT') {
            return saved;
        }
    } catch {
        /* ignore */
    }
    return 'BEGINNER';
}

export function usePlayerTierGate() {
    const [tierGate, setTierGateState] = useState<PlayerTierGate>('BEGINNER');
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const saved = getSavedPlayerTierGate();
        setTierGateState(saved);
        setIsHydrated(true);

        const onStorage = (e: StorageEvent) => {
            if (e.key === PLAYER_TIER_GATE_STORAGE_KEY && e.newValue) {
                if (e.newValue === 'BEGINNER' || e.newValue === 'INTERMEDIATE' || e.newValue === 'EXPERT') {
                    setTierGateState(e.newValue);
                }
            }
        };
        const onCustomEvent = (e: Event) => {
            const detail = (e as CustomEvent<PlayerTierGate>).detail;
            if (detail === 'BEGINNER' || detail === 'INTERMEDIATE' || detail === 'EXPERT') {
                setTierGateState(detail);
            }
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener('bgtour-player-gate-change', onCustomEvent);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('bgtour-player-gate-change', onCustomEvent);
        };
    }, []);

    const setTierGate = useCallback((nextGate: PlayerTierGate) => {
        setTierGateState(nextGate);
        try {
            localStorage.setItem(PLAYER_TIER_GATE_STORAGE_KEY, nextGate);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent<PlayerTierGate>('bgtour-player-gate-change', { detail: nextGate }));
            }
        } catch {
            /* ignore */
        }
        const passport = readPlayerPassport();
        if (passport) {
            const expLevel: PlayerExperienceTier =
                nextGate === 'BEGINNER' ? 'beginner' : nextGate === 'INTERMEDIATE' ? 'intermediate' : 'expert';
            savePlayerPassport({ ...passport, experienceLevel: expLevel });
        }
    }, []);

    return { tierGate, setTierGate, isHydrated };
}

