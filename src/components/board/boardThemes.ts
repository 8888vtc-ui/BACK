/**
 * Types et tokens de style partagés du plateau de Backgammon — module 100 % pur.
 *
 * Centralise :
 *   - les types `ThemeName` et `CoachHighlight` (plateau + panneau Coach) ;
 *   - les tokens visuels (`BOARD_THEME_TOKENS`) consommés par `BoardFrame`,
 *     `FeltSurface`, `BoardPoint` et `BoardCentralBar`.
 *
 * `snowie_classic` est le thème par défaut (rendu Snowie 4 Pro).
 */

import type { Move } from '../../engine/backgammonEngine';

export type ThemeName = 'snowie_classic' | 'tournament' | 'midnight' | 'galaxy_void';

/** Surbrillance du coach : coups joués vs coups optimaux. */
export interface CoachHighlight {
    played: Move[];
    optimal: Move[];
}

/** Dégradé vertical à 4 arrêts (haut → bas) pour une flèche. */
export type PointGradient = readonly [string, string, string, string];

export interface BoardThemeTokens {
    frame: {
        background: string;
        boxShadow: string;
        border: string;
        /** Filet intérieur (chanfrein laiton / cuivre / titane). */
        bevelBorder: string;
    };
    felt: {
        backgroundColor: string;
        backgroundImage: string;
        boxShadow: string;
        border: string;
        /** Halo lumineux central. */
        halo: string;
        /** Liseré de sertissage. */
        inset: string;
    };
    points: {
        light: PointGradient;
        dark: PointGradient;
        lightStroke: string;
        darkStroke: string;
        lightInlay: string;
        darkInlay: string;
    };
    bar: {
        background: string;
        boxShadow: string;
        borderColor: string;
    };
}

const SNOWIE_CLASSIC: BoardThemeTokens = {
    frame: {
        background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 10px), linear-gradient(145deg, #3d2110 0%, #2a150a 38%, #1c0b04 72%, #100602 100%)',
        boxShadow:
            '0 36px 90px rgba(0, 0, 0, 0.92), 0 12px 32px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 235, 180, 0.35), inset 0 -3px 8px rgba(0, 0, 0, 0.8), inset 0 0 50px rgba(0, 0, 0, 0.5)',
        border: '1.5px solid rgba(212, 175, 55, 0.65)',
        bevelBorder: '1px solid rgba(234, 195, 115, 0.35)',
    },
    felt: {
        backgroundColor: '#093621',
        backgroundImage: 'radial-gradient(ellipse at 50% 48%, #165b3c 0%, #0d462d 34%, #083420 64%, #041c11 100%)',
        boxShadow:
            'inset 0 0 120px rgba(0, 0, 0, 0.78), inset 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 -3px 8px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.45)',
        border: '2px solid rgba(18, 12, 6, 0.9)',
        halo: 'radial-gradient(ellipse at 50% 50%, rgba(74, 222, 128, 0.14) 0%, rgba(52, 211, 153, 0.05) 40%, transparent 70%)',
        inset: 'inset 0 0 0 1px rgba(212, 175, 55, 0.28)',
    },
    points: {
        light: ['#fdfaf3', '#f2e8d3', '#dbcaa6', '#beaa82'],
        dark: ['#8a2c1a', '#6a1f11', '#49130a', '#2c0904'],
        lightStroke: 'rgba(92, 65, 30, 0.45)',
        darkStroke: 'rgba(255, 185, 160, 0.22)',
        lightInlay: 'rgba(255, 255, 255, 0.38)',
        darkInlay: 'rgba(0, 0, 0, 0.45)',
    },
    bar: {
        background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 8px), linear-gradient(180deg, #32180b 0%, #1e0c05 50%, #32180b 100%)',
        boxShadow:
            'inset 0 0 18px rgba(0, 0, 0, 0.88), inset 1px 0 0 rgba(255, 240, 190, 0.25), inset -1px 0 0 rgba(255, 240, 190, 0.25), 0 0 12px rgba(0, 0, 0, 0.55)',
        borderColor: 'rgba(212, 175, 55, 0.85)',
    },
};

