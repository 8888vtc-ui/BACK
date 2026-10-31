'use client';

/**
 * Dé de tournoi haute précision (ball-cornered precision die — standards Galaxy / XG2).
 *
 * Rendu haut de gamme :
 *   - Deux variantes : `'ivory'` (résine ivoire nacrée, joueur X) et `'ebony'` (obsidienne/ébène, IA O).
 *   - Facette circulaire centrale biseautée typique des dés de précision de tournoi.
 *   - Pips forés au tour avec dégradé radial profond + rebord spéculaire inférieur (filtre SVG).
 *   - As (`value === 1`) légèrement élargi et teinté grenat profond (sur ivoire) ou or (sur ébène).
 *   - État `used` conforme aux standards Galaxy/XG2 : retrait visuel (`opacity-40 scale-[0.92]`)
 *     sans coche verte superposée afin que les points restent toujours 100 % lisibles.
 */

import React, { useId, useRef } from 'react';
import {
    computeDieRollDurationForIndex,
    DICE_ROLL_DECELERATION_EASING,
} from '../../hooks/useDiceAnimation';

/** Positions des pips (coordonnées en pourcentage, viewBox 0..100). */
export const DIE_PIPS: Record<number, Array<[number, number]>> = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

export type DieVariant = 'ivory' | 'ebony';

export interface DieProps {
    /** Valeur du dé (1 à 6). */
    value: number;
    /** Dé déjà utilisé (assombri et mis en retrait sans masquer les pips). */
    used?: boolean;
    /** Dé actuellement sélectionné / prioritaire. */
    active?: boolean;
    /** Dé désactivé (non cliquable). */
    disabled?: boolean;
    /** Thème matériel du dé : ivoire (joueur) ou ébène (adversaire). */
    variant?: DieVariant;
    /** Index du dé dans le lancer (0..3) pour décaler subtilement la physique de rebond. */
    rollIndex?: number;
    /** Libellé accessible. */
    label?: string;
    /** Taille du dé (classe Tailwind, ex. `w-12 h-12`). */
    sizeClass?: string;
    /** Identifiant de test (data-testid). */
    dataTestId?: string;
    /** Callback au clic. */
    onClick?: (e: React.MouseEvent) => void;
    /** Joue l'animation de lancer au montage (plateau uniquement). */
    animateRoll?: boolean;
}

