/**
 * Thèmes et types partagés du plateau de Backgammon — module 100 % pur.
 *
 * Centralise les palettes de couleurs (feutre / bois noble) des trois thèmes,
 * ainsi que les types partagés (`ThemeName`, `CoachHighlight`).
 * Réutilisable par n'importe quel rendu (SVG ou HTML/Tailwind).
 */

import type { Move } from '../../engine/backgammonEngine';

export type ThemeName = 'snowie_classic' | 'tournament' | 'midnight' | 'galaxy_void';

/** Surbrillance du coach : coups joués vs coups optimaux. */
export interface CoachHighlight {
    played: Move[];
    optimal: Move[];
}

export interface Theme {
    frame: string;
    frameInner: string;
    surface: string;
    surfaceInner: string;
    pointA: string;
    pointB: string;
    river: string;
    bar: string;
    barLine: string;
    tray: string;
    trayInner: string;
    traySliceX: string;
    traySliceO: string;
    numberText: string;
    badgeBg: string;
    badgeText: string;
    cubeFace: string;
    cubeText: string;
    ghost: string;
    impact: string;
}

export const THEMES: Record<ThemeName, Theme> = {
    snowie_classic: {
        frame: '#2b170c',
        frameInner: '#422413',
        surface: '#0f3d26', // Feutre vert compétition Snowie
        surfaceInner: '#0b2f1d',
        pointA: '#f4ecd8',
        pointB: '#831b28',
        river: '#0b2f1d',
        bar: '#221108',
        barLine: '#d4af37',
        tray: '#1f0f07',
        trayInner: '#120a05',
        traySliceX: '#fcfaf4',
        traySliceO: '#1c1917',
        numberText: '#f5ebd2',
        badgeBg: '#221108',
        badgeText: '#fef08a',
        cubeFace: '#fdfaf2',
        cubeText: '#18181b',
        ghost: '#22c55e',
        impact: '#ef4444',
    },
    tournament: {
        frame: '#5c3a21',
        frameInner: '#7a4f2e',
        surface: '#14532d',
        surfaceInner: '#115e3e',
        pointA: '#e7dcc3',
        pointB: '#1f6f4a',
        river: '#115e3e',
        bar: '#3e2714',
        barLine: '#5c3a21',
        tray: '#3e2714',
        trayInner: '#130a05',
        traySliceX: '#f5f0e6',
        traySliceO: '#1f2937',
        numberText: '#ffffff',
        badgeBg: '#3e2714',
        badgeText: '#ffffff',
        cubeFace: '#f8fafc',
        cubeText: '#0f172a',
        ghost: '#16a34a',
        impact: '#dc2626',
    },
    midnight: {
        frame: '#0b1220',
        frameInner: '#1e293b',
        surface: '#0f172a',
        surfaceInner: '#0d1526',
        pointA: '#3b4a63',
        pointB: '#23405e',
        river: '#0d1526',
        bar: '#1e293b',
        barLine: '#334155',
        tray: '#0b1220',
        trayInner: '#04070a',
        traySliceX: '#cbd5e1',
        traySliceO: '#475569',
        numberText: '#e2e8f0',
        badgeBg: '#1e293b',
        badgeText: '#ffffff',
        cubeFace: '#f59e0b',
        cubeText: '#0f172a',
        ghost: '#22c55e',
        impact: '#ef4444',
    },
    galaxy_void: {
        frame: '#05060a',
        frameInner: '#0a0c14',
        surface: '#070810',
        surfaceInner: '#05060a',
        pointA: '#2a2f45',
        pointB: '#1b1f33',
        river: '#05060a',
        bar: '#0a0c14',
        barLine: '#2a2f45',
        tray: '#05060a',
        trayInner: '#020308',
        traySliceX: '#e5e7eb',
        traySliceO: '#3f3f46',
        numberText: '#9ca3af',
        badgeBg: '#0a0c14',
        badgeText: '#e5e7eb',
        cubeFace: '#8b5cf6',
        cubeText: '#0f172a',
        ghost: '#34d399',
        impact: '#f43f5e',
    },
};
