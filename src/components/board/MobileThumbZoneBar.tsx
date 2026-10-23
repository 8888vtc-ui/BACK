'use client';

/**
 * Barre de Navigation Mobile à 1 Main — Thumb Zone (Audit 16 / 20).
 *
 * Exigences :
 *   1. Regroupe tous les contrôles vitaux (Lancer, Valider, Annuler, Doubler, Swap Dés)
 *      dans le quart inférieur de l'écran (`bottom-quarter`), accessible d'un seul pouce.
 *   2. Commutation ergonomique Droitier (`'right'`) / Gaucher (`'left'`) inversant
 *      l'ordre des contrôles pour placer l'action primaire directement sous le pouce actif.
 *   3. Prévention des gestes système parasites (`touch-action: none`, `overscroll-behavior: none`,
 *      zones tactiles WCAG ≥ 44×44 px).
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React, { useCallback, useState } from 'react';
import {
    getSavedMobileHandedness,
    getThumbZoneGestureProtectionStyle,
    saveMobileHandedness,
    shouldPreventSystemEdgeSwipe,
    toggleMobileHandedness,
    type MobileHandedness,
} from '../../hooks/useMobileTouchControls';

export interface MobileThumbZoneBarProps {
    canRoll: boolean;
    canConfirm: boolean;
    canUndo: boolean;
    canDouble?: boolean;
    canSwapDice?: boolean;
    onRoll: () => void;
    onConfirm: () => void;
    onUndo: () => void;
    onOfferDouble?: () => void;
    onSwapDice?: () => void;
    handedness?: MobileHandedness;
    onHandednessChange?: (next: MobileHandedness) => void;
}

const MobileThumbZoneBarComponent: React.FC<MobileThumbZoneBarProps> = ({
    canRoll,
    canConfirm,
    canUndo,
    canDouble = false,
    canSwapDice = false,
    onRoll,
    onConfirm,
    onUndo,
    onOfferDouble,
    onSwapDice,
    handedness: externalHandedness,
    onHandednessChange,
}) => {
    const [internalHandedness, setInternalHandedness] = useState<MobileHandedness>(() =>
        getSavedMobileHandedness('right'),
    );

    const activeHandedness = externalHandedness ?? internalHandedness;
    const isLeftHanded = activeHandedness === 'left';

    const handleToggleHandedness = useCallback(() => {
        const next = toggleMobileHandedness(activeHandedness);
        setInternalHandedness(next);
        saveMobileHandedness(next);
        onHandednessChange?.(next);
    }, [activeHandedness, onHandednessChange]);

    const handleTouchStartGuard = useCallback((e: React.TouchEvent<HTMLElement>) => {
        const touch = e.touches?.[0];
        if (!touch || typeof window === 'undefined') return;
        if (shouldPreventSystemEdgeSwipe(touch.clientX, window.innerWidth)) {
            e.stopPropagation();
        }
    }, []);

    const gestureProtectionStyle = getThumbZoneGestureProtectionStyle(true);

    return (
        <nav
            data-testid="mobile-thumb-zone-bar"
            data-thumb-zone="bottom-quarter"
            data-handedness={activeHandedness}
            aria-label="Contrôles mobiles à une main (Thumb Zone)"
            onTouchStart={handleTouchStartGuard}
            style={gestureProtectionStyle}
            className={`fixed bottom-2 left-3 right-3 z-40 mx-auto max-w-md max-h-[22dvh] rounded-2xl border border-amber-500/35 bg-slate-950/92 px-2.5 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.75)] backdrop-blur-md flex items-center justify-between gap-2 select-none touch-none overscroll-none ${
                isLeftHanded ? 'flex-row-reverse' : 'flex-row'
            }`}
        >
            {/* Commutateur Droitier ⇄ Gaucher */}
            <button
                type="button"
                data-testid="btn-toggle-handedness"
                onClick={handleToggleHandedness}
                aria-label={isLeftHanded ? 'Mode Gaucher actif — Basculer en Droitier' : 'Mode Droitier actif — Basculer en Gaucher'}
                title={isLeftHanded ? 'Mode Gaucher (Cliquer pour Droitier)' : 'Mode Droitier (Cliquer pour Gaucher)'}
                className="min-h-[44px] min-w-[44px] px-2 rounded-xl border border-slate-700/80 bg-slate-900/90 text-[10px] font-bold text-slate-300 hover:text-amber-300 active:scale-95 transition-[transform,opacity] duration-150 flex items-center justify-center shrink-0"
            >
                {isLeftHanded ? '🤚 G' : '✋ D'}
            </button>

            {/* Contrôles secondaires : Annuler / Swap Dés / Doubler */}
            <div
                className={`flex items-center gap-1.5 ${
                    isLeftHanded ? 'flex-row-reverse' : 'flex-row'
                }`}
            >
                <button
                    type="button"
                    data-testid="btn-thumb-undo"
                    disabled={!canUndo}
                    onClick={onUndo}
                    aria-label="Annuler le dernier sous-coup"
                    className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-slate-600/80 bg-slate-800/90 text-xs font-bold text-slate-100 disabled:opacity-35 disabled:pointer-events-none active:scale-95 transition-[transform,opacity] duration-150"
                >
                    ↩ Annuler
                </button>

                {canSwapDice && onSwapDice && (
                    <button
                        type="button"
                        data-testid="btn-thumb-swap-dice"
                        onClick={onSwapDice}
                        aria-label="Inverser l'ordre des dés"
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-amber-500/40 bg-amber-950/60 text-xs font-bold text-amber-200 active:scale-95 transition-[transform,opacity] duration-150"
                    >
                        ⇄ Dés
                    </button>
                )}

                {canDouble && onOfferDouble && (
                    <button
                        type="button"
                        data-testid="btn-thumb-double"
                        onClick={onOfferDouble}
                        aria-label="Proposer le videau (Doubler)"
                        className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-amber-400/70 bg-amber-500/20 text-xs font-black text-amber-300 active:scale-95 transition-[transform,opacity] duration-150"
                    >
                        ×2
                    </button>
                )}
            </div>

            {/* Action Primaire sous le pouce (Lancer ou Valider) */}
            {canConfirm ? (
                <button
                    type="button"
                    data-testid="btn-thumb-confirm"
                    onClick={onConfirm}
                    className="min-h-[44px] min-w-[104px] px-4 rounded-xl border border-emerald-300/80 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_14px_rgba(16,185,129,0.45)] active:scale-95 transition-[transform,opacity] duration-150"
                >
                    ✓ Valider
                </button>
            ) : (
                <button
                    type="button"
                    data-testid="btn-thumb-roll"
                    disabled={!canRoll}
                    onClick={onRoll}
                    className="min-h-[44px] min-w-[104px] px-4 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_14px_rgba(245,158,11,0.45)] disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-[transform,opacity] duration-150"
                >
                    🎲 Lancer
                </button>
            )}
        </nav>
    );
};

export const MobileThumbZoneBar = React.memo(MobileThumbZoneBarComponent);
export default MobileThumbZoneBar;
