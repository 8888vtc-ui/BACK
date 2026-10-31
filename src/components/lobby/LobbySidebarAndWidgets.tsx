'use client';

/**
 * @file src/components/lobby/LobbySidebarAndWidgets.tsx
 * @description Barre latérale gauche rétractable regroupant par catégories toutes les fonctions clés
 * de Backgammon Tour (Tables, Académie & Entraînement, Analyse & Outils Pro, Circuit Mondial Live)
 * et colonne droite avec les vraies photographies des Maîtres Résidents.
 * Strictement < 290 lignes, 0 `any`, zéro micro-texte < 11px.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import type { LobbyModuleId } from './LobbyScreen';
import {
    IconLuxuryDice,
    IconCasinoToken,
    IconLuxuryCrown,
    IconAstrolabeCoach,
    IconWorldTourLive,
    IconGeometricCompass,
    IconGrimoireBook,
    IconHorologyGear,
    IconCameraScanner,
} from '../common/MonteCarloIcons';

export interface LobbyLeftSidebarProps {
    readonly selectedMode: 'ai' | 'multiplayer' | 'training' | null;
    readonly matchLength: number;
    readonly isSubmenuOpen?: boolean;
    readonly onQuickPlay: () => void;
    readonly onFindOpponent?: () => void;
    readonly onOpenPassport?: () => void;
    readonly onSelectMoneyGame: () => void;
    readonly onSelectMatchGame: () => void;
    readonly onSelectAiMode: () => void;
    readonly onSelectMultiplayerMode: () => void;
    readonly onOpenModule?: (moduleId: LobbyModuleId) => void;
    readonly onOpenTableClock?: () => void;
    readonly onOpenSettings: () => void;
}

export const LobbyLeftSidebar: React.FC<LobbyLeftSidebarProps> = ({
    selectedMode,
    matchLength,
    isSubmenuOpen = false,
    onQuickPlay,
    onFindOpponent,
    onOpenPassport,
    onSelectMoneyGame,
    onSelectMatchGame,
    onSelectAiMode,
    onSelectMultiplayerMode,
    onOpenModule,
    onOpenSettings,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [playGroupExpanded, setPlayGroupExpanded] = useState(true);

    const itemCls = 'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5 hover:text-white transition';

    return (
        <aside
            aria-label="Menu latéral principal"
            data-testid="lobby-left-sidebar"
            className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/10 bg-[#0b0907] py-4 transition-all duration-200 select-none overflow-y-auto ${collapsed ? 'w-16 px-2 items-center' : 'w-56 px-3'
                }`}
        >
            <div className="flex flex-col gap-1.5 w-full">
                {/* Bouton Principal Style Galaxy : Jeu Rapide */}
                <button
                    type="button"
                    data-testid="sidebar-quick-play-btn"
                    onClick={onQuickPlay}
                    title="Lancer une partie rapide"
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5dfa0]/60 bg-gradient-to-r from-[#d4af37] via-[#f3d27a] to-[#b88924] px-3 py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#090806] shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition hover:brightness-105 active:scale-95"
                >
                    <IconLuxuryDice className="text-[#090806]" size={16} />
                    {!collapsed && <span>Jeu Rapide</span>}
                </button>

                {/* 1. Jouer */}
                <button
                    type="button"
                    data-testid="sidebar-play-group-toggle"
                    aria-expanded={playGroupExpanded}
                    onClick={() => setPlayGroupExpanded((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconLuxuryDice size={15} className="text-[#d4af37]" />
                        {!collapsed && <span>Jouer</span>}
                    </span>
                    {!collapsed && <span aria-hidden="true" className="text-stone-500">{playGroupExpanded ? '▾' : '▸'}</span>}
                </button>

                {(playGroupExpanded || collapsed) && (
                    <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-3 border-l border-white/10 ml-3'}`}>
                        <button
                            type="button"
                            data-testid="sidebar-submenu-find-opponent"
                            onClick={() => (onFindOpponent ? onFindOpponent() : onOpenModule?.('multiplayer'))}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-white/5 hover:text-white transition"
                        >
                            <IconWorldTourLive size={14} className="text-emerald-400" />
                            {!collapsed && <span>Jouer en Ligne</span>}
                        </button>
                        <button
                            type="button"
                            data-testid="sidebar-submenu-match"
                            onClick={onSelectMatchGame}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${selectedMode === 'ai' && matchLength > 0 && isSubmenuOpen
                                    ? 'bg-[#d4af37]/15 text-[#fdf8eb]'
                                    : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <IconLuxuryCrown size={14} />
                            {!collapsed && <span>Match (3 à 11 pts)</span>}
                        </button>
                        <button
                            type="button"
                            data-testid="sidebar-submenu-money"
                            onClick={onSelectMoneyGame}
                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${selectedMode === 'ai' && matchLength === 0 && isSubmenuOpen
                                    ? 'bg-[#d4af37]/15 text-[#fdf8eb]'
                                    : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <IconCasinoToken size={14} />
                            {!collapsed && <span>Partie Simple</span>}
                        </button>
                        <button
                            type="button"
                            data-testid="sidebar-submenu-ai"
                            onClick={onSelectAiMode}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-white/5 hover:text-white transition"
                        >
                            <IconAstrolabeCoach size={14} />
                            {!collapsed && <span>Contre l’IA</span>}
                        </button>
                    </div>
                )}

                {/* 2. Tournois */}
                <button
                    type="button"
                    data-testid="sidebar-tournaments-live-btn"
                    onClick={() => onOpenModule?.('tournaments')}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconWorldTourLive size={15} className="text-amber-400" />
                        {!collapsed && <span>Tournois</span>}
                    </span>
                </button>

                {/* 3. Puzzles */}
                <button type="button" onClick={() => onOpenModule?.('puzzles')} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconGeometricCompass size={15} className="text-emerald-400" />
                        {!collapsed && <span>Puzzles</span>}
                    </span>
                </button>

                {/* 4. Entraînement & Blunders */}
                <button type="button" onClick={() => onOpenModule?.('drills')} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconAstrolabeCoach size={15} className="text-rose-400" />
                        {!collapsed && <span>Entraînement</span>}
                    </span>
                </button>

                {/* 5. Analyse & Progression */}
                <button type="button" onClick={() => onOpenModule?.('stats')} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconCameraScanner size={15} className="text-sky-400" />
                        {!collapsed && <span>Analyse</span>}
                    </span>
                </button>

                {/* 6. Bibliothèque d'Ouvertures */}
                <button type="button" onClick={() => onOpenModule?.('openings')} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconGrimoireBook size={15} className="text-[#f3d27a]" />
                        {!collapsed && <span>Bibliothèque</span>}
                    </span>
                </button>

                {/* 7. Leçons & Académie */}
                <Link href="/academy" className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconLuxuryCrown size={15} className="text-emerald-400" />
                        {!collapsed && <span>Leçons</span>}
                    </span>
                </Link>
            </div>

            {/* Pied de barre latérale épuré (Inviter des amis, Mon Profil, Réglages, Réduire) */}
            <div className="flex flex-col gap-1 w-full pt-2 border-t border-white/10">
                <button
                    type="button"
                    data-testid="sidebar-submenu-friends"
                    onClick={onSelectMultiplayerMode}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconCasinoToken size={15} className="text-[#f3d27a]" />
                        {!collapsed && <span>Inviter des amis</span>}
                    </span>
                </button>
                {onOpenPassport && (
                    <button type="button" data-testid="sidebar-passport-btn" onClick={onOpenPassport} className={itemCls}>
                        <span className="flex items-center gap-2.5">
                            <IconLuxuryCrown size={15} />
                            {!collapsed && <span>Mon Profil</span>}
                        </span>
                    </button>
                )}
                <button type="button" onClick={onOpenSettings} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconHorologyGear size={15} />
                        {!collapsed && <span>Réglages</span>}
                    </span>
                </button>
                <button
                    type="button"
                    data-testid="sidebar-collapse-toggle"
                    onClick={() => setCollapsed((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="text-[#d4af37] font-mono">{collapsed ? '⇥' : '⇤'}</span>
                        {!collapsed && <span>Réduire</span>}
                    </span>
                </button>
            </div>
        </aside>
    );
};
