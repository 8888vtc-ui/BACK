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

/**
 * Nettoie proprement les paramètres d'invitation de l'URL sans rechargement de page.
 */
export function cleanUrlRoomParams(): void {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        let changed = false;
        for (const key of ['join', 'room', 'code']) {
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
