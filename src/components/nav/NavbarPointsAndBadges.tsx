'use client';

/**
 * @file src/components/nav/NavbarPointsAndBadges.tsx
 * @description Affichage dynamique des Points de Cercle (10 000 PTS), ER / PR et Rating selon la porte active.
 * En mode DÉBUTANT : masque ER/PR et Elo pour ne pas intimider, affiche uniquement les Points de Cercle.
 * Strictement <= 120 lignes, 0 any.
 */

import React, { useEffect, useState } from 'react';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';
import {
    CIRCLE_POINTS_STORAGE_KEY,
    INITIAL_CIRCLE_POINTS,
    getCirclePointsState,
} from '../../features/points/circlePointsEconomy';

interface NavbarPointsAndBadgesProps {
    readonly tierGate: PlayerTierGate;
    readonly userElo?: number;
    readonly averagePr?: number | null;
}

export const NavbarPointsAndBadges: React.FC<NavbarPointsAndBadgesProps> = React.memo(({
    tierGate,
    userElo = 1500,
    averagePr = 6.3,
}) => {
    const [points, setPoints] = useState<number>(INITIAL_CIRCLE_POINTS);

    useEffect(() => {
        setPoints(getCirclePointsState().balance);

        const onStorage = (e: StorageEvent) => {
            if (e.key === CIRCLE_POINTS_STORAGE_KEY) {
                setPoints(getCirclePointsState().balance);
            }
        };

        const onPointsUpdated = () => {
            setPoints(getCirclePointsState().balance);
        };

        window.addEventListener('storage', onStorage);
        window.addEventListener('bgtour-points-updated', onPointsUpdated);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('bgtour-points-updated', onPointsUpdated);
        };
    }, []);

    const isBeginner = tierGate === 'BEGINNER';
    const prDisplay = typeof averagePr === 'number' ? `PR ${averagePr.toFixed(1)}` : 'PR 6.3';

    return (
        <div data-testid="navbar-stats-container" className="flex items-center gap-1.5 sm:gap-2">
            {!isBeginner && (
                <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
                    <span
                        data-testid="navbar-erpr-badge"
                        title="Performance Rating officiel"
                        className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2 py-1 font-bold text-emerald-400 tabular-nums shadow-sm"
                    >
                        {prDisplay}
                    </span>
                    <span
                        data-testid="navbar-rating-badge"
                        title="Classement compétitif officiel"
                        className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-2 py-1 font-bold text-amber-300 tabular-nums shadow-sm"
                    >
                        {userElo} Elo
                    </span>
                </div>
            )}

            {/* Solde des Points de Cercle — Affiché en permanence sur tous les niveaux */}
            <div
                data-testid="navbar-points-badge"
                title="Capital de Points de Cercle Monte-Carlo (10 000 PTS initiaux)"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#f3c65f]/35 bg-[#f3c65f]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#f3c65f] tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
                <span aria-hidden="true" className="text-amber-400">🪙</span>
                <span>{points.toLocaleString('fr-FR')} PTS</span>
            </div>
        </div>
    );
});

NavbarPointsAndBadges.displayName = 'NavbarPointsAndBadges';
export default NavbarPointsAndBadges;

