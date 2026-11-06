'use client';

/**
 * @file src/components/nav/NavbarPointsAndBadges.tsx
 * @description Affichage dynamique des Points de Cercle (10 000 PTS), ER / PR et Rating selon la porte active.
 * En mode DÉBUTANT : masque ER/PR et Elo pour ne pas intimider, affiche uniquement les Points de Cercle.
 * Strictement <= 120 lignes, 0 any.
 */

import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { useTranslation } from '../../i18n';
import {
    CIRCLE_POINTS_STORAGE_KEY,
    INITIAL_CIRCLE_POINTS,
    getCirclePointsState,
} from '../../features/points/circlePointsEconomy';

interface NavbarPointsAndBadgesProps {
    readonly tierGate: PlayerTierGate;
    readonly userElo?: number;
    readonly averagePr?: number | null;
    readonly showStats?: boolean;
}

export const NavbarPointsAndBadges: React.FC<NavbarPointsAndBadgesProps> = React.memo(({
    tierGate,
    userElo,
    averagePr,
    showStats = true,
}) => {
    const [points, setPoints] = useState<number>(INITIAL_CIRCLE_POINTS);
    const stats = useAuthenticPlayerStats();
    const { locale } = useTranslation();
    const isEn = locale === 'en';

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
    const displayElo = userElo !== undefined ? userElo : stats.eloRating;
    const calibratingText = isEn ? 'PR: Calibrating' : 'PR : En calibrage';
    const displayPr = averagePr !== undefined
        ? (averagePr !== null ? `PR ${averagePr.toFixed(1)}` : calibratingText)
        : (stats.hasRealPR ? `PR ${stats.globalPR?.toFixed(1)}` : calibratingText);
    const formattedPoints = points.toLocaleString(isEn ? 'en-US' : 'fr-FR');

    return (
        <div data-testid="navbar-stats-container" className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            {showStats && !isBeginner && stats.isRegistered && (
                <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
                    <span
                        data-testid="navbar-erpr-badge"
                        title={isEn ? 'Official Performance Rating' : 'Performance Rating officiel'}
                        className={`rounded-lg border px-2 py-1 font-bold tabular-nums shadow-sm ${stats.hasRealPR ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400' : 'border-amber-500/30 bg-amber-950/40 text-amber-300'}`}
                    >
                        {displayPr}
                    </span>
                    <span
                        data-testid="navbar-rating-badge"
                        title={isEn ? 'Official Competitive Rating' : 'Classement compétitif officiel'}
                        className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-2 py-1 font-bold text-amber-300 tabular-nums shadow-sm"
                    >
                        {displayElo ?? 1500} Elo
                    </span>
                </div>
            )}

            {/* Solde des Points de Cercle — Affiché en permanence sur tous les niveaux */}
            <div
                data-testid="navbar-points-badge"
                title={isEn ? 'Monte-Carlo Circle Points (10,000 initial PTS)' : 'Capital de Points de Cercle Monte-Carlo (10 000 PTS initiaux)'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#f3c65f]/35 bg-[#f3c65f]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#f3c65f] tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0 whitespace-nowrap min-w-max"
            >
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={1.75} />
                <span className="shrink-0 whitespace-nowrap">{formattedPoints} PTS</span>
            </div>
        </div>
    );
});

NavbarPointsAndBadges.displayName = 'NavbarPointsAndBadges';
export default NavbarPointsAndBadges;

