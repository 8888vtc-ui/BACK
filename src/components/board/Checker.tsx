'use client';

/**
 * Pion 3D acrylique (style Crisloid / Hector Saxe) — rendu SVG natif.
 *
 * Rendu haut de gamme :
 *   - `<radialGradient>` pour le reflet de lumière sur la résine (haut-gauche).
 *   - `<feDropShadow>` pour l'ombre portée réelle sur la feutrine.
 *   - Anneau central concave (dégradé inversé) pour l'effet « pion tourné ».
 *   - Halo doré quand le pion est jouable.
 *   - Badge numérique doré pour les piles ≥ 2 pions.
 *
 * Le SVG utilise un `viewBox` fixe (100×100) et se dimensionne via CSS
 * (`width`/`height` en `clamp`), ce qui garantit un rendu net à toutes les
 * tailles sans dépendre de `boardGeometry.ts` (découplage total).
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Mémoïsé (`React.memo`).
 */

import React, { useId } from 'react';

export type CheckerColor = 'white' | 'black';

/** Seuil minimal de pions pour afficher le badge numérique. */
export const BADGE_MIN_COUNT = 2;

export interface CheckerProps {
    color: CheckerColor;
    countBadge?: number;
    isPlayable?: boolean;
    isTopChecker?: boolean;
}

const CheckerComponent: React.FC<CheckerProps> = ({
    color,
    countBadge,
    isPlayable = false,
    isTopChecker = false,
}) => {
    const isWhite = color === 'white';
    const isInteractive = isPlayable && isTopChecker;

    // Identifiants uniques par instance (évite les collisions de `<defs>` SVG
    // lorsque plusieurs pions sont rendus dans le même document).
    const uid = useId().replace(/:/g, '');
    const bodyGradId = `checker-body-${uid}`;
    const ringGradId = `checker-ring-${uid}`;
    const shadowId = `checker-shadow-${uid}`;
    const glossId = `checker-gloss-${uid}`;

    return (
        <div
            className={`relative flex items-center justify-center select-none transition-all duration-150 ease-out ${isInteractive
                ? 'cursor-pointer hover:-translate-y-1 hover:scale-105'
                : ''
                }`}
            style={{
                width: 'clamp(22px, 3.2vw, 56px)',
                height: 'clamp(22px, 3.2vw, 56px)',
                outline: isInteractive ? '2px solid rgba(251,191,36,0.75)' : 'none',
                outlineOffset: '1px',
                borderRadius: '9999px',
            }}
        >
            <svg
                viewBox="0 0 100 100"
                className="h-full w-full"
                aria-hidden="true"
                focusable="false"
            >
                <defs>
                    {/* Ombre portée sur la feutrine (filtre SVG natif). */}
                    <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%">
                        <feDropShadow
                            dx="0"
                            dy="4"
                            stdDeviation="3.5"
                            floodColor="#000000"
                            floodOpacity={isWhite ? 0.55 : 0.75}
                        />
                    </filter>

                    {/* Corps du pion : reflet haut-gauche → corps → ombre basse. */}
                    <radialGradient id={bodyGradId} cx="32%" cy="26%" r="78%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="26%" stopColor="#fdf8ee" />
                                <stop offset="60%" stopColor="#e8dcc0" />
                                <stop offset="86%" stopColor="#b9a37c" />
                                <stop offset="100%" stopColor="#8a7350" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#6b6b74" />
                                <stop offset="28%" stopColor="#3f3f46" />
                                <stop offset="62%" stopColor="#232327" />
                                <stop offset="86%" stopColor="#101013" />
                                <stop offset="100%" stopColor="#050506" />
                            </>
                        )}
                    </radialGradient>

                    {/* Anneau central concave (lumière inversée). */}
                    <radialGradient id={ringGradId} cx="68%" cy="72%" r="72%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="45%" stopColor="#f2e8d4" />
                                <stop offset="100%" stopColor="#c9b48c" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#4a4a52" />
                                <stop offset="50%" stopColor="#26262b" />
                                <stop offset="100%" stopColor="#0c0c0e" />
                            </>
                        )}
                    </radialGradient>

                    {/* Reflet spéculaire (vernis acrylique). */}
                    <radialGradient id={glossId} cx="30%" cy="22%" r="42%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? 0.85 : 0.35} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Corps + ombre portée */}
                <g filter={`url(#${shadowId})`}>
                    <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill={`url(#${bodyGradId})`}
                        stroke={isWhite ? 'rgba(255,255,255,0.55)' : 'rgba(120,120,130,0.45)'}
                        strokeWidth="1.5"
                    />
                </g>

                {/* Anneau central concave */}
                <circle cx="50" cy="50" r="31" fill={`url(#${ringGradId})`} />

                {/* Reflet spéculaire haut-gauche */}
                <ellipse cx="36" cy="30" rx="20" ry="14" fill={`url(#${glossId})`} />

                {/* Liseré interne de finition */}
                <circle
                    cx="50"
                    cy="50"
                    r="31"
                    fill="none"
                    stroke={isWhite ? 'rgba(95,72,40,0.35)' : 'rgba(255,255,255,0.10)'}
                    strokeWidth="1"
                />
            </svg>

            {/* Badge numérique (HTML, au-dessus du SVG pour la lisibilité). */}
            {countBadge !== undefined && countBadge >= BADGE_MIN_COUNT && (
                <span
                    data-testid="checker-count-badge"
                    className={`absolute flex items-center justify-center min-w-[20px] h-[20px] rounded-full px-1 text-[11px] font-black leading-none shadow-lg ring-1 ${isWhite
                        ? 'bg-amber-950 text-amber-100 ring-amber-300/60'
                        : 'bg-amber-400 text-slate-950 ring-amber-200/80'
                        }`}
                >
                    {countBadge}
                </span>
            )}
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const Checker = React.memo(CheckerComponent);

export default Checker;
