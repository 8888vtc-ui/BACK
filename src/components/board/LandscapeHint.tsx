'use client';

/**
 * Bandeau d'invitation à passer en mode paysage (mobile portrait).
 *
 * Rôle :
 *   Le plateau de backgammon (ratio ≈ 2:1) est nettement plus lisible en
 *   paysage. Sur mobile en portrait (`orientation: portrait` + largeur ≤ 767 px),
 *   ce composant affiche une bannière discrète et NON bloquante invitant à
 *   tourner l'appareil. Elle peut être fermée ; le choix est mémorisé pour la
 *   session (`sessionStorage`).
 *
 * Anti-hydratation : état initial constant (`false`), la détection
 * (`matchMedia` + `sessionStorage`) n'a lieu qu'après le montage.
 *
 * Dépendances :
 *   Aucune.
 *
 * Retrait :
 *   Supprimer ce fichier et son import dans `GameBoardArea.tsx`.
 */

import React, { useCallback, useEffect, useState } from 'react';

/** Clé de persistance (session) du masquage de la bannière. */
export const LANDSCAPE_HINT_DISMISS_KEY = 'backgammon_landscape_hint_dismissed';

/** Media query de détection du mobile en portrait. */
export const LANDSCAPE_HINT_QUERY = '(orientation: portrait) and (max-width: 767px)';

function isDismissed(): boolean {
    try {
        return sessionStorage.getItem(LANDSCAPE_HINT_DISMISS_KEY) === '1';
    } catch {
        return false;
    }
}

const LandscapeHintComponent: React.FC = () => {
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        setDismissed(isDismissed());

        const mql = window.matchMedia(LANDSCAPE_HINT_QUERY);
        setIsPortraitMobile(mql.matches);

        const onChange = (e: MediaQueryListEvent) => setIsPortraitMobile(e.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    const handleDismiss = useCallback(() => {
        setDismissed(true);
        try {
            sessionStorage.setItem(LANDSCAPE_HINT_DISMISS_KEY, '1');
        } catch {
            // sessionStorage indisponible : masquage valable pour ce montage uniquement
        }
    }, []);

    if (!isPortraitMobile || dismissed) return null;

    return (
        <div
            role="status"
            data-testid="landscape-hint"
            className="pointer-events-auto absolute inset-x-2 top-2 z-40 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-black/70 px-3 py-2 text-[12px] font-semibold text-amber-100 shadow-lg backdrop-blur-md"
        >
            <span aria-hidden="true" className="inline-block animate-pulse text-base">
                📱
            </span>
            <span className="flex-1">Tournez votre appareil en paysage pour un plateau plus lisible.</span>
            <button
                type="button"
                onClick={handleDismiss}
                data-testid="landscape-hint-dismiss"
                aria-label="Fermer l'invitation à passer en paysage"
                className="rounded-md border border-amber-400/40 px-2 py-0.5 text-amber-200 transition hover:bg-amber-400/20 active:scale-95"
            >
                ✕
            </button>
        </div>
    );
};

export const LandscapeHint = React.memo(LandscapeHintComponent);

export default LandscapeHint;
