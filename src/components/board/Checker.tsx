'use client';

/**
 * Pion de Backgammon 3D en résine acrylique tournée (style Backgammon Galaxy / Crisloid).
 *
 * Rendu haute fidélité :
 *   - SVG vectoriel ultra-net à toute échelle avec viewBox 100×100.
 *   - Transition fluide 300ms `cubic-bezier(0.2, 0.8, 0.2, 1)` et feedback de contact.
 *   - Anneau doré intégré directement au disque SVG pour les pions jouables au sommet de pile
 *     (sans outline HTML détaché).
 *   - Médaillon numérique pour les piles ≥ 2 pions.
 *
 * Dépendances :
 *   Aucune (composant pur). Mémoïsé via React.memo (LOI 5).
 */

import React, { useId } from 'react';
import { getScopedWillChange } from '../../lib/board/gpuAnimation';
import { getCheckerPatternKind } from '../../lib/board/wcagAccessibility';

export type CheckerColor = 'white' | 'black';

/** Seuil minimal de pions pour afficher le badge numérique. */
export const BADGE_MIN_COUNT = 2;

export interface CheckerProps {
    color: CheckerColor;
    countBadge?: number;
    isPlayable?: boolean;
    isTopChecker?: boolean;
    /** Active `will-change: transform, opacity` uniquement pendant le mouvement (Audit 12/20). */
    isActiveMotion?: boolean;
    onPointerDown?: (e: React.PointerEvent) => void;
}

