'use client';

/**
 * Badge d'Horloge Compétitive Fischer / Bronstein (Audit 15 / 20).
 *
 * Exigences :
 *   1. Affichage tabulaire haute lisibilité (`MM:SS` puis `8.4s` au dixième sous 10s).
 *   2. Indicateur de délai gratuit (`+12s`) sans saut de mise en page.
 *   3. Flash rouge critique non-bloquant (`pointer-events-none`) sous 10 secondes.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';

export interface FischerClockBadgeProps {
    player: Player;
    formattedTime: string;
    formattedDelay?: string | null;
    isActiveTurn: boolean;
    isCritical?: boolean;
    isFlagFallen?: boolean;
}

const FischerClockBadgeComponent: React.FC<FischerClockBadgeProps> = ({
    player,
    formattedTime,
    formattedDelay = null,
    isActiveTurn,
    isCritical = false,
    isFlagFallen = false,
}) => {
    const testId = `fischer-clock-${player.toLowerCase()}`;

    return (
        <div
            data-testid={testId}
            data-active-turn={isActiveTurn ? 'true' : 'false'}
            data-critical-flash={isCritical ? 'true' : 'false'}
            data-flag-fallen={isFlagFallen ? 'true' : 'false'}
            role="timer"
            aria-live={isCritical ? 'assertive' : 'off'}
            aria-label={`Horloge joueur ${player} : ${formattedTime}${
                isActiveTurn && formattedDelay ? ` (délai ${formattedDelay})` : ''
            }`}
            className={`relative inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] font-black tabular-nums select-none transition-[transform,opacity] duration-150 ${
                isFlagFallen
                    ? 'border-rose-500 bg-rose-950/90 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.65)]'
                    : isCritical
                      ? 'border-rose-400 bg-rose-600/25 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse'
                      : isActiveTurn
                        ? 'border-amber-400/70 bg-slate-900/95 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                        : 'border-slate-700/60 bg-slate-900/60 text-slate-400 opacity-80'
            }`}
        >
            {/* Halo flash rouge non-bloquant (pointer-events-none) sous 10s */}
            {isCritical && (
                <span
                    data-testid={`${testId}-red-flash`}
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-0.5 rounded-md ring-2 ring-rose-500/80 animate-ping opacity-40"
                />
            )}

            {isActiveTurn && formattedDelay && !isFlagFallen && (
                <span
                    data-testid={`${testId}-delay`}
                    className="rounded bg-emerald-500/20 border border-emerald-400/50 px-1 text-[9px] font-bold text-emerald-300"
                >
                    {formattedDelay}
                </span>
            )}

            <span data-testid={`${testId}-time`}>
                {isFlagFallen ? '0.0s' : formattedTime}
            </span>
        </div>
    );
};

export const FischerClockBadge = React.memo(FischerClockBadgeComponent);
export default FischerClockBadge;
