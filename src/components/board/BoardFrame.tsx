'use client';

/**
 * Cadre et surface de jeu du plateau — boiserie vernie + feutrine de casino.
 *
 * Rôle :
 *   Isole le rendu décoratif (bois, feutrine, reflets, vignettage) hors de
 *   `Board.tsx` (LOI 5 : composants ≤ 300 lignes). Composant 100 % muet :
 *   il ne fait que fournir un conteneur stylé à ses enfants.
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le JSX dans `Board.tsx`.
 */

import React from 'react';

export interface BoardFrameProps {
    /** Contenu du plateau (flèches, pions, barre, rivière). */
    children: React.ReactNode;
}

/** Cadre extérieur : noyer verni, veinage, bordure dorée, ombre profonde. */
export const BoardFrame: React.FC<BoardFrameProps> = ({ children }) => (
    <div
        className="relative w-full h-full rounded-[28px] p-3 sm:p-5 flex flex-col shadow-inner"
        style={{
            background:
                'repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 3px, transparent 3px 7px), linear-gradient(180deg, #5a3419 0%, #3a2010 45%, #2b170c 100%)',
            boxShadow:
                '0 24px 70px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 6px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.35)',
            border: '1px solid rgba(212,175,55,0.35)',
        }}
    >
        {/* Reflet vernis sur le haut du cadre */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-1/4 rounded-t-[28px]"
            style={{
                background:
                    'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 45%, transparent 100%)',
            }}
        />
        {children}
    </div>
);

export interface FeltSurfaceProps {
    /** Contenu de la surface de jeu. */
    children: React.ReactNode;
}

/**
 * Surface de feutrine de casino : dégradé radial émeraude profond, texture
 * tissée, vignettage et reflet de lumière diffus.
 */
export const FeltSurface: React.FC<FeltSurfaceProps> = ({ children }) => (
    <div
        className="relative flex-1 min-h-0 rounded-2xl p-2 sm:p-3 flex flex-col overflow-hidden shadow-inner"
        style={{
            background:
                'radial-gradient(ellipse at 50% 38%, #1f7a52 0%, #14603f 32%, #0d4a30 58%, #062a1b 100%), repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 4px)',
            boxShadow:
                'inset 0 0 140px rgba(0,0,0,0.62), inset 0 3px 6px rgba(0,0,0,0.45), inset 0 -2px 4px rgba(0,0,0,0.35)',
            border: '2px solid rgba(0,0,0,0.45)',
        }}
    >
        {/* Reflet de lumière diffus (haut-gauche) */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
                background:
                    'radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.10) 0%, transparent 58%)',
            }}
        />
        {/* Vignettage des coins */}
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
                background:
                    'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.35) 100%)',
            }}
        />
        {children}
    </div>
);

export default BoardFrame;
