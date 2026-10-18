'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ThemeName } from '../components/board/boardThemes';

export type { ThemeName };

export const DEFAULT_BOARD_THEME: ThemeName = 'snowie_classic';
export const THEME_STORAGE_KEY = 'backgammon_theme_v4';

export interface BoardThemeContextValue {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    toggleTheme: () => void;
    isHydrated: boolean;
}

export interface ThemeModalClasses {
    overlay: string;
    container: string;
    header: string;
    title: string;
    subtitle: string;
    card: string;
    badge: string;
    closeBtn: string;
    border: string;
}

export interface ThemeHudClasses {
    container: string;
    badge: string;
    menu: string;
    menuItem: string;
    button: string;
}

/**
 * Valide si une valeur correspond à un nom de thème supporté.
 */
export function isValidTheme(val: unknown): val is ThemeName {
    return (
        val === 'snowie_classic' ||
        val === 'tournament' ||
        val === 'midnight' ||
        val === 'galaxy_void'
    );
}

/**
 * Lit le thème persistant depuis localStorage de manière sécurisée (SSR-safe).
 */
export function getSavedTheme(defaultTheme: ThemeName = DEFAULT_BOARD_THEME): ThemeName {
    if (typeof localStorage === 'undefined') return defaultTheme;
    try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (isValidTheme(saved)) {
            return saved;
        }
    } catch {
        // localStorage indisponible (ex: iframe sandbox ou navigation privée restreinte)
    }
    return defaultTheme;
}

/**
 * Enregistre le thème dans localStorage de manière sécurisée.
 */
export function saveTheme(theme: ThemeName): void {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // ignore
    }
}

/**
 * Détermine le prochain thème lors d'une bascule séquentielle (cycle Snowie -> Tournament -> Midnight).
 */
export function getNextTheme(current: ThemeName): ThemeName {
    if (current === 'snowie_classic') return 'tournament';
    if (current === 'tournament') return 'midnight';
    if (current === 'midnight') return 'galaxy_void';
    return 'snowie_classic';
}

/**
 * Classes Tailwind harmonisées pour les fenêtres modales et dialogues d'ambiance.
 */
export function getModalThemeClasses(theme: ThemeName): ThemeModalClasses {
    if (theme === 'snowie_classic') {
        return {
            overlay: 'bg-black/85 backdrop-blur-md',
            container:
                'border-amber-600/70 bg-gradient-to-b from-[#25130b] via-[#1c0e07] to-[#120703] text-amber-100 shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-amber-500/30',
            header: 'border-amber-800/60 bg-[#1a0c06]/85 text-amber-100',
            title: 'text-amber-100 font-serif',
            subtitle: 'text-amber-300/70',
            card: 'border-amber-800/40 bg-[#2b170c]/50 text-amber-100',
            badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            closeBtn:
                'border-amber-700/60 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 hover:text-white transition-colors',
            border: 'border-amber-800/60',
        };
    }
    if (theme === 'tournament') {
        return {
            overlay: 'bg-black/85 backdrop-blur-md',
            container:
                'border-emerald-600/60 bg-gradient-to-b from-[#183a24] via-[#102718] to-[#08150c] text-emerald-100 shadow-[0_25px_60px_rgba(0,0,0,0.95)] ring-1 ring-emerald-500/30',
            header: 'border-emerald-800/60 bg-[#0f2416]/85 text-emerald-100',
            title: 'text-emerald-100 font-sans',
            subtitle: 'text-emerald-300/70',
            card: 'border-emerald-800/40 bg-[#163621]/50 text-emerald-100',
            badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            closeBtn:
                'border-emerald-700/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition-colors',
            border: 'border-emerald-800/60',
        };
    }
    // midnight
    return {
        overlay: 'bg-slate-950/85 backdrop-blur-md',
        container:
            'border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100 shadow-2xl ring-1 ring-white/10',
        header: 'border-slate-800 bg-slate-950/70 text-slate-100',
        title: 'text-white font-sans',
        subtitle: 'text-slate-400',
        card: 'border-slate-800 bg-slate-800/40 text-slate-200',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        closeBtn:
            'border-slate-700 bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors',
        border: 'border-slate-800',
    };
}