const DieComponent: React.FC<DieProps> = ({
    value,
    used = false,
    active = false,
    disabled = false,
    variant = 'ivory',
    rollIndex = 0,
    label,
    sizeClass = 'w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12',
    dataTestId,
    onClick,
    animateRoll = false,
}) => {
    const uid = useId().replace(/:/g, '');
    const pipGradId = `die-pip-${uid}`;
    const pipRimFilterId = `die-rim-${uid}`;
    const pips = DIE_PIPS[value] ?? [[50, 50]];
    const isAce = value === 1;
    const isEbony = variant === 'ebony';
    const hasBeenUsedRef = useRef(false);
    if (used) {
        hasBeenUsedRef.current = true;
    }
    const isReanimated = !used && hasBeenUsedRef.current;

    const rollAnimClass = animateRoll && !used && !isReanimated
        ? rollIndex % 2 === 1
            ? 'die-roll-alt'
            : 'die-roll'
        : '';
    const rollDurationMs = computeDieRollDurationForIndex(rollIndex);

    const bodyBackground = isEbony
        ? 'linear-gradient(145deg, #334155 0%, #1e293b 36%, #0f172a 76%, #070b12 100%)'
        : 'linear-gradient(145deg, #fffefb 0%, #f9f4e8 34%, #ebe1cc 74%, #d5c6a7 100%)';

    const facetBackground = isEbony
        ? 'radial-gradient(circle at 36% 32%, rgba(71, 85, 105, 0.38) 0%, rgba(15, 23, 42, 0.15) 62%, rgba(2, 6, 23, 0.45) 100%)'
        : 'radial-gradient(circle at 36% 32%, rgba(255, 255, 255, 0.82) 0%, rgba(248, 242, 228, 0.35) 62%, rgba(196, 178, 144, 0.28) 100%)';

    const boxShadow = used
        ? '0 2px 5px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.35)'
        : active
            ? '0 0 18px rgba(56, 189, 248, 0.8), 0 8px 20px -2px rgba(0, 0, 0, 0.7), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.9), inset 0 -2.5px 5px rgba(0, 0, 0, 0.3)'
            : isEbony
                ? '0 8px 18px -3px rgba(0, 0, 0, 0.78), 0 3px 6px rgba(0, 0, 0, 0.5), inset 0 1.5px 1px rgba(148, 163, 184, 0.35), inset 0 -2.5px 5px rgba(0, 0, 0, 0.65)'
                : '0 8px 20px -3px rgba(0, 0, 0, 0.68), 0 3px 6px rgba(0, 0, 0, 0.42), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.95), inset 0 -2.5px 5px rgba(120, 98, 62, 0.28)';

    const borderStyle = active
        ? '1.5px solid rgba(56, 189, 248, 0.95)'
        : isEbony
            ? '1.5px solid rgba(217, 169, 78, 0.42)'
            : '1.5px solid rgba(195, 175, 140, 0.68)';

    return (
        <button
            type="button"
            disabled={disabled}
            data-testid={dataTestId}
            data-reanimated={isReanimated ? 'true' : undefined}
            data-roll-duration-ms={animateRoll && !isReanimated ? rollDurationMs : undefined}
            data-roll-easing={animateRoll && !isReanimated ? DICE_ROLL_DECELERATION_EASING : undefined}
            onClick={onClick}
            aria-label={label ?? `Dé : ${value}`}
            title={label ?? `Dé : ${value}${used ? ' (déjà utilisé)' : ''}`}
            className={`${sizeClass} relative rounded-[18%] flex items-center justify-center transition-all duration-200 select-none overflow-hidden ${rollAnimClass} ${used
                ? 'opacity-40 scale-[0.92] saturate-50 brightness-90 cursor-not-allowed'
                : active
                    ? 'ring-2 ring-sky-400 hover:scale-105'
                    : disabled
                        ? 'cursor-default'
                        : 'hover:scale-105 active:scale-95'
                }`}
            style={{
                background: bodyBackground,
                boxShadow,
                border: borderStyle,
                transform: rollIndex % 2 === 0 ? 'rotate(-7deg)' : 'rotate(9deg)',
                animationDuration: animateRoll ? `${rollDurationMs}ms` : undefined,
                animationTimingFunction: animateRoll ? DICE_ROLL_DECELERATION_EASING : undefined,
                animationDelay: animateRoll && rollIndex > 0 ? `${rollIndex * 20}ms` : undefined,
            }}
        >
            {/* Facette carrée biseautée interne (distinction franche avec les pions ronds) */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[9%] rounded-[14%]"
                style={{
                    background: facetBackground,
                    boxShadow: isEbony
                        ? 'inset 0 1px 2px rgba(255, 255, 255, 0.18), inset 0 -1px 2px rgba(0, 0, 0, 0.55)'
                        : 'inset 0 1px 2px rgba(255, 255, 255, 0.9), inset 0 -1px 2px rgba(140, 118, 82, 0.22)',
                    border: isEbony
                        ? '1px solid rgba(212, 175, 55, 0.22)'
                        : '1px solid rgba(255, 255, 255, 0.55)',
                }}
            />

            {/* Reflet spéculaire courbe d'angle supérieur gauche */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-[18%] -left-[18%] w-[85%] h-[65%] rounded-full"
                style={{
                    background: isEbony
                        ? 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, transparent 70%)',
                }}
            />

            {/* SVG des pips forés profonds avec rebord spéculaire */}
            <svg viewBox="0 0 100 100" className="w-[74%] h-[74%] relative z-10" shapeRendering="geometricPrecision">
                <defs>
                    <filter id={pipRimFilterId} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow
                            dx="0"
                            dy="1.3"
                            stdDeviation="0.45"
                            floodColor={isEbony ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.85)'}
                        />
                    </filter>
                    <radialGradient id={pipGradId} cx="36%" cy="32%" r="72%">
                        {isEbony ? (
                            isAce ? (
                                <>
                                    <stop offset="0%" stopColor="#fef3c7" />
                                    <stop offset="55%" stopColor="#fbbf24" />
                                    <stop offset="100%" stopColor="#b45309" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#ffffff" />
                                    <stop offset="60%" stopColor="#f1f5f9" />
                                    <stop offset="100%" stopColor="#cbd5e1" />
                                </>
                            )
                        ) : isAce ? (
                            <>
                                <stop offset="0%" stopColor="#991b1b" />
                                <stop offset="58%" stopColor="#7f1d1d" />
                                <stop offset="100%" stopColor="#450a0a" />
                            </>
                        ) : (
                            <>
                                <stop offset="0%" stopColor="#090d16" />
                                <stop offset="55%" stopColor="#111827" />
                                <stop offset="88%" stopColor="#1e293b" />
                                <stop offset="100%" stopColor="#334155" />
                            </>
                        )}
                    </radialGradient>
                </defs>

                {pips.map(([cx, cy], i) => (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={isAce ? 12.2 : 10.5}
                        fill={`url(#${pipGradId})`}
                        filter={`url(#${pipRimFilterId})`}
                        stroke={isEbony ? 'rgba(15, 23, 42, 0.65)' : 'rgba(15, 23, 42, 0.45)'}
                        strokeWidth="0.9"
                    />
                ))}
            </svg>
        </button>
    );
};

export const Die = React.memo(DieComponent);

export default Die;