const TOURNAMENT: BoardThemeTokens = {
    frame: {
        background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 7px), linear-gradient(145deg, #4d2613 0%, #371b0e 40%, #23110a 75%, #150906 100%)',
        boxShadow:
            '0 36px 90px rgba(0, 0, 0, 0.88), 0 10px 30px rgba(0, 0, 0, 0.65), inset 0 1px 2px rgba(255, 205, 155, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.75), inset 0 0 50px rgba(0, 0, 0, 0.45)',
        border: '1.5px solid rgba(195, 125, 60, 0.65)',
        bevelBorder: '1px solid rgba(220, 145, 85, 0.35)',
    },
    felt: {
        backgroundColor: '#0c4022',
        backgroundImage: 'radial-gradient(ellipse at 50% 48%, #1b6d3b 0%, #12552d 34%, #0b3d1f 64%, #052412 100%)',
        boxShadow:
            'inset 0 0 115px rgba(0, 0, 0, 0.7), inset 0 4px 10px rgba(0, 0, 0, 0.55), inset 0 -3px 8px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.4)',
        border: '2px solid rgba(20, 12, 6, 0.9)',
        halo: 'radial-gradient(ellipse at 50% 50%, rgba(110, 231, 140, 0.14) 0%, rgba(74, 222, 128, 0.05) 40%, transparent 70%)',
        inset: 'inset 0 0 0 1px rgba(195, 125, 60, 0.32)',
    },
    points: {
        light: ['#fbf8f1', '#f1ebdd', '#ddd3bd', '#c7b99a'],
        dark: ['#7c2b1d', '#611f10', '#441407', '#2a0c06'],
        lightStroke: 'rgba(80, 60, 35, 0.4)',
        darkStroke: 'rgba(255, 190, 150, 0.2)',
        lightInlay: 'rgba(255, 255, 255, 0.4)',
        darkInlay: 'rgba(0, 0, 0, 0.45)',
    },
    bar: {
        background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 8px), linear-gradient(180deg, #3a1c0e 0%, #26120a 50%, #3a1c0e 100%)',
        boxShadow:
            'inset 0 0 16px rgba(0, 0, 0, 0.8), inset 1px 0 0 rgba(255, 200, 150, 0.2), inset -1px 0 0 rgba(255, 200, 150, 0.2), 0 0 12px rgba(0, 0, 0, 0.5)',
        borderColor: 'rgba(184, 115, 51, 0.8)',
    },
};

const MIDNIGHT: BoardThemeTokens = {
    frame: {
        background:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 6px), linear-gradient(145deg, #1c2029 0%, #12151c 45%, #0a0c11 100%)',
        boxShadow:
            '0 32px 85px rgba(0, 0, 0, 0.9), 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(180, 200, 255, 0.18), inset 0 -3px 8px rgba(0, 0, 0, 0.8), inset 0 0 50px rgba(0, 0, 0, 0.5)',
        border: '1.5px solid rgba(100, 116, 139, 0.5)',
        bevelBorder: '1px solid rgba(148, 163, 184, 0.22)',
    },
    felt: {
        backgroundColor: '#0b1d3a',
        backgroundImage: 'radial-gradient(ellipse at 50% 48%, #173a6b 0%, #102b52 34%, #0a1d3a 64%, #050e20 100%)',
        boxShadow:
            'inset 0 0 120px rgba(0, 0, 0, 0.75), inset 0 4px 10px rgba(0, 0, 0, 0.55), inset 0 -3px 8px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.45)',
        border: '2px solid rgba(6, 8, 14, 0.9)',
        halo: 'radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.12) 0%, rgba(59, 130, 246, 0.05) 40%, transparent 70%)',
        inset: 'inset 0 0 0 1px rgba(148, 163, 184, 0.2)',
    },
    points: {
        light: ['#e8eef7', '#d3dbe8', '#b4becf', '#95a1b6'],
        dark: ['#24407a', '#1b3263', '#12224a', '#0a1430'],
        lightStroke: 'rgba(40, 55, 80, 0.45)',
        darkStroke: 'rgba(147, 197, 253, 0.2)',
        lightInlay: 'rgba(255, 255, 255, 0.35)',
        darkInlay: 'rgba(0, 0, 0, 0.5)',
    },
    bar: {
        background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px), linear-gradient(180deg, #1a1e27 0%, #0f1218 50%, #1a1e27 100%)',
        boxShadow:
            'inset 0 0 16px rgba(0, 0, 0, 0.9), inset 1px 0 0 rgba(180, 200, 255, 0.15), inset -1px 0 0 rgba(180, 200, 255, 0.15), 0 0 12px rgba(0, 0, 0, 0.55)',
        borderColor: 'rgba(148, 163, 184, 0.6)',
    },
};