/**
 * Classes Tailwind harmonisées pour le tableau de bord supérieur (MatchHud).
 */
export function getHudThemeClasses(theme: ThemeName): ThemeHudClasses {
    if (theme === 'snowie_classic') {
        return {
            container:
                'border-amber-700/60 bg-gradient-to-r from-[#241208]/95 via-[#1b0d06]/95 to-[#0b2316]/95 text-amber-100 shadow-[0_12px_36px_rgba(34,17,8,0.7)] ring-1 ring-amber-500/20',
            badge: 'bg-amber-950/70 border-amber-600/50 text-amber-200',
            menu: 'border-amber-700/70 bg-[#1b0d06]/98 text-amber-100 shadow-[0_20px_40px_rgba(20,10,5,0.9)] ring-1 ring-amber-500/30',
            menuItem: 'hover:bg-amber-900/40 text-amber-200 hover:text-amber-100',
            button: 'border-amber-600/60 bg-gradient-to-r from-stone-900 via-amber-950/60 to-emerald-950/70 text-amber-200',
        };
    }
    if (theme === 'tournament') {
        return {
            container:
                'border-amber-800/60 bg-gradient-to-r from-[#3e2714]/95 via-[#2a1a0d]/95 to-[#0e3b20]/95 text-emerald-100 shadow-[0_12px_36px_rgba(20,83,45,0.5)] ring-1 ring-emerald-500/20',
            badge: 'bg-emerald-950/70 border-emerald-600/50 text-emerald-200',
            menu: 'border-emerald-700/70 bg-[#0f2416]/98 text-emerald-100 shadow-[0_20px_40px_rgba(10,25,15,0.9)] ring-1 ring-emerald-500/30',
            menuItem: 'hover:bg-emerald-900/40 text-emerald-200 hover:text-emerald-100',
            button: 'border-amber-700/60 bg-gradient-to-r from-amber-950/70 to-emerald-950/70 text-amber-200',
        };
    }
    // midnight
    return {
        container:
            'border-slate-700/60 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md ring-1 ring-slate-700/40',
        badge: 'bg-slate-800/70 border-slate-700/50 text-slate-200',
        menu: 'border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10',
        menuItem: 'hover:bg-slate-800 text-slate-300 hover:text-white',
        button: 'border-blue-700/60 bg-gradient-to-r from-slate-900 to-blue-950/70 text-blue-200',
    };
}

export const BoardThemeContext = createContext<BoardThemeContextValue | null>(null);

function useThemeStateInternal(defaultTheme: ThemeName = DEFAULT_BOARD_THEME): BoardThemeContextValue {
    const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const saved = getSavedTheme(defaultTheme);
        setThemeState(saved);
        setIsHydrated(true);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === THEME_STORAGE_KEY && isValidTheme(e.newValue)) {
                setThemeState(e.newValue);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorage);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', handleStorage);
            }
        };
    }, [defaultTheme]);

    const setTheme = useCallback((newTheme: ThemeName) => {
        setThemeState(newTheme);
        saveTheme(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeState((current) => {
            const next = getNextTheme(current);
            saveTheme(next);
            return next;
        });
    }, []);

    return useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme,
            isHydrated,
        }),
        [theme, setTheme, toggleTheme, isHydrated],
    );
}

/**
 * Fournisseur global du thème du plateau (Source Unique de Vérité).
 * Doit envelopper l'application dans AppProviders.
 */
export function BoardThemeProvider({
    children,
    defaultTheme = DEFAULT_BOARD_THEME,
}: {
    children: React.ReactNode;
    defaultTheme?: ThemeName;
}) {
    const value = useThemeStateInternal(defaultTheme);
    return <BoardThemeContext.Provider value={value}>{children}</BoardThemeContext.Provider>;
}

/**
 * Hook d'accès au thème unifié.
 * - S'il est utilisé au sein de BoardThemeProvider, consomme la source unique de vérité partagée.
 * - Hors de BoardThemeProvider (ex: tests isolés sans wrapper), fonctionne de façon autonome avec persistance.
 */
export function useBoardTheme(defaultTheme: ThemeName = DEFAULT_BOARD_THEME): BoardThemeContextValue {
    const context = useContext(BoardThemeContext);
    const local = useThemeStateInternal(defaultTheme);
    return context ?? local;
}
