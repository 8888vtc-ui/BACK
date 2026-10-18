'use client';

/**
 * Badge de Pip Count Différentiel (±Δ) avec pastille couleur.
 *
 * Affiche le pip count absolu de chaque joueur (X et O) ainsi que le
 * différentiel Δ = pipX - pipO, coloré en vert (avance) ou rouge (retard)
 * du point de vue du joueur au trait.
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx`.
 * Mémoïsé (`React.memo`).
 *
 * Inclut un toggle pour masquer/afficher le pip count (persisté en localStorage).
 */

import React, { useCallback, useState } from 'react';
import type { Player } from '../../engine/backgammonEngine';

/** Clé de persistance du toggle pip count. */
export const PIP_COUNT_STORAGE_KEY = 'backgammon_show_pipcount';

/**
 * Calcule le différentiel de pip count entre X et O.
 *
 * @param pipX - Pip count du joueur X.
 * @param pipO - Pip count du joueur O.
 * @returns Différentiel signé (positif = X en avance).
 */
export function computePipDiff(pipX: number, pipO: number): number {
    return pipX - pipO;
}

/**
 * Détermine si le joueur au trait est en avance (true) ou en retard (false).
 *
 * @param diff - Différentiel signé (positif = X en avance).
 * @param turn - Joueur au trait.
 * @returns `true` si le joueur au trait est en avance.
 */
export function isLeading(diff: number, turn: Player): boolean {
    // diff = pipX - pipO. Un pip count plus bas = en avance.
    // X en avance ⟺ pipX < pipO ⟺ diff < 0.
    // O en avance ⟺ pipO < pipX ⟺ diff > 0.
    return turn === 'X' ? diff < 0 : diff > 0;
}

/**
 * Lit la préférence d'affichage du pip count depuis localStorage (SSR-safe).
 */
export function getSavedPipCountVisibility(defaultValue = true): boolean {
    if (typeof localStorage === 'undefined') return defaultValue;
    try {
        const saved = localStorage.getItem(PIP_COUNT_STORAGE_KEY);
        if (saved === 'false') return false;
        if (saved === 'true') return true;
    } catch {
        // localStorage indisponible
    }
    return defaultValue;
}

export interface PipCountBadgeProps {
    /** Pip count du joueur X. */
    pipX: number;
    /** Pip count du joueur O. */
    pipO: number;
    /** Joueur au trait (détermine le sens de la pastille). */
    turn: Player;
}

const PipCountBadgeComponent: React.FC<PipCountBadgeProps> = ({ pipX, pipO, turn }) => {
    const [visible, setVisible] = useState<boolean>(() => getSavedPipCountVisibility(true));

    const diff = computePipDiff(pipX, pipO);
    const leading = isLeading(diff, turn);
    const absDiff = Math.abs(diff);
    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '±';

    const toggleVisibility = useCallback(() => {
        setVisible((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(PIP_COUNT_STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, []);

    return (
        <div className="flex items-center justify-between px-2 pt-3 text-xs font-semibold text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
                    O : {pipO}
                </span>
                <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
                    X : {pipX}
                </span>
                {visible && (
                    <span
                        data-testid="pip-diff-badge"
                        className={`px-2 py-1 rounded-full font-bold border ${leading
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                        title={`Différentiel de pip count (${turn} au trait)`}
                    >
                        {sign}
                        {absDiff}
                    </span>
                )}
            </div>
            <button
                type="button"
                onClick={toggleVisibility}
                aria-label={visible ? 'Masquer le pip count' : 'Afficher le pip count'}
                aria-pressed={visible}
                title={visible ? 'Masquer le pip count' : 'Afficher le pip count'}
                data-testid="pip-count-toggle"
                className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
                {visible ? '👁' : '👁‍🗨'}
            </button>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PipCountBadge = React.memo(PipCountBadgeComponent);

export default PipCountBadge;
