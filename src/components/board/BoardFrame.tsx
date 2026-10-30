'use client';

/**
 * Cadre et surface de jeu du plateau — Malle de voyage en noyer, cuir et laiton ciselé
 * avec éclairage zénithal (spotlight central doux) mettant en valeur le grain du velours
 * et les ombres portées des pions 3D (LOI 5 : ≤ 300 lignes, 0 any).
 */

import React from 'react';
import { getBoardThemeTokens } from './boardThemes';

export interface BoardFrameProps {
    /** Contenu du plateau (flèches, pions, barre, rivière). */
    children: React.ReactNode;
    /** Thème actif (défaut : `snowie_classic`). */
    theme?: string;
}

/**
 * Cadre extérieur : malle d'ébénisterie en noyer verni, équerres d'angle en laiton
 * brossé, chanfrein métallique et reflets d'éclairage zénithal.
 */
const BoardFrameComponent: React.FC<BoardFrameProps> = ({ children, theme }) => {
    const tokens = getBoardThemeTokens(theme).frame;
    return (
        <div
            className="board-adaptive-shell relative w-full h-full max-md:h-auto aspect-[1.16/1] landscape:aspect-[1.28/1] min-h-[260px] max-w-full max-h-full min-w-0 md:min-h-0 md:max-w-[min(100%,calc((100dvh-130px)*1.375))] md:aspect-[11/8] mx-auto max-sm:rounded-none max-sm:border-x-0 rounded-[20px] sm:rounded-[28px] p-0.5 sm:p-2.5 md:p-3.5 [@media(max-height:500px)]:!p-1 flex flex-col shadow-2xl select-none"
            style={{
                background: tokens.background,
                boxShadow: tokens.boxShadow,
                border: tokens.border,
                touchAction: 'none',
            }}
        >
            {/* Chanfrein intérieur en laiton / cuivre / titane */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[3px] rounded-[25px]"
                style={{
                    border: tokens.bevelBorder,
                    boxShadow: 'inset 0 1px 0 rgba(255, 240, 190, 0.25), inset 0 -2px 4px rgba(0, 0, 0, 0.75)',
                }}
            />

            {/* 4 rivets d'ébénisterie en laiton doré aux coins de la malle */}
            <span
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute top-2.5 left-2.5 h-2 w-2 rounded-full border border-[#5c3e09] bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#78520d] shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            />
            <span
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute top-2.5 right-2.5 h-2 w-2 rounded-full border border-[#5c3e09] bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#78520d] shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            />
            <span
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute bottom-2.5 left-2.5 h-2 w-2 rounded-full border border-[#5c3e09] bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#78520d] shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            />
            <span
                aria-hidden="true"
                className="pointer-events-none hidden sm:block absolute bottom-2.5 right-2.5 h-2 w-2 rounded-full border border-[#5c3e09] bg-gradient-to-br from-[#fff3c4] via-[#d4af37] to-[#78520d] shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            />

            {/* Reflet de vernis zénithal supérieur */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/4 rounded-t-[28px]"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(255, 248, 225, 0.16) 0%, rgba(255, 255, 255, 0.04) 45%, transparent 100%)',
                }}
            />

            {/* Réverbération chaude sur la tranche inférieure de la malle */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-[28px]"
                style={{
                    background: 'linear-gradient(0deg, rgba(212, 175, 55, 0.09) 0%, transparent 100%)',
                }}
            />

            {children}
        </div>
    );
};

export const BoardFrame = React.memo(BoardFrameComponent);

export interface FeltSurfaceProps {
    /** Contenu de la surface de jeu. */
    children: React.ReactNode;
    /** Thème actif (défaut : `snowie_classic`). */
    theme?: string;
}

/**
 * Surface de feutrine : micro-texture velours en double trame croisée,
 * spotlight zénithal chaud au centre et vignettage profond d'encastrement.
 */
const FeltSurfaceComponent: React.FC<FeltSurfaceProps> = ({ children, theme }) => {
    const tokens = getBoardThemeTokens(theme).felt;
    return (
        <div
            className="relative flex-1 min-h-0 rounded-xl sm:rounded-2xl p-1 sm:p-2.5 [@media(max-height:500px)]:!p-1 flex flex-col overflow-hidden shadow-inner"
            style={{
                backgroundColor: tokens.backgroundColor,
                backgroundImage: tokens.backgroundImage,
                boxShadow: tokens.boxShadow,
                border: tokens.border,
            }}
        >
            {/* Double trame velours croisée à 45° et 135° */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-45 mix-blend-overlay"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.075) 0px, rgba(255, 255, 255, 0.075) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.14) 0px, rgba(0, 0, 0, 0.14) 1px, transparent 1px, transparent 3px)',
                }}
            />

            {/* Spotlight zénithal chaud (lustre de salon) révélant le grain du velours */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                    background:
                        'radial-gradient(ellipse 64% 54% at 50% 48%, rgba(255, 243, 200, 0.14) 0%, rgba(74, 222, 128, 0.08) 38%, transparent 72%)',
                }}
            />

            {/* Halo chromatique propre au thème */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: tokens.halo }}
            />

            {/* Vignettage périphérique d'encastrement sous la boiserie */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                    background:
                        'radial-gradient(ellipse at 50% 50%, transparent 52%, rgba(2, 8, 6, 0.52) 84%, rgba(1, 4, 3, 0.86) 100%)',
                }}
            />

            {/* Filet de sertissage intérieur en laiton */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ boxShadow: tokens.inset }}
            />

            {children}
        </div>
    );
};

export const FeltSurface = React.memo(FeltSurfaceComponent);

export default BoardFrame;
