'use client';

/**
 * @file src/components/lobby/LobbySidebarAndWidgets.tsx
 * @description Barre latérale gauche rétractable regroupée en 3 blocs aérés ("Tables", "Entraînement & Analyse", "Circuit")
 * avec indicateur vertical fin Or (`border-l-2 border-[#D4AF37]`) et orthographe unifiée "Quiz".
 * Strictement < 280 lignes, 0 `any`, zéro micro-texte < 11px.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Flame, BarChart2, GraduationCap } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import type { LobbyModuleId } from './LobbyScreen';
import {
    IconLuxuryDice,
    IconCasinoToken,
    IconLuxuryCrown,
    IconAstrolabeCoach,
    IconWorldTourLive,
    IconHorologyGear,
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
    onQuickPlay,
    onFindOpponent,
    onOpenPassport,
    onSelectAiMode,
    onSelectMultiplayerMode,
    onOpenModule,
    onOpenSettings,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const [collapsed, setCollapsed] = useState(false);
    const [playGroupExpanded, setPlayGroupExpanded] = useState(true);

    const activeRailCls =
        'border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/12 to-transparent text-[#F3E5AB]';
    const itemCls =
        'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-all duration-150';
    const subItemCls =
        'flex items-center gap-2.5 rounded-r-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 transition-all duration-150';
    const sectionLabelCls =
        'px-3 pb-1 text-[11px] uppercase tracking-[0.15em] text-zinc-500 font-semibold';

    return (
        <aside
            aria-label="Menu latéral principal"
            data-testid="lobby-left-sidebar"
            className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/[0.06] bg-[#0B0E14]/90 backdrop-blur-md py-5 transition-all duration-200 select-none overflow-y-auto ${
                collapsed ? 'w-16 px-2 items-center' : 'w-60 px-3'
            }`}
        >
            <div className="flex flex-col gap-4 w-full">
                {/* BLOC 1 : TABLES DE JEU */}
                <div className="flex flex-col gap-1">
                    {!collapsed && <span className={sectionLabelCls}>Tables</span>}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            data-testid="sidebar-quick-play-btn"
                            onClick={onQuickPlay}
                            title="Salon de Jeu (Actif)"
                            className={`flex flex-1 items-center gap-2.5 rounded-r-lg px-3 py-2 text-xs font-bold transition-all duration-150 ${
                                selectedMode === 'ai' || selectedMode === 'multiplayer'
                                    ? activeRailCls
                                    : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                            <IconLuxuryDice className="text-[#D4AF37]" size={15} />
                            {!collapsed && <span>Salon de Jeu</span>}
                        </button>
                        {!collapsed && !isBeginner && (
                            <button
                                type="button"
                                data-testid="sidebar-play-group-toggle"
                                aria-expanded={playGroupExpanded}
                                aria-label="Déplier les options du Salon de Jeu"
                                onClick={() => setPlayGroupExpanded((v) => !v)}
                                className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-white transition"
                            >
                                <span aria-hidden="true">{playGroupExpanded ? '▾' : '▸'}</span>
                            </button>
                        )}
                    </div>

                    {!isBeginner && (playGroupExpanded || collapsed) && (
                        <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-2 border-l border-white/[0.06] ml-3 mt-0.5'}`}>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-find-opponent"
                                onClick={() =>
                                    onSelectMultiplayerMode
                                        ? onSelectMultiplayerMode()
                                        : onFindOpponent
                                          ? onFindOpponent()
                                          : onOpenModule?.('multiplayer')
                                }
                                className={`flex items-center gap-2.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                    selectedMode === 'multiplayer'
                                        ? activeRailCls
                                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                                }`}
                            >
                                <IconWorldTourLive size={14} className="text-[#10B981]" />
                                {!collapsed && <span>Jouer en Ligne</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-ai"
                                onClick={onSelectAiMode}
                                className={`flex items-center gap-2.5 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                    selectedMode === 'ai'
                                        ? activeRailCls
                                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                                }`}
                            >
                                <IconAstrolabeCoach size={14} className="text-[#D4AF37]" />
                                {!collapsed && <span>Contre l’IA</span>}
                            </button>
                        </div>
                    )}
                </div>

                {/* BLOC 2 : ENTRAÎNEMENT & ANALYSE */}
                <div className="flex flex-col gap-1">
                    {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Training & Analysis' : 'Entraînement'}</span>}

                    {/* 1. Mes Quiz */}
                    <Link
                        href="/puzzles"
                        data-testid="sidebar-my-quizzes-link"
                        title={isEn ? 'Adaptive Quizzes for your active tier' : 'Quiz adaptatifs selon votre porte active'}
                        className={itemCls}
                    >
                        <span className="flex items-center gap-2.5">
                            <Sparkles size={16} strokeWidth={1.5} className="text-[#10B981]" />
                            {!collapsed && <span>{isEn ? 'My Quizzes' : 'Mes Quiz'}</span>}
                        </span>
                    </Link>

                    {/* 2. Mes Blunders */}
                    <Link
                        href="/puzzles?filter=personal-blunders"
                        data-testid="sidebar-my-blunders-link"
                        title={isEn ? 'Review your personal blunders' : 'Revoir vos erreurs et blunders personnels'}
                        className={itemCls}
                    >
                        <span className="flex items-center gap-2.5">
                            <Flame size={16} strokeWidth={1.5} className="text-[#F59E0B]" />
                            {!collapsed && <span>{isEn ? 'My Blunders' : 'Mes Blunders'}</span>}
                        </span>
                    </Link>

                    {/* 3. Studio d'Analyse (Uniquement pour Intermédiaire et Expert) */}
                    {!isBeginner && (
                        <Link
                            href="/analysis"
                            data-testid="sidebar-pillar-studio"
                            title={isEn ? 'Analysis & Performance Rating Studio' : 'Studio d’analyse et Performance Rating'}
                            className={itemCls}
                        >
                            <span className="flex items-center gap-2.5">
                                <BarChart2 size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                                {!collapsed && <span>{isEn ? 'Analysis Studio' : 'Studio d’Analyse'}</span>}
                            </span>
                        </Link>
                    )}

                    {/* 4. Académie */}
                    <Link
                        href="/academy"
                        data-testid="sidebar-pillar-academy"
                        title={isEn ? 'Academy: Lessons & Theory' : 'Académie : Leçons & Théorie 3-Ply'}
                        className={itemCls}
                    >
                        <span className="flex items-center gap-2.5">
                            <GraduationCap size={16} strokeWidth={1.5} className="text-[#38BDF8]" />
                            {!collapsed && <span>{isEn ? 'Academy' : 'Académie'}</span>}
                        </span>
                    </Link>
                </div>

                {/* BLOC 3 : CIRCUIT MONDIAL */}
                <div className="flex flex-col gap-1">
                    {!collapsed && <span className={sectionLabelCls}>Circuit</span>}
                    <button
                        type="button"
                        data-testid="sidebar-tournaments-live-btn"
                        onClick={() => onOpenModule?.('tournaments')}
                        className={itemCls}
                    >
                        <span className="flex items-center gap-2.5">
                            <IconWorldTourLive size={15} className="text-[#D4AF37]" />
                            {!collapsed && <span>Carte : Tournois &amp; Clubs</span>}
                        </span>
                    </button>
                </div>
            </div>

            {/* Pied de barre latérale */}
            <div className="flex flex-col gap-1 w-full pt-3 border-t border-white/[0.06]">
                <button type="button" data-testid="sidebar-submenu-friends" onClick={onSelectMultiplayerMode} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconCasinoToken size={15} className="text-[#D4AF37]" />
                        {!collapsed && <span>Inviter des amis</span>}
                    </span>
                </button>
                {onOpenPassport && (
                    <button type="button" data-testid="sidebar-passport-btn" onClick={onOpenPassport} className={itemCls}>
                        <span className="flex items-center gap-2.5">
                            <IconLuxuryCrown size={15} className="text-[#D4AF37]" />
                            {!collapsed && <span>Mon Profil</span>}
                        </span>
                    </button>
                )}
                <button type="button" onClick={onOpenSettings} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <IconHorologyGear size={15} className="text-zinc-400" />
                        {!collapsed && <span>Réglages</span>}
                    </span>
                </button>
                <button type="button" data-testid="sidebar-collapse-toggle" onClick={() => setCollapsed((v) => !v)} className={itemCls}>
                    <span className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="text-[#D4AF37] font-mono">{collapsed ? '⇥' : '⇤'}</span>
                        {!collapsed && <span>Réduire</span>}
                    </span>
                </button>
            </div>
        </aside>
    );
};