const GALAXY_VOID: BoardThemeTokens = {
    frame: {
        background:
            'linear-gradient(145deg, #14101f 0%, #0c0914 50%, #05040a 100%)',
        boxShadow:
            '0 32px 85px rgba(0, 0, 0, 0.92), 0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 2px rgba(167, 139, 250, 0.2), inset 0 -3px 8px rgba(0, 0, 0, 0.85)',
        border: '1.5px solid rgba(34, 211, 238, 0.4)',
        bevelBorder: '1px solid rgba(34, 211, 238, 0.2)',
    },
    felt: {
        backgroundColor: '#04030a',
        backgroundImage: 'radial-gradient(ellipse at 50% 48%, #0d0a1c 0%, #08060f 45%, #030208 100%)',
        boxShadow:
            'inset 0 0 120px rgba(0, 0, 0, 0.85), inset 0 4px 10px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(34, 211, 238, 0.3)',
        halo: 'radial-gradient(ellipse at 50% 50%, rgba(34, 211, 238, 0.07) 0%, rgba(139, 92, 246, 0.04) 40%, transparent 70%)',
        inset: 'inset 0 0 0 1px rgba(34, 211, 238, 0.35)',
    },
    points: {
        light: ['#22d3ee', '#0ea5c4', '#0b7f9a', '#075a70'],
        dark: ['#6d28d9', '#5b21b6', '#3b1480', '#240a52'],
        lightStroke: 'rgba(165, 243, 252, 0.45)',
        darkStroke: 'rgba(196, 181, 253, 0.35)',
        lightInlay: 'rgba(255, 255, 255, 0.2)',
        darkInlay: 'rgba(0, 0, 0, 0.5)',
    },
    bar: {
        background: 'linear-gradient(180deg, #0a0812 0%, #05040a 50%, #0a0812 100%)',
        boxShadow:
            'inset 0 0 16px rgba(0, 0, 0, 0.95), inset 1px 0 0 rgba(34, 211, 238, 0.25), inset -1px 0 0 rgba(34, 211, 238, 0.25), 0 0 14px rgba(0, 0, 0, 0.6)',
        borderColor: 'rgba(34, 211, 238, 0.55)',
    },
};

export const BOARD_THEME_TOKENS: Readonly<Record<ThemeName, BoardThemeTokens>> = {
    snowie_classic: SNOWIE_CLASSIC,
    tournament: TOURNAMENT,
    midnight: MIDNIGHT,
    galaxy_void: GALAXY_VOID,
};

/**
 * Retourne les tokens du thème demandé. Toute valeur inconnue (prop `theme`
 * typée `string` côté `BoardProps`) retombe sur `snowie_classic`.
 */
export function getBoardThemeTokens(theme?: string): BoardThemeTokens {
    if (theme === 'tournament' || theme === 'midnight' || theme === 'galaxy_void') {
        return BOARD_THEME_TOKENS[theme];
    }
    return SNOWIE_CLASSIC;
}
