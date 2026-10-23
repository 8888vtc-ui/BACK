/**
 * Hook de détection de plateforme (tactile vs souris).
 *
 * Rôle :
 *   Détecte si l'appareil est tactile (mobile/tablette) ou à souris (desktop),
 *   pour router vers les bons contrôles (`useMobileTouchControls` vs `useDesktopControls`).
 *
 * Méthode : `matchMedia('(pointer: coarse)')` — fiable et standard.
 * Repli : `'ontouchstart' in window` pour les navigateurs anciens.
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `page.tsx`.
 */

import { useEffect, useState } from 'react';

export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const coarseQuery = window.matchMedia?.('(pointer: coarse)');
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        const compute = () => {
            if (coarseQuery) {
                setIsTouch(coarseQuery.matches);
            } else {
                setIsTouch(hasTouch);
            }
        };

        compute();

        if (coarseQuery?.addEventListener) {
            coarseQuery.addEventListener('change', compute);
            return () => coarseQuery.removeEventListener('change', compute);
        }
    }, []);

    return isTouch;
}
