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

import React, { useCallback, useEffect, useState } from 'react';
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
    // ANTI-HYDRATATION : valeur initiale constante (identique SSR/CSR), puis
    // synchronisation de la préférence persistée après le montage.
    const [visible, setVisible] = useState<boolean>(true);

    useEffect(() => {
        const saved = getSavedPipCountVisibility(true);
        if (saved !== true) setVisible(saved);
    }, []);

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
        <div
            data-testid="pip-count-bar"
            className="flex items-center justify-between gap-2 px-2 pt-2 text-[11px] font-semibold text-slate-300 shrink-0"
        >
            <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-slate-700/80 bg-slate-900/70 px-1.5 py-0.5 font-mono">
                    O {pipO}
                </span>
                <span className="rounded-md border border-slate-700/80 bg-slate-900/70 px-1.5 py-0.5 font-mono">
                    X {pipX}
                </span>
                {visible && (
                    <span
                        data-testid="pip-diff-badge"
                        className={`rounded-full border px-2 py-0.5 font-mono font-bold ${leading
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                            }`}
                        title={`Écart de course (${turn} au trait) — ${leading ? 'en avance' : 'en retard'}`}
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
                className="rounded-md border border-slate-700/80 bg-slate-900/70 px-1.5 py-0.5 text-slate-400 transition-colors hover:text-white"
            >
                {visible ? '👁' : '👁‍🗨'}
            </button>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PipCountBadge = React.memo(PipCountBadgeComponent);

export default PipCountBadge;
