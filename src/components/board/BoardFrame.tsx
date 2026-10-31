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
            className="board-adaptive-shell relative w-full h-full max-md:portrait:h-auto max-md:portrait:aspect-[1.15/1] min-h-[240px] max-w-full max-h-full min-w-0 md:min-h-0 md:max-w-[min(100%,calc((100dvh-130px)*1.375))] md:aspect-[11/8] md:h-full [@media(max-height:600px)]:!min-h-0 [@media(max-height:600px)]:!h-full [@media(max-height:600px)]:!w-full [@media(max-height:600px)]:!max-w-full [@media(max-height:600px)]:!aspect-auto mx-auto max-sm:portrait:rounded-none max-sm:portrait:border-x-0 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 [@media(max-height:600px)]:!p-0.5 flex flex-col shadow-2xl select-none"
            style={{
                background: tokens.background,
                boxShadow: tokens.boxShadow,
                border: tokens.border,
                touchAction: 'none',
            }}
        >
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
 * Surface de jeu : fond mat uniforme à contraste géométrique pur (zéro bruit visuel).
 */
const FeltSurfaceComponent: React.FC<FeltSurfaceProps> = ({ children, theme }) => {
    const tokens = getBoardThemeTokens(theme).felt;
    return (
        <div
            className="relative flex-1 min-h-0 rounded-lg sm:rounded-xl p-0.5 sm:p-1 [@media(max-height:500px)]:!p-0 flex flex-col overflow-hidden"
            style={{
                backgroundColor: tokens.backgroundColor,
                backgroundImage: tokens.backgroundImage,
                boxShadow: tokens.boxShadow,
                border: tokens.border,
            }}
        >
            {children}
        </div>
    );
};

export const FeltSurface = React.memo(FeltSurfaceComponent);

export default BoardFrame;
