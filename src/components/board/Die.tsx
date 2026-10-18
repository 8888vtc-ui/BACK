'use client';

/**
 * Dé vectoriel (pips SVG) réutilisable pour le plateau et le HUD.
 *
 * Affiche un dé de backgammon avec des pips vectoriels réalistes (1 à 6),
 * avec gestion des états : `used` (barré), `active` (sélectionné), `disabled`.
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx` / `MatchHud.tsx`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';

/** Positions des pips (coordonnées en pourcentage, viewBox 0..100). */
export const DIE_PIPS: Record<number, Array<[number, number]>> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

export interface DieProps {
    /** Valeur du dé (1 à 6). */
    value: number;
    /** Dé déjà utilisé (barré). */
    used?: boolean;
    /** Dé actuellement sélectionné. */
    active?: boolean;
    /** Dé désactivé (non cliquable). */
    disabled?: boolean;
    /** Libellé accessible. */
    label?: string;
    /** Taille du dé (classe Tailwind, ex. `w-12 h-12`). */
    sizeClass?: string;
    /** Identifiant de test (data-testid). */
    dataTestId?: string;
    /** Callback au clic. */
    onClick?: (e: React.MouseEvent) => void;
    /** Callback au double-clic. */
    onDoubleClick?: (e: React.MouseEvent) => void;
}

const DieComponent: React.FC<DieProps> = ({
    value,
    used = false,
    active = false,
    disabled = false,
    label,
    sizeClass = 'w-12 h-12',
    dataTestId,
    onClick,
    onDoubleClick,
}) => {
    const pips = DIE_PIPS[value] ?? [[50, 50]];

    return (
        <button
            type="button"
            disabled={disabled}
            data-testid={dataTestId}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            aria-label={label ?? `Dé : ${value}`}
            title={label ?? `Dé : ${value}${used ? ' (déjà utilisé)' : ''}`}
            className={`${sizeClass} rounded-lg flex items-center justify-center shadow-md border-2 transition ${used
                ? 'bg-slate-200 border-slate-400 opacity-60'
                : active
                    ? 'bg-white border-sky-400 ring-2 ring-sky-400'
                    : 'bg-white border-slate-300 hover:border-sky-300'
                }`}
        >
            <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
                {pips.map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill={used ? '#94a3b8' : '#0f172a'}
                    />
                ))}
            </svg>
            {used && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                    <svg
                        className="w-1/2 h-1/2 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const Die = React.memo(DieComponent);

export default Die;
