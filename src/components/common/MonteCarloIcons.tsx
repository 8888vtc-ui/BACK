'use client';

/**
 * @file src/components/common/MonteCarloIcons.tsx
 * @description Système d'icônes vectorielles Haute-Horlogerie (trait fin 1.5px Or Champagne #d4af37,
 * zéro emoji cartoon) et Médaillons de Portraits Illustrés des 5 Personnages du Cercle Monte-Carlo
 * sertis dans une lunette octogonale inspirée de la Haute Horlogerie suisse.
 * Strictly < 290 lignes, 0 `any`.
 */

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';

export interface IconProps {
    readonly className?: string;
    readonly size?: number;
}

/** Dé en perspective isométrique ciselé au trait d'or */
export const IconLuxuryDice: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
        <path d="M3 7l9 5 9-5" />
        <path d="M12 12v10" />
        <circle cx="12" cy="7" r="1" fill="currentColor" />
        <circle cx="7.5" cy="13" r="0.9" fill="currentColor" />
        <circle cx="16.5" cy="13" r="0.9" fill="currentColor" />
        <circle cx="16.5" cy="16.5" r="0.9" fill="currentColor" />
    </svg>
);

/** Couronne / Blason de Match de Championnat */
export const IconLuxuryCrown: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M3 18h18M4 15l-1-9 5.5 4L12 4l3.5 6L21 6l-1 9H4z" />
    </svg>
);

/** Chronographe Suisse à aiguilles fines (Horloge Bronstein) */
export const IconChronograph: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5" />
        <path d="M10 2h4M12 2v3M19 6l1.5-1.5" />
    </svg>
);

/** Jeton de Cercle / Partie Libre */
export const IconCasinoToken: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.5" strokeDasharray="2.5 2.5" />
        <path d="M12 9.5l2.5 2.5-2.5 2.5-2.5-2.5L12 9.5z" />
    </svg>
);

/** Compas d'Analyse Géométrique & PR */
export const IconGeometricCompass: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="12" cy="5" r="2" />
        <path d="M10.5 6.8L5 21M13.5 6.8L19 21M7 15h10M12 3v0" />
    </svg>
);

/** Globe Méridien pour Prochains Tournois Live */
export const IconWorldTourLive: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8" />
        <path d="M12 3a14.5 14.5 0 0 0 0 18 14.5 14.5 0 0 0 0-18z" />
    </svg>
);

/** Étoile Astrolabe du Coach Grand-Maître IA */
export const IconAstrolabeCoach: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

/** Livre d'Ouvertures & Bibliothèque */
export const IconGrimoireBook: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2V4zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z" />
    </svg>
);

/** Engrenage d'horlogerie (Préférences) */
export const IconHorologyGear: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

/**Scanner de position (.mat / XGID / Caméra) */
export const IconCameraScanner: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
);

