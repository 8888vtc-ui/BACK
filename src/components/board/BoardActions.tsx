'use client';

/**
 * @file src/components/board/BoardActions.tsx
 * @description Sous-composants d'actions de plateau (Sélecteur Auto-Confirm 4 modes,
 * libellés de cadence et ré-export de `MobileThumbDock`).
 * Strictement < 300 lignes, 0 `any`.
 */

import React, { useState } from 'react';
import { impactLight } from '../../lib/capacitor/haptics';
import type { GameSpeed } from '../../lib/gameFeel/speedPresets';
import { AUTO_CONFIRM_MODES, type AutoConfirmMode } from '../../lib/settings/gameplaySettings';

export {
    MobileThumbDock,
    type MobileThumbDockProps,
    type PrimaryDockActionState,
} from './MobileThumbDock';

/** Libellés du sélecteur de cadence (Game Feel §3). */
export const SPEED_LABELS: Record<GameSpeed, { icon: string; label: string; title: string }> = {
    coach: { icon: '🎓', label: 'Coach', title: 'Cadence Coach : flèches d’intention avant chaque coup du Bot' },
    tournament: { icon: '⏱', label: 'Tournoi', title: 'Cadence Tournoi : fluide et lisible, sans temps mort' },
    blitz: { icon: '⏩', label: 'Blitz', title: 'Cadence Blitz : Bot ultra-rapide, aucune prévisualisation' },
};

/** Libellés des 4 modes d'auto-confirmation (Game Feel §5). */
export const AUTO_CONFIRM_MODE_LABELS: Record<AutoConfirmMode, { badge: string; label: string; description: string }> = {
    never: {
        badge: 'OFF',
        label: 'Manuel (Jamais)',
        description: 'Nécessite toujours un clic sur Valider ou sur les dés',
    },
    forced_only: {
        badge: 'FORCÉ',
        label: 'Coups forcés (Tournoi)',
        description: 'Valide auto uniquement quand aucun autre choix tactique n’existe',
    },
    always_except_cube: {
        badge: 'VIDEAU',
        label: 'Auto hors Videau',
        description: 'Valide auto sauf si l’adversaire a une décision critique de videau',
    },
    always: {
        badge: 'ON',
        label: 'Toujours (Rapide)',
        description: 'Valide immédiatement dès l’épuisement des dés jouables',
    },
};

export interface AutoConfirmControlProps {
    readonly resolvedMode: AutoConfirmMode;
    readonly isAutoActive: boolean;
    readonly autoConfirmMode?: AutoConfirmMode;
    readonly compact?: boolean;
    readonly onToggleAutoConfirm?: () => void;
    readonly onSelectAutoConfirmMode?: (mode: AutoConfirmMode) => void;
    readonly onCycleAutoConfirmMode?: () => void;
}

export const AutoConfirmControl: React.FC<AutoConfirmControlProps> = ({
    resolvedMode,
    isAutoActive,
    autoConfirmMode,
    compact = true,
    onToggleAutoConfirm,
    onSelectAutoConfirmMode,
    onCycleAutoConfirmMode,
}) => {
    const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
    const meta = AUTO_CONFIRM_MODE_LABELS[resolvedMode];

    return (
        <div className="relative inline-flex items-center">
            <button
                type="button"
                data-testid="toggle-auto-confirm-btn"
                data-auto-confirm-mode={resolvedMode}
                aria-pressed={isAutoActive}
                title={`${meta.label} — ${meta.description}`}
                onClick={(e) => {
                    e.stopPropagation();
                    void impactLight();
                    if (onToggleAutoConfirm) onToggleAutoConfirm();
                    else if (onCycleAutoConfirmMode) onCycleAutoConfirmMode();
                }}
                className={`rounded-l-full ${onSelectAutoConfirmMode || onCycleAutoConfirmMode ? 'pr-1.5' : 'rounded-r-full'} border px-2.5 ${compact ? 'py-1' : 'py-1.5'} text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-sm transition whitespace-nowrap touch-manipulation ${
                    isAutoActive
                        ? 'border-[#f3c65f]/80 bg-[#2a1c0b]/95 text-[#fce8b2]'
                        : 'border-[#d4af37]/35 bg-[#140b06]/90 text-amber-100/70 hover:border-[#f3c65f]/60 hover:text-amber-100'
                }`}
            >
                ⚡ Auto{autoConfirmMode ? ` · ${meta.badge}` : ''}
            </button>
            {(onSelectAutoConfirmMode || onCycleAutoConfirmMode) && (
                <button
                    type="button"
                    data-testid="auto-confirm-mode-menu-btn"
                    aria-expanded={isModeMenuOpen}
                    aria-label="Choisir le mode de validation automatique"
                    title="Choisir le mode de validation automatique"
                    onClick={(e) => {
                        e.stopPropagation();
                        void impactLight();
                        setIsModeMenuOpen((prev) => !prev);
                    }}
                    className={`rounded-r-full border border-l-0 px-1.5 ${compact ? 'py-1' : 'py-1.5'} text-[10px] font-bold transition touch-manipulation ${
                        isAutoActive
                            ? 'border-[#f3c65f]/80 bg-[#2a1c0b]/95 text-[#fce8b2]'
                            : 'border-[#d4af37]/35 bg-[#140b06]/90 text-amber-100/70 hover:text-amber-100'
                    }`}
                >
                    ▾
                </button>
            )}
            {isModeMenuOpen && (
                <div
                    data-testid="auto-confirm-mode-popover"
                    role="menu"
                    aria-label="Modes de validation de fin de tour"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full right-0 mb-2 z-50 w-56 rounded-xl border border-[#d4af37]/65 bg-[#140b06]/98 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.92)] backdrop-blur-md flex flex-col gap-1"
                >
                    {AUTO_CONFIRM_MODES.map((m) => {
                        const item = AUTO_CONFIRM_MODE_LABELS[m];
                        const active = resolvedMode === m;
                        return (
                            <button
                                key={m}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                data-testid={`auto-confirm-mode-option-${m}`}
                                onClick={() => {
                                    void impactLight();
                                    onSelectAutoConfirmMode?.(m);
                                    setIsModeMenuOpen(false);
                                }}
                                className={`flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition ${
                                    active
                                        ? 'border border-[#f3c65f]/70 bg-amber-500/20 text-[#fff3c4]'
                                        : 'border border-transparent text-amber-100/80 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                                    {active ? '✓ ' : ''}{item.label}
                                </span>
                                <span className="text-[11px] text-amber-200/65 leading-tight">
                                    {item.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
