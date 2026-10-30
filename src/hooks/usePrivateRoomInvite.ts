'use client';

/**
 * Hook de détection & routage d'invitation directe Salon Privé (?join=BG-XXXX) (Priorité P3).
 *
 * Détecte les paramètres d'URL `?join=BG-XXXX` ou `?room=BG-XXXX` au montage client,
 * normalise et valide le code, déclenche la connexion automatique en 1 clic et
 * nettoie proprement l'URL via `window.history.replaceState`.
 *
 * Conforme à SCALABILITY.md (< 120 lignes, 0 any).
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { isValidRoomCode } from '../features/multiplayer/realtimeSchema';

export interface UsePrivateRoomInviteOptions {
    onAutoJoinRoom?: (code: string) => void;
    onAutoStartTournamentMatch?: (matchLength: number, tournamentName: string | null) => void;
}

export interface UsePrivateRoomInviteReturn {
    detectedCode: string | null;
    hasHandledInvite: boolean;
    clearDetectedCode: () => void;
}

/**
 * Extrait et valide un code de salon valide depuis une query string ou une URL.
 */
export function extractRoomCodeFromUrl(searchOrUrl: string): string | null {
    try {
        let queryString = searchOrUrl;
        if (searchOrUrl.includes('?')) {
            queryString = searchOrUrl.slice(searchOrUrl.indexOf('?') + 1);
        }
        const params = new URLSearchParams(queryString);
        const rawCode = params.get('join') ?? params.get('room') ?? params.get('code');
        if (!rawCode) return null;
        let normalized = rawCode.trim().toUpperCase();
        if (!normalized.startsWith('BG-') && /^[2-9A-HJ-NP-Z]{4}$/i.test(normalized)) {
            normalized = `BG-${normalized}`;
        }
        return isValidRoomCode(normalized) ? normalized : null;
    } catch {
        return null;
    }
}

export function extractTournamentTrainingFromUrl(searchOrUrl: string): {
    matchLength: number;
    tournamentName: string | null;
} | null {
    try {
        const queryString = searchOrUrl.includes('?')
            ? searchOrUrl.slice(searchOrUrl.indexOf('?') + 1)
            : searchOrUrl;
        const params = new URLSearchParams(queryString);
        const rawLength = params.get('matchLength');
        if (!rawLength) return null;
        const parsed = Number.parseInt(rawLength, 10);
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 25) return null;
        const tournamentName = params.get('tournament')?.trim() || null;
        return { matchLength: parsed, tournamentName };
    } catch {
        return null;
    }
}

/**
 * Nettoie proprement les paramètres d'invitation de l'URL sans rechargement de page.
 */
export function cleanUrlRoomParams(): void {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        let changed = false;
        for (const key of ['join', 'room', 'code', 'matchLength', 'tournament']) {
            if (url.searchParams.has(key)) {
                url.searchParams.delete(key);
                changed = true;
            }
        }
        if (changed) {
            const nextSearch = url.searchParams.toString();
            const nextUrl = url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash;
            window.history.replaceState({}, '', nextUrl);
        }
    } catch {
        // Ignore SecurityError / cross-origin
    }
}

export function usePrivateRoomInvite(
    options: UsePrivateRoomInviteOptions = {},
): UsePrivateRoomInviteReturn {
    const [detectedCode, setDetectedCode] = useState<string | null>(null);
    const hasCheckedRef = useRef<boolean>(false);
    const onAutoJoinRoomRef = useRef(options.onAutoJoinRoom);
    onAutoJoinRoomRef.current = options.onAutoJoinRoom;
    const onAutoStartTournamentRef = useRef(options.onAutoStartTournamentMatch);
    onAutoStartTournamentRef.current = options.onAutoStartTournamentMatch;

    useEffect(() => {
        if (hasCheckedRef.current || typeof window === 'undefined') return;
        hasCheckedRef.current = true;

        const code = extractRoomCodeFromUrl(window.location.search);
        if (code) {
            setDetectedCode(code);
            cleanUrlRoomParams();
            if (onAutoJoinRoomRef.current) {
                onAutoJoinRoomRef.current(code);
            }
            return;
        }

        const training = extractTournamentTrainingFromUrl(window.location.search);
        if (training) {
            cleanUrlRoomParams();
            if (onAutoStartTournamentRef.current) {
                onAutoStartTournamentRef.current(training.matchLength, training.tournamentName);
            }
        }
    }, []);

    const clearDetectedCode = useCallback(() => {
        setDetectedCode(null);
    }, []);

    return {
        detectedCode,
        hasHandledInvite: hasCheckedRef.current,
        clearDetectedCode,
    };
}

export default usePrivateRoomInvite;
