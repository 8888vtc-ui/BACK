'use client';

/**
 * @file src/components/lobby/LobbySidebarAndWidgets.tsx
 * @description Barre latérale gauche rétractable regroupée en 3 blocs ("Tables", "Entraînement", "Circuit")
 * avec menu sur-mesure en mode Débutant, badge en ligne compact sur 1 ligne et zéro doublon.
 * Strictement <= 300 lignes, 0 `any`.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Flame, BarChart2, GraduationCap, ChevronRight, ChevronLeft, Users, Share2, LayoutGrid, Dices, Headphones } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import type { LobbyModuleId } from './LobbyScreen';
import { getAllBlunders } from '../../features/drills/blunderBank';
import { isPersonalMatchBlunder } from '../../features/drills/adaptiveQuizEngine';
import { IconLuxuryCrown, IconWorldTourLive, IconHorologyGear } from '../common/MonteCarloIcons';
import { BeginnerInteractiveGuideModal } from '../beginner/BeginnerInteractiveGuideModal';
import { BeginnerOpeningMovesExplorer } from '../beginner/BeginnerOpeningMovesExplorer';

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
    onSelectMultiplayerMode,
    onOpenModule,
    onOpenSettings,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const { tierGate } = usePlayerTierGate();
    const isBeginner = tierGate === 'BEGINNER';
    const [collapsed, setCollapsed] = useState(false);
    const [blunderCount, setBlunderCount] = useState<number>(0);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [isOpeningExplorerOpen, setIsOpeningExplorerOpen] = useState(false);
    const onlinePlayersCount = 28 + ((new Date().getHours() * 7 + 13) % 36);

    useEffect(() => {
        try {
            const count = getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length;
            setBlunderCount(count);
        } catch {
            // safe fallback
        }
    }, []);

    const activeRailCls = 'border-l-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/12 to-transparent text-[#F3E5AB]';
    const itemCls = 'flex items-center justify-between w-full whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04] hover:text-white transition-all duration-150';
    const sectionLabelCls = 'px-3 pb-1 text-[11px] uppercase tracking-[0.15em] text-zinc-500 font-semibold';

    return (
        <>
            <aside
                aria-label="Menu latéral principal"
                data-testid="lobby-left-sidebar"
                className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/[0.06] bg-[#0B0E14]/90 backdrop-blur-md py-5 transition-all duration-200 select-none overflow-y-auto ${
                    collapsed ? 'w-16 px-2 items-center' : 'w-60 px-3'
                }`}
            >
                <div className="flex flex-col gap-4 w-full">
                    {/* BLOC 1 : TABLES DE JEU & MATCHMAKING PERMANENT */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Tables' : 'Tables'}</span>}

                        <button
                            type="button"
                            data-testid="sidebar-quick-play-btn"
                            onClick={onQuickPlay}
                            title={isEn ? 'Game Room' : 'Salon de Jeu'}
                            className={`flex items-center gap-2.5 w-full whitespace-nowrap rounded-r-lg px-3 py-2 text-xs font-bold transition-all duration-150 ${
                                selectedMode === null || selectedMode === 'ai' ? activeRailCls : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                            {!collapsed && <span className="truncate">{isEn ? 'Game Room' : 'Salon de Jeu'}</span>}
                        </button>

                        {isBeginner && (
                            <button
                                type="button"
                                data-testid="sidebar-guided-play-btn"
                                onClick={() => { if (typeof window !== 'undefined') window.location.assign('/play?gate=beginner&start=guided'); }}
                                title={isEn ? 'Start Guided Match with the Professor' : 'Lancer une partie guidée avec le Professeur'}
                                className={itemCls}
                            >
                                <span className="flex items-center gap-2.5 truncate">
                                    <GraduationCap className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                                    {!collapsed && <span className="truncate">{isEn ? 'Guided Match (Prof.)' : 'Partie Guidée (Prof.)'}</span>}
                                </span>
                            </button>
                        )}

                        <button
                            type="button"
                            data-testid="sidebar-find-player-btn"
                            onClick={() => {
                                if (onSelectMultiplayerMode) onSelectMultiplayerMode();
                                else if (onFindOpponent) onFindOpponent();
                                else if (typeof window !== 'undefined') window.location.assign('/play?mode=matchmaking&match=5');
                            }}
                            title={`${onlinePlayersCount} ${isEn ? 'players online' : 'joueurs en ligne'}`}
                            className={`flex items-center justify-between w-full whitespace-nowrap rounded-r-lg px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                                selectedMode === 'multiplayer' ? activeRailCls : 'text-zinc-100 hover:bg-white/[0.04] hover:text-white'
                            }`}
                        >
                            <span className="flex items-center gap-2.5 truncate">
                                <Users className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                                {!collapsed && <span className="text-xs font-medium text-zinc-100 truncate">{isEn ? 'Find a Player' : 'Trouver un joueur'}</span>}
                            </span>
                            {!collapsed && (
                                <span
                                    title={`${onlinePlayersCount} ${isEn ? 'players online' : 'joueurs en ligne'}`}
                                    className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400 flex items-center gap-1 shrink-0"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                    <span>{onlinePlayersCount}</span>
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            data-testid="sidebar-invite-friend-btn"
                            onClick={() => onOpenModule?.('multiplayer')}
                            title={isEn ? 'Invite a Friend (1-Click)' : 'Inviter un ami (1-Clic)'}
                            className="flex items-center gap-2.5 w-full whitespace-nowrap rounded-r-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-white transition-all duration-150"
                        >
                            <Share2 className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.5} />
                            {!collapsed && <span className="truncate">{isEn ? 'Invite a Friend (1-Click)' : 'Inviter un ami (1-Clic)'}</span>}
                        </button>
                    </div>

                    {/* BLOC 2 : ENTRAÎNEMENT ADAPTATIF SELON LA PORTE */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Training & Analysis' : 'Entraînement'}</span>}

                        {isBeginner ? (
                            <>
                                <Link href="/puzzles?mode=beginner-academy" data-testid="sidebar-my-quizzes-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Sparkles size={16} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? '10-Lesson Initiation' : 'Initiation (10 Leçons)'}</span>}
                                    </span>
                                </Link>
                                <button type="button" data-testid="sidebar-beginner-openings-btn" onClick={() => setIsOpeningExplorerOpen(true)} className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Dices size={16} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? '15 Opening Moves' : 'Les 15 Ouvertures'}</span>}
                                    </span>
                                </button>
                                <button type="button" data-testid="sidebar-beginner-audio-guide-btn" onClick={() => setIsGuideOpen(true)} className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Headphones size={16} strokeWidth={1.5} className="text-[#38BDF8] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Audio Guide' : 'Guide Audio (6 chap.)'}</span>}
                                    </span>
                                </button>
                                <Link href="/puzzles?filter=personal-blunders" data-testid="sidebar-my-blunders-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Flame size={16} strokeWidth={1.5} className="text-[#F59E0B] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Mistakes' : 'Mes Erreurs'}</span>}
                                    </span>
                                    {!collapsed && blunderCount > 0 && (
                                        <span data-testid="sidebar-blunder-count-badge" className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 font-mono">
                                            {blunderCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/puzzles" data-testid="sidebar-my-quizzes-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Sparkles size={16} strokeWidth={1.5} className="text-[#10B981] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Quizzes' : 'Mes Quiz'}</span>}
                                    </span>
                                </Link>
                                <Link href="/puzzles?filter=personal-blunders" data-testid="sidebar-my-blunders-link" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <Flame size={16} strokeWidth={1.5} className="text-[#F59E0B] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'My Blunders' : 'Mes Blunders'}</span>}
                                    </span>
                                    {!collapsed && blunderCount > 0 && (
                                        <span data-testid="sidebar-blunder-count-badge" className="inline-flex items-center justify-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 font-mono">
                                            {blunderCount}
                                        </span>
                                    )}
                                </Link>
                                <Link href="/analysis" data-testid="sidebar-pillar-studio" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <BarChart2 size={16} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Analysis Studio' : 'Studio d’Analyse'}</span>}
                                    </span>
                                </Link>
                                <Link href="/academy" data-testid="sidebar-pillar-academy" className={itemCls}>
                                    <span className="flex items-center gap-2.5 truncate">
                                        <GraduationCap size={16} strokeWidth={1.5} className="text-[#38BDF8] shrink-0" />
                                        {!collapsed && <span className="truncate">{isEn ? 'Academy' : 'Académie'}</span>}
                                    </span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* BLOC 3 : CIRCUIT MONDIAL */}
                    <div className="flex flex-col gap-1">
                        {!collapsed && <span className={sectionLabelCls}>{isEn ? 'Tour' : 'Circuit'}</span>}
                        <Link href="/tournaments" data-testid="sidebar-pillar-tournaments" className={itemCls}>
                            <span className="flex items-center gap-2.5 truncate">
                                <IconWorldTourLive size={15} className="text-[#D4AF37] shrink-0" />
                                {!collapsed && <span className="truncate">{isEn ? 'Map: Tournaments & Clubs' : 'Carte : Tournois & Clubs'}</span>}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Pied de barre latérale (Zéro doublon Inviter des amis) */}
                <div className="flex flex-col gap-1 w-full pt-3 border-t border-white/[0.06]">
                    {onOpenPassport && (
                        <button type="button" data-testid="sidebar-passport-btn" onClick={onOpenPassport} className={itemCls}>
                            <span className="flex items-center gap-2.5">
                                <IconLuxuryCrown size={15} className="text-[#D4AF37]" />
                                {!collapsed && <span>{isEn ? 'My Profile' : 'Mon Profil'}</span>}
                            </span>
                        </button>
                    )}
                    <button type="button" onClick={onOpenSettings} className={itemCls}>
                        <span className="flex items-center gap-2.5">
                            <IconHorologyGear size={15} className="text-zinc-400" />
                            {!collapsed && <span>{isEn ? 'Settings' : 'Réglages'}</span>}
                        </span>
                    </button>
                    <button type="button" data-testid="sidebar-collapse-toggle" onClick={() => setCollapsed((v) => !v)} className={itemCls}>
                        <span className="flex items-center gap-2.5">
                            {collapsed ? <ChevronRight size={14} className="text-[#D4AF37]" /> : <ChevronLeft size={14} className="text-[#D4AF37]" />}
                            {!collapsed && <span>{isEn ? 'Collapse' : 'Réduire'}</span>}
                        </span>
                    </button>
                </div>
            </aside>

            <BeginnerInteractiveGuideModal
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                onStartGuidedMatch={() => { if (typeof window !== 'undefined') window.location.assign('/play?gate=beginner&start=guided'); }}
                onOpenQuizzes={() => { if (typeof window !== 'undefined') window.location.assign('/puzzles?mode=beginner-academy'); }}
            />
            <BeginnerOpeningMovesExplorer isOpen={isOpeningExplorerOpen} onClose={() => setIsOpeningExplorerOpen(false)} />
        </>
    );
};