/** Pendule de tournoi WBF Bronstein */
export const IconBronsteinClock: React.FC<IconProps> = ({ className = 'text-[#d4af37]', size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <path d="M7 3.5h4M13 3.5h4M12 6v13" />
        <circle cx="7.5" cy="12.5" r="2.5" />
        <circle cx="16.5" cy="12.5" r="2.5" />
    </svg>
);

export type PortraitCharacterId = AIDifficulty | 'mittens' | 'player';

export const PERSONA_PHOTO_BY_ID: Record<Exclude<PortraitCharacterId, 'player'>, string> = {
    beginner: '/avatars/persona-mauvais-joueur.jpg',
    intermediate: '/avatars/persona-sofia-riviera.jpg',
    expert: '/avatars/persona-homme-affaires.jpg',
    grandmaster: '/avatars/persona-viktor-intellectuel.jpg',
    mittens: '/avatars/persona-lord-mittens.jpg',
};

export interface BotPortraitMedallionProps {
    readonly character: PortraitCharacterId;
    readonly size?: 'sm' | 'md' | 'lg';
    readonly isActive?: boolean;
}

/**
 * Médaillon Octogonal Haute-Horlogerie à 8 vis d'or 24k sertissant les VRAIES photographies
 * de portraits Monte-Carlo (Maxime Le Mauvais Joueur, Sofia La Riviera, Victor L'Homme d'Affaires,
 * Viktor L'Intellectuel, Lord Mittens) + Blason Membre pour le joueur.
 */
export const BotPortraitMedallion: React.FC<BotPortraitMedallionProps> = React.memo(({
    character,
    size = 'md',
    isActive = false,
}) => {
    const dim = size === 'lg' ? 64 : size === 'md' ? 48 : 38;
    const clipId = `octagonal-clip-${character}-${size}`;
    const photoUrl = character !== 'player' ? PERSONA_PHOTO_BY_ID[character] : null;

    return (
        <div
            data-testid={`portrait-medallion-${character}`}
            style={{ width: dim, height: dim }}
            className={`relative shrink-0 inline-flex items-center justify-center transition-transform duration-200 ${
                isActive ? 'scale-105 drop-shadow-[0_0_16px_rgba(212,175,55,0.45)]' : 'opacity-95'
            }`}
        >
            <svg viewBox="0 0 80 80" className="w-full h-full" aria-hidden="true">
                <defs>
                    <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5dfa0" />
                        <stop offset="45%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#7c5813" />
                    </linearGradient>
                    <clipPath id={clipId}>
                        <polygon points="26,7 54,7 73,26 73,54 54,73 26,73 7,54 7,26" />
                    </clipPath>
                </defs>

                {/* Lunette Octogonale Haute-Horlogerie */}
                <polygon
                    points="24,3 56,3 77,24 77,56 56,77 24,77 3,56 3,24"
                    fill="url(#goldBezel)"
                    stroke={isActive ? '#fff7d6' : '#8c6b23'}
                    strokeWidth={isActive ? '2.2' : '1.2'}
                />
                {/* Fond intérieur en émail sombre */}
                <polygon
                    points="26,7 54,7 73,26 73,54 54,73 26,73 7,54 7,26"
                    fill="#0c0906"
                    stroke="#1c150c"
                    strokeWidth="1.5"
                />

                {/* Vraie Photographie de Portrait Haute-Couture Monte-Carlo */}
                {photoUrl && (
                    <image
                        href={photoUrl}
                        x="6"
                        y="6"
                        width="68"
                        height="68"
                        preserveAspectRatio="xMidYMin slice"
                        clipPath={`url(#${clipId})`}
                    />
                )}

                {/* Joueur Humain (Membre d'Honneur du Cercle Monte-Carlo) */}
                {character === 'player' && (
                    <g clipPath={`url(#${clipId})`}>
                        <rect x="6" y="6" width="68" height="68" fill="#062c1e" />
                        <path d="M18,74 C21,55 59,55 62,74 Z" fill="#064e3b" stroke="#f5dfa0" strokeWidth="1.2" />
                        <path d="M35,56 L40,68 L45,56" fill="#f8fafc" />
                        <polygon points="37,60 43,60 40,63" fill="#d4af37" />
                        <ellipse cx="40" cy="38" rx="11.5" ry="13.5" fill="#e6be9a" />
                        <path d="M28.5,34 C29,21 51,21 51.5,34 C47,27 33,27 28.5,34 Z" fill="#271f1b" />
                        <circle cx="35.5" cy="37" r="1.4" fill="#1c1917" />
                        <circle cx="44.5" cy="37" r="1.4" fill="#1c1917" />
                        <path d="M36,45 Q40,47.5 44,45" fill="none" stroke="#5c3a21" strokeWidth="1.4" strokeLinecap="round" />
                    </g>
                )}

                {/* Contour intérieur ciselé or */}
                <polygon
                    points="26,7 54,7 73,26 73,54 54,73 26,73 7,54 7,26"
                    fill="none"
                    stroke="#d4af37"
                    strokeOpacity="0.45"
                    strokeWidth="1"
                />

                {/* Vis de sertissage horlogères aux 8 pans */}
                <circle cx="25" cy="5.5" r="1.1" fill="#291d06" />
                <circle cx="55" cy="5.5" r="1.1" fill="#291d06" />
                <circle cx="74.5" cy="25" r="1.1" fill="#291d06" />
                <circle cx="74.5" cy="55" r="1.1" fill="#291d06" />
                <circle cx="55" cy="74.5" r="1.1" fill="#291d06" />
                <circle cx="25" cy="74.5" r="1.1" fill="#291d06" />
                <circle cx="5.5" cy="55" r="1.1" fill="#291d06" />
                <circle cx="5.5" cy="25" r="1.1" fill="#291d06" />
            </svg>
        </div>
    );
});

BotPortraitMedallion.displayName = 'BotPortraitMedallion';
export default BotPortraitMedallion;