const CheckerComponent: React.FC<CheckerProps> = ({
    color,
    countBadge,
    isPlayable = false,
    isTopChecker = false,
    isActiveMotion = false,
    onPointerDown,
}) => {
    const isWhite = color === 'white';
    const isInteractive = isPlayable && isTopChecker;

    // Identifiants uniques par instance SVG pour isoler filtres, dégradés et angle de marbrure Crisloid
    const uid = useId().replace(/:/g, '');
    const shadowId = `chk-shadow-${uid}`;
    const bodyGradId = `chk-body-${uid}`;
    const dishGradId = `chk-dish-${uid}`;
    const outerBevelId = `chk-bevel-${uid}`;
    const mainGlossId = `chk-gloss-${uid}`;
    const bounceGlossId = `chk-bounce-${uid}`;
    let hash = 0;
    for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) | 0;
    const marblingAngle = ((Math.abs(hash) % 12) * 30) - 180;

    return (
        <div
            data-checker-top={isTopChecker ? 'true' : undefined}
            data-gpu-will-change={getScopedWillChange(isActiveMotion)}
            data-checker-pattern={getCheckerPatternKind(color)}
            className={`relative flex items-center justify-center select-none transition-[transform,opacity] duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] touch-manipulation ${isInteractive
                ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.06] active:scale-95 after:content-[""] after:absolute after:-inset-1.5 after:rounded-full'
                : ''
                }`}
            onPointerDown={isInteractive ? onPointerDown : undefined}
            style={{
                width: 'clamp(26.5px, min(7.4vw, calc((100dvh - 135px) / 11.2)), 46px)',
                height: 'clamp(26.5px, min(7.4vw, calc((100dvh - 135px) / 11.2)), 46px)',
                borderRadius: '9999px',
                touchAction: 'manipulation',
                transform: 'translate3d(0, 0, 0)',
                willChange: getScopedWillChange(isActiveMotion),
            }}
        >
            <svg
                viewBox="0 0 100 100"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
                focusable="false"
                shapeRendering="geometricPrecision"
            >
                <defs>
                    {/* Ombre portée de contact nette sur la feutrine */}
                    <filter id={shadowId} x="-30%" y="-30%" width="160%" height="170%">
                        <feDropShadow
                            dx="0"
                            dy="3"
                            stdDeviation="2.4"
                            floodColor="#000000"
                            floodOpacity={isWhite ? 0.55 : 0.8}
                        />
                    </filter>

                    {/* Biseau extérieur taillé au tour */}
                    <radialGradient id={outerBevelId} cx="35%" cy="30%" r="68%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="35%" stopColor="#f8f3e6" />
                                <stop offset="78%" stopColor="#d4c098" />
                                <stop offset="100%" stopColor="#9a8055" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#52525b" />
                                <stop offset="35%" stopColor="#27272a" />
                                <stop offset="78%" stopColor="#141417" />
                                <stop offset="100%" stopColor="#09090b" />
                            </>
                        )}
                    </radialGradient>

                    {/* Corps principal : ivoire nacré pour blanc, obsidienne/onyx poli pour noir */}
                    <radialGradient id={bodyGradId} cx="34%" cy="28%" r="74%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="26%" stopColor="#fdfaf3" />
                                <stop offset="60%" stopColor="#eedec2" />
                                <stop offset="86%" stopColor="#cbaf82" />
                                <stop offset="100%" stopColor="#9a7a50" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#555562" />
                                <stop offset="24%" stopColor="#2c2c34" />
                                <stop offset="60%" stopColor="#17171d" />
                                <stop offset="85%" stopColor="#0b0b0f" />
                                <stop offset="100%" stopColor="#040406" />
                            </>
                        )}
                    </radialGradient>

                    {/* Cuvette concave centrale (double biseau tourné avec inversion d'angle lumineux) */}
                    <radialGradient id={dishGradId} cx="68%" cy="70%" r="70%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="45%" stopColor="#f7ebd4" />
                                <stop offset="82%" stopColor="#d8c49e" />
                                <stop offset="100%" stopColor="#ad9468" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#46464f" />
                                <stop offset="42%" stopColor="#222227" />
                                <stop offset="82%" stopColor="#111114" />
                                <stop offset="100%" stopColor="#070709" />
                            </>
                        )}
                    </radialGradient>

                    {/* Reflet spéculaire zénithal primaire (haut-gauche) */}
                    <radialGradient id={mainGlossId} cx="32%" cy="22%" r="46%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? 0.78 : 0.42} />
                        <stop offset="45%" stopColor="#ffffff" stopOpacity={isWhite ? 0.28 : 0.12} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>

                    {/* Réverbération spéculaire douce secondaire (bas-droite) */}
                    <radialGradient id={bounceGlossId} cx="70%" cy="76%" r="40%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? 0.3 : 0.15} />
                        <stop offset="60%" stopColor="#ffffff" stopOpacity={isWhite ? 0.1 : 0.04} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* 1. Base extérieure avec ombre portée sur feutrine */}
                <g filter={`url(#${shadowId})`}>
                    <circle
                        cx="50"
                        cy="50"
                        r="47"
                        fill={`url(#${outerBevelId})`}
                        stroke={
                            isInteractive
                                ? '#fbbf24'
                                : isWhite
                                    ? 'rgba(80, 55, 20, 0.55)'
                                    : 'rgba(110, 110, 125, 0.35)'
                        }
                        strokeWidth={isInteractive ? '3.2' : '1'}
                    />
                </g>

                {/* 2. Disque corps du pion (premier biseau tourné) */}
                <circle
                    cx="50"
                    cy="50"
                    r="43"
                    fill={`url(#${bodyGradId})`}
                    stroke={isWhite ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth="0.8"
                />

                {/* 3. Rainurage concentrique intermédiaire de tournage */}
                <circle
                    cx="50"
                    cy="50"
                    r="32"
                    fill="none"
                    stroke={isWhite ? 'rgba(120, 95, 55, 0.35)' : 'rgba(0, 0, 0, 0.5)'}
                    strokeWidth="1.1"
                />

                {/* 4. Cuvette concave centrale (« finger-dish ») + marbrure rotative unique Crisloid + motif Daltonisme WCAG AAA */}
                <circle
                    cx="50"
                    cy="50"
                    r="29"
                    fill={`url(#${dishGradId})`}
                    stroke={isWhite ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.1)'}
                    strokeWidth="0.75"
                />
                <path
                    data-testid="checker-marbling-swirl"
                    d="M32 46 C40 34, 60 36, 67 49 C60 61, 41 62, 34 52"
                    fill="none"
                    stroke={isWhite ? 'rgba(255, 252, 240, 0.42)' : 'rgba(255, 255, 255, 0.11)'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    transform={`rotate(${marblingAngle} 50 50)`}
                />
                {isWhite ? (
                    <circle
                        data-testid="checker-pattern-concentric"
                        cx="50"
                        cy="50"
                        r="16"
                        fill="none"
                        stroke="rgba(120, 90, 45, 0.38)"
                        strokeWidth="1.2"
                        strokeDasharray="3 1.5"
                    />
                ) : (
                    <path
                        data-testid="checker-pattern-rosette"
                        d="M50 35 L54 46 L65 50 L54 54 L50 65 L46 54 L35 50 L46 46 Z"
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.24)"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                    />
                )}

                {/* 5. Reflet spéculaire primaire zénithal (haut-gauche) */}
                <ellipse
                    cx="35"
                    cy="28"
                    rx="17"
                    ry="10"
                    transform="rotate(-22 35 28)"
                    fill={`url(#${mainGlossId})`}
                />

                {/* 6. Réverbération spéculaire secondaire (bas-droite) */}
                <ellipse
                    cx="67"
                    cy="70"
                    rx="13"
                    ry="6.5"
                    transform="rotate(-22 67 70)"
                    fill={`url(#${bounceGlossId})`}
                />
            </svg>

            {/* Badge numérique pour pile ≥ 2 pions (6 à 15 en Cap-at-5 — tabular-nums, contraste or/obsidienne) */}
            {countBadge !== undefined && countBadge >= BADGE_MIN_COUNT && (
                <span
                    data-testid="checker-count-badge"
                    className={`absolute flex items-center justify-center min-w-[22px] h-[20px] rounded-full px-1 text-[11px] font-black leading-none shadow-xl border tabular-nums select-none ${isWhite
                        ? 'bg-amber-950 text-amber-100 border-amber-400/80 shadow-black/70'
                        : 'bg-amber-400 text-slate-950 border-amber-200/90 shadow-black/80'
                        }`}
                    style={{
                        boxShadow: '0 2px 5px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                    }}
                >
                    {countBadge}
                </span>
            )}
        </div>
    );
};

export const Checker = React.memo(CheckerComponent);

export default Checker;
