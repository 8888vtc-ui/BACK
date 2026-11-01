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
    const [quizzGroupExpanded, setQuizzGroupExpanded] = useState(true);
    const [studioGroupExpanded, setStudioGroupExpanded] = useState(false);
    const [academyGroupExpanded, setAcademyGroupExpanded] = useState(false);

    const itemCls = 'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/5 hover:text-white transition';
    const subItemCls = 'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-300 hover:bg-white/5 hover:text-white transition';

    return (
        <aside
            aria-label="Menu latéral principal"
            data-testid="lobby-left-sidebar"
            className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/10 bg-[#050505] py-4 transition-all duration-200 select-none overflow-y-auto ${collapsed ? 'w-16 px-2 items-center' : 'w-56 px-3'
                }`}
        >
            <div className="flex flex-col gap-1.5 w-full">
                {/* PILIER 1 : Salon de Jeu (Actif — Entrée de menu standard sans gros bouton plein Or concurrent) */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            data-testid="sidebar-quick-play-btn"
                            onClick={onQuickPlay}
                            title="Salon de Jeu (Actif)"
                            className={`flex flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                selectedMode === 'ai' || selectedMode === 'multiplayer'
                                    ? 'border-[#d4af37]/45 bg-[#12151C] text-[#f7f3e8] shadow-sm'
                                    : 'border-transparent text-stone-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <IconLuxuryDice className="text-[#d4af37]" size={15} />
                            {!collapsed && <span>Salon de Jeu</span>}
                        </button>
                        {!collapsed && (
                            <button
                                type="button"
                                data-testid="sidebar-play-group-toggle"
                                aria-expanded={playGroupExpanded}
                                aria-label="Déplier les options du Salon de Jeu"
                                onClick={() => setPlayGroupExpanded((v) => !v)}
                                className="rounded-lg px-2 py-2 text-xs text-stone-400 hover:bg-white/5 hover:text-white transition"
                            >
                                <span aria-hidden="true">{playGroupExpanded ? '▾' : '▸'}</span>
                            </button>
                        )}
                    </div>

                    {(playGroupExpanded || collapsed) && (
                        <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-3 border-l border-white/10 ml-3 mt-0.5'}`}>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-ai"
                                onClick={onSelectAiMode}
                                className={subItemCls}
                            >
                                <IconAstrolabeCoach size={14} className="text-[#d4af37]" />
                                {!collapsed && <span>Contre l’IA</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-find-opponent"
                                onClick={() => (onFindOpponent ? onFindOpponent() : onOpenModule?.('multiplayer'))}
                                className={subItemCls}
                            >
                                <IconWorldTourLive size={14} className="text-emerald-400" />
                                {!collapsed && <span>Jouer en Ligne</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-match"
                                onClick={onSelectMatchGame}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    selectedMode === 'ai' && matchLength > 0 && isSubmenuOpen
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
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    selectedMode === 'ai' && matchLength === 0 && isSubmenuOpen
                                        ? 'bg-[#d4af37]/15 text-[#fdf8eb]'
                                        : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <IconCasinoToken size={14} />
                                {!collapsed && <span>Partie Simple</span>}
                            </button>
                        </div>
                    )}
                </div>

                {/* PILIER 2 : Puzzles & Quizz (Quizz PR, Quizz ERH & Blunders) */}
                <button
                    type="button"
                    data-testid="sidebar-pillar-puzzles"
                    aria-expanded={quizzGroupExpanded}
                    onClick={() => setQuizzGroupExpanded((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconGeometricCompass size={15} className="text-emerald-400" />
                        {!collapsed && <span>Puzzles &amp; Quizz</span>}
                    </span>
                    {!collapsed && <span aria-hidden="true" className="text-stone-500">{quizzGroupExpanded ? '▾' : '▸'}</span>}
                </button>
                {(quizzGroupExpanded || collapsed) && (
                    <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-3 border-l border-white/10 ml-3'}`}>
                        <button
                            type="button"
                            onClick={() => onOpenModule?.('puzzles')}
                            title="Performance Rating : mesure la précision mathématique de vos coups, plus il est bas, meilleur vous êtes"
                            className={subItemCls}
                        >
                            <IconGeometricCompass size={14} className="text-emerald-400" />
                            {!collapsed && <span>Quizz PR</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenModule?.('drills')}
                            title="Équité Réelle Humaine : mesure les pièges psychologiques qui provoquent le plus d'erreurs chez un adversaire humain"
                            className={subItemCls}
                        >
                            <IconAstrolabeCoach size={14} className="text-[#f3d27a]" />
                            {!collapsed && <span>Quizz ERH &amp; Blunders</span>}
                        </button>
                    </div>
                )}

                {/* PILIER 3 : Studio d'Analyse (Analyse & Scanner) */}
                <button
                    type="button"
                    data-testid="sidebar-pillar-studio"
                    aria-expanded={studioGroupExpanded}
                    onClick={() => setStudioGroupExpanded((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconCameraScanner size={15} className="text-sky-400" />
                        {!collapsed && <span>Studio d’Analyse</span>}
                    </span>
                    {!collapsed && <span aria-hidden="true" className="text-stone-500">{studioGroupExpanded ? '▾' : '▸'}</span>}
                </button>
                {(studioGroupExpanded || collapsed) && (
                    <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-3 border-l border-white/10 ml-3'}`}>
                        <button type="button" onClick={() => onOpenModule?.('stats')} className={subItemCls}>
                            <IconAstrolabeCoach size={14} className="text-sky-400" />
                            {!collapsed && <span>Analyse &amp; PR</span>}
                        </button>
                        <button type="button" onClick={() => onOpenModule?.('import_export')} className={subItemCls}>
                            <IconCameraScanner size={14} className="text-[#f3d27a]" />
                            {!collapsed && <span>Scanner &amp; Import</span>}
                        </button>
                    </div>
                )}

                {/* PILIER 4 : Académie (Ouvertures, Bibliothèque, Leçons) */}
                <button
                    type="button"
                    data-testid="sidebar-pillar-academy"
                    aria-expanded={academyGroupExpanded}
                    onClick={() => setAcademyGroupExpanded((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconGrimoireBook size={15} className="text-[#f3d27a]" />
                        {!collapsed && <span>Académie</span>}
                    </span>
                    {!collapsed && <span aria-hidden="true" className="text-stone-500">{academyGroupExpanded ? '▾' : '▸'}</span>}
                </button>
                {(academyGroupExpanded || collapsed) && (
                    <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-3 border-l border-white/10 ml-3'}`}>
                        <button type="button" onClick={() => onOpenModule?.('openings')} className={subItemCls}>
                            <IconGrimoireBook size={14} className="text-[#f3d27a]" />
                            {!collapsed && <span>Ouvertures &amp; Bibliothèque</span>}
                        </button>
                        <Link href="/academy" className={subItemCls}>
                            <IconLuxuryCrown size={14} className="text-emerald-400" />
                            {!collapsed && <span>Leçons &amp; Théorie 3-Ply</span>}
                        </Link>
                    </div>
                )}

                {/* PILIER 5 : Carte : Tournois & Clubs */}
                <button
                    type="button"
                    data-testid="sidebar-tournaments-live-btn"
                    onClick={() => onOpenModule?.('tournaments')}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2.5">
                        <IconWorldTourLive size={15} className="text-amber-400" />
                        {!collapsed && <span>Carte : Tournois &amp; Clubs</span>}
                    </span>
                </button>
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
