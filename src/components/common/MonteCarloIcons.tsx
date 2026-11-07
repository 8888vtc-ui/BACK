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
    readonly size?: 'sm' | 'md' | 'lg' | 'xl';
    readonly isActive?: boolean;
    readonly customPhotoUrl?: string | null;
}

/**
 * Médaillon Octogonal Haute-Horlogerie à ouverture panoramique 92 % sertissant les photographies
 * de portraits officiels + Blason Royal ou Portrait Membre pour le joueur et adversaire en ligne.
 */
export const BotPortraitMedallion: React.FC<BotPortraitMedallionProps> = React.memo(({
    character,
    size = 'md',
    isActive = false,
    customPhotoUrl = null,
}) => {
    const dim = size === 'xl' ? 116 : size === 'lg' ? 92 : size === 'md' ? 68 : 52;
    const clipId = `octagonal-clip-${character}-${size}`;
    const photoUrl =
        customPhotoUrl && customPhotoUrl.trim().length > 0
            ? customPhotoUrl
            : character !== 'player'
              ? PERSONA_PHOTO_BY_ID[character]
              : '/avatars/user-avatar-5.jpg';

    return (
        <div
            data-testid={`portrait-medallion-${character}`}
            style={{ width: dim, height: dim }}
            className={`relative shrink-0 inline-flex items-center justify-center transition-all duration-300 ${
                isActive
                    ? 'scale-[1.04] drop-shadow-[0_0_22px_rgba(243,198,95,0.65)]'
                    : 'drop-shadow-[0_6px_14px_rgba(0,0,0,0.75)]'
            }`}
        >
            <svg viewBox="0 0 80 80" className="w-full h-full overflow-visible" aria-hidden="true">
                <defs>
                    <linearGradient id="goldBezel" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff3c4" />
                        <stop offset="45%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#7c5813" />
                    </linearGradient>
                    <clipPath id={clipId}>
                        <polygon points="22,4 58,4 76,22 76,58 58,76 22,76 4,58 4,22" />
                    </clipPath>
                </defs>

                {/* Halo de tour actif type Grand Cercle Monte-Carlo */}
                {isActive && (
                    <polygon
                        points="21,1 59,1 79,21 79,59 59,79 21,79 1,59 1,21"
                        fill="none"
                        stroke="#fef08a"
                        strokeWidth="2.2"
                        strokeOpacity="0.9"
                    />
                )}

                {/* Lunette Octogonale Haute-Horlogerie */}
                <polygon
                    points="22,2 58,2 78,22 78,58 58,78 22,78 2,58 2,22"
                    fill="url(#goldBezel)"
                    stroke={isActive ? '#fffbeb' : '#9a7322'}
                    strokeWidth={isActive ? '2.4' : '1.4'}
                />
                {/* Fond intérieur en émail sombre */}
                <polygon
                    points="22,4 58,4 76,22 76,58 58,76 22,76 4,58 4,22"
                    fill="#0c0906"
                    stroke="#1c150c"
                    strokeWidth="1"
                />

                {/* Photographie de Portrait ou Blason Royal plein cadre centré (92 %) */}
                {photoUrl && (
                    <image
                        href={photoUrl}
                        x="3"
                        y="3"
                        width="74"
                        height="74"
                        preserveAspectRatio="xMidYMid slice"
                        style={{ imageRendering: 'auto' }}
                        clipPath={`url(#${clipId})`}
                    />
                )}

                {/* Contour intérieur ciselé or */}
                <polygon
                    points="22,4 58,4 76,22 76,58 58,76 22,76 4,58 4,22"
                    fill="none"
                    stroke="#f5dfa0"
                    strokeOpacity={isActive ? '0.85' : '0.45'}
                    strokeWidth="1.1"
                />

                {/* Vis de sertissage horlogères aux 8 pans */}
                <circle cx="22.5" cy="3.2" r="0.95" fill="#291d06" />
                <circle cx="57.5" cy="3.2" r="0.95" fill="#291d06" />
                <circle cx="76.8" cy="22.5" r="0.95" fill="#291d06" />
                <circle cx="76.8" cy="57.5" r="0.95" fill="#291d06" />
                <circle cx="57.5" cy="76.8" r="0.95" fill="#291d06" />
                <circle cx="22.5" cy="76.8" r="0.95" fill="#291d06" />
                <circle cx="3.2" cy="57.5" r="0.95" fill="#291d06" />
                <circle cx="3.2" cy="22.5" r="0.95" fill="#291d06" />
            </svg>
        </div>
    );
});

BotPortraitMedallion.displayName = 'BotPortraitMedallion';
export default BotPortraitMedallion;

