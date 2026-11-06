'use client';

/**
 * @file src/components/hud/HudCenterFeedback.tsx
 * @description Bloc central du HUD affichant l'alerte de barre, le badge de verdict et la notation du dernier coup (< 75 lignes, 0 any).
 */

import React from 'react';
import type { LastMoveFeedback } from '../../hooks/useCoachHelpers';
import type { ChameleonLayer } from '../../features/chameleon/chameleonProfile';

export interface HudCenterFeedbackProps {
    readonly hasBarChecker: boolean;
    readonly isHumanTurn: boolean;
    readonly barCount: number;
    readonly entryTargetText: string;
    readonly lastMoveFeedback?: LastMoveFeedback | null;
    readonly chameleonLayer: ChameleonLayer;
    readonly isEn: boolean;
    readonly onTriggerCoach?: () => void;
    readonly lastMoveNotation?: string | null;
}

export function getHudVerdictConfig(fb: LastMoveFeedback, layer: ChameleonLayer = 1, isEn = false): { dotClass: string; label: string; badgeClass: string } {
    const absLoss = Math.abs(fb.equityLoss);
    const mwcPct = Math.max(1, Math.round(absLoss * 50));
    const lossStr = layer === 0 ? `(-${mwcPct}% chances)` : `(-${absLoss.toFixed(3)}) · -${mwcPct}%`;
    if (absLoss <= 0.020 || fb.verdict === 'optimal' || fb.verdict === 'good') {
        return { dotClass: 'bg-emerald-400', label: isEn ? 'OPTIMAL MOVE' : 'COUP OPTIMAL', badgeClass: 'border-emerald-400/70 bg-emerald-950/90 text-emerald-100' };
    }
    if (absLoss < 0.080 || fb.verdict === 'inaccuracy') {
        return { dotClass: 'bg-amber-400', label: `${isEn ? 'INACCURACY' : 'IMPRÉCISION'} ${lossStr}`, badgeClass: 'border-amber-400/75 bg-amber-950/90 text-amber-100' };
    }
    return { dotClass: 'bg-rose-400', label: `${isEn ? 'BLUNDER' : 'BLUNDER MAJEUR'} ${lossStr}`, badgeClass: 'border-rose-400/80 bg-rose-950/90 text-rose-100' };
}

export const HudCenterFeedback: React.FC<HudCenterFeedbackProps> = React.memo(({
    hasBarChecker,
    isHumanTurn,
    barCount,
    entryTargetText,
    lastMoveFeedback,
    chameleonLayer,
    isEn,
    onTriggerCoach,
    lastMoveNotation,
}) => {
    return (
        <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-1.5 overflow-hidden px-1">
            {hasBarChecker && isHumanTurn && (
                <span
                    data-testid="hud-bar-checker-alert"
                    className="flex items-center gap-1.5 shrink-0 rounded-lg border border-rose-500/60 bg-rose-950/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-100 animate-pulse"
                >
                    <span className="h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                    <span>{barCount} {isEn ? `on the bar: mandatory entry (${entryTargetText})` : `sur la barre : rentrée obligatoire (${entryTargetText})`}</span>
                </span>
            )}
            {lastMoveFeedback && (() => {
                const v = getHudVerdictConfig(lastMoveFeedback, chameleonLayer, isEn);
                return (
                    <button
                        type="button"
                        onClick={onTriggerCoach}
                        data-testid="hud-verdict-badge"
                        className={`${hasBarChecker && isHumanTurn ? 'hidden 2xl:flex' : 'flex'} items-center gap-1.5 shrink-0 whitespace-nowrap rounded-lg border px-2 py-0.5 font-mono text-[11px] font-extrabold tracking-wide tabular-nums transition hover:brightness-110 ${v.badgeClass}`}
                    >
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${v.dotClass}`} />
                        <span>{v.label}</span>
                    </button>
                );
            })()}
            {lastMoveNotation && (
                <span
                    data-testid="hud-last-move"
                    className="whitespace-nowrap truncate rounded-lg border border-white/10 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums text-amber-200"
                >
                    <span className="hidden xl:inline font-sans font-normal text-slate-400 mr-1">{isEn ? 'Last move:' : 'Dernier coup :'}</span>
                    {lastMoveNotation}
                </span>
            )}
        </div>
    );
});

HudCenterFeedback.displayName = 'HudCenterFeedback';
export default HudCenterFeedback;
