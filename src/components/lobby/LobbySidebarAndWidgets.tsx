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
    IconBronsteinClock,
    BotPortraitMedallion,
} from '../common/MonteCarloIcons';

export interface LobbyLeftSidebarProps {
    readonly selectedMode: 'ai' | 'multiplayer' | 'training' | null;
    readonly matchLength: number;
    readonly isSubmenuOpen?: boolean;
    readonly onQuickPlay: () => void;
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
    onSelectMoneyGame,
    onSelectMatchGame,
    onSelectAiMode,
    onSelectMultiplayerMode,
    onOpenModule,
    onOpenTableClock,
    onOpenSettings,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [playGroupExpanded, setPlayGroupExpanded] = useState(true);

    const itemCls = 'flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-300 hover:bg-white/5 hover:text-white transition';

    return (
        <aside
            aria-label="Menu latéral principal par catégories"
            data-testid="lobby-left-sidebar"
            className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-[#d4af37]/20 bg-[#0b0907] py-3.5 transition-all duration-200 select-none overflow-y-auto ${collapsed ? 'w-16 px-2 items-center' : 'w-64 px-3.5'
                }`}
        >
            <div className="flex flex-col gap-2 w-full">
                {/* CTA Table Immédiate Or Champagne */}
                <button
                    type="button"
                    data-testid="sidebar-quick-play-btn"
                    onClick={onQuickPlay}
                    title="Ouvrir une table immédiate"
                    className="mb-1 flex w-full items-center justify-center gap-2 rounded-xl border border-[#f5dfa0]/60 bg-gradient-to-r from-[#d4af37] via-[#f3d27a] to-[#b88924] px-3 py-2.5 text-xs font-extrabold uppercase tracking-widest text-[#090806] shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition hover:brightness-105 active:scale-95"
                >
                    <IconLuxuryDice className="text-[#090806]" size={16} />
                    {!collapsed && <span>Table Immédiate</span>}
                </button>

                {/* CATÉGORIE I : TABLES DU SALON */}
                <div className="flex flex-col gap-0.5">
                    <button
                        type="button"
                        data-testid="sidebar-play-group-toggle"
                        aria-expanded={playGroupExpanded}
                        onClick={() => setPlayGroupExpanded((v) => !v)}
                        className="flex items-center justify-between rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-[#d4af37] hover:bg-[#d4af37]/10 transition"
                    >
                        <span className="flex items-center gap-2">
                            <IconLuxuryDice size={14} />
                            {!collapsed && <span>I. Tables du Salon</span>}
                        </span>
                        {!collapsed && <span aria-hidden="true">{playGroupExpanded ? '▾' : '▸'}</span>}
                    </button>

                    {(playGroupExpanded || collapsed) && (
                        <div className={`flex flex-col gap-0.5 ${collapsed ? '' : 'pl-2 border-l border-[#d4af37]/20 ml-2'}`}>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-money"
                                onClick={onSelectMoneyGame}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${selectedMode === 'ai' && matchLength === 0 && isSubmenuOpen
                                        ? 'border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#fdf8eb]'
                                        : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <IconCasinoToken size={15} />
                                {!collapsed && <span>Money Game (Jacoby)</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-match"
                                onClick={onSelectMatchGame}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${selectedMode === 'ai' && matchLength > 0 && isSubmenuOpen
                                        ? 'border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#fdf8eb]'
                                        : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <IconLuxuryCrown size={15} />
                                {!collapsed && <span>Match (1–11 pts · Crawford)</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-ai"
                                onClick={onSelectAiMode}
                                className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-stone-300 hover:bg-white/5 hover:text-white transition"
                            >
                                <IconAstrolabeCoach size={15} />
                                {!collapsed && <span>Jouer contre l’IA 3-Ply</span>}
                            </button>
                            <button
                                type="button"
                                data-testid="sidebar-submenu-friends"
                                onClick={onSelectMultiplayerMode}
                                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${selectedMode === 'multiplayer'
                                        ? 'border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#fdf8eb]'
                                        : 'text-stone-300 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <IconCasinoToken size={15} className="text-emerald-400" />
                                {!collapsed && <span>Salon Privé · Code Ami</span>}
                            </button>
                        </div>
                    )}
                </div>

                {/* CATÉGORIE II : ACADÉMIE & ENTRAÎNEMENT */}
                <div className="flex flex-col gap-0.5 pt-1 border-t border-[#d4af37]/15">
                    {!collapsed && (
                        <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
                            II. Académie & Drills
                        </span>
                    )}
                    <button type="button" onClick={() => onOpenModule?.('puzzles')} className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconGeometricCompass size={15} />
                            {!collapsed && <span>Puzzles Quotidiens</span>}
                        </span>
                        {!collapsed && <span className="font-mono text-[11px] font-bold text-[#f3d27a]">1/7</span>}
                    </button>
                    <button type="button" onClick={() => onOpenModule?.('drills')} className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconAstrolabeCoach size={15} />
                            {!collapsed && <span>Drills de Blunders</span>}
                        </span>
                        {!collapsed && <span className="rounded bg-rose-500/20 border border-rose-400/40 px-1.5 py-0.2 font-mono text-[11px] font-bold text-rose-200">FSRS</span>}
                    </button>
                    <button type="button" onClick={() => onOpenModule?.('openings')} className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconGrimoireBook size={15} />
                            {!collapsed && <span>Les 15 Ouvertures XG</span>}
                        </span>
                        {!collapsed && <span className="font-mono text-[11px] text-stone-400">0/15</span>}
                    </button>
                    <Link href="/academy#learn-rules" className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconLuxuryCrown size={15} className="text-emerald-400" />
                            {!collapsed && <span>Règles en 5 min & Guides</span>}
                        </span>
                        {!collapsed && <span className="font-mono text-[11px] text-emerald-300">5 min</span>}
                    </Link>
                    <Link href="/academy#er-vs-erh-manifesto" className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconAstrolabeCoach size={15} className="text-[#f3d27a]" />
                            {!collapsed && <span>Étude ER vs ERH (19 413 Quiz)</span>}
                        </span>
                        {!collapsed && <span className="font-mono text-[11px] font-bold text-[#f3d27a]">+30.9%</span>}
                    </Link>
                </div>

                {/* CATÉGORIE III : ANALYSE & OUTILS PRO */}
                <div className="flex flex-col gap-0.5 pt-1 border-t border-[#d4af37]/15">
                    {!collapsed && (
                        <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#d4af37]">
                            III. Analyse & Outils Pro
                        </span>
                    )}
                    <button type="button" onClick={() => onOpenModule?.('stats')} className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconGeometricCompass size={15} className="text-emerald-400" />
                            {!collapsed && <span>Progression, ELO & PR</span>}
                        </span>
                    </button>
                    <button type="button" onClick={() => onOpenModule?.('import_export')} className={itemCls}>
                        <span className="flex items-center gap-2">
                            <IconCameraScanner size={15} />
                            {!collapsed && <span>Scanner / Importer (.mat)</span>}
                        </span>
                    </button>
                    {onOpenTableClock && (
                        <button type="button" onClick={onOpenTableClock} className={itemCls}>
                            <span className="flex items-center gap-2">
                                <IconBronsteinClock size={15} />
                                {!collapsed && <span>Pendule WBF Bronstein</span>}
                            </span>
                        </button>
                    )}
                </div>

                {/* CATÉGORIE IV : CIRCUIT MONDIAL LIVE */}
                <div className="flex flex-col gap-0.5 pt-1 border-t border-[#d4af37]/15">
                    <button
                        type="button"
                        data-testid="sidebar-tournaments-live-btn"
                        onClick={() => onOpenModule?.('tournaments')}
                        className="flex items-center justify-between rounded-xl border border-[#d4af37]/30 bg-[#16120e] px-2.5 py-2 text-xs font-semibold text-[#f7f3e8] hover:border-[#d4af37]/60 transition"
                    >
                        <span className="flex items-center gap-2">
                            <IconWorldTourLive size={15} />
                            {!collapsed && <span>Tournois & Agenda</span>}
                        </span>
                        {!collapsed && (
                            <span className="rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-200 uppercase">
                                LIVE
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Pied de barre latérale */}
            <div className="flex flex-col gap-1 w-full pt-2 border-t border-[#d4af37]/20">
                <button type="button" onClick={onOpenSettings} className={itemCls}>
                    <span className="flex items-center gap-2">
                        <IconHorologyGear size={15} />
                        {!collapsed && <span>Configurer la Table</span>}
                    </span>
                </button>
                <button
                    type="button"
                    data-testid="sidebar-collapse-toggle"
                    onClick={() => setCollapsed((v) => !v)}
                    className={itemCls}
                >
                    <span className="flex items-center gap-2">
                        <span aria-hidden="true" className="text-[#d4af37] font-mono">{collapsed ? '⇥' : '⇤'}</span>
                        {!collapsed && <span>Réduire le menu</span>}
                    </span>
                </button>
            </div>
        </aside>
    );
};

export interface LobbyRightShowcaseColumnProps {
    readonly eloRating: number;
    readonly averagePR: number | null;
    readonly onQuickPlay: () => void;
    readonly onOpenStats: () => void;
}

export const LobbyRightShowcaseColumn: React.FC<LobbyRightShowcaseColumnProps> = ({
    eloRating,
    averagePR,
    onQuickPlay,
    onOpenStats,
}) => {
    return (
        <aside
            aria-label="Table d'Honneur et Galerie des Maîtres"
            data-testid="lobby-right-showcase"
            className="hidden xl:flex flex-col gap-3 w-72 shrink-0 overflow-y-auto max-h-[calc(100dvh-5.5rem)] pr-0.5"
        >
            {/* Carte Table d'Honneur Monte-Carlo */}
            <div className="rounded-2xl border border-[#d4af37]/30 bg-[#110e0b] p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                        <BotPortraitMedallion character="grandmaster" size="sm" isActive />
                        <div>
                            <div className="font-display text-sm font-bold italic text-[#f7f3e8]">
                                Viktor « L’Intellectuel »
                            </div>
                            <div className="font-mono text-[11px] font-semibold text-[#d4af37]">
                                2150 Elo · PR 0.6
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onQuickPlay}
                    className="group relative w-full aspect-[16/11] rounded-xl border border-[#d4af37]/40 bg-[#09341c] overflow-hidden shadow-inner flex flex-col justify-between p-2 text-left transition hover:brightness-105"
                >
                    <div className="flex items-center justify-between z-10">
                        <span className="inline-flex items-center gap-1.5 rounded border border-[#d4af37]/40 bg-[#0b0907]/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-[#f7f3e8]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Table d’Honneur
                        </span>
                        <span className="rounded border border-[#f5dfa0] bg-[#78350f] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#fef3c7] shadow">
                            64
                        </span>
                    </div>

                    <div className="grid grid-cols-6 gap-1 my-auto opacity-95" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className={`h-11 rounded-sm ${i % 2 === 0 ? 'bg-[#d4af37]' : 'bg-[#4a1807]'
                                    } flex flex-col items-center justify-between p-0.5`}
                            >
                                <span className="h-3 w-3 rounded-full bg-[#f7f3e8] border border-[#d4af37]" />
                                <span className="h-3 w-3 rounded-full bg-[#141210] border border-[#d4af37]/60" />
                            </div>
                        ))}
                    </div>

                    <div className="z-10 flex items-center justify-between rounded-lg bg-[#0b0907]/90 px-2.5 py-1.5 text-xs font-bold text-[#f7f3e8] border border-[#d4af37]/30">
                        <span className="font-display italic text-sm">Prendre place au Cercle</span>
                        <span className="text-[#d4af37] group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                </button>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-stone-300 border-t border-white/10 pt-2.5">
                    <span>Votre Cote Officielle</span>
                    <span className="font-mono text-[#d4af37] font-bold">
                        {eloRating} Elo {averagePR !== null ? `· PR ${averagePR.toFixed(1)}` : ''}
                    </span>
                </div>
            </div>

            {/* Les 4 Personnages Officiels en Photos Haute-Couture */}
            <div className="rounded-2xl border border-[#d4af37]/25 bg-[#110e0b] p-3 shadow-xl flex flex-col gap-1.5">
                <div className="flex items-center justify-between border-b border-[#d4af37]/15 pb-1.5">
                    <span className="font-display text-sm font-bold italic text-[#f7f3e8]">
                        Les Adversaires du Salon
                    </span>
                    <button type="button" onClick={onOpenStats} className="text-xs font-bold text-[#d4af37] hover:underline">
                        Revue & PR
                    </button>
                </div>
                <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-2 font-semibold text-[#f7f3e8] truncate">
                            <BotPortraitMedallion character="grandmaster" size="sm" />
                            <span className="truncate">Viktor « L’Intellectuel »</span>
                        </span>
                        <span className="shrink-0 font-mono font-bold text-emerald-400">PR 0.6</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-2 font-semibold text-stone-200 truncate">
                            <BotPortraitMedallion character="expert" size="sm" />
                            <span className="truncate">L’Homme d’Affaires</span>
                        </span>
                        <span className="shrink-0 font-mono font-bold text-[#d4af37]">PR 2.5</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-2 font-semibold text-stone-200 truncate">
                            <BotPortraitMedallion character="intermediate" size="sm" />
                            <span className="truncate">Sofia « La Riviera »</span>
                        </span>
                        <span className="shrink-0 font-mono font-bold text-amber-300">PR 7.5</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.05] px-2.5 py-1.5">
                        <span className="flex items-center gap-2 font-semibold text-stone-200 truncate">
                            <BotPortraitMedallion character="beginner" size="sm" />
                            <span className="truncate">Le Mauvais Joueur</span>
                        </span>
                        <span className="shrink-0 font-mono font-bold text-rose-300">PR 12.5</span>
                    </div>
                </div>
                <Link
                    href="/academy#er-vs-erh-manifesto"
                    className="mt-1 flex items-center justify-between gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-950/35 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 hover:border-emerald-400/60 transition"
                >
                    <span className="truncate">🔬 Pourquoi ERH bat ER (19 413 Quiz)</span>
                    <span className="shrink-0 whitespace-nowrap font-mono text-emerald-300">+30,9 % →</span>
                </Link>
            </div>
        </aside>
    );
};
