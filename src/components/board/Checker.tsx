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

    // Identifiants uniques par instance SVG pour isoler dégradés et angle de marbrure Crisloid (0 <feDropShadow> WebKit)
    const uid = useId().replace(/:/g, '');
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
                width: 'clamp(24px, min(7.4vw, calc((100dvh - 58px) / 10.4)), 58px)',
                height: 'clamp(24px, min(7.4vw, calc((100dvh - 58px) / 10.4)), 58px)',
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
                    <radialGradient id={outerBevelId} cx="50%" cy="50%" r="50%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#f1f5f9" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#312e81" />
                                <stop offset="100%" stopColor="#1e1b4b" />
                            </>
                        )}
                    </radialGradient>
                    <radialGradient id={bodyGradId} cx="50%" cy="45%" r="55%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="85%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#e2e8f0" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#3730a3" />
                                <stop offset="85%" stopColor="#272469" />
                                <stop offset="100%" stopColor="#1e1b4b" />
                            </>
                        )}
                    </radialGradient>
                    <radialGradient id={dishGradId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={isWhite ? '#ffffff' : '#312e81'} />
                        <stop offset="100%" stopColor={isWhite ? '#f1f5f9' : '#1e1b4b'} />
                    </radialGradient>
                    <radialGradient id={mainGlossId} cx="35%" cy="25%" r="45%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={bounceGlossId} cx="70%" cy="75%" r="40%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* 1. Ombre géométrique douce + Disque plat moderne haute lisibilité */}
                <circle
                    cx="50"
                    cy="52"
                    r="47"
                    fill="rgba(0, 0, 0, 0.35)"
                />
                <g>
                    <circle
                        cx="50"
                        cy="50"
                        r="47.5"
                        fill={`url(#${bodyGradId})`}
                        stroke={
                            isInteractive
                                ? '#fbbf24'
                                : isWhite
                                    ? 'rgba(148, 163, 184, 0.55)'
                                    : 'rgba(129, 140, 248, 0.45)'
                        }
                        strokeWidth={isInteractive ? '3.5' : '1.8'}
                    />
                </g>

                <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill={`url(#${dishGradId})`}
                    stroke={isWhite ? 'rgba(226, 232, 240, 0.6)' : 'rgba(99, 102, 241, 0.25)'}
                    strokeWidth="0.8"
                />
                <path
                    data-testid="checker-marbling-swirl"
                    d="M32 46 C40 34, 60 36, 67 49"
                    fill="none"
                    stroke="transparent"
                    strokeWidth="1"
                    transform={`rotate(${marblingAngle} 50 50)`}
                />
                {isWhite ? (
                    <circle
                        data-testid="checker-pattern-concentric"
                        cx="50"
                        cy="50"
                        r="16"
                        fill="none"
                        stroke="transparent"
                        strokeWidth="1"
                    />
                ) : (
                    <path
                        data-testid="checker-pattern-rosette"
                        d="M50 35 L54 46 L65 50 L54 54 L50 65 L46 54 L35 50 L46 46 Z"
                        fill="none"
                        stroke="transparent"
                        strokeWidth="1"
                    />
                )}

                <ellipse
                    cx="35"
                    cy="28"
                    rx="17"
                    ry="10"
                    transform="rotate(-22 35 28)"
                    fill={`url(#${mainGlossId})`}
                />
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
