'use client';

/**
 * Pion de Backgammon 3D Haute-Horlogerie Cercle Monte-Carlo (Nacre d'Ivoire & Ébène Obsidienne).
 *
 * Résout définitivement le problème du "Blanc sur Blanc" :
 *   - Couronne d'ombre portée périmétrique + sertissage bronze foncé (#3d2308) autour de chaque pion blanc,
 *     garantissant un détachement visuel immédiat même sur les flèches claires Champagne/Sable.
 *   - Éradication du violet/indigo Galaxy : les pions foncés sont en Ébène Obsidienne (#14110e)
 *     sertis d'un filet d'Or 24k (#d4af37).
 *   - Double anneau haute visibilité (Émeraude & Or) pour les pions jouables au sommet de pile.
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
            className={`relative flex items-center justify-center select-none transition-[transform,opacity] duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] touch-manipulation ${
                isInteractive
                    ? 'cursor-pointer hover:-translate-y-1 hover:scale-[1.06] active:scale-95 after:content-[""] after:absolute after:-inset-1.5 after:rounded-full'
                    : ''
            }`}
            onPointerDown={isInteractive ? onPointerDown : undefined}
            style={{
                width: 'clamp(20px, min(6.5vw, calc((100dvh - 28px) / 12.6)), 52px)',
                height: 'clamp(20px, min(6.5vw, calc((100dvh - 28px) / 12.6)), 52px)',
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
                    {/* Biseau extérieur en Laiton / Bronze bruni (anti-Blanc-sur-Blanc) */}
                    <radialGradient id={outerBevelId} cx="35%" cy="30%" r="68%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#f5dfa0" />
                                <stop offset="55%" stopColor="#b88924" />
                                <stop offset="100%" stopColor="#4a2c09" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#d4af37" />
                                <stop offset="50%" stopColor="#3f3222" />
                                <stop offset="100%" stopColor="#090705" />
                            </>
                        )}
                    </radialGradient>

                    {/* Corps du pion : Nacre d'Ivoire vs Ébène Obsidienne */}
                    <radialGradient id={bodyGradId} cx="42%" cy="38%" r="58%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="68%" stopColor="#f7efe0" />
                                <stop offset="100%" stopColor="#d8c39e" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#332b24" />
                                <stop offset="65%" stopColor="#18130f" />
                                <stop offset="100%" stopColor="#080604" />
                            </>
                        )}
                    </radialGradient>

                    {/* Cuvette centrale concave (Finger-Dish) */}
                    <radialGradient id={dishGradId} cx="58%" cy="62%" r="52%">
                        {isWhite ? (
                            <>
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="70%" stopColor="#efe4ce" />
                                <stop offset="100%" stopColor="#c7ad80" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#29221c" />
                                <stop offset="75%" stopColor="#120e0b" />
                                <stop offset="100%" stopColor="#050403" />
                            </>
                        )}
                    </radialGradient>

                    <radialGradient id={mainGlossId} cx="35%" cy="25%" r="45%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={isWhite ? '0.55' : '0.22'} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id={bounceGlossId} cx="70%" cy="75%" r="40%">
                        <stop offset="0%" stopColor="#f5dfa0" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#f5dfa0" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* 1. Ombre portée franche pour détacher le pion de toute flèche claire ou foncée */}
                <circle
                    cx="50"
                    cy="53"
                    r="48"
                    fill="rgba(0, 0, 0, 0.68)"
                />

                {/* 2. Couronne extérieure de sertissage (Sombre sur pion blanc pour contraste anti-blanc-sur-blanc) */}
                <circle
                    cx="50"
                    cy="50"
                    r="47"
                    fill={`url(#${outerBevelId})`}
                    stroke={
                        isInteractive
                            ? '#10b981'
                            : isWhite
                              ? '#3b2307'
                              : '#d4af37'
                    }
                    strokeWidth={isInteractive ? '4.2' : isWhite ? '2.6' : '1.8'}
                />

                {/* Anneau lumineux doublé lorsque le pion est jouable */}
                {isInteractive && (
                    <circle
                        cx="50"
                        cy="50"
                        r="44.2"
                        fill="none"
                        stroke="#fef08a"
                        strokeWidth="2.2"
                    />
                )}

                {/* 3. Corps tourné du pion */}
                <circle
                    cx="50"
                    cy="50"
                    r="42.5"
                    fill={`url(#${bodyGradId})`}
                    stroke={isWhite ? 'rgba(92, 60, 18, 0.55)' : 'rgba(212, 175, 55, 0.45)'}
                    strokeWidth="1.2"
                />

                {/* 4. Cuvette centrale horlogère */}
                <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill={`url(#${dishGradId})`}
                    stroke={isWhite ? 'rgba(138, 98, 36, 0.55)' : 'rgba(212, 175, 55, 0.5)'}
                    strokeWidth="1.1"
                />

                <path
                    data-testid="checker-marbling-swirl"
                    d="M32 46 C40 34, 60 36, 67 49 C60 61, 41 62, 34 52"
                    fill="none"
                    stroke={isWhite ? 'rgba(160, 120, 55, 0.28)' : 'rgba(212, 175, 55, 0.16)'}
                    strokeWidth="2"
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
                        stroke="rgba(115, 78, 24, 0.45)"
                        strokeWidth="1.3"
                        strokeDasharray="3 1.5"
                    />
                ) : (
                    <path
                        data-testid="checker-pattern-rosette"
                        d="M50 35 L54 46 L65 50 L54 54 L50 65 L46 54 L35 50 L46 46 Z"
                        fill="none"
                        stroke="rgba(212, 175, 55, 0.45)"
                        strokeWidth="1.2"
                        strokeLinejoin="round"
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

            {countBadge !== undefined && countBadge >= BADGE_MIN_COUNT && (
                <span
                    data-testid="checker-count-badge"
                    className={`absolute flex items-center justify-center min-w-[22px] h-[20px] rounded-full px-1 text-[11px] font-black leading-none shadow-xl border tabular-nums select-none ${
                        isWhite
                            ? 'bg-[#1c1309] text-[#f7f3e8] border-[#d4af37] shadow-black/80'
                            : 'bg-[#d4af37] text-[#090806] border-[#fef08a] shadow-black/80'
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
